import { analyzeBusinessWithGemini } from "./analyzers/businessAnalyzer";
import { generatePitchWithGemini } from "./analyzers/pitchGenerator";
import { analyzeBatchWithGemini } from "./analyzers/batchAnalyzer";
import { EnrichedBusiness } from "../pipeline/stages/stage4_enrich";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runGeminiAnalysis(
  businesses: EnrichedBusiness[],
  freelancerType: string,
  freelancerSkills: string[],
  onProgress?: (message: string, current: number, total: number) => void
) {
  const results = [];

  // STEP 1 — Quick batch scoring with Gemini model
  // Analyze businesses at once to get initial rankings
  onProgress?.("Quick-scoring all businesses with Gemini...", 1, 3);

  const batchScores = await analyzeBatchWithGemini({
    businesses: businesses.map((b) => ({
      id: b.placeId,
      name: b.name,
      category: b.category,
      location: b.address,
      rating: b.rating,
      reviewCount: b.reviewCount,
      hasWebsite: !b.gaps.noWebsite,
      photoCount: b.photoCount,
      instagramFollowers: b.instagram.followers,
      daysSinceLastPost: b.instagram.daysSinceLastPost,
      engagementRate: b.instagram.engagementRate,
      totalGaps: b.totalGapCount,
    })),
    freelancerType,
    freelancerSkills,
  });

  // Sort by batch score to prioritize top opportunities
  const ranked = [...businesses].sort((a, b) => {
    const scoreA =
      batchScores.analyses.find((s) => s.businessId === a.placeId)?.opportunityScore ?? 0;
    const scoreB =
      batchScores.analyses.find((s) => s.businessId === b.placeId)?.opportunityScore ?? 0;
    return scoreB - scoreA;
  });

  // STEP 2 — Deep analysis on top businesses
  onProgress?.("Deep analyzing top opportunities with Gemini Flash...", 2, 3);

  const deepAnalysisCount = Math.min(ranked.length, 15);
  const topBusinesses = ranked.slice(0, deepAnalysisCount);

  for (let i = 0; i < topBusinesses.length; i++) {
    const business = topBusinesses[i];
    onProgress?.(
      `Deep analyzing ${business.name} (${i + 1}/${deepAnalysisCount})...`,
      2,
      3
    );

    try {
      const analysis = await analyzeBusinessWithGemini({
        businessName: business.name,
        category: business.category,
        location: business.address,
        city: business.city || "",
        country: business.country || "",
        rating: business.rating,
        reviewCount: business.reviewCount,
        unansweredNegativeReviews: business.unansweredNegativeReviews,
        hasWebsite: !business.gaps.noWebsite,
        websiteUrl: business.website,
        photoCount: business.photoCount,
        hasPhone: !business.gaps.noPhone,
        hasHours: !business.gaps.missingHours,
        priceLevel: business.priceLevel,
        recentReviews: business.reviews || [],
        hasInstagram: business.instagram.found,
        instagramUsername: business.instagram.username,
        followers: business.instagram.followers,
        following: business.instagram.following,
        postsCount: business.instagram.postsCount,
        lastPostDate: business.instagram.lastPostDate,
        daysSinceLastPost: business.instagram.daysSinceLastPost,
        postsPerWeek: business.instagram.postsPerWeek,
        avgLikes: business.instagram.avgLikesPerPost,
        avgComments: business.instagram.avgCommentsPerPost,
        engagementRate: business.instagram.engagementRate,
        usesReels: business.instagram.usesReels,
        hasLinkInBio: business.instagram.hasLinkInBio,
        bio: business.instagram.bio,
        industryAvgEngagement: business.industryBenchmarks.avgEngagement,
        industryAvgFollowers: business.industryBenchmarks.avgFollowers,
        industryPostFrequency: business.industryBenchmarks.avgPostFrequency,
        freelancerType,
        freelancerSkills,
      });

      // STEP 3 — Generate pitches
      const pitches = await generatePitchWithGemini({
        businessName: business.name,
        category: business.category,
        city: business.city || "",
        primaryGap: analysis.gaps[0]?.problem || "",
        hookStatement: analysis.hookStatement,
        pitchAngle: analysis.pitchAngle,
        instagramHandle: business.instagram.username,
        followers: business.instagram.followers,
        daysSinceLastPost: business.instagram.daysSinceLastPost,
        engagementRate: business.instagram.engagementRate,
        hasWebsite: !business.gaps.noWebsite,
        rating: business.rating,
        reviewCount: business.reviewCount,
        freelancerType,
        freelancerSkills,
      });

      results.push({ business, analysis, pitches });
    } catch (error) {
      console.error(`Failed to analyze ${business.name}:`, error);
    }

    if (i < topBusinesses.length - 1) {
      await sleep(300);
    }
  }

  onProgress?.("Gemini analysis complete!", 3, 3);

  return {
    results,
    marketInsights: batchScores.marketInsights,
  };
}
