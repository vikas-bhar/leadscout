import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { runPipeline, calculateCredits } from "@/lib/pipeline/masterPipeline";
import { normalizeWebsiteUrl, isValidWebsiteUrl } from "@/lib/pipeline/cleaner";
import { generateDeterministicLeadId, deduplicateLeads, isBusinessExcluded } from "@/lib/deduplication";
import type { Lead, CustomClientFilter, AgentAnalysis, PitchSet } from "@/types";
import type { AIAnalysis } from "@/lib/pipeline/stages/stage5_ai";

export const dynamic = "force-dynamic";

const searchRequestSchema = z.object({
  location: z.string().min(2, "Location is required"),
  businessCategory: z.string().min(1, "Business category is required"),
  freelancerType: z.string().min(1, "Freelancer type is required"),
  freelancerSkills: z.array(z.string()).optional(),
  resultCount: z.number().min(1).max(50).default(10),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  city: z.string().optional(),
  place: z.string().optional(),
  specificPlace: z.string().optional(),
  excludeNames: z.array(z.string()).optional(),
  excludePlaceIds: z.array(z.string()).optional(),
  excludePhones: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  filters: z.any().optional(),
  searchFilters: z.any().optional(),
  customFilter: z.any().optional(),
  customPromptConfig: z.any().optional(),
  customFilterConfig: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.user) return auth.response;

    const body = await request.json();
    console.log("FILTER DEBUG:", JSON.stringify({
      requireNoWebsite: body.filters?.requireNoWebsite ?? body.searchFilters?.requireNoWebsite,
      filtersReceived: body.filters || body.searchFilters,
      customFilter: body.customFilter,
    }));
    const parsed = searchRequestSchema.parse(body);

    let targetResults = parsed.resultCount;
    let requiredCredits = calculateCredits(targetResults);
    const balance = await getCreditBalance(auth.user.id, auth.supabase);
    const available = balance?.availableCredits ?? 20;

    // Auto-scale requested result count to match available credit budget if available credits > 0
    if (available > 0 && available < requiredCredits) {
      while (targetResults > 1 && calculateCredits(targetResults) > available) {
        targetResults--;
      }
      requiredCredits = calculateCredits(targetResults);
    }

    if (available < requiredCredits || targetResults < 1) {
      return NextResponse.json(
        {
          error: `Insufficient credits. This search requires ${requiredCredits} credits, but you have ${available} available.`,
          requiredCredits,
          availableCredits: available,
        },
        { status: 402 }
      );
    }

    const specificPlace = parsed.specificPlace || parsed.place || "";
    const city = parsed.city || "";
    const country = parsed.country || "";
    const customFilter = parsed.customFilter as CustomClientFilter | undefined;

    // 1. Create initial search record in running state
    const { data: searchRecord } = await auth.supabase
      .from("searches")
      .insert({
        user_id: auth.user.id,
        location: parsed.location,
        business_type: customFilter?.nicheFocus || parsed.businessCategory,
        freelancer_type: parsed.freelancerType,
        status: "running",
        progress: 0,
        progress_message: customFilter
          ? `Deploying AI Custom Filter Agent for ${customFilter.nicheFocus}...`
          : "Starting multi-stage intelligence pipeline...",
        results_count: 0,
        credits_used: 0,
      })
      .select()
      .single();

    const searchId = searchRecord?.id || crypto.randomUUID();

    // 2. Run the 8-Stage Production Scraping Pipeline
    const pipelineResult = await runPipeline(
      {
        userId: auth.user.id,
        searchId,
        freelancerType: parsed.freelancerType,
        freelancerSkills: parsed.freelancerSkills || ["content creation", "outreach", "strategy"],
        location: parsed.location,
        businessType: parsed.businessCategory,
        country,
        city,
        specificPlace,
        resultCount: targetResults,
        excludeNames: parsed.excludeNames,
        excludePlaceIds: parsed.excludePlaceIds,
        excludePhones: parsed.excludePhones,
        excludeDomains: parsed.excludeDomains,
        searchFilters: parsed.filters || parsed.searchFilters,
        customFilter,
        customPromptConfig: parsed.customPromptConfig,
        customFilterConfig: parsed.customFilterConfig,
      },
      async (step, total, message) => {
        const progress = Math.round((step / total) * 100);
        try {
          await auth.supabase
            .from("searches")
            .update({ progress, progress_message: message })
            .eq("id", searchId);
        } catch {
          // Non-blocking progress sync
        }
      }
    );

    if (!pipelineResult.success) {
      return NextResponse.json(
        {
          error: pipelineResult.error || "Search pipeline encountered an error",
          refunded: true,
          creditsUsed: 0,
        },
        { status: 500 }
      );
    }

    // 3. Format ranked leads to application frontend types
    const formattedLeads: Lead[] = pipelineResult.leads.map((lead) => {
      const ig = lead.business.instagram;
      const an = lead.analysis as AIAnalysis & AgentAnalysis;
      const gapAnalysisObj = an.gapAnalysis || {};
      const pitchStrategyObj = an.pitchStrategy || {};
      const validWeb = normalizeWebsiteUrl(lead.business.website);
      const hasWeb = Boolean(validWeb && isValidWebsiteUrl(validWeb) && !lead.business.gaps.noWebsite);
      const rawGaps = an.gaps || gapAnalysisObj.gaps || [];

      const gaps = rawGaps
        .filter((g) => {
          const prob = String((g as Record<string, unknown>).problem || "").toLowerCase();
          const cat = String((g as Record<string, unknown>).category || "").toLowerCase();
          return !prob.includes("none detected") && !cat.includes("clean opportunity") && !prob.includes("no gap");
        })
        .map((g) => {
          const gObj = g as Record<string, unknown>;
          return {
            category: (gObj.category as string) || "General Gap",
            problem: (gObj.problem as string) || "",
            impact: (gObj.impact as string) || (gObj.businessImpact as string) || "",
            severity: (((gObj.severity as string) === "critical" ? "high" : gObj.severity) as "low" | "medium" | "high") || "medium",
            yourSolution: (gObj.yourSolution as string) || "",
          };
        });

      if (!hasWeb && !gaps.some((g) => g.category.toLowerCase().includes("website") || g.problem.toLowerCase().includes("website"))) {
        gaps.unshift({
          category: "Website & Mobile Funnel",
          problem: "No official website or online reservation portal listed on Google Business Profile",
          impact: "Loses 100% of online search visitors to competitors with mobile booking sites",
          severity: "high",
          yourSolution: "Design and launch a modern, mobile-first responsive website",
        });
      }

      const pitchSet = lead.pitches as unknown as PitchSet;
      const pitchBundle = {
        pitches: [
          {
            style: "instagram_dm" as const,
            tone: "professional",
            subject: null,
            message: pitchSet.instagramDM?.message || "",
            bestTimeToSend: "morning" as const,
            expectedResponseRate: (pitchSet.instagramDM?.expectedResponseRate === "low" || pitchSet.instagramDM?.expectedResponseRate === "medium" || pitchSet.instagramDM?.expectedResponseRate === "high") ? pitchSet.instagramDM.expectedResponseRate : "high",
          },
          {
            style: "email" as const,
            tone: "professional",
            subject: pitchSet.email?.subject || null,
            message: pitchSet.email?.message || "",
            bestTimeToSend: "morning" as const,
            expectedResponseRate: (pitchSet.email?.expectedResponseRate === "low" || pitchSet.email?.expectedResponseRate === "medium" || pitchSet.email?.expectedResponseRate === "high") ? pitchSet.email.expectedResponseRate : "high",
          },
          {
            style: "whatsapp" as const,
            tone: "friendly",
            subject: null,
            message: pitchSet.whatsapp?.message || "",
            bestTimeToSend: "afternoon" as const,
            expectedResponseRate: (pitchSet.whatsapp?.expectedResponseRate === "low" || pitchSet.whatsapp?.expectedResponseRate === "medium" || pitchSet.whatsapp?.expectedResponseRate === "high") ? pitchSet.whatsapp.expectedResponseRate : "high",
          },
        ],
        followUpMessage: pitchSet.followUpSequence?.[0]?.message || "Following up on my previous message!",
        pitchTips: pitchSet.pitchTips || ["Be brief", "Lead with outcome"],
      };

      const leadId = generateDeterministicLeadId({
        businessName: lead.business.name,
        phone: lead.business.phone,
        location: lead.business.address,
        websiteUrl: validWeb,
      });

      return {
        id: leadId,
        searchId,
        userId: auth.user.id,
        rank: lead.rank,
        businessName: lead.business.name,
        businessCategory: lead.business.category,
        location: lead.business.address,
        googleRating: lead.business.rating ?? 4.0,
        reviewCount: lead.business.reviewCount,
        hasWebsite: hasWeb,
        websiteUrl: hasWeb ? validWeb : null,
        phone: lead.business.phone,
        photoCount: lead.business.photoCount,
        mapsUrl: lead.business.mapsUrl,
        instagramHandle: ig.username,
        instagramFollowers: ig.followers,
        instagramFollowing: ig.following,
        instagramPosts: ig.postsCount,
        lastPostDate: ig.lastPostDate,
        engagementRate: ig.engagementRate,
        hasLinkInBio: ig.hasLinkInBio,
        usesReels: ig.usesReels,
        opportunityScore: lead.finalScore,
        urgencyLevel: (an.urgencyLevel || gapAnalysisObj.urgencyLevel || "high") as "low" | "medium" | "high" | "critical",
        gapsFound: gaps,
        bestService: (an.bestServiceToPitch || pitchStrategyObj.angle || "Conversion optimization"),
        secondaryServices: an.secondaryServices || ["Speed & SEO"],
        buyingSignals: an.buyingSignals || gapAnalysisObj.buyingSignals || [],
        pitches: pitchBundle,
        pitchSet: pitchSet,
        estimatedBudget: an.estimatedMonthlyBudget || gapAnalysisObj.estimatedMonthlyBudget || null,
        status: "new",
        notes: null,
        contactedAt: null,
        tags: [
          lead.business.budgetSignal === "high" ? "High Budget" : "Qualified",
          lead.finalScore > 80 ? "Top Opportunity" : "Active Gap",
        ],
        createdAt: new Date().toISOString(),
      };
    });

    const updatedBalance = await getCreditBalance(auth.user.id, auth.supabase);

    const isNoWebFilterOn =
      Boolean(parsed.filters?.requireNoWebsite) ||
      Boolean(parsed.searchFilters?.requireNoWebsite) ||
      Boolean(parsed.customFilterConfig?.mapsFilters?.requireNoWebsite) ||
      Boolean(customFilter?.digitalGapPriorities?.some((p: string) => p.toLowerCase().includes("no website")));

    const filtered = isNoWebFilterOn
      ? formattedLeads.filter((l) => !isValidWebsiteUrl(l.websiteUrl) && !l.hasWebsite)
      : formattedLeads;

    // Filter out any business matching previously discovered exclusions to ensure leads are NEVER repeated
    const nonRepeated = filtered.filter((lead) => {
      return !isBusinessExcluded(
        {
          name: lead.businessName,
          phone: lead.phone,
          website: lead.websiteUrl,
          placeId: lead.id,
          address: lead.location,
        },
        {
          names: parsed.excludeNames || [],
          phones: parsed.excludePhones || [],
          domains: parsed.excludeDomains || [],
          placeIds: parsed.excludePlaceIds || [],
        }
      );
    });

    const finalCandidates = nonRepeated.length > 0 ? nonRepeated : filtered;
    const finalLeads = deduplicateLeads(finalCandidates);

    return NextResponse.json({
      success: true,
      searchId,
      resultsCount: finalLeads.length,
      creditsUsed: pipelineResult.creditsUsed,
      newBalance: updatedBalance?.availableCredits ?? (available - pipelineResult.creditsUsed),
      leads: finalLeads,
      search: {
        id: searchId,
        user_id: auth.user.id,
        location: parsed.location,
        business_type: parsed.businessCategory,
        freelancer_type: parsed.freelancerType,
        status: "completed",
        progress: 100,
        progress_message: `Found ${formattedLeads.length} leads`,
        results_count: formattedLeads.length,
        credits_used: pipelineResult.creditsUsed,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.log("POST /api/search/start exception:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: (error as Error).message || "Failed to process search pipeline" },
      { status: 500 }
    );
  }
}
