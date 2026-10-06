"use client";

import React, { useState } from "react";
import Image from "next/image";
import { KeyRound, RefreshCw, Terminal, Database, FileText, Sliders, Activity, OctagonAlert, RotateCcw } from "lucide-react";
import { maskToken } from "@/lib/apify-utils";

interface ApifyHeaderProps {
  activeTab: "overview" | "dataset" | "input" | "logs" | "endpoints";
  setActiveTab: (tab: "overview" | "dataset" | "input" | "logs" | "endpoints") => void;
  runId: string;
  setRunId: (id: string) => void;
  token: string;
  onOpenTokenModal: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  datasetItemCount?: number;
  onAbortRun: () => void;
  onResurrectRun: () => void;
  runStatus?: string;
}

export function ApifyHeader({
  activeTab,
  setActiveTab,
  runId,
  setRunId,
  token,
  onOpenTokenModal,
  onRefreshAll,
  isRefreshing,
  autoRefreshInterval,
  setAutoRefreshInterval,
  datasetItemCount,
  onAbortRun,
  onResurrectRun,
  runStatus,
}: ApifyHeaderProps) {
  const [editingRunId, setEditingRunId] = useState(false);
  const [runInputVal, setRunInputVal] = useState(runId);

  const handleRunSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (runInputVal.trim()) {
      setRunId(runInputVal.trim());
      setEditingRunId(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Top zone adhering to Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              <Activity className="w-4 h-4" />
            </div>
            <a href="/" className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              <span>Apify Run Console</span>
            </a>
          </div>

          <span className="hidden lg:inline text-slate-700">/</span>

          {/* Run ID pill switcher */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            {editingRunId ? (
              <form onSubmit={handleRunSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={runInputVal}
                  onChange={(e) => setRunInputVal(e.target.value)}
                  placeholder="Run ID"
                  className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 w-44"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-emerald-500 text-slate-950 font-medium text-xs rounded hover:bg-emerald-400"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRunId(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setEditingRunId(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 font-mono text-xs hover:border-slate-700 transition-colors"
                title="Click to switch Run ID"
              >
                <span className="text-slate-500">Run:</span>
                <span className="text-emerald-400 font-semibold">{runId}</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone 2: 4-6 Nav tabs / Segmented Controls */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab("dataset")}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "dataset"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Dataset Items
            {datasetItemCount !== undefined && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                {datasetItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("input")}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "input"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Run Input
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "logs"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Live Logs
          </button>

          <button
            onClick={() => setActiveTab("endpoints")}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "endpoints"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            API Endpoints (6)
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Token button */}
          <button
            onClick={onOpenTokenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Configure Apify API Token"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">{maskToken(token)}</span>
            <span className="xl:hidden">Token</span>
          </button>

          {/* Auto-refresh interval dropdown */}
          <div className="relative flex items-center">
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="appearance-none bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg px-2.5 py-1.5 pr-6 hover:border-slate-700 focus:outline-none cursor-pointer"
              title="Auto-refresh polling frequency"
            >
              <option value={0}>Poll: Off</option>
              <option value={3000}>Poll: 3s</option>
              <option value={5000}>Poll: 5s</option>
              <option value={10000}>Poll: 10s</option>
            </select>
            <div className="pointer-events-none absolute right-2 text-slate-500 text-[10px]">▼</div>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 disabled:opacity-50"
            title="Refresh run state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          {/* Abort / Resurrect Quick Actions */}
          {runStatus === "RUNNING" ? (
            <button
              onClick={onAbortRun}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors"
              title="Abort current run"
            >
              <OctagonAlert className="w-3.5 h-3.5" />
              <span>Abort</span>
            </button>
          ) : (
            <button
              onClick={onResurrectRun}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
              title="Resurrect finished run"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resurrect</span>
            </button>
          )}

          {/* Dev avatar */}
          <div className="hidden sm:block pl-1">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 relative">
              <Image
                src="/images/avatar.jpg"
                alt="Developer Avatar"
                width={28}
                height={28}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === "overview" ? "bg-slate-800 text-white font-medium" : "text-slate-400"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("dataset")}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === "dataset" ? "bg-slate-800 text-white font-medium" : "text-slate-400"
          }`}
        >
          Dataset ({datasetItemCount ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("input")}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === "input" ? "bg-slate-800 text-white font-medium" : "text-slate-400"
          }`}
        >
          Input Record
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === "logs" ? "bg-slate-800 text-white font-medium" : "text-slate-400"
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab("endpoints")}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === "endpoints" ? "bg-slate-800 text-white font-medium" : "text-slate-400"
          }`}
        >
          Endpoints
        </button>
      </div>
    </header>
  );
}
