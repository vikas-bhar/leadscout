import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getUserSubscription } from "@/lib/subscriptions/subscriptionEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const sub = await getUserSubscription(auth.user.id);
    return NextResponse.json(sub);
  } catch (error) {
    console.error("GET /api/user/subscription error:", error);
    return NextResponse.json({ error: "Failed to fetch user subscription" }, { status: 500 });
  }
}
