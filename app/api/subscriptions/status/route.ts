import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getUserSubscription } from "@/lib/subscriptions/subscriptionEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const subscription = await getUserSubscription(auth.user.id);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("GET /api/subscriptions/status error:", error);
    return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 });
  }
}
