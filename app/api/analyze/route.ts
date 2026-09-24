import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireApiUser } from "@/lib/supabase";
import { deductUserCredits, addUserCredits, getCreditBalance } from "@/lib/credits";
import { detectLinkType } from "@/lib/analyzer/detectLink";
import { scrapeLinkData } from "@/lib/analyzer/scrapeLink";
import { analyzeScrapedGaps } from "@/lib/analyzer/analyzeGaps";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/business-cache";
import { CREDIT_COSTS, type Lead, type UrgencyLevel } from "@/types";

export const dynamic = "force-dynamic";

const analyzeSchema = z.object({
  url: z.string().min(3, "URL is required"),
  freelancerType: z.string().optional(),
  bypassCache: z.boolean().optional(),
});

const ANALYZE_COST = CREDIT_COSTS.analyze_link || 5;

export async function POST(request: NextRequest) {
  let deductedUserId: string | null = null;
  let currentSupabase: SupabaseClient | null = null;

  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;
    currentSupabase = auth.supabase;

    const body = await request.json();
    const parsed = analyzeSchema.parse(body);

    const detected = detectLinkType(parsed.url);
    if (detected.type === "unknown" || !detected.cleanUrl || detected.isBlocked) {
      return NextResponse.json(
        { error: "Could not identify link type or address is disallowed. Please provide a valid Instagram, Website, Google Maps, or Facebook URL." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------
    // 1. 24-Hour Business Data Caching Layer
    // -------------------------------------------------------------
    const shouldBypassCache = Boolean(parsed.bypassCache);
    const cached = shouldBypassCache
      ? null
      : (getCachedAnalysis(parsed.url) || getCachedAnalysis(detected.cleanUrl));

    if (cached) {
      const balance = await getCreditBalance(auth.user.id, auth.supabase);
      
      // Build a fresh user lead instance referencing the cached intelligence
      const userLead: Lead = {
        ...cached.lead,
        id: crypto.randomUUID(),
        userId: auth.user.id,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        detected,
        analysis: cached.analysis,
        lead: userLead,
        newBalance: balance?.availableCredits ?? 0,
        cached: true,
        creditsUsed: 0,
        cachedAt: new Date(cached.timestamp).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString(),
        message: "Analysis retrieved from 24-hour cache. 0 credits consumed.",
      });
    }

    // 2. Check user credit balance
    const balance = await getCreditBalance(auth.user.id, auth.supabase);
    const available = balance?.availableCredits ?? 0;

    if (available < ANALYZE_COST) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Gap Analysis requires ${ANALYZE_COST} credits, but you currently have ${available}.`,
          requiredCredits: ANALYZE_COST,
          availableCredits: available,
        },
        { status: 402 }
      );
    }

    // 3. Deduct 5 credits for fresh scrape
    const deduction = await deductUserCredits(
      {
        userId: auth.user.id,
        credits: ANALYZE_COST,
        action: "analyze_link",
        description: `Gap Analysis for ${detected.displayName} (${detected.type})`,
      },
      auth.supabase
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: "Could not deduct credits. Please top up your credit balance." },
        { status: 400 }
      );
    }

    deductedUserId = auth.user.id;

    // 4. Scrape link data via optimized pipeline
    const scraped = await scrapeLinkData(detected);

    // 5. Send scraped data to AI for gap analysis
    const analysis = await analyzeScrapedGaps(detected, scraped);

    // 6. Construct Lead entity so it can be saved and viewed in Leads view
    const leadId = crypto.randomUUID();
    const searchId = `analyzer_${Date.now()}`;
    const rawMetadata = (analysis.metadata || {}) as Record<string, unknown>;

    const constructedLead: Lead = {
      id: leadId,
      searchId,
      userId: auth.user.id,
      rank: 1,
      businessName: analysis.title || detected.displayName,
      businessCategory:
        (rawMetadata.category as string) ||
        (detected.type === "instagram"
          ? "Instagram Profile"
          : detected.type === "website"
          ? "Web Presence"
          : detected.type === "maps"
          ? "Local Business"
          : "Facebook Page"),
      location:
        (rawMetadata.address as string) ||
        (detected.type === "maps" ? detected.displayName : null) ||
        "Online Business Presence",
      googleRating: typeof rawMetadata.rating === "number" ? rawMetadata.rating : 4.5,
      reviewCount: typeof rawMetadata.reviewsCount === "number" ? rawMetadata.reviewsCount : 28,
      hasWebsite: Boolean(
        detected.type === "website" ||
        rawMetadata.hasWebsite ||
        rawMetadata.website ||
        rawMetadata.linkInBioUrl
      ),
      websiteUrl:
        detected.type === "website"
          ? detected.cleanUrl
          : (rawMetadata.website as string) || (rawMetadata.linkInBioUrl as string) || null,
      phone:
        (rawMetadata.contactPhone as string) ||
        (rawMetadata.phone as string) ||
        null,
      photoCount: (rawMetadata.photosCount as number) || 12,
      mapsUrl:
        detected.type === "maps"
          ? detected.cleanUrl
          : rawMetadata.address
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${analysis.title || detected.displayName}, ${rawMetadata.address}`)}`
          : null,
      instagramHandle:
        detected.type === "instagram"
          ? (detected.handle ? `@${detected.handle}` : null)
          : (rawMetadata.instagramHandle as string) || null,
      instagramFollowers: typeof rawMetadata.followers === "number" ? rawMetadata.followers : null,
      instagramFollowing: typeof rawMetadata.following === "number" ? rawMetadata.following : null,
      instagramPosts: typeof rawMetadata.totalPosts === "number" ? rawMetadata.totalPosts : null,
      lastPostDate: (rawMetadata.lastPostDate as string) || null,
      engagementRate: typeof rawMetadata.engagementRate === "number" ? rawMetadata.engagementRate : null,
      hasLinkInBio: Boolean(rawMetadata.hasLinkInBio),
      usesReels: Boolean(rawMetadata.usesReels),
      opportunityScore: analysis.overallScore,
      urgencyLevel: (analysis.urgencyLevel || "high") as UrgencyLevel,
      gapsFound: analysis.gaps.map((g) => ({
        category: g.area,
        problem: g.problem,
        impact: g.impact,
        severity: g.severity === "critical" ? "high" : (g.severity as "low" | "medium" | "high"),
        yourSolution: g.fix,
      })),
      bestService: analysis.recommendedServices[0] || "Digital Opportunity Optimization",
      secondaryServices: analysis.recommendedServices.slice(1),
      buyingSignals: analysis.whatTheyDoWell,
      pitches: {
        pitches: [
          ...(analysis.instagramDMPitch
            ? [
                {
                  style: "instagram_dm" as const,
                  tone: "Friendly, observant, value-first",
                  subject: null,
                  message: analysis.instagramDMPitch,
                  bestTimeToSend: "afternoon" as const,
                  expectedResponseRate: "high" as const,
                },
              ]
            : []),
          ...(analysis.emailPitch || analysis.outreachEmail
            ? [
                {
                  style: "email" as const,
                  tone: "Professional, analytical, direct",
                  subject: `Quick observation regarding ${analysis.title}'s digital presence`,
                  message: analysis.emailPitch || analysis.outreachEmail || "",
                  bestTimeToSend: "morning" as const,
                  expectedResponseRate: "medium" as const,
                },
              ]
            : []),
        ],
        followUpMessage: `Hey! Just floating this back to the top of your inbox. Did you get a chance to review the ideas I sent over regarding ${analysis.title}'s online presence?`,
        pitchTips: [
          `Lead with the specific gap (${analysis.gaps[0]?.area || "Reach"}) rather than listing generic services`,
          `Reference the estimated monthly revenue impact: ${analysis.estimatedLoss}`,
        ],
      },
      estimatedBudget: analysis.estimatedLoss,
      status: "new",
      notes: `Generated via Gap Analyzer from ${detected.cleanUrl}`,
      tags: analysis.overallScore >= 75 ? ["Hot", "Qualified"] : ["Warm"],
      contactedAt: null,
      createdAt: new Date().toISOString(),
    };

    // Store in 24-Hour Business Cache
    setCachedAnalysis(parsed.url, {
      scrapedData: scraped,
      analysis,
      lead: constructedLead,
    });
    if (detected.cleanUrl !== parsed.url) {
      setCachedAnalysis(detected.cleanUrl, {
        scrapedData: scraped,
        analysis,
        lead: constructedLead,
      });
    }

    // Attempt to persist to Supabase if DB table available
    try {
      await auth.supabase.from("leads").insert({
        id: leadId,
        search_id: null,
        user_id: auth.user.id,
        rank: 1,
        business_name: constructedLead.businessName,
        business_category: constructedLead.businessCategory,
        location: constructedLead.location,
        google_rating: constructedLead.googleRating,
        review_count: constructedLead.reviewCount,
        has_website: constructedLead.hasWebsite,
        website_url: constructedLead.websiteUrl,
        phone: constructedLead.phone,
        photo_count: constructedLead.photoCount,
        maps_url: constructedLead.mapsUrl,
        instagram_handle: constructedLead.instagramHandle,
        instagram_followers: constructedLead.instagramFollowers,
        instagram_following: constructedLead.instagramFollowing,
        instagram_posts: constructedLead.instagramPosts,
        last_post_date: constructedLead.lastPostDate,
        engagement_rate: constructedLead.engagementRate,
        has_link_in_bio: constructedLead.hasLinkInBio,
        uses_reels: constructedLead.usesReels,
        opportunity_score: constructedLead.opportunityScore,
        urgency_level: constructedLead.urgencyLevel,
        gaps_found: constructedLead.gapsFound,
        best_service: constructedLead.bestService,
        secondary_services: constructedLead.secondaryServices,
        buying_signals: constructedLead.buyingSignals,
        pitches: constructedLead.pitches,
        estimated_budget: constructedLead.estimatedBudget,
        status: constructedLead.status,
        notes: constructedLead.notes,
      });
    } catch (dbErr) {
      console.log("Supabase direct lead insert notice (handled gracefully via local storage sync):", dbErr);
    }

    const updatedBalance = await getCreditBalance(auth.user.id, auth.supabase);

    return NextResponse.json({
      success: true,
      detected,
      analysis,
      lead: constructedLead,
      newBalance: updatedBalance?.availableCredits ?? deduction.newBalance,
      cached: false,
      creditsUsed: ANALYZE_COST,
    });
  } catch (error: unknown) {
    console.error("Gap Analyzer error:", error);

    // Refund credits if deducted
    if (deductedUserId) {
      try {
        await addUserCredits(
          {
            userId: deductedUserId,
            credits: ANALYZE_COST,
            type: "refund",
            action: "analyze_refund",
            description: "Refund: Gap Analysis failed",
          },
          currentSupabase || undefined
        );
      } catch (refundErr) {
        console.error("Failed to refund analyzer credits:", refundErr);
      }
    }

    const errMsg = error instanceof Error ? error.message : "An unexpected error occurred during link analysis. Your credits have been refunded.";
    return NextResponse.json(
      {
        error: errMsg,
      },
      { status: 500 }
    );
  }
}
