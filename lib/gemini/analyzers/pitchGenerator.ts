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

export async function generatePitchWithGemini(
  input: PitchInput
): Promise<PitchOutput> {
  const model = getCreativeModel();

  const prompt = `
You are a top 0.1% cold outreach copywriter and freelance sales engineer.
Write 4 hyper-converting, authentic outreach pitches for this opportunity.

══════════════════════════════════
PROSPECT DATA & SIGNALS
══════════════════════════════════
Business Name  : ${input.businessName}
Category       : ${input.category}
City / Area    : ${input.city}
Google Rating  : ${input.rating ? `${input.rating}★ with ${input.reviewCount} reviews` : "Unrated"}
Has Website    : ${input.hasWebsite ? "YES" : "NO (Huge website opportunity)"}
Instagram      : ${input.instagramHandle ? "@" + input.instagramHandle + " (" + (input.followers ? input.followers.toLocaleString() : "0") + " followers)" : "None active"}
Days Since Post: ${input.daysSinceLastPost ? `${input.daysSinceLastPost} days ago` : "N/A"}
Engagement     : ${input.engagementRate ? `${input.engagementRate}%` : "N/A"}

══════════════════════════════════
OPPORTUNITY INTEL
══════════════════════════════════
Primary Bottleneck : ${input.primaryGap}
Hook Statement     : ${input.hookStatement}
Angle to Exploit   : ${input.pitchAngle}
Freelancer Service : ${input.freelancerType} (${input.freelancerSkills.join(", ")})

══════════════════════════════════
COPYWRITING RULES (STRICT COMPLIANCE)
══════════════════════════════════
1. BAN LIST: NEVER use: "I noticed", "I came across", "Hope you're well", "My name is", "I am a freelancer", "Let's connect", "Synergy".
2. INSTAGRAM DM:
   - Max 3–4 sentences.
   - Start with a genuine, hyper-specific compliment or observation on their actual local standing or reviews.
   - Reveal the single biggest revenue leak (${input.primaryGap}).
   - Low-friction, easy YES/NO question offering 2 free concepts or a 45-second Loom breakdown.
3. COLD EMAIL:
   - Subject line: 3–6 words, ultra-curiosity or specific metric (e.g., "${input.businessName} + 15 extra bookings this month", "question about ${input.businessName}'s mobile bookings").
   - Max 5-6 sentences. Open with an exact observation about their business.
   - Mention the quantified impact.
   - Close with low-commitment CTA (e.g., "Mind if I send over the 2-minute video breakdown?").
4. WHATSAPP / SMS:
   - 2–3 sentences max. Direct, mobile-formatted, friendly.
   - Reference an exact number (${input.reviewCount} reviews, rating, or days since last post).
5. PHONE / VOICEMAIL SCRIPT:
   - 20-30 second conversational script for a quick discovery call or voicemail.
   - Pattern interrupt opener + specific gap + value offer.
6. FOLLOW-UP NUDGE:
   - Polite, value-added 48-hour follow up.

Return pure JSON matching:
{
  "pitches": [
    {
      "style": "instagram_dm",
      "tone": "Casual & High Response",
      "subject": null,
      "message": "string",
      "bestTimeToSend": "afternoon",
      "expectedResponseRate": "high"
    },
    {
      "style": "email",
      "tone": "Warm Executive / Direct ROI",
      "subject": "string",
      "message": "string",
      "bestTimeToSend": "morning",
      "expectedResponseRate": "high"
    },
    {
      "style": "whatsapp",
      "tone": "Direct & Punchy",
      "subject": null,
      "message": "string",
      "bestTimeToSend": "afternoon",
      "expectedResponseRate": "high"
    },
    {
      "style": "phone_script",
      "tone": "Confident & Conversational",
      "subject": null,
      "message": "string",
      "bestTimeToSend": "morning",
      "expectedResponseRate": "medium"
    }
  ],
  "followUpMessage": "string",
  "secondFollowUpMessage": "string",
  "coldCallScript": "string",
  "pitchTips": ["Tip 1", "Tip 2", "Tip 3"]
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
