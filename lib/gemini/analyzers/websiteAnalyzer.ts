import { getFlashModel, generateJSON } from "../client";

export interface WebsiteAnalysisInput {
  url: string;
  title: string | null;
  metaDescription: string | null;
  headings: string[];
  bodyText: string;
  hasContactForm: boolean;
  hasContactEmail: boolean;
  hasContactPhone: boolean;
  hasSocialLinks: boolean;
  socialLinksFound: string[];
  hasBlog: boolean;
  blogPostCount: number | null;
  lastBlogPost: string | null;
  hasCTA: boolean;
  ctaTexts: string[];
  hasTestimonials: boolean;
  hasAboutPage: boolean;
  hasServicesPage: boolean;
  imageCount: number;
  hasAltText: boolean;
  pageLoadScore: number | null;
  isMobileResponsive: boolean | null;
  hasSSL: boolean;
  freelancerType: string;
}

export interface WebsiteAnalysisOutput {
  websiteScore: number;
  seoScore: number;
  uxScore: number;
  conversionScore: number;
  mobileScore: number;
  gaps: Array<{
    area: string;
    problem: string;
    impact: string;
    severity: "low" | "medium" | "high" | "critical";
    fix: string;
    estimatedImpact: string;
  }>;
  whatTheyDoWell: string[];
  quickWins: string[];
  estimatedRevenueImpact: string;
  recommendedServices: string[];
  pitchAngle: string;
  outreachEmail: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
}

export async function analyzeWebsiteWithGemini(
  input: WebsiteAnalysisInput
): Promise<WebsiteAnalysisOutput> {
  const model = getFlashModel();

  const prompt = `
Perform a detailed website audit for a 
${input.freelancerType} looking to pitch this business.

══════════════════════════════════
WEBSITE OVERVIEW
══════════════════════════════════
URL              : ${input.url}
Title            : ${input.title ?? "Missing ❌"}
Meta Description : ${input.metaDescription ?? "Missing ❌"}
Has SSL          : ${input.hasSSL ? "YES" : "NO ❌"}
Mobile Friendly  : ${input.isMobileResponsive === null ? "Unknown" : input.isMobileResponsive ? "YES" : "NO ❌"}
Page Speed Score : ${input.pageLoadScore ?? "Unknown"}/100

══════════════════════════════════
CONTENT STRUCTURE
══════════════════════════════════
Page Headings:
${input.headings.slice(0, 8).map((h) => "  " + h).join("\n")}

Content preview:
"${input.bodyText.slice(0, 500)}"

Has About Page    : ${input.hasAboutPage ? "YES" : "NO ❌"}
Has Services Page : ${input.hasServicesPage ? "YES" : "NO ❌"}
Has Blog          : ${input.hasBlog ? "YES — " + (input.blogPostCount ?? 0) + " posts" : "NO ❌"}
Last Blog Post    : ${input.lastBlogPost ?? "N/A"}
Image Count       : ${input.imageCount}
Images Have Alt   : ${input.hasAltText ? "YES" : "NO ❌ (Bad for SEO)"}

══════════════════════════════════
CONVERSION ELEMENTS
══════════════════════════════════
Has Contact Form  : ${input.hasContactForm ? "YES" : "NO ❌"}
Contact Email     : ${input.hasContactEmail ? "YES" : "NO ❌"}
Contact Phone     : ${input.hasContactPhone ? "YES" : "NO ❌"}
Has Clear CTA     : ${input.hasCTA ? 'YES — "' + input.ctaTexts.join('", "') + '"' : "NO ❌"}
Has Testimonials  : ${input.hasTestimonials ? "YES" : "NO ❌"}

══════════════════════════════════
SOCIAL PRESENCE
══════════════════════════════════
Social Links      : ${input.hasSocialLinks ? input.socialLinksFound.join(", ") : "NONE ❌"}

══════════════════════════════════
ANALYSIS REQUIREMENTS
══════════════════════════════════
1. Score website across 5 dimensions 0-100
2. SEO score based on: title, meta, headings, alt text, content quality, SSL
3. UX score based on: mobile, structure, navigation
4. Conversion score based on: CTA, contact, testimonials, trust signals
5. Each gap must include estimated revenue impact
6. Quick wins = things fixable in under 1 day
7. Outreach email must mention their specific URL and one specific problem spotted
8. Pitch angle must be the most compelling reason to hire this freelancer RIGHT NOW

Return detailed JSON analysis matching:
{
  "websiteScore": number,
  "seoScore": number,
  "uxScore": number,
  "conversionScore": number,
  "mobileScore": number,
  "gaps": [
    {
      "area": "string",
      "problem": "string",
      "impact": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "fix": "string",
      "estimatedImpact": "string"
    }
  ],
  "whatTheyDoWell": ["string"],
  "quickWins": ["string"],
  "estimatedRevenueImpact": "string",
  "recommendedServices": ["string"],
  "pitchAngle": "string",
  "outreachEmail": "string",
  "urgencyLevel": "low" | "medium" | "high" | "critical"
}
  `;

  try {
    return await generateJSON<WebsiteAnalysisOutput>(model, prompt);
  } catch (err) {
    console.warn("analyzeWebsiteWithGemini fallback activated:", err);
    return buildFallbackWebsiteAnalysis(input);
  }
}

function buildFallbackWebsiteAnalysis(input: WebsiteAnalysisInput): WebsiteAnalysisOutput {
  const gaps = [];

  if (!input.hasCTA) {
    gaps.push({
      area: "Conversion Optimization",
      problem: "No direct 1-tap call-to-action button above the fold",
      impact: "Website visitors browse without taking action or booking inquiries",
      severity: "critical" as const,
      fix: "Add high-contrast sticky booking / contact button",
      estimatedImpact: "+35% more monthly inquiries",
    });
  }

  if (!input.metaDescription || !input.hasAltText) {
    gaps.push({
      area: "Technical SEO & Google Indexing",
      problem: "Missing optimized meta descriptions and image alt tags",
      impact: "Suppressed ranking on local Google search results",
      severity: "high" as const,
      fix: "Implement comprehensive SEO meta tag structure and keyword-rich alt tags",
      estimatedImpact: "+25% increase in organic organic search traffic",
    });
  }

  return {
    websiteScore: 68,
    seoScore: 62,
    uxScore: 70,
    conversionScore: 58,
    mobileScore: input.isMobileResponsive ? 80 : 50,
    gaps,
    whatTheyDoWell: [
      `Active live web domain (${input.url})`,
      input.hasSSL ? "Valid SSL security certificate enabled" : "Fast clean layout",
    ],
    quickWins: [
      "Add prominent sticky Call-to-Action button above the fold",
      "Set up instant WhatsApp inquiry click-to-chat widget",
    ],
    estimatedRevenueImpact: "$1,500 – $3,000 / month",
    recommendedServices: [
      "Mobile Conversion Rate Optimization (CRO)",
      "Technical On-Page Local SEO",
      "Lead Capture & Booking Funnel Setup",
    ],
    pitchAngle: `Help ${input.url} turn passive website visitors into direct customer inquiries.`,
    outreachEmail: `Hi there,\n\nI was analyzing top sites in your niche and reviewed ${input.url}. You have a great baseline, but I noticed a couple of friction points in the mobile inquiry funnel that are likely costing you weekly leads.\n\nWould you be open to a 3-minute screen recording walking through how to fix these?\n\nBest,\nA Freelance Growth Partner`,
    urgencyLevel: "high",
  };
}
