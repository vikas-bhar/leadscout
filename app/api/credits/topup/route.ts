import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/supabase";
import { addUserCredits, getCreditPackage, packageCreditsAwarded } from "@/lib/credits";

export const dynamic = "force-dynamic";

const topupSchema = z.object({
  packageId: z.enum(["starter", "pro", "agency", "demo_50", "demo_100", "free_starter"]).optional(),
  amount: z.number().min(1).max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const body = await request.json().catch(() => ({}));
    const parsed = topupSchema.parse(body);

    let creditsToAdd = 50;
    let description = "Direct Credit Top-up";
    let type: "purchase" | "bonus" = "purchase";

    if (parsed.packageId === "starter" || parsed.packageId === "pro" || parsed.packageId === "agency") {
      const pack = getCreditPackage(parsed.packageId);
      if (pack) {
        creditsToAdd = packageCreditsAwarded(pack);
        description = `${pack.name} (${creditsToAdd} credits)`;
      }
    } else if (parsed.packageId === "demo_50") {
      creditsToAdd = 50;
      description = "Demo Test Refill (+50 credits)";
      type = "bonus";
    } else if (parsed.packageId === "demo_100") {
      creditsToAdd = 100;
      description = "Demo Test Refill (+100 credits)";
      type = "bonus";
    } else if (parsed.packageId === "free_starter") {
      creditsToAdd = 20;
      description = "Starter Recharge (+20 credits)";
      type = "bonus";
    } else if (parsed.amount) {
      creditsToAdd = parsed.amount;
      description = `Custom Top-up (+${creditsToAdd} credits)`;
    }

    const updatedBalance = await addUserCredits(
      {
        userId: auth.user.id,
        credits: creditsToAdd,
        type,
        action: "topup",
        description,
      },
      auth.supabase
    );

    return NextResponse.json({
      success: true,
      added: creditsToAdd,
      balance: updatedBalance,
      availableCredits: updatedBalance?.availableCredits ?? 20,
      totalCredits: updatedBalance?.totalCredits ?? 20,
    });
  } catch (error) {
    console.log("POST /api/credits/topup error", error);
    return NextResponse.json({ error: "Failed to top up credits" }, { status: 500 });
  }
}
