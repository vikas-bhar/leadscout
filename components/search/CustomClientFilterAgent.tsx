"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sliders,
  Target,
  FileText,
  Building2,
  MapPin,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CustomClientFilter, FreelancerType } from "@/types";

interface CustomClientFilterAgentProps {
  currentFreelancerType: FreelancerType;
  currentCountry: string;
  currentCity: string;
  currentPlace: string;
  resultCount: number;
  onResultCountChange: (count: number) => void;
  onContinueToSearch: (customFilter: CustomClientFilter) => void;
  disabled?: boolean;
}

const PROMPT_SUGGESTIONS = [
  {
    title: "Upscale Aesthetic Clinics with Dead Instagram",
    prompt:
      "Find high-end aesthetic / cosmetic clinics in Dubai with >50 reviews and high budget signals, but inactive Instagram profiles (<1 post/month) and zero short-form Reels. I want to pitch video content packages.",
  },
  {
    title: "Fine Dining Restaurants with No Website",
    prompt:
      "Search for luxury Italian or French fine dining restaurants in London with high Google ratings (4.2+) that lack a modern mobile-responsive website or online reservation funnel. Exclude fast food.",
  },
  {
    title: "High-Ticket Real Estate Agencies with Weak SEO",
    prompt:
      "Target boutique real estate agencies in Miami or New York that have established offices and good reviews, but lack proper local landing pages and have poor search ranking presence.",
  },
  {
    title: "Commercial Contractors with Reputation Gaps",
    prompt:
      "Find residential & commercial roofing or remodeling contractors with active phone numbers who have unanswered 1-star reviews on Google Maps and no automated follow-up system.",
  },
];

export function CustomClientFilterAgent({
  currentFreelancerType,
  currentCountry,
  currentCity,
  currentPlace,
  resultCount,
  onResultCountChange,
  onContinueToSearch,
  disabled = false,
}: CustomClientFilterAgentProps) {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customFilter, setCustomFilter] = useState<CustomClientFilter | null>(null);

  async function handleUnderstandPrompt(customPromptText?: string) {
    const textToAnalyze = (customPromptText || prompt).trim();
    if (!textToAnalyze) {
      toast.error("Please describe what type of clients you want our agent to find.");
      return;
    }

    setIsAnalyzing(true);
    setCustomFilter(null);

    try {
      const res = await fetch("/api/search/understand-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToAnalyze,
          currentFreelancerType,
          currentCountry,
          currentCity,
          currentPlace,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.customFilter) {
        throw new Error(data.error || "Could not analyze custom client filter");
      }

      setCustomFilter(data.customFilter);
      toast.success("Agent understood your criteria and formed a tailored search strategy!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze brief";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSelectSuggestion(suggestionPrompt: string) {
    setPrompt(suggestionPrompt);
    void handleUnderstandPrompt(suggestionPrompt);
  }

  return (
    <div className="space-y-6">
      {/* Input Brief Section */}
      <Card className="border border-primary/20 bg-linear-to-b from-primary/[0.03] to-white p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-neutral-900">
                AI Client Scout & Custom Filter Agent
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Describe in plain English the exact type of clients you want. Our agent will analyze your brief, extract structured filters, and build a targeted search plan before scouting leads.
            </p>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isAnalyzing || disabled}
            placeholder="e.g. Find upscale dental clinics and aesthetic spas in Dubai Marina with at least 40 reviews and high budget indicators, but having zero short-form Reels and an outdated website. I want to pitch them high-converting video and landing page revamps..."
            className="w-full min-h-[110px] p-3.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-neutral-400">
              {prompt.length} characters • Provide specific niches, gaps, and location preferences
            </div>
            <Button
              type="button"
              onClick={() => handleUnderstandPrompt()}
              disabled={isAnalyzing || prompt.trim().length < 5 || disabled}
              className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Agent Analyzing Request...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {customFilter ? "Re-Analyze & Update Strategy" : "Understand & Form Strategy"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 border-t border-neutral-100 space-y-2">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary" />
            Quick Example Briefs:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROMPT_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item.prompt)}
                disabled={isAnalyzing || disabled}
                className="text-left p-2.5 rounded-lg border border-neutral-200 bg-white hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-xs group"
              >
                <div className="font-semibold text-neutral-800 group-hover:text-primary transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {item.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-8 border border-dashed border-primary/40 bg-primary/[0.02] text-center space-y-3 animate-pulse">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6 animate-spin" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Agent is parsing your client requirements...
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Extracting industry niches, cross-referencing conversion benchmarks, mapping digital gap priorities, and preparing custom pitch angles.
          </p>
        </Card>
      )}

      {/* Agent Understanding & Strategy Review Dossier */}
      {customFilter && !isAnalyzing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-bold text-neutral-900">
                Agent Understanding & Search Plan
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleUnderstandPrompt()}
              className="text-xs text-neutral-500 hover:text-primary flex items-center gap-1 font-medium transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Re-parse
            </button>
          </div>

          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 text-neutral-900 space-y-1">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Agent Understanding Summary
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-800">
              {customFilter.agentUnderstanding.summary}
            </p>
          </div>

          {/* 4 Deep Intelligence Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Target Profile & Niche */}
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 border-b border-neutral-100 pb-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                Target Persona & Niche Focus
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Industry / Niche:</span>
                  <span className="font-semibold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                    {customFilter.nicheFocus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Base Category:</span>
                  <span className="font-medium text-neutral-800">{customFilter.primaryCategory}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Target Location:</span>
                  <span className="font-medium text-neutral-800 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    {customFilter.targetLocation.rawLocation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Budget Signal:</span>
                  <span className="font-semibold text-emerald-700 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {customFilter.budgetLevel} budget
                  </span>
                </div>
              </div>
            </Card>

            {/* Card 2: Digital Gap Priority Filter */}
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 border-b border-neutral-100 pb-2">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Digital Gap Priority Criteria
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] text-neutral-400">
                  The agent will score and prioritize leads exhibiting these weaknesses:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customFilter.digitalGapPriorities.map((gap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium text-[11px] flex items-center gap-1"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Card 3: Agent Scouting Blueprint */}
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 border-b border-neutral-100 pb-2">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                Agent Search Blueprint
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-600">
                {customFilter.agentUnderstanding.scoutingStrategy.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Card 4: Customized Pitch & Angle Strategy */}
            <Card className="p-4 border border-neutral-200/80 bg-white space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 border-b border-neutral-100 pb-2">
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                Synthesized Outreach Strategy
              </div>
              <div className="space-y-2 text-xs">
                <p className="text-neutral-700 italic bg-purple-50/60 p-2.5 rounded-lg border border-purple-100 text-[11px] leading-relaxed">
                  &ldquo;{customFilter.pitchStrategyAngle}&rdquo;
                </p>
                <div className="text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-700">Target Decision Maker: </span>
                  {customFilter.agentUnderstanding.targetPersona}
                </div>
              </div>
            </Card>
          </div>

          {/* Result Count and Launch Area */}
          <Card className="p-5 border border-primary/30 bg-primary/[0.02] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    Lead Discovery Quantity
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Choose how many high-opportunity leads to scout using this custom filter.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-neutral-200">
                  {[10, 20, 30, 50].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onResultCountChange(count)}
                      className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                        resultCount === count
                          ? "bg-primary text-white shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Custom agent filter active and ready to scout</span>
              </div>

              <Button
                type="button"
                onClick={() => onContinueToSearch(customFilter)}
                disabled={disabled}
                className="w-full sm:w-auto h-10 px-6 text-xs font-semibold shadow-sm gap-2"
              >
                <span>Continue to Search with Agent Filters</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
