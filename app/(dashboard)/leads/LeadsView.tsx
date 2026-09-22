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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagPickerId, setActiveTagPickerId] = useState<string | null>(null);
  const [customTagInput, setCustomTagInput] = useState("");
  const tagPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLeads.length > 0) {
      setLeadsList(initialLeads);
    } else {
      const local = getLocalLeads();
      if (local && local.length > 0) {
        setLeadsList(local);
      }
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
    return leadsList.map((itemRaw) => {
      const item = itemRaw as unknown as Record<string, unknown>;
      const oppScore = Number(item.opportunityScore ?? item.opportunity_score ?? 70);

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

      return {
        id: item.id as string,
        searchId: (item.searchId ?? item.search_id) as string,
        userId: (item.userId ?? item.user_id) as string,
        rank: Number(item.rank ?? 1),
        businessName: (item.businessName ?? item.business_name ?? "Unnamed Business") as string,
        businessCategory: (item.businessCategory ?? item.business_category ?? "Local Business") as string,
        location: (item.location ?? "") as string,
        googleRating: Number(item.googleRating ?? item.google_rating ?? 4.5),
        reviewCount: Number(item.reviewCount ?? item.review_count ?? 0),
        hasWebsite: Boolean(item.hasWebsite ?? item.has_website ?? false),
        websiteUrl: (item.websiteUrl ?? item.website_url ?? null) as string | null,
        phone: (item.phone ?? null) as string | null,
        photoCount: Number(item.photoCount ?? item.photo_count ?? 0),
        mapsUrl: (item.mapsUrl ?? item.maps_url ?? null) as string | null,
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

  // Summary counts
  const highCount = normalizedLeads.filter(
    (l) => l.opportunityScore >= 75 || l.urgencyLevel === "high" || l.urgencyLevel === "critical"
  ).length;
  const mediumCount = normalizedLeads.filter(
    (l) => l.opportunityScore >= 65 && l.opportunityScore < 75
  ).length;
  const lowCount = normalizedLeads.filter((l) => l.opportunityScore < 65).length;

  // Compute available tags and their counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    normalizedLeads.forEach((l) => {
      (l.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [normalizedLeads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return normalizedLeads
      .filter((l) => {
        if (filterTier === "high") return l.opportunityScore >= 75;
        if (filterTier === "medium") return l.opportunityScore >= 65 && l.opportunityScore < 75;
        if (filterTier === "low") return l.opportunityScore < 65;
        return true;
      })
      .filter((l) => {
        if (selectedTag === "all") return true;
        return (l.tags || []).includes(selectedTag);
      })
      .filter((l) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesTag = (l.tags || []).some((t) => t.toLowerCase().includes(q));
        return (
          l.businessName.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.businessCategory.toLowerCase().includes(q) ||
          matchesTag
        );
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [normalizedLeads, filterTier, selectedTag, searchQuery]);

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
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200",
            filterTier === "all" ? "ring-2 ring-primary border-primary shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Leads</span>
            <Building2 className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{normalizedLeads.length}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Discovered across searches</div>
        </div>

        <div
          onClick={() => setFilterTier("high")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200",
            filterTier === "high" ? "ring-2 ring-rose-500 border-rose-500 shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">High Opportunity</span>
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{highCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Score 75+ (highest conversion)</div>
        </div>

        <div
          onClick={() => setFilterTier("medium")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200",
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
          onClick={() => setFilterTier("low")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200",
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
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
          <TagIcon className="h-3.5 w-3.5 text-primary" />
          <span>Filter by Lead Tag:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all",
              selectedTag === "all"
                ? "bg-neutral-900 text-white shadow-sm"
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
            const count = tagCounts[preset.id] || 0;
            const isSelected = selectedTag === preset.id;
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
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search leads by name, city, tag, or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 self-end sm:self-auto">
          {selectedTag !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium">
              Filtered by: {selectedTag}
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className="hover:text-primary-focus ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span>Showing {filteredLeads.length} of {normalizedLeads.length} leads</span>
        </div>
      </div>

      {/* Leads List */}
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
                      const igUrl = lead.instagramHandle
                        ? `https://www.instagram.com/${lead.instagramHandle.replace(/^@/, "")}/`
                        : null;
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
                            title="Open original Google Maps business listing"
                          >
                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>Google Maps</span>
                            <ExternalLink className="h-2.5 w-2.5 text-emerald-600/70 shrink-0" />
                          </a>

                          {igUrl && (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200/80 font-medium text-[11px] transition-colors"
                              title="Open original Instagram account"
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
    </div>
  );
}
