import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase";
import { hasEnoughCredits, deductUserCredits, addUserCredits } from "@/lib/credits";
import { runCompetitorAnalysis } from "@/lib/competitors/competitorAnalyzer";

export const dynamic = "force-dynamic";

function extractCity(address?: string | null): string {
  if (!address) return "Local Area";
  const parts = address.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return parts[0].trim();
}

function daysSince(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 14;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 14;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const COMPETITOR_COST = 3;

    // Check credits
    const enough = await hasEnoughCredits(user.id, COMPETITOR_COST);
    if (!enough) {
      return NextResponse.json(
        { error: `Insufficient credits. Competitor analysis requires ${COMPETITOR_COST} credits.` },
        { status: 402 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Deduct credits
    const deductRes = await deductUserCredits({
      userId: user.id,
      credits: COMPETITOR_COST,
      action: "competitor_analysis",
      description: `Competitor analysis for ${lead.business_name}`,
    });

    if (!deductRes.success) {
      return NextResponse.json({ error: "Could not deduct credits for competitor analysis" }, { status: 400 });
    }

    try {
      const analysis = await runCompetitorAnalysis(
        {
          name: lead.business_name,
          category: lead.business_category,
          address: lead.location,
          rating: lead.google_rating,
          reviewCount: lead.review_count,
          website: lead.website_url,
          photoCount: lead.photo_count,
          city: extractCity(lead.location),
        },
        {
          followers: lead.instagram_followers,
          engagementRate: lead.engagement_rate,
          daysSinceLastPost: lead.last_post_date ? daysSince(lead.last_post_date) : null,
        }
      );

      if (!analysis) {
        await addUserCredits({
          userId: user.id,
          credits: COMPETITOR_COST,
          type: "refund",
          action: "competitor_refund",
          description: "No competitors found — refunding competitor analysis",
        });
        return NextResponse.json({ error: "No competitors found in this area" }, { status: 404 });
      }

      // Save analysis to Supabase
      const serviceClient = createSupabaseServiceClient();
      await serviceClient
        .from("leads")
        .update({ competitor_analysis: analysis })
        .eq("id", id);

      return NextResponse.json({ success: true, analysis });
    } catch (err) {
      console.error("Competitor analysis execution error:", err);
      await addUserCredits({
        userId: user.id,
        credits: COMPETITOR_COST,
        type: "refund",
        action: "competitor_refund",
        description: "Competitor analysis failed — refunding credits",
      });
      return NextResponse.json({ error: "Competitor analysis failed, credits refunded" }, { status: 500 });
    }
  } catch (error) {
    console.error("Competitor API route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
