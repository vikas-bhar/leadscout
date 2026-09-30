"use client";

import { useState } from "react";
import { Trophy, Star, AlertTriangle, CheckCircle2, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CompetitorAnalysis } from "@/lib/competitors/competitorAnalyzer";

interface CompetitorTabProps {
  leadId: string;
  initialAnalysis?: CompetitorAnalysis | null;
}

export function CompetitorTab({ leadId, initialAnalysis }: CompetitorTabProps) {
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(initialAnalysis || null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  async function handleRunAnalysis() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/competitors`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run competitor analysis");
      }
      setAnalysis(data.analysis);
      toast.success("Competitor analysis completed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyPitch() {
    if (!analysis?.pitchLine) return;
    navigator.clipboard.writeText(analysis.pitchLine);
    setCopiedPitch(true);
    toast.success("Enhanced pitch copied to clipboard!");
    setTimeout(() => setCopiedPitch(false), 2000);
  }

  const getPositionBadge = (pos: string) => {
    switch (pos) {
      case "leader":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">LEADER — Top performer</span>;
      case "middle":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">MIDDLE — Mid-market position</span>;
      case "lagging":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">LAGGING — Falling behind rivals</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">LAST — Lowest performer in area</span>;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">HIGH</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">LOW</span>;
    }
  };

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">See how this business compares</h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Scan their top 3 local competitors on Google Maps & Instagram to generate a powerful competitor gap analysis and enhanced outreach pitch.
          </p>
        </div>
        <div className="pt-2">
          <Button onClick={handleRunAnalysis} disabled={isLoading} className="gap-2 text-xs font-semibold px-5 py-2.5">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            <span>Run Competitor Analysis — 3 💎</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* SECTION 1: Market Position */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Local Market Position</span>
          <div className="mt-1 flex items-center gap-3">
            {getPositionBadge(analysis.marketPosition)}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRunAnalysis} disabled={isLoading} className="text-xs gap-1.5">
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>Refresh Analysis (3 💎)</span>
        </Button>
      </div>

      {/* SECTION 2: Competitor Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Top 3 Local Competitors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.competitors.map((comp, idx) => (
            <Card key={idx} className="p-5 border border-neutral-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-900 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{comp.name}</h4>
                  <p className="text-[11px] text-neutral-400">{comp.category}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{comp.rating ?? "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex justify-between">
                  <span>Google Reviews:</span>
                  <strong className="text-neutral-900 dark:text-white">{comp.reviewCount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Website:</span>
                  <span className={comp.hasWebsite ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                    {comp.hasWebsite ? "✓ Yes" : "✗ None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Instagram Followers:</span>
                  <strong className="text-neutral-900 dark:text-white">{comp.instagramFollowers ? comp.instagramFollowers.toLocaleString() : "None"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Engagement:</span>
                  <span className="text-neutral-900 dark:text-white">{comp.instagramEngagement ? `${comp.instagramEngagement}%` : "N/A"}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 3: Gap Comparison Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Gap & Metric Comparison</h3>
        <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 uppercase font-semibold border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Target Business</th>
                  <th className="px-4 py-3">Top Competitor</th>
                  <th className="px-4 py-3">Gap Analysis</th>
                  <th className="px-4 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {analysis.gaps.map((gap, i) => (
                  <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{gap.metric}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{gap.targetBusiness}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{gap.topCompetitor}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{gap.gap}</td>
                    <td className="px-4 py-3">{getSeverityBadge(gap.severity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* SECTION 4: Competitor Pitch Enhancement */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Enhanced Pitch (Powered by Competitor Data)</h3>
        <Card className="p-5 border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
          <p className="text-xs text-neutral-700 dark:text-neutral-200 font-mono leading-relaxed">
            &ldquo;{analysis.pitchLine}&rdquo;
          </p>
          <div className="flex justify-end">
            <Button onClick={handleCopyPitch} size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              {copiedPitch ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPitch ? "Copied!" : "Copy Enhanced Pitch"}</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* SECTION 5: Competitor Insights */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Strategic Insights</h3>
        <Card className="p-5 border border-neutral-200 dark:border-neutral-800 space-y-2 bg-white dark:bg-neutral-900">
          {analysis.competitorInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Urgency Booster: {analysis.urgencyBooster}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
