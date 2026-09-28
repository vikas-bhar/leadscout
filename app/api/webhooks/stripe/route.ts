import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addUserCredits, getCreditPackage, packageCreditsAwarded } from "@/lib/credits";
import type { CreditPackage } from "@/types";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/resend";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";

export const runtime = "nodejs";

function creditsFromSession(session: Stripe.Checkout.Session): number {
  const metadataCredits = Number(session.metadata?.credits ?? session.metadata?.monthlyCredits ?? 0);
  if (metadataCredits > 0) return metadataCredits;

  const packageId = session.metadata?.package_id || session.metadata?.packageId;
  if (packageId === "starter" || packageId === "pro" || packageId === "agency" || packageId === "flexible") {
    const pack = getCreditPackage(packageId as CreditPackage["id"]);
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
    const supabase = createSupabaseServiceClient();

    switch (event.type) {
      // ── CHECKOUT SESSION COMPLETED ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.metadata?.user_id;

        if (session.mode === "payment") {
          // One-time credit purchase
          const credits = creditsFromSession(session);
          if (userId && credits > 0) {
            const { data: existing } = await supabase
              .from("credit_transactions")
              .select("id")
              .eq("stripe_session", session.id)
              .maybeSingle();

            if (!existing) {
              const balance = await addUserCredits({
                userId,
                credits,
                type: "purchase",
                action: "stripe_checkout",
                description: `Purchased ${credits} credits`,
                stripeSession: session.id,
              });

              const { data: user } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
              if (user?.email) {
                await sendEmail({
                  to: user.email,
                  subject: `${credits} LeadScout credits added to your wallet`,
                  html: `<p>Your purchase of ${credits} credits was successful!</p>
<p>Current balance: <strong>${balance?.availableCredits ?? "updated"}</strong> credits.</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/search">Start finding leads</a></p>`,
                });
              }
            }
          }
        }

        if (session.mode === "subscription") {
          // Subscription checkout completed
          const planId = session.metadata?.planId;
          if (userId && planId) {
            await activateSubscription(userId, planId, session, supabase);
          }
        }
        break;
      }

      // ── SUBSCRIPTION CREATED / UPDATED ──
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId || sub.metadata?.user_id;

        if (userId) {
          await upsertSubscription(userId, sub, supabase);
        }
        break;
      }

      // ── SUBSCRIPTION CANCELLED ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId || sub.metadata?.user_id;

        if (userId) {
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("stripe_subscription_id", sub.id);

          await supabase
            .from("users")
            .update({ subscription_plan: "free", subscription_status: "inactive" })
            .eq("id", userId);
        }
        break;
      }

      // ── MONTHLY RECURRING INVOICE PAID ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.userId || sub.metadata?.user_id;
          const planId = sub.metadata?.planId;

          if (userId && planId) {
            const plan = STRIPE_PRODUCTS.subscriptions[
              planId as keyof typeof STRIPE_PRODUCTS.subscriptions
            ];

            if (plan) {
              const rollover = typeof plan.creditRollover === "number" ? plan.creditRollover : 999999;

              try {
                await supabase.rpc("reset_monthly_credits", {
                  p_user_id: userId,
                  p_monthly_credits: plan.monthlyCredits,
                  p_rollover: rollover,
                });
              } catch {
                // If RPC not found, top up credits via addUserCredits
                await addUserCredits({
                  userId,
                  credits: plan.monthlyCredits,
                  type: "subscription",
                  action: "monthly_refill",
                  description: `${plan.name} monthly refill (${plan.monthlyCredits} credits)`,
                });
              }

              const { data: user } = await supabase.from("users").select("email").eq("id", userId).maybeSingle();
              if (user?.email) {
                await sendEmail({
                  to: user.email,
                  subject: `Your LeadScout monthly credits (${plan.monthlyCredits}) have been renewed!`,
                  html: `<p>Your ${plan.name} subscription renewed. We've credited ${plan.monthlyCredits} new credits to your account.</p>`,
                });
              }
            }
          }
        }
        break;
      }

      // ── INVOICE PAYMENT FAILED ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.userId || sub.metadata?.user_id;

          if (userId) {
            await supabase
              .from("users")
              .update({ subscription_status: "past_due" })
              .eq("id", userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}

type SupabaseClient = ReturnType<typeof createSupabaseServiceClient>;

async function activateSubscription(
  userId: string,
  planId: string,
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const plan = STRIPE_PRODUCTS.subscriptions[
    planId as keyof typeof STRIPE_PRODUCTS.subscriptions
  ];

  if (!plan) return;

  // Update user profile with plan info
  await supabase
    .from("users")
    .update({
      subscription_plan: planId,
      subscription_status: "active",
      stripe_customer_id: session.customer as string,
      custom_prompts_enabled: planId !== "freelancer",
      max_seats: plan.seats,
    })
    .eq("id", userId);

  // Add monthly credits immediately
  await addUserCredits({
    userId,
    credits: plan.monthlyCredits,
    type: "subscription",
    action: "subscription_activated",
    description: `Subscribed to ${plan.name} plan (+${plan.monthlyCredits} credits)`,
    stripeSession: session.id,
  });
}

async function upsertSubscription(
  userId: string,
  sub: Stripe.Subscription,
  supabase: SupabaseClient
) {
  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      plan_id: sub.metadata?.planId || "freelancer",
      plan_name: sub.metadata?.planName || "Freelancer",
      status: sub.status,
      monthly_credits: parseInt(sub.metadata?.monthlyCredits || "300", 10),
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}
