import {
  CREDIT_COSTS,
  CREDIT_PACKAGES,
  type CreditBalance,
  type CreditPackage,
  type CreditType,
  type SearchCostBreakdown,
} from "@/types";
import { createSupabaseServiceClient } from "@/lib/supabase";

const LOW_CREDIT_THRESHOLD = 20;

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

export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("user_credits")
    .select("total_credits, used_credits, available_credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.log("getCreditBalance error", error);
    return null;
  }

  if (!data) {
    return { totalCredits: 0, usedCredits: 0, availableCredits: 0 };
  }

  return {
    totalCredits: data.total_credits,
    usedCredits: data.used_credits,
    availableCredits: data.available_credits,
  };
}

export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  return Boolean(balance && balance.availableCredits >= amount);
}

export async function logCreditTransaction(params: {
  userId: string;
  type: CreditType;
  creditsAmount: number;
  action?: string;
  description?: string;
  searchId?: string;
  stripeSession?: string;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("credit_transactions").insert({
    user_id: params.userId,
    type: params.type,
    credits_amount: params.creditsAmount,
    action: params.action ?? null,
    description: params.description ?? null,
    search_id: params.searchId ?? null,
    stripe_session: params.stripeSession ?? null,
  });

  if (error) {
    console.log("logCreditTransaction error", error);
    throw error;
  }
}

export async function deductUserCredits(params: {
  userId: string;
  credits: number;
  action: string;
  description: string;
  searchId?: string;
}): Promise<{ success: boolean; previousBalance: number; newBalance: number }> {
  const supabase = createSupabaseServiceClient();
  const previous = await getCreditBalance(params.userId);

  if (!previous || previous.availableCredits < params.credits) {
    return {
      success: false,
      previousBalance: previous?.availableCredits ?? 0,
      newBalance: previous?.availableCredits ?? 0,
    };
  }

  const { error } = await supabase.rpc("deduct_credits", {
    p_user_id: params.userId,
    p_credits: params.credits,
  });

  if (error) {
    console.log("deductUserCredits error", error);
    throw error;
  }

  await logCreditTransaction({
    userId: params.userId,
    type: "usage",
    creditsAmount: -params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
  });

  const updated = await getCreditBalance(params.userId);

  return {
    success: true,
    previousBalance: previous.availableCredits,
    newBalance: updated?.availableCredits ?? previous.availableCredits - params.credits,
  };
}

export async function addUserCredits(params: {
  userId: string;
  credits: number;
  type: Extract<CreditType, "purchase" | "refund" | "bonus">;
  action: string;
  description: string;
  searchId?: string;
  stripeSession?: string;
}): Promise<CreditBalance | null> {
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.rpc("add_credits", {
    p_user_id: params.userId,
    p_credits: params.credits,
  });

  if (error) {
    console.log("addUserCredits error", error);
    throw error;
  }

  await logCreditTransaction({
    userId: params.userId,
    type: params.type,
    creditsAmount: params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
    stripeSession: params.stripeSession,
  });

  return getCreditBalance(params.userId);
}

export async function refundSearchCredits(params: {
  userId: string;
  credits: number;
  searchId: string;
  reason: string;
}): Promise<void> {
  if (params.credits <= 0) return;

  await addUserCredits({
    userId: params.userId,
    credits: params.credits,
    type: "refund",
    action: "search_refund",
    description: params.reason,
    searchId: params.searchId,
  });
}

export function isLowCredits(availableCredits: number): boolean {
  return availableCredits < LOW_CREDIT_THRESHOLD;
}

export function estimateSearchesRemaining(availableCredits: number, typicalResultCount = 10): number {
  const cost = calculateSearchCost(typicalResultCount).totalCredits;
  if (cost <= 0) return 0;
  return Math.floor(availableCredits / cost);
}
