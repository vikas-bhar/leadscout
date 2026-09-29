import { NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const supabase = createSupabaseServiceClient();

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error("GET /api/credits/history error:", error);
    return NextResponse.json({ transactions: [] });
  }
}
