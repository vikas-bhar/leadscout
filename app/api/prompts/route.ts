/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, createSupabaseServiceClient } from "@/lib/supabase";
import { DEFAULT_PROMPT_TEMPLATES } from "@/lib/customization/defaultTemplates";
import type { CustomPromptConfig } from "@/lib/customization/promptBuilder";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("custom_prompts")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      // Return default prompt templates if no custom user prompts yet
      return NextResponse.json({
        prompts: DEFAULT_PROMPT_TEMPLATES,
        templates: DEFAULT_PROMPT_TEMPLATES,
      });
    }

    const formatted: CustomPromptConfig[] = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || "",
      promptType: (row.prompt_type as any) || "full",
      systemPrompt: row.system_prompt as string,
      analysisPrompt: row.analysis_prompt as string,
      pitchPrompt: (row.pitch_prompt as string) || "",
      scoringCriteria: Array.isArray(row.scoring_criteria) ? row.scoring_criteria : [],
      isActive: row.is_active as boolean,
      isDefault: row.is_default as boolean,
      usageCount: (row.usage_count as number) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return NextResponse.json({
      prompts: formatted,
      templates: DEFAULT_PROMPT_TEMPLATES,
    });
  } catch (error) {
    console.error("GET /api/prompts error:", error);
    return NextResponse.json({
      prompts: DEFAULT_PROMPT_TEMPLATES,
      templates: DEFAULT_PROMPT_TEMPLATES,
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const body = (await request.json()) as Partial<CustomPromptConfig>;
    if (!body.name || !body.systemPrompt || !body.analysisPrompt) {
      return NextResponse.json(
        { error: "Name, system prompt, and analysis instructions are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();
    const promptId = body.id && !body.id.startsWith("smm-") && !body.id.startsWith("web-")
      ? body.id
      : undefined;

    const payload: Record<string, unknown> = {
      user_id: auth.user.id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      prompt_type: body.promptType || "full",
      system_prompt: body.systemPrompt,
      analysis_prompt: body.analysisPrompt,
      pitch_prompt: body.pitchPrompt || "",
      scoring_criteria: body.scoringCriteria || [],
      is_active: body.isActive !== false,
      is_default: Boolean(body.isDefault),
      updated_at: new Date().toISOString(),
    };

    if (promptId) {
      payload.id = promptId;
    }

    // If set as default, unset others first
    if (body.isDefault) {
      await supabase
        .from("custom_prompts")
        .update({ is_default: false })
        .eq("user_id", auth.user.id);
    }

    const { data, error } = await supabase
      .from("custom_prompts")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert error, falling back to local memory:", error);
      return NextResponse.json({
        success: true,
        prompt: {
          ...payload,
          id: promptId || `p_${Date.now()}`,
        },
      });
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch (err: unknown) {
    console.error("POST /api/prompts error:", err);
    const message = err instanceof Error ? err.message : "Failed to save prompt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing prompt id" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    await supabase.from("custom_prompts").delete().eq("id", id).eq("user_id", auth.user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
