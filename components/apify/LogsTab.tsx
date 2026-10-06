"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { downloadTextFile } from "@/lib/apify-utils";
import {
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
  ArrowDown,
  WrapText,
} from "lucide-react";

interface LogsTabProps {
  logText: string;
  loading: boolean;
  runId: string;
  token: string;
  onRefresh: () => void;
  onOpenTestEndpoint: (endpointId: string) => void;
}

export function LogsTab({
  logText,
  loading,
  runId,
  onRefresh,
  onOpenTestEndpoint,
}: Omit<LogsTabProps, "token">) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Parse lines
  const lines = useMemo(() => {
    if (!logText) return [];
    return logText.split("\n");
  }, [logText]);

  // Filter lines
  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      if (!line) return false;
      const lower = line.toLowerCase();

      // Level check
      if (levelFilter === "INFO" && !line.includes("INFO") && !lower.includes("scraped")) return false;
      if (levelFilter === "WARN" && !line.includes("WARN") && !lower.includes("warning")) return false;
      if (levelFilter === "ERROR" && !line.includes("ERROR") && !lower.includes("failed")) return false;

      // Search check
      if (searchQuery.trim() && !lower.includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [lines, searchQuery, levelFilter]);

  // Scroll to bottom when new logs arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLines, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(logText, `apify_run_${runId}.log`);
  };

  const renderLineColor = (line: string) => {
    if (line.includes("ERROR") || line.includes("ERR") || line.toLowerCase().includes("failed")) {
      return "text-rose-400";
    }
    if (line.includes("WARN") || line.toLowerCase().includes("warning")) {
      return "text-amber-300";
    }
    if (line.includes("INFO") || line.includes("Status message") || line.toLowerCase().includes("scraped profile")) {
      return "text-emerald-300";
    }
    return "text-slate-300";
  };

  return (
    <div className="space-y-4">
      {/* Controls & Grep Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Level Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or grep log lines..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Level Filter Segmented Control */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  levelFilter === lvl
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              autoScroll
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Auto-scroll to bottom of log"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          {/* Wrap lines toggle */}
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              wrapLines
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Wrap long log lines"
          >
            <WrapText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wrap</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Download .log file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Test Endpoint Button matching user prompt */}
          <button
            onClick={() => onOpenTestEndpoint("get-log")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
          >
            Test endpoint
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-slate-300 font-semibold pl-2">run_{runId}.log</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              {filteredLines.length} / {lines.length} lines
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh log text"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto max-h-[600px] min-h-[350px] font-mono text-xs select-text">
          {loading && !logText ? (
            <div className="h-48 flex items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Fetching logs from container...</span>
            </div>
          ) : filteredLines.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500">
              <p>No log lines match current filters</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors ${
                    wrapLines ? "break-all" : "whitespace-pre"
                  }`}
                >
                  <span className="text-slate-600 select-none text-[11px] tabular-nums shrink-0 w-8 text-right font-mono">
                    {idx + 1}
                  </span>
                  <span className={`leading-relaxed ${renderLineColor(line)}`}>
                    {line}
                  </span>
                </div>
              ))}
              <div ref={terminalBottomRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
