import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";
import { getPortalUrl } from "@/lib/payments/paymentEngine";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const portalUrl = await getPortalUrl(auth.user.id);
    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("POST /api/subscriptions/portal error:", error);
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/credits`,
    });
  }
}
