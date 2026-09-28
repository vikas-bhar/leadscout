export interface CustomPromptConfig {
  id: string;
  name: string;
  description: string;
  promptType: "analysis" | "pitch" | "filter" | "full";
  freelancerType?: string;

  // What the AI should focus on
  systemPrompt: string;

  // How to analyze each business
  analysisPrompt: string;

  // How to write the pitch
  pitchPrompt: string;

  // Custom scoring criteria
  scoringCriteria: {
    weight: number;
    criterion: string;
    description: string;
  }[];

  isActive?: boolean;
  isDefault?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomFilterConfig {
  id: string;
  name: string;
  description: string;

  // What to scrape from Maps
  mapsFilters: {
    minRating: number | null;
    maxRating: number | null;
    minReviews: number | null;
    maxReviews: number | null;
    requireWebsite: boolean | null;
    requireNoWebsite: boolean | null;
    requirePhone: boolean | null;
    minPhotos: number | null;
    maxPhotos: number | null;
    priceLevel: ("$" | "$$" | "$$$" | "$$$$")[];
    requireVerified: boolean | null;
    requireOpenNow: boolean | null;
    keywordsInName: string[];
    keywordsToExclude: string[];
    requireUnansweredReviews: boolean | null;
    minUnansweredNegative: number | null;
  };

  // What to check on Instagram
  instagramFilters: {
    requireInstagram: boolean | null;
    requireNoInstagram: boolean | null;
    minFollowers: number | null;
    maxFollowers: number | null;
    minDaysSincePost: number | null;
    maxEngagementRate: number | null;
    requireNoReels: boolean | null;
    requireNoLinkInBio: boolean | null;
    requireInfrequentPosting: boolean | null;
  };

  // Custom scoring weights (0 - 30 each)
  scoringWeights: {
    noWebsite: number;
    lowRating: number;
    fewPhotos: number;
    unansweredReviews: number;
    noInstagram: number;
    deadInstagram: number;
    lowEngagement: number;
    noReels: number;
    budget: number;
  };

  isActive?: boolean;
  isDefault?: boolean;
  usageCount?: number;
  createdAt?: string;
}

export interface RawInstagramData {
  followerCount?: number;
  followersCount?: number;
  followers?: number;
  engagementRate?: number;
  lastPostDaysAgo?: number;
  daysSinceLastPost?: number;
  hasReels?: boolean;
  hasLinkInBio?: boolean;
  postsPerWeek?: number;
  [key: string]: unknown;
}

export interface RawBusinessData {
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  reviews_count?: number;
  website?: string;
  phone?: string;
  photoCount?: number;
  photos?: unknown[];
  photosCount?: number;
  photos_count?: number;
  hasOwnerResponse?: boolean;
  unansweredNegativeReviews?: number;
  instagramData?: RawInstagramData;
  instagram?: RawInstagramData;
  [key: string]: unknown;
}

// Build analysis prompt using user config
export function buildCustomAnalysisPrompt(
  businessData: unknown,
  instagramData: unknown,
  freelancerType: string,
  customPrompt: CustomPromptConfig
): string {
  return `
${customPrompt.systemPrompt}

BUSINESS DATA:
${JSON.stringify(businessData, null, 2)}

INSTAGRAM DATA:
${JSON.stringify(instagramData, null, 2)}

FREELANCER TYPE: ${freelancerType}

ANALYSIS INSTRUCTIONS:
${customPrompt.analysisPrompt}

SCORING CRITERIA (weight each 0-100):
${customPrompt.scoringCriteria
  .map((c) => `${c.criterion} (weight: ${c.weight}): ${c.description}`)
  .join("\n")}

Format the response as complete JSON matching:
{
  "digitalHealthScore": number (0-100),
  "opportunityScore": number (0-100),
  "primaryGap": string,
  "executiveSummary": string,
  "topGaps": [
    {
      "area": string,
      "current": string,
      "benchmark": string,
      "impact": string,
      "priority": "critical" | "high" | "medium"
    }
  ],
  "psychologyTriggers": [string],
  "pitches": {
    "dm": string,
    "email": string,
    "whatsapp": string,
    "coldCallBulletPoints": [string]
  }
}
  `.trim();
}

// Apply custom filters to scraped data
export function applyCustomFilters<T extends RawBusinessData>(
  businesses: T[],
  config: CustomFilterConfig
): T[] {
  return businesses.filter((b) => {
    const mf = config.mapsFilters;
    const igf = config.instagramFilters;

    // Rating filters
    if (mf.minRating !== null && mf.minRating !== undefined && (b.rating || 0) < mf.minRating) return false;
    if (mf.maxRating !== null && mf.maxRating !== undefined && (b.rating || 5) > mf.maxRating) return false;

    // Review count filters
    const reviewCount = b.reviewCount ?? b.reviewsCount ?? b.reviews_count ?? 0;
    if (mf.minReviews !== null && mf.minReviews !== undefined && reviewCount < mf.minReviews) return false;
    if (mf.maxReviews !== null && mf.maxReviews !== undefined && reviewCount > mf.maxReviews) return false;

    // Website filters
    const hasWebsite = Boolean(b.website && b.website.trim() !== "");
    if (mf.requireWebsite === true && !hasWebsite) return false;
    if (mf.requireNoWebsite === true && hasWebsite) return false;

    // Phone filter
    const hasPhone = Boolean(b.phone && b.phone.trim() !== "");
    if (mf.requirePhone === true && !hasPhone) return false;

    // Photo filters
    const photoCount = b.photoCount ?? b.photosCount ?? (Array.isArray(b.photos) ? b.photos.length : 0);
    if (mf.minPhotos !== null && mf.minPhotos !== undefined && photoCount < mf.minPhotos) return false;
    if (mf.maxPhotos !== null && mf.maxPhotos !== undefined && photoCount > mf.maxPhotos) return false;

    // Price level filter
    if (mf.priceLevel && mf.priceLevel.length > 0 && b.priceLevel) {
      if (!mf.priceLevel.includes(b.priceLevel)) return false;
    }

    // Verified filter
    if (mf.requireVerified === true && !b.isVerified) return false;

    // Keyword filters
    if (mf.keywordsInName && mf.keywordsInName.length > 0) {
      const nameL = (b.name || "").toLowerCase();
      const hasKeyword = mf.keywordsInName.some((k) =>
        nameL.includes(k.toLowerCase().trim())
      );
      if (!hasKeyword) return false;
    }

    if (mf.keywordsToExclude && mf.keywordsToExclude.length > 0) {
      const nameL = (b.name || "").toLowerCase();
      const hasExcluded = mf.keywordsToExclude.some((k) =>
        nameL.includes(k.toLowerCase().trim())
      );
      if (hasExcluded) return false;
    }

    // Unanswered reviews filter
    const unanswered = b.unansweredNegativeReviews ?? b.unansweredReviews ?? 0;
    if (mf.requireUnansweredReviews === true && unanswered === 0) return false;
    if (mf.minUnansweredNegative !== null && mf.minUnansweredNegative !== undefined && unanswered < mf.minUnansweredNegative) {
      return false;
    }

    // Instagram filters
    const ig = b.instagram || {};

    if (igf.requireInstagram === true && !ig.found) return false;
    if (igf.requireNoInstagram === true && ig.found) return false;

    if (ig.found) {
      const followers = ig.followers ?? 0;
      if (igf.minFollowers !== null && igf.minFollowers !== undefined && followers < igf.minFollowers) {
        return false;
      }
      if (igf.maxFollowers !== null && igf.maxFollowers !== undefined && followers > igf.maxFollowers) {
        return false;
      }

      const daysSincePost = ig.daysSinceLastPost ?? 0;
      if (igf.minDaysSincePost !== null && igf.minDaysSincePost !== undefined && daysSincePost < igf.minDaysSincePost) {
        return false;
      }

      const engagementRate = ig.engagementRate ?? 0;
      if (igf.maxEngagementRate !== null && igf.maxEngagementRate !== undefined && engagementRate > igf.maxEngagementRate) {
        return false;
      }

      if (igf.requireNoReels === true && ig.usesReels) return false;
      if (igf.requireNoLinkInBio === true && ig.hasLinkInBio) return false;
      if (igf.requireInfrequentPosting === true && (ig.postsPerWeek || 0) >= 3) return false;
    }

    return true;
  });
}

// Custom scoring with user-defined weights
export function calculateCustomScore(
  business: RawBusinessData,
  instagram: RawInstagramData | null | undefined,
  weights: CustomFilterConfig["scoringWeights"]
): number {
  let score = 0;
  let maxScore = 0;

  const add = (condition: boolean, weight: number) => {
    maxScore += weight;
    if (condition) score += weight;
  };

  const hasWebsite = Boolean(business.website && business.website.trim() !== "");
  const rating = business.rating ?? 5.0;
  const photoCount = business.photoCount ?? (Array.isArray(business.photos) ? business.photos.length : 0);
  const unanswered = business.unansweredNegativeReviews ?? 0;

  add(!hasWebsite, weights.noWebsite || 20);
  add(rating < 4.0, weights.lowRating || 15);
  add(photoCount < 5, weights.fewPhotos || 10);
  add(unanswered > 2, weights.unansweredReviews || 18);
  add(!instagram?.found, weights.noInstagram || 20);
  add((instagram?.daysSinceLastPost || 0) > 30, weights.deadInstagram || 15);
  add((instagram?.engagementRate || 99) < 1.5, weights.lowEngagement || 12);
  add(!instagram?.usesReels && Boolean(instagram?.found), weights.noReels || 10);

  // Budget signal (estimated)
  const reviewCount = business.reviewCount ?? 0;
  const hasBudget = reviewCount > 100 || Boolean(business.isVerified);
  add(hasBudget, weights.budget || 20);

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}
