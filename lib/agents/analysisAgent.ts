import { GoogleGenAI } from "@google/genai";
import type { AgentAnalysis, AgentThought } from "@/types";
import type { BusinessInput, InstagramInput } from "./filterAgent";
import { factCheckAndSanitizeGaps } from "@/lib/pipeline/gapFactChecker";
import { isValidWebsiteUrl } from "@/lib/pipeline/cleaner";

export type { AgentAnalysis, AgentThought };

export async function runAnalysisAgent(
  businessData: BusinessInput,
  instagramData: InstagramInput,
  freelancerType = "web_designer",
  freelancerSkills: string[] = ["outreach", "growth", "design"]
): Promise<AgentAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicAgentAnalysis(businessData, instagramData, freelancerType, freelancerSkills);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const reviewsSnippet = (businessData.reviews || [])
      .slice(0, 5)
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) =>
          `[${r.rating ?? 4}★] "${(r.text || "").slice(0, 150)}" ${
            r.hasOwnerResponse ? "(replied)" : "(NO REPLY)"
          }`
      )
      .join("\n");

    const prompt = `
You are an elite business development consultant with 15 years of experience helping freelancers land high-value client engagements.

Analyze this prospective business step-by-step like a detective:
Step 1 → READ the business data
Step 2 → UNDERSTAND their situation
Step 3 → IDENTIFY their pain points & root causes
Step 4 → SCORE the opportunity
Step 5 → DECIDE the best pitch angle
Step 6 → DESIGN the conversion strategy

RAW DATA:
GOOGLE MAPS:
Name          : ${businessData.name}
Category      : ${businessData.category || "Business"}
Location      : ${businessData.address || "Local"}
Rating        : ${businessData.rating ? businessData.rating + "/5" : "Unrated"}
Reviews       : ${businessData.reviewCount ?? 0}
Website       : ${businessData.website || "NONE"}
Photos        : ${businessData.photoCount ?? 0}
Phone         : ${businessData.phone || "NONE"}
Hours Listed  : ${businessData.hasHours ? "YES" : "NO"}
Price Level   : ${businessData.priceLevel || "Unknown"}
Verified      : ${businessData.isVerified ? "YES" : "NO"}

Recent Reviews:
${reviewsSnippet || "No recent reviews"}

INSTAGRAM:
Found         : ${instagramData?.found ? "YES" : "NO"}
Handle        : ${instagramData?.username ? "@" + instagramData.username : "None"}
Followers     : ${instagramData?.followers?.toLocaleString() || "N/A"}
Following     : ${instagramData?.following?.toLocaleString() || "N/A"}
Posts         : ${instagramData?.postsCount || "N/A"}
Last Post     : ${instagramData?.daysSinceLastPost !== null && instagramData?.daysSinceLastPost !== undefined ? instagramData.daysSinceLastPost + " days ago" : "N/A"}
Posts/Week    : ${instagramData?.postsPerWeek || "N/A"}
Avg Likes     : ${instagramData?.avgLikesPerPost || "N/A"}
Engagement    : ${instagramData?.engagementRate || "N/A"}%
Has Reels     : ${instagramData?.usesReels ? "YES" : "NO"}
Link In Bio   : ${instagramData?.hasLinkInBio ? "YES" : "NO"}
Bio           : "${instagramData?.bio || "Empty"}"

FREELANCER CONTEXT:
Specialty: ${freelancerType.replace("_", " ")}
Skills: ${freelancerSkills.join(", ")}

RULES:
- Be highly specific to THIS business.
- Reference exact numbers (e.g. "${businessData.reviewCount ?? 0} reviews", not "many reviews").
- Include your sequential reasoning in the thoughts array.
- Return pure valid JSON only.

Respond matching this JSON schema:
{
  "thoughts": [
    {
      "step": "Step 1: Situation Analysis",
      "reasoning": "Detailed deduction based on ratings, review counts, and website status",
      "conclusion": "Key takeaway about where this business stands"
    },
    {
      "step": "Step 2: Client Psychology",
      "reasoning": "Inference regarding owner motivations, fears, and bottlenecks",
      "conclusion": "Optimal psychological approach"
    },
    {
      "step": "Step 3: Revenue Gap & Lost Opportunity",
      "reasoning": "Calculation of customer drop-off from digital leaks",
      "conclusion": "Exact dollar impact"
    },
    {
      "step": "Step 4: Strategic Angle",
      "reasoning": "Why this specific hook beats generic agency pitches",
      "conclusion": "Lead with specific visual fix"
    }
  ],
  "clientProfile": {
    "awarenessLevel": "unaware" | "aware" | "considering",
    "painPoints": ["Point 1", "Point 2", "Point 3"],
    "motivations": ["Motivation 1", "Motivation 2"],
    "objections": ["Objection 1", "Objection 2"],
    "decisionMakerType": "owner" | "manager" | "marketing",
    "personalityType": "analytical" | "driver" | "expressive" | "amiable",
    "bestApproach": "Lead with numbers & quick 30-second visual audit",
    "worstApproach": "Pitching generic agency retainers",
    "bestTimeToContact": "Tuesday/Thursday 10:30 AM",
    "preferredChannel": "instagram_dm" | "email" | "whatsapp" | "call"
  },
  "businessIntel": {
    "estimatedRevenue": "$250k - $750k/year",
    "estimatedTeamSize": "5-15 employees",
    "growthStage": "startup" | "growing" | "established" | "declining",
    "digitalMaturity": "none" | "basic" | "intermediate" | "advanced",
    "competitorStrength": "weak" | "moderate" | "strong",
    "marketPosition": "Strong offline reputation with underdeveloped digital funnel",
    "biggestThreat": "Modern competitors capturing local digital search traffic",
    "biggestOpportunity": "Automated mobile booking funnel and short-form video reach"
  },
  "gapAnalysis": {
    "opportunityScore": 84,
    "urgencyLevel": "critical" | "high" | "medium" | "low",
    "estimatedMonthlyBudget": "$1,500 - $3,500/mo",
    "gaps": [
      {
        "id": "gap_1",
        "category": "Mobile Booking & Web Funnel",
        "problem": "Specific gap description",
        "rootCause": "Never updated legacy landing page",
        "businessImpact": "Losing 20-30 appointments weekly from mobile drop-offs",
        "estimatedRevenueLoss": "$2,500/mo",
        "severity": "high",
        "effortToFix": "medium",
        "yourSolution": "Build high-converting mobile responsive booking funnel",
        "timeToResult": "7-10 days",
        "proofPoints": ["40% increase in bookings for similar clinics"]
      }
    ],
    "priorityGap": "Primary single most painful bottleneck",
    "quickWins": ["Add direct booking link to Google Maps and IG bio", "Fix mobile button tap target"],
    "strengthsFound": ["Consistent 4.5+ star review reputation", "Established customer loyalty"],
    "redFlags": ["Unanswered negative review from last month"],
    "buyingSignals": ["Active commercial phone number", "Steady review influx"]
  },
  "pitchStrategy": {
    "angle": "Immediate revenue leak audit",
    "hook": "Fixing the 2-second mobile booking friction for weekend reservations",
    "valueProposition": "Turn existing foot traffic and search views into confirmed paying bookings",
    "socialProof": "Helped 3 local establishments boost reservation conversions by 35%",
    "callToAction": "Mind if I send a quick 30-second screen recording showing the fix?",
    "followUpStrategy": "Send a free mockup snippet 3 days later, followed by case study on day 7"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return sanitizeAgentAnalysis(parsed, businessData, instagramData, freelancerType);
    }
  } catch (error) {
    console.error("runAnalysisAgent error:", error);
  }

  return generateHeuristicAgentAnalysis(businessData, instagramData, freelancerType, freelancerSkills);
}

function sanitizeAgentAnalysis(
  raw: Record<string, unknown>,
  business: BusinessInput,
  instagram: InstagramInput,
  freelancerType = "web_designer"
): AgentAnalysis {
  const fallback = generateHeuristicAgentAnalysis(business, instagram as { found?: boolean }, freelancerType, []);

  const rawThoughts = raw.thoughts;
  const thoughts: AgentThought[] = Array.isArray(rawThoughts) && rawThoughts.length > 0
    ? (rawThoughts as AgentThought[])
    : fallback.thoughts;

  const rawClient = (raw.clientProfile || {}) as Record<string, unknown>;
  const clientProfile = {
    awarenessLevel: (["unaware", "aware", "considering"].includes(rawClient.awarenessLevel as string)
      ? rawClient.awarenessLevel
      : "aware") as "unaware" | "aware" | "considering",
    painPoints: Array.isArray(rawClient.painPoints) ? (rawClient.painPoints as string[]) : fallback.clientProfile.painPoints,
    motivations: Array.isArray(rawClient.motivations) ? (rawClient.motivations as string[]) : fallback.clientProfile.motivations,
    objections: Array.isArray(rawClient.objections) ? (rawClient.objections as string[]) : fallback.clientProfile.objections,
    decisionMakerType: (["owner", "manager", "marketing"].includes(rawClient.decisionMakerType as string)
      ? rawClient.decisionMakerType
      : "owner") as "owner" | "manager" | "marketing",
    personalityType: (["analytical", "driver", "expressive", "amiable"].includes(rawClient.personalityType as string)
      ? rawClient.personalityType
      : "driver") as "analytical" | "driver" | "expressive" | "amiable",
    bestApproach: (rawClient.bestApproach as string) || fallback.clientProfile.bestApproach,
    worstApproach: (rawClient.worstApproach as string) || fallback.clientProfile.worstApproach,
    bestTimeToContact: (rawClient.bestTimeToContact as string) || fallback.clientProfile.bestTimeToContact,
    preferredChannel: (["instagram_dm", "email", "whatsapp", "call"].includes(rawClient.preferredChannel as string)
      ? rawClient.preferredChannel
      : fallback.clientProfile.preferredChannel) as "instagram_dm" | "email" | "whatsapp" | "call",
  };

  const rawIntel = (raw.businessIntel || {}) as Record<string, unknown>;
  const businessIntel = {
    estimatedRevenue: (rawIntel.estimatedRevenue as string) || fallback.businessIntel.estimatedRevenue,
    estimatedTeamSize: (rawIntel.estimatedTeamSize as string) || fallback.businessIntel.estimatedTeamSize,
    growthStage: (["startup", "growing", "established", "declining"].includes(rawIntel.growthStage as string)
      ? rawIntel.growthStage
      : "established") as "startup" | "growing" | "established" | "declining",
    digitalMaturity: (["none", "basic", "intermediate", "advanced"].includes(rawIntel.digitalMaturity as string)
      ? rawIntel.digitalMaturity
      : fallback.businessIntel.digitalMaturity) as "none" | "basic" | "intermediate" | "advanced",
    competitorStrength: (["weak", "moderate", "strong"].includes(rawIntel.competitorStrength as string)
      ? rawIntel.competitorStrength
      : "moderate") as "weak" | "moderate" | "strong",
    marketPosition: (rawIntel.marketPosition as string) || fallback.businessIntel.marketPosition,
    biggestThreat: (rawIntel.biggestThreat as string) || fallback.businessIntel.biggestThreat,
    biggestOpportunity: (rawIntel.biggestOpportunity as string) || fallback.businessIntel.biggestOpportunity,
  };

  const rawGap = (raw.gapAnalysis || {}) as Record<string, unknown>;
  const rawGapList = Array.isArray(rawGap.gaps) && rawGap.gaps.length > 0
    ? (rawGap.gaps as Array<Record<string, unknown>>)
    : (fallback.gapAnalysis.gaps as unknown as Array<Record<string, unknown>>);

  const factCheckedGaps = factCheckAndSanitizeGaps(
    rawGapList,
    {
      website: business.website,
      rating: business.rating,
      reviewCount: business.reviewCount,
      phone: business.phone,
      photoCount: business.photoCount,
      unansweredNegativeReviews: business.unansweredNegativeReviews,
    },
    instagram
  );

  const hasNoWeb = !business.website || !isValidWebsiteUrl(business.website);

  const gapAnalysis = {
    opportunityScore: typeof rawGap.opportunityScore === "number" ? rawGap.opportunityScore : fallback.gapAnalysis.opportunityScore,
    urgencyLevel: (["critical", "high", "medium", "low"].includes(rawGap.urgencyLevel as string)
      ? rawGap.urgencyLevel
      : "high") as "critical" | "high" | "medium" | "low",
    estimatedMonthlyBudget: (rawGap.estimatedMonthlyBudget as string) || fallback.gapAnalysis.estimatedMonthlyBudget,
    gaps: factCheckedGaps as unknown as AgentAnalysis["gapAnalysis"]["gaps"],
    priorityGap: factCheckedGaps[0]?.category || (hasNoWeb ? "Missing Official Website & Mobile Funnel" : ((rawGap.priorityGap as string) || fallback.gapAnalysis.priorityGap)),
    quickWins: Array.isArray(rawGap.quickWins) ? (rawGap.quickWins as string[]) : fallback.gapAnalysis.quickWins,
    strengthsFound: Array.isArray(rawGap.strengthsFound) ? (rawGap.strengthsFound as string[]) : fallback.gapAnalysis.strengthsFound,
    redFlags: Array.isArray(rawGap.redFlags) ? (rawGap.redFlags as string[]) : [],
    buyingSignals: Array.isArray(rawGap.buyingSignals) ? (rawGap.buyingSignals as string[]) : fallback.gapAnalysis.buyingSignals,
  };

  const rawPitch = (raw.pitchStrategy || {}) as Record<string, unknown>;
  const pitchStrategy = {
    angle: (rawPitch.angle as string) || fallback.pitchStrategy.angle,
    hook: (rawPitch.hook as string) || fallback.pitchStrategy.hook,
    valueProposition: (rawPitch.valueProposition as string) || fallback.pitchStrategy.valueProposition,
    socialProof: (rawPitch.socialProof as string) || fallback.pitchStrategy.socialProof,
    callToAction: (rawPitch.callToAction as string) || fallback.pitchStrategy.callToAction,
    followUpStrategy: (rawPitch.followUpStrategy as string) || fallback.pitchStrategy.followUpStrategy,
  };

  return {
    thoughts,
    clientProfile,
    businessIntel,
    gapAnalysis,
    pitchStrategy,
  };
}

function generateHeuristicAgentAnalysis(
  business: BusinessInput,
  instagram: InstagramInput,
  freelancerType = "web_designer",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  freelancerSkills: string[] = []
): AgentAnalysis {
  const reviews = business.reviewCount ?? 0;
  const hasNoWebsite = !business.website;
  const hasDeadIg = Boolean(instagram?.found && (instagram.daysSinceLastPost ?? 0) > 21);
  const oppScore = Math.min(95, Math.max(65, (reviews > 30 ? 40 : 25) + (hasNoWebsite ? 35 : 15) + (hasDeadIg ? 20 : 10)));

  const rawInitialGaps = [
    {
      id: "gap_primary",
      category: hasNoWebsite ? "Website & Mobile Funnel" : "Conversion & Engagement Funnel",
      problem: hasNoWebsite
        ? "No mobile-responsive website or direct online booking system"
        : "Underdeveloped mobile conversion path causing customer drop-off",
      rootCause: "Relied exclusively on offline word-of-mouth without digital automation",
      businessImpact: "Losing up to 25+ high-intent booking inquiries every week",
      estimatedRevenueLoss: "$2,000 - $4,500/mo",
      severity: "high" as const,
      effortToFix: "medium",
      yourSolution: "Implement a modern high-converting mobile booking architecture",
      timeToResult: "7-10 days",
      proofPoints: ["Average 35% increase in online inquiries for local businesses"],
    },
  ];

  const checkedGaps = factCheckAndSanitizeGaps(
    rawInitialGaps as unknown as Array<Record<string, unknown>>,
    {
      website: business.website,
      rating: business.rating,
      reviewCount: business.reviewCount,
      phone: business.phone,
      photoCount: business.photoCount,
      unansweredNegativeReviews: business.unansweredNegativeReviews,
    },
    instagram
  );

  return {
    thoughts: [
      {
        step: "Step 1: Read & Triage Data",
        reasoning: `${business.name} holds ${reviews} Google reviews with a rating of ${business.rating || 4.2}★. ${hasNoWebsite ? "No website is present" : "Basic web presence is listed"}.`,
        conclusion: `Established commercial establishment with customer demand but leaking digital capture opportunities.`,
      },
      {
        step: "Step 2: Client Psychology Mapping",
        reasoning: `The owner operates daily offline customer fulfillment and is cautious about agency fees that fail to yield direct bookings.`,
        conclusion: `Approach with tangible, zero-risk proof demonstrating revenue leaks from their top gap.`,
      },
      {
        step: "Step 3: Revenue Impact Assessment",
        reasoning: `Mobile drop-off and lack of active social booking touchpoints cost estimated 15-25 client appointments monthly.`,
        conclusion: `Demonstrating a direct $2,000+/mo recovery angle makes hiring a freelance ${freelancerType.replace("_", " ")} an immediate ROI decision.`,
      },
      {
        step: "Step 4: Formulate Outreach Angle",
        reasoning: `Avoid generic cold pitch templates; lead with a direct observation and a 30-second screen audit.`,
        conclusion: `Position as an observant local specialist offering a frictionless free fix.`,
      },
    ],
    clientProfile: {
      awarenessLevel: "aware",
      painPoints: ["Inconsistent customer acquisition", "No time for marketing execution", "Outdated online presence"],
      motivations: ["Higher weekly client bookings", "Outperforming nearby competitors", "Streamlined operations"],
      objections: ["Past agencies didn't deliver", "Too busy to manage freelancers"],
      decisionMakerType: "owner",
      personalityType: "driver",
      bestApproach: "Lead with exact missed revenue numbers and an offer to share a 30-second fix video",
      worstApproach: "Sending a mass boilerplate pitch requesting a 30-minute discovery call",
      bestTimeToContact: "Tuesday or Thursday, 10:30 AM - 1:00 PM",
      preferredChannel: instagram?.found ? "instagram_dm" : "email",
    },
    businessIntel: {
      estimatedRevenue: reviews > 100 ? "$500k - $1.2M/year" : "$200k - $500k/year",
      estimatedTeamSize: reviews > 100 ? "8-20 staff" : "3-8 staff",
      growthStage: "established",
      digitalMaturity: hasNoWebsite ? "none" : "basic",
      competitorStrength: "moderate",
      marketPosition: "Recognized local brand with significant offline customer goodwill",
      biggestThreat: "Aggressive local competitors investing in modern mobile booking funnels",
      biggestOpportunity: "Turnkey digital capture architecture to turn search traffic into booked clients",
    },
    gapAnalysis: {
      opportunityScore: oppScore,
      urgencyLevel: oppScore >= 80 ? "critical" : "high",
      estimatedMonthlyBudget: "$1,500 - $3,500/mo",
      gaps: checkedGaps as unknown as AgentAnalysis["gapAnalysis"]["gaps"],
      priorityGap: checkedGaps[0]?.category || (hasNoWebsite ? "Missing Dedicated Mobile Conversion Website" : "Dead Social Booking Funnel"),
      quickWins: ["Add one-tap booking action buttons", "Optimize Google Business profile link"],
      strengthsFound: ["Established local reputation", "Positive review sentiment"],
      redFlags: [],
      buyingSignals: ["Consistent commercial operations", "Regular offline customer traffic"],
    },
    pitchStrategy: {
      angle: "Immediate booking leak recovery",
      hook: `Noticed your stellar ${business.rating || 4.5}★ rating — saw a 2-second mobile friction point costing 10+ reservations weekly`,
      valueProposition: "Capture high-intent customers actively searching for your services online",
      socialProof: "Helped similar establishments unlock 30%+ more monthly bookings",
      callToAction: "Mind if I send over a quick 30-second screenshot breakdown?",
      followUpStrategy: "Send a visual mockup on Day 3, share a short relevant case study on Day 7",
    },
  };
}
