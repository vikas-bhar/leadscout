import { getProModel, getFlashModel, generateJSON } from "../client";

export async function analyzeLinkWithGemini(
  linkType: "instagram" | "website" | "maps" | "facebook",
  scrapedData: Record<string, unknown>,
  freelancerType: string
): Promise<Record<string, unknown>> {
  const model = getProModel() || getFlashModel();

  const prompt =
    linkType === "instagram"
      ? buildInstagramPrompt(scrapedData, freelancerType)
      : linkType === "website"
      ? buildWebsitePrompt(scrapedData, freelancerType)
      : buildMapsPrompt(scrapedData, freelancerType);

  return await generateJSON<Record<string, unknown>>(model, prompt);
}

function buildInstagramPrompt(data: Record<string, unknown>, freelancerType: string): string {
  return `
You are analyzing @${data.username || "user"} Instagram account
for a ${freelancerType} who wants to pitch them.

FULL ACCOUNT DATA:
${JSON.stringify(data, null, 2)}

Perform a complete Instagram audit:
1. Score the account across 5 dimensions (0-100 each)
2. Identify every gap with specific metrics
3. Compare to industry benchmarks
4. Estimate monthly revenue/sponsorship loss from poor presence
5. Write a personalized DM pitch (4 sentences max)
6. Write a personalized email pitch (6 sentences max)
7. List 3 quick wins they could implement immediately

Return pure JSON analysis.
  `;
}

function buildWebsitePrompt(data: Record<string, unknown>, freelancerType: string): string {
  return `
You are auditing this website for a ${freelancerType}:

FULL WEBSITE DATA:
${JSON.stringify(data, null, 2)}

Perform a complete website audit covering:
SEO, UX, conversion optimization, mobile, speed,
content quality, social proof, contact options.

Score each dimension 0-100.
Identify every gap with business impact.
Estimate revenue impact of each problem.
Write outreach email referencing specific issues.
List quick wins fixable in under 24 hours.

Return pure JSON analysis.
  `;
}

function buildMapsPrompt(data: Record<string, unknown>, freelancerType: string): string {
  return `
Analyze this Google Maps business listing
for a ${freelancerType}:

FULL MAPS DATA:
${JSON.stringify(data, null, 2)}

Analyze: rating, review responses, photos,
completeness, website presence, local SEO signals.

Return gap analysis and outreach pitch JSON.
  `;
}
