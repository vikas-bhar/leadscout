import { GoogleGenAI } from "@google/genai";
import type { ClientProfile } from "@/types";
import type { BusinessInput, InstagramInput } from "./filterAgent";

export type { ClientProfile };

export async function profileClient(
  business: BusinessInput,
  instagram: InstagramInput,
  reviews: Array<{
    text?: string;
    rating?: number;
    hasOwnerResponse?: boolean;
    ownerReply?: string;
    [key: string]: unknown;
  }> = []
): Promise<ClientProfile> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicClientProfile(business, instagram);
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

    const reviewTexts = reviews
      .filter((r) => r.hasOwnerResponse)
      .slice(0, 3)
      .map((r) => `Owner replied: "${r.ownerReply || r.text || "Thank you for the review"}"`)
      .join("\n");

    const prompt = `
Profile the business owner behind this local establishment with surgical psychological precision.
Use every data signal to infer who they are and how a freelancer should approach them.

BUSINESS SIGNALS:
Name          : ${business.name}
Category      : ${business.category || "Local Business"}
Location      : ${business.address || "Local Area"}
Price Level   : ${business.priceLevel || "Unknown"}
Rating        : ${business.rating ? business.rating + "/5" : "Unrated"}
Review Count  : ${business.reviewCount ?? 0}
Has Website   : ${business.website ? "YES (" + business.website + ")" : "NO"}
Photos        : ${business.photoCount ?? 0}
Verified      : ${business.isVerified ? "YES" : "NO"}

OWNER COMMUNICATION SIGNALS:
${reviewTexts || "No owner responses found"}

INSTAGRAM SIGNALS:
Active on IG  : ${instagram?.found && (instagram?.daysSinceLastPost || 99) < 30 ? "YES" : "NO"}
Followers     : ${instagram?.followers ?? "N/A"}
Bio           : "${instagram?.bio || "None"}"
Last Post     : ${instagram?.daysSinceLastPost !== null && instagram?.daysSinceLastPost !== undefined ? instagram.daysSinceLastPost + " days ago" : "N/A"}
Uses Reels    : ${instagram?.usesReels ? "YES" : "NO"}

INFERENCE EXAMPLES:
- Restaurant with 200+ reviews + no website: Traditional founder, not tech savvy, 40-60 y/o, cares about local foot traffic & revenue, respond to ROI and competitor comparisons.
- Salon / Aesthetics with Instagram but 0 reels: Creative owner, frustrated organic reach dropped, respond to "here is why the algorithm changed and how to get client bookings".
- Home services / Contractor with missed calls / bad reviews: Busy founder, overwhelmed, needs reliable automation and automated quote funnels.

Respond with pure valid JSON only:
{
  "ownerType": "Founder / Managing Partner",
  "estimatedAge": "35-50",
  "techSavviness": "low" | "medium" | "high" | "none",
  "businessMindset": "Results & Customer Acquisition Focused",
  "primaryMotivation": "Expanding high-ticket appointment bookings and steady weekday revenue",
  "primaryFear": "Wasting money on marketing agencies that deliver zero measurable revenue",
  "currentFrustration": "Inconsistent inquiries and seeing local competitors outrank them",
  "dreamOutcome": "Full automated booking schedule with zero manual social media stress",
  "preferredTone": "direct" | "casual" | "formal" | "friendly",
  "preferredChannel": "instagram_dm" | "email" | "whatsapp" | "call",
  "bestTimeToContact": "Tuesday or Thursday, 10:30 AM - 1:00 PM",
  "responseStyle": "Direct and concise — values quick bullet points over long emails",
  "decisionSpeed": "fast" | "medium" | "slow",
  "decisionFactors": ["Clear ROI breakdown", "Low implementation friction", "Proven portfolio examples"],
  "budgetAuthority": "yes",
  "approvalNeeded": "Sole decision maker",
  "likelyObjections": [
    {
      "objection": "We already have enough word of mouth",
      "underlyingFear": "Fear of complex tech disruptions",
      "howToHandle": "Acknowledge reputation, show how digital funnel captures clients already searching for them"
    },
    {
      "objection": "Send me an email with your pricing",
      "underlyingFear": "Avoiding high-pressure sales calls",
      "howToHandle": "Send a 60-second video audit with 2 free quick wins before quoting"
    }
  ],
  "perfectFirstMessage": "Hey [Name], noticed your stellar 4.8★ reviews on [Street] — saw your mobile booking link has a quick 2-second fix that could add 10+ reservations this weekend. Mind if I send a 30s screenshot?",
  "topicToAvoid": "Jargon like 'synergy', 'algorithm optimizations', or complex tech stacks",
  "topicToLeadWith": "Lost revenue from missed mobile bookings and customer conversion leaks",
  "awarenessLevel": "aware",
  "personalityType": "driver" | "analytical" | "expressive" | "amiable",
  "decisionMakerType": "owner" | "manager" | "marketing",
  "bestApproach": "Lead directly with missed revenue numbers and a 30-second visual audit",
  "worstApproach": "Generic agency pitch deck asking for a 30-minute discovery call",
  "painPoints": ["Inconsistent lead flow", "No time for social media", "Outdated website"],
  "motivations": ["Dominate local neighborhood", "Higher average order value"],
  "objections": ["Too busy right now", "Past agency burned budget"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return sanitizeClientProfile(parsed, business, instagram);
    }
  } catch (error) {
    console.error("Client profiler agent error:", error);
  }

  return generateHeuristicClientProfile(business, instagram);
}

function sanitizeClientProfile(
  raw: Record<string, unknown>,
  business: BusinessInput,
  instagram: InstagramInput
): ClientProfile {
  return {
    ownerType: (raw.ownerType as string) || "Managing Owner / Founder",
    estimatedAge: (raw.estimatedAge as string) || "35-50",
    techSavviness: (["none", "low", "medium", "high"].includes(raw.techSavviness as string)
      ? raw.techSavviness
      : "low") as "none" | "low" | "medium" | "high",
    businessMindset: (raw.businessMindset as string) || "Pragmatic, growth-focused",
    primaryMotivation:
      (raw.primaryMotivation as string) || "Increasing consistent customer inquiries and bookings",
    primaryFear:
      (raw.primaryFear as string) || "Wasting marketing budget on vanity metrics that don't generate cash flow",
    currentFrustration:
      (raw.currentFrustration as string) || "Unreliable marketing consistency while running daily operations",
    dreamOutcome:
      (raw.dreamOutcome as string) || "Hands-off high-converting digital presence that generates steady clients",
    preferredTone: (["formal", "casual", "direct", "friendly"].includes(raw.preferredTone as string)
      ? raw.preferredTone
      : "direct") as "formal" | "casual" | "direct" | "friendly",
    preferredChannel: (["instagram_dm", "email", "whatsapp", "call"].includes(raw.preferredChannel as string)
      ? raw.preferredChannel
      : instagram?.found ? "instagram_dm" : "email") as "instagram_dm" | "email" | "whatsapp" | "call",
    bestTimeToContact: (raw.bestTimeToContact as string) || "Tuesday - Thursday, 10:00 AM - 1:00 PM",
    responseStyle: (raw.responseStyle as string) || "Direct, action-oriented, responds quickly to clear visual proof",
    decisionSpeed: (["fast", "medium", "slow"].includes(raw.decisionSpeed as string)
      ? raw.decisionSpeed
      : "medium") as "fast" | "medium" | "slow",
    decisionFactors: Array.isArray(raw.decisionFactors) && raw.decisionFactors.length > 0
      ? (raw.decisionFactors as string[])
      : ["Clear revenue upside", "Low time commitment required from staff", "Verifiable track record"],
    budgetAuthority: (["yes", "maybe", "no"].includes(raw.budgetAuthority as string)
      ? raw.budgetAuthority
      : "yes") as "yes" | "maybe" | "no",
    approvalNeeded: (raw.approvalNeeded as string) || "Primary decision maker",
    likelyObjections: Array.isArray(raw.likelyObjections) && raw.likelyObjections.length > 0
      ? (raw.likelyObjections as Array<{ objection: string; underlyingFear: string; howToHandle: string }>)
      : [
          {
            objection: "We don't have budget for marketing right now",
            underlyingFear: "Fear of sunk costs without ROI guarantee",
            howToHandle: "Frame the service as fixing revenue leaks rather than an added operational expense",
          },
          {
            objection: "Send me some info to look over",
            underlyingFear: "Wanting to avoid long sales pitches",
            howToHandle: "Send a quick 3-bullet breakdown and a 30-second loom or mockup image",
          },
        ],
    perfectFirstMessage:
      (raw.perfectFirstMessage as string) ||
      `Hey team ${business.name}! Loved your recent local ratings — noticed your booking funnel has a quick 2-minute mobile fix that could unlock 15+ more reservations weekly. Would love to send a quick mockup if helpful!`,
    topicToAvoid: (raw.topicToAvoid as string) || "Technical buzzwords and abstract design jargon",
    topicToLeadWith: (raw.topicToLeadWith as string) || "Direct customer booking conversions and local market dominance",
    awarenessLevel: (["unaware", "aware", "considering"].includes(raw.awarenessLevel as string)
      ? raw.awarenessLevel
      : "aware") as "unaware" | "aware" | "considering",
    personalityType: (["analytical", "driver", "expressive", "amiable"].includes(raw.personalityType as string)
      ? raw.personalityType
      : "driver") as "analytical" | "driver" | "expressive" | "amiable",
    decisionMakerType: (["owner", "manager", "marketing"].includes(raw.decisionMakerType as string)
      ? raw.decisionMakerType
      : "owner") as "owner" | "manager" | "marketing",
    bestApproach: (raw.bestApproach as string) || "Lead with a specific revenue gap observation and a zero-risk free asset",
    worstApproach: (raw.worstApproach as string) || "Sending a generic mass template asking for a 30-minute call",
    painPoints: Array.isArray(raw.painPoints) ? (raw.painPoints as string[]) : ["Inconsistent inquiries", "Underdeveloped mobile presence"],
    motivations: Array.isArray(raw.motivations) ? (raw.motivations as string[]) : ["Local prestige", "Consistent revenue growth"],
    objections: Array.isArray(raw.objections) ? (raw.objections as string[]) : ["Time constraints", "Budget caution"],
  };
}

function generateHeuristicClientProfile(
  business: BusinessInput,
  instagram: InstagramInput
): ClientProfile {
  const category = business.category || "Business";
  const hasIg = Boolean(instagram?.found);

  return {
    ownerType: "Founder & Operator",
    estimatedAge: "38-52",
    techSavviness: "low",
    businessMindset: "Direct ROI & Operational Stability",
    primaryMotivation: `Capturing more high-paying ${category.toLowerCase()} clients consistently`,
    primaryFear: "Spending money on retainers with no tangible customer footfall or sales",
    currentFrustration: "Seeing newer competitors win customers through modern online presence",
    dreamOutcome: "Consistent flow of inbound booking inquiries on autopilot",
    preferredTone: "direct",
    preferredChannel: hasIg ? "instagram_dm" : "email",
    bestTimeToContact: "Tuesday & Thursday, 11:00 AM - 1:00 PM",
    responseStyle: "Quick to respond when value is shown upfront visually",
    decisionSpeed: "medium",
    decisionFactors: ["Transparent pricing", "Fast turnaround", "Tangible deliverables"],
    budgetAuthority: "yes",
    approvalNeeded: "Primary owner decision maker",
    likelyObjections: [
      {
        objection: "We rely mostly on word of mouth",
        underlyingFear: "Reluctance to change what has worked previously",
        howToHandle: "Show that digital presence enhances word of mouth when referred clients look them up online",
      },
      {
        objection: "Too busy running the business",
        underlyingFear: "Fear of having to spend hours managing the freelancer",
        howToHandle: "Emphasize 100% turnkey execution with zero time required from their staff",
      },
    ],
    perfectFirstMessage: `Hey ${business.name} team! Noticed your strong presence in the area — saw your primary conversion link has a quick fix that could add 10+ client bookings weekly. Mind if I share a 30s visual audit?`,
    topicToAvoid: "Complex agency retainer packages & vanity metrics like impressions",
    topicToLeadWith: "Immediate customer booking conversion and competitor gap fixes",
    awarenessLevel: "aware",
    personalityType: "driver",
    decisionMakerType: "owner",
    bestApproach: "Value-first observation with proof of revenue impact",
    worstApproach: "Generic copied outreach template",
    painPoints: ["Time shortage", "Unrealized online revenue", "Inconsistent branding"],
    motivations: ["Higher profitability", "Community authority", "Automation"],
    objections: ["Past agency skepticism", "Budget constraints"],
  };
}
