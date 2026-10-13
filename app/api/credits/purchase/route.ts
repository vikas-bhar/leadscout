import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/supabase";
import { getCreditPackage, packageCreditsAwarded } from "@/lib/credits";
import type { CreditPackage } from "@/types";
import { getStripe } from "@/lib/stripe";

const purchaseSchema = z.object({
  packageId: z.string(),
  customCredits: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { packageId, customCredits } = purchaseSchema.parse(await request.json());
    const pack = getCreditPackage(packageId as CreditPackage["id"]);

    if (!pack) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please configure STRIPE_SECRET_KEY in settings to enable live checkout." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const credits = customCredits && customCredits > 0 ? Math.round(customCredits) : packageCreditsAwarded(pack);
    // $0.10 per credit = 10 cents per credit
    const unitAmount = customCredits && customCredits > 0 ? Math.round(customCredits * 10) : pack.priceUsd * 100;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: auth.user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: customCredits ? `Custom Flexible Pack — ${credits} credits ($0.10/credit)` : `${pack.name} — ${credits} credits`,
              description: "LeadScout top-up credits never expire ($0.10 = 1 credit)",
            },
          },
        },
      ],
      metadata: {
        user_id: auth.user.id,
        package_id: pack.id,
        credits: String(credits),
      },
      success_url: `${appUrl}/credits?success=1`,
      cancel_url: `${appUrl}/credits?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log("POST /api/credits/purchase exception", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
