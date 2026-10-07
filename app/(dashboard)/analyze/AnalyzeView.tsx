"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Link as LinkIcon,
  Sparkles,
  Clipboard,
  Loader2,
  AlertCircle,
  Coins,
  Camera,
  Globe,
  MapPin,
  Share2,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { LocationGapAgent } from "@/components/analyzer/LocationGapAgent";
import { detectLinkType } from "@/lib/analyzer/detectLink";
import { AnalysisResult } from "@/components/analyzer/AnalysisResult";
import { deductLocalCredits, saveLocalLeads, getLocalBalance } from "@/lib/local-store";
import { type AnalyzerResultData, type Lead, CREDIT_COSTS } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnalyzeViewProps {
  initialAvailableCredits: number;
}

const SAMPLE_LINKS = [
  { label: "Nike Instagram", url: "https://www.instagram.com/nike/", type: "instagram" },
  { label: "Local Restaurant Map", url: "https://maps.google.com/?q=restaurants+in+Jumeirah+Dubai", type: "maps" },
  { label: "Coffee Shop Web", url: "https://bluebottlecoffee.com", type: "website" },
];

export function AnalyzeView({ initialAvailableCredits }: AnalyzeViewProps) {
  const [activeTab, setActiveTab] = useState<"location_agent" | "link">("location_agent");
  const [url, setUrl] = useState("");
  const [availableCredits, setAvailableCredits] = useState(initialAvailableCredits);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzerResultData | null>(null);
  const [leadData, setLeadData] = useState<Lead | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    // Immediately restore persisted local balance
    const local = getLocalBalance();
    if (local && typeof local.availableCredits === "number") {
      setAvailableCredits(local.availableCredits);
    }

    async function fetchServerCredits() {
      try {
        const res = await fetch("/api/credits/balance");
        if (!res.ok) return;
        const data = await res.json();
        // If guest mode, keep persisted local balance
        if (data.isGuest) return;
        if (!cancelled && typeof data.availableCredits === "number") {
          setAvailableCredits(data.availableCredits);
        }
      } catch {
        const local = getLocalBalance();
        if (local && typeof local.availableCredits === "number" && !cancelled) {
          setAvailableCredits(local.availableCredits);
        }
      }
    }

    void fetchServerCredits();

    function sync() {
      const bal = getLocalBalance();
      if (bal && typeof bal.availableCredits === "number" && !cancelled) {
        setAvailableCredits(bal.availableCredits);
      }
    }
    sync();
    window.addEventListener("freelancefind_store_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("freelancefind_store_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const cost = CREDIT_COSTS.analyze_link || 5;
  const hasEnoughCredits = availableCredits >= cost;

  async function handleClaimRefill() {
    setIsRefilling(true);
    try {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50 }),
      });
      const data = await res.json();
      if (res.ok && typeof data.newBalance === "number") {
        setAvailableCredits(data.newBalance);
        setError(null);
        toast.success(`Claimed 50 test credits! New balance: ${data.newBalance} credits.`);
        window.dispatchEvent(new Event("freelancefind_store_updated"));
      } else {
        toast.error(data.error || "Could not refill test credits");
      }
    } catch {
      toast.error("Network error while claiming test credits");
    } finally {
      setIsRefilling(false);
    }
  }

  // Real-time link type detection
  const detected = useMemo(() => {
    if (!url.trim()) return null;
    return detectLinkType(url.trim());
  }, [url]);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        toast.info("Link pasted from clipboard");
      }
    } catch {
      toast.error("Could not read clipboard. Please paste manually.");
    }
  }

  async function executeAnalysis(targetUrl: string, bypassCache = false) {
    if (!targetUrl) {
      toast.error("Please paste or type a valid business URL");
      return;
    }

    if (!hasEnoughCredits && !bypassCache) {
      toast.error(`Insufficient credits. You need ${cost} credits, but have ${availableCredits}.`);
      return;
    }

    setError(null);
    if (bypassCache) {
      setIsRefreshingLive(true);
    } else {
      setIsAnalyzing(true);
      setAnalysisData(null);
      setLeadData(undefined);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, bypassCache }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze business link");
      }

      setAnalysisData(data.analysis);
      setLeadData(data.lead);
      setIsCachedResult(Boolean(data.cached));

      if (data.lead) {
        saveLocalLeads([data.lead]);
      }

      if (typeof data.newBalance === "number") {
        setAvailableCredits(data.newBalance);
        window.dispatchEvent(new Event("freelancefind_store_updated"));
      } else if (!data.cached) {
        setAvailableCredits((prev) => Math.max(0, prev - cost));
        window.dispatchEvent(new Event("freelancefind_store_updated"));
      }

      if (!data.cached && data.creditsUsed !== 0) {
        deductLocalCredits(cost, `Gap Analysis for ${targetUrl}`);
      }

      if (data.cached) {
        toast.success("Loaded from 24h Business Cache (0 credits consumed)!");
      } else {
        toast.success("Live Gap Analysis completed successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze link";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
      setIsRefreshingLive(false);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    await executeAnalysis(url.trim(), false);
  }

  function handleReset() {
    setUrl("");
    setAnalysisData(null);
    setLeadData(undefined);
    setIsCachedResult(false);
    setError(null);
  }

  function renderDetectedBadge() {
    if (!detected || detected.type === "unknown") return null;

    switch (detected.type) {
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 animate-in fade-in-50">
            <Camera className="h-3.5 w-3.5" />
            Instagram Profile {detected.handle ? `(@${detected.handle})` : ""}
          </span>
        );
      case "website":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-in fade-in-50">
            <Globe className="h-3.5 w-3.5" />
            Website ({detected.domain || "Web URL"})
          </span>
        );
      case "maps":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in-50">
            <MapPin className="h-3.5 w-3.5" />
            Google Maps Listing
          </span>
        );
      case "facebook":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-in fade-in-50">
            <Share2 className="h-3.5 w-3.5" />
            Facebook Page {detected.handle ? `(${detected.handle})` : ""}
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Gap Analyzer</h1>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Paste any business link → AI analyzes digital gaps → generates personalized outreach pitches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/diagnostics"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            title="Scraper Diagnostics and Raw Response Inspector"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Scraper Diagnostics</span>
          </Link>
          <div className="rounded-lg bg-neutral-100/80 border border-neutral-200/70 px-3 py-1.5 text-xs text-neutral-600 flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span>
              Balance: <strong className="text-neutral-900">{availableCredits} credits</strong>
            </span>
          </div>
          <Link href="/credits" className="text-xs text-primary font-semibold hover:underline">
            Get Credits
          </Link>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("location_agent")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "location_agent"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          AI Location &amp; Profile Deep Agent
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("link")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "link"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5 text-primary" />
          Paste Business Link / URL
        </button>
      </div>

      {/* Tab 1: Location & Profile Deep Agent */}
      {activeTab === "location_agent" && (
        <LocationGapAgent
          availableCredits={availableCredits}
          onRunAnalysis={(query) => executeAnalysis(query, true)}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* Tab 2: URL Input Section */}
      {activeTab === "link" && (
        <Card className="border border-neutral-200/80 bg-white p-6 shadow-sm">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="analyze-url-input" className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-primary" />
                Target Business Link
              </label>
              {renderDetectedBadge()}
            </div>

            <div className="relative flex items-center">
              <input
                id="analyze-url-input"
                type="text"
                placeholder="Paste Instagram, Website, Google Maps, or Facebook URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                className="w-full h-12 pl-4 pr-24 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-xs"
              />

              <button
                type="button"
                onClick={handlePaste}
                disabled={isAnalyzing}
                className="absolute right-2 h-8 px-3 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
              >
                <Clipboard className="h-3.5 w-3.5" />
                Paste
              </button>
            </div>
          </div>

          {/* Supported Link Types Badges & Samples */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-neutral-400">Supported:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200/60 text-neutral-700">
                <Camera className="h-3 w-3 text-pink-600" /> Instagram
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200/60 text-neutral-700">
                <Globe className="h-3 w-3 text-blue-600" /> Website
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200/60 text-neutral-700">
                <MapPin className="h-3 w-3 text-emerald-600" /> Google Maps
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-50 border border-neutral-200/60 text-neutral-700">
                <Share2 className="h-3 w-3 text-indigo-600" /> Facebook
              </span>
            </div>

            {/* Quick Sample Links */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Try:</span>
              {SAMPLE_LINKS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setUrl(s.url)}
                  className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-medium transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span>
                Cost: <strong className="text-neutral-900">{cost} credits</strong> per analysis.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!hasEnoughCredits && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClaimRefill}
                  disabled={isRefilling}
                  className="h-10 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 font-medium"
                >
                  {isRefilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Claim 50 Free Test Credits
                </Button>
              )}

              <Button
                type="submit"
                disabled={isAnalyzing || !url.trim() || !hasEnoughCredits}
                className="h-11 px-6 text-sm font-semibold shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Auditing &amp; Analyzing Gaps...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Link — {cost} Credits
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
      )}

      {/* Loading Progress State */}
      {isAnalyzing && (
        <Card className="border border-neutral-200/80 bg-linear-to-r from-neutral-50 via-slate-50 to-neutral-50 p-8 text-center space-y-4 shadow-xs">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-neutral-900">Scraping &amp; Auditing Digital Gaps</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Extracting profile telemetry, engagement velocity, content themes, and running Gemini AI gap identification...
            </p>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {analysisData && (
        <div className="pt-2">
          <AnalysisResult
            analysis={analysisData}
            lead={leadData}
            onReset={handleReset}
            isCached={isCachedResult}
            onRefreshLive={() => executeAnalysis(url.trim(), true)}
            isRefreshingLive={isRefreshingLive}
          />
        </div>
      )}
    </div>
  );
}
