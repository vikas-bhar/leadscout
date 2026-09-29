import { NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const supabase = createSupabaseServiceClient();

    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq("user_id", auth.user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription will cancel at the end of the current billing cycle. You maintain full access until then.",
    });
  } catch (error) {
    console.error("POST /api/subscriptions/cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
