export type Plan = "free" | "freelancer" | "growth" | "agency";

export interface PlanFeatureMatrix {
  customPrompts: boolean;
  customFilters: boolean;
  gapAnalyzer: boolean;
  csvExport: boolean;
  teamSeats: number;
  maxSearchResults: number;
  creditRollover: number | boolean;
  apiAccess: boolean;
  savedTemplates: number;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatureMatrix> = {
  free: {
    customPrompts: false,
    customFilters: true,
    gapAnalyzer: false,
    csvExport: false,
    teamSeats: 1,
    maxSearchResults: 20,
    creditRollover: false,
    apiAccess: false,
    savedTemplates: 2,
  },
  freelancer: {
    customPrompts: false,
    customFilters: true,
    gapAnalyzer: true,
    csvExport: false,
    teamSeats: 1,
    maxSearchResults: 30,
    creditRollover: false,
    apiAccess: false,
    savedTemplates: 5,
  },
  growth: {
    customPrompts: true,
    customFilters: true,
    gapAnalyzer: true,
    csvExport: true,
    teamSeats: 1,
    maxSearchResults: 50,
    creditRollover: 500,
    apiAccess: false,
    savedTemplates: 20,
  },
  agency: {
    customPrompts: true,
    customFilters: true,
    gapAnalyzer: true,
    csvExport: true,
    teamSeats: 5,
    maxSearchResults: 50,
    creditRollover: 999999,
    apiAccess: true,
    savedTemplates: 999,
  },
};

export function canUseFeature(
  plan: Plan,
  feature: keyof PlanFeatureMatrix
): boolean {
  const planData = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  return Boolean(planData[feature]);
}

export function getPlanLimit(
  plan: Plan,
  limit: keyof PlanFeatureMatrix
): number {
  const planData = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  const val = planData[limit];
  return typeof val === "number" ? val : 0;
}
