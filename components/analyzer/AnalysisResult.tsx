"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingDown,
  Wrench,
  BookmarkPlus,
  RotateCcw,
  ExternalLink,
  Mail,
  Camera,
  Globe,
  MapPin,
  Share2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { type AnalyzerResultData, type Lead } from "@/types";
import { saveLocalLeads } from "@/lib/local-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalysisResultProps {
  analysis: AnalyzerResultData;
  lead?: Lead;
  onReset?: () => void;
  isCached?: boolean;
  onRefreshLive?: () => void;
  isRefreshingLive?: boolean;
}

export function AnalysisResult({
  analysis,
  lead,
  onReset,
  isCached,
  onRefreshLive,
  isRefreshingLive,
}: AnalysisResultProps) {
  const [copiedTab, setCopiedTab] = useState<"dm" | "email" | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activePitchTab, setActivePitchTab] = useState<"dm" | "email">(
    analysis.linkType === "instagram" ? "dm" : "email"
  );

  function handleCopyText(text: string, tab: "dm" | "email") {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    toast.success("Pitch copied to clipboard!");
    setTimeout(() => setCopiedTab(null), 2500);
  }

  function handleSaveToLeads() {
    if (lead) {
      saveLocalLeads([lead]);
      setIsSaved(true);
      toast.success("Saved to your Leads list!");
    } else {
      toast.success("Lead already saved!");
      setIsSaved(true);
    }
  }

  const overallScore = analysis.overallScore;
  const contentScore = analysis.contentScore ?? Math.round(overallScore * 0.95);
  const engagementScore = analysis.engagementScore ?? Math.round(overallScore * 0.9);
  const growthScore = analysis.growthScore ?? Math.round(overallScore * 0.88);

  const scoreItems = [
    { label: "Overall Score", value: overallScore, subtitle: "Opportunity Health" },
    { label: "Content", value: contentScore, subtitle: "Post & Layout Quality" },
    { label: "Engagement", value: engagementScore, subtitle: "Audience Response" },
    { label: "Growth Potential", value: growthScore, subtitle: "Algorithmic Reach" },
  ];

  function getScoreColor(val: number) {
    if (val >= 75) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-500", track: "text-emerald-500" };
    if (val >= 60) return { text: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-500", track: "text-amber-500" };
    return { text: "text-red-600", bg: "bg-red-50", ring: "border-red-500", track: "text-red-500" };
  }

  function getSeverityBadge(sev: string) {
    switch (sev) {
      case "critical":
        return {
          label: "Critical Gap",
          bg: "bg-red-500/10 text-red-700 border-red-200",
          cardBorder: "border-red-200 hover:border-red-300 bg-red-50/20",
          dot: "bg-red-500",
        };
      case "high":
        return {
          label: "High Priority",
          bg: "bg-amber-500/10 text-amber-700 border-amber-200",
          cardBorder: "border-amber-200 hover:border-amber-300 bg-amber-50/20",
          dot: "bg-amber-500",
        };
      case "medium":
        return {
          label: "Medium Opportunity",
          bg: "bg-yellow-500/10 text-yellow-800 border-yellow-200",
          cardBorder: "border-yellow-200 hover:border-yellow-300 bg-yellow-50/20",
          dot: "bg-yellow-500",
        };
      default:
        return {
          label: "Low Priority",
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
          cardBorder: "border-emerald-200 hover:border-emerald-300 bg-emerald-50/20",
          dot: "bg-emerald-500",
        };
    }
  }

  function renderLinkIcon() {
    switch (analysis.linkType) {
      case "instagram":
        return <Camera className="h-4 w-4 text-pink-600" />;
      case "website":
        return <Globe className="h-4 w-4 text-blue-600" />;
      case "maps":
        return <MapPin className="h-4 w-4 text-emerald-600" />;
      case "facebook":
        return <Share2 className="h-4 w-4 text-indigo-600" />;
    }
  }

  const dmText = analysis.instagramDMPitch || "";
  const emailText = analysis.emailPitch || analysis.outreachEmail || "";

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Target Summary Header */}
      <Card className="border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
              {renderLinkIcon()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">{analysis.title}</h2>
                <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-700">
                  {analysis.linkType} Audit
                </span>
                {typeof analysis.metadata?.entityLabel === "string" && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    {analysis.metadata.entityLabel}
                  </span>
                )}
                {isCached && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <span>Cached 24h</span>
                    {onRefreshLive && (
                      <button
                        type="button"
                        onClick={onRefreshLive}
                        disabled={isRefreshingLive}
                        className="font-semibold underline hover:text-amber-950 cursor-pointer disabled:opacity-60"
                        title="Re-run live audit to bypass cache"
                      >
                        {isRefreshingLive ? "Re-analyzing..." : "Re-run Live"}
                      </button>
                    )}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-500">
                <a
                  href={analysis.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span className="truncate max-w-[200px] sm:max-w-xs">{analysis.targetUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>

                {lead?.location && lead.location !== "Direct URL Analysis" && (
                  <span className="flex items-center gap-1 text-neutral-600">
                    <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[220px]">{lead.location}</span>
                  </span>
                )}

                {lead?.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 text-neutral-700 hover:text-primary font-medium"
                  >
                    <Phone className="h-3 w-3 text-blue-600 shrink-0" />
                    <span>{lead.phone}</span>
                  </a>
                )}

                {lead?.instagramHandle && (
                  <a
                    href={`https://instagram.com/${lead.instagramHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-pink-600 hover:underline font-medium"
                  >
                    <Camera className="h-3 w-3 shrink-0" />
                    <span>{lead.instagramHandle}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveToLeads}
              className={cn(
                "text-xs gap-1.5 h-9",
                isSaved && "border-emerald-500 text-emerald-700 bg-emerald-50"
              )}
            >
              {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {isSaved ? "Saved to Leads" : "Save to Leads"}
            </Button>

            {onReset && (
              <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1 h-9 text-neutral-600">
                <RotateCcw className="h-3.5 w-3.5" />
                Analyze Another
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 1 — Score Cards (4 in a row) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Health &amp; Performance Audit Scores
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {scoreItems.map((item) => {
            const colors = getScoreColor(item.value);
            return (
              <Card
                key={item.label}
                className="border border-neutral-200/80 bg-white p-4 shadow-xs flex flex-col items-center text-center justify-between"
              >
                <span className="text-xs font-semibold text-neutral-700">{item.label}</span>
                <div className="my-2.5 relative flex items-center justify-center">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl transition-all shadow-xs",
                      colors.ring,
                      colors.bg,
                      colors.text
                    )}
                  >
                    {item.value}
                  </div>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">{item.subtitle}</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 — Gap Report */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-red-500" />
            Detected Digital Gaps &amp; Action Plan ({analysis.gaps.length})
          </h3>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Est. Monthly Loss: {analysis.estimatedLoss}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {analysis.gaps.map((gap, i) => {
            const sev = getSeverityBadge(gap.severity);
            return (
              <Card
                key={i}
                className={cn(
                  "border p-4.5 rounded-xl shadow-xs transition-all space-y-3",
                  sev.cardBorder
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", sev.dot)} />
                    <h4 className="font-bold text-sm text-neutral-900">{gap.area}</h4>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded border self-start sm:self-auto",
                      sev.bg
                    )}
                  >
                    {sev.label}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-900 block mb-0.5">Problem:</span>
                    <p className="text-neutral-600 leading-relaxed">{gap.problem}</p>
                  </div>

                  <div className="rounded-lg bg-neutral-100/60 p-2.5 border border-neutral-200/50">
                    <span className="font-semibold text-neutral-900 block mb-0.5">Business &amp; Revenue Impact:</span>
                    <p className="text-red-700 font-medium leading-relaxed">{gap.impact}</p>
                    {gap.estimatedImpact && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Potential upside: {gap.estimatedImpact}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 flex items-start gap-2">
                    <Wrench className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-neutral-900">Your Solution to Offer: </span>
                      <span className="text-neutral-800">{gap.fix}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 & 4 — What they do well & Missed Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 3: What they do well */}
        <Card className="border border-emerald-200/80 bg-emerald-50/20 p-5 rounded-xl shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            What They Do Well
          </h4>
          <ul className="space-y-2 text-xs text-neutral-700">
            {analysis.whatTheyDoWell.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Section 4: Missed Opportunities */}
        <Card className="border border-amber-200/80 bg-amber-50/20 p-5 rounded-xl shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Missed Opportunities
          </h4>
          <ul className="space-y-2 text-xs text-neutral-700">
            {analysis.missedOpportunities.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* SECTION 5 — Ready to Send Pitches */}
      <Card className="border border-neutral-200/80 bg-white p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Ready-to-Send Outreach Pitches
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Personalized pitch angles generated specifically from this link&apos;s digital gaps.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg self-start sm:self-auto">
            {dmText && (
              <button
                type="button"
                onClick={() => setActivePitchTab("dm")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                  activePitchTab === "dm"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                <Camera className="h-3.5 w-3.5 text-pink-600" />
                Instagram DM
              </button>
            )}

            {emailText && (
              <button
                type="button"
                onClick={() => setActivePitchTab("email")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                  activePitchTab === "email"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                Outreach Email
              </button>
            )}
          </div>
        </div>

        {/* Active Pitch Card Content */}
        {activePitchTab === "dm" && dmText && (
          <div className="space-y-3">
            <div className="relative rounded-lg bg-neutral-50 border border-neutral-200/80 p-4">
              <pre className="text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
                {dmText}
              </pre>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Recommended angle: {analysis.pitchAngle}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleCopyText(dmText, "dm")}
                className="text-xs gap-1.5 h-8 shadow-xs"
              >
                {copiedTab === "dm" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedTab === "dm" ? "Copied!" : "Copy Instagram DM"}
              </Button>
            </div>
          </div>
        )}

        {activePitchTab === "email" && emailText && (
          <div className="space-y-3">
            <div className="relative rounded-lg bg-neutral-50 border border-neutral-200/80 p-4">
              <pre className="text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
                {emailText}
              </pre>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Recommended angle: {analysis.pitchAngle}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => handleCopyText(emailText, "email")}
                className="text-xs gap-1.5 h-8 shadow-xs"
              >
                {copiedTab === "email" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedTab === "email" ? "Copied!" : "Copy Outreach Email"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 6 — Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={handleSaveToLeads}
            className="w-full sm:w-auto h-10 text-xs font-semibold gap-2 shadow-xs"
          >
            <BookmarkPlus className="h-4 w-4" />
            {isSaved ? "Saved to Leads View" : "Save to Leads"}
          </Button>

          <Link href="/leads" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto h-10 text-xs font-semibold gap-1.5">
              View in Leads
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {onReset && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="w-full sm:w-auto h-10 text-xs font-medium text-neutral-600 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Run Another Link Analysis
          </Button>
        )}
      </div>
    </div>
  );
}
