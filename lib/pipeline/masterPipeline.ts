import { scrapeGoogleMaps } from "./stages/stage1_maps";
import { filterAndScore } from "./stages/stage2_filter";
import { scrapeInstagram } from "./stages/stage3_instagram";
import { enrichBusinessData } from "./stages/stage4_enrich";
import { analyzeWithAI } from "./stages/stage5_ai";
import { generatePitches } from "./stages/stage6_pitch";
import { rankLeads, RankedLead } from "./stages/stage7_rank";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { deductCredits, addCredits } from "@/lib/credits";
import { PIPELINE_CONFIG } from "./config";

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
  return (
    Math.ceil(resultCount / 10) * PIPELINE_CONFIG.credits.mapsSearchPer10 +
    Math.ceil(resultCount / 10) * PIPELINE_CONFIG.credits.instagramCheckPer10 +
    resultCount * PIPELINE_CONFIG.credits.aiAnalysisEach +
    resultCount * PIPELINE_CONFIG.credits.pitchGenerationEach
  );
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const locationQuery = [input.specificPlace, input.city, input.country].filter(Boolean).join(", ");
    await onProgress(2, TOTAL_STEPS, `Searching Google Maps for ${input.businessType} in ${locationQuery}...`);
    const searchQuery = `${input.businessType} in ${locationQuery}`;
    const mapsResults = await scrapeGoogleMaps(searchQuery, input.resultCount || 10);

    // Step 3 — Filter and Score
    await onProgress(3, TOTAL_STEPS, `Found ${mapsResults.length} businesses. Filtering for digital gaps & opportunity...`);
    const filtered = filterAndScore(mapsResults);

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

    // Step 6 — AI Gap Analysis (in batches)
    await onProgress(6, TOTAL_STEPS, "Executing multi-point AI gap analysis...");
    const analyzed: Array<{
      business: typeof enriched[0];
      analysis: Awaited<ReturnType<typeof analyzeWithAI>>;
    }> = [];
    const aiBatches = chunkArray(enriched, PIPELINE_CONFIG.batches.aiPerBatch);

    for (let i = 0; i < aiBatches.length; i++) {
      const batch = aiBatches[i];
      await onProgress(
        6,
        TOTAL_STEPS,
        `Analyzing businesses ${i * PIPELINE_CONFIG.batches.aiPerBatch + 1}-${Math.min(
          (i + 1) * PIPELINE_CONFIG.batches.aiPerBatch,
          enriched.length
        )} with AI...`
      );

      const batchResults = await Promise.allSettled(
        batch.map((business) =>
          analyzeWithAI(business, input.freelancerType, skills)
        )
      );

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          analyzed.push({ business: batch[index], analysis: result.value });
        }
      });

      if (i < aiBatches.length - 1) {
        await sleep(PIPELINE_CONFIG.batches.delayBetweenBatches);
      }
    }

    // Step 7 — Generate Pitches (in batches)
    await onProgress(7, TOTAL_STEPS, "Synthesizing customized cold outreach pitches...");
    const withPitches: Array<{
      business: typeof enriched[0];
      analysis: Awaited<ReturnType<typeof analyzeWithAI>>;
      pitches: Awaited<ReturnType<typeof generatePitches>>;
    }> = [];
    const pitchBatches = chunkArray(analyzed, PIPELINE_CONFIG.batches.aiPerBatch);

    for (const batch of pitchBatches) {
      const results = await Promise.allSettled(
        batch.map(({ business, analysis }) =>
          generatePitches(business, analysis, input.freelancerType, skills).then(
            (pitches) => ({ business, analysis, pitches })
          )
        )
      );
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          withPitches.push(r.value);
        }
      });
      await sleep(500);
    }

    // Step 8 — Rank and Save Everything
    await onProgress(8, TOTAL_STEPS, "Calculating weighted scores and persisting results...");
    const ranked = rankLeads(withPitches);

    // Persist to Supabase Database
    const leadsToInsert = ranked.map((lead) => ({
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
      urgency_level: lead.analysis.urgencyLevel,
      gaps_found: lead.analysis.gaps,
      best_service: lead.analysis.bestServiceToPitch,
      pitches: lead.pitches,
      status: "new",
    }));

    try {
      await supabase.from("leads").insert(leadsToInsert);
      await supabase
        .from("searches")
        .update({
          status: "completed",
          results_count: ranked.length,
          progress: 100,
          progress_message: `Found ${ranked.length} high-opportunity leads`,
        })
        .eq("id", input.searchId);
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
    // Refund credits on failure so user never loses credits due to scraping issues
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
