import { NextResponse } from "next/server";
import { getCreditBalance } from "@/lib/credits";
import { requireApiUser } from "@/lib/supabase";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const balance = await getCreditBalance(auth.user.id);
    if (!balance) {
      return NextResponse.json(
        { totalCredits: 0, usedCredits: 0, availableCredits: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(balance);
  } catch (error) {
    console.log("GET /api/credits/balance error", error);
    return NextResponse.json({ error: "Failed to load credit balance" }, { status: 500 });
  }
}
