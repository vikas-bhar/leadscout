import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { requireApiUser } from "@/lib/supabase";
import { BUSINESS_CATEGORIES, FREELANCER_TYPES, type CustomClientFilter, type FreelancerType } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const body = await request.json();
    const prompt = (body.prompt || "").trim();
    const currentFreelancerType = (body.currentFreelancerType || "web_designer") as FreelancerType;
    const currentCountry = body.currentCountry || "UAE";
    const currentCity = body.currentCity || "Dubai";
    const currentPlace = body.currentPlace || "";

    if (!prompt || prompt.length < 5) {
      return NextResponse.json(
        { error: "Please provide a description of the clients you want to find (at least 5 characters)." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let customFilter: CustomClientFilter | null = null;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const systemInstruction = `You are an elite B2B client acquisition strategist and AI search filter agent for FreelanceFind.
Your job is to deeply understand a freelancer's natural language brief describing their ideal target clients.
You must parse and decompose their requirements into structured search parameters, digital gap priorities, budget indicators, and an intelligent client scouting strategy.

Known Standard Business Categories:
${BUSINESS_CATEGORIES.join(", ")}

Known Freelancer Roles:
${FREELANCER_TYPES.join(", ")}

Analyze the prompt carefully. Extract:
1. Primary Category (must map or best-match standard categories or specify exact niche like "Italian Restaurant", "Cosmetic Dental Clinic", "Boutique Fitness Studio", "Luxury Real Estate", etc.)
2. Niche Focus (specific sub-niche, e.g. "Upscale Aesthetic Clinic", "Commercial HVAC Contractor")
3. Target Location: Country, City, Specific District/Place if mentioned (fallback to user's defaults: ${currentCity}, ${currentCountry} if omitted)
4. Freelancer Type (detect if mentioned or default to ${currentFreelancerType})
5. Digital Gap Priorities (e.g., "No / Outdated Website", "Inactive Instagram (<1 post/mo)", "Zero Short-Form Reels", "Unanswered Bad Reviews", "No Online Booking Funnel", "Poor Mobile UX", "Weak Local SEO")
6. Budget Tier: "any" | "medium" | "high" | "enterprise"
7. Minimum Google Rating (e.g. 3.8 or null) and Minimum Reviews count (e.g. 30 or null)
8. Exclusions: Array of negative keywords/places/business types to avoid
9. Pitch Strategy Angle: A high-converting outreach angle tailored to this brief
10. Agent Understanding:
  - summary: 1-2 sentence crystal clear explanation of who we are targeting and why
  - scoutingStrategy: 3-4 bullet action points of how the agent will filter listings
  - pitchStrategy: 1-2 sentences on how the agent will position the pitch
  - targetPersona: 1 sentence describing the business owner / decision maker`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Freelancer's Client Search Brief: "${prompt}"\nCurrent Defaults (use ONLY if location/category is NOT specified in brief): Role: ${currentFreelancerType}, Location: ${currentPlace ? currentPlace + ", " : ""}${currentCity}, ${currentCountry}`,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                primaryCategory: { type: Type.STRING, description: "Broad or standard category" },
                nicheFocus: { type: Type.STRING, description: "Specific sub-niche" },
                country: { type: Type.STRING, description: "Country name" },
                countryCode: { type: Type.STRING, description: "2-letter ISO country code if known" },
                city: { type: Type.STRING, description: "City name" },
                place: { type: Type.STRING, description: "Specific neighborhood or district" },
                freelancerType: { type: Type.STRING, description: "Freelancer specialty" },
                digitalGapPriorities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of specific digital gaps to look for",
                },
                budgetLevel: {
                  type: Type.STRING,
                  enum: ["any", "medium", "high", "enterprise"],
                  description: "Target budget signal",
                },
                minRating: { type: Type.NUMBER, description: "Minimum Google rating" },
                minReviews: { type: Type.NUMBER, description: "Minimum review count" },
                exclusionKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Negative keywords to exclude",
                },
                pitchStrategyAngle: { type: Type.STRING, description: "Outreach pitch angle" },
                summary: { type: Type.STRING, description: "Agent understanding summary" },
                scoutingStrategy: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Scouting steps",
                },
                pitchStrategy: { type: Type.STRING, description: "Pitch strategy description" },
                targetPersona: { type: Type.STRING, description: "Ideal client persona" },
              },
              required: [
                "primaryCategory",
                "nicheFocus",
                "digitalGapPriorities",
                "budgetLevel",
                "pitchStrategyAngle",
                "summary",
                "scoutingStrategy",
                "pitchStrategy",
                "targetPersona",
              ],
            },
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          const detectedCountry = parsed.country || currentCountry;
          const detectedCity = parsed.city || currentCity;
          const detectedPlace = parsed.place || currentPlace || "";
          const rawLocation = [detectedPlace, detectedCity, detectedCountry].filter(Boolean).join(", ");

          customFilter = {
            userPrompt: prompt,
            nicheFocus: parsed.nicheFocus || "Targeted Local Businesses",
            primaryCategory: parsed.primaryCategory || "Restaurant",
            targetLocation: {
              country: detectedCountry,
              countryCode: parsed.countryCode || "AE",
              city: detectedCity,
              place: detectedPlace,
              rawLocation: rawLocation || `${currentCity}, ${currentCountry}`,
            },
            freelancerType: (parsed.freelancerType as FreelancerType) || currentFreelancerType,
            digitalGapPriorities:
              Array.isArray(parsed.digitalGapPriorities) && parsed.digitalGapPriorities.length > 0
                ? parsed.digitalGapPriorities
                : ["Missing / Outdated Website", "Inactive Instagram Presence"],
            budgetLevel: (parsed.budgetLevel as "any" | "medium" | "high" | "enterprise") || "high",
            minRating: typeof parsed.minRating === "number" ? parsed.minRating : 3.8,
            minReviews: typeof parsed.minReviews === "number" ? parsed.minReviews : 20,
            exclusionKeywords: Array.isArray(parsed.exclusionKeywords) ? parsed.exclusionKeywords : [],
            pitchStrategyAngle:
              parsed.pitchStrategyAngle ||
              `Position high-value ${currentFreelancerType.replace("_", " ")} solutions addressing their exact gaps.`,
            agentUnderstanding: {
              summary:
                parsed.summary ||
                `Targeting ${parsed.nicheFocus || "established businesses"} in ${rawLocation} with critical gaps in digital conversion.`,
              scoutingStrategy:
                Array.isArray(parsed.scoutingStrategy) && parsed.scoutingStrategy.length > 0
                  ? parsed.scoutingStrategy
                  : [
                      `Scan local listings in ${detectedCity} matching ${parsed.nicheFocus}`,
                      "Filter out businesses that already have modern digital setups",
                      "Score and rank prospects based on revenue loss from identified gaps",
                    ],
              pitchStrategy:
                parsed.pitchStrategy ||
                "Offer a value-first audit highlighting missed bookings and revenue opportunities.",
              targetPersona:
                parsed.targetPersona ||
                "Business owner or marketing decision-maker who values quality customer acquisition.",
            },
          };
        }
      } catch (geminiErr) {
        console.error("Gemini understand-filter error:", geminiErr);
      }
    }

    // Heuristic fallback if AI service was unreachable
    if (!customFilter) {
      customFilter = generateHeuristicCustomFilter(prompt, currentFreelancerType, currentCity, currentCountry, currentPlace);
    }

    return NextResponse.json({
      success: true,
      customFilter,
    });
  } catch (error: unknown) {
    console.error("understand-filter route exception:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to process custom client filter" },
      { status: 500 }
    );
  }
}

function generateHeuristicCustomFilter(
  prompt: string,
  currentFreelancerType: FreelancerType,
  city: string,
  country: string,
  place: string
): CustomClientFilter {
  const pLower = prompt.toLowerCase();

  let category = "Local Business";
  for (const cat of BUSINESS_CATEGORIES) {
    if (pLower.includes(cat.toLowerCase())) {
      category = cat;
      break;
    }
  }

  if (category === "Local Business") {
    if (pLower.includes("clinic") || pLower.includes("dental") || pLower.includes("medical") || pLower.includes("aesthetic") || pLower.includes("doctor")) category = "Medical clinic";
    else if (pLower.includes("gym") || pLower.includes("fitness") || pLower.includes("trainer") || pLower.includes("crossfit")) category = "Gym / Fitness";
    else if (pLower.includes("law") || pLower.includes("attorney") || pLower.includes("legal")) category = "Law firm";
    else if (pLower.includes("real estate") || pLower.includes("realty") || pLower.includes("property")) category = "Real estate agency";
    else if (pLower.includes("salon") || pLower.includes("spa") || pLower.includes("barber") || pLower.includes("beauty")) category = "Salon / Spa";
    else if (pLower.includes("cafe") || pLower.includes("coffee")) category = "Cafe";
    else if (pLower.includes("restaurant") || pLower.includes("dining") || pLower.includes("bistro") || pLower.includes("food")) category = "Restaurant";
    else if (pLower.includes("bakery") || pLower.includes("cake") || pLower.includes("pastry")) category = "Bakery";
    else if (pLower.includes("retail") || pLower.includes("boutique") || pLower.includes("store") || pLower.includes("shop")) category = "Retail store";
    else if (pLower.includes("hotel") || pLower.includes("resort")) category = "Hotel";
    else if (pLower.includes("repair") || pLower.includes("auto") || pLower.includes("mechanic")) category = "Auto repair";
    else if (pLower.includes("plumber") || pLower.includes("roofing") || pLower.includes("contractor") || pLower.includes("hvac") || pLower.includes("home")) category = "Home services";
  }

  const gaps: string[] = [];
  if (pLower.includes("website") || pLower.includes("web") || pLower.includes("page")) {
    gaps.push("Outdated or Missing Website");
  }
  if (pLower.includes("reel") || pLower.includes("tiktok") || pLower.includes("video")) {
    gaps.push("Zero Short-Form Video / Reels");
  }
  if (pLower.includes("instagram") || pLower.includes("social") || pLower.includes("post")) {
    gaps.push("Dead or Inactive Instagram Profile");
  }
  if (pLower.includes("review") || pLower.includes("rating")) {
    gaps.push("Unanswered Negative Reviews & Reputation Gap");
  }
  if (gaps.length === 0) {
    gaps.push("Underdeveloped Digital Funnel", "Weak Social Media Engagement");
  }

  const rawLocation = [place, city, country].filter(Boolean).join(", ");

  return {
    userPrompt: prompt,
    nicheFocus: prompt.length > 50 ? prompt.slice(0, 48) + "..." : prompt,
    primaryCategory: category,
    targetLocation: {
      country,
      countryCode: "AE",
      city,
      place,
      rawLocation,
    },
    freelancerType: currentFreelancerType,
    digitalGapPriorities: gaps,
    budgetLevel: pLower.includes("high") || pLower.includes("luxury") || pLower.includes("premium") ? "high" : "medium",
    minRating: 3.8,
    minReviews: 15,
    exclusionKeywords: ["franchise", "chain"],
    pitchStrategyAngle: `Directly pitch tailored solutions addressing ${gaps.join(" and ")} to boost customer acquisition.`,
    agentUnderstanding: {
      summary: `Targeting ${category} businesses in ${rawLocation} with prioritized gaps in ${gaps.join(", ")}.`,
      scoutingStrategy: [
        `Search Google Maps listings for ${category} in ${city}`,
        `Prioritize establishments matching requirements: ${gaps.join(", ")}`,
        `Synthesize customized outreach pitches highlighting immediate revenue potential`,
      ],
      pitchStrategy: `Reach out with a consultative, value-first approach showcasing actionable fixes for their primary gap.`,
      targetPersona: `Business founder, managing partner, or general manager seeking revenue growth.`,
    },
  };
}
