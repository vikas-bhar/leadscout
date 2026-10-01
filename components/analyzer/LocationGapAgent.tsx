"use client";

import { useState } from "react";
import {
  MapPin,
  Sparkles,
  Loader2,
  Building2,
  Search,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LocationGapAgentProps {
  availableCredits: number;
  onRunAnalysis: (locationQuery: string) => Promise<void>;
  isAnalyzing: boolean;
}

const FEATURED_LOCATIONS = [
  {
    title: "Artisan Coffee Roasters",
    location: "Austin, TX",
    query: "Artisan Coffee Roasters in Austin, TX",
    badge: "Café / Food & Bev",
  },
  {
    title: "Apex Fitness Studio",
    location: "Miami Beach, FL",
    query: "Apex Fitness Studio in Miami Beach, FL",
    badge: "Gym / Wellness",
  },
  {
    title: "Boutique Dental Care",
    location: "Beverly Hills, CA",
    query: "Boutique Dental Care in Beverly Hills, CA",
    badge: "Healthcare / Medical",
  },
  {
    title: "Urban Law Group",
    location: "Chicago, IL",
    query: "Urban Law Group in Chicago, IL",
    badge: "Professional Services",
  },
];

export function LocationGapAgent({
  availableCredits,
  onRunAnalysis,
  isAnalyzing,
}: LocationGapAgentProps) {
  const [businessName, setBusinessName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const [agentStep, setAgentStep] = useState<number>(0);

  function handlePresetClick(preset: typeof FEATURED_LOCATIONS[0]) {
    setBusinessName(preset.title);
    setLocationCity(preset.location);
    setSelectedPreset(preset.query);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = selectedPreset || `${businessName.trim()} in ${locationCity.trim()}`;
    if (!query || (!businessName.trim() && !selectedPreset)) {
      toast.error("Please enter a business name or select a location profile");
      return;
    }

    // Simulate Agent telemetry steps
    setAgentStep(1);
    const interval = setInterval(() => {
      setAgentStep((prev) => {
        if (prev >= 5) {
          clearInterval(interval);
          return 5;
        }
        return prev + 1;
      });
    }, 1200);

    try {
      await onRunAnalysis(query);
    } finally {
      clearInterval(interval);
      setAgentStep(0);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner / Agent Intro */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 text-white p-6 md:p-8 shadow-md border border-neutral-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            AI Deep Location &amp; Profile Agent
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Analyze Any Business Behind Its Location
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Enter a business name and location (or place URL). Our AI Agent queries Google Maps telemetry, verifies official website URLs, audits Instagram engagement velocity, and fact-checks digital conversion leaks to give you concrete, actionable gaps.
          </p>
        </div>
      </div>

      {/* Preset Profiles Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Quick Try Preset Profiles
          </h3>
          <span className="text-[11px] text-neutral-400">1-Click Agent Launch</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURED_LOCATIONS.map((preset) => {
            const isSelected = selectedPreset === preset.query;
            return (
              <button
                key={preset.title}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-neutral-900 truncate">{preset.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 font-semibold text-neutral-600 shrink-0">
                    {preset.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>{preset.location}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location & Profile Input Form */}
      <Card className="p-6 border border-neutral-200 bg-white shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="agent-business-input" className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                Business Name or Keyword
              </label>
              <input
                id="agent-business-input"
                type="text"
                placeholder="e.g. Apex Fitness, Joe's Coffee..."
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  setSelectedPreset(null);
                }}
                disabled={isAnalyzing}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="agent-location-input" className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                City, Region, or Address
              </label>
              <input
                id="agent-location-input"
                type="text"
                placeholder="e.g. Austin TX, Brooklyn NY..."
                value={locationCity}
                onChange={(e) => {
                  setLocationCity(e.target.value);
                  setSelectedPreset(null);
                }}
                disabled={isAnalyzing}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Strict Website Fact-Checking active (No false positive gaps).</span>
            </div>

            <Button
              type="submit"
              disabled={isAnalyzing || availableCredits < 5}
              className="h-11 px-6 font-semibold shadow-xs flex items-center gap-2 w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Agent Auditing Profile...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run AI Location Gap Agent (5 Credits)
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Live Agent Execution Telemetry Steps */}
      {isAnalyzing && (
        <Card className="p-6 border border-neutral-200 bg-slate-900 text-white space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                AI Agent Active Telemetry
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Stage {Math.min(agentStep, 5)} / 5</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className={`flex items-center gap-3 transition-opacity ${agentStep >= 1 ? "opacity-100 text-emerald-300" : "opacity-40 text-slate-500"}`}>
              {agentStep >= 1 ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span>1. Geolocating location profile &amp; fetching Google Maps telemetry...</span>
            </div>

            <div className={`flex items-center gap-3 transition-opacity ${agentStep >= 2 ? "opacity-100 text-emerald-300" : "opacity-40 text-slate-500"}`}>
              {agentStep >= 2 ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span>2. Inspecting Google Business ratings, review sentiment &amp; photo velocity...</span>
            </div>

            <div className={`flex items-center gap-3 transition-opacity ${agentStep >= 3 ? "opacity-100 text-emerald-300" : "opacity-40 text-slate-500"}`}>
              {agentStep >= 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span>3. Validating official website_url prefix &amp; mobile booking friction...</span>
            </div>

            <div className={`flex items-center gap-3 transition-opacity ${agentStep >= 4 ? "opacity-100 text-emerald-300" : "opacity-40 text-slate-500"}`}>
              {agentStep >= 4 ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span>4. Auditing Instagram profile engagement rate, Reels &amp; bio link funnel...</span>
            </div>

            <div className={`flex items-center gap-3 transition-opacity ${agentStep >= 5 ? "opacity-100 text-emerald-300" : "opacity-40 text-slate-500"}`}>
              {agentStep >= 5 ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span>5. Running gapFactChecker engine &amp; synthesizing high-converting pitches...</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
