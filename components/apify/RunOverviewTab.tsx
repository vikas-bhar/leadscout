"use client";

import React, { useState } from "react";
import { ApifyActorRun } from "@/types/apify";
import { Database, FileText, Terminal, HardDrive, Cpu, Check, Copy, ArrowUpRight } from "lucide-react";

interface RunOverviewTabProps {
  run: ApifyActorRun | null;
  onOpenTestEndpoint: (endpointId: string) => void;
  onSwitchTab: (tab: "overview" | "dataset" | "input" | "logs" | "endpoints") => void;
}

export function RunOverviewTab({
  run,
  onOpenTestEndpoint,
  onSwitchTab,
}: RunOverviewTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const datasetId = run?.defaultDatasetId || "b1wOSq2O5NFTnJfpi";
  const kvsId = run?.defaultKeyValueStoreId || "BuQtnXkouKFscVWBd";
  const runId = run?.id || "nIH0dNyLGe66edgys";

  return (
    <div className="space-y-6">
      {/* Storages row */}
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight mb-3">
          Linked Storages & Artefacts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dataset card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Database className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Default Dataset</span>
              </div>
              <button
                onClick={() => onSwitchTab("dataset")}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                View Items <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-200 truncate">{datasetId}</span>
              <button
                onClick={() => handleCopy(datasetId, "dataset")}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Dataset ID"
              >
                {copiedKey === "dataset" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Stores structured output items from actor execution.
            </p>
          </div>

          {/* Key-Value Store Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Key-Value Store</span>
              </div>
              <button
                onClick={() => onSwitchTab("input")}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                View Input <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-200 truncate">{kvsId}</span>
              <button
                onClick={() => handleCopy(kvsId, "kvs")}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy KVS ID"
              >
                {copiedKey === "kvs" ? (
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Stores run configuration (INPUT) and output records.
            </p>
          </div>

          {/* Execution Log Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Run Logs</span>
              </div>
              <button
                onClick={() => onSwitchTab("logs")}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                Open Terminal <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-200 truncate">{runId}</span>
              <button
                onClick={() => handleCopy(runId, "log")}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Log ID"
              >
                {copiedKey === "log" ? (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Live console stdout/stderr log stream from worker container.
            </p>
          </div>
        </div>
      </div>

      {/* Container Runtime & Memory Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Execution Metrics & Resource Utilization
          </h3>
          <div className="divide-y divide-slate-800/80 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Container Status</span>
              <span className="font-mono text-emerald-400 font-semibold">{run?.status || "SUCCEEDED"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Exit Code</span>
              <span className="font-mono text-slate-200">{run?.exitCode ?? 0}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Allocated Memory</span>
              <span className="font-mono text-slate-200">{run?.options?.memoryMbytes || 4096} MB</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Timeout Limit</span>
              <span className="font-mono text-slate-200">{run?.options?.timeoutSecs ? `${run.options.timeoutSecs}s` : "Unlimited"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Restart / Resurrect Count</span>
              <span className="font-mono text-slate-200">
                {run?.stats?.restartCount || 0} restarts · {run?.stats?.resurrectCount || 0} resurrects
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Compute Units</span>
              <span className="font-mono text-slate-200">
                {run?.stats?.computeUnits?.toFixed(5) || "0.00224"} CU
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white tracking-tight mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            Origin, Actor & Client Information
          </h3>
          <div className="divide-y divide-slate-800/80 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Actor ID</span>
              <span className="font-mono text-slate-200">{run?.actId || "Vb6LZkh4EqRlR0Ka9"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">User Account ID</span>
              <span className="font-mono text-slate-200">{run?.userId || "aySgZRfEWFPKc7NjL"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Execution Origin</span>
              <span className="font-mono text-slate-200">{run?.meta?.origin || "WEB"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Build Tag</span>
              <span className="font-mono text-slate-200">{run?.options?.build || "latest"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Status Message</span>
              <span className="font-mono text-emerald-400">{run?.statusMessage || "success"}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">Terminal State</span>
              <span className="font-mono text-slate-200">{run?.isStatusMessageTerminal ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Test Endpoints matching user prompt */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Direct API Endpoints for this Run
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute or copy cURL commands directly for the active run
            </p>
          </div>
          <button
            onClick={() => onSwitchTab("endpoints")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Open Full API Test Bench →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[11px] font-mono font-semibold">GET</span>
                <span className="text-xs font-semibold text-white">Get Run</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                /v2/actor-runs/{runId}
              </p>
            </div>
            <button
              onClick={() => onOpenTestEndpoint("get-run")}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Test endpoint
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[11px] font-mono font-semibold">GET</span>
                <span className="text-xs font-semibold text-white">Get Input</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                /v2/key-value-stores/{kvsId}/records/INPUT
              </p>
            </div>
            <button
              onClick={() => onOpenTestEndpoint("get-input")}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Test endpoint
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[11px] font-mono font-semibold">GET</span>
                <span className="text-xs font-semibold text-white">Get Dataset Items</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                /v2/datasets/{datasetId}/items
              </p>
            </div>
            <button
              onClick={() => onOpenTestEndpoint("get-dataset")}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Test endpoint
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[11px] font-mono font-semibold">GET</span>
                <span className="text-xs font-semibold text-white">Get Log</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                /v2/logs/{runId}
              </p>
            </div>
            <button
              onClick={() => onOpenTestEndpoint("get-log")}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Test endpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
