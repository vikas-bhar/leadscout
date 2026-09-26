import { GoogleGenAI } from "@google/genai";
import type { AgentAnalysis, PitchSet } from "@/types";
import type { BusinessInput } from "./filterAgent";

export type { PitchSet };

export async function runPitchAgent(
  analysis: AgentAnalysis,
  businessData: BusinessInput,
  freelancerType = "web_designer",
  freelancerSkills: string[] = ["outreach", "growth", "design"]
): Promise<PitchSet> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateHeuristicPitchSet(analysis, businessData, freelancerType);
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

    const clientType = analysis.clientProfile.personalityType || "driver";
    const channel = analysis.clientProfile.preferredChannel || "instagram_dm";
    const hook = analysis.gapAnalysis.gaps[0]?.problem || analysis.pitchStrategy.hook;
    const painPoint = analysis.clientProfile.painPoints[0] || "lost customer bookings";
    const city = businessData.city || (businessData.address || "").split(",")[0] || "your area";

    const prompt = `
You are the world's highest-converting cold outreach copywriter for freelancers.
You write bespoke, human outreach messages matched to the prospect's personality and specific data signals.

PROSPECT DATA:
Business          : ${businessData.name}
Category          : ${businessData.category || "Business"}
City/Location     : ${city}
Personality Type  : ${clientType} (${clientType === "driver" ? "Results-focused, numbers, no fluff" : clientType === "analytical" ? "Data-driven, benchmarks" : clientType === "expressive" ? "Warm, genuine compliment, story" : "Harmony, stress-relief"})
Awareness Level   : ${analysis.clientProfile.awarenessLevel}
Decision Maker    : ${analysis.clientProfile.decisionMakerType}
Best Approach     : ${analysis.clientProfile.bestApproach}
Worst Approach    : ${analysis.clientProfile.worstApproach}
Preferred Channel : ${channel}
Primary Gap       : ${hook}
Primary Pain      : ${painPoint}
Urgency Level     : ${analysis.gapAnalysis.urgencyLevel}
Opportunity Score : ${analysis.gapAnalysis.opportunityScore}

FREELANCER CONTEXT:
Specialty: ${freelancerType.replace("_", " ")}
Skills: ${freelancerSkills.join(", ")}

STRICT MESSAGE RULES:
INSTAGRAM DM:
- Max 4 sentences.
- Sentence 1: Specific authentic observation about ${businessData.name}.
- Sentence 2: Connect gap to lost money or customer appointments.
- Sentence 3: Concrete deliverable you can build for them.
- Sentence 4: Frictionless yes/no question.
- No "I noticed", no "Hi I am a", no robotic openers.

EMAIL:
- Subject line: Under 8 words, curiosity or benefit driven.
- Max 6 sentences in body.
- Clear value proposition & low-risk call to action.

WHATSAPP:
- Max 3 sentences, ultra direct, reference a specific number or gap.

FOLLOW UP SEQUENCE:
- Day 3: Gentle follow-up with free value/mockup preview.
- Day 7: New angle or competitor benchmark insight.
- Day 14: Courteous takeaway / breakup message.

OBJECTION HANDLERS:
Provide tailored responses for:
1. "We already have someone for that"
2. "We don't have budget right now"
3. "We are too busy to deal with this"
4. "We tried this before and it didn't work"
5. "Send me more information"

Respond with pure valid JSON only:
{
  "instagramDM": {
    "message": "Exact DM text",
    "characterCount": 240,
    "bestTimeToSend": "11:30 AM - 1:30 PM",
    "expectedResponseRate": "high",
    "whyThisWorks": "Explanation of psychological trigger"
  },
  "email": {
    "subject": "Quick observation regarding ${businessData.name}'s mobile booking",
    "message": "Exact email body text",
    "bestTimeToSend": "Tuesday 9:45 AM",
    "expectedResponseRate": "high",
    "whyThisWorks": "Focuses on lost revenue rather than selling hours"
  },
  "whatsapp": {
    "message": "Exact WhatsApp message",
    "bestTimeToSend": "10:15 AM",
    "expectedResponseRate": "high",
    "whyThisWorks": "Short, respectful, and numbers-grounded"
  },
  "followUpSequence": [
    {
      "dayNumber": 3,
      "channel": "Email / DM",
      "message": "Follow-up text",
      "purpose": "Offer free mockup snippet"
    },
    {
      "dayNumber": 7,
      "channel": "Email / DM",
      "message": "Follow-up text",
      "purpose": "Share competitor conversion benchmark"
    },
    {
      "dayNumber": 14,
      "channel": "Email / DM",
      "message": "Follow-up text",
      "purpose": "Respectful closed-file takeaway"
    }
  ],
  "pitchTips": ["Tip 1", "Tip 2", "Tip 3"],
  "whatToAvoid": ["Avoid generic pitch decks", "Do not talk about billable hours"],
  "objectionHandlers": [
    {
      "objection": "We already have someone for that",
      "response": "Exact response text"
    },
    {
      "objection": "We don't have budget right now",
      "response": "Exact response text"
    },
    {
      "objection": "We are too busy to deal with this",
      "response": "Exact response text"
    },
    {
      "objection": "We tried this before and it didn't work",
      "response": "Exact response text"
    },
    {
      "objection": "Send me more information",
      "response": "Exact response text"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return sanitizePitchSet(parsed, businessData, analysis);
    }
  } catch (error) {
    console.error("runPitchAgent error:", error);
  }

  return generateHeuristicPitchSet(analysis, businessData, freelancerType);
}

function sanitizePitchSet(
  raw: Record<string, unknown>,
  business: BusinessInput,
  analysis: AgentAnalysis
): PitchSet {
  const fallback = generateHeuristicPitchSet(analysis, business);

  const rawDm = (raw.instagramDM || {}) as Record<string, unknown>;
  const instagramDM = {
    message: (rawDm.message as string) || fallback.instagramDM.message,
    characterCount: Number(rawDm.characterCount || (rawDm.message as string)?.length || fallback.instagramDM.characterCount),
    bestTimeToSend: (rawDm.bestTimeToSend as string) || fallback.instagramDM.bestTimeToSend,
    expectedResponseRate: (["low", "medium", "high"].includes(rawDm.expectedResponseRate as string)
      ? rawDm.expectedResponseRate
      : "high") as "low" | "medium" | "high",
    whyThisWorks: (rawDm.whyThisWorks as string) || fallback.instagramDM.whyThisWorks,
  };

  const rawEmail = (raw.email || {}) as Record<string, unknown>;
  const email = {
    subject: (rawEmail.subject as string) || fallback.email.subject,
    message: (rawEmail.message as string) || fallback.email.message,
    bestTimeToSend: (rawEmail.bestTimeToSend as string) || fallback.email.bestTimeToSend,
    expectedResponseRate: (["low", "medium", "high"].includes(rawEmail.expectedResponseRate as string)
      ? rawEmail.expectedResponseRate
      : "high") as "low" | "medium" | "high",
    whyThisWorks: (rawEmail.whyThisWorks as string) || fallback.email.whyThisWorks,
  };

  const rawWa = (raw.whatsapp || {}) as Record<string, unknown>;
  const whatsapp = {
    message: (rawWa.message as string) || fallback.whatsapp.message,
    bestTimeToSend: (rawWa.bestTimeToSend as string) || fallback.whatsapp.bestTimeToSend,
    expectedResponseRate: (["low", "medium", "high"].includes(rawWa.expectedResponseRate as string)
      ? rawWa.expectedResponseRate
      : "high") as "low" | "medium" | "high",
    whyThisWorks: (rawWa.whyThisWorks as string) || fallback.whatsapp.whyThisWorks,
  };

  const followUpSequence = Array.isArray(raw.followUpSequence) && raw.followUpSequence.length > 0
    ? (raw.followUpSequence as PitchSet["followUpSequence"])
    : fallback.followUpSequence;

  const pitchTips = Array.isArray(raw.pitchTips) ? (raw.pitchTips as string[]) : fallback.pitchTips;
  const whatToAvoid = Array.isArray(raw.whatToAvoid) ? (raw.whatToAvoid as string[]) : fallback.whatToAvoid;
  const objectionHandlers = Array.isArray(raw.objectionHandlers) && raw.objectionHandlers.length > 0
    ? (raw.objectionHandlers as PitchSet["objectionHandlers"])
    : fallback.objectionHandlers;

  return {
    instagramDM,
    email,
    whatsapp,
    followUpSequence,
    pitchTips,
    whatToAvoid,
    objectionHandlers,
  };
}

function generateHeuristicPitchSet(
  analysis: AgentAnalysis,
  business: BusinessInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  freelancerType = "web_designer"
): PitchSet {
  const name = business.name;
  const primaryGap = analysis.gapAnalysis.gaps[0]?.problem || "digital customer booking funnel";
  const revenueLoss = analysis.gapAnalysis.gaps[0]?.estimatedRevenueLoss || "$2,500/mo";

  const dmText = `Hey team ${name}! Loved your recent local reviews — noticed a quick 2-second friction point in your ${primaryGap} that’s likely costing you 10+ client bookings every weekend. Put together a 30-second screen audit showing how to fix it. Mind if I send it over?`;

  const emailBody = `Hi ${name} team,\n\nI was looking over ${name}'s digital presence and noticed an immediate opportunity in your ${primaryGap}. Right now, potential clients searching for your services are running into drop-offs before completing a booking (costing an estimated ${revenueLoss} in unrealized appointments).\n\nI recently helped a similar local establishment increase client inquiries by 35% with a modern turnkey setup.\n\nI created a quick 30-second video mockup demonstrating the exact fix. Would it be alright if I shared the link?`;

  const waText = `Hey ${name}! Saw your high customer ratings. Noticed an easy mobile fix for your booking link that could add 10+ clients this week. Can I send a 30s screenshot?`;

  return {
    instagramDM: {
      message: dmText,
      characterCount: dmText.length,
      bestTimeToSend: "Tuesday or Thursday, 11:30 AM",
      expectedResponseRate: "high",
      whyThisWorks: "Disarms the prospect by leading with a specific revenue insight and asking a low-pressure permission question.",
    },
    email: {
      subject: `Quick observation regarding ${name}'s customer bookings`,
      message: emailBody,
      bestTimeToSend: "Tuesday 9:30 AM",
      expectedResponseRate: "high",
      whyThisWorks: "Structured in under 6 sentences with immediate financial upside and low-risk permission call-to-action.",
    },
    whatsapp: {
      message: waText,
      bestTimeToSend: "10:15 AM",
      expectedResponseRate: "high",
      whyThisWorks: "Direct, ultra-concise, and easily replyable with one word.",
    },
    followUpSequence: [
      {
        dayNumber: 3,
        channel: "Email / DM",
        message: `Hey! Just wanted to share a quick visual preview of the mockup I built for ${name}. Let me know if you’d like to see the full interactive version!`,
        purpose: "Deliver tangible upfront value before asking for a commitment",
      },
      {
        dayNumber: 7,
        channel: "Email / DM",
        message: `Hi team, saw that nearby competitors recently upgraded their mobile booking flow. I’ve outlined 3 quick wins ${name} can implement in under an hour to stay ahead. Should I send them over?`,
        purpose: "Leverage competitive urgency without being pushy",
      },
      {
        dayNumber: 14,
        channel: "Email / DM",
        message: `Hey ${name}, assume this isn’t a current priority right now so I’ll close out your file. If you ever want to streamline your digital client booking down the road, feel free to reach back out!`,
        purpose: "Polite takeaway that frequently triggers a response",
      },
    ],
    pitchTips: [
      "Always send a personalized loom video or screenshot mockup before quoting prices",
      `Reference their estimated monthly revenue gap (${revenueLoss}) rather than listing technical deliverables`,
      "Never ask for a 30-minute phone call in your first message — ask for permission to send a 30s video",
    ],
    whatToAvoid: [
      "Avoid saying 'I came across your profile' or 'Hope this email finds you well'",
      "Do not send long portfolio PDF attachments in cold DMs",
      "Do not mention hourly rates or long-term retainer commitments upfront",
    ],
    objectionHandlers: [
      {
        objection: "We already have someone handling that",
        response:
          "Totally understand! I actually put together a free 1-page gap checklist your current person can implement directly in 15 minutes to capture more bookings. Mind if I share it?",
      },
      {
        objection: "We don't have budget right now",
        response:
          "Completely fair. This specific fix is designed to generate immediate cash flow rather than create an expense. Happy to share the free guide so you can tackle it whenever timing is better.",
      },
      {
        objection: "We are too busy to deal with this",
        response:
          "That's exactly why I do 100% turnkey execution — it takes zero hours from your team and runs entirely on autopilot. Can I send a 30-second summary?",
      },
      {
        objection: "We tried this before and it didn't work",
        response:
          "Most agencies focus on vanity clicks rather than customer appointments. Here is why the previous approach stalled and how our direct-conversion structure differs.",
      },
      {
        objection: "Send me more information",
        response:
          "Awesome! Here is the 45-second screen recording and a 3-bullet breakdown of the highest-impact fixes for your profile.",
      },
    ],
  };
}
