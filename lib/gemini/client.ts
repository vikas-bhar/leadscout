import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Safety settings — relaxed for business analysis
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Primary model — fast and cheap
export function getFlashModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: SAFETY_SETTINGS,
    systemInstruction: `
      You are an elite business intelligence analyst
      specializing in digital marketing gaps for
      freelancers. You analyze businesses with 
      surgical precision and identify exactly what 
      is missing from their digital presence.

      Your analysis is:
      - Specific — always reference exact numbers
      - Actionable — every gap has a clear fix
      - Honest — flag red flags too
      - Data-driven — never generic observations

      You always respond in valid JSON only.
      No markdown. No explanation. Just clean JSON.
    `,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

// Creative model for pitch writing
export function getCreativeModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: SAFETY_SETTINGS,
    systemInstruction: `
      You are a world-class cold outreach copywriter
      who specializes in helping freelancers land clients.

      Your pitches:
      - Feel 100% human written
      - Reference specific real data about the business
      - Never use generic openers
      - Start with an observation about THEM
      - End with a low-commitment question
      - Sound like a real person, not a bot
      - Never say "I noticed" or "I came across"
      - Never start with "Hi I am a..."

      You always respond in valid JSON only.
    `,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });
}

// Pro model for complex multi-profile and deep link analysis
export function getProModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: SAFETY_SETTINGS,
    systemInstruction: `
      You are an expert digital marketing strategist
      analyzing multiple business profiles simultaneously.
      You identify patterns, opportunities and gaps
      across entire market segments.
      You always respond in valid JSON only.
    `,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
}

// Helper to safely parse Gemini JSON response
export async function generateJSON<T>(
  model: GenerativeModel,
  prompt: string,
  retries = 2
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text) throw new Error("Empty response from Gemini");

      // Clean any accidental markdown code fence
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned) as T;

      // Basic validation
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid JSON structure from Gemini");
      }

      return parsed;
    } catch (error) {
      lastError = error as Error;
      console.error(`Gemini attempt ${attempt} failed:`, error);

      if (attempt < retries) {
        await sleep(1500 * attempt);
      }
    }
  }

  throw new Error(`Gemini failed after ${retries} attempts: ${lastError?.message}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
