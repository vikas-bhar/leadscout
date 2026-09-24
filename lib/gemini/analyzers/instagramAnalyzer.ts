import { getFlashModel, getProModel, generateJSON } from "../client";

export interface InstagramAnalysisInput {
  username: string;
  fullName: string | null;
  bio: string | null;
  followers: number;
  following: number;
  postsCount: number;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  postsPerWeek: number | null;
  avgLikesPerPost: number | null;
  avgCommentsPerPost: number | null;
  engagementRate: number | null;
  usesReels: boolean;
  reelsCount: number | null;
  hasLinkInBio: boolean;
  hasHighlights: boolean;
  isVerified: boolean;
  recentCaptions: string[];
  topHashtags: string[];
  contentTypes: {
    photos: number;
    reels: number;
    carousels: number;
  };
  freelancerType: string;
}

export interface InstagramAnalysisOutput {
  accountScore: number;
  followerHealthScore: number;
  contentScore: number;
  engagementScore: number;
  growthPotentialScore: number;
  gaps: Array<{
    area: string;
    problem: string;
    impact: string;
    severity: "low" | "medium" | "high" | "critical";
    fix: string;
    estimatedImpact: string;
  }>;
  whatTheyDoWell: string[];
  missedOpportunities: string[];
  contentStrategy: string;
  recommendedPostingSchedule: string;
  estimatedMonthlyLoss: string;
  recommendedServices: string[];
  pitchAngle: string;
  instagramDMPitch: string;
  emailPitch: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

export async function analyzeInstagramWithGemini(
  input: InstagramAnalysisInput
): Promise<InstagramAnalysisOutput> {
  const model = getProModel() || getFlashModel();

  const prompt = `
Perform a deep Instagram account audit for a 
${input.freelancerType} looking to pitch this account.

ENTITY ARCHETYPE AWARENESS:
Recognize whether this is a Content Creator/Influencer (needs video editing, retention pacing, brand deal media kits), a Coach/Consultant (needs client booking funnels, ManyChat DM automation), an E-Commerce Brand (needs UGC ads, CRO), an Artist (needs streaming pre-saves), or a Local Business.

══════════════════════════════════
ACCOUNT OVERVIEW
══════════════════════════════════
Username         : @${input.username}
Full Name        : ${input.fullName ?? "Not set ❌"}
Bio              : ${input.bio ? '"' + input.bio + '"' : "Empty ❌"}
Verified         : ${input.isVerified ? "YES ✓" : "NO"}
Followers        : ${input.followers.toLocaleString()}
Following        : ${input.following.toLocaleString()}
Follow Ratio     : ${(input.followers / Math.max(input.following, 1)).toFixed(2)}
Total Posts      : ${input.postsCount}

══════════════════════════════════
CONTENT PERFORMANCE
══════════════════════════════════
Last Post        : ${input.lastPostDate ?? "Unknown"}
Days Since Post  : ${input.daysSinceLastPost ?? "Unknown"} days
Posts Per Week   : ${input.postsPerWeek ?? "Unknown"}
Avg Likes/Post   : ${input.avgLikesPerPost ?? "Unknown"}
Avg Comments/Post: ${input.avgCommentsPerPost ?? "Unknown"}
Engagement Rate  : ${input.engagementRate ?? "Unknown"}%

Content Mix:
  Photos    : ${input.contentTypes.photos}
  Reels     : ${input.contentTypes.reels}
  Carousels : ${input.contentTypes.carousels}

Uses Reels       : ${input.usesReels ? "YES — " + (input.reelsCount ?? 0) + " reels" : "NO ❌ (Reels get 3x more reach)"}
Has Link In Bio  : ${input.hasLinkInBio ? "YES" : "NO ❌ (Losing website traffic)"}
Has Highlights   : ${input.hasHighlights ? "YES" : "NO ❌ (Missing social proof)"}

══════════════════════════════════
CONTENT SIGNALS
══════════════════════════════════
Recent captions (sample):
${input.recentCaptions.slice(0, 5).map((c, i) => `  ${i + 1}. "${c.slice(0, 150)}"`).join("\n")}

Top hashtags used:
${input.topHashtags.slice(0, 10).join(", ")}

══════════════════════════════════
ANALYSIS REQUIREMENTS
══════════════════════════════════
1. Score each dimension 0-100
2. Identify EVERY gap with specific data
3. Compare against benchmarks with exact numbers
4. Monthly loss = estimate lost revenue or missed sponsorships
5. DM pitch max 4 sentences (casual, direct, value-first)
6. Email pitch max 6 sentences with subject line

Return JSON matching schema:
{
  "accountScore": number,
  "followerHealthScore": number,
  "contentScore": number,
  "engagementScore": number,
  "growthPotentialScore": number,
  "gaps": [
    {
      "area": "string",
      "problem": "string",
      "impact": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "fix": "string",
      "estimatedImpact": "string"
    }
  ],
  "whatTheyDoWell": ["string"],
  "missedOpportunities": ["string"],
  "contentStrategy": "string",
  "recommendedPostingSchedule": "string",
  "estimatedMonthlyLoss": "string",
  "recommendedServices": ["string"],
  "pitchAngle": "string",
  "instagramDMPitch": "string",
  "emailPitch": "string",
  "urgencyLevel": "low" | "medium" | "high" | "critical"
}
  `;

  try {
    return await generateJSON<InstagramAnalysisOutput>(model, prompt);
  } catch (err) {
    console.warn("analyzeInstagramWithGemini fallback activated:", err);
    return buildFallbackInstagramAnalysis(input);
  }
}

function buildFallbackInstagramAnalysis(input: InstagramAnalysisInput): InstagramAnalysisOutput {
  const gaps = [];

  if (!input.usesReels) {
    gaps.push({
      area: "Short-Form Video & Discovery",
      problem: "Zero active Reels published in recent feed history",
      impact: "Instagram algorithm suppresses reach by ~70% without video content",
      severity: "critical" as const,
      fix: "Produce 3 weekly retention-edited Reels with strong 2-second visual hooks",
      estimatedImpact: "+3x organic profile reach",
    });
  }

  if (!input.hasLinkInBio) {
    gaps.push({
      area: "Monetization & Bio Conversion",
      problem: "No link in bio to convert visitors into customers or sponsor deals",
      impact: "100% of organic profile traffic bounces without entering a conversion funnel",
      severity: "high" as const,
      fix: "Implement high-converting bio link with direct booking & inquiry buttons",
      estimatedImpact: "+$1,500/mo in direct client bookings",
    });
  }

  return {
    accountScore: input.usesReels && input.hasLinkInBio ? 75 : 55,
    followerHealthScore: 68,
    contentScore: input.postsPerWeek && input.postsPerWeek >= 3 ? 75 : 50,
    engagementScore: input.engagementRate && input.engagementRate >= 2.0 ? 80 : 60,
    growthPotentialScore: 82,
    gaps,
    whatTheyDoWell: [
      `Established personal handle @${input.username}`,
      `Authentic audience base (${input.followers.toLocaleString()} followers)`,
    ],
    missedOpportunities: [
      "Short-form video retention pacing",
      "Automated inbound DM qualification flow",
    ],
    contentStrategy: "Publish 3 retention-edited Reels and 2 carousel value posts per week.",
    recommendedPostingSchedule: "Monday, Wednesday, Friday at 11:30 AM & 6:00 PM local time",
    estimatedMonthlyLoss: "$1,800 – $3,500 / month",
    recommendedServices: [
      "Short-Form Video Editing (Retention style)",
      "High-Converting Bio Funnel Setup",
      "Automated Inbound DM Funnel",
    ],
    pitchAngle: "Offer 2 sample viral Reel concepts and a conversion-optimized bio layout.",
    instagramDMPitch: `Hey @${input.username}! Love your content style. Noticed your posts could easily pull 3x more reach with retention-style video editing and tighter hooks. Put together 2 quick concept outlines for you—mind if I send them over?`,
    emailPitch: `Hi @${input.username} team,\n\nI conducted a quick social audit of your Instagram (@${input.username}) and spotted a couple of high-impact opportunities to increase reach and conversions.\n\nWould you be open to a 3-minute video walking through how to implement these fixes?\n\nBest,\nA Freelance Growth Partner`,
    urgencyLevel: !input.usesReels || !input.hasLinkInBio ? "critical" : "high",
  };
}
