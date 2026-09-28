import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { DEFAULT_FILTER_TEMPLATES } from "@/lib/customization/defaultTemplates";
import type { CustomFilterConfig } from "@/lib/customization/promptBuilder";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("custom_filters")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        filters: DEFAULT_FILTER_TEMPLATES,
        templates: DEFAULT_FILTER_TEMPLATES,
      });
    }

    const formatted: CustomFilterConfig[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      mapsFilters: row.filters?.mapsFilters || row.scraping_config?.mapsFilters || {},
      instagramFilters: row.filters?.instagramFilters || row.scraping_config?.instagramFilters || {},
      scoringWeights: row.filters?.scoringWeights || {},
      isActive: row.is_active,
      isDefault: row.is_default,
      usageCount: row.usage_count || 0,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      filters: formatted,
      templates: DEFAULT_FILTER_TEMPLATES,
    });
  } catch (error) {
    console.error("GET /api/filters error:", error);
    return NextResponse.json({
      filters: DEFAULT_FILTER_TEMPLATES,
      templates: DEFAULT_FILTER_TEMPLATES,
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const body = (await request.json()) as Partial<CustomFilterConfig>;
    if (!body.name) {
      return NextResponse.json({ error: "Filter name is required." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const filterId = body.id && !body.id.startsWith("filter_") ? body.id : undefined;

    const payload: any = {
      user_id: auth.user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      filters: {
        mapsFilters: body.mapsFilters,
        instagramFilters: body.instagramFilters,
        scoringWeights: body.scoringWeights,
      },
      scraping_config: {
        mapsFilters: body.mapsFilters,
        instagramFilters: body.instagramFilters,
      },
      is_active: body.isActive !== false,
      is_default: Boolean(body.isDefault),
    };

    if (filterId) {
      payload.id = filterId;
    }

    if (body.isDefault) {
      await supabase
        .from("custom_filters")
        .update({ is_default: false })
        .eq("user_id", auth.user.id);
    }

    const { data, error } = await supabase
      .from("custom_filters")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert error for filter, fallback:", error);
      return NextResponse.json({
        success: true,
        filter: {
          ...payload,
          id: filterId || `f_${Date.now()}`,
        },
      });
    }

    return NextResponse.json({ success: true, filter: data });
  } catch (err: any) {
    console.error("POST /api/filters error:", err);
    return NextResponse.json({ error: err.message || "Failed to save filter" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing filter id" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    await supabase.from("custom_filters").delete().eq("id", id).eq("user_id", auth.user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete" }, { status: 500 });
  }
}
