import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { data, error } = await auth.supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("GET /api/credits/transactions error", error);
      // Return default signup transaction if query fails or table empty
      return NextResponse.json({
        transactions: [
          {
            id: "initial-signup",
            user_id: auth.user.id,
            type: "bonus",
            credits_amount: 20,
            action: "signup",
            description: "Free starter credits",
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        transactions: [
          {
            id: "initial-signup",
            user_id: auth.user.id,
            type: "bonus",
            credits_amount: 20,
            action: "signup",
            description: "Free starter credits",
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    return NextResponse.json({ transactions: data });
  } catch (error) {
    console.log("GET /api/credits/transactions exception", error);
    return NextResponse.json({ transactions: [] });
  }
}
