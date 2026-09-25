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
  if (!Array.isArray(businesses) || businesses.length === 0) {
    return [];
  }

  const scored = businesses.map((b) => {
    const gaps = {
      noWebsite: !b.website,
      lowRating: b.rating !== null && b.rating < 4.2,
      fewPhotos: b.photoCount < PIPELINE_CONFIG.filters.minPhotoCountForGap,
      unansweredReviews: b.unansweredNegativeReviews > 0,
      noPhone: !b.phone,
      missingHours: !b.hasHours,
    };

    const gapCount = Object.values(gaps).filter(Boolean).length;

    // Base score starts from baseline potential (50) + gap weights
    const initialScore = Math.min(
      100,
      Math.max(
        40,
        50 +
          gapCount * 8 +
          (gaps.noWebsite ? 18 : 0) +
          (gaps.lowRating ? 12 : 0) +
          (gaps.unansweredReviews ? 10 : 0) +
          (gaps.fewPhotos ? 8 : 0)
      )
    );

    return { ...b, gaps, gapCount, initialScore };
  });

  return scored.sort((a, b) => b.initialScore - a.initialScore);
}
