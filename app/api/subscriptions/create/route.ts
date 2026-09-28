import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";

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

    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY === "sk_test_placeholder" ||
      plan.priceId.includes("placeholder")
    ) {
      return NextResponse.json(
        { error: "Stripe payment configuration is required. Real payment is mandatory to activate subscription plans and receive credits." },
        { status: 400 }
      );
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
