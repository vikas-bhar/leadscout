import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json({ success: true });
  }
}
