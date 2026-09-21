"use client";

import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import type { Gap, Lead, PitchBundle, UrgencyLevel } from "@/types";
import { OpportunityScore } from "@/components/ui/OpportunityScore";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocalLeads } from "@/lib/local-store";

interface LeadsViewProps {
  initialLeads: Lead[];
}

export function LeadsView({ initialLeads }: LeadsViewProps) {
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [filterTier, setFilterTier] = useState<"all" | "high" | "medium" | "low">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Normalize leads (handling potential snake_case from DB)
  const normalizedLeads = useMemo(() => {
    return leadsList.map((itemRaw) => {
      const item = itemRaw as unknown as Record<string, unknown>;
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
        opportunityScore: Number(item.opportunityScore ?? item.opportunity_score ?? 70),
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
        contactedAt: (item.contactedAt ?? item.contacted_at ?? null) as string | null,
        createdAt: (item.createdAt ?? item.created_at ?? new Date().toISOString()) as string,
      } as Lead;
    });
  }, [leadsList]);

  // Summary counts
  const highCount = normalizedLeads.filter(
    (l) => l.opportunityScore >= 75 || l.urgencyLevel === "high" || l.urgencyLevel === "critical"
  ).length;
  const mediumCount = normalizedLeads.filter(
    (l) => l.opportunityScore >= 65 && l.opportunityScore < 75
  ).length;
  const lowCount = normalizedLeads.filter((l) => l.opportunityScore < 65).length;

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
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          l.businessName.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.businessCategory.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [normalizedLeads, filterTier, searchQuery]);

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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Discovered Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by Opportunity Score based on website defects, missed social reach, and review gaps.
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
            filterTier === "high" ? "ring-2 ring-danger border-danger shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-danger-foreground">High Opportunity</span>
            <span className="flex h-2 w-2 rounded-full bg-danger animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-900">{highCount}</div>
          <div className="mt-1 text-[11px] text-neutral-500">Score 75+ (highest conversion)</div>
        </div>

        <div
          onClick={() => setFilterTier("medium")}
          className={cn(
            "p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200",
            filterTier === "medium" ? "ring-2 ring-warning border-warning shadow-sm" : "border-neutral-200 hover:border-neutral-300"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">Medium Opportunity</span>
            <TrendingUp className="h-4 w-4 text-warning" />
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search leads by name, city, or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-1 text-xs text-neutral-500 self-end sm:self-auto">
          <span>Showing {filteredLeads.length} of {normalizedLeads.length} leads</span>
        </div>
      </div>

      {/* Leads List sorted by Opportunity Score */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => {
          const mainGap = lead.gapsFound && lead.gapsFound.length > 0 ? lead.gapsFound[0] : null;

          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="block group"
            >
              <Card className="border border-neutral-200/80 hover:border-primary/50 hover:shadow-md transition-all duration-200 p-5 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Score Ring + Details */}
                  <div className="flex items-start gap-4">
                    {/* Opportunity Score Ring */}
                    <div className="shrink-0 flex flex-col items-center">
                      <OpportunityScore score={lead.opportunityScore} size={68} strokeWidth={6} />
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                        Score
                      </span>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary transition-colors truncate">
                          {lead.businessName}
                        </h3>
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
                    </div>
                  </div>

                  {/* Right Column: CTA & Pitch Angle */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-neutral-400 block font-medium uppercase tracking-wider">
                        Best Pitch Angle
                      </span>
                      <span className="text-xs font-semibold text-neutral-800 max-w-[200px] block truncate">
                        {lead.bestService}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                      <span>View Lead & Pitches</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
