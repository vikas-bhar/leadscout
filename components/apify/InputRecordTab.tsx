"use client";

import React, { useState } from "react";
import { ApifyRunInput } from "@/types/apify";
import { downloadJsonFile } from "@/lib/apify-utils";
import {
  Copy,
  Check,
  Download,
  Building2,
  Hash,
  Layers,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

interface InputRecordTabProps {
  inputData: ApifyRunInput | null;
  loading: boolean;
  kvsId: string;
  onRefresh: () => void;
  onOpenTestEndpoint: (endpointId: string) => void;
}

export function InputRecordTab({
  inputData,
  loading,
  kvsId,
  onRefresh,
  onOpenTestEndpoint,
}: InputRecordTabProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!inputData) return;
    navigator.clipboard.writeText(JSON.stringify(inputData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const companies = inputData?.companies || [];
  const maxItems = inputData?.maxItems ?? 25;
  const profileScraperMode = inputData?.profileScraperMode || "Full ($8 per 1k)";
  const companyBatchMode = inputData?.companyBatchMode || "all_at_once";
  const recentlyChangedJobs = inputData?.recentlyChangedJobs ?? false;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              RECORD: INPUT
            </span>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Actor Run Input Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store ID: <span className="font-mono text-slate-200">{kvsId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Refresh input record"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>
          <button
            onClick={() => downloadJsonFile(inputData, `input_${kvsId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={() => onOpenTestEndpoint("get-input")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
          >
            Test endpoint
          </button>
        </div>
      </div>

      {/* Visual Parameter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Companies */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Target Company</span>
          </div>
          <div className="space-y-1.5">
            {companies.length > 0 ? (
              companies.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <a
                    href={comp}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-mono truncate max-w-[200px] flex items-center gap-1"
                  >
                    <span>{comp.replace("https://www.linkedin.com/company/", "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-mono">None specified</span>
            )}
          </div>
        </div>

        {/* Max Items */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Hash className="w-4 h-4 text-sky-400" />
            <span>Max Items Limit</span>
          </div>
          <div className="text-lg font-semibold font-mono text-white tabular-nums">
            {maxItems} <span className="text-xs text-slate-400 font-normal">profiles</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (maxItems / 50) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Scraper Mode */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Scraper Mode</span>
          </div>
          <div className="text-xs font-medium font-mono text-amber-300">
            {profileScraperMode}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full profile enrichment pricing</p>
        </div>

        {/* Batch & Filters */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Batch Mode</span>
          </div>
          <div className="text-xs font-medium font-mono text-purple-300 capitalize">
            {companyBatchMode.replace(/_/g, " ")}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Recent Jobs: {recentlyChangedJobs ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>

      {/* Raw JSON Record View */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400">INPUT.json</span>
          <span className="text-slate-500">application/json</span>
        </div>
        <div className="p-4 overflow-x-auto max-h-[500px]">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
              Loading input record...
            </div>
          ) : (
            <pre className="font-mono text-xs text-emerald-300/90 leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(inputData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
