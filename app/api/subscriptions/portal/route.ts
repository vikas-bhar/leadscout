import { NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const supabase = createSupabaseServiceClient();
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!userData?.stripe_customer_id || userData.stripe_customer_id.startsWith("cus_demo_")) {
      // In demo mode or if no Stripe customer exists, redirect to credits management
      return NextResponse.json({ url: `${appUrl}/credits` });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${appUrl}/credits`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to open billing portal";
    console.error("POST /api/subscriptions/portal error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
