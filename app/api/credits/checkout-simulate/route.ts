/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { addUserCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { itemType, id, credits, amount } = await request.json();

    if (!credits || credits <= 0) {
      return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    if (itemType === "subscription") {
      // Update subscription and add credits
      await supabase
        .from("users")
        .update({
          subscription_plan: id,
          subscription_status: "active",
          custom_prompts_enabled: id !== "freelancer",
        })
        .eq("id", auth.user.id);

      await addUserCredits({
        userId: auth.user.id,
        credits: Number(credits),
        type: "subscription",
        action: "plan_purchase",
        description: `Subscribed to plan ${id} ($${amount})`,
      }, supabase);
    } else {
      // Add one-time or flexible credits
      await addUserCredits({
        userId: auth.user.id,
        credits: Number(credits),
        type: "purchase",
        action: "credit_pack_purchase",
        description: `Purchased ${credits} credits pack ($${amount})`,
      }, supabase);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed payment of $${amount} and credited ${credits} credits.`,
    });
  } catch (err: any) {
    console.error("POST /api/credits/checkout-simulate error:", err);
    return NextResponse.json({ error: err.message || "Payment simulation failed" }, { status: 500 });
  }
}
