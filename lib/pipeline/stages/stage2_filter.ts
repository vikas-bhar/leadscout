import { MapsResult } from "./stage1_maps";
import { PIPELINE_CONFIG } from "../config";

export interface FilteredBusiness extends MapsResult {
  gaps: {
    noWebsite: boolean;
    lowRating: boolean;
    fewPhotos: boolean;
    unansweredReviews: boolean;
    noPhone: boolean;
    missingHours: boolean;
  };
  gapCount: number;
  initialScore: number;
}

export function filterAndScore(businesses: MapsResult[]): FilteredBusiness[] {
  const scored = businesses
    .filter((b) => {
      // Skip if too few reviews (not established)
      if (b.reviewCount < PIPELINE_CONFIG.filters.minReviewsToInclude) {
        return false;
      }
      // Skip if perfect — they don't need help
      if (
        b.rating !== null &&
        b.rating >= PIPELINE_CONFIG.filters.maxRatingToInclude &&
        b.website &&
        b.photoCount >= 10
      ) {
        return false;
      }
      return true;
    })
    .map((b) => {
      const gaps = {
        noWebsite: !b.website,
        lowRating: b.rating !== null && b.rating < 4.0,
        fewPhotos: b.photoCount < PIPELINE_CONFIG.filters.minPhotoCountForGap,
        unansweredReviews: b.unansweredNegativeReviews > 2,
        noPhone: !b.phone,
        missingHours: !b.hasHours,
      };

      const gapCount = Object.values(gaps).filter(Boolean).length;

      // Initial score based on gaps — more gaps = higher opportunity
      const initialScore = Math.min(
        Math.round(
          (gapCount / 6) * 60 +
            (gaps.noWebsite ? 20 : 0) +
            (gaps.lowRating ? 15 : 0) +
            (gaps.unansweredReviews ? 10 : 0)
        ),
        100
      );

      return { ...b, gaps, gapCount, initialScore };
    })
    .filter((b) => b.gapCount >= 1)
    .sort((a, b) => b.initialScore - a.initialScore);

  // If filter is too strict on a small test set, fallback to all scored businesses
  if (scored.length === 0 && businesses.length > 0) {
    return businesses.map((b) => ({
      ...b,
      gaps: {
        noWebsite: !b.website,
        lowRating: b.rating !== null && b.rating < 4.5,
        fewPhotos: b.photoCount < 10,
        unansweredReviews: b.unansweredNegativeReviews > 0,
        noPhone: !b.phone,
        missingHours: !b.hasHours,
      },
      gapCount: 2,
      initialScore: 65,
    }));
  }

  return scored;
}
