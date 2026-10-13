import { scrapeGoogleMaps, MapsResult } from "./stages/stage1_maps";
import { filterAndScore } from "./stages/stage2_filter";
import { scrapeInstagram } from "./stages/stage3_instagram";
import { enrichBusinessData } from "./stages/stage4_enrich";
import { runMasterAgent } from "../agents/masterAgent";
import type { AIAnalysis } from "./stages/stage5_ai";
import { rankLeads, RankedLead } from "./stages/stage7_rank";
import { extractWebsite } from "@/lib/gmap/websiteExtractor";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { deductCredits, addCredits } from "@/lib/credits";
import { PIPELINE_CONFIG } from "./config";
import { applyFilters } from "@/lib/gmap/filterEngine";
import { hasNoWebsite, hasRealWebsite } from "@/lib/website-filter";
import type { CustomClientFilter, AgentAnalysis, SearchFilters } from "@/types";
import {
  applyCustomFilters,
  type CustomFilterConfig,
  type CustomPromptConfig,
  type RawBusinessData,
} from "@/lib/customization/promptBuilder";
import { normalizeBusinessName } from "@/lib/deduplication";

export interface PipelineInput {
  userId: string;
  searchId: string;
  freelancerType: string;
  freelancerSkills?: string[];
  location?: string;
  businessType: string;
  country: string;
  city: string;
  specificPlace?: string;
  resultCount: number;
  excludeNames?: string[];
  excludePlaceIds?: string[];
  excludePhones?: string[];
  excludeDomains?: string[];
  searchFilters?: SearchFilters;
  customFilter?: CustomClientFilter;
  customPromptConfig?: CustomPromptConfig;
  customFilterConfig?: CustomFilterConfig;
}

export interface PipelineResult {
  success: boolean;
  leads: RankedLead[];
  totalFound: number;
  totalWithGaps: number;
  creditsUsed: number;
  error?: string;
  message?: string;
}

export function calculateCredits(resultCount: number): number {
  if (resultCount <= 0) return 0;
  return Math.round(
    Math.ceil(resultCount / 10) * PIPELINE_CONFIG.credits.mapsSearchPer10 +
    Math.ceil(resultCount / 10) * PIPELINE_CONFIG.credits.instagramCheckPer10 +
    resultCount * PIPELINE_CONFIG.credits.aiAnalysisEach +
    resultCount * PIPELINE_CONFIG.credits.pitchGenerationEach
  );
}

export async function runPipeline(
  input: PipelineInput,
  onProgress: (step: number, total: number, message: string) => Promise<void>
): Promise<PipelineResult> {
  const supabase = createSupabaseServiceClient();
  const TOTAL_STEPS = 8;
  const targetRequestedCount = input.resultCount || 10;
  const creditsToDeduct = calculateCredits(targetRequestedCount);
  const skills = input.freelancerSkills && input.freelancerSkills.length > 0
    ? input.freelancerSkills
    : ["outreach", "growth", "content"];

  // Step 1 — Check and deduct credits
  await onProgress(1, TOTAL_STEPS, "Checking and securing credits...");
  const deducted = await deductCredits(input.userId, creditsToDeduct, "search", input.searchId);
  if (!deducted) {
    throw new Error(`Insufficient credits. This search requires ${creditsToDeduct} credits.`);
  }

  // Construct activeSearchFilters combining searchFilters, customFilter, and customFilterConfig
  const filterObj = input.customFilter;
  const userPromptText = `${filterObj?.userPrompt || ""} ${input.businessType || ""} ${input.location || ""}`.toLowerCase();
  const prioritiesText = (filterObj?.digitalGapPriorities || []).join(" ").toLowerCase();
  const filterConfigRequiresNoWeb = Boolean(input.customFilterConfig?.mapsFilters?.requireNoWebsite);

  const combinedText = `${userPromptText} ${prioritiesText}`;
  const strictlyRequiresNoWebsite =
    Boolean(input.searchFilters?.requireNoWebsite) ||
    filterConfigRequiresNoWeb ||
    combinedText.includes("no website") ||
    combinedText.includes("without website") ||
    combinedText.includes("without a website") ||
    combinedText.includes("missing website") ||
    combinedText.includes("lacking website") ||
    combinedText.includes("lack a website") ||
    combinedText.includes("has no website") ||
    combinedText.includes("don't have a website") ||
    combinedText.includes("no site") ||
    combinedText.includes("outdated website") ||
    combinedText.includes("no / outdated website") ||
    combinedText.includes("missing / outdated website") ||
    combinedText.includes("outdated or missing website") ||
    combinedText.includes("no official website");

  const strictlyRequiresWebsite =
    Boolean(input.searchFilters?.requireWebsite) ||
    prioritiesText.includes("has website") ||
    userPromptText.includes("must have a website") ||
    userPromptText.includes("with a website") ||
    userPromptText.includes("have a website");

  const activeSearchFilters: SearchFilters = {
    requireNoWebsite: strictlyRequiresNoWebsite ? true : (input.searchFilters?.requireNoWebsite ?? input.customFilterConfig?.mapsFilters?.requireNoWebsite ?? null),
    requireWebsite: strictlyRequiresWebsite ? true : (input.searchFilters?.requireWebsite ?? input.customFilterConfig?.mapsFilters?.requireWebsite ?? null),
    minRating: input.searchFilters?.minRating ?? input.customFilterConfig?.mapsFilters?.minRating ?? input.customFilter?.minRating ?? null,
    maxRating: input.searchFilters?.maxRating ?? input.customFilterConfig?.mapsFilters?.maxRating ?? null,
    minReviews: input.searchFilters?.minReviews ?? input.customFilterConfig?.mapsFilters?.minReviews ?? input.customFilter?.minReviews ?? 3,
    maxReviews: input.searchFilters?.maxReviews ?? input.customFilterConfig?.mapsFilters?.maxReviews ?? null,
    maxPhotos: input.searchFilters?.maxPhotos ?? input.customFilterConfig?.mapsFilters?.maxPhotos ?? null,
    priceLevel: input.searchFilters?.priceLevel || input.customFilterConfig?.mapsFilters?.priceLevel || [],
    keywordsInName: input.searchFilters?.keywordsInName || input.customFilterConfig?.mapsFilters?.keywordsInName || [],
    keywordsToExclude: input.searchFilters?.keywordsToExclude || input.customFilterConfig?.mapsFilters?.keywordsToExclude || input.customFilter?.exclusionKeywords || [],
    requireVerified: input.searchFilters?.requireVerified ?? input.customFilterConfig?.mapsFilters?.requireVerified ?? null,
    requireUnansweredReviews: input.searchFilters?.requireUnansweredReviews ?? input.customFilterConfig?.mapsFilters?.requireUnansweredReviews ?? null,
    instagram: input.searchFilters?.instagram || (input.customFilterConfig?.instagramFilters ? {
      requireNoInstagram: input.customFilterConfig.instagramFilters.requireNoInstagram,
      requireInstagram: input.customFilterConfig.instagramFilters.requireInstagram,
      minFollowers: input.customFilterConfig.instagramFilters.minFollowers,
      maxFollowers: input.customFilterConfig.instagramFilters.maxFollowers,
      minDaysSincePost: input.customFilterConfig.instagramFilters.minDaysSincePost,
      maxEngagementRate: input.customFilterConfig.instagramFilters.maxEngagementRate,
      requireNoReels: input.customFilterConfig.instagramFilters.requireNoReels,
      requireNoLinkInBio: input.customFilterConfig.instagramFilters.requireNoLinkInBio,
    } : null),
  };

  const isNoWebsiteFilterOn = Boolean(activeSearchFilters.requireNoWebsite) || strictlyRequiresNoWebsite;

  try {
    // Step 2 — Google Maps Scraping
    const userLocation = (input.location || "").trim();
    const constructedLocation = [input.specificPlace, input.city, input.country].filter(Boolean).join(", ");
    const locationQuery = userLocation || constructedLocation || "Target Region";
    const searchCategoryTerm = input.customFilter?.nicheFocus || input.businessType;
    await onProgress(2, TOTAL_STEPS, `Searching Google Maps for ${searchCategoryTerm} in ${locationQuery}...`);
    const searchQuery = `${searchCategoryTerm} in ${locationQuery}`;
    
    // Combine exclusions (client provided + custom filter + database existing leads)
    const dbExcludedNames: string[] = [];
    const dbExcludedPhones: string[] = [];
    const dbExcludedDomains: string[] = [];
    const dbExcludedPlaceIds: string[] = [];
    try {
      const { data: dbLeads } = await supabase
        .from("leads")
        .select("business_name, phone, website_url, place_id")
        .eq("user_id", input.userId)
        .limit(1000);
      if (Array.isArray(dbLeads)) {
        dbLeads.forEach((l) => {
          if (l.business_name) dbExcludedNames.push(l.business_name);
          if (l.phone) dbExcludedPhones.push(l.phone);
          if (l.website_url) dbExcludedDomains.push(l.website_url);
          if (l.place_id) dbExcludedPlaceIds.push(l.place_id);
        });
      }
    } catch {
      // Non-blocking
    }

    const combinedExclusions = [
      ...(input.excludeNames || []),
      ...(input.customFilter?.exclusionKeywords || []),
      ...dbExcludedNames,
    ];

    const combinedPhones = [
      ...(input.excludePhones || []),
      ...dbExcludedPhones,
    ];

    const combinedDomains = [
      ...(input.excludeDomains || []),
      ...dbExcludedDomains,
    ];

    const combinedPlaceIds = [
      ...(input.excludePlaceIds || []),
      ...dbExcludedPlaceIds,
    ];

    const mapsResults = await scrapeGoogleMaps(
      searchQuery,
      targetRequestedCount,
      async (msg) => {
        await onProgress(2, TOTAL_STEPS, msg);
      },
      combinedExclusions,
      combinedPlaceIds,
      combinedPhones,
      combinedDomains,
      isNoWebsiteFilterOn
    );

    // Step 3 — Filter and Score
    await onProgress(3, TOTAL_STEPS, `Found ${mapsResults.length} businesses. Filtering for digital gaps & opportunity...`);

    let passedMapsResults: MapsResult[];
    if (isNoWebsiteFilterOn) {
      passedMapsResults = mapsResults.filter((b) => hasNoWebsite(b.website)).slice(0, targetRequestedCount);
    } else {
      const filterResult = applyFilters(mapsResults, activeSearchFilters);
      passedMapsResults = filterResult.passed.slice(0, targetRequestedCount);
    }

    const filtered = filterAndScore(passedMapsResults);

    // Step 4 — Instagram Scraping
    await onProgress(4, TOTAL_STEPS, `Auditing Instagram metrics for ${filtered.length} businesses...`);
    const instagramMap = await scrapeInstagram(filtered, async (msg) => {
      await onProgress(4, TOTAL_STEPS, msg);
    });

    // Step 5 — Enrich with Industry Benchmarks
    await onProgress(5, TOTAL_STEPS, "Enriching data with category conversion benchmarks...");
    const enriched = filtered.map((business) =>
      enrichBusinessData(
        business,
        instagramMap.get(business.placeId) || {
          found: false,
          username: null,
          fullName: null,
          bio: null,
          followers: null,
          following: null,
          postsCount: null,
          lastPostDate: null,
          daysSinceLastPost: null,
          postsPerWeek: null,
          avgLikesPerPost: null,
          avgCommentsPerPost: null,
          engagementRate: null,
          hasLinkInBio: false,
          usesReels: false,
          hasHighlights: false,
          isVerifiedAccount: false,
          profileUrl: null,
          gaps: {
            noInstagram: true,
            deadAccount: false,
            lowEngagement: false,
            noLinkInBio: false,
            noReels: false,
            infrequentPosting: false,
            lowFollowers: false,
          },
        }
      )
    );

    // Step 5b — Apply Custom Filter Config & AI Custom Filter if provided
    let candidateBusinesses = enriched;
    if (input.customFilterConfig) {
      const customFiltered = applyCustomFilters(enriched as unknown as RawBusinessData[], input.customFilterConfig);
      if (customFiltered.length > 0) {
        candidateBusinesses = customFiltered as unknown as typeof enriched;
      }
    }

    if (strictlyRequiresNoWebsite || activeSearchFilters.requireNoWebsite === true) {
      candidateBusinesses = candidateBusinesses.filter((b) => {
        const url = b.website || extractWebsite(b as unknown as Record<string, unknown>);
        return hasNoWebsite(url);
      });
    } else if (strictlyRequiresWebsite || activeSearchFilters.requireWebsite === true) {
      candidateBusinesses = candidateBusinesses.filter((b) => {
        const url = b.website || extractWebsite(b as unknown as Record<string, unknown>);
        return hasRealWebsite(url);
      });
    }

    if (filterObj) {
      const customRankFiltered = candidateBusinesses.filter((b) => {
        if (typeof filterObj.minRating === "number" && filterObj.minRating > 0) {
          if (b.rating !== null && b.rating < filterObj.minRating) return false;
        }

        if (typeof filterObj.minReviews === "number" && filterObj.minReviews > 0) {
          if (b.reviewCount < filterObj.minReviews) return false;
        }

        return true;
      });

      if (customRankFiltered.length > 0) {
        candidateBusinesses = customRankFiltered;
      }
    }

    // Step 6 & 7 — Run Master AI Agent
    await onProgress(6, TOTAL_STEPS, `Generating opportunity analyses and customized pitch bundles...`);
    const agentResults = [];
    const BATCH_SIZE = 4;
    for (let i = 0; i < candidateBusinesses.length; i += BATCH_SIZE) {
      const batch = candidateBusinesses.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map((b) =>
        runMasterAgent(
          b,
          b.instagram,
          input.freelancerType,
          skills
        )
      );
      const batchResults = await Promise.all(batchPromises);
      for (let idx = 0; idx < batch.length; idx++) {
        const res = batchResults[idx];
        const biz = batch[idx];
        if (res && !res.filtered && res.analysis && res.pitches) {
          agentResults.push({
            business: biz,
            analysis: res.analysis,
            pitches: res.pitches,
          });
        }
      }
    }

    // Step 8 — Rank and Save Everything
    await onProgress(8, TOTAL_STEPS, "Calculating weighted scores and persisting results...");
    const ranked = rankLeads(agentResults);

    // Persist to Supabase Database
    const leadsToInsert = ranked.map((lead) => {
      const an = lead.analysis as AIAnalysis & AgentAnalysis;
      const gapAnalysisObj = an.gapAnalysis || {};
      const pitchStrategyObj = an.pitchStrategy || {};
      return {
        search_id: input.searchId,
        user_id: input.userId,
        rank: lead.rank,
        business_name: lead.business.name,
        business_category: lead.business.category,
        location: lead.business.address,
        google_rating: lead.business.rating ?? 4.0,
        review_count: lead.business.reviewCount,
        has_website: hasRealWebsite(lead.business.website),
        website_url: hasRealWebsite(lead.business.website) ? lead.business.website : null,
        phone: lead.business.phone,
        photo_count: lead.business.photoCount,
        maps_url: lead.business.mapsUrl,
        instagram_handle: lead.business.instagram.username,
        instagram_followers: lead.business.instagram.followers,
        instagram_following: lead.business.instagram.following,
        instagram_posts: lead.business.instagram.postsCount,
        last_post_date: lead.business.instagram.lastPostDate,
        engagement_rate: lead.business.instagram.engagementRate,
        has_link_in_bio: lead.business.instagram.hasLinkInBio,
        uses_reels: lead.business.instagram.usesReels,
        opportunity_score: lead.finalScore,
        urgency_level: (an.urgencyLevel || gapAnalysisObj.urgencyLevel || "high") as "low" | "medium" | "high" | "critical",
        best_service: (an.bestServiceToPitch || pitchStrategyObj.angle || "Conversion optimization"),
        estimated_budget: an.estimatedMonthlyBudget || gapAnalysisObj.estimatedMonthlyBudget || null,
        status: "new",
        notes: null,
        tags: [
          lead.business.budgetSignal === "high" ? "High Budget" : "Qualified",
          lead.finalScore > 80 ? "Top Opportunity" : "Active Gap",
        ],
      };
    });

    let finalRanked = ranked;

    try {
      if (leadsToInsert.length > 0) {
        await supabase.from("leads").insert(leadsToInsert);
      }

      // Filter out any business already seen in previous searches
      const existingNames = new Set(dbExcludedNames.map((n) => normalizeBusinessName(n)).filter(Boolean));
      const cleanRanked = ranked.filter((l) => {
        const norm = normalizeBusinessName(l.business.name);
        return !existingNames.has(norm);
      });

      finalRanked = cleanRanked.length > 0 ? cleanRanked : ranked;
    } catch (dbErr) {
      console.log("Database persist notice (falling back to memory):", dbErr);
    }

    // Check if fewer leads than requested were found: refund unused credits and set message
    const finalLeadCount = finalRanked.length;
    let actualCreditsUsed = creditsToDeduct;
    let responseMessage: string | undefined = undefined;

    if (finalLeadCount < targetRequestedCount) {
      actualCreditsUsed = calculateCredits(finalLeadCount);
      const refundAmount = creditsToDeduct - actualCreditsUsed;
      if (refundAmount > 0) {
        try {
          await addCredits(
            input.userId,
            refundAmount,
            `Partial refund: only ${finalLeadCount} of ${targetRequestedCount} leads found`,
            input.searchId
          );
        } catch (refundErr) {
          console.error("Error during partial credit refund:", refundErr);
        }
      }

      if (isNoWebsiteFilterOn) {
        responseMessage = `Only ${finalLeadCount} businesses without a website were found in this area.`;
      }
    }

    try {
      await supabase
        .from("searches")
        .update({
          status: "completed",
          results_count: finalRanked.length,
          progress: 100,
          progress_message: responseMessage || `Found ${finalRanked.length} high-opportunity leads`,
          credits_used: actualCreditsUsed,
        })
        .eq("id", input.searchId);
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      leads: finalRanked,
      totalFound: mapsResults.length,
      totalWithGaps: filtered.length,
      creditsUsed: actualCreditsUsed,
      message: responseMessage,
    };
  } catch (error) {
    console.error("Pipeline failure, refunding credits:", error);
    try {
      await addCredits(
        input.userId,
        creditsToDeduct,
        `Pipeline auto-refund: ${(error as Error).message || "Scraping error"}`,
        input.searchId
      );
      await supabase
        .from("searches")
        .update({
          status: "failed",
          error: (error as Error).message,
          progress_message: (error as Error).message,
        })
        .eq("id", input.searchId);
    } catch (refundErr) {
      console.error("Error during refund:", refundErr);
    }

    return {
      success: false,
      leads: [],
      totalFound: 0,
      totalWithGaps: 0,
      creditsUsed: 0,
      error: (error as Error).message,
    };
  }
}
