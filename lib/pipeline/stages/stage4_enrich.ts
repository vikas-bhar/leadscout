import { FilteredBusiness } from "./stage2_filter";
import { InstagramData } from "./stage3_instagram";

export interface EnrichedBusiness extends FilteredBusiness {
  instagram: InstagramData;
  totalGapCount: number;
  hasOnlinePresence: boolean;
  estimatedBusinessSize: "small" | "medium" | "large";
  budgetSignal: "low" | "medium" | "high";
  industryBenchmarks: {
    avgEngagement: number;
    avgFollowers: number;
    avgPostFrequency: number;
  };
}

const INDUSTRY_BENCHMARKS: Record<
  string,
  {
    avgEngagement: number;
    avgFollowers: number;
    avgPostFrequency: number;
  }
> = {
  restaurant: { avgEngagement: 1.5, avgFollowers: 5000, avgPostFrequency: 4 },
  cafe: { avgEngagement: 2.5, avgFollowers: 4000, avgPostFrequency: 5 },
  salon: { avgEngagement: 2.1, avgFollowers: 3000, avgPostFrequency: 5 },
  retail: { avgEngagement: 1.2, avgFollowers: 8000, avgPostFrequency: 3 },
  fitness: { avgEngagement: 3.0, avgFollowers: 10000, avgPostFrequency: 6 },
  hotel: { avgEngagement: 1.8, avgFollowers: 12000, avgPostFrequency: 3 },
  spa: { avgEngagement: 2.3, avgFollowers: 4000, avgPostFrequency: 4 },
  bakery: { avgEngagement: 3.5, avgFollowers: 3000, avgPostFrequency: 5 },
  default: { avgEngagement: 2.0, avgFollowers: 5000, avgPostFrequency: 4 },
};

export function enrichBusinessData(
  business: FilteredBusiness,
  instagram: InstagramData
): EnrichedBusiness {
  // Count ALL gaps across maps and instagram
  const mapsGapCount = business.gapCount;
  const igGapCount = Object.values(instagram.gaps).filter(Boolean).length;
  const totalGapCount = mapsGapCount + igGapCount;

  // Online presence check
  const hasOnlinePresence = Boolean(business.website || instagram.found);

  // Estimate business size from review count
  const estimatedBusinessSize: "small" | "medium" | "large" =
    business.reviewCount > 500
      ? "large"
      : business.reviewCount > 100
      ? "medium"
      : "small";

  // Budget signal
  const budgetSignal: "low" | "medium" | "high" =
    estimatedBusinessSize === "large"
      ? "high"
      : estimatedBusinessSize === "medium"
      ? "medium"
      : "low";

  // Get industry benchmarks
  const category = (business.category || "").toLowerCase();
  const benchmarkKey =
    Object.keys(INDUSTRY_BENCHMARKS).find((key) => category.includes(key)) ||
    "default";

  return {
    ...business,
    instagram,
    totalGapCount,
    hasOnlinePresence,
    estimatedBusinessSize,
    budgetSignal,
    industryBenchmarks: INDUSTRY_BENCHMARKS[benchmarkKey],
  };
}
