import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type CreditBalance,
  type CreditType,
} from "@/types";
import { createSupabaseServiceClient } from "@/lib/supabase";

export {
  LOW_CREDIT_THRESHOLD,
  calculateSearchCost,
  getCreditPackage,
  packageCreditsAwarded,
  isLowCredits,
  estimateSearchesRemaining,
} from "@/lib/credit-calc";

// In-memory persistent fallback store per userId (survives when Supabase is offline/not configured)
const inMemoryBalances = new Map<string, { total: number; used: number; available: number }>();
const inMemoryTransactions = new Map<string, Array<{
  id: string;
  user_id: string;
  type: string;
  credits_amount: number;
  action: string | null;
  description: string | null;
  search_id: string | null;
  stripe_session: string | null;
  created_at: string;
}>>();

function getFallbackBalance(userId: string): { total: number; used: number; available: number } {
  let record = inMemoryBalances.get(userId);
  if (!record) {
    record = { total: 20, used: 0, available: 20 };
    inMemoryBalances.set(userId, record);
    // Add default signup transaction
    if (!inMemoryTransactions.has(userId)) {
      inMemoryTransactions.set(userId, [
        {
          id: `initial_${Date.now()}`,
          user_id: userId,
          type: "bonus",
          credits_amount: 20,
          action: "signup",
          description: "Free starter credits (20 credits)",
          search_id: null,
          stripe_session: null,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }
  return record;
}

export function getInMemoryTransactions(userId: string) {
  return inMemoryTransactions.get(userId) || [
    {
      id: "initial-signup",
      user_id: userId,
      type: "bonus",
      credits_amount: 20,
      action: "signup",
      description: "Free starter credits (20 credits)",
      search_id: null,
      stripe_session: null,
      created_at: new Date().toISOString(),
    },
  ];
}

export async function getCreditBalance(
  userId: string,
  client?: SupabaseClient
): Promise<CreditBalance | null> {
  const fallback = getFallbackBalance(userId);

  try {
    const supabase = client || createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("user_credits")
      .select("total_credits, used_credits, available_credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { totalCredits: fallback.total, usedCredits: fallback.used, availableCredits: fallback.available };
    }

    if (!data) {
      // User has no credits record yet - create with 20 initial free credits
      try {
        await supabase.from("user_credits").insert({
          user_id: userId,
          total_credits: fallback.total,
          used_credits: fallback.used,
          available_credits: fallback.available,
        });

        await supabase.from("credit_transactions").insert({
          user_id: userId,
          type: "bonus",
          credits_amount: fallback.total,
          action: "signup",
          description: "Free starter credits (20 credits)",
        });
      } catch (insertErr) {
        console.log("Error inserting initial user_credits:", insertErr);
      }
      return { totalCredits: fallback.total, usedCredits: fallback.used, availableCredits: fallback.available };
    }

    // Sync database state to memory fallback
    fallback.total = data.total_credits;
    fallback.used = data.used_credits;
    fallback.available = data.available_credits;
    inMemoryBalances.set(userId, fallback);

    return {
      totalCredits: data.total_credits,
      usedCredits: data.used_credits,
      availableCredits: data.available_credits,
    };
  } catch {
    return { totalCredits: fallback.total, usedCredits: fallback.used, availableCredits: fallback.available };
  }
}

export async function hasEnoughCredits(userId: string, amount: number, client?: SupabaseClient): Promise<boolean> {
  const balance = await getCreditBalance(userId, client);
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
}, client?: SupabaseClient): Promise<void> {
  // Always update in-memory log
  const txList = inMemoryTransactions.get(params.userId) || [];
  txList.unshift({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: params.userId,
    type: params.type,
    credits_amount: params.creditsAmount,
    action: params.action ?? null,
    description: params.description ?? null,
    search_id: params.searchId ?? null,
    stripe_session: params.stripeSession ?? null,
    created_at: new Date().toISOString(),
  });
  inMemoryTransactions.set(params.userId, txList);

  try {
    const supabase = client || createSupabaseServiceClient();
    await supabase.from("credit_transactions").insert({
      user_id: params.userId,
      type: params.type,
      credits_amount: params.creditsAmount,
      action: params.action ?? null,
      description: params.description ?? null,
      search_id: params.searchId ?? null,
      stripe_session: params.stripeSession ?? null,
    });
  } catch (error) {
    console.log("logCreditTransaction error", error);
  }
}

export async function deductUserCredits(params: {
  userId: string;
  credits: number;
  action: string;
  description: string;
  searchId?: string;
}, client?: SupabaseClient): Promise<{ success: boolean; previousBalance: number; newBalance: number }> {
  const fallback = getFallbackBalance(params.userId);
  const previousBalance = fallback.available;

  if (fallback.available < params.credits) {
    return {
      success: false,
      previousBalance,
      newBalance: fallback.available,
    };
  }

  // Deduct in memory
  fallback.used += params.credits;
  fallback.available -= params.credits;
  inMemoryBalances.set(params.userId, fallback);

  // Sync to database if available
  try {
    const supabase = client || createSupabaseServiceClient();
    const { error } = await supabase.rpc("deduct_credits", {
      p_user_id: params.userId,
      p_credits: params.credits,
    });

    if (error) {
      await supabase
        .from("user_credits")
        .update({
          used_credits: fallback.used,
          available_credits: fallback.available,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", params.userId);
    }
  } catch {
    // Handled in memory
  }

  await logCreditTransaction({
    userId: params.userId,
    type: "usage",
    creditsAmount: -params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
  }, client);

  return {
    success: true,
    previousBalance,
    newBalance: fallback.available,
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
}, client?: SupabaseClient): Promise<CreditBalance | null> {
  const fallback = getFallbackBalance(params.userId);
  fallback.total += params.credits;
  fallback.available += params.credits;
  inMemoryBalances.set(params.userId, fallback);

  try {
    const supabase = client || createSupabaseServiceClient();
    const { error } = await supabase.rpc("add_credits", {
      p_user_id: params.userId,
      p_credits: params.credits,
    });

    if (error) {
      await supabase
        .from("user_credits")
        .update({
          total_credits: fallback.total,
          available_credits: fallback.available,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", params.userId);
    }
  } catch {
    // Handled in memory
  }

  await logCreditTransaction({
    userId: params.userId,
    type: params.type,
    creditsAmount: params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
    stripeSession: params.stripeSession,
  }, client);

  return {
    totalCredits: fallback.total,
    usedCredits: fallback.used,
    availableCredits: fallback.available,
  };
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

export async function deductCredits(
  userId: string,
  amount: number,
  action = "search",
  searchId?: string
): Promise<boolean> {
  const result = await deductUserCredits({
    userId,
    credits: amount,
    action,
    description: `Pipeline search execution (${amount} credits)`,
    searchId,
  });
  return result.success;
}

export async function addCredits(
  userId: string,
  amount: number,
  description = "Credits adjustment",
  searchId?: string
): Promise<CreditBalance | null> {
  return addUserCredits({
    userId,
    credits: amount,
    type: "refund",
    action: "refund",
    description,
    searchId,
  });
}

