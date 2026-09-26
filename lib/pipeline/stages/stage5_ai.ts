import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { EnrichedBusiness } from "./stage4_enrich";
import { PIPELINE_CONFIG } from "../config";

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const geminiKey = process.env.GEMINI_API_KEY;
const genai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

export interface AIAnalysis {
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
  competitorGap: string;
  bestServiceToPitch: string;
  secondaryServices: string[];
  buyingSignals: string[];
  redFlags: string[];
  pitchAngle: string;
  hookStatement: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeWithAI(
  business: EnrichedBusiness,
  freelancerType: string,
  freelancerSkills: string[],
  onProgress?: (message: string) => void
): Promise<AIAnalysis> {
  onProgress?.(`Analyzing ${business.name}...`);

  for (let attempt = 1; attempt <= PIPELINE_CONFIG.retries.ai; attempt++) {
    try {
      const prompt = buildAnalysisPrompt(business, freelancerType, freelancerSkills);

      // 1. Try OpenAI if API key configured
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: `You are an elite business analyst for freelancers.
Analyze businesses and identify gaps. Be specific and data-driven.
Always reference exact numbers from the data provided.
Never give generic advice. Return valid JSON only.`,
            },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const analysis = JSON.parse(content) as AIAnalysis;
          if (analysis.opportunityScore && Array.isArray(analysis.gaps)) {
            return sanitizeAnalysis(analysis, business);
          }
        }
      }

      // 2. Try Gemini Flash if configured
      if (genai) {
        const response = await genai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are an elite business analyst for freelancers. Analyze this business and identify concrete gaps based on the data. Return pure valid JSON only matching the schema.\n\n${prompt}`,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim();
        if (text) {
          const analysis = JSON.parse(text) as AIAnalysis;
          if (analysis.opportunityScore && Array.isArray(analysis.gaps)) {
            return sanitizeAnalysis(analysis, business);
          }
        }
      }
    } catch (error) {
      console.log(`AI analysis attempt ${attempt} failed for ${business.name}:`, error);

      if (attempt < PIPELINE_CONFIG.retries.ai) {
        await sleep(PIPELINE_CONFIG.retries.delayBetweenRetries);
      }
    }
  }

  return buildFallbackAnalysis(business);
}

function sanitizeAnalysis(analysis: AIAnalysis, business: EnrichedBusiness): AIAnalysis {
  return {
    opportunityScore: Math.min(100, Math.max(10, Number(analysis.opportunityScore) || 70)),
    urgencyLevel: ["low", "medium", "high", "critical"].includes(analysis.urgencyLevel)
      ? analysis.urgencyLevel
      : "high",
    estimatedMonthlyBudget: analysis.estimatedMonthlyBudget || "$1,000 - $2,500/mo",
    gaps: Array.isArray(analysis.gaps) && analysis.gaps.length > 0
      ? analysis.gaps
      : buildFallbackAnalysis(business).gaps,
    strengthsFound: Array.isArray(analysis.strengthsFound) ? analysis.strengthsFound : ["Established local presence"],
    competitorGap: analysis.competitorGap || "Competitors actively utilize short-form video & responsive booking funnels.",
    bestServiceToPitch: analysis.bestServiceToPitch || "Digital Presence & Content Funnel Architecture",
    secondaryServices: Array.isArray(analysis.secondaryServices) ? analysis.secondaryServices : ["Local SEO Optimization", "Social Media Management"],
    buyingSignals: Array.isArray(analysis.buyingSignals) ? analysis.buyingSignals : ["Active customer reviews", "Established physical address"],
    redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
    pitchAngle: analysis.pitchAngle || `${business.name} has ${business.totalGapCount} digital growth opportunities`,
    hookStatement: analysis.hookStatement || `Discovered ${business.totalGapCount} untapped areas to scale inquiries for ${business.name}`,
  };
}

function buildAnalysisPrompt(
  business: EnrichedBusiness,
  freelancerType: string,
  freelancerSkills: string[]
): string {
  return `
Analyze this profile/business for a ${freelancerType} 
with skills: ${freelancerSkills.join(", ")}

IMPORTANT DOMAIN KNOWLEDGE:
Understand that not all profiles are local brick-and-mortar stores. Some are:
- Content Creators / Influencers (need brand sponsorships, media kits, viral short-form video editing, retention pacing, YouTube repurposing)
- Coaches / Consultants / Speakers (need high-ticket booking funnels, ManyChat DM automation, VSLs)
- E-commerce / D2C Brands (need UGC video ads, Shopify conversion rate optimization, email flows)
- Artists / Musicians (need Spotify pre-saves, behind-the-scenes video storytelling, merch drops)
- Media Channels / Podcasts (need viral micro-clips, animated subtitles, newsletter opt-ins)
- Local Businesses (need local foot traffic, mobile booking funnels, Google Maps reviews)

Determine their true archetype and tailor your identified gaps, best services, and pitch angle to what they actually do!

GOOGLE / DIRECTORY DATA:
Name: ${business.name} (${business.category})
Location: ${business.address}
Rating: ${business.rating ?? "No rating"}/5 
Reviews: ${business.reviewCount}
Unanswered negative reviews: ${business.unansweredNegativeReviews}
Has website: ${business.website ? "YES — " + business.website : "NO"}
Photo count: ${business.photoCount}
Hours listed: ${business.hasHours ? "YES" : "NO"}
Phone listed: ${business.phone ? "YES" : "NO"}
Business size: ${business.estimatedBusinessSize}
Budget signal: ${business.budgetSignal}

INSTAGRAM DATA:
Has Instagram: ${business.instagram.found ? "YES" : "NO"}
Username: ${business.instagram.username ?? "N/A"}
Followers: ${business.instagram.followers ?? "N/A"}
Last post: ${business.instagram.lastPostDate ?? "N/A"}
Days since last post: ${business.instagram.daysSinceLastPost ?? "N/A"}
Posts per week: ${business.instagram.postsPerWeek ?? "N/A"}
Engagement rate: ${business.instagram.engagementRate ?? "N/A"}%
Uses reels: ${business.instagram.usesReels ? "YES" : "NO"}
Link in bio: ${business.instagram.hasLinkInBio ? "YES" : "NO"}

INDUSTRY BENCHMARKS:
Avg engagement: ${business.industryBenchmarks.avgEngagement}%
Avg followers: ${business.industryBenchmarks.avgFollowers}
Avg post frequency: ${business.industryBenchmarks.avgPostFrequency}x/week

Return JSON with:
{
  "opportunityScore": number 0-100,
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "estimatedMonthlyBudget": "$1,000 - $3,000",
  "gaps": [
    {
      "category": "Short-Form Video / Brand Sponsorships / Bio Funnel / Website",
      "problem": "exact issue tailored to their creator/business archetype",
      "impact": "revenue, brand deal, or audience loss",
      "severity": "low" | "medium" | "high",
      "yourSolution": "specific service deliverable freelancer provides"
    }
  ],
  "strengthsFound": ["string"],
  "competitorGap": "string",
  "bestServiceToPitch": "string",
  "secondaryServices": ["string"],
  "buyingSignals": ["string"],
  "redFlags": ["string"],
  "pitchAngle": "string",
  "hookStatement": "string"
}
`;
}

function buildFallbackAnalysis(business: EnrichedBusiness): AIAnalysis {
  const score = Math.min(business.totalGapCount * 18, 92);
  const gaps: AIAnalysis["gaps"] = [];

  if (business.gaps.noWebsite) {
    gaps.push({
      category: "Website Presence",
      problem: "No professional website or direct booking portal",
      impact: "Losing customers to competitors with frictionless online menus & booking",
      severity: "high",
      yourSolution: "Build a high-speed mobile-first website with automated reservations",
    });
  }

  if (business.gaps.fewPhotos) {
    gaps.push({
      category: "Visual Authority",
      problem: `Only ${business.photoCount} photos uploaded on Google listing`,
      impact: "High drop-off rate from browsing customers seeking ambiance and menus",
      severity: "medium",
      yourSolution: "Deliver a curated photo package highlighting interior, dishes, and staff",
    });
  }

  if (business.instagram.gaps.noInstagram || business.instagram.gaps.deadAccount) {
    gaps.push({
      category: "Social Engagement",
      problem: business.instagram.gaps.noInstagram ? "No active Instagram profile found" : "Instagram profile has been inactive for over 30 days",
      impact: "Missing viral reach and recurring local customer awareness",
      severity: "high",
      yourSolution: "Launch a weekly Reels & stories content calendar targeting local foodies",
    });
  }

  if (gaps.length === 0) {
    gaps.push({
      category: "Digital Growth",
      problem: "Under-optimized local SEO and short-form video presence",
      impact: "Leaving top-of-funnel customer discovery on the table",
      severity: "medium",
      yourSolution: "Comprehensive local visibility audit and video marketing strategy",
    });
  }

  return {
    opportunityScore: Math.max(50, score),
    urgencyLevel: score > 70 ? "critical" : score > 55 ? "high" : "medium",
    estimatedMonthlyBudget: business.budgetSignal === "high" ? "$1,500 - $3,500/mo" : "$600 - $1,200/mo",
    gaps,
    strengthsFound: [
      business.rating && business.rating > 4.0 ? `Solid ${business.rating}★ Google reputation` : "Established physical venue",
      business.reviewCount > 20 ? `${business.reviewCount} customer reviews` : "Authentic neighborhood presence",
    ],
    competitorGap: "Leading competitors post daily reels and direct customers to streamlined mobile booking links.",
    bestServiceToPitch: business.gaps.noWebsite ? "Website & Conversion Funnel" : "Short-Form Reels & Social Engine",
    secondaryServices: ["Google Business Profile SEO", "Review Management", "Local Ad Campaigns"],
    buyingSignals: ["Active customer inquiries", "Physical footprint with steady foot traffic"],
    redFlags: [],
    pitchAngle: `${business.name} has ${business.totalGapCount} high-leverage digital gaps that can be solved immediately.`,
    hookStatement: `Discovered ${business.totalGapCount} untapped customer acquisition channels for ${business.name}`,
  };
}
