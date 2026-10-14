import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { addUserCredits, getCreditBalance } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    let amount = 50;
    try {
      const body = await request.json();
      if (typeof body.amount === "number" && body.amount > 0 && body.amount <= 100) {
        amount = body.amount;
      }
    } catch {
      // Use default 50
    }

    const updated = await addUserCredits(
      {
        userId: auth.user.id,
        credits: amount,
        type: "bonus",
        action: "demo_refill",
        description: `Free Demo & Testing Credits Refill (+${amount} credits)`,
      },
      auth.supabase
    );

    const balance = updated || (await getCreditBalance(auth.user.id, auth.supabase));

    return NextResponse.json({
      success: true,
      added: amount,
      availableCredits: balance?.availableCredits ?? 50,
      totalCredits: balance?.totalCredits ?? 50,
      newBalance: balance?.availableCredits ?? 50,
      message: `Successfully added ${amount} free test credits to your balance!`,
    });
  } catch (error) {
    console.log("POST /api/credits/topup error", error);
    return NextResponse.json(
      { error: "Could not add credits. Please try again." },
      { status: 500 }
    );
  }
}

