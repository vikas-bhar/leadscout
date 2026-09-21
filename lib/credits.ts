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

export async function getCreditBalance(
  userId: string,
  client?: SupabaseClient
): Promise<CreditBalance | null> {
  try {
    const supabase = client || createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("user_credits")
      .select("total_credits, used_credits, available_credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log("getCreditBalance error", error);
      return { totalCredits: 20, usedCredits: 0, availableCredits: 20 };
    }

    if (!data) {
      // User has no credits record yet - create with 20 initial free credits
      try {
        await supabase.from("user_credits").insert({
          user_id: userId,
          total_credits: 20,
          used_credits: 0,
          available_credits: 20,
        });

        await supabase.from("credit_transactions").insert({
          user_id: userId,
          type: "bonus",
          credits_amount: 20,
          action: "signup",
          description: "Free starter credits",
        });
      } catch (insertErr) {
        console.log("Error inserting initial user_credits:", insertErr);
      }
      return { totalCredits: 20, usedCredits: 0, availableCredits: 20 };
    }

    // If existing record has 0 total and 0 used, grant initial 20 credits
    if (data.total_credits === 0 && data.used_credits === 0 && data.available_credits === 0) {
      try {
        await supabase
          .from("user_credits")
          .update({ total_credits: 20, available_credits: 20, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        await supabase.from("credit_transactions").insert({
          user_id: userId,
          type: "bonus",
          credits_amount: 20,
          action: "signup",
          description: "Free starter credits",
        });
      } catch (updateErr) {
        console.log("Error updating 0 credits record:", updateErr);
      }
      return { totalCredits: 20, usedCredits: 0, availableCredits: 20 };
    }

    return {
      totalCredits: data.total_credits,
      usedCredits: data.used_credits,
      availableCredits: data.available_credits,
    };
  } catch (err) {
    console.log("getCreditBalance exception", err);
    return { totalCredits: 20, usedCredits: 0, availableCredits: 20 };
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
  const supabase = client || createSupabaseServiceClient();
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
  }
}

export async function deductUserCredits(params: {
  userId: string;
  credits: number;
  action: string;
  description: string;
  searchId?: string;
}, client?: SupabaseClient): Promise<{ success: boolean; previousBalance: number; newBalance: number }> {
  const supabase = client || createSupabaseServiceClient();
  const previous = await getCreditBalance(params.userId, supabase);

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
    console.log("deduct_credits RPC error, falling back to direct table update:", error);
    await supabase
      .from("user_credits")
      .update({
        used_credits: (previous.usedCredits || 0) + params.credits,
        available_credits: previous.availableCredits - params.credits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", params.userId);
  }

  await logCreditTransaction({
    userId: params.userId,
    type: "usage",
    creditsAmount: -params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
  }, supabase);

  const updated = await getCreditBalance(params.userId, supabase);

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
}, client?: SupabaseClient): Promise<CreditBalance | null> {
  const supabase = client || createSupabaseServiceClient();

  const { error } = await supabase.rpc("add_credits", {
    p_user_id: params.userId,
    p_credits: params.credits,
  });

  if (error) {
    console.log("add_credits RPC error, falling back to direct table update:", error);
    const current = await getCreditBalance(params.userId, supabase);
    await supabase
      .from("user_credits")
      .update({
        total_credits: (current?.totalCredits || 0) + params.credits,
        available_credits: (current?.availableCredits || 0) + params.credits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", params.userId);
  }

  await logCreditTransaction({
    userId: params.userId,
    type: params.type,
    creditsAmount: params.credits,
    action: params.action,
    description: params.description,
    searchId: params.searchId,
    stripeSession: params.stripeSession,
  }, supabase);

  return getCreditBalance(params.userId, supabase);
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

