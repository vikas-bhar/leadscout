import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const searchId = request.nextUrl.searchParams.get("id");
    if (!searchId) {
      return NextResponse.json({ error: "Missing search id" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("searches")
      .select("*")
      .eq("id", searchId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.log("GET /api/search/status error", error);
      return NextResponse.json({ error: "Failed to load search status" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    return NextResponse.json({ search: data });
  } catch (error) {
    console.log("GET /api/search/status exception", error);
    return NextResponse.json({ error: "Failed to load search status" }, { status: 500 });
  }
}
