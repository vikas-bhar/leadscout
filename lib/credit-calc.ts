import {
  CREDIT_COSTS,
  CREDIT_PACKAGES,
  type CreditPackage,
  type SearchCostBreakdown,
} from "@/types";

export const LOW_CREDIT_THRESHOLD = 20;

export function calculateSearchCost(resultCount: number): SearchCostBreakdown {
  const batches = Math.ceil(resultCount / 10);
  const mapsCredits = batches * CREDIT_COSTS.mapsPerTenResults;
  const instagramCredits = batches * CREDIT_COSTS.instagramPerTenProfiles;
  const analysisCredits = resultCount * CREDIT_COSTS.aiGapAnalysisPerBusiness;
  const pitchCredits = resultCount * CREDIT_COSTS.aiPitchPerBusiness;

  return {
    mapsCredits,
    instagramCredits,
    analysisCredits,
    pitchCredits,
    totalCredits: mapsCredits + instagramCredits + analysisCredits + pitchCredits,
    resultCount,
  };
}

export function getCreditPackage(packageId: CreditPackage["id"]): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((item) => item.id === packageId);
}

export function packageCreditsAwarded(pack: CreditPackage): number {
  return pack.credits + pack.bonusCredits;
}

export function isLowCredits(availableCredits: number): boolean {
  return availableCredits < LOW_CREDIT_THRESHOLD;
}

export function estimateSearchesRemaining(availableCredits: number, typicalResultCount = 10): number {
  const cost = calculateSearchCost(typicalResultCount).totalCredits;
  if (cost <= 0) return 0;
  return Math.floor(availableCredits / cost);
}
