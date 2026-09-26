import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { EnrichedBusiness } from "./stage4_enrich";
import { AIAnalysis } from "./stage5_ai";

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const geminiKey = process.env.GEMINI_API_KEY;
const genai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

export interface PitchResult {
  pitches: Array<{
    style: "instagram_dm" | "email" | "whatsapp" | "phone_script";
    tone: string;
    subject: string | null;
    message: string;
    bestTimeToSend: "morning" | "afternoon" | "evening";
    expectedResponseRate: "low" | "medium" | "high";
  }>;
  followUpMessage: string;
  secondFollowUpMessage?: string;
  coldCallScript?: string;
  pitchTips: string[];
}

export async function generatePitches(
  business: EnrichedBusiness,
  analysis: AIAnalysis,
  freelancerType: string,
  freelancerSkills: string[]
): Promise<PitchResult> {
  const prompt = `
Write 3 hyper-targeted outreach messages for this prospect:

Target Profile: ${business.name} (${business.category}) in ${business.city || business.address}
Rating: ${business.rating ? `${business.rating}/5 with ${business.reviewCount} reviews` : "Unrated"}
Biggest gap: ${analysis.gaps[0]?.problem || "Underdeveloped digital presence"}
Hook: ${analysis.hookStatement}
Pitch angle: ${analysis.pitchAngle}
Instagram: ${
    business.instagram.found
      ? `@${business.instagram.username} (${business.instagram.followers ?? 0} followers)`
      : "No Instagram found"
  }
Last post: ${
    business.instagram.daysSinceLastPost
      ? `${business.instagram.daysSinceLastPost} days ago`
      : "N/A"
  }

Freelancer Specialty: ${freelancerType}
Skills: ${freelancerSkills.join(", ")}

IMPORTANT RULES:
- Match their entity type: If they are a Creator/Influencer, talk about video editing, retention hooks, thumbnails, and brand sponsorship decks. If a Coach, talk about client booking funnels. If E-commerce, talk about UGC and Shopify conversions. If a Local business, talk about local customer bookings.
- DM: max 4 sentences, casual & direct, start with a specific compliment/observation about their content.
- Email: max 6 sentences, warm professional, include subject line.
- WhatsApp: 2-3 sentences, very direct, reference a specific number or gap.
- Never start with "Hi I am a..."
- Never say "I noticed"
- End with low-friction, easy yes/no question (e.g. "Mind if I send over 2 sample hooks?").

Return JSON:
{
  "pitches": [
    {
      "style": "instagram_dm" | "email" | "whatsapp",
      "tone": "casual_conversational" | "warm_executive" | "direct_results",
      "subject": string | null,
      "message": string,
      "bestTimeToSend": "morning" | "afternoon" | "evening",
      "expectedResponseRate": "low" | "medium" | "high"
    }
  ],
  "followUpMessage": string,
  "pitchTips": ["tip 1", "tip 2"]
}
`;

  try {
    // 1. Try OpenAI if configured
    if (openai) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: `You are an expert cold outreach copywriter.
Write hyper-personalized pitches that feel human.
Always reference specific real data about the business.
Never use generic openers.
Start with an observation about THEM specifically.
End with a low-commitment question.
Return valid JSON only.`,
          },
          { role: "user", content: prompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as PitchResult;
        if (Array.isArray(parsed.pitches) && parsed.pitches.length > 0) {
          return parsed;
        }
      }
    }

    // 2. Try Gemini Flash
    if (genai) {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert cold outreach copywriter. Generate hyper-personalized pitches in valid JSON only.\n\n${prompt}`,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as PitchResult;
        if (Array.isArray(parsed.pitches) && parsed.pitches.length > 0) {
          return parsed;
        }
      }
    }
  } catch (error) {
    console.log("Pitch generation failed, utilizing robust analytical fallback:", error);
  }

  return buildFallbackPitch(business, analysis);
}

function buildFallbackPitch(
  business: EnrichedBusiness,
  analysis: AIAnalysis
): PitchResult {
  const primaryGap = analysis.gaps[0]?.problem || "digital customer funnel";

  return {
    pitches: [
      {
        style: "instagram_dm",
        tone: "casual_friendly",
        subject: null,
        message: `Hey @${business.instagram.username || business.name.toLowerCase().replace(/\s+/g, "")}! Loved checking out ${business.name}'s menu and local reviews (${business.reviewCount} happy guests). Saw that ${primaryGap.toLowerCase()} is currently leaving extra weekend bookings on the table. Put together 2 quick ideas that could easily drive 15-20 more covers this month—mind if I send over a 60-second breakdown?`,
        bestTimeToSend: "afternoon",
        expectedResponseRate: "high",
      },
      {
        style: "email",
        tone: "warm_professional",
        subject: `Quick idea for ${business.name}'s customer inquiries`,
        message: `Hi ${business.name} team,\n\nI was looking at your ${business.rating ? `${business.rating}★ rating on Google` : "location"} and noticed ${business.name} has huge local demand, but ${primaryGap.toLowerCase()} is creating friction for new guests trying to book.\n\nI specialize in streamlining customer booking pipelines and local marketing. I mapped out a simple 3-step fix to capture this traffic directly.\n\nWould you be open to a 2-minute video breakdown of how to implement this?\n\nBest,\nYour Growth Partner`,
        bestTimeToSend: "morning",
        expectedResponseRate: "high",
      },
      {
        style: "whatsapp",
        tone: "direct_concise",
        subject: null,
        message: `Hi ${business.name}! Saw your ${business.reviewCount} Google reviews—great reputation in town. Spotted a quick opportunity with ${primaryGap.toLowerCase()} that could add 10-15 direct orders every week. Would you like me to share a quick 1-page action plan?`,
        bestTimeToSend: "evening",
        expectedResponseRate: "medium",
      },
    ],
    followUpMessage: `Hi again! Just wanted to make sure my note about ${business.name}'s ${primaryGap.toLowerCase()} didn't get buried. Happy to send those ideas over whenever you have 2 minutes—worth a quick look?`,
    pitchTips: [
      "Send the DM between 2:00 PM and 4:00 PM when managers review social notifications",
      "Attach a 10-second screen recording showing their listing versus a competitor to build instant credibility",
      "Keep the initial response zero-pressure: focus on sharing value before asking for a contract",
    ],
  };
}
