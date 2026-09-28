import { NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const supabase = createSupabaseServiceClient();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, plan_name")
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "No active subscription found to cancel." },
        { status: 404 }
      );
    }

    if (sub.stripe_subscription_id.startsWith("sub_demo_")) {
      // Demo subscription cancel
      await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true, status: "cancelling" })
        .eq("user_id", auth.user.id);

      await supabase
        .from("users")
        .update({ subscription_status: "cancelling" })
        .eq("id", auth.user.id);

      return NextResponse.json({
        success: true,
        message: "Your subscription will not renew at the end of the billing period.",
      });
    }

    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe();
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    await supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    await supabase
      .from("users")
      .update({ subscription_status: "cancelling" })
      .eq("id", auth.user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription will cancel at the end of the current period.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel subscription";
    console.error("POST /api/subscriptions/cancel error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
