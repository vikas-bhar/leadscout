import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { addUserCredits } from "@/lib/credits";

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

    const hasValidStripeKey =
      Boolean(process.env.STRIPE_SECRET_KEY) &&
      process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder" &&
      process.env.STRIPE_SECRET_KEY!.startsWith("sk_");

    if (hasValidStripeKey) {
      const stripe = getStripe();
      const unitAmount = (interval === "year" ? plan.annualPrice : plan.price) * 100;
      const validPriceId = interval === "year" ? plan.annualPriceId : plan.priceId;
      const usePriceId = Boolean(validPriceId && !validPriceId.includes("placeholder"));

      const lineItem = usePriceId
        ? { price: validPriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              recurring: {
                interval: interval === "year" ? ("year" as const) : ("month" as const),
              },
              product_data: {
                name: `FreelanceFind ${plan.name} Plan (${interval === "year" ? "Annual" : "Monthly"})`,
                description: `${plan.monthlyCredits} credits/month for automated lead discovery`,
              },
            },
          };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [lineItem],
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
        success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription&plan=${encodeURIComponent(plan.name)}&credits=${plan.monthlyCredits}`,
        cancel_url: `${appUrl}/credits`,
        customer_email: auth.user.email || undefined,
      });

      return NextResponse.json({ url: session.url });
    }

    // Demo/Test mode fallback: Activate subscription and award monthly credits directly
    await addUserCredits({
      userId: auth.user.id,
      credits: plan.monthlyCredits,
      type: "purchase",
      action: "subscription_activation",
      description: `Activated ${plan.name} Plan (${plan.monthlyCredits} credits)`,
    });

    return NextResponse.json({
      url: `${appUrl}/payment/success?type=subscription&plan=${encodeURIComponent(plan.name)}&credits=${plan.monthlyCredits}`,
      testMode: true,
      message: `Activated ${plan.name} plan with ${plan.monthlyCredits} credits in test mode`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create subscription checkout";
    console.error("POST /api/subscriptions/create error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
