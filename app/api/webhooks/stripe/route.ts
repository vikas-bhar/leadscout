import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addUserCredits, getCreditPackage, packageCreditsAwarded } from "@/lib/credits";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

function creditsFromSession(session: Stripe.Checkout.Session): number {
  const metadataCredits = Number(session.metadata?.credits ?? 0);
  if (metadataCredits > 0) return metadataCredits;

  const packageId = session.metadata?.package_id;
  if (packageId === "starter" || packageId === "pro" || packageId === "agency") {
    const pack = getCreditPackage(packageId);
    if (pack) return packageCreditsAwarded(pack);
  }

  return 0;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const stripeSession = session.id;
    const credits = creditsFromSession(session);

    if (!userId || credits <= 0) {
      console.log("Stripe webhook missing user_id or credits", session.id);
      return NextResponse.json({ received: true });
    }

    const supabase = createSupabaseServiceClient();
    const { data: existing } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("stripe_session", stripeSession)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const balance = await addUserCredits({
      userId,
      credits,
      type: "purchase",
      action: "stripe_checkout",
      description: `Purchased ${credits} credits`,
      stripeSession,
    });

    const { data: user } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `${credits} credits added to your account`,
        html: `<p>${credits} credits were added to your FreelanceFind account.</p>
<p>New balance: ${balance?.availableCredits ?? "updated"}.</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/leads">View leads</a></p>`,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.log("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
