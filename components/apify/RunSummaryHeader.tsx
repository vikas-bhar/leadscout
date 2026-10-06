"use client";

import React from "react";
import { ApifyActorRun } from "@/types/apify";
import { formatDuration, formatDateTime } from "@/lib/apify-utils";
import { CheckCircle2, Clock, AlertCircle, PlayCircle, XCircle } from "lucide-react";

interface RunSummaryHeaderProps {
  run: ApifyActorRun | null;
  loading: boolean;
  onOpenTestEndpoint: (endpointId: string) => void;
  datasetItemCount?: number;
}

export function RunSummaryHeader({
  run,
  loading,
  onOpenTestEndpoint,
  datasetItemCount,
}: RunSummaryHeaderProps) {
  if (loading && !run) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-slate-800/60 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const status = run?.status || "UNKNOWN";
  const durationMs = run?.stats?.durationMillis || 0;
  const startedAt = run?.startedAt;
  const finishedAt = run?.finishedAt;
  const memoryMb = run?.options?.memoryMbytes || 4096;
  const computeUnits = run?.stats?.computeUnits || 0;
  const usageCost = run?.usageTotalUsd ?? (run?.usageUsd?.ACTOR_COMPUTE_UNITS || 0);

  const getStatusBadge = () => {
    switch (status) {
      case "SUCCEEDED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          color: "text-emerald-400",
          border: "border-emerald-500/20 bg-emerald-500/10",
        };
      case "RUNNING":
        return {
          icon: <PlayCircle className="w-4 h-4 text-sky-400 animate-spin" />,
          color: "text-sky-400",
          border: "border-sky-500/20 bg-sky-500/10",
        };
      case "ABORTED":
      case "ABORTING":
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
          color: "text-amber-400",
          border: "border-amber-500/20 bg-amber-500/10",
        };
      case "FAILED":
      case "TIMED-OUT":
        return {
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          color: "text-rose-400",
          border: "border-rose-500/20 bg-rose-500/10",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          color: "text-slate-400",
          border: "border-slate-800 bg-slate-900",
        };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 sm:p-6 mb-6">
      {/* Title & Top Metadata - Clean unboxed text with typographic separators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.border} ${statusStyle.color}`}>
              {statusStyle.icon}
              <span className="font-mono">{status}</span>
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Actor Run <span className="font-mono text-emerald-400">{run?.id || "nIH0dNyLGe66edgys"}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Actor <strong className="text-slate-200 font-mono font-normal">{run?.actId || "Vb6LZkh4EqRlR0Ka9"}</strong></span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Origin: <span className="text-slate-300">{run?.meta?.origin || "WEB"}</span></span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Build <span className="font-mono text-slate-300">#{run?.buildNumber || "0.0.1"}</span></span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Exit Code: <span className="font-mono text-slate-300">{run?.exitCode ?? 0}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenTestEndpoint("get-run")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
          >
            Test Get Run API
          </button>
        </div>
      </div>

      {/* Structured metrics grid - Tabular numerals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
        <div>
          <span className="block text-[11px] font-medium text-slate-400">Duration</span>
          <span className="block text-base font-semibold text-white font-mono tabular-nums mt-0.5">
            {formatDuration(durationMs)}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-400">Started At</span>
          <span className="block text-xs font-medium text-slate-200 font-mono tabular-nums mt-1 truncate" title={startedAt || undefined}>
            {formatDateTime(startedAt)}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-400">Finished At</span>
          <span className="block text-xs font-medium text-slate-200 font-mono tabular-nums mt-1 truncate" title={finishedAt || undefined}>
            {formatDateTime(finishedAt)}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-400">Dataset Items</span>
          <span className="block text-base font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
            {datasetItemCount ?? 25}
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-400">Allocated Memory</span>
          <span className="block text-base font-semibold text-white font-mono tabular-nums mt-0.5">
            {memoryMb.toLocaleString()} MB
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-slate-400">Compute / Cost</span>
          <span className="block text-base font-semibold text-slate-200 font-mono tabular-nums mt-0.5">
            {computeUnits > 0 ? `${computeUnits.toFixed(4)} CU` : `$${usageCost.toFixed(4)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
