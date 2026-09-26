"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  ShieldCheck,
  Brain,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead, AgentAnalysis, ClientProfile, FilterResult, PitchSet } from "@/types";

interface FullAnalysisProps {
  lead: Lead;
}

export function FullAnalysis({ lead }: FullAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"filter" | "profile" | "analysis" | "pitches">("filter");
  const [activePitchChannel, setActivePitchChannel] = useState<"instagramDM" | "email" | "whatsapp">("instagramDM");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [thoughtExpanded, setThoughtExpanded] = useState<boolean>(true);

  const analysis: AgentAnalysis | undefined = lead.agentAnalysis;
  const profile: ClientProfile | undefined = lead.clientProfile;
  const filter: FilterResult | undefined = lead.filterResult;
  const pitches: PitchSet | undefined = lead.pitchSet || (lead.pitches as unknown as PitchSet);

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Agent Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("filter")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "filter"
              ? "bg-white text-primary shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
          )}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>1. Filter Decision</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "profile"
              ? "bg-white text-primary shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
          )}
        >
          <User className="h-4 w-4 text-blue-600" />
          <span>2. Client Psychology</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analysis")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "analysis"
              ? "bg-white text-primary shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
          )}
        >
          <Brain className="h-4 w-4 text-purple-600" />
          <span>3. Deep Reasoning & Gaps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pitches")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
            activeTab === "pitches"
              ? "bg-white text-primary shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
          )}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>4. Pitches & Follow-ups</span>
        </button>
      </div>

      {/* TAB 1: FILTER DECISION */}
      {activeTab === "filter" && (
        <div className="space-y-6">
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {filter?.score ?? lead.opportunityScore ?? 80}
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                    <span>Filter Decision:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {filter?.decision || "PURSUE"}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {filter?.reasoning || "High revenue opportunity with verified local demand and clear digital conversion leaks."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-500">Priority:</span>
                <span className="font-semibold text-neutral-900 uppercase bg-neutral-100 px-2.5 py-1 rounded-md">
                  {filter?.priority || "this_week"}
                </span>
              </div>
            </div>

            {/* Deal Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Estimated Deal Size</span>
                <div className="text-sm font-bold text-neutral-900">{filter?.estimatedDealSize || "$1,500 - $3,000"}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Est. Close Rate</span>
                <div className="text-sm font-bold text-emerald-700">{filter?.estimatedCloseRate || "30%"}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Time to Close</span>
                <div className="text-sm font-bold text-neutral-900">{filter?.estimatedTimeToClose || "7-14 days"}</div>
              </div>
            </div>

            {/* Signals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Positive Signals Found
                </h4>
                <div className="space-y-2">
                  {(filter?.positiveSignals && filter.positiveSignals.length > 0
                    ? filter.positiveSignals
                    : [
                        `${lead.reviewCount} customer reviews indicating healthy foot traffic`,
                        !lead.hasWebsite ? "Missing online conversion website" : "Active commercial presence",
                        "Verified local business entity",
                      ]
                  ).map((sig, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  Negative Signals / Risks
                </h4>
                <div className="space-y-2">
                  {(filter?.negativeSignals && filter.negativeSignals.length > 0
                    ? filter.negativeSignals
                    : ["None detected — clean opportunity profile"]
                  ).map((sig, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60 text-xs text-rose-900 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: CLIENT PSYCHOLOGY */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  Client Psychology & Buyer Profiler
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Understand who runs this business, what keeps them awake at night, and how they make decisions.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {profile?.personalityType || "Driver"} Personality
              </span>
            </div>

            {/* Owner Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Owner Persona</span>
                <div className="text-xs font-bold text-neutral-900">{profile?.ownerType || "Managing Owner"}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Preferred Tone</span>
                <div className="text-xs font-bold text-neutral-900 uppercase">{profile?.preferredTone || "Direct"}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Best Contact Time</span>
                <div className="text-xs font-bold text-neutral-900">{profile?.bestTimeToContact || "Tue/Thu Morning"}</div>
              </div>
            </div>

            {/* Motivations & Pain Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Primary Pain Points</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.painPoints || ["Inconsistent inquiries", "No time for social media", "Outdated website"]).map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Core Motivations</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(profile?.motivations || ["Higher weekly client bookings", "Local neighborhood dominance"]).map((m, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Likely Objections */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Anticipated Objections & Handling</h4>
              <div className="space-y-2">
                {(profile?.likelyObjections || [
                  {
                    objection: "We don't have budget for marketing right now",
                    underlyingFear: "Wasting money without ROI",
                    howToHandle: "Frame as revenue leak repair",
                  },
                ]).map((obj, i) => (
                  <div key={i} className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1 text-xs">
                    <div className="font-semibold text-neutral-900">&ldquo;{obj.objection}&rdquo;</div>
                    <div className="text-neutral-500"><strong className="text-neutral-700">Underlying Fear:</strong> {obj.underlyingFear}</div>
                    <div className="text-emerald-800 font-medium"><strong className="text-neutral-700">How to Handle:</strong> {obj.howToHandle}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: DEEP ANALYSIS & GAPS */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Agent Thoughts Chain */}
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-base text-neutral-900">Agent Step-by-Step Reasoning Chain</h3>
              </div>
              <button
                type="button"
                onClick={() => setThoughtExpanded(!thoughtExpanded)}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                {thoughtExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {thoughtExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {thoughtExpanded && (
              <div className="space-y-3 pt-1">
                {(analysis?.thoughts || [
                  { step: "Step 1", reasoning: "Evaluated local reviews and web presence", conclusion: "High opportunity" },
                ]).map((t, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-xs space-y-1 shadow-xs">
                    <div className="text-emerald-400 font-bold flex items-center gap-2">
                      <span>✓</span>
                      <span>{t.step}</span>
                    </div>
                    <div className="text-neutral-400 pl-4">{t.reasoning}</div>
                    <div className="text-white pl-4 font-semibold pt-1">Conclusion: {t.conclusion}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Business Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Est. Annual Revenue</span>
              <div className="text-base font-bold text-neutral-900">{analysis?.businessIntel?.estimatedRevenue || "$300k - $750k/yr"}</div>
            </Card>
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Growth Stage</span>
              <div className="text-base font-bold text-neutral-900 uppercase">{analysis?.businessIntel?.growthStage || "Established"}</div>
            </Card>
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Digital Maturity</span>
              <div className="text-base font-bold text-primary uppercase">{analysis?.businessIntel?.digitalMaturity || "Basic"}</div>
            </Card>
          </div>

          {/* Gap Analysis List */}
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 border-b border-neutral-100 pb-3">Identified Gaps & Revenue Impact</h3>
            <div className="space-y-4">
              {(analysis?.gapAnalysis?.gaps || lead.gapsFound || []).map((gap: { category?: string; problem?: string; severity?: string; businessImpact?: string; yourSolution?: string }, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-sm text-neutral-900">{gap.category || gap.problem}</span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase",
                      gap.severity === "critical" || gap.severity === "high" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {gap.severity || "High"} Severity
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">{gap.problem}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-200/60">
                    <div><strong className="text-neutral-700">Business Impact:</strong> {gap.businessImpact || "Lost customer appointments"}</div>
                    <div><strong className="text-emerald-800">Recommended Solution:</strong> {gap.yourSolution || "Modern turnkey funnel"}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PITCHES & FOLLOW-UPS */}
      {activeTab === "pitches" && (
        <div className="space-y-6">
          {/* Channel Toggle */}
          <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-neutral-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActivePitchChannel("instagramDM")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 justify-center",
                activePitchChannel === "instagramDM"
                  ? "bg-primary text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Instagram DM</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePitchChannel("email")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 justify-center",
                activePitchChannel === "email"
                  ? "bg-primary text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              )}
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePitchChannel("whatsapp")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 justify-center",
                activePitchChannel === "whatsapp"
                  ? "bg-primary text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              )}
            >
              <Send className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Active Pitch Box */}
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-neutral-900 capitalize">
                  {activePitchChannel === "instagramDM" ? "Instagram Direct Message" : activePitchChannel === "email" ? "Cold Outreach Email" : "WhatsApp Message"}
                </h4>
                <p className="text-xs text-neutral-500">
                  Best time to send: <strong className="text-neutral-700">{pitches?.[activePitchChannel]?.bestTimeToSend || "Morning"}</strong>
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleCopy(
                    activePitchChannel === "email"
                      ? `Subject: ${pitches?.email?.subject}\n\n${pitches?.email?.message}`
                      : pitches?.[activePitchChannel]?.message || "",
                    activePitchChannel
                  )
                }
                className="h-8 text-xs font-semibold gap-1.5"
              >
                {copiedKey === activePitchChannel ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === activePitchChannel ? "Copied" : "Copy Pitch"}
              </Button>
            </div>

            {activePitchChannel === "email" && pitches?.email?.subject && (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-900">
                <span className="text-neutral-500 font-normal">Subject: </span>
                {pitches.email.subject}
              </div>
            )}

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs sm:text-sm text-neutral-800 font-sans whitespace-pre-wrap leading-relaxed">
              {activePitchChannel === "email" ? pitches?.email?.message : pitches?.[activePitchChannel]?.message}
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-neutral-700 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900">Why this works: </strong>
                {pitches?.[activePitchChannel]?.whyThisWorks || "Tailored specifically to their top business gap and current reviews."}
              </div>
            </div>
          </Card>

          {/* Follow-up Sequence */}
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 border-b border-neutral-100 pb-3">Automated Follow-up Sequence</h3>
            <div className="space-y-3">
              {(pitches?.followUpSequence || [
                { dayNumber: 3, channel: "DM", message: "Hey, sharing quick mockup preview!", purpose: "Value" },
                { dayNumber: 7, channel: "Email", message: "Competitor benchmark insight", purpose: "Urgency" },
                { dayNumber: 14, channel: "DM", message: "Closing file takeaway", purpose: "Breakup" },
              ]).map((fu, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded">Day {fu.dayNumber}</span>
                    <span className="text-neutral-500 font-medium">Purpose: {fu.purpose}</span>
                  </div>
                  <p className="text-neutral-700 whitespace-pre-wrap">{fu.message}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Objection Handlers */}
          <Card className="p-6 border border-neutral-200/80 bg-white space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 border-b border-neutral-100 pb-3">Instant Objection Handlers</h3>
            <div className="space-y-3">
              {(pitches?.objectionHandlers || [
                { objection: "We already have someone", response: "Great! Here is a free checklist." },
              ]).map((obj, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1 text-xs">
                  <div className="font-bold text-rose-800">Prospect: &ldquo;{obj.objection}&rdquo;</div>
                  <div className="text-emerald-800 font-medium"><strong className="text-neutral-700">You reply:</strong> {obj.response}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
