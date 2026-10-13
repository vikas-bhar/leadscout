import { NextRequest, NextResponse } from "next/server";
import {
  getDiagnosticLogs,
  clearDiagnosticLogs,
} from "@/lib/diagnostic-logger";
import { requireApiUser } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const result = getDiagnosticLogs({
      type,
      status,
      search,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Diagnostic logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve diagnostic logs" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    clearDiagnosticLogs();
    return NextResponse.json({ success: true, message: "Diagnostic logs cleared" });
  } catch (error) {
    console.error("Diagnostic logs DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to clear diagnostic logs" },
      { status: 500 }
    );
  }
}
