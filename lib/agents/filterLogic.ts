export interface FilterSignal {
  signal: string;
  value: string;
  weight: number;
  positive: boolean;
  explanation: string;
}

export function explainFilterDecision(
  business: {
    reviewCount?: number;
    website?: string | null;
    photoCount?: number;
    unansweredNegativeReviews?: number;
    isVerified?: boolean;
    rating?: number | null;
    [key: string]: unknown;
  },
  instagram?: {
    found?: boolean;
    daysSinceLastPost?: number | null;
    engagementRate?: number | null;
    followers?: number | null;
    usesReels?: boolean;
    hasLinkInBio?: boolean;
    [key: string]: unknown;
  }
): {
  signals: FilterSignal[];
  totalScore: number;
  recommendation: string;
} {
  const signals: FilterSignal[] = [];
  const reviewCount = Number(business.reviewCount ?? 0);
  const rating = typeof business.rating === "number" ? business.rating : 4.0;
  const photoCount = Number(business.photoCount ?? 0);
  const unansweredNegatives = Number(business.unansweredNegativeReviews ?? 0);

  // ── POSITIVE SIGNALS ──

  if (reviewCount >= 100) {
    signals.push({
      signal: "High review count",
      value: `${reviewCount} reviews`,
      weight: 15,
      positive: true,
      explanation: "Established business with cash flow and budget to invest",
    });
  } else if (reviewCount >= 30) {
    signals.push({
      signal: "Medium review count",
      value: `${reviewCount} reviews`,
      weight: 8,
      positive: true,
      explanation: "Growing business with budget for immediate client acquisition",
    });
  }

  if (!business.website) {
    signals.push({
      signal: "No website",
      value: "Missing",
      weight: 20,
      positive: true,
      explanation: "Massive digital gap — high-ticket landing page / website opportunity",
    });
  }

  if (!instagram?.found) {
    signals.push({
      signal: "No Instagram presence",
      value: "Not found",
      weight: 18,
      positive: true,
      explanation: "Missing entire social channel — complete brand setup deliverable",
    });
  } else if (instagram.found && (instagram.daysSinceLastPost ?? 0) > 30) {
    signals.push({
      signal: "Dead Instagram profile",
      value: `${instagram.daysSinceLastPost} days since last post`,
      weight: 15,
      positive: true,
      explanation: "Has account but abandoned social marketing after poor initial results",
    });
  }

  if (photoCount < 5) {
    signals.push({
      signal: "Few Google Maps photos",
      value: `${photoCount} photos`,
      weight: 8,
      positive: true,
      explanation: "Underdeveloped visual presence hurting local search conversion",
    });
  }

  if (unansweredNegatives > 0) {
    signals.push({
      signal: "Unanswered negative reviews",
      value: `${unansweredNegatives} unanswered`,
      weight: 12,
      positive: true,
      explanation: "Reputation management & customer recovery automation gap",
    });
  }

  if (
    instagram?.found &&
    (instagram.engagementRate ?? 0) < 1.2 &&
    (instagram.followers ?? 0) > 400
  ) {
    signals.push({
      signal: "Low Instagram engagement rate",
      value: `${instagram.engagementRate}% (industry benchmark >2%)`,
      weight: 12,
      positive: true,
      explanation: "Has existing audience but content pacing and retention is failing",
    });
  }

  if (!instagram?.usesReels && instagram?.found) {
    signals.push({
      signal: "Not using short-form Reels",
      value: "No Reels found",
      weight: 8,
      positive: true,
      explanation: "Missing algorithmic organic reach and viral video exposure",
    });
  }

  if (!instagram?.hasLinkInBio && instagram?.found) {
    signals.push({
      signal: "No link in bio",
      value: "Missing bio funnel",
      weight: 6,
      positive: true,
      explanation: "Traffic is visiting the profile but dropping off without booking",
    });
  }

  if (business.isVerified) {
    signals.push({
      signal: "Verified business entity",
      value: "Verified",
      weight: 5,
      positive: true,
      explanation: "Legitimate active enterprise invested in commercial operations",
    });
  }

  // ── NEGATIVE SIGNALS ──

  if (rating > 0 && rating < 3.2) {
    signals.push({
      signal: "Very low product rating",
      value: `${rating}/5`,
      weight: -15,
      positive: false,
      explanation: "Fundamental operational/product issue rather than a marketing bottleneck",
    });
  }

  if (reviewCount > 0 && reviewCount < 10) {
    signals.push({
      signal: "Too few reviews",
      value: `${reviewCount} reviews`,
      weight: -15,
      positive: false,
      explanation: "Very early stage — marketing budget may be constrained",
    });
  }

  if (
    instagram?.found &&
    (instagram.followers ?? 0) > 50000 &&
    (instagram.engagementRate ?? 0) > 3.5
  ) {
    signals.push({
      signal: "Already strong Instagram footprint",
      value: `${instagram.followers?.toLocaleString()} followers, ${instagram.engagementRate}% engagement`,
      weight: -20,
      positive: false,
      explanation: "Already staffed with dedicated content and social marketing team",
    });
  }

  const totalScore = Math.max(
    0,
    Math.min(
      100,
      signals.reduce((sum, s) => sum + s.weight, 25)
    )
  );

  const recommendation =
    totalScore >= 55
      ? "PURSUE — High Opportunity Lead"
      : totalScore >= 35
      ? "MAYBE — Moderate Opportunity"
      : "SKIP — Low Potential Target";

  return { signals, totalScore, recommendation };
}
