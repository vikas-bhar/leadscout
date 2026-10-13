/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { addUserCredits } from "@/lib/credits";
import { sendEmail } from "@/lib/resend";

const stripeApiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2023-10-16",
});

export type PaymentType =
  | "one_time_credits"
  | "subscription_new"
  | "subscription_upgrade"
  | "subscription_downgrade";

export interface PaymentIntent {
  type: PaymentType;
  userId: string;
  userEmail: string;
  planId?: string;
  creditPackId?: string;
  currentPlanId?: string;
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutRedirect?: string;
  error?: string;
}

// ─────────────────────────────────────────────
// CREATE STRIPE CUSTOMER (once per user)
// ─────────────────────────────────────────────
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = createSupabaseServiceClient();

  // Check if customer already exists
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // If live Stripe is configured, create customer
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder") {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    await supabase
      .from("users")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);

    return customer.id;
  }

  const demoCustId = `cus_demo_${userId}`;
  await supabase
    .from("users")
    .update({ stripe_customer_id: demoCustId })
    .eq("id", userId);

  return demoCustId;
}

// ─────────────────────────────────────────────
// ONE-TIME CREDIT PURCHASE
// ─────────────────────────────────────────────
export async function createCreditCheckout(
  userId: string,
  email: string,
  name: string,
  pack: {
    id: string;
    name: string;
    credits: number;
    price: number;
    priceId: string;
  }
): Promise<CheckoutResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      return {
        success: false,
        error: "Stripe is not configured. Please use the in-app secure payment modal.",
      };
    }

    const customerId = await getOrCreateStripeCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(pack.price * 100),
            product_data: {
              name: `${pack.name} — ${pack.credits} Credits`,
              description: "Top-up credits never expire",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: "one_time_credits",
        packId: pack.id,
        credits: String(pack.credits),
        packName: pack.name,
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits&credits=${pack.credits}`,
      cancel_url: `${appUrl}/payment/cancelled`,
      allow_promotion_codes: true,
    });

    return { success: true, checkoutUrl: session.url! };
  } catch (error) {
    console.error("Credit checkout error:", error);
    return {
      success: false,
      error: "Could not create checkout session",
    };
  }
}

// ─────────────────────────────────────────────
// SUBSCRIPTION CHECKOUT
// ─────────────────────────────────────────────
export async function createSubscriptionCheckout(
  userId: string,
  email: string,
  name: string,
  plan: {
    id: string;
    name: string;
    priceId: string;
    monthlyCredits: number;
    seats: number;
    price: number;
  },
  billing: "monthly" | "annual" = "monthly"
): Promise<CheckoutResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      return {
        success: false,
        error: "Stripe is not configured. Please use the in-app secure payment modal.",
      };
    }

    const customerId = await getOrCreateStripeCustomer(userId, email, name);

    // Check if user already has subscription
    const supabase = createSupabaseServiceClient();
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // If upgrading existing subscription
    if (existingSub?.stripe_subscription_id && !existingSub.stripe_subscription_id.startsWith("sub_demo")) {
      return await upgradeSubscription(userId, existingSub.stripe_subscription_id, plan);
    }

    // New subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: "subscription_new",
        planId: plan.id,
        planName: plan.name,
        monthlyCredits: String(plan.monthlyCredits),
        seats: String(plan.seats),
        billing,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: plan.id,
          planName: plan.name,
          monthlyCredits: String(plan.monthlyCredits),
          seats: String(plan.seats),
        },
        trial_period_days: 7,
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=subscription&plan=${plan.id}`,
      cancel_url: `${appUrl}/payment/cancelled`,
      allow_promotion_codes: true,
    });

    return { success: true, checkoutUrl: session.url! };
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return {
      success: false,
      error: "Could not create subscription checkout",
    };
  }
}

// ─────────────────────────────────────────────
// UPGRADE EXISTING SUBSCRIPTION
// ─────────────────────────────────────────────
async function upgradeSubscription(
  userId: string,
  subscriptionId: string,
  newPlan: { id: string; name: string; priceId: string; monthlyCredits: number }
): Promise<CheckoutResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItemId = sub.items.data[0].id;

    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItemId,
          price: newPlan.priceId,
        },
      ],
      proration_behavior: "always_invoice",
      metadata: {
        userId,
        planId: newPlan.id,
        planName: newPlan.name,
        monthlyCredits: String(newPlan.monthlyCredits),
        planChanged: "true",
      },
    });

    const supabase = createSupabaseServiceClient();
    await supabase
      .from("subscriptions")
      .update({
        plan_id: newPlan.id,
        plan_name: newPlan.name,
        monthly_credits: newPlan.monthlyCredits,
      })
      .eq("stripe_subscription_id", subscriptionId);

    await supabase
      .from("users")
      .update({ subscription_plan: newPlan.id })
      .eq("id", userId);

    return {
      success: true,
      checkoutRedirect: `${appUrl}/payment/success?type=upgrade&plan=${newPlan.id}`,
    };
  } catch (error) {
    console.error("Upgrade error:", error);
    return { success: false, error: "Could not upgrade subscription" };
  }
}

// ─────────────────────────────────────────────
// COMPLETE WEBHOOK HANDLER
// ─────────────────────────────────────────────
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ success: boolean; message: string }> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"
    );
  } catch (err: any) {
    return { success: false, message: `Invalid signature: ${err.message}` };
  }

  const supabase = createSupabaseServiceClient();

  try {
    switch (event.type) {
      // ── ONE TIME PAYMENT SUCCESS ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment" && session.payment_status === "paid") {
          const userId = session.metadata?.userId || session.metadata?.user_id;
          const credits = parseInt(session.metadata?.credits || "0", 10);
          const packName = session.metadata?.packName || "Credits";

          if (userId && credits > 0) {
            await addUserCredits(
              {
                userId,
                credits,
                type: "purchase",
                action: "credit_purchase",
                description: `Purchased ${packName} — ${credits} credits`,
              },
              supabase
            );

            await sendEmail({
              to: session.customer_details?.email || "user@example.com",
              subject: `${credits} credits added to your account`,
              html: `<p>Payment confirmed! ${credits} credits have been loaded into your LeadScout wallet.</p>`,
            });
          }
        }

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId || session.metadata?.user_id;
          const planId = session.metadata?.planId || session.metadata?.plan_id || "freelancer";
          const planName = session.metadata?.planName || planId;
          const monthlyCredits = parseInt(session.metadata?.monthlyCredits || "0", 10);

          if (userId && monthlyCredits > 0) {
            await addUserCredits(
              {
                userId,
                credits: monthlyCredits,
                type: "subscription",
                action: "plan_subscription_start",
                description: `Subscribed to ${planName} plan (+${monthlyCredits} monthly credits)`,
              },
              supabase
            );

            await supabase
              .from("users")
              .update({
                subscription_plan: planId,
                subscription_status: "active",
                custom_prompts_enabled: planId !== "freelancer",
              })
              .eq("id", userId);

            await sendEmail({
              to: session.customer_details?.email || "user@example.com",
              subject: `Welcome to ${planName} — ${monthlyCredits} credits ready 🎉`,
              html: `<p>Your ${planName} subscription is active! Your first ${monthlyCredits} credits are ready.</p>`,
            });
          }
        }
        break;
      }

      // ── SUBSCRIPTION CREATED ──
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }

      // ── SUBSCRIPTION UPDATED ──
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);

        if (sub.metadata?.planChanged === "true") {
          const userId = sub.metadata.userId;
          const planName = sub.metadata.planName || "New Plan";
          const monthlyCredits = parseInt(sub.metadata.monthlyCredits || "0", 10);

          if (userId && monthlyCredits > 0) {
            const creditsToAdd = Math.floor(monthlyCredits * 0.5);
            await addUserCredits(
              {
                userId,
                credits: creditsToAdd,
                type: "bonus",
                action: "plan_upgrade",
                description: `Upgrade bonus to ${planName} (+${creditsToAdd} credits)`,
              },
              supabase
            );
          }
        }
        break;
      }

      // ── SUBSCRIPTION DELETED ──
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (userId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);

          await supabase
            .from("users")
            .update({
              subscription_plan: "free",
              subscription_status: "inactive",
              custom_prompts_enabled: false,
            })
            .eq("id", userId);
        }
        break;
      }

      // ── MONTHLY RENEWAL ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.billing_reason === "subscription_cycle" && invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.userId;
          const planId = sub.metadata?.planId;
          const monthlyCredits = parseInt(sub.metadata?.monthlyCredits || "0", 10);

          if (userId && monthlyCredits > 0) {
            await addUserCredits(
              {
                userId,
                credits: monthlyCredits,
                type: "subscription",
                action: "monthly_refill",
                description: `Monthly credit refill for ${planId} plan (+${monthlyCredits} credits)`,
              },
              supabase
            );
          }
        }
        break;
      }

      // ── PAYMENT FAILED ──
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.userId;

          if (userId) {
            await supabase
              .from("subscriptions")
              .update({
                status: "past_due",
              })
              .eq("stripe_subscription_id", sub.id);
          }
        }
        break;
      }
    }

    return { success: true, message: "Webhook handled" };
  } catch (error) {
    console.error("Webhook error:", error);
    return { success: false, message: "Webhook processing failed" };
  }
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const supabase = createSupabaseServiceClient();

  await supabase.from("subscriptions").upsert(
    {
      user_id: sub.metadata?.userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      plan_id: sub.metadata?.planId || "",
      plan_name: sub.metadata?.planName || "",
      status: sub.status,
      monthly_credits: parseInt(sub.metadata?.monthlyCredits || "0", 10),
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

export async function getPortalUrl(userId: string): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  if (!user?.stripe_customer_id || user.stripe_customer_id.startsWith("cus_demo")) {
    return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits`;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits`,
  });

  return session.url;
}
