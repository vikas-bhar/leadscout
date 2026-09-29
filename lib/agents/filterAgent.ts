import { GoogleGenAI } from "@google/genai";
import type { FilterResult, FilterDecision } from "@/types";

export type { FilterDecision, FilterResult };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BusinessInput = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InstagramInput = any;

// FILTER RULES ENGINE
// These run BEFORE AI to save tokens and speed up execution
export function applyHardFilters(
  business: BusinessInput,
  instagram: InstagramInput
): {
  passed: boolean;
  reason: string;
} {
  const reviewCount = Number(business?.reviewCount ?? 0);

  // Hard reject — business closed
  if (business?.isPermanentlyClosed) {
    return { passed: false, reason: "Business is permanently closed" };
  }

  // Hard reject — too few reviews (not established, zero budget potential)
  if (reviewCount > 0 && reviewCount < 4) {
    return { passed: false, reason: "Too few reviews — business not established" };
  }

  // Hard reject — perfect business (already dominates, not an outreach candidate)
  if (
    (business?.rating || 0) >= 4.85 &&
    reviewCount > 600 &&
    business?.website &&
    (business?.photoCount || 0) > 30 &&
    instagram?.found &&
    (instagram?.followers || 0) > 20000 &&
    (instagram?.engagementRate || 0) > 3.5 &&
    (instagram?.daysSinceLastPost || 999) < 3
  ) {
    return {
      passed: false,
      reason: "Business is performing at enterprise peak with no digital gaps",
    };
  }

  // Soft filters — count gaps
  const gapCount = [
    !business?.website,
    (business?.rating || 5) < 4.2,
    (business?.photoCount || 0) < 8,
    !business?.phone,
    !business?.hasHours,
    !instagram?.found,
    (instagram?.daysSinceLastPost || 0) > 21,
    (instagram?.engagementRate || 99) < 1.8,
    !instagram?.hasLinkInBio,
    !instagram?.usesReels,
  ].filter(Boolean).length;

  if (gapCount === 0) {
    return {
      passed: false,
      reason: "No significant digital gaps detected across website, Google Maps, or Instagram",
    };
  }

  return { passed: true, reason: "Passed hard qualification filters" };
}

// SMART FILTER — AI powered
export async function runFilterAgent(
  business: BusinessInput,
  instagram: InstagramInput,
  freelancerType = "web_designer"
): Promise<FilterResult> {
  // 1. Run hard filters (0 tokens)
  const hardFilter = applyHardFilters(business, instagram);
  if (!hardFilter.passed) {
    return {
      decision: "skip",
      confidence: 0.99,
      score: 0,
      reasoning: hardFilter.reason,
      positiveSignals: [],
      negativeSignals: [hardFilter.reason],
      estimatedCloseRate: "0%",
      estimatedDealSize: "$0",
      estimatedTimeToClose: "N/A",
      priority: "someday",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackFilterEvaluation(business, instagram);
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

    const prompt = `
You are an expert sales qualification filter agent. Decide if this business is worth pursuing for a ${freelancerType.replace("_", " ")}.

Be ruthlessly honest. Only mark as "pursue" if there is a real digital gap AND budget signal.

BUSINESS:
Name          : ${business.name}
Category      : ${business.category || "Local Business"}
Location      : ${business.address || "Local Area"}
Rating        : ${business.rating ? business.rating + "/5" : "Unrated"}
Reviews       : ${business.reviewCount ?? 0}
Website       : ${business.website || "NONE"}
Photos        : ${business.photoCount ?? 0}
Price Level   : ${business.priceLevel || "Unknown"}
Verified      : ${business.isVerified ? "YES" : "NO"}

INSTAGRAM:
Has Profile   : ${instagram?.found ? "YES" : "NO"}
Followers     : ${instagram?.followers ?? "N/A"}
Last Post     : ${instagram?.daysSinceLastPost !== null && instagram?.daysSinceLastPost !== undefined ? instagram.daysSinceLastPost + " days ago" : "N/A"}
Engagement    : ${instagram?.engagementRate !== null && instagram?.engagementRate !== undefined ? instagram.engagementRate + "%" : "N/A"}
Uses Reels    : ${instagram?.usesReels ? "YES" : "NO"}

FILTER CRITERIA:
pursue  → Clear digital gap + established revenue/budget signal + likely to respond
maybe   → Some gaps but borderline budget or unverified signals
skip    → No real gaps, poor product rating, or no budget

Respond with pure valid JSON only:
{
  "decision": "pursue" | "maybe" | "skip",
  "confidence": 0.85,
  "score": 82,
  "reasoning": "Clear explanation referencing exact data",
  "positiveSignals": ["100+ reviews", "No mobile website", "Active offline presence"],
  "negativeSignals": ["Inactive on Instagram for 45 days"],
  "estimatedCloseRate": "25-35%",
  "estimatedDealSize": "$1,500 - $3,000",
  "estimatedTimeToClose": "7-14 days",
  "priority": "immediate" | "this_week" | "this_month" | "someday"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        decision: (["pursue", "maybe", "skip"].includes(parsed.decision) ? parsed.decision : "pursue") as FilterDecision,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
        score: typeof parsed.score === "number" ? parsed.score : 80,
        reasoning: parsed.reasoning || "Qualified prospect with identifiable digital gaps.",
        positiveSignals: Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals : ["Established local business"],
        negativeSignals: Array.isArray(parsed.negativeSignals) ? parsed.negativeSignals : [],
        estimatedCloseRate: parsed.estimatedCloseRate || "25%",
        estimatedDealSize: parsed.estimatedDealSize || "$1,500 - $3,000",
        estimatedTimeToClose: parsed.estimatedTimeToClose || "7-14 days",
        priority: (["immediate", "this_week", "this_month", "someday"].includes(parsed.priority) ? parsed.priority : "this_week") as "immediate" | "this_week" | "this_month" | "someday",
      };
    }
  } catch (error) {
    console.error("Filter agent AI call error:", error);
  }

  return fallbackFilterEvaluation(business, instagram);
}

function fallbackFilterEvaluation(
  business: BusinessInput,
  instagram: InstagramInput
): FilterResult {
  const reviews = business.reviewCount ?? 0;
  const hasNoWebsite = !business.website;
  const isDeadIg = Boolean(instagram?.found && (instagram?.daysSinceLastPost || 0) > 30);
  const isNoIg = !instagram?.found;

  const positiveSignals: string[] = [];
  if (reviews >= 50) positiveSignals.push(`${reviews} Google reviews indicating steady revenue`);
  if (hasNoWebsite) positiveSignals.push("Missing official website presence");
  if (isDeadIg) positiveSignals.push(`Instagram inactive for ${instagram?.daysSinceLastPost ?? 30}+ days`);
  if (isNoIg) positiveSignals.push("No discoverable Instagram account");

  const score = Math.min(100, Math.max(30, (reviews >= 30 ? 40 : 20) + (hasNoWebsite ? 30 : 0) + (isDeadIg || isNoIg ? 25 : 0)));
  const decision: FilterDecision = score >= 65 ? "pursue" : score >= 45 ? "maybe" : "skip";

  return {
    decision,
    confidence: 0.88,
    score,
    reasoning: `Business has ${reviews} reviews with ${hasNoWebsite ? "no website" : "basic website"} and ${isDeadIg ? "inactive Instagram" : isNoIg ? "no Instagram presence" : "active social presence"}.`,
    positiveSignals,
    negativeSignals: reviews < 15 ? ["Lower review count"] : [],
    estimatedCloseRate: score >= 70 ? "30%" : "15%",
    estimatedDealSize: reviews > 100 ? "$2,500 - $5,000" : "$1,000 - $2,500",
    estimatedTimeToClose: "7-14 days",
    priority: score >= 80 ? "immediate" : score >= 60 ? "this_week" : "this_month",
  };
}
