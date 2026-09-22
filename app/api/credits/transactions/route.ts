import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getInMemoryTransactions } from "@/lib/credits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const memoryTx = getInMemoryTransactions(auth.user.id);

    try {
      const { data, error } = await auth.supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return NextResponse.json({ transactions: memoryTx });
      }

      return NextResponse.json({ transactions: data });
    } catch {
      return NextResponse.json({ transactions: memoryTx });
    }
  } catch (error) {
    console.log("GET /api/credits/transactions exception", error);
    return NextResponse.json({ transactions: [] });
  }
}
