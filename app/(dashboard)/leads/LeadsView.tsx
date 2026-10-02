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
  Mail,
  Clock,
  Calendar,
  Folder,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  type Gap,
  type Lead,
  type PitchBundle,
  type UrgencyLevel,
  type LeadFolder,
  PRESET_LEAD_TAGS,
  getTagStyle,
} from "@/types";
import { OpportunityScore } from "@/components/ui/OpportunityScore";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getLocalLeads,
  updateLocalLead,
  getLocalFolders,
  createLocalFolder,
  deleteLocalFolder,
  assignLeadToFolder,
  assignLeadsToFolderBulk,
  deleteLocalLead,
  deleteLocalLeadsBulk,
  saveLocalLeads,
} from "@/lib/local-store";
import { toast } from "sonner";
import { OutreachTemplateModal } from "@/components/leads/OutreachTemplateModal";
import { LeadFolderBar } from "@/components/leads/LeadFolderBar";

interface LeadsViewProps {
  initialLeads: Lead[];
}

function formatLeadSearchTime(dateStr?: string | null): { relative: string; full: string } {
  if (!dateStr) return { relative: "Recently", full: "Discovered recently" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { relative: "Recently", full: "Discovered recently" };

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const full = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffSec < 60) return { relative: "Just now", full };
  if (diffMin < 60) return { relative: `${diffMin}m ago`, full };
  if (diffHours < 24) return { relative: `${diffHours}h ago`, full };
  if (diffDays === 1) return { relative: "Yesterday", full };
  if (diffDays < 7) return { relative: `${diffDays}d ago`, full };
  if (diffDays < 30) return { relative: `${Math.floor(diffDays / 7)}w ago`, full };

  return {
    relative: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    full,
  };
}

export function LeadsView({ initialLeads }: LeadsViewProps) {
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [filterTier, setFilterTier] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [filterGap, setFilterGap] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7d" | "30d" | "90d" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    | "score_desc"
    | "score_asc"
    | "time_desc"
    | "time_asc"
    | "location_asc"
    | "industry_asc"
    | "rating_asc"
    | "reviews_asc"
    | "name_asc"
  >("time_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagPickerId, setActiveTagPickerId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const [selectedLeadForTemplate, setSelectedLeadForTemplate] = useState<Lead | null>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  // Folder & Multi-Select States
  const [folders, setFolders] = useState<LeadFolder[]>(() => getLocalFolders());
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [activeFolderDropdownId, setActiveFolderDropdownId] = useState<string | null>(null);
  const [showBulkMoveDropdown, setShowBulkMoveDropdown] = useState<boolean>(false);
  const folderDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced Filters State: Opportunity Score, Location, Industry Type, Search Time
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
        folderId: (item.folderId ?? item.folder_id ?? null) as string | null,
        folderName: (item.folderName ?? item.folder_name ?? null) as string | null,
        status: (item.status ?? "new") as "new" | "viewed" | "contacted" | "won" | "lost",
        notes: (item.notes ?? null) as string | null,
        tags,
        contactedAt: (item.contactedAt ?? item.contacted_at ?? null) as string | null,
        createdAt: (item.createdAt ?? item.created_at ?? new Date().toISOString()) as string,
      } as Lead;
    });
  }, [leadsList]);

  // Click outside to close folder dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(e.target as Node)) {
        setActiveFolderDropdownId(null);
        setShowBulkMoveDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute Location Groups (Location-Wise auto folders)
  const locationGroups = useMemo(() => {
    const map = new Map<string, { count: number; totalScore: number }>();
    normalizedLeads.forEach((l) => {
      const rawLoc = l.location || "";
      const parts = rawLoc.split(",").map((s) => s.trim()).filter(Boolean);
      const primaryCity = parts[0] || "General Territory";
      const existing = map.get(primaryCity) || { count: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalScore += l.opportunityScore;
      map.set(primaryCity, existing);
    });

    return Array.from(map.entries())
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        avgScore: Math.round(stat.totalScore / stat.count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [normalizedLeads]);

  function handleCreateFolder(name: string, color: string, description: string) {
    const newFolder = createLocalFolder(name, color, description);
    setFolders(getLocalFolders());
    setSelectedFolder(newFolder.id);
    toast.success(`Created folder "${name}"`);
  }

  function handleDeleteFolder(folderId: string) {
    deleteLocalFolder(folderId);
    setFolders(getLocalFolders());
    if (selectedFolder === folderId) setSelectedFolder("all");
    toast.success("Folder deleted. Leads were kept in All Leads.");
  }

  function handleAssignLeadFolder(leadId: string, folderId: string | null) {
    assignLeadToFolder(leadId, folderId);
    const folderObj = folderId ? folders.find((f) => f.id === folderId) : null;
    setLeadsList((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              folderId: folderId || null,
              folderName: folderObj ? folderObj.name : null,
            }
          : l
      )
    );
    setActiveFolderDropdownId(null);
    toast.success(folderObj ? `Lead moved to "${folderObj.name}"` : "Lead removed from folder");
  }

  function handleDeleteLead(leadId: string, leadName: string) {
    const leadToDelete = normalizedLeads.find((l) => l.id === leadId);
    if (!leadToDelete) return;

    setLeadsList((prev) => prev.filter((l) => l.id !== leadId));
    deleteLocalLead(leadId);
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });

    toast(`Deleted "${leadName}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          setLeadsList((prev) => [leadToDelete, ...prev]);
          const current = getLocalLeads();
          saveLocalLeads([leadToDelete, ...current]);
          toast.success(`Restored "${leadName}"`);
        },
      },
    });
  }

  function handleBulkDelete() {
    if (selectedLeadIds.size === 0) return;
    const count = selectedLeadIds.size;
    const idsToDelete = Array.from(selectedLeadIds);
    const deletedBackup = normalizedLeads.filter((l) => selectedLeadIds.has(l.id));

    setLeadsList((prev) => prev.filter((l) => !selectedLeadIds.has(l.id)));
    deleteLocalLeadsBulk(idsToDelete);
    setSelectedLeadIds(new Set());

    toast.success(`Deleted ${count} selected leads`, {
      action: {
        label: "Undo",
        onClick: () => {
          setLeadsList((prev) => [...deletedBackup, ...prev]);
          const current = getLocalLeads();
          saveLocalLeads([...deletedBackup, ...current]);
          toast.success(`Restored ${count} leads`);
        },
      },
    });
  }

  function handleBulkMove(folderId: string | null) {
    if (selectedLeadIds.size === 0) return;
    const ids = Array.from(selectedLeadIds);
    assignLeadsToFolderBulk(ids, folderId);
    const folderObj = folderId ? folders.find((f) => f.id === folderId) : null;

    setLeadsList((prev) =>
      prev.map((l) =>
        selectedLeadIds.has(l.id)
          ? {
              ...l,
              folderId: folderId || null,
              folderName: folderObj ? folderObj.name : null,
            }
          : l
      )
    );
    setShowBulkMoveDropdown(false);
    setSelectedLeadIds(new Set());
    toast.success(
      `Moved ${ids.length} leads to ${folderObj ? `"${folderObj.name}"` : "All Leads"}`
    );
  }

  function toggleSelectLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }

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
      const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
      // Clean locality identifier
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
        // 0. Folder filter (Location-wise or Custom folder)
        if (selectedFolder === "all") return true;
        if (selectedFolder.startsWith("loc:")) {
          const targetLoc = selectedFolder.replace("loc:", "").toLowerCase().trim();
          const leadLoc = (l.location || "").toLowerCase().trim();
          return leadLoc.includes(targetLoc);
        }
        if (selectedFolder === "folder_hot_deals") {
          return l.folderId === "folder_hot_deals" || l.opportunityScore >= 75;
        }
        if (selectedFolder === "folder_follow_ups") {
          return (
            l.folderId === "folder_follow_ups" ||
            (l.tags || []).some((t) => t.toLowerCase().includes("follow")) ||
            l.status === "contacted"
          );
        }
        if (selectedFolder === "folder_high_budget") {
          return (
            l.folderId === "folder_high_budget" ||
            (l.tags || []).some((t) => t.toLowerCase().includes("budget"))
          );
        }
        if (selectedFolder === "folder_closed_won") {
          return l.folderId === "folder_closed_won" || l.status === "won";
        }
        return l.folderId === selectedFolder;
      })
      .filter((l) => {
        // 1. Tier filter (score tier)
        if (filterTier !== "all") {
          const tier = getLeadTier(l);
          if (tier !== filterTier) return false;
        }
        return true;
      })
      .filter((l) => {
        // 2. Opportunity Score range filter
        if (minScore > 0 && l.opportunityScore < minScore) return false;
        if (maxScore < 100 && l.opportunityScore > maxScore) return false;
        return true;
      })
      .filter((l) => {
        // 3. Location filter: robust token & substring matching
        if (selectedLocation === "all") return true;
        const target = selectedLocation.toLowerCase().trim();
        const leadLoc = (l.location || "").toLowerCase().trim();
        if (!leadLoc) return false;
        if (leadLoc.includes(target) || target.includes(leadLoc)) return true;

        // Token match: check state/city tokens (min 2 chars for NY, TX, UK etc.)
        const targetTokens = target
          .split(/[,\s/]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 2 && !["and", "the", "for", "near"].includes(t));

        if (targetTokens.length > 0) {
          return targetTokens.some((tok) => leadLoc.includes(tok));
        }
        return false;
      })
      .filter((l) => {
        // 4. Industry Type filter: robust singular/plural and token matching
        if (selectedIndustry === "all") return true;
        const target = selectedIndustry.toLowerCase().trim();
        const leadCat = (l.businessCategory || "").toLowerCase().trim();

        if (leadCat === target || leadCat.includes(target) || target.includes(leadCat)) {
          return true;
        }

        const targetNormalized = target.replace(/s$/, "").replace(/ies$/, "y");
        const leadCatNormalized = leadCat.replace(/s$/, "").replace(/ies$/, "y");

        if (
          leadCatNormalized.includes(targetNormalized) ||
          targetNormalized.includes(leadCatNormalized)
        ) {
          return true;
        }

        const tokens = targetNormalized
          .split(/[\s/&]+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 3);

        return tokens.some((tok) => leadCatNormalized.includes(tok));
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
        // 6. Digital Gap filter: broadened multi-signal detection
        if (filterGap === "all") return true;
        const allGapText = (l.gapsFound || [])
          .map((g) => `${g.category} ${g.problem} ${g.impact || ""} ${g.yourSolution || ""}`)
          .join(" ")
          .toLowerCase();

        if (filterGap === "missing_website") {
          const hasRealWebsite = Boolean(
            l.hasWebsite &&
              l.websiteUrl &&
              l.websiteUrl.trim() !== "" &&
              l.websiteUrl.trim().toLowerCase() !== "null" &&
              !l.websiteUrl.toLowerCase().includes("none")
          );
          return !hasRealWebsite;
        }
        if (filterGap === "mobile_ux") {
          return (
            /mobile|speed|responsive|booking|screen|layout|ux|load|navigation|checkout|friction/i.test(
              allGapText
            )
          );
        }
        if (filterGap === "no_reels") {
          return (
            !l.usesReels ||
            /reel|video|tiktok|short-form|content|post|clip/i.test(allGapText)
          );
        }
        if (filterGap === "missing_instagram") {
          return !l.instagramHandle || /instagram|social|ig handle|profile/i.test(allGapText);
        }
        if (filterGap === "missing_phone") {
          return !l.phone || /phone|call|contact|dial/i.test(allGapText);
        }
        if (filterGap === "low_rating") {
          return (
            l.googleRating < 4.5 ||
            /review|rating|reputation|feedback|unanswered/i.test(allGapText)
          );
        }
        return true;
      })
      .filter((l) => {
        // 7. Time / Search Date filter
        if (timeFilter === "all") return true;
        const leadTime = l.createdAt ? new Date(l.createdAt).getTime() : 0;
        if (!leadTime || isNaN(leadTime)) return true;

        const now = Date.now();
        if (timeFilter === "today") {
          return now - leadTime <= 24 * 60 * 60 * 1000;
        }
        if (timeFilter === "7d") {
          return now - leadTime <= 7 * 24 * 60 * 60 * 1000;
        }
        if (timeFilter === "30d") {
          return now - leadTime <= 30 * 24 * 60 * 60 * 1000;
        }
        if (timeFilter === "90d") {
          return now - leadTime <= 90 * 24 * 60 * 60 * 1000;
        }
        if (timeFilter === "custom") {
          const startMs = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : 0;
          const endMs = customEndDate ? new Date(`${customEndDate}T23:59:59`).getTime() : Infinity;
          return leadTime >= startMs && leadTime <= endMs;
        }
        return true;
      })
      .filter((l) => {
        // 8. Text Search query
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
        if (sortBy === "time_desc") {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        }
        if (sortBy === "time_asc") {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA - tB;
        }
        if (sortBy === "score_asc") return a.opportunityScore - b.opportunityScore;
        if (sortBy === "location_asc") return a.location.localeCompare(b.location);
        if (sortBy === "industry_asc") return a.businessCategory.localeCompare(b.businessCategory);
        if (sortBy === "rating_asc") return a.googleRating - b.googleRating;
        if (sortBy === "reviews_asc") return a.reviewCount - b.reviewCount;
        if (sortBy === "name_asc") return a.businessName.localeCompare(b.businessName);
        if (sortBy === "score_desc") {
          const scoreDiff = b.opportunityScore - a.opportunityScore;
          if (scoreDiff !== 0) return scoreDiff;
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        }
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });
  }, [
    normalizedLeads,
    selectedFolder,
    filterTier,
    minScore,
    maxScore,
    selectedLocation,
    selectedIndustry,
    selectedTag,
    filterGap,
    timeFilter,
    customStartDate,
    customEndDate,
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
    if (timeFilter !== "all") count++;
    if (filterGap !== "all") count++;
    if (filterTier !== "all") count++;
    if (selectedTag !== "all") count++;
    return count;
  }, [minScore, maxScore, selectedLocation, selectedIndustry, timeFilter, filterGap, filterTier, selectedTag]);

  const hasActiveFilters =
    filterTier !== "all" ||
    selectedTag !== "all" ||
    filterGap !== "all" ||
    timeFilter !== "all" ||
    minScore > 0 ||
    maxScore < 100 ||
    selectedLocation !== "all" ||
    selectedIndustry !== "all" ||
    Boolean(searchQuery.trim());

  function resetAllFilters() {
    setFilterTier("all");
    setSelectedTag("all");
    setFilterGap("all");
    setTimeFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setMinScore(0);
    setMaxScore(100);
    setSelectedLocation("all");
    setSelectedIndustry("all");
    setSortBy("score_desc");
    setSearchQuery("");
  }

  function handleTierClick(tier: "all" | "high" | "medium" | "low") {
    if (filterTier === tier) {
      setFilterTier("all");
    } else {
      setFilterTier(tier);
    }
  }

  function handleScorePreset(preset: "all" | "elite" | "high" | "moderate" | "low") {
    if (preset === "all") {
      setFilterTier("all");
      setMinScore(0);
      setMaxScore(100);
    } else if (preset === "elite") {
      setFilterTier("all");
      setMinScore(85);
      setMaxScore(100);
    } else if (preset === "high") {
      setFilterTier("high");
      setMinScore(0);
      setMaxScore(100);
    } else if (preset === "moderate") {
      setFilterTier("medium");
      setMinScore(0);
      setMaxScore(100);
    } else if (preset === "low") {
      setFilterTier("low");
      setMinScore(0);
      setMaxScore(100);
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
            Organize leads by territory location or custom folders, categorize with tags, and prioritize high-converting outreach.
          </p>
        </div>
        <Link href="/search">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </Link>
      </div>

      {/* Lead Organization & Folders Bar */}
      <LeadFolderBar
        folders={folders}
        locationGroups={locationGroups}
        selectedFolder={selectedFolder}
        totalLeadsCount={normalizedLeads.length}
        onSelectFolder={(fId) => setSelectedFolder(fId)}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => handleTierClick("all")}
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
          onClick={() => handleTierClick("high")}
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
          onClick={() => handleTierClick("medium")}
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
          <div className="mt-1 text-[11px] text-neutral-500">Score 60–74</div>
        </div>

        <div
          onClick={() => handleTierClick("low")}
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
          <div className="mt-1 text-[11px] text-neutral-500">Score &lt; 60</div>
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

            {/* Time / Search Date Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
            >
              <option value="all">🕒 All Time</option>
              <option value="today">🕒 Last 24 Hours (Today)</option>
              <option value="7d">🕒 Past 7 Days</option>
              <option value="30d">🕒 Past 30 Days</option>
              <option value="90d">🕒 Past 90 Days</option>
              <option value="custom">📅 Custom Date Range...</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0"
            >
              <option value="score_desc">Score: High to Low</option>
              <option value="score_asc">Score: Low to High</option>
              <option value="time_desc">Search Time: Newest First</option>
              <option value="time_asc">Search Time: Oldest First</option>
              <option value="location_asc">Location: A to Z</option>
              <option value="industry_asc">Industry: A to Z</option>
              <option value="rating_asc">Rating: Lowest First</option>
              <option value="reviews_asc">Reviews: Fewest First</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto text-xs text-neutral-500">
            {filteredLeads.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all select-none",
                  selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0
                    ? "bg-primary text-white border-primary shadow-xs"
                    : selectedLeadIds.size > 0
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                )}
              >
                {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0 ? (
                  <CheckSquare className="h-3.5 w-3.5" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
                <span>
                  {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0
                    ? "Deselect All"
                    : `Select All (${filteredLeads.length})`}
                </span>
              </button>
            )}

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

            {/* 4 Advanced Filter Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      ? "All (0–100)"
                      : minScore > 0 && maxScore === 100
                      ? `≥ ${minScore}`
                      : `${minScore}–${maxScore}`}
                  </span>
                </div>

                {/* Score Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => handleScorePreset("all")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
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
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
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
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
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
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      minScore === 60 && maxScore === 74
                        ? "bg-amber-600 text-white border-amber-600 font-semibold shadow-xs"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                    )}
                  >
                    60–74 Med
                  </button>
                </div>

                {/* Score Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 font-medium">
                    <span>Min: {minScore}</span>
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
                      setFilterTier("all");
                      if (val > maxScore) setMaxScore(100);
                    }}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                </div>
              </div>

              {/* Filter 2: Search Time / Date Range */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span>Search Time / Date</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium capitalize">
                    {timeFilter === "all" ? "All Time" : timeFilter}
                  </span>
                </div>

                {/* Time Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setTimeFilter("all")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      timeFilter === "all"
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter("today")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      timeFilter === "today"
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-purple-50/70 text-purple-700 hover:bg-purple-100 border-purple-200"
                    )}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter("7d")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      timeFilter === "7d"
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    )}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter("30d")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      timeFilter === "30d"
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    )}
                  >
                    30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter("custom")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                      timeFilter === "custom"
                        ? "bg-purple-600 text-white border-purple-600 font-semibold"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                    )}
                  >
                    Custom...
                  </button>
                </div>

                {/* Custom Date Pickers */}
                {timeFilter === "custom" ? (
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5 animate-in fade-in-50 duration-150">
                    <div>
                      <label className="text-[9px] uppercase font-semibold text-neutral-400 block mb-0.5">From</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full h-7 px-1.5 text-[11px] rounded border border-neutral-200 bg-neutral-50 text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-semibold text-neutral-400 block mb-0.5">To</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full h-7 px-1.5 text-[11px] rounded border border-neutral-200 bg-neutral-50 text-neutral-800"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-500 pt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-neutral-400" />
                    <span>
                      {timeFilter === "all" && "Showing all historical searches"}
                      {timeFilter === "today" && "Leads discovered in last 24 hours"}
                      {timeFilter === "7d" && "Leads discovered in past 7 days"}
                      {timeFilter === "30d" && "Leads discovered in past month"}
                      {timeFilter === "90d" && "Leads discovered in past quarter"}
                    </span>
                  </div>
                )}
              </div>

              {/* Filter 3: Location */}
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
                      {loc.location} ({loc.count} leads • avg {loc.avgScore})
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
                    {availableLocations.slice(0, 3).map((loc) => {
                      const isSelected = selectedLocation.toLowerCase() === loc.location.toLowerCase();
                      return (
                        <button
                          key={loc.location}
                          type="button"
                          onClick={() => setSelectedLocation(isSelected ? "all" : loc.location)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border truncate max-w-[120px]",
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

              {/* Filter 4: Industry Type */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Industry / Niche</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {availableIndustries.length} niches
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
                      {ind.category} ({ind.count} leads • avg {ind.avgScore})
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
                    {availableIndustries.slice(0, 3).map((ind) => {
                      const isSelected = selectedIndustry.toLowerCase() === ind.category.toLowerCase();
                      return (
                        <button
                          key={ind.category}
                          type="button"
                          onClick={() => setSelectedIndustry(isSelected ? "all" : ind.category)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-medium transition-colors border truncate max-w-[120px]",
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

          {timeFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 text-[11px] font-semibold border border-purple-200 animate-in fade-in-50">
              <Clock className="h-3 w-3 text-purple-600" />
              {timeFilter === "today" && "Time: Last 24h"}
              {timeFilter === "7d" && "Time: Past 7 Days"}
              {timeFilter === "30d" && "Time: Past 30 Days"}
              {timeFilter === "90d" && "Time: Past 90 Days"}
              {timeFilter === "custom" &&
                `Date: ${customStartDate || "Start"} to ${customEndDate || "Now"}`}
              <button
                type="button"
                onClick={() => {
                  setTimeFilter("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="hover:text-purple-950 ml-0.5"
                title="Clear time filter"
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
            const isFolderOpen = activeFolderDropdownId === lead.id;
            const isSelectedLead = selectedLeadIds.has(lead.id);

          return (
            <div
              key={lead.id}
              className={cn(
                "relative group bg-white border transition-all duration-200 rounded-xl p-5",
                isSelectedLead
                  ? "border-primary ring-2 ring-primary/20 shadow-sm bg-primary/[0.01]"
                  : "border-neutral-200/80 hover:border-primary/50 hover:shadow-md"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left Column: Checkbox + Score Ring + Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Selection Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectLead(lead.id);
                    }}
                    className={cn(
                      "h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-2",
                      isSelectedLead
                        ? "bg-primary text-white border-primary"
                        : "border-neutral-300 hover:border-neutral-400 bg-white"
                    )}
                    title={isSelectedLead ? "Deselect lead" : "Select lead"}
                  >
                    {isSelectedLead ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                  </button>

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

                      {/* Folder Pill / Indicator */}
                      {lead.folderId && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                          <Folder className="h-3 w-3" />
                          {lead.folderName ||
                            folders.find((f) => f.id === lead.folderId)?.name ||
                            "Folder"}
                        </span>
                      )}

                      {(() => {
                        const timeInfo = formatLeadSearchTime(lead.createdAt);
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-200"
                            title={timeInfo.full}
                          >
                            <Clock className="h-3 w-3 text-neutral-400" />
                            {timeInfo.relative}
                          </span>
                        );
                      })()}
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

                      {/* Move to Folder Quick Action Button */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderDropdownId(isFolderOpen ? null : lead.id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors border",
                            lead.folderId
                              ? "bg-primary/5 text-primary border-primary/30 hover:bg-primary/10"
                              : "bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 border-neutral-200"
                          )}
                          title="Move lead to a folder"
                        >
                          <Folder className="h-3 w-3" />
                          <span>{lead.folderId ? "Folder" : "+ Folder"}</span>
                        </button>

                        {isFolderOpen && (
                          <div
                            ref={folderDropdownRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-full mt-1.5 z-50 w-52 p-1.5 bg-white rounded-xl shadow-xl border border-neutral-200 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
                          >
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-0.5">
                              Assign to Folder
                            </div>
                            {lead.folderId && (
                              <button
                                type="button"
                                onClick={() => handleAssignLeadFolder(lead.id, null)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-neutral-100 text-rose-600 font-medium text-[11px]"
                              >
                                Remove from folder
                              </button>
                            )}
                            {folders.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleAssignLeadFolder(lead.id, f.id)}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-[11px] transition-colors",
                                  lead.folderId === f.id
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "hover:bg-neutral-100 text-neutral-700"
                                )}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: f.color }}
                                  />
                                  <span className="truncate">{f.name}</span>
                                </div>
                                {lead.folderId === f.id && <Check className="h-3 w-3 shrink-0" />}
                              </button>
                            ))}
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

                {/* Right Column: CTA, Pitch Angle & Delete Button */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-neutral-400 block font-medium uppercase tracking-wider">
                        Best Pitch Angle
                      </span>
                      <span className="text-xs font-semibold text-neutral-800 max-w-[170px] block truncate">
                        {lead.bestService}
                      </span>
                    </div>

                    {/* Delete Lead Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead.id, lead.businessName)}
                      className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      title={`Delete "${lead.businessName}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLeadForTemplate(lead)}
                      className="gap-1.5 text-xs font-semibold text-neutral-700 hover:text-primary hover:border-primary/40"
                      title="Apply custom outreach template with auto-inserted AI pitch"
                    >
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>Template</span>
                    </Button>

                    <Link href={`/leads/${lead.id}`}>
                      <Button size="sm" variant="default" className="gap-1.5 text-xs font-semibold">
                        <span>View Lead</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    {/* Floating Bulk Actions Bar */}
    {selectedLeadIds.size > 0 && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2 pr-2 border-r border-neutral-700 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{selectedLeadIds.size} Leads Selected</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Move to folder dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBulkMoveDropdown(!showBulkMoveDropdown)}
              className="h-8 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Folder className="h-3.5 w-3.5 text-primary" />
              <span>Move to Folder...</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {showBulkMoveDropdown && (
              <div
                ref={folderDropdownRef}
                className="absolute left-0 bottom-full mb-2 w-56 p-1.5 rounded-xl bg-white text-neutral-900 shadow-xl border border-neutral-200 text-xs space-y-1 z-50 animate-in fade-in-50"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Select Target Folder
                </div>
                <button
                  type="button"
                  onClick={() => handleBulkMove(null)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 flex items-center gap-2 text-neutral-600"
                >
                  <Folder className="h-3.5 w-3.5 text-neutral-400" />
                  <span>None (Remove from folder)</span>
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleBulkMove(f.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 flex items-center gap-2 font-medium"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Delete */}
          <button
            type="button"
            onClick={handleBulkDelete}
            className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Selected</span>
          </button>

          {/* Deselect All */}
          <button
            type="button"
            onClick={() => setSelectedLeadIds(new Set())}
            className="h-8 px-2.5 rounded-lg text-neutral-400 hover:text-white text-xs font-medium transition-colors"
          >
            Deselect
          </button>
        </div>
      </div>
    )}

    {/* Outreach Template Modal */}
    {selectedLeadForTemplate && (
      <OutreachTemplateModal
        isOpen={Boolean(selectedLeadForTemplate)}
        onClose={() => setSelectedLeadForTemplate(null)}
        lead={selectedLeadForTemplate}
        defaultChannel="email"
      />
    )}
  </div>
  );
}
