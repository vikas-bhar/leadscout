import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/supabase";
import { calculateSearchCost, deductUserCredits, getCreditBalance } from "@/lib/credits";
import { generateMockLeads } from "@/lib/lead-generator";
import type { FreelancerType } from "@/types";

export const dynamic = "force-dynamic";

const searchRequestSchema = z.object({
  location: z.string().min(2, "Location is required"),
  businessCategory: z.string().min(1, "Business category is required"),
  freelancerType: z.string().min(1, "Freelancer type is required"),
  resultCount: z.number().min(10).max(50).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const body = await request.json();
    const parsed = searchRequestSchema.parse(body);

    const cost = calculateSearchCost(parsed.resultCount);
    const balance = await getCreditBalance(auth.user.id, auth.supabase);
    const available = balance?.availableCredits ?? 0;

    if (available < cost.totalCredits) {
      return NextResponse.json(
        {
          error: `Insufficient credits. This search requires ${cost.totalCredits} credits, but you have ${available} available.`,
          requiredCredits: cost.totalCredits,
          availableCredits: available,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    const deduction = await deductUserCredits(
      {
        userId: auth.user.id,
        credits: cost.totalCredits,
        action: "search",
        description: `Search for ${parsed.businessCategory} in ${parsed.location} (${parsed.resultCount} results)`,
      },
      auth.supabase
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: "Could not deduct credits for search. Please top up your balance." },
        { status: 400 }
      );
    }

    // Create search record
    const { data: searchRecord } = await auth.supabase
      .from("searches")
      .insert({
        user_id: auth.user.id,
        location: parsed.location,
        business_type: parsed.businessCategory,
        freelancer_type: parsed.freelancerType,
        status: "completed",
        progress: 100,
        progress_message: "Search completed successfully",
        results_count: parsed.resultCount,
        credits_used: cost.totalCredits,
      })
      .select()
      .single();

    const searchId = searchRecord?.id || crypto.randomUUID();

    // Generate enriched leads
    const generatedLeads = generateMockLeads({
      searchId,
      userId: auth.user.id,
      location: parsed.location,
      businessCategory: parsed.businessCategory,
      freelancerType: parsed.freelancerType as FreelancerType,
      count: parsed.resultCount,
    });

    // Map to DB snake_case columns
    const dbLeads = generatedLeads.map((l) => ({
      search_id: searchId,
      user_id: auth.user.id,
      rank: l.rank,
      business_name: l.businessName,
      business_category: l.businessCategory,
      location: l.location,
      google_rating: l.googleRating,
      review_count: l.reviewCount,
      has_website: l.hasWebsite,
      website_url: l.websiteUrl,
      phone: l.phone,
      photo_count: l.photoCount,
      maps_url: l.mapsUrl,
      instagram_handle: l.instagramHandle,
      instagram_followers: l.instagramFollowers,
      instagram_following: l.instagramFollowing,
      instagram_posts: l.instagramPosts,
      last_post_date: l.lastPostDate,
      engagement_rate: l.engagementRate,
      has_link_in_bio: l.hasLinkInBio,
      uses_reels: l.usesReels,
      opportunity_score: l.opportunityScore,
      urgency_level: l.urgencyLevel,
      gaps_found: l.gapsFound,
      best_service: l.bestService,
      secondary_services: l.secondaryServices,
      buying_signals: l.buyingSignals,
      pitches: l.pitches,
      estimated_budget: l.estimatedBudget,
      status: l.status,
      notes: l.notes,
      contacted_at: l.contactedAt,
    }));

    try {
      await auth.supabase.from("leads").insert(dbLeads);
    } catch (insertError) {
      console.log("Error inserting leads into Supabase:", insertError);
    }

    return NextResponse.json({
      success: true,
      searchId,
      resultsCount: generatedLeads.length,
      creditsUsed: cost.totalCredits,
      newBalance: deduction.newBalance,
      leads: generatedLeads,
      search: {
        id: searchId,
        user_id: auth.user.id,
        location: parsed.location,
        business_type: parsed.businessCategory,
        freelancer_type: parsed.freelancerType,
        status: "completed",
        progress: 100,
        progress_message: "Search completed successfully",
        results_count: parsed.resultCount,
        credits_used: cost.totalCredits,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.log("POST /api/search/start exception", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to process search" }, { status: 500 });
  }
}
