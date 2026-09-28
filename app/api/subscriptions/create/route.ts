import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { addCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { planId, interval = "month" } = await request.json();
    const plan = STRIPE_PRODUCTS.subscriptions[
      planId as keyof typeof STRIPE_PRODUCTS.subscriptions
    ];

    if (!plan) {
      return NextResponse.json({ error: "Invalid subscription plan selected." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If Stripe is not configured or placeholder keys are used, support seamless activation for testing
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY === "sk_test_placeholder" ||
      plan.priceId.includes("placeholder")
    ) {
      const supabase = createSupabaseServiceClient();

      // Update user plan directly in demo mode
      await supabase
        .from("users")
        .update({
          subscription_plan: planId,
          subscription_status: "active",
          custom_prompts_enabled: planId !== "freelancer",
          max_seats: plan.seats,
        })
        .eq("id", auth.user.id);

      // Award subscription credits immediately
      await addCredits(
        auth.user.id,
        plan.monthlyCredits,
        "subscription",
        `sub_demo_${Date.now()}`
      );

      // Save subscription record
      await supabase.from("subscriptions").upsert({
        user_id: auth.user.id,
        stripe_subscription_id: `sub_demo_${Date.now()}`,
        stripe_customer_id: `cus_demo_${auth.user.id}`,
        plan_id: planId,
        plan_name: plan.name,
        status: "active",
        monthly_credits: plan.monthlyCredits,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        cancel_at_period_end: false,
      });

      return NextResponse.json({
        success: true,
        mode: "simulated",
        message: `${plan.name} plan activated! ${plan.monthlyCredits} monthly credits loaded into your account.`,
        url: `${appUrl}/credits?subscription=activated&plan=${planId}`,
      });
    }

    const stripe = getStripe();
    const priceId = interval === "year" ? plan.annualPriceId : plan.priceId;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: auth.user.id,
        planId,
        planName: plan.name,
        monthlyCredits: String(plan.monthlyCredits),
        interval,
      },
      subscription_data: {
        metadata: {
          userId: auth.user.id,
          planId,
          planName: plan.name,
          monthlyCredits: String(plan.monthlyCredits),
          interval,
        },
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      cancel_url: `${appUrl}/credits`,
      customer_email: auth.user.email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create subscription checkout";
    console.error("POST /api/subscriptions/create error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
