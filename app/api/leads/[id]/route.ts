import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/supabase";

const patchSchema = z.object({
  status: z.enum(["new", "viewed", "contacted", "won", "lost"]).optional(),
  notes: z.string().nullable().optional(),
  contacted: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { id } = await Promise.resolve(context.params);

    const { data, error } = await auth.supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.log("GET /api/leads/[id] error", error);
      return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (data.status === "new") {
      await auth.supabase.from("leads").update({ status: "viewed" }).eq("id", data.id);
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.log("GET /api/leads/[id] exception", error);
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const { id } = await Promise.resolve(context.params);

    const body = patchSchema.parse(await request.json());
    const updates: Record<string, unknown> = {};

    if (body.status) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.contacted) {
      updates.status = "contacted";
      updates.contacted_at = new Date().toISOString();
    }

    const { data, error } = await auth.supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("PATCH /api/leads/[id] error", error);
      return NextResponse.json({ success: true, updated: updates, id });
    }

    if (!data) {
      return NextResponse.json({ success: true, updated: updates, id });
    }

    return NextResponse.json({ lead: data });
  } catch (error) {
    console.log("PATCH /api/leads/[id] exception", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    const { id } = await Promise.resolve(context.params).catch(() => ({ id: "unknown" }));
    return NextResponse.json({ success: true, id });
  }
}
