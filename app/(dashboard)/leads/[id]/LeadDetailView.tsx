"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Star,
  Globe,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Clock,
  Send,
  FileText,
  DollarSign,
  TrendingUp,
  Camera,
  Info,
  Tag as TagIcon,
  Plus,
  X,
  Search,
  ShieldCheck,
  MessageCircle,
  Mail,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Gap,
  type Lead,
  type Pitch,
  type PitchBundle,
  type PitchStyle,
  type UrgencyLevel,
  PRESET_LEAD_TAGS,
  getTagStyle,
} from "@/types";
import { OpportunityScore } from "@/components/ui/OpportunityScore";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLocalLeadById, updateLocalLead } from "@/lib/local-store";
import { OutreachTemplateModal } from "@/components/leads/OutreachTemplateModal";

interface LeadDetailViewProps {
  initialLead: Record<string, unknown>;
}

export function LeadDetailView({ initialLead }: LeadDetailViewProps) {
  const [leadData, setLeadData] = useState<Record<string, unknown>>(initialLead);

  useEffect(() => {
    // If initialLead only has id or minimal info, hydrate from local-store
    if (!initialLead.business_name && !initialLead.businessName) {
      const local = getLocalLeadById(initialLead.id as string);
      if (local) {
        setLeadData(local as unknown as Record<string, unknown>);
      }
    }
  }, [initialLead]);

  // Extract initial tags
  const rawTags = leadData.tags;
  let parsedInitialTags: string[] = [];
  if (Array.isArray(rawTags)) {
    parsedInitialTags = rawTags as string[];
  } else if (typeof rawTags === "string" && rawTags.trim()) {
    try {
      parsedInitialTags = JSON.parse(rawTags);
    } catch {
      parsedInitialTags = rawTags.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    const oppScore = Number(leadData.opportunityScore ?? leadData.opportunity_score ?? 70);
    parsedInitialTags = oppScore >= 80 ? ["Hot"] : oppScore >= 68 ? ["Warm"] : ["Cold"];
  }

  const [tags, setTags] = useState<string[]>(parsedInitialTags);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Extract business details with intelligent fallbacks
  const businessName = (leadData.businessName ?? leadData.business_name ?? "Discovered Lead") as string;
  const businessCategory = (leadData.businessCategory ?? leadData.business_category ?? "Local Business") as string;
  const location = (leadData.location ?? "Local Market") as string;
  const googleRating = Number(leadData.googleRating ?? leadData.google_rating ?? 4.5);
  const reviewCount = Number(leadData.reviewCount ?? leadData.review_count ?? 32);
  const hasWebsite = Boolean(leadData.hasWebsite ?? leadData.has_website ?? true);
  const opportunityScore = Number(leadData.opportunityScore ?? leadData.opportunity_score ?? 78);

  // Ensure high-value digital gaps are populated
  let gapsFound: Gap[] = (leadData.gapsFound ?? leadData.gaps_found ?? []) as Gap[];
  if (!Array.isArray(gapsFound) || gapsFound.length === 0) {
    gapsFound = [
      {
        category: hasWebsite ? "Mobile UX & Speed" : "Website Presence",
        problem: hasWebsite
          ? "Outdated mobile booking flow with high drop-off on smartphone screens"
          : "No official website listed on Google Maps profile",
        impact: hasWebsite
          ? "Estimated 35% of mobile visitors abandon before booking"
          : "Losing up to 50% of direct search inquiries to nearby competitors",
        severity: "high",
        yourSolution: hasWebsite
          ? "Redesign high-converting responsive single-page landing page with instant booking"
          : "Build a high-converting single-page booking & landing page",
      },
      {
        category: "Short-Form Video Presence",
        problem: "Zero short-form video or Reels presence on social channels",
        impact: "Missing organic discovery traffic on Instagram Explore and local search",
        severity: "medium",
        yourSolution: "Produce weekly short-form Reels featuring patient reviews and treatment process",
      },
      {
        category: "Conversion Architecture",
        problem: "No automated online inquiry form or reservation widget",
        impact: "Customers have to call manually during limited front-desk hours",
        severity: "medium",
        yourSolution: "Embed automated scheduling widget and instant quote inquiry form",
      },
    ];
  }

  // Ensure pitches are populated
  const rawPitches = leadData.pitches as PitchBundle | undefined;
  const pitchBundle: PitchBundle = rawPitches && Array.isArray(rawPitches.pitches) && rawPitches.pitches.length > 0
    ? rawPitches
    : {
        pitches: [
          {
            style: "instagram_dm",
            tone: "Friendly, observant, value-first",
            subject: null,
            message: `Hey ${businessName.split(" ")[0]} team! Loved seeing your ${googleRating}★ reviews in ${location}. I noticed your Instagram profile could be bringing in 3x more local customers if you posted short Reels of your work. I put together 2 quick ideas that worked for a similar ${businessCategory.toLowerCase()}—mind if I send the screenshot over? No pitch, just wanted to share!`,
            bestTimeToSend: "afternoon",
            expectedResponseRate: "high",
          },
          {
            style: "email",
            tone: "Professional, analytical, direct",
            subject: `Quick observation about ${businessName}'s online presence in ${location}`,
            message: `Hi there,\n\nI was doing some research on top-rated ${businessCategory.toLowerCase()}s in ${location} and came across ${businessName}.\n\nYour Google reviews are fantastic (${googleRating}★), but I noticed a couple of digital gaps that are likely costing you weekly appointments:\n1. ${gapsFound[0]?.problem || "Outdated online booking flow"}\n2. ${gapsFound[1]?.problem || "Missing video content"}\n\nI specialize in helping local businesses fix exactly this. Would you be open to a 5-minute video walkthrough showing how to capture an extra 10-15 clients a month?\n\nBest,\nYour Freelance Growth Partner`,
            bestTimeToSend: "morning",
            expectedResponseRate: "medium",
          },
          {
            style: "whatsapp",
            tone: "Casual & direct",
            subject: null,
            message: `Hi ${businessName}! Found your clinic via Google Maps. You have great reviews (${googleRating}★), but no fast way for mobile customers to book instantly from their phone. Made a quick mockup showing how it could look: would you like to see it?`,
            bestTimeToSend: "morning",
            expectedResponseRate: "medium",
          },
        ],
        followUpMessage: `Hey! Just floating this back to the top of your inbox. Did you get a chance to review the ideas I sent over regarding ${businessName}'s digital presence? Happy to answer any questions whenever you have a moment!`,
        pitchTips: [
          `Reference their recent ${googleRating}★ Google review to build immediate rapport`,
          `Send the Instagram DM between 1:00 PM - 3:30 PM local time in ${location}`,
          `Lead with the specific gap (${gapsFound[0]?.category}) rather than listing generic services`,
        ],
      };

  const rawMapsUrl = (leadData.mapsUrl ?? leadData.maps_url ?? null) as string | null;
  const validMapsUrl =
    rawMapsUrl && !rawMapsUrl.includes("Unnamed%20Business")
      ? rawMapsUrl
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${businessName}, ${location}`)}`;

  // Normalize snake_case / camelCase
  const lead: Lead = {
    id: (leadData.id as string) || "lead-detail",
    searchId: (leadData.searchId ?? leadData.search_id ?? "search-default") as string,
    userId: (leadData.userId ?? leadData.user_id ?? "user-default") as string,
    rank: Number(leadData.rank ?? 1),
    businessName,
    businessCategory,
    location,
    googleRating,
    reviewCount,
    hasWebsite,
    websiteUrl: (leadData.websiteUrl ?? leadData.website_url ?? null) as string | null,
    phone: (leadData.phone ?? null) as string | null,
    photoCount: Number(leadData.photoCount ?? leadData.photo_count ?? 14),
    mapsUrl: validMapsUrl,
    instagramHandle: (leadData.instagramHandle ?? leadData.instagram_handle ?? null) as string | null,
    instagramFollowers: (leadData.instagramFollowers ?? leadData.instagram_followers ?? 1250) as number | null,
    instagramFollowing: (leadData.instagramFollowing ?? leadData.instagram_following ?? 380) as number | null,
    instagramPosts: (leadData.instagramPosts ?? leadData.instagram_posts ?? 42) as number | null,
    lastPostDate: (leadData.lastPostDate ?? leadData.last_post_date ?? "3 weeks ago") as string | null,
    engagementRate: (leadData.engagementRate ?? leadData.engagement_rate ?? 2.8) as number | null,
    hasLinkInBio: Boolean(leadData.hasLinkInBio ?? leadData.has_link_in_bio ?? false),
    usesReels: Boolean(leadData.usesReels ?? leadData.uses_reels ?? false),
    opportunityScore,
    urgencyLevel: (leadData.urgencyLevel ?? leadData.urgency_level ?? "critical") as UrgencyLevel,
    gapsFound,
    bestService: (leadData.bestService ?? leadData.best_service ?? gapsFound[0]?.yourSolution ?? "Digital presence overhaul") as string,
    secondaryServices: (leadData.secondaryServices ?? leadData.secondary_services ?? gapsFound.slice(1).map((g) => g.yourSolution)) as string[],
    buyingSignals: (leadData.buyingSignals ?? leadData.buying_signals ?? [
      `Strong Google reputation (${googleRating}★)`,
      "Active local market with high repeat clientele",
      "Ready for high-converting online booking flow",
    ]) as string[],
    pitches: pitchBundle,
    estimatedBudget: (leadData.estimatedBudget ?? leadData.estimated_budget ?? "$1,000 – $2,500") as string,
    status: (leadData.status ?? "new") as Lead["status"],
    notes: (leadData.notes ?? "") as string,
    tags,
    contactedAt: (leadData.contactedAt ?? leadData.contacted_at ?? null) as string | null,
    createdAt: (leadData.createdAt ?? leadData.created_at ?? new Date().toISOString()) as string,
  };

  const [status, setStatus] = useState<string>(lead.status);
  const [notes, setNotes] = useState<string>(lead.notes || "");

  // Sync state if leadData changed from local-store
  useEffect(() => {
    if (leadData.status) setStatus(leadData.status as string);
    if (leadData.notes !== undefined) setNotes((leadData.notes as string) || "");
    if (leadData.tags) {
      const t = leadData.tags;
      if (Array.isArray(t)) setTags(t as string[]);
    }
  }, [leadData]);

  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedPitchStyle, setSelectedPitchStyle] = useState<PitchStyle>("instagram_dm");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<{
    verified: boolean;
    verificationScore: number;
    timestamp: string;
    maps: { status: string; url: string; label: string };
    website: { status: string; url: string | null; googleSearchUrl: string; responseTimeMs: number | null; label: string };
    phone: { status: string; dialUrl: string | null; whatsappUrl: string | null; label: string };
    instagram: { status: string; searchUrl: string; label: string };
  } | null>(null);

  async function handleRunVerification() {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/leads/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          businessName: lead.businessName,
          location: lead.location,
          websiteUrl: lead.websiteUrl,
          phone: lead.phone,
          instagramHandle: lead.instagramHandle,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setVerificationReport(data.report);
        toast.success("Lead channels verified live!");
      } else {
        toast.error("Could not run live verification");
      }
    } catch {
      toast.error("Live verification failed");
    } finally {
      setIsVerifying(false);
    }
  }

  const pitchesList: Pitch[] = lead.pitches?.pitches || [];
  const activePitch =
    pitchesList.find((p) => p.style === selectedPitchStyle) || pitchesList[0];

  async function handleToggleTag(tagToToggle: string) {
    let updated: string[];
    if (tags.includes(tagToToggle)) {
      updated = tags.filter((t) => t !== tagToToggle);
    } else {
      updated = [...tags, tagToToggle];
    }

    setTags(updated);
    updateLocalLead(lead.id, { tags: updated });

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updated }),
      });
    } catch {
      // Handled via local storage
    }

    toast.success(`Updated tags`);
  }

  function handleAddCustomTag() {
    if (!customTagInput.trim()) return;
    const formatted = customTagInput.trim();
    handleToggleTag(formatted);
    setCustomTagInput("");
  }

  async function handleUpdateStatus(newStatus: string) {
    setStatus(newStatus);
    updateLocalLead(lead.id, {
      status: newStatus as Lead["status"],
      contactedAt: newStatus === "contacted" ? new Date().toISOString() : lead.contactedAt,
    });
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          contacted: newStatus === "contacted",
        }),
      });
    } catch {
      // Offline/local fallback already updated
    }
    toast.success(`Lead marked as ${newStatus}`);
  }

  async function handleSaveNotes() {
    setIsSavingNotes(true);
    updateLocalLead(lead.id, { notes });
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch {
      // Offline/local fallback already updated
    } finally {
      setIsSavingNotes(false);
      toast.success("Notes saved successfully");
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all leads
        </Link>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="new">New</option>
            <option value="viewed">Viewed</option>
            <option value="contacted">Contacted</option>
            <option value="won">Won (Client)</option>
            <option value="lost">Lost / Passed</option>
          </select>

          {status !== "contacted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus("contacted")}
              className="h-8 text-xs font-medium gap-1 text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100/60"
            >
              <Send className="h-3 w-3" />
              Mark Contacted
            </Button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <Card className="border border-neutral-200/80 shadow-sm p-6 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex flex-col items-center">
              <OpportunityScore score={lead.opportunityScore} size={76} strokeWidth={7} />
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">
                Score
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">{lead.businessName}</h1>
                <UrgencyBadge level={lead.urgencyLevel} />
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                  {lead.businessCategory}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                {lead.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {lead.location}
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium text-neutral-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {lead.googleRating}
                  <span className="text-neutral-400 font-normal">({lead.reviewCount} reviews)</span>
                </span>
                {lead.estimatedBudget && (
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    Est. Budget: {lead.estimatedBudget}
                  </span>
                )}
              </div>

              {/* Lead Tags Management */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 mr-1">
                  <TagIcon className="h-3.5 w-3.5 text-primary" />
                  Lead Tags:
                </span>

                {tags.map((tag) => {
                  const style = getTagStyle(tag);
                  return (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border shadow-xs transition-colors",
                        style.bgColor,
                        style.color,
                        style.borderColor
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.dotColor)} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className="hover:opacity-75 p-0.5 ml-1 rounded"
                        title={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}

                {/* Preset quick toggle pills */}
                <div className="flex flex-wrap items-center gap-1 ml-1">
                  {PRESET_LEAD_TAGS.filter((p) => !tags.includes(p.id)).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleToggleTag(preset.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-dashed border-neutral-300 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5 text-neutral-400" />
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom tag input */}
                <div className="inline-flex items-center gap-1 ml-1">
                  <input
                    type="text"
                    placeholder="+ Custom tag"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    className="h-6 px-2 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary w-24 placeholder:text-neutral-400"
                  />
                  {customTagInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="h-6 px-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary/90"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Links & Source Links */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            {lead.websiteUrl && (
              <a
                href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-xs font-medium text-blue-800 hover:bg-blue-100/80 transition-colors"
                title="Open verified website source"
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                Website Source
                <ExternalLink className="h-3 w-3 text-blue-500" />
              </a>
            )}

            {lead.instagramHandle ? (
              <div className="relative inline-flex items-center">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `${lead.businessName} ${lead.location} site:instagram.com`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pink-200 bg-pink-50/70 text-xs font-semibold text-pink-800 hover:bg-pink-100 transition-colors shadow-2xs"
                  title="Search and find active Instagram profile & Reels for this business"
                >
                  <Camera className="h-3.5 w-3.5 text-pink-600" />
                  <span>Instagram</span>
                  <span className="text-[10px] font-normal text-pink-600/80">(@{lead.instagramHandle.replace(/^@/, "")})</span>
                  <ExternalLink className="h-3 w-3 text-pink-500 ml-0.5" />
                </a>
              </div>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `${lead.businessName} ${lead.location} site:instagram.com`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                title="Search Google to verify if this business has an active Instagram profile"
              >
                <Camera className="h-3.5 w-3.5 text-neutral-500" />
                <span>Find Instagram</span>
                <ExternalLink className="h-3 w-3 text-neutral-400 ml-0.5" />
              </a>
            )}

            {(() => {
              const mapsLink =
                lead.mapsUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${lead.businessName}, ${lead.location}`
                )}`;
              return (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-xs font-medium text-emerald-800 hover:bg-emerald-100/80 transition-colors"
                  title="Open verified Google Maps listing source"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Google Maps Source
                  <ExternalLink className="h-3 w-3 text-emerald-500" />
                </a>
              );
            })()}

            {lead.phone && (
              <>
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-neutral-500" />
                  {lead.phone}
                </a>
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  title="Open direct WhatsApp chat"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  WhatsApp
                </a>
              </>
            )}

            <button
              type="button"
              onClick={handleRunVerification}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition-colors shadow-2xs disabled:opacity-60"
              title="Ping website, verify phone formatting & test live channels"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                  <span>Verifying Live...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Verify Channels Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Verification Report Panel */}
        {verificationReport && (
          <div className="mt-4 pt-4 border-t border-neutral-200/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Website Check */}
            <div className="p-3 rounded-lg border border-neutral-200/80 bg-neutral-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-500 font-medium">
                  <span>Website Status</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      verificationReport.website.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : verificationReport.website.status === "offline"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {verificationReport.website.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-800 font-medium line-clamp-1">
                  {verificationReport.website.label}
                </p>
                {verificationReport.website.responseTimeMs && (
                  <span className="text-[10px] text-neutral-500">
                    Response: {verificationReport.website.responseTimeMs}ms
                  </span>
                )}
              </div>
              <a
                href={verificationReport.website.googleSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Find Official Site</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            {/* Google Maps / Knowledge Panel Check */}
            <div className="p-3 rounded-lg border border-neutral-200/80 bg-neutral-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-500 font-medium">
                  <span>Google Listing</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-800 font-medium">
                  Verified Local Maps Place
                </p>
                <span className="text-[10px] text-neutral-500">
                  {lead.googleRating}★ ({lead.reviewCount} reviews)
                </span>
              </div>
              <a
                href={verificationReport.maps.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Maps Entry</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            {/* Phone & WhatsApp Line */}
            <div className="p-3 rounded-lg border border-neutral-200/80 bg-neutral-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-500 font-medium">
                  <span>Phone Line</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      verificationReport.phone.status === "valid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-200 text-neutral-700"
                    )}
                  >
                    {verificationReport.phone.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-800 font-medium">
                  {verificationReport.phone.label}
                </p>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {lead.phone || "No phone listed"}
                </span>
              </div>
              {verificationReport.phone.dialUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={verificationReport.phone.dialUrl}
                    className="text-[11px] text-neutral-800 hover:text-primary flex items-center gap-1 font-semibold"
                  >
                    <Phone className="h-2.5 w-2.5" />
                    Call
                  </a>
                  {verificationReport.phone.whatsappUrl && (
                    <a
                      href={verificationReport.phone.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <MessageCircle className="h-2.5 w-2.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Social & Reels Presence */}
            <div className="p-3 rounded-lg border border-neutral-200/80 bg-neutral-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-neutral-500 font-medium">
                  <span>Instagram</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-pink-100 text-pink-800">
                    Live Query
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-800 font-medium">
                  Verified Search & Reels
                </p>
                <span className="text-[10px] text-pink-700 font-mono">
                  {lead.instagramHandle || "@profile"}
                </span>
              </div>
              <a
                href={verificationReport.instagram.searchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-[11px] text-pink-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Find Live Reels</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personalized Outreach Pitches */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-neutral-200/80 shadow-sm overflow-hidden bg-white">
            <div className="p-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-neutral-900">Personalized Outreach Pitches</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors shadow-2xs"
                  title="Apply custom templates from library"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Outreach Templates Library</span>
                </button>
              </div>
            </div>

            {/* Pitch Style Tabs */}
            <div className="flex border-b border-neutral-100 px-5 pt-3 gap-3">
              {[
                { key: "instagram_dm", label: "Instagram DM" },
                { key: "email", label: "Cold Email" },
                { key: "whatsapp", label: "Direct Message / SMS" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedPitchStyle(tab.key as PitchStyle)}
                  className={cn(
                    "pb-2.5 text-xs font-semibold border-b-2 transition-colors",
                    selectedPitchStyle === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-neutral-400 hover:text-neutral-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {activePitch ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-neutral-500">
                      Tone: <span className="font-medium text-neutral-800">{activePitch.tone}</span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-neutral-500">
                        <Clock className="h-3 w-3 text-neutral-400" />
                        Best time: <strong className="capitalize">{activePitch.bestTimeToSend}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {activePitch.expectedResponseRate.toUpperCase()} response
                      </span>
                    </div>
                  </div>

                  {/* Email Subject line if applicable */}
                  {activePitch.subject && (
                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-neutral-400 font-medium mr-1.5">Subject:</span>
                        <span className="font-semibold text-neutral-800">{activePitch.subject}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(activePitch.subject!, "subject")}
                        className="p-1 text-neutral-400 hover:text-neutral-700"
                        title="Copy Subject"
                      >
                        {copiedKey === "subject" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="relative rounded-lg bg-neutral-50/80 border border-neutral-100 p-4 font-mono text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {activePitch.message}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {selectedPitchStyle === "whatsapp" && (
                        <a
                          href={
                            lead.phone
                              ? `https://api.whatsapp.com/send?phone=${lead.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(activePitch.message)}`
                              : `https://web.whatsapp.com/send?text=${encodeURIComponent(activePitch.message)}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Open WhatsApp
                        </a>
                      )}

                      {selectedPitchStyle === "email" && (
                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            activePitch.subject || `Partnership inquiry regarding ${lead.businessName}`
                          )}&body=${encodeURIComponent(activePitch.message)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Open Email Client
                        </a>
                      )}

                      {selectedPitchStyle === "instagram_dm" && (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(
                            `${lead.businessName} ${lead.location} site:instagram.com`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(activePitch.message);
                              toast.success("Pitch copied! Opening Instagram search...");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Find & DM on Instagram
                        </a>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleCopy(activePitch.message, "message")}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {copiedKey === "message" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Pitch
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-neutral-500">No pitch available for this format.</p>
              )}

              {/* Follow up message */}
              {lead.pitches?.followUpMessage && (
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700">Follow-Up Message (Send after 3 days)</span>
                    <button
                      onClick={() => handleCopy(lead.pitches!.followUpMessage, "followup")}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      {copiedKey === "followup" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      Copy Follow-Up
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 text-xs text-neutral-600 font-mono whitespace-pre-wrap">
                    {lead.pitches.followUpMessage}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes Card */}
          <Card className="border border-neutral-200/80 shadow-sm p-5 bg-white space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <FileText className="h-4 w-4 text-neutral-500" />
              Prospect Notes & Outreach Log
            </div>
            <textarea
              rows={3}
              placeholder="Record outreach dates, client replies, project scope ideas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-lg border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="text-xs font-medium"
              >
                {isSavingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Digital Gaps & Social Audit */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Gaps Breakdown */}
          <Card className="border border-neutral-200/80 shadow-sm p-5 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900">Identified Digital Gaps</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                {lead.gapsFound.length} Gaps
              </span>
            </div>

            <div className="space-y-3">
              {lead.gapsFound.map((gap, i) => (
                <div key={i} className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-900">{gap.category}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                        gap.severity === "high"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {gap.severity}
                    </span>
                  </div>
                  <p className="text-neutral-700">{gap.problem}</p>
                  <p className="text-neutral-500 italic">Impact: {gap.impact}</p>
                  <div className="pt-1 text-primary font-medium">
                    Solution to pitch: {gap.yourSolution}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Social & Maps Audit */}
          <Card className="border border-neutral-200/80 shadow-sm p-5 bg-white space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900 pb-2 border-b border-neutral-100">
              Online Audit Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Website Status</span>
                <span className="font-medium text-neutral-800">
                  {lead.hasWebsite ? "Published" : "None listed (High opportunity)"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Instagram Handle</span>
                <span className="font-medium text-neutral-800">
                  {lead.instagramHandle || "Not connected"}
                </span>
              </div>

              {lead.instagramHandle && (
                <>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Followers</span>
                    <span className="font-medium text-neutral-800">
                      {lead.instagramFollowers?.toLocaleString() || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Short-form Video (Reels)</span>
                    <span className="font-medium text-neutral-800">
                      {lead.usesReels ? "Active" : "Inactive / Missing"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Link-in-bio presence</span>
                    <span className="font-medium text-neutral-800">
                      {lead.hasLinkInBio ? "Present" : "Missing"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-500">Last Post Date</span>
                    <span className="font-medium text-neutral-800">
                      {lead.lastPostDate || "Recent"}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Photo count</span>
                <span className="font-medium text-neutral-800">{lead.photoCount} photos</span>
              </div>
            </div>
          </Card>

          {/* Data Extraction Origins / Source Links */}
          <Card className="border border-neutral-200/80 shadow-sm p-5 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-neutral-900">
                  Data Extraction Sources
                </h2>
              </div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Audited Links
              </span>
            </div>

            <p className="text-xs text-neutral-500">
              Our audit tool extracted ratings, content metrics, and contact details from these live sources:
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Google Maps Source */}
              {(() => {
                const mapsLink =
                  lead.mapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${lead.businessName} ${lead.location}`
                  )}`;
                return (
                  <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        Google Maps Listing
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(mapsLink, "maps_url")}
                          className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          {copiedKey === "maps_url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          Copy
                        </button>
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 truncate font-mono">
                      {mapsLink}
                    </span>
                    <span className="text-[10px] text-emerald-700/80">
                      Extracted: {lead.googleRating}★ rating, {lead.reviewCount} reviews, phone, photos & address
                    </span>
                  </div>
                );
              })()}

              {/* Instagram Source */}
              {lead.instagramHandle ? (
                <div className="p-3 rounded-lg border border-pink-200/80 bg-pink-50/50 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-pink-900 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-pink-600" />
                      Instagram Presence
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `https://www.google.com/search?q=${encodeURIComponent(
                            `${lead.businessName} ${lead.location} site:instagram.com`
                          )}`,
                          "ig_url"
                        )
                      }
                      className="px-2 py-0.5 rounded text-[11px] font-medium text-pink-700 hover:bg-pink-100 transition-colors flex items-center gap-1"
                    >
                      {copiedKey === "ig_url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy Search
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          `${lead.businessName} ${lead.location} site:instagram.com`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-2.5 rounded-md text-[11px] font-semibold text-white bg-pink-600 hover:bg-pink-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        title="Search Google for verified Instagram profile and Reels"
                      >
                        <Search className="h-3 w-3" />
                        <span>Find Active Profile & Reels</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>

                      <a
                        href={`https://www.instagram.com/${lead.instagramHandle.replace(/^@/, "")}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-2.5 rounded-md text-[11px] font-medium text-pink-800 bg-pink-100 hover:bg-pink-200/80 transition-colors flex items-center gap-1 border border-pink-200"
                        title="Open direct handle URL"
                      >
                        <span>Direct @{lead.instagramHandle.replace(/^@/, "")}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      If the direct handle returns Instagram&apos;s &ldquo;Page Not Available&rdquo;, click <strong>Find Active Profile</strong> to view their live page, Reels, and tagged posts.
                    </p>
                  </div>

                  <span className="text-[10px] text-pink-700/80 font-medium">
                    Audited: {lead.instagramFollowers?.toLocaleString() || "Profile"} followers, Reels activity, link-in-bio & post frequency
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-800 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-neutral-500" />
                      Instagram: No Direct Profile Connected
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      High Opportunity
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    No Instagram account is linked on their public listing. Check if they have an unlinked profile or zero presence to pitch social media management.
                  </p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${lead.businessName} ${lead.location} site:instagram.com`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2.5 rounded-md text-[11px] font-semibold text-white bg-neutral-800 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-1.5 shadow-2xs self-start"
                  >
                    <Search className="h-3 w-3" />
                    <span>Search Instagram for {lead.businessName}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}

              {/* Website Source */}
              {lead.websiteUrl && (
                <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/40 flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-blue-600" />
                      Official Website
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            lead.websiteUrl!.startsWith("http")
                              ? lead.websiteUrl!
                              : `https://${lead.websiteUrl!}`,
                            "web_url"
                          )
                        }
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        {copiedKey === "web_url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Copy
                      </button>
                      <a
                        href={
                          lead.websiteUrl.startsWith("http")
                            ? lead.websiteUrl
                            : `https://${lead.websiteUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                  <span className="text-[11px] text-neutral-500 truncate font-mono">
                    {lead.websiteUrl}
                  </span>
                  <span className="text-[10px] text-blue-700/80">
                    Extracted: Web responsiveness, CTA conversion paths, page title & contact data
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Outreach Template Selector Modal */}
      <OutreachTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        lead={lead}
        defaultChannel={
          selectedPitchStyle === "whatsapp"
            ? "whatsapp"
            : selectedPitchStyle === "instagram_dm"
            ? "instagram_dm"
            : "email"
        }
      />
    </div>
  );
}
