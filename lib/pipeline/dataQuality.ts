// Master data quality orchestrator that runs cleaning + validation + deduplication together.

import { cleanMapsData, cleanInstagramData, CleanedMapsData } from "./cleaner";
import { validateBusinessData, validateInstagramData } from "./validator";
import { deduplicateBusinesses } from "./deduplicator";
import { MapsResult } from "./stages/stage1_maps";

export interface DataQualityReport {
  totalRaw: number;
  afterCleaning: number;
  afterValidation: number;
  afterDeduplication: number;
  rejected: string[];
  warnings: string[];
  qualityScore: number;
}

export function processMapsData(rawItems: Array<Record<string, unknown>>): {
  businesses: MapsResult[];
  report: DataQualityReport;
} {
  const report: DataQualityReport = {
    totalRaw: Array.isArray(rawItems) ? rawItems.length : 0,
    afterCleaning: 0,
    afterValidation: 0,
    afterDeduplication: 0,
    rejected: [],
    warnings: [],
    qualityScore: 0,
  };

  if (!Array.isArray(rawItems) || !rawItems.length) return { businesses: [], report };

  const cleaned: CleanedMapsData[] = [];
  for (const item of rawItems) {
    try {
      cleaned.push(cleanMapsData(item));
    } catch {
      report.rejected.push(`Cleaning failed: ${item?.title || item?.name || "unknown"}`);
    }
  }
  report.afterCleaning = cleaned.length;

  const validated = cleaned.filter((b) => {
    const res = validateBusinessData(b);
    if (!res.isValid) {
      report.rejected.push(`${b.name}: ${res.issues.join(", ")}`);
      return false;
    }
    if (res.warnings.length) report.warnings.push(...res.warnings.map((w) => `${b.name}: ${w}`));
    return true;
  });
  report.afterValidation = validated.length;

  const deduped = deduplicateBusinesses(validated);
  report.afterDeduplication = deduped.length;
  report.qualityScore = Math.round((deduped.length / Math.max(rawItems.length, 1)) * 100);

  const businesses: MapsResult[] = deduped.map((b) => ({
    placeId: b.placeId,
    name: b.name,
    category: b.category,
    address: b.address,
    city: b.city,
    country: b.country,
    rating: b.rating,
    reviewCount: b.reviewCount,
    website: b.website,
    phone: b.phone,
    photoCount: b.photoCount,
    hasHours: b.hasHours,
    isVerified: b.isVerified,
    mapsUrl: b.mapsUrl,
    coordinates: b.coordinates,
    reviews: b.reviews.map((r) => ({ text: r.text, rating: r.rating, hasOwnerResponse: r.hasOwnerResponse })),
    unansweredNegativeReviews: b.unansweredNegativeReviews,
    priceLevel: b.priceLevel,
    openNow: !b.isPermanentlyClosed,
  }));

  return { businesses, report };
}

export interface ProcessedInstagramData {
  found: boolean;
  confidence: number;
  username: string;
  fullName: string | null;
  bio: string | null;
  followers: number;
  following: number;
  postsCount: number;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  postsPerWeek: number | null;
  avgLikesPerPost: number | null;
  avgCommentsPerPost: number | null;
  engagementRate: number | null;
  hasLinkInBio: boolean;
  usesReels: boolean;
  reelsCount: number | null;
  hasHighlights: boolean;
  isVerifiedAccount: boolean;
  profileUrl: string;
  isPrivate: boolean;
  isBusinessAccount: boolean;
  bio_raw: string | null;
  dataQuality: "high" | "medium" | "low" | "reject";
  dataScore: number;
}

export function processInstagramData(
  rawItems: Array<Record<string, unknown>>,
  businessName: string
): ProcessedInstagramData | null {
  if (!Array.isArray(rawItems)) return null;

  for (const item of rawItems) {
    try {
      const cleaned = cleanInstagramData(item, businessName);
      if (!cleaned) continue;
      const val = validateInstagramData(cleaned, businessName);
      if (val.isValid) {
        return { ...cleaned, dataQuality: val.quality, dataScore: val.score };
      }
    } catch (e) {
      console.error("IG clean err:", e);
    }
  }

  return null;
}
