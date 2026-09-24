import { getFlashModel, generateJSON } from "../client";

export interface BusinessAnalysisInput {
  // Google Maps data
  businessName: string;
  category: string;
  location: string;
  city: string;
  country: string;
  rating: number | null;
  reviewCount: number;
  unansweredNegativeReviews: number;
  hasWebsite: boolean;
  websiteUrl: string | null;
  photoCount: number;
  hasPhone: boolean;
  hasHours: boolean;
  priceLevel: string | null;
  recentReviews: Array<{
    text: string;
    rating: number;
    hasOwnerResponse: boolean;
  }>;

  // Instagram data
  hasInstagram: boolean;
  instagramUsername: string | null;
  followers: number | null;
  following: number | null;
  postsCount: number | null;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  postsPerWeek: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  engagementRate: number | null;
  usesReels: boolean;
  hasLinkInBio: boolean;
  bio: string | null;

  // Industry benchmarks
  industryAvgEngagement: number;
  industryAvgFollowers: number;
  industryPostFrequency: number;

  // Freelancer context
  freelancerType: string;
  freelancerSkills: string[];
}

export interface BusinessAnalysisOutput {
  opportunityScore: number;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  estimatedMonthlyBudget: string;
  gaps: Array<{
    category: string;
    problem: string;
    impact: string;
    severity: "low" | "medium" | "high";
    yourSolution: string;
    estimatedRevenueImpact?: string;
  }>;
  strengthsFound: string[];
  bestServiceToPitch: string;
  secondaryServices: string[];
  buyingSignals: string[];
  redFlags: string[];
  pitchAngle: string;
  hookStatement: string;
  competitorGap: string;
}

export async function analyzeBusinessWithGemini(
  input: BusinessAnalysisInput
): Promise<BusinessAnalysisOutput> {
  const model = getFlashModel();

  const prompt = `
Analyze this business profile and identify every
digital gap and opportunity for a ${input.freelancerType}.

IMPORTANT: Detect their archetype (Local Business, Creator/Influencer, Coach/Consultant, E-Commerce Brand, Artist) and tailor the gaps, services, and pitches to what they actually do.

══════════════════════════════════
GOOGLE MAPS / LISTING PROFILE
══════════════════════════════════
Business Name    : ${input.businessName}
Category         : ${input.category}
Location         : ${input.location}, ${input.city}, ${input.country}
Google Rating    : ${input.rating ?? "No rating"} / 5.0
Total Reviews    : ${input.reviewCount}
Negative Reviews (unanswered): ${input.unansweredNegativeReviews}
Has Website      : ${input.hasWebsite ? "YES → " + input.websiteUrl : "NO ❌"}
Photo Count      : ${input.photoCount} photos
Phone Listed     : ${input.hasPhone ? "YES" : "NO ❌"}
Hours Listed     : ${input.hasHours ? "YES" : "NO ❌"}
Price Level      : ${input.priceLevel ?? "Unknown"}

Recent reviews sample:
${input.recentReviews.slice(0, 3).map((r) => 
  `  [${r.rating}★] "${r.text.slice(0, 100)}" ${r.hasOwnerResponse ? "(owner replied)" : "(NO REPLY ❌)"}`
).join("\n")}

══════════════════════════════════
INSTAGRAM PROFILE
══════════════════════════════════
Has Instagram    : ${input.hasInstagram ? "YES → @" + input.instagramUsername : "NO ❌"}
Followers        : ${input.followers?.toLocaleString() ?? "N/A"}
Following        : ${input.following?.toLocaleString() ?? "N/A"}
Total Posts      : ${input.postsCount ?? "N/A"}
Last Post        : ${input.lastPostDate ?? "N/A"}
Days Since Post  : ${input.daysSinceLastPost ?? "N/A"} days
Posts Per Week   : ${input.postsPerWeek ?? "N/A"}
Avg Likes/Post   : ${input.avgLikes ?? "N/A"}
Avg Comments/Post: ${input.avgComments ?? "N/A"}
Engagement Rate  : ${input.engagementRate ?? "N/A"}%
Uses Reels       : ${input.usesReels ? "YES" : "NO ❌"}
Link In Bio      : ${input.hasLinkInBio ? "YES" : "NO ❌"}
Bio Text         : ${input.bio ?? "Empty ❌"}

══════════════════════════════════
INDUSTRY BENCHMARKS
══════════════════════════════════
Average Engagement Rate : ${input.industryAvgEngagement}%
Average Followers       : ${input.industryAvgFollowers.toLocaleString()}
Average Post Frequency  : ${input.industryPostFrequency}x per week

══════════════════════════════════
FREELANCER PROFILE
══════════════════════════════════
Type   : ${input.freelancerType}
Skills : ${input.freelancerSkills.join(", ")}

══════════════════════════════════
ANALYSIS INSTRUCTIONS
══════════════════════════════════
1. Compare their metrics against industry benchmarks
2. Identify every gap — be specific with numbers
3. Example good gap: "Engagement rate 0.3% vs industry 1.5% — 5x below average"
4. Example bad gap: "Low engagement" (too vague)
5. Score opportunity 0-100 (more gaps + higher budget = higher score)
6. Flag red flags honestly (e.g. operational complaints)
7. Write hookStatement as one punchy sentence that grabs attention immediately
8. pitchAngle should be the single most powerful reason they need this freelancer RIGHT NOW

Return analysis as clean valid JSON only matching schema:
{
  "opportunityScore": number,
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "estimatedMonthlyBudget": "$1,000 - $3,000",
  "gaps": [
    {
      "category": "string",
      "problem": "exact issue with metrics",
      "impact": "revenue or inquiry loss",
      "severity": "low" | "medium" | "high",
      "yourSolution": "specific deliverable"
    }
  ],
  "strengthsFound": ["string"],
  "bestServiceToPitch": "string",
  "secondaryServices": ["string"],
  "buyingSignals": ["string"],
  "redFlags": ["string"],
  "pitchAngle": "string",
  "hookStatement": "string",
  "competitorGap": "string"
}
  `;

  try {
    return await generateJSON<BusinessAnalysisOutput>(model, prompt);
  } catch (err) {
    console.warn("analyzeBusinessWithGemini fallback activated:", err);
    return buildFallbackBusinessAnalysis(input);
  }
}

function buildFallbackBusinessAnalysis(input: BusinessAnalysisInput): BusinessAnalysisOutput {
  const gaps = [];

  if (!input.hasWebsite) {
    gaps.push({
      category: "Website & Conversion",
      problem: "No official business website linked to Google Maps listing",
      impact: "Losing up to 40% of high-intent search customers who want to view menus/services online",
      severity: "high" as const,
      yourSolution: "Build a high-converting mobile-first website with direct booking/inquiry flow",
    });
  }

  if (!input.usesReels || (input.daysSinceLastPost !== null && input.daysSinceLastPost > 14)) {
    gaps.push({
      category: "Short-Form Video & Retention",
      problem: input.daysSinceLastPost ? `Inactive Instagram feed (${input.daysSinceLastPost} days since last post)` : "Zero active Reels published",
      impact: "Suppressed algorithmic reach while local competitors capture audience attention",
      severity: "medium" as const,
      yourSolution: "Produce 3-4 monthly short-form video reels highlighting key services and customer wins",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      category: "Local Digital Presence",
      problem: "Under-optimized mobile booking funnel and lack of automated DM response",
      impact: "Inbound prospects bounce to faster-responding local providers",
      severity: "medium" as const,
      yourSolution: "Deploy automated inquiry & instant reservation system",
    });
  }

  return {
    opportunityScore: Math.min(94, Math.max(65, 88 - (input.rating ? (input.rating - 4.0) * 10 : 0))),
    urgencyLevel: gaps.some((g) => g.severity === "high") ? "high" : "medium",
    estimatedMonthlyBudget: "$1,200 – $2,500 / mo",
    gaps,
    strengthsFound: [`Established local name in ${input.city || input.location}`],
    bestServiceToPitch: gaps[0]?.yourSolution || "Digital Presence & Mobile Conversion Optimization",
    secondaryServices: gaps.slice(1).map((g) => g.yourSolution),
    buyingSignals: ["Active customer reviews", "Established brand identity"],
    redFlags: [],
    pitchAngle: `Help ${input.businessName} fix their primary digital conversion bottleneck to capture more clients monthly.`,
    hookStatement: `${input.businessName} has strong core appeal, but is leaving potential monthly customer revenue on the table.`,
    competitorGap: "Nearby competing businesses actively run short-form video and 1-tap mobile booking flows.",
  };
}
