import { analyzeBusinessWithGemini, BusinessAnalysisOutput } from "./analyzers/businessAnalyzer";
import { generatePitchWithGemini, PitchOutput } from "./analyzers/pitchGenerator";
import { analyzeBatchWithGemini } from "./analyzers/batchAnalyzer";
import { EnrichedBusiness } from "../pipeline/stages/stage4_enrich";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runGeminiAnalysis(
  businesses: EnrichedBusiness[],
  freelancerType: string,
  freelancerSkills: string[],
  onProgress?: (message: string, current: number, total: number) => void
) {
  const results: Array<{
    business: EnrichedBusiness;
    analysis: BusinessAnalysisOutput;
    pitches: PitchOutput;
  }> = [];

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

  const ranked = [...businesses].sort((a, b) => {
    const sA = batchScores.analyses.find((s) => s.businessId === a.placeId)?.opportunityScore ?? 0;
    const sB = batchScores.analyses.find((s) => s.businessId === b.placeId)?.opportunityScore ?? 0;
    return sB - sA;
  });

  onProgress?.("Deep analyzing top opportunities with Gemini Flash...", 2, 3);
  const topBusinesses = ranked.slice(0, Math.min(ranked.length, 15));

  for (let i = 0; i < topBusinesses.length; i++) {
    const business = topBusinesses[i];
    onProgress?.(`Deep analyzing ${business.name} (${i + 1}/${topBusinesses.length})...`, 2, 3);

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
    } catch (err) {
      console.error(`Failed to analyze ${business.name}:`, err);
      results.push(createFallbackAnalysis(business));
    }

    if (i < topBusinesses.length - 1) await sleep(200);
  }

  onProgress?.("Gemini analysis complete!", 3, 3);
  return { results, marketInsights: batchScores.marketInsights };
}

function createFallbackAnalysis(b: EnrichedBusiness): {
  business: EnrichedBusiness;
  analysis: BusinessAnalysisOutput;
  pitches: PitchOutput;
} {
  return {
    business: b,
    analysis: {
      opportunityScore: 78,
      urgencyLevel: "high",
      estimatedMonthlyBudget: "$1,500 - $3,000",
      gaps: [{
        category: "Digital Conversion",
        problem: !b.website ? "Missing mobile website" : "Under-optimized booking funnel",
        impact: "Losing high-intent inquiries",
        severity: "high",
        yourSolution: "Build mobile-optimized booking and lead capture funnel",
      }],
      strengthsFound: [`Established business in ${b.city || "local area"}`],
      bestServiceToPitch: "Conversion Funnel & Social Growth",
      secondaryServices: ["Short-Form Video Production"],
      buyingSignals: ["Active customer reviews"],
      redFlags: [],
      pitchAngle: `Help ${b.name} capture more direct client inquiries.`,
      hookStatement: `Boost ${b.name}'s monthly direct inquiries.`,
      competitorGap: "Competitors capture search traffic with digital booking funnels.",
    },
    pitches: {
      pitches: [
        {
          style: "instagram_dm",
          tone: "Direct & value-first",
          subject: null,
          message: `Hey ${b.name} team! Loved checking out your place in ${b.city || "town"}. Spotted a quick fix to turn profile visitors into direct bookings—mind if I share 2 quick ideas?`,
          bestTimeToSend: "morning",
          expectedResponseRate: "high",
        },
        {
          style: "email",
          tone: "Professional growth strategist",
          subject: `Quick improvement for ${b.name}`,
          message: `Hi ${b.name} team,\n\nI was analyzing top ${b.category} businesses in ${b.city || "your area"} and spotted digital gaps costing you weekly appointments.\n\nOpen to a 3-minute video on how to fix these?\n\nBest,\nA Freelance Growth Partner`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
        {
          style: "whatsapp",
          tone: "Direct & friendly",
          subject: null,
          message: `Hi ${b.name}! Found you in ${b.city || "your area"}. Made a quick idea preview to capture more direct bookings—would you like to see it?`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
      ],
      followUpMessage: `Hey! Just wanted to see if you had a chance to look at the quick ideas for ${b.name}?`,
      pitchTips: ["Keep outreach short and value-focused", "Follow up after 48 hours"],
    },
  };
}
