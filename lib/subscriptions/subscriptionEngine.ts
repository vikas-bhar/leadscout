/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServiceClient } from "@/lib/supabase";

export type SubscriptionState =
  | "free"           // Never subscribed
  | "trialing"       // In free trial period
  | "active"         // Paying subscriber
  | "past_due"       // Payment failed, grace period
  | "cancelled"      // Cancelled, still has access
  | "expired";       // No access

export type PlanTier =
  | "free"
  | "freelancer"     // $19/mo — 300 credits
  | "growth"         // $49/mo — 1000 credits
  | "agency";        // $99/mo — 3000 credits

export interface UserSubscription {
  userId: string;
  state: SubscriptionState;
  plan: PlanTier;
  planName: string;
  monthlyCredits: number;
  availableCredits: number;
  usedCredits: number;
  creditRollover: number;
  renewalDate: Date | null;
  cancelledAt: Date | null;
  trialEndsAt: Date | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  canUseApp: boolean;
  canRunSearch: boolean;
  canUseCustomPrompts: boolean;
  canExportCSV: boolean;
  canUseGapAnalyzer: boolean;
  seats: number;
  message: string;
}

// What happens at each subscription state
export const SUBSCRIPTION_RULES = {
  free: {
    canUseApp: true,
    canRunSearch: true,
    canUseCustomPrompts: false,
    canExportCSV: false,
    canUseGapAnalyzer: false,
    seats: 1,
    monthlyCredits: 0,
    creditRefill: false,
    message: "You are on the free plan. Buy credits to search.",
  },
  trialing: {
    canUseApp: true,
    canRunSearch: true,
    canUseCustomPrompts: true,
    canExportCSV: true,
    canUseGapAnalyzer: true,
    seats: 1,
    creditRefill: true,
    message: "Trial active. Full access until trial ends.",
  },
  active: {
    canUseApp: true,
    canRunSearch: true,
    canUseCustomPrompts: true,
    canExportCSV: true,
    canUseGapAnalyzer: true,
    creditRefill: true,
    message: "Subscription active.",
  },
  past_due: {
    canUseApp: true,
    canRunSearch: true,
    canUseCustomPrompts: true,
    canExportCSV: false,
    canUseGapAnalyzer: true,
    creditRefill: false,
    message: "Payment failed. Update your payment method to continue.",
  },
  cancelled: {
    canUseApp: true,
    canRunSearch: true,
    canUseCustomPrompts: false,
    canExportCSV: false,
    canUseGapAnalyzer: false,
    creditRefill: false,
    message: "Subscription cancelled. Access until end of billing period.",
  },
  expired: {
    canUseApp: true,
    canRunSearch: false,
    canUseCustomPrompts: false,
    canExportCSV: false,
    canUseGapAnalyzer: false,
    creditRefill: false,
    message: "Subscription expired. Resubscribe to continue.",
  },
};

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = createSupabaseServiceClient();

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  // Get credit balance
  const { data: credits } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get active subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine state
  let state: SubscriptionState = "free";

  if (sub) {
    const now = new Date();
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;

    if (sub.status === "trialing") {
      state = "trialing";
    } else if (sub.status === "active") {
      if (sub.cancel_at_period_end && periodEnd && periodEnd > now) {
        state = "cancelled";
      } else if (periodEnd && periodEnd < now) {
        state = "expired";
      } else {
        state = "active";
      }
    } else if (sub.status === "past_due") {
      state = "past_due";
    } else if (sub.status === "canceled") {
      state = "expired";
    }
  }

  const plan = ((user?.subscription_plan as PlanTier) || (sub?.plan_id as PlanTier) || "free") as PlanTier;
  const planNames: Record<PlanTier, string> = {
    free: "Free",
    freelancer: "Freelancer",
    growth: "Growth",
    agency: "Agency",
  };
  const planName = planNames[plan] || "Free";
  const rules = SUBSCRIPTION_RULES[state] || SUBSCRIPTION_RULES.free;

  return {
    userId,
    state,
    plan,
    planName,
    monthlyCredits: sub?.monthly_credits || (plan === "agency" ? 3000 : plan === "growth" ? 1000 : plan === "freelancer" ? 300 : 0),
    availableCredits: credits?.available_credits ?? 20,
    usedCredits: credits?.used_credits ?? 0,
    creditRollover: plan === "agency" ? 999999 : plan === "growth" ? 500 : 0,
    renewalDate: sub?.current_period_end ? new Date(sub.current_period_end) : null,
    cancelledAt: sub?.cancelled_at ? new Date(sub.cancelled_at) : null,
    trialEndsAt: sub?.trial_end ? new Date(sub.trial_end) : null,
    stripeSubscriptionId: sub?.stripe_subscription_id || null,
    stripeCustomerId: user?.stripe_customer_id || null,
    canUseApp: rules.canUseApp,
    canRunSearch: rules.canRunSearch,
    canUseCustomPrompts: rules.canUseCustomPrompts,
    canExportCSV: rules.canExportCSV,
    canUseGapAnalyzer: rules.canUseGapAnalyzer,
    seats: plan === "agency" ? 5 : 1,
    message: rules.message,
  };
}
