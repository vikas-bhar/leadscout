import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";

export async function POST() {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    return NextResponse.json(
      {
        error: "Search orchestration is not enabled yet. Complete Phase 4 to run Apify + AI searches.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.log("POST /api/search/start exception", error);
    return NextResponse.json({ error: "Failed to start search" }, { status: 500 });
  }
}
