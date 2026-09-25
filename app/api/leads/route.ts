import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { data, error } = await auth.supabase
      .from("leads")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("opportunity_score", { ascending: false });

    if (error) {
      return NextResponse.json({ leads: [] });
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    console.log("GET /api/leads error:", error);
    return NextResponse.json({ leads: [] });
  }
}
