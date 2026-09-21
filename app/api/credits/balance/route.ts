import { NextResponse } from "next/server";
import { getCreditBalance } from "@/lib/credits";
import { requireApiUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    // Use the authenticated client so RLS allows reading user_credits
    const balance = await getCreditBalance(auth.user.id, auth.supabase);
    
    const totalCredits = balance?.totalCredits ?? 20;
    const usedCredits = balance?.usedCredits ?? 0;
    const availableCredits = balance?.availableCredits ?? 20;

    return NextResponse.json({
      totalCredits,
      usedCredits,
      availableCredits,
      total_credits: totalCredits,
      used_credits: usedCredits,
      available_credits: availableCredits,
    });
  } catch (error) {
    console.log("GET /api/credits/balance error", error);
    return NextResponse.json({
      totalCredits: 20,
      usedCredits: 0,
      availableCredits: 20,
      total_credits: 20,
      used_credits: 0,
      available_credits: 20,
    }, { status: 200 });
  }
}
