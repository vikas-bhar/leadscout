import { getCreativeModel, generateJSON } from "../client";

export interface PitchInput {
  businessName: string;
  category: string;
  city: string;
  primaryGap: string;
  hookStatement: string;
  pitchAngle: string;
  instagramHandle: string | null;
  followers: number | null;
  daysSinceLastPost: number | null;
  engagementRate: number | null;
  hasWebsite: boolean;
  rating: number | null;
  reviewCount: number;
  freelancerType: string;
  freelancerSkills: string[];
}

export interface PitchOutput {
  pitches: Array<{
    style: "instagram_dm" | "email" | "whatsapp";
    tone: string;
    subject: string | null;
    message: string;
    bestTimeToSend: "morning" | "afternoon" | "evening";
    expectedResponseRate: "low" | "medium" | "high";
  }>;
  followUpMessage: string;
  pitchTips: string[];
}

export async function generatePitchWithGemini(
  input: PitchInput
): Promise<PitchOutput> {
  const model = getCreativeModel();

  const prompt = `
Write 3 outreach messages for this specific opportunity.
Each must feel personally written, not templated.

══════════════════════════════════
BUSINESS INTEL
══════════════════════════════════
Business       : ${input.businessName}
Category       : ${input.category}
City           : ${input.city}
Google Rating  : ${input.rating}/5 (${input.reviewCount} reviews)
Has Website    : ${input.hasWebsite ? "YES" : "NO"}
Instagram      : ${input.instagramHandle ? "@" + input.instagramHandle + " (" + input.followers?.toLocaleString() + " followers)" : "None found"}
Last Post      : ${input.daysSinceLastPost ? input.daysSinceLastPost + " days ago" : "N/A"}
Engagement     : ${input.engagementRate ? input.engagementRate + "%" : "N/A"}

══════════════════════════════════
PITCH STRATEGY
══════════════════════════════════
Primary Gap    : ${input.primaryGap}
Hook           : ${input.hookStatement}
Pitch Angle    : ${input.pitchAngle}

══════════════════════════════════
FREELANCER
══════════════════════════════════
Type   : ${input.freelancerType}
Skills : ${input.freelancerSkills.join(", ")}

══════════════════════════════════
WRITING RULES — FOLLOW EXACTLY
══════════════════════════════════

INSTAGRAM DM (max 4 sentences):
  ✅ Start with a specific compliment or observation
  ✅ Mention one exact metric (${input.followers ? input.followers.toLocaleString() + " followers" : "recent review rating"})
  ✅ Connect the gap to their lost revenue / bookings
  ✅ End with easy yes/no question
  ❌ Never start with "Hi I am..."
  ❌ Never say "I noticed" or "I came across"
  ❌ Never use "hope this finds you well"

EMAIL (max 6 sentences, needs subject line):
  ✅ Subject: specific, curiosity-driven, under 8 words
  ✅ Open with their specific situation
  ✅ One social proof line (result you got for similar client)
  ✅ Clear simple ask
  ❌ No long intros

WHATSAPP (2-3 sentences max):
  ✅ Ultra direct
  ✅ Include one specific number from their data
  ✅ Immediate value offer
  ✅ Simple question to respond to

ALL THREE:
  ✅ Sound like a real human texted/emailed this
  ✅ Reference their actual business name: ${input.businessName}
  ✅ Reference their actual city: ${input.city}

Return JSON with schema:
{
  "pitches": [
    {
      "style": "instagram_dm" | "email" | "whatsapp",
      "tone": "Direct & value-first" | "Warm executive" | "Conversational",
      "subject": string | null,
      "message": "string",
      "bestTimeToSend": "morning" | "afternoon" | "evening",
      "expectedResponseRate": "low" | "medium" | "high"
    }
  ],
  "followUpMessage": "string",
  "pitchTips": ["string"]
}
  `;

  try {
    return await generateJSON<PitchOutput>(model, prompt);
  } catch (err) {
    console.warn("generatePitchWithGemini fallback activated:", err);
    return buildFallbackPitch(input);
  }
}

function buildFallbackPitch(input: PitchInput): PitchOutput {
  const name = input.businessName;
  const city = input.city || "your area";

  return {
    pitches: [
      {
        style: "instagram_dm",
        tone: "Direct & value-first",
        subject: null,
        message: `Hey ${name} team! Loved checking out your page in ${city}. I noticed your profile could easily capture more direct bookings by turning customer transformations into short-form Reels. Put together 2 sample video concepts for you—mind if I send them over?`,
        bestTimeToSend: "morning",
        expectedResponseRate: "high",
      },
      {
        style: "email",
        tone: "Professional growth strategist",
        subject: `Quick improvement for ${name} (${city})`,
        message: `Hi ${name} team,\n\nI was analyzing top ${input.category.toLowerCase()} businesses in ${city} and came across your listing.\n\nYour reviews are strong (${input.rating ?? 4.5}★), but I noticed a couple of digital gaps that are likely costing you weekly appointments:\n1. ${input.primaryGap || "Under-optimized mobile booking flow"}\n2. Untapped short-form video reach\n\nI specialize in helping businesses fix this exact setup. Would you be open to a 3-minute video showing the fixes?\n\nBest,\nA Freelance Growth Partner`,
        bestTimeToSend: "morning",
        expectedResponseRate: "medium",
      },
      {
        style: "whatsapp",
        tone: "Direct & friendly",
        subject: null,
        message: `Hi ${name}! Found you in ${city}. You have great ratings, but I noticed an easy fix to capture more direct bookings from smartphones. Made a quick idea preview—would you like to see it?`,
        bestTimeToSend: "morning",
        expectedResponseRate: "medium",
      },
    ],
    followUpMessage: `Hey! Just floating this back up. Did you get a chance to review the quick ideas I sent for ${name}? Happy to answer any questions!`,
    pitchTips: [
      `Reference their local area (${city}) to establish credibility`,
      `Highlight mobile booking convenience`,
      `Follow up within 48 hours if no response`,
    ],
  };
}
