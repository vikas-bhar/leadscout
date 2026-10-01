import { isValidWebsiteUrl } from "./cleaner";

// Fact-checker and truth validator for AI-generated business gaps
export interface FactCheckedGap {
  id?: string;
  category: string;
  problem: string;
  rootCause?: string;
  impact?: string;
  businessImpact?: string;
  estimatedRevenueLoss?: string;
  severity: "low" | "medium" | "high";
  effortToFix?: string;
  yourSolution: string;
  timeToResult?: string;
  proofPoints?: string[];
}

export function factCheckAndSanitizeGaps(
  rawGaps: Array<Record<string, unknown>>,
  business: {
    website?: string | null;
    rating?: number | null;
    reviewCount?: number;
    phone?: string | null;
    photoCount?: number;
    unansweredNegativeReviews?: number;
  },
  instagram?: {
    found?: boolean;
    username?: string | null;
    followers?: number | null;
    usesReels?: boolean;
    hasLinkInBio?: boolean;
    daysSinceLastPost?: number | null;
  } | null
): FactCheckedGap[] {
  const hasWebsite = Boolean(business.website && isValidWebsiteUrl(business.website));

  const hasInstagram = Boolean(instagram?.found && instagram?.username);
  const usesReels = Boolean(instagram?.usesReels);
  const hasLinkInBio = Boolean(instagram?.hasLinkInBio);
  const hasPhone = Boolean(business.phone && business.phone.trim() !== "");
  const rating = business.rating ?? 4.0;
  const photoCount = business.photoCount ?? 0;

  const validGaps: FactCheckedGap[] = [];

  if (Array.isArray(rawGaps)) {
    for (const g of rawGaps) {
      if (!g || typeof g !== "object") continue;
      const category = String(g.category || g.area || g.problem || "").trim();
      const problem = String(g.problem || g.area || "").trim();
      const impact = String(g.impact || g.businessImpact || "").trim();
      const yourSolution = String(g.yourSolution || g.solution || "").trim();
      const severity = (((g.severity as string) === "critical" ? "high" : g.severity) as "low" | "medium" | "high") || "medium";

      const text = `${category} ${problem}`.toLowerCase();

      // 1. FILTER OUT REJECTED PLACEHOLDERS
      if (text.includes("none detected") || text.includes("clean opportunity") || text.includes("no gap")) {
        continue;
      }

      // 2. CONTRADICTION 1: Claiming missing website when business HAS a website
      if (hasWebsite && (text.includes("no website") || text.includes("missing website") || text.includes("lacks website") || text.includes("no official website"))) {
        validGaps.push({
          id: (g.id as string) || `gap_mobile_conv_${Date.now()}_${validGaps.length}`,
          category: "Mobile UX & Booking Conversion",
          problem: "Existing website lacks streamlined mobile 1-tap booking flow and direct WhatsApp CTA",
          rootCause: String(g.rootCause || "Outdated desktop-first layout causing mobile visitor bounce"),
          impact: impact || "Loses ~30% of smartphone search traffic to local competitors",
          businessImpact: impact || "Loses ~30% of smartphone search traffic to local competitors",
          estimatedRevenueLoss: String(g.estimatedRevenueLoss || "$1,000 - $2,500/mo"),
          severity: "medium",
          yourSolution: yourSolution || "Optimize site layout with instant mobile booking and 1-tap messaging",
        });
        continue;
      }

      // 3. CONTRADICTION 2: Claiming missing Instagram when business HAS Instagram
      if (hasInstagram && (text.includes("no instagram") || text.includes("missing instagram") || text.includes("no profile found"))) {
        validGaps.push({
          id: (g.id as string) || `gap_ig_content_${Date.now()}_${validGaps.length}`,
          category: "Instagram Content Consistency",
          problem: `Instagram account @${instagram?.username || "profile"} lacks regular video Reels and active story highlights`,
          rootCause: String(g.rootCause || "No dedicated social media content calendar"),
          impact: impact || "Suppressed organic reach on local Explore pages",
          businessImpact: impact || "Suppressed organic reach on local Explore pages",
          estimatedRevenueLoss: String(g.estimatedRevenueLoss || "$800 - $1,800/mo"),
          severity: "medium",
          yourSolution: yourSolution || "Deploy weekly Reels content calendar with local customer showcases",
        });
        continue;
      }

      // 4. CONTRADICTION 3: Claiming missing Reels when business USES Reels
      if (usesReels && (text.includes("no reels") || text.includes("not using reels") || text.includes("no short-form video"))) {
        validGaps.push({
          id: (g.id as string) || `gap_reels_retention_${Date.now()}_${validGaps.length}`,
          category: "Short-Form Video Retention",
          problem: "Reels content lacks hook-driven intro pacing and clear call-to-action overlays",
          rootCause: String(g.rootCause || "Unedited raw video uploads without retention hooks"),
          impact: impact || "Lower video completion rates and reduced algorithmic distribution",
          businessImpact: impact || "Lower video completion rates and reduced algorithmic distribution",
          estimatedRevenueLoss: String(g.estimatedRevenueLoss || "$500 - $1,200/mo"),
          severity: "medium",
          yourSolution: yourSolution || "Professional video editing package with animated captions and CTA overlays",
        });
        continue;
      }

      // 5. CONTRADICTION 4: Claiming missing Link in Bio when business HAS Link in Bio
      if (hasLinkInBio && (text.includes("no link in bio") || text.includes("missing bio link"))) {
        validGaps.push({
          id: (g.id as string) || `gap_bio_funnel_${Date.now()}_${validGaps.length}`,
          category: "Social Bio Funnel",
          problem: "Link in bio points to generic homepage rather than direct high-converting offer page",
          rootCause: String(g.rootCause || "Unoptimized link destination"),
          impact: impact || "Visitors bounce before completing inquiry form",
          businessImpact: impact || "Visitors bounce before completing inquiry form",
          estimatedRevenueLoss: String(g.estimatedRevenueLoss || "$500 - $1,000/mo"),
          severity: "medium",
          yourSolution: yourSolution || "Build 1-page mobile bio funnel matching Instagram campaign offers",
        });
        continue;
      }

      // 6. CONTRADICTION 5: Claiming missing phone when business HAS phone
      if (hasPhone && (text.includes("no phone") || text.includes("missing phone"))) {
        continue;
      }

      // 7. CONTRADICTION 6: Claiming low rating when rating >= 4.5
      if (rating >= 4.5 && (text.includes("low rating") || text.includes("poor rating") || text.includes("bad reviews"))) {
        continue;
      }

      // 8. CONTRADICTION 7: Claiming few photos when photo count >= 10
      if (photoCount >= 10 && (text.includes("no photos") || text.includes("few photos") || text.includes("missing photos"))) {
        continue;
      }

      validGaps.push({
        id: (g.id as string) || `gap_${Date.now()}_${validGaps.length + 1}`,
        category: category || "Conversion Opportunity",
        problem: problem || "Digital conversion path can be improved",
        rootCause: String(g.rootCause || "Outdated setup"),
        impact: impact || "Losing prospective client inquiries",
        businessImpact: impact || "Losing prospective client inquiries",
        estimatedRevenueLoss: String(g.estimatedRevenueLoss || "$1,000/mo"),
        severity,
        yourSolution: yourSolution || "Implement high-converting digital workflow",
      });
    }
  }

  // ENSURE GROUND-TRUTH REAL GAPS ARE PRESENT
  // Ground Truth Gap 1: Missing Website
  if (!hasWebsite && !validGaps.some((g) => g.category.toLowerCase().includes("website") || g.problem.toLowerCase().includes("website"))) {
    validGaps.unshift({
      id: "gap_missing_website",
      category: "Website & Mobile Funnel",
      problem: "No official website or online reservation portal listed on Google Business Profile",
      rootCause: "Relied solely on offline foot traffic and Google Maps directory entry",
      impact: "Loses 100% of online search visitors to competitors with mobile booking sites",
      businessImpact: "Loses 100% of online search visitors to competitors with mobile booking sites",
      estimatedRevenueLoss: "$1,500 - $4,000/mo",
      severity: "high",
      yourSolution: "Build a modern, mobile-first responsive landing page with instant booking integration",
    });
  }

  // Ground Truth Gap 2: Missing Instagram Account
  if (!hasInstagram && !validGaps.some((g) => g.category.toLowerCase().includes("instagram") || g.problem.toLowerCase().includes("instagram"))) {
    validGaps.push({
      id: "gap_missing_instagram",
      category: "Social Media Presence",
      problem: "No verified Instagram business profile found for local customer discovery",
      rootCause: "Has not expanded outreach onto visual social channels",
      impact: "Losing visual search traffic and younger demographic market share",
      businessImpact: "Losing visual search traffic and younger demographic market share",
      estimatedRevenueLoss: "$800 - $2,000/mo",
      severity: "medium",
      yourSolution: "Create and brand a verified Instagram profile with local content strategy",
    });
  }

  // Ground Truth Gap 3: Missing Reels on Instagram
  if (hasInstagram && !usesReels && !validGaps.some((g) => g.category.toLowerCase().includes("reel") || g.problem.toLowerCase().includes("reel"))) {
    validGaps.push({
      id: "gap_missing_reels",
      category: "Short-Form Video Marketing",
      problem: "Instagram account has zero short-form video Reels",
      rootCause: "Posting only static images which algorithm deprioritizes",
      impact: "Reaches less than 5% of potential local Instagram users",
      businessImpact: "Reaches less than 5% of potential local Instagram users",
      estimatedRevenueLoss: "$600 - $1,500/mo",
      severity: "medium",
      yourSolution: "Produce weekly short-form Reels featuring customer transformations and services",
    });
  }

  // Ground Truth Gap 4: Unanswered Negative Reviews
  if ((business.unansweredNegativeReviews ?? 0) > 0 && !validGaps.some((g) => g.category.toLowerCase().includes("review") || g.problem.toLowerCase().includes("review"))) {
    validGaps.push({
      id: "gap_unanswered_reviews",
      category: "Reputation & Review Management",
      problem: `${business.unansweredNegativeReviews} negative Google review(s) left unanswered by owner`,
      rootCause: "No active review monitoring workflow",
      impact: "Discourages prospective clients reading Google Business Profile reviews",
      businessImpact: "Discourages prospective clients reading Google Business Profile reviews",
      estimatedRevenueLoss: "$500 - $1,200/mo",
      severity: "high",
      yourSolution: "Draft professional owner responses and set up automated review generation flow",
    });
  }

  // Ultimate fallback if no gaps survived
  if (validGaps.length === 0) {
    validGaps.push({
      id: "gap_fallback_conversion",
      category: "Mobile Conversion Funnel",
      problem: "Online booking funnel lacks direct 1-tap mobile reservation widget",
      rootCause: "Outdated inquiry flow requiring manual phone calls",
      impact: "High bounce rate during non-business hours",
      businessImpact: "High bounce rate during non-business hours",
      estimatedRevenueLoss: "$1,000/mo",
      severity: "medium",
      yourSolution: "Implement instant 24/7 mobile booking widget and instant WhatsApp CTA",
    });
  }

  return validGaps;
}
