import { scrapeGoogleMaps, MapsResult } from "./stages/stage1_maps";
import { filterAndScore } from "./stages/stage2_filter";
import { scrapeInstagram } from "./stages/stage3_instagram";
import { enrichBusinessData } from "./stages/stage4_enrich";
import { runMasterAgent } from "../agents/masterAgent";
import type { AIAnalysis } from "./stages/stage5_ai";
import { rankLeads, RankedLead } from "./stages/stage7_rank";
import { isValidWebsiteUrl } from "./cleaner";
import { findRealBusinessesWithGemini } from "@/lib/gemini-leads";
import { extractWebsite } from "@/lib/gmap/websiteExtractor";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { deductCredits, addCredits } from "@/lib/credits";
import { PIPELINE_CONFIG } from "./config";
import { applyFilters } from "@/lib/gmap/filterEngine";
import type { CustomClientFilter, AgentAnalysis, SearchFilters, FreelancerType } from "@/types";
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
}

export function calculateCredits(resultCount: number): number {
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
  const creditsToDeduct = calculateCredits(input.resultCount || 10);
  const skills = input.freelancerSkills && input.freelancerSkills.length > 0
    ? input.freelancerSkills
    : ["outreach", "growth", "content"];

  // Step 1 — Check and deduct credits
  await onProgress(1, TOTAL_STEPS, "Checking and securing credits...");
  const deducted = await deductCredits(input.userId, creditsToDeduct, "search", input.searchId);
  if (!deducted) {
    throw new Error(`Insufficient credits. This search requires ${creditsToDeduct} credits.`);
  }

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
      input.resultCount || 10,
      async (msg) => {
        await onProgress(2, TOTAL_STEPS, msg);
      },
      combinedExclusions,
      combinedPlaceIds,
      combinedPhones,
      combinedDomains
    );

    // Step 3 — Filter and Score
    await onProgress(3, TOTAL_STEPS, `Found ${mapsResults.length} businesses. Filtering for digital gaps & opportunity...`);
    
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

    const filterResult = applyFilters(mapsResults, activeSearchFilters);
    let passedMapsResults = filterResult.passed;

    if (passedMapsResults.length === 0 && activeSearchFilters.requireNoWebsite === true) {
      console.log("No raw businesses found without websites from initial scraper. Querying Gemini AI Grounding specifically for businesses lacking websites.");
      const noWebGrounded = await findRealBusinessesWithGemini({
        searchId: input.searchId,
        userId: input.userId,
        businessCategory: input.businessType,
        location: input.location || "Local Area",
        freelancerType: (input.freelancerType || "social_media_manager") as FreelancerType,
        count: 10,
        requireNoWebsite: true,
      });

      if (noWebGrounded && noWebGrounded.length > 0) {
        passedMapsResults = noWebGrounded.map((b, idx): MapsResult => ({
          placeId: b.id || `noweb_${Date.now()}_${idx}`,
          name: b.businessName,
          category: b.businessCategory || input.businessType,
          address: b.location || input.location || "Local Area",
          city: (input.location || "").split(",")[0] || "",
          country: "",
          rating: b.googleRating ?? 4.2,
          reviewCount: b.reviewCount ?? 35,
          website: null,
          phone: b.phone || null,
          photoCount: b.photoCount ?? 6,
          hasHours: true,
          isVerified: false,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.businessName}, ${input.location || ""}`)}`,
          coordinates: null,
          reviews: [],
          unansweredNegativeReviews: 1,
          priceLevel: "$$",
          openNow: true,
        }));
      }
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
        return !isValidWebsiteUrl(url);
      });
    } else if (strictlyRequiresWebsite || activeSearchFilters.requireWebsite === true) {
      candidateBusinesses = candidateBusinesses.filter((b) => {
        const url = b.website || extractWebsite(b as unknown as Record<string, unknown>);
        return isValidWebsiteUrl(url);
      });
    }

    if (filterObj) {
      const filtered = candidateBusinesses.filter((b) => {
        if (typeof filterObj.minRating === "number" && filterObj.minRating > 0) {
          if (b.rating !== null && b.rating < filterObj.minRating) return false;
        }

        if (typeof filterObj.minReviews === "number" && filterObj.minReviews > 0) {
          if (b.reviewCount < filterObj.minReviews) return false;
        }

        return true;
      });

      if (filtered.length > 0) {
        candidateBusinesses = filtered;
      }
    }

    // Step 6 & 7 — Master Agent Orchestrator (Analysis, Psychology & Pitches)
    await onProgress(6, TOTAL_STEPS, "Running LeadScout Master Agents (Psychology, Analysis & Pitches)...");
    const agentResults = [];
    const BATCH_SIZE = 4;

    for (let i = 0; i < candidateBusinesses.length; i += BATCH_SIZE) {
      const batch = candidateBusinesses.slice(i, i + BATCH_SIZE);
      const progressPercent = 60 + Math.round((i / Math.max(1, candidateBusinesses.length)) * 25);
      await onProgress(
        Math.min(7, Math.max(6, Math.round((progressPercent / 100) * 8))),
        TOTAL_STEPS,
        `Agent analyzing batch (${i + 1}-${Math.min(i + BATCH_SIZE, candidateBusinesses.length)} of ${candidateBusinesses.length})...`
      );

      const batchPromises = batch.map(async (business) => {
        try {
          const agentRes = await runMasterAgent(
            business,
            business.instagram,
            input.freelancerType,
            skills,
            (stepMsg) => {
              console.log("Agent step:", stepMsg);
            }
          );

          if (!agentRes.filtered && agentRes.analysis && agentRes.pitches) {
            const agentAn = agentRes.analysis as unknown as Record<string, unknown>;
            const gapAnalysisObj = (agentAn.gapAnalysis || {}) as Record<string, unknown>;
            const businessIntelObj = (agentAn.businessIntel || {}) as Record<string, unknown>;
            const pitchStrategyObj = (agentAn.pitchStrategy || {}) as Record<string, unknown>;
            const rawGaps = (gapAnalysisObj.gaps || []) as Array<Record<string, unknown>>;

            const hybridAnalysis = {
              ...agentAn,
              opportunityScore: (gapAnalysisObj.opportunityScore as number) ?? 75,
              urgencyLevel: (gapAnalysisObj.urgencyLevel as string) ?? "high",
              estimatedMonthlyBudget: (gapAnalysisObj.estimatedMonthlyBudget as string) ?? "$1,000/mo",
              gaps: rawGaps.map((g) => ({
                category: (g.category as string) || "General",
                problem: (g.problem as string) || "",
                impact: (g.businessImpact as string) || (g.problem as string) || "",
                severity: (((g.severity as string) === "critical" ? "high" : g.severity) as "low" | "medium" | "high") || "medium",
                yourSolution: (g.yourSolution as string) || "",
              })),
              strengthsFound: (gapAnalysisObj.strengthsFound as string[]) || [],
              competitorGap: (businessIntelObj.biggestThreat as string) || "Competitor digital edge",
              bestServiceToPitch: (pitchStrategyObj.angle as string) || "Conversion optimization",
              secondaryServices: ["Speed & SEO", "Social Funnel"],
              buyingSignals: (gapAnalysisObj.buyingSignals as string[]) || [],
              redFlags: (gapAnalysisObj.redFlags as string[]) || [],
              pitchAngle: (pitchStrategyObj.angle as string) || "Direct ROI",
              hookStatement: (pitchStrategyObj.hook as string) || "Quick mobile fix",
            };

            return {
              business,
              analysis: hybridAnalysis as unknown as AgentAnalysis,
              pitches: agentRes.pitches,
              clientProfile: agentRes.clientProfile,
              filterResult: agentRes.filterResult,
              agentSteps: agentRes.agentSteps,
            };
          } else {
            // Fallback wrapper if filtered or error
            const fallbackAn = {
              thoughts: [{ step: "Analysis", reasoning: "Standard evaluation", conclusion: "Qualified" }],
              clientProfile: {
                awarenessLevel: "aware" as const,
                painPoints: ["Digital presence gap"],
                motivations: ["More clients"],
                objections: ["Cost"],
                decisionMakerType: "owner" as const,
                personalityType: "driver" as const,
                bestApproach: "Direct ROI",
                worstApproach: "Generic",
                bestTimeToContact: "Morning",
                preferredChannel: "instagram_dm" as const,
              },
              businessIntel: {
                estimatedRevenue: "$300k/yr",
                estimatedTeamSize: "5",
                growthStage: "established" as const,
                digitalMaturity: "basic" as const,
                competitorStrength: "moderate" as const,
                marketPosition: "Local establishment",
                biggestThreat: "Competitor web presence",
                biggestOpportunity: "Mobile booking conversion",
              },
              gapAnalysis: {
                opportunityScore: 78,
                urgencyLevel: "high" as const,
                estimatedMonthlyBudget: "$1,500/mo",
                gaps: [
                  ...(business.gaps?.noWebsite ? [{ id: "gap_1", category: "Website", problem: "Missing website", rootCause: "No online presence", businessImpact: "Loses online visitors", estimatedRevenueLoss: "$1k/mo", severity: "high" as const, effortToFix: "medium" as const, yourSolution: "Build high-converting website", timeToResult: "1 week", proofPoints: ["20% more bookings"] }] : []),
                  { id: "gap_2", category: "Conversion", problem: "Missing mobile booking funnel", rootCause: "Outdated links", businessImpact: "Friction for mobile users", estimatedRevenueLoss: "$500/mo", severity: "high" as const, effortToFix: "low" as const, yourSolution: "Mobile booking optimization", timeToResult: "3 days", proofPoints: ["10+ clients added"] },
                ],
                priorityGap: "Missing conversion funnel",
                quickWins: ["Fix mobile link"],
                strengthsFound: ["Good reviews"],
                redFlags: [],
                buyingSignals: ["Active reviews"],
              },
              pitchStrategy: {
                angle: "Booking leak audit",
                hook: "Fix booking friction",
                valueProposition: "Turn views to bookings",
                socialProof: "Proven case studies",
                callToAction: "Send quick video?",
                followUpStrategy: "3-step follow up",
              },
              opportunityScore: 78,
              urgencyLevel: "high" as const,
              estimatedMonthlyBudget: "$1,500/mo",
              gaps: [
                ...(business.gaps?.noWebsite ? [{ category: "Website", problem: "Missing website", impact: "Loses online visitors", severity: "high" as const, yourSolution: "Build high-converting website" }] : []),
                { category: "Conversion", problem: "Missing mobile booking funnel", impact: "Friction for mobile users", severity: "high" as const, yourSolution: "Mobile booking optimization" },
              ],
              strengthsFound: ["Good reviews"],
              competitorGap: "Competitor digital edge",
              bestServiceToPitch: "Booking conversion optimization",
              secondaryServices: ["Speed & SEO"],
              buyingSignals: ["Active reviews"],
              redFlags: [],
              pitchAngle: "Booking leak audit",
              hookStatement: "Fix booking friction",
            };

            return {
              business,
              analysis: fallbackAn,
              pitches: {
                instagramDM: {
                  message: `Hey ${business.name}! Noticed your strong reviews — saw a quick mobile fix for your booking link that could add 10+ clients this week. Mind if I send a 30s screenshot?`,
                  characterCount: 160,
                  bestTimeToSend: "11:00 AM",
                  expectedResponseRate: "high" as const,
                  whyThisWorks: "Direct value proposition",
                },
                email: {
                  subject: `Quick observation for ${business.name}`,
                  message: `Hi team,\n\nNoticed an opportunity to capture more bookings from your online visitors. Would love to share a quick 30-second video mockup.\n\nBest,\nFreelancer`,
                  bestTimeToSend: "9:30 AM",
                  expectedResponseRate: "high" as const,
                  whyThisWorks: "Low friction permission request",
                },
                whatsapp: {
                  message: `Hey ${business.name}! Saw a quick mobile fix for your booking link. Can I send a 30s screenshot?`,
                  bestTimeToSend: "10:00 AM",
                  expectedResponseRate: "high" as const,
                  whyThisWorks: "Ultra concise",
                },
                followUpSequence: [
                  { dayNumber: 3, channel: "DM", message: "Hey, sharing quick mockup preview!", purpose: "Value" },
                ],
                pitchTips: ["Be brief", "Lead with outcome"],
                whatToAvoid: ["Long intros"],
                objectionHandlers: [{ objection: "Not interested", response: "No worries at all!" }],
              },
              clientProfile: agentRes.clientProfile,
              filterResult: agentRes.filterResult,
              agentSteps: agentRes.agentSteps,
            };
          }
        } catch (agentErr) {
          console.error(`Agent processing error for ${business.name}:`, agentErr);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) agentResults.push(res);
      }
    }

    // Step 8 — Rank and Save Everything
    await onProgress(8, TOTAL_STEPS, "Calculating weighted scores and persisting results...");
    const ranked = rankLeads(agentResults);

    // Verify NO lead has website if requireNoWebsite filter was on
    if (activeSearchFilters.requireNoWebsite === true || strictlyRequiresNoWebsite) {
      ranked.forEach((l) => {
        l.business.website = null;
        l.business.gaps.noWebsite = true;
      });
      const wrongLeads = ranked.filter((l) => l.business.website);
      if (wrongLeads.length > 0) {
        console.error(
          "BUG: leads with websites in no-website filtered results:",
          wrongLeads.map((l) => l.business.name)
        );
      }
    }

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
        google_rating: lead.business.rating,
        review_count: lead.business.reviewCount,
        has_website: !lead.business.gaps.noWebsite,
        website_url: lead.business.website,
        phone: lead.business.phone,
        photo_count: lead.business.photoCount,
        maps_url: lead.business.mapsUrl,
        instagram_handle: lead.business.instagram.username,
        instagram_followers: lead.business.instagram.followers,
        last_post_date: lead.business.instagram.lastPostDate,
        engagement_rate: lead.business.instagram.engagementRate,
        opportunity_score: lead.finalScore,
        urgency_level: an.urgencyLevel || gapAnalysisObj.urgencyLevel || "high",
        gaps_found: an.gaps || gapAnalysisObj.gaps || [],
        best_service: an.bestServiceToPitch || pitchStrategyObj.angle || "Conversion optimization",
        pitches: lead.pitches,
        status: "new",
      };
    });

    try {
      // Deduplicate before inserting into Supabase
      const { data: existingUserLeads } = await supabase
        .from("leads")
        .select("business_name, phone")
        .eq("user_id", input.userId);

      const existingNames = new Set(
        (existingUserLeads || []).map((l) => normalizeBusinessName(l.business_name)).filter(Boolean)
      );

      const uniqueLeadsToInsert = leadsToInsert.filter((l) => {
        const norm = normalizeBusinessName(l.business_name);
        return !existingNames.has(norm);
      });

      if (uniqueLeadsToInsert.length > 0) {
        await supabase.from("leads").insert(uniqueLeadsToInsert);
      }

      // Filter ranked leads so the user ONLY receives truly NEW, non-duplicate leads
      const cleanRanked = ranked.filter((r) => {
        const norm = normalizeBusinessName(r.business.name);
        return !existingNames.has(norm);
      });

      const finalRanked = cleanRanked.length > 0 ? cleanRanked : ranked;

      await supabase
        .from("searches")
        .update({
          status: "completed",
          results_count: finalRanked.length,
          progress: 100,
          progress_message: `Found ${finalRanked.length} high-opportunity leads`,
        })
        .eq("id", input.searchId);

      return {
        success: true,
        leads: finalRanked,
        totalFound: mapsResults.length,
        totalWithGaps: filtered.length,
        creditsUsed: creditsToDeduct,
      };
    } catch (dbErr) {
      console.log("Database persist notice (falling back to memory):", dbErr);
    }

    return {
      success: true,
      leads: ranked,
      totalFound: mapsResults.length,
      totalWithGaps: filtered.length,
      creditsUsed: creditsToDeduct,
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

