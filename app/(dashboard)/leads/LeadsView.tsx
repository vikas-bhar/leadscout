"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  MapPin,
  Star,
  Globe,
  AtSign,
  Phone,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Camera,
  ExternalLink,
  Sparkles,
  Tag as TagIcon,
  Plus,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Filter,
} from "lucide-react";
import {
  type Gap,
  type Lead,
  type PitchBundle,
  type UrgencyLevel,
  PRESET_LEAD_TAGS,
  getTagStyle,
} from "@/types";
import { OpportunityScore } from "@/components/ui/OpportunityScore";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocalLeads, updateLocalLead } from "@/lib/local-store";
import { toast } from "sonner";

interface LeadsViewProps {
  initialLeads: Lead[];
}

export function LeadsView({ initialLeads }: LeadsViewProps) {
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [filterTier, setFilterTier] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [filterGap, setFilterGap] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score_desc" | "score_asc" | "location_asc" | "industry_asc" | "rating_asc" | "reviews_asc" | "name_asc">("score_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagPickerId, setActiveTagPickerId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const tagPickerRef = useRef<HTMLDivElement>(null);

  // Advanced Filters State: Opportunity Score, Location, and Industry Type
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);

  useEffect(() => {
    const local = getLocalLeads();
    const combinedMap = new Map<string, Lead>();

    // 1. Add local leads first (they contain latest searches saved in the browser)
    if (Array.isArray(local)) {
      local.forEach((l) => {
        if (l && l.id) combinedMap.set(l.id, l);
      });
    }

    // 2. Add initialLeads (server records)
    if (Array.isArray(initialLeads)) {
      initialLeads.forEach((l) => {
        if (l && l.id && !combinedMap.has(l.id)) {
          combinedMap.set(l.id, l);
        }
      });
    }

    const combined = Array.from(combinedMap.values());
    if (combined.length > 0) {
      setLeadsList(combined);
    } else if (initialLeads.length > 0) {
      setLeadsList(initialLeads);
    }
  }, [initialLeads]);

  // Click outside to close tag picker
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setActiveTagPickerId(null);
      }
    }
    if (activeTagPickerId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeTagPickerId]);

  // Normalize leads (handling potential snake_case from DB)
  const normalizedLeads: Lead[] = useMemo(() => {
    return leadsList.map((itemRaw, index) => {
      const item = itemRaw as unknown as Record<string, unknown>;
      const oppScore = Number(item.opportunityScore ?? item.opportunity_score ?? 70);

      const rawId = (item.id ?? item._id) as string;
      const cleanBizName = (item.businessName ?? item.business_name ?? `Lead #${index + 1}`) as string;
      const cleanLoc = (item.location ?? "") as string;

      const safeId =
        rawId && rawId !== "undefined" && rawId !== "null"
          ? String(rawId)
          : `lead_${cleanBizName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${index + 1}`;

      // Extract or generate default tags
      let tags: string[] = [];
      if (Array.isArray(item.tags)) {
        tags = item.tags as string[];
      } else if (typeof item.tags === "string" && item.tags.trim()) {
        try {
          tags = JSON.parse(item.tags as string);
        } catch {
          tags = (item.tags as string).split(",").map((s) => s.trim()).filter(Boolean);
        }
      } else {
        // Default smart tag based on score
        tags = oppScore >= 80 ? ["Hot"] : oppScore >= 68 ? ["Warm"] : ["Cold"];
      }

      const rawMaps = (item.mapsUrl ?? item.maps_url ?? null) as string | null;
      const validMapsUrl =
        rawMaps && !rawMaps.includes("Unnamed%20Business")
          ? rawMaps
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanBizName}, ${cleanLoc}`)}`;

      return {
        id: safeId,
        searchId: (item.searchId ?? item.search_id ?? "search-default") as string,
        userId: (item.userId ?? item.user_id ?? "user-default") as string,
        rank: Number(item.rank ?? index + 1),
        businessName: cleanBizName,
        businessCategory: (item.businessCategory ?? item.business_category ?? "Local Business") as string,
        location: cleanLoc,
        googleRating: Number(item.googleRating ?? item.google_rating ?? 4.5),
        reviewCount: Number(item.reviewCount ?? item.review_count ?? 0),
        hasWebsite: Boolean(item.hasWebsite ?? item.has_website ?? false),
        websiteUrl: (item.websiteUrl ?? item.website_url ?? null) as string | null,
        phone: (item.phone ?? null) as string | null,
        photoCount: Number(item.photoCount ?? item.photo_count ?? 0),
        mapsUrl: validMapsUrl,
        instagramHandle: (item.instagramHandle ?? item.instagram_handle ?? null) as string | null,
        instagramFollowers: (item.instagramFollowers ?? item.instagram_followers ?? null) as number | null,
        instagramFollowing: (item.instagramFollowing ?? item.instagram_following ?? null) as number | null,
        instagramPosts: (item.instagramPosts ?? item.instagram_posts ?? null) as number | null,
        lastPostDate: (item.lastPostDate ?? item.last_post_date ?? null) as string | null,
        engagementRate: (item.engagementRate ?? item.engagement_rate ?? null) as number | null,
        hasLinkInBio: Boolean(item.hasLinkInBio ?? item.has_link_in_bio ?? false),
        usesReels: Boolean(item.usesReels ?? item.uses_reels ?? false),
        opportunityScore: oppScore,
        urgencyLevel: (item.urgencyLevel ?? item.urgency_level ?? "medium") as UrgencyLevel,
        gapsFound: (item.gapsFound ?? item.gaps_found ?? []) as Gap[],
        bestService: (item.bestService ?? item.best_service ?? "Digital presence overhaul") as string,
        secondaryServices: (item.secondaryServices ?? item.secondary_services ?? []) as string[],
        buyingSignals: (item.buyingSignals ?? item.buying_signals ?? []) as string[],
        pitches: ((item.pitches as PitchBundle | undefined) ?? {
          pitches: [],
          followUpMessage: "Following up on my note last week!",
          pitchTips: [],
        }),
        estimatedBudget: (item.estimatedBudget ?? item.estimated_budget ?? null) as string | null,
        status: (item.status ?? "new") as "new" | "viewed" | "contacted" | "won" | "lost",
        notes: (item.notes ?? null) as string | null,
        tags,
        contactedAt: (item.contactedAt ?? item.contacted_at ?? null) as string | null,
        createdAt: (item.createdAt ?? item.created_at ?? new Date().toISOString()) as string,
      } as Lead;
    });
  }, [leadsList]);

  // Toggle or add/remove a tag on a lead
  async function handleToggleTag(leadId: string, tagToToggle: string) {
    const currentLead = normalizedLeads.find((l) => l.id === leadId);
    if (!currentLead) return;

    const currentTags = currentLead.tags || [];
    let updatedTags: string[];

    if (currentTags.includes(tagToToggle)) {
      updatedTags = currentTags.filter((t) => t !== tagToToggle);
    } else {
      updatedTags = [...currentTags, tagToToggle];
    }

    // 1. Optimistic local state update
    setLeadsList((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, tags: updatedTags } : l))
    );

    // 2. Sync to local storage
    updateLocalLead(leadId, { tags: updatedTags });

    // 3. Sync to Supabase via PATCH
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    } catch {
      // Handled via local storage
    }

    toast.success(`Updated tags for ${currentLead.businessName}`);
  }

  function handleAddCustomTag(leadId: string) {
    if (!customTagInput.trim()) return;
    const formatted = customTagInput.trim();
    handleToggleTag(leadId, formatted);
    setCustomTagInput("");
  }

  // Unified single source of truth for Lead Opportunity Tier
  function getLeadTier(lead: Lead): "high" | "medium" | "low" {
    if (lead.opportunityScore >= 75) {
      return "high";
    }
    if (lead.opportunityScore >= 60) {
      return "medium";
    }
    return "low";
  }

  // Summary counts strictly partitioned so totals always match
  const highCount = useMemo(() => {
    return normalizedLeads.filter((l) => getLeadTier(l) === "high").length;
  }, [normalizedLeads]);

  const mediumCount = useMemo(() => {
    return normalizedLeads.filter((l) => getLeadTier(l) === "medium").length;
  }, [normalizedLeads]);

  const lowCount = useMemo(() => {
    return normalizedLeads.filter((l) => getLeadTier(l) === "low").length;
  }, [normalizedLeads]);

  // Compute all available tags and counts with lowercase indexing
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    normalizedLeads.forEach((l) => {
      (l.tags || []).forEach((t) => {
        const clean = t.trim();
        if (clean) {
          const lowerKey = clean.toLowerCase();
          counts[lowerKey] = (counts[lowerKey] || 0) + 1;
        }
      });
    });
    return counts;
  }, [normalizedLeads]);

  // Custom tags extracted from discovered leads
  const customTags = useMemo(() => {
    const presetKeys = new Set(PRESET_LEAD_TAGS.map((p) => p.id.toLowerCase()));
    const map = new Map<string, { label: string; count: number }>();
    normalizedLeads.forEach((l) => {
      (l.tags || []).forEach((t) => {
        const clean = t.trim();
        const lower = clean.toLowerCase();
        if (clean && !presetKeys.has(lower)) {
          if (!map.has(lower)) {
            map.set(lower, { label: clean, count: 1 });
          } else {
            const current = map.get(lower)!;
            map.set(lower, { label: current.label, count: current.count + 1 });
          }
        }
      });
    });
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      label: data.label,
      count: data.count,
    }));
  }, [normalizedLeads]);

  // Derived available locations with lead counts and average opportunity score
  const availableLocations = useMemo(() => {
    const map = new Map<string, { count: number; totalScore: number }>();
    normalizedLeads.forEach((l) => {
      const loc = (l.location || "").trim();
      if (!loc) return;
      // Extract city or district if comma-separated, or use the location string
      const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
      // Main locality identifier (e.g., "Austin, TX", "Dubai", "London", or district)
      const primaryLoc = parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : loc;
      
      const entry = map.get(primaryLoc) || map.get(loc) || { count: 0, totalScore: 0 };
      entry.count += 1;
      entry.totalScore += l.opportunityScore;
      map.set(primaryLoc, entry);
    });

    return Array.from(map.entries())
      .map(([location, data]) => ({
        location,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));
  }, [normalizedLeads]);

  // Derived available industries / categories with lead counts and average opportunity score
  const availableIndustries = useMemo(() => {
    const map = new Map<string, { count: number; totalScore: number }>();
    normalizedLeads.forEach((l) => {
      const cat = (l.businessCategory || "").trim();
      if (!cat) return;
      const entry = map.get(cat) || { count: 0, totalScore: 0 };
      entry.count += 1;
      entry.totalScore += l.opportunityScore;
      map.set(cat, entry);
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  }, [normalizedLeads]);

  // Filtered leads with Opportunity Score, Location, and Industry Type filters
  const filteredLeads = useMemo(() => {
    return normalizedLeads
      .filter((l) => {
        // 1. Tier filter
        if (filterTier !== "all") {
          if (getLeadTier(l) !== filterTier) return false;
        }
        return true;
      })
      .filter((l) => {
        // 2. Opportunity Score range filter
        if (l.opportunityScore < minScore || l.opportunityScore > maxScore) {
          return false;
        }
        return true;
      })
      .filter((l) => {
        // 3. Location filter
        if (selectedLocation === "all") return true;
        const target = selectedLocation.toLowerCase().trim();
        const leadLoc = (l.location || "").toLowerCase().trim();
        return leadLoc.includes(target);
      })
      .filter((l) => {
        // 4. Industry Type filter
        if (selectedIndustry === "all") return true;
        const target = selectedIndustry.toLowerCase().trim();
        const leadCat = (l.businessCategory || "").toLowerCase().trim();
        return leadCat === target || leadCat.includes(target);
      })
      .filter((l) => {
        // 5. Tag filter
        if (selectedTag === "all") return true;
        const target = selectedTag.trim().toLowerCase();
        return (l.tags || []).some(
          (t) => t.trim().toLowerCase() === target
        );
      })
      .filter((l) => {
        // 6. Digital Gap filter
        if (filterGap === "all") return true;
        if (filterGap === "missing_website") {
          return (
            !l.hasWebsite ||
            !l.websiteUrl ||
            (l.gapsFound || []).some((g) =>
              /website|no web|online presence/i.test(g.category + " " + g.problem)
            )
          );
        }
        if (filterGap === "mobile_ux") {
          return (l.gapsFound || []).some((g) =>
            /mobile|speed|responsive|booking|screen|layout/i.test(
              g.category + " " + g.problem
            )
          );
        }
        if (filterGap === "no_reels") {
          return (
            !l.usesReels ||
            (l.gapsFound || []).some((g) =>
              /reel|video|tiktok|short-form/i.test(g.category + " " + g.problem)
            )
          );
        }
        if (filterGap === "missing_instagram") {
          return !l.instagramHandle;
        }
        if (filterGap === "missing_phone") {
          return !l.phone;
        }
        if (filterGap === "low_rating") {
          return l.googleRating < 4.5;
        }
        return true;
      })
      .filter((l) => {
        // 7. Text Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const cleanQueryDigits = q.replace(/[^0-9]/g, "");
        const cleanLeadPhone = (l.phone || "").replace(/[^0-9]/g, "");

        const matchesName = l.businessName.toLowerCase().includes(q);
        const matchesLocation = l.location.toLowerCase().includes(q);
        const matchesCategory = l.businessCategory.toLowerCase().includes(q);
        const matchesWebsite = (l.websiteUrl || "").toLowerCase().includes(q);
        const matchesInstagram = (l.instagramHandle || "").toLowerCase().includes(q);
        const matchesPhone =
          (l.phone || "").toLowerCase().includes(q) ||
          (cleanQueryDigits.length >= 3 && cleanLeadPhone.includes(cleanQueryDigits));
        const matchesTag = (l.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesGap = (l.gapsFound || []).some(
          (g) =>
            g.category.toLowerCase().includes(q) ||
            g.problem.toLowerCase().includes(q) ||
            (g.yourSolution || "").toLowerCase().includes(q)
        );
        const matchesService = (l.bestService || "").toLowerCase().includes(q);

        return (
          matchesName ||
          matchesLocation ||
          matchesCategory ||
          matchesWebsite ||
          matchesInstagram ||
          matchesPhone ||
          matchesTag ||
          matchesGap ||
          matchesService
        );
      })
      .sort((a, b) => {
        if (sortBy === "score_asc") return a.opportunityScore - b.opportunityScore;
        if (sortBy === "location_asc") return a.location.localeCompare(b.location);
        if (sortBy === "industry_asc") return a.businessCategory.localeCompare(b.businessCategory);
        if (sortBy === "rating_asc") return a.googleRating - b.googleRating;
        if (sortBy === "reviews_asc") return a.reviewCount - b.reviewCount;
        if (sortBy === "name_asc") return a.businessName.localeCompare(b.businessName);
        return b.opportunityScore - a.opportunityScore;
      });
  }, [
    normalizedLeads,
    filterTier,
    minScore,
    maxScore,
    selectedLocation,
    selectedIndustry,
    selectedTag,
    filterGap,
    searchQuery,
    sortBy,
  ]);

  // Average opportunity score of the current filtered subset
  const filteredAvgScore = useMemo(() => {
    if (filteredLeads.length === 0) return 0;
    const total = filteredLeads.reduce((acc, l) => acc + l.opportunityScore, 0);
    return Math.round(total / filteredLeads.length);
  }, [filteredLeads]);

  // Count of active advanced filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (minScore > 0 || maxScore < 100) count++;
    if (selectedLocation !== "all") count++;
    if (selectedIndustry !== "all") count++;
    return count;
  }, [minScore, maxScore, selectedLocation, selectedIndustry]);

  const hasActiveFilters =
    filterTier !== "all" ||
    selectedTag !== "all" ||
    filterGap !== "all" ||
    minScore > 0 ||
    maxScore < 100 ||
    selectedLocation !== "all" ||
    selectedIndustry !== "all" ||
    Boolean(searchQuery.trim());

  function resetAllFilters() {
    setFilterTier("all");
    setSelectedTag("all");
    setFilterGap("all");
    setMinScore(0);
    setMaxScore(100);
    setSelectedLocation("all");
    setSelectedIndustry("all");
    setSortBy("score_desc");
    setSearchQuery("");
  }

  function handleScorePreset(preset: "all" | "elite" | "high" | "moderate" | "low") {
    if (preset === "all") {
      setMinScore(0);
      setMaxScore(100);
    } else if (preset === "elite") {
      setMinScore(85);
      setMaxScore(100);
    } else if (preset === "high") {
      setMinScore(75);
      setMaxScore(100);
    } else if (preset === "moderate") {
      setMinScore(60);
      setMaxScore(74);
    } else if (preset === "low") {
      setMinScore(0);
      setMaxScore(59);
    }
  }

  if (normalizedLeads.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-neutral-900">No leads discovered yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Run your first search on Google Maps and Instagram to uncover businesses with digital gaps and high-converting pitch angles.
          </p>
        </div>
        <div>
          <Link href="/search">
            <Button className="font-medium gap-2">
              <Search className="h-4 w-4" />
              Start Your First Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Discovered Leads</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Categorize leads with tags (Hot, Warm, Cold, Follow-up) and prioritize high-opportunity outreach.
          </p>
        </div>
        <Link href="/search">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </Link>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterTier("all")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200 select-none",
            filterTier === "all" ? "ring-2 ring-primary border-primary shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Leads</span>
            <Building2 className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{normalizedLeads.length}</div>
          <div className="mt-1 text-[11px] text-neutral-500">All discovered prospects</div>
        </div>

        <div
          onClick={() => setFilterTier(filterTier === "high" ? "all" : "high")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200 select-none",
            filterTier === "high" ? "ring-2 ring-rose-500 border-rose-500 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">High Opportunity</span>
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{highCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Critical / Score 75+</div>
        </div>

        <div
          onClick={() => setFilterTier(filterTier === "medium" ? "all" : "medium")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200 select-none",
            filterTier === "medium" ? "ring-2 ring-amber-500 border-amber-500 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Medium Opportunity</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{mediumCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Score 65–74</div>
        </div>

        <div
          onClick={() => setFilterTier(filterTier === "low" ? "all" : "low")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200 select-none",
            filterTier === "low" ? "ring-2 ring-neutral-400 border-neutral-400 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Low Gap</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{lowCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Score &lt; 65</div>
        </div>
      </div>

      {/* Tag Filter Chips Bar */}
      <div className="flex flex-col gap-2 bg-neutral-50/70 p-3 rounded-xl border border-neutral-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
            <TagIcon className="h-3.5 w-3.5 text-primary" />
            <span>Filter by Lead Tag:</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all",
              selectedTag === "all"
                ? "bg-neutral-900 text-white shadow-sm font-semibold"
                : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
            )}
          >
            All Leads
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                selectedTag === "all" ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-600"
              )}
            >
              {normalizedLeads.length}
            </span>
          </button>

          {PRESET_LEAD_TAGS.map((preset) => {
            const count = tagCounts[preset.id.toLowerCase()] || 0;
            const isSelected = selectedTag.toLowerCase() === preset.id.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTag(isSelected ? "all" : preset.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                  isSelected
                    ? `${preset.bgColor} ${preset.color} ${preset.borderColor} ring-2 ring-offset-1 ring-primary/40 font-semibold shadow-sm`
                    : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", preset.dotColor)} />
                {preset.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px]",
                      isSelected ? "bg-white/80 text-neutral-900 font-bold" : "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Any custom tags present in discovered leads */}
          {customTags.map(({ key, label, count }) => {
            const isSelected = selectedTag.toLowerCase() === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTag(isSelected ? "all" : label)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all border",
                  isSelected
                    ? "bg-primary/10 text-primary border-primary ring-2 ring-offset-1 ring-primary/40 font-semibold shadow-sm"
                    : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                )}
              >
                <TagIcon className="h-2.5 w-2.5 text-neutral-400" />
                {label}
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px]",
                    isSelected ? "bg-white text-neutral-900 font-bold" : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-3xl">
            {/* Text Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by business name, city, phone, category, tag, or gap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Advanced Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={cn(
                "h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-all select-none shrink-0",
                showAdvancedFilters
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                  : activeAdvancedFilterCount > 0
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeAdvancedFilterCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                    showAdvancedFilters ? "bg-white text-neutral-900" : "bg-primary text-white"
                  )}
                >
                  {activeAdvancedFilterCount}
                </span>
              )}
              {showAdvancedFilters ? (
                <ChevronUp className="h-3.5 w-3.5 opacity-70" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              )}
            </button>

            {/* Digital Gap Filter */}
            <select
              value={filterGap}
              onChange={(e) => setFilterGap(e.target.value)}
              className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
            >
              <option value="all">All Digital Gaps</option>
              <option value="missing_website">Missing Website</option>
              <option value="mobile_ux">Mobile UX / Outdated</option>
              <option value="no_reels">No Reels / Video</option>
              <option value="missing_instagram">No Instagram Handle</option>
              <option value="missing_phone">No Phone Listed</option>
              <option value="low_rating">Suboptimal Rating (&lt; 4.5★)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
            >
              <option value="score_desc">Score: High to Low</option>
              <option value="score_asc">Score: Low to High</option>
              <option value="location_asc">Location: A to Z</option>
              <option value="industry_asc">Industry: A to Z</option>
              <option value="rating_asc">Rating: Lowest First</option>
              <option value="reviews_asc">Reviews: Fewest First</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto text-xs text-neutral-500">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 transition-colors mr-1"
              >
                <RotateCcw className="h-3 w-3" />
                Clear All
              </button>
            )}
            <span className="text-xs text-neutral-500">
              Showing <strong>{filteredLeads.length}</strong> of {normalizedLeads.length} leads
            </span>
          </div>
        </div>

        {/* Expanded Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/60 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/70 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Filter className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Advanced Filters: Prioritize High-Potential Deals
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span>
                  Matches: <strong className="text-neutral-900">{filteredLeads.length}</strong>
                </span>
                <span className="text-neutral-300">•</span>
                <span>
                  Avg Opp Score:{" "}
                  <strong
                    className={cn(
                      filteredAvgScore >= 75
                        ? "text-rose-600"
                        : filteredAvgScore >= 60
                        ? "text-amber-600"
                        : "text-neutral-800"
                    )}
                  >
                    {filteredAvgScore}/100
                  </strong>
                </span>
                {activeAdvancedFilterCount > 0 && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMinScore(0);
                        setMaxScore(100);
                        setSelectedLocation("all");
                        setSelectedIndustry("all");
                      }}
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      Reset Advanced
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3 Advanced Filter Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filter 1: Opportunity Score */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                    <span>Opportunity Score</span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold border",
                      minScore >= 80
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : minScore >= 65
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-neutral-100 text-neutral-700 border-neutral-200"
                    )}
                  >
                    {minScore === 0 && maxScore === 100
                      ? "All Scores (0–100)"
                      : minScore > 0 && maxScore === 100
                      ? `Score ≥ ${minScore}`
                      : `${minScore} – ${maxScore}`}
                  </span>
                </div>

                {/* Score Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleScorePreset("all")}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                      minScore === 0 && maxScore === 100
                        ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScorePreset("elite")}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                      minScore === 85 && maxScore === 100
                        ? "bg-rose-600 text-white border-rose-600 font-semibold shadow-xs"
                        : "bg-rose-50/70 text-rose-700 hover:bg-rose-100/70 border-rose-200"
                    )}
                  >
                    85+ Elite
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScorePreset("high")}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                      minScore === 75 && maxScore === 100
                        ? "bg-rose-500 text-white border-rose-500 font-semibold shadow-xs"
                        : "bg-rose-50/50 text-rose-700 hover:bg-rose-100/50 border-rose-200"
                    )}
                  >
                    75+ High
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScorePreset("moderate")}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                      minScore === 60 && maxScore === 74
                        ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-xs"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                    )}
                  >
                    60–74 Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScorePreset("low")}
                    className={cn(
                      "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                      minScore === 0 && maxScore === 59
                        ? "bg-neutral-700 text-white border-neutral-700 font-semibold shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200"
                    )}
                  >
                    &lt; 60 Low
                  </button>
                </div>

                {/* Score Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                    <span>Min Score: {minScore}</span>
                    <span>Max: {maxScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minScore}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinScore(val);
                      if (val > maxScore) setMaxScore(100);
                    }}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-400">
                    <span>0</span>
                    <span className="text-amber-600 font-semibold">60 (Medium)</span>
                    <span className="text-rose-600 font-semibold">75 (High)</span>
                    <span className="text-rose-700 font-semibold">85 (Elite)</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              {/* Filter 2: Location */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>Location / Territory</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {availableLocations.length} areas
                  </span>
                </div>

                {/* Location Select Dropdown */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="all">All Locations ({normalizedLeads.length} leads)</option>
                  {availableLocations.map((loc) => (
                    <option key={loc.location} value={loc.location}>
                      {loc.location} ({loc.count} leads • avg score {loc.avgScore})
                    </option>
                  ))}
                </select>

                {/* Top Location Quick Chips */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                    Top Territories:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedLocation("all")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                        selectedLocation === "all"
                          ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                      )}
                    >
                      All
                    </button>
                    {availableLocations.slice(0, 4).map((loc) => {
                      const isSelected = selectedLocation.toLowerCase() === loc.location.toLowerCase();
                      return (
                        <button
                          key={loc.location}
                          type="button"
                          onClick={() => setSelectedLocation(isSelected ? "all" : loc.location)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border truncate max-w-[140px]",
                            isSelected
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400 font-semibold"
                              : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                          )}
                          title={`${loc.location} (${loc.count} leads)`}
                        >
                          {loc.location.split(",")[0]}
                          <span className="ml-1 text-[10px] text-neutral-400 font-normal">
                            ({loc.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter 3: Industry Type */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Industry Type / Niche</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {availableIndustries.length} industries
                  </span>
                </div>

                {/* Industry Select Dropdown */}
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">All Industries ({normalizedLeads.length} leads)</option>
                  {availableIndustries.map((ind) => (
                    <option key={ind.category} value={ind.category}>
                      {ind.category} ({ind.count} leads • avg score {ind.avgScore})
                    </option>
                  ))}
                </select>

                {/* Top Industry Quick Chips */}
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                    Top Niches:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedIndustry("all")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                        selectedIndustry === "all"
                          ? "bg-blue-600 text-white border-blue-600 font-semibold"
                          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                      )}
                    >
                      All
                    </button>
                    {availableIndustries.slice(0, 4).map((ind) => {
                      const isSelected = selectedIndustry.toLowerCase() === ind.category.toLowerCase();
                      return (
                        <button
                          key={ind.category}
                          type="button"
                          onClick={() => setSelectedIndustry(isSelected ? "all" : ind.category)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border truncate max-w-[140px]",
                            isSelected
                              ? "bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400 font-semibold"
                              : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                          )}
                          title={`${ind.category} (${ind.count} leads)`}
                        >
                          {ind.category}
                          <span className="ml-1 text-[10px] text-neutral-400 font-normal">
                            ({ind.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Badges Strip */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-600 pt-1">
          {minScore > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200 animate-in fade-in-50">
              <TrendingUp className="h-3 w-3 text-rose-600" />
              Score ≥ {minScore}
              <button
                type="button"
                onClick={() => setMinScore(0)}
                className="hover:text-rose-950 ml-0.5"
                title="Remove score filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {maxScore < 100 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200 animate-in fade-in-50">
              Score ≤ {maxScore}
              <button
                type="button"
                onClick={() => setMaxScore(100)}
                className="hover:text-neutral-950 ml-0.5"
                title="Remove max score filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedLocation !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 animate-in fade-in-50">
              <MapPin className="h-3 w-3 text-emerald-600" />
              Location: {selectedLocation}
              <button
                type="button"
                onClick={() => setSelectedLocation("all")}
                className="hover:text-emerald-950 ml-0.5"
                title="Clear location filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedIndustry !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200 animate-in fade-in-50">
              <Building2 className="h-3 w-3 text-blue-600" />
              Industry: {selectedIndustry}
              <button
                type="button"
                onClick={() => setSelectedIndustry("all")}
                className="hover:text-blue-950 ml-0.5"
                title="Clear industry filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filterTier !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200">
              Tier: {filterTier}
              <button
                type="button"
                onClick={() => setFilterTier("all")}
                className="hover:text-red-600 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedTag !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
              Tag: {selectedTag}
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className="hover:text-primary ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filterGap !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
              Gap: {filterGap.replace("_", " ")}
              <button
                type="button"
                onClick={() => setFilterGap("all")}
                className="hover:text-amber-950 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200">
              Keyword: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="hover:text-red-600 ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-primary hover:underline font-semibold ml-1 inline-flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Leads List or Empty Filter State */}
      {filteredLeads.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-3">
          <div className="h-10 w-10 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">No leads match your filter criteria</p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {minScore > 0 || selectedLocation !== "all" || selectedIndustry !== "all"
              ? `No leads found with ${minScore > 0 ? `Score ≥ ${minScore}` : ""}${selectedLocation !== "all" ? ` in ${selectedLocation}` : ""}${selectedIndustry !== "all" ? ` under ${selectedIndustry}` : ""}. Try lowering the minimum score or clearing territory/niche filters.`
              : "Try adjusting your search query, switching tags, or clearing the opportunity tier filter."}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={resetAllFilters} className="text-xs font-semibold gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const mainGap = lead.gapsFound && lead.gapsFound.length > 0 ? lead.gapsFound[0] : null;
            const leadTags = lead.tags || [];
            const isPickerOpen = activeTagPickerId === lead.id;

          return (
            <div
              key={lead.id}
              className="relative group bg-white border border-neutral-200/80 hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-xl p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left Column: Score Ring + Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Opportunity Score Ring */}
                  <div className="shrink-0 flex flex-col items-center">
                    <OpportunityScore score={lead.opportunityScore} size={68} strokeWidth={6} />
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                      Score
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Header: Business Name & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-base font-semibold text-neutral-900 hover:text-primary transition-colors truncate"
                      >
                        {lead.businessName}
                      </Link>
                      <UrgencyBadge level={lead.urgencyLevel} />
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-700">
                        {lead.businessCategory}
                      </span>
                      {lead.status === "contacted" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Contacted
                        </span>
                      )}
                    </div>

                    {/* Tag Management Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400 font-medium mr-0.5 flex items-center gap-1">
                        <TagIcon className="h-3 w-3 text-neutral-400" />
                        Tags:
                      </span>

                      {leadTags.map((tag) => {
                        const style = getTagStyle(tag);
                        return (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
                              style.bgColor,
                              style.color,
                              style.borderColor
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", style.dotColor)} />
                            {tag}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTag(lead.id, tag);
                              }}
                              className="hover:opacity-75 p-0.5 ml-0.5 rounded"
                              title={`Remove ${tag} tag`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}

                      {/* Add Tag Dropdown Button */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTagPickerId(isPickerOpen ? null : lead.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 text-[11px] font-medium transition-colors border border-neutral-200"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Tag</span>
                        </button>

                        {/* Quick Tag Popover */}
                        {isPickerOpen && (
                          <div
                            ref={tagPickerRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-full mt-1.5 z-50 w-56 p-2 bg-white rounded-xl shadow-xl border border-neutral-200 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
                          >
                            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-1">
                              Select Tags
                            </div>

                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {PRESET_LEAD_TAGS.map((preset) => {
                                const hasTag = leadTags.includes(preset.id);
                                return (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleToggleTag(lead.id, preset.id)}
                                    className={cn(
                                      "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors",
                                      hasTag
                                        ? `${preset.bgColor} ${preset.color} font-medium`
                                        : "hover:bg-neutral-100 text-neutral-700"
                                    )}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span className={cn("h-2 w-2 rounded-full", preset.dotColor)} />
                                      {preset.label}
                                    </span>
                                    {hasTag && <Check className="h-3.5 w-3.5 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom tag addition */}
                            <div className="pt-1.5 border-t border-neutral-100 flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Add custom tag..."
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddCustomTag(lead.id);
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomTag(lead.id)}
                                className="p-1 bg-primary text-white rounded-md hover:bg-primary/90"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location & Google Rating */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      {lead.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                          {lead.location}
                        </span>
                      )}

                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {lead.googleRating}
                        <span className="text-neutral-400 font-normal">({lead.reviewCount} reviews)</span>
                      </span>

                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          {lead.phone}
                        </span>
                      )}
                    </div>

                    {/* Digital Gap Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {!lead.hasWebsite ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
                          <Globe className="h-3 w-3" /> No Website
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 text-neutral-600 border border-neutral-200 text-[11px]">
                          <Globe className="h-3 w-3 text-neutral-400" /> Has Website
                        </span>
                      )}

                      {lead.instagramHandle ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                          <AtSign className="h-3 w-3" /> {lead.instagramHandle}
                          {lead.instagramFollowers && (
                            <span className="text-purple-500 font-normal">({lead.instagramFollowers} followers)</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[11px]">
                          No Instagram
                        </span>
                      )}

                      {!lead.usesReels && lead.instagramHandle && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                          No Reels
                        </span>
                      )}

                      {mainGap && (
                        <span className="px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/20 text-[11px] font-medium">
                          Gap: {mainGap.category}
                        </span>
                      )}
                    </div>

                    {/* Source Extraction Links */}
                    {(() => {
                      const mapsUrl =
                        lead.mapsUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${lead.businessName} ${lead.location}`
                        )}`;
                      const igSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                        `${lead.businessName} ${lead.location} site:instagram.com`
                      )}`;
                      const webUrl = lead.websiteUrl
                        ? lead.websiteUrl.startsWith("http")
                          ? lead.websiteUrl
                          : `https://${lead.websiteUrl}`
                        : null;
                      const isAnalyzer =
                        lead.searchId?.startsWith("analyzer_") ||
                        lead.notes?.toLowerCase().includes("analyzer");

                      return (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 mt-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-0.5">
                            Source:
                          </span>

                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-medium text-[11px] transition-colors"
                            title="Search and verify on Google Maps"
                          >
                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>Google Maps</span>
                            <ExternalLink className="h-2.5 w-2.5 text-emerald-600/70 shrink-0" />
                          </a>

                          {lead.instagramHandle && (
                            <a
                              href={igSearchUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/80 font-medium text-[11px] transition-colors"
                              title="Search verified Instagram profile & Reels for this business"
                            >
                              <Camera className="h-3 w-3 text-pink-600 shrink-0" />
                              <span>Instagram</span>
                              <ExternalLink className="h-2.5 w-2.5 text-pink-600/70 shrink-0" />
                            </a>
                          )}

                          {webUrl && (
                            <a
                              href={webUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 font-medium text-[11px] transition-colors"
                              title="Open original business website"
                            >
                              <Globe className="h-3 w-3 text-blue-600 shrink-0" />
                              <span>Website</span>
                              <ExternalLink className="h-2.5 w-2.5 text-blue-600/70 shrink-0" />
                            </a>
                          )}

                          {isAnalyzer && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                              <Sparkles className="h-2.5 w-2.5" />
                              Gap Analyzer
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Column: CTA & Pitch Angle */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] text-neutral-400 block font-medium uppercase tracking-wider">
                      Best Pitch Angle
                    </span>
                    <span className="text-xs font-semibold text-neutral-800 max-w-[200px] block truncate">
                      {lead.bestService}
                    </span>
                  </div>

                  <Link href={`/leads/${lead.id}`}>
                    <Button size="sm" variant="default" className="gap-1.5 text-xs font-semibold">
                      <span>View Lead</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
  );
}
