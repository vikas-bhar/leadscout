"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Terminal,
  RefreshCw,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Code,
  MapPin,
  Phone,
  Mail,
  Share2,
  Copy,
  ChevronRight,
  Filter,
  Play,
  FileCode,
  Sparkles,
  ArrowLeft,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ScraperDiagnosticLog } from "@/lib/diagnostic-logger";

interface DiagnosticMetrics {
  total: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  missingAddressCount: number;
  missingPhoneCount: number;
  missingSocialCount: number;
  avgDurationMs: number;
}

export function DiagnosticLogsView() {
  const [logs, setLogs] = useState<ScraperDiagnosticLog[]>([]);
  const [metrics, setMetrics] = useState<DiagnosticMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Selected log for detailed inspection modal
  const [selectedLog, setSelectedLog] = useState<ScraperDiagnosticLog | null>(null);
  const [htmlSearchTerm, setHtmlSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"trace" | "raw" | "parsed">("trace");

  // Live URL test workbench
  const [testUrl, setTestUrl] = useState("");
  const [testing, setTesting] = useState(false);

  const fetchLogs = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== "all") params.set("type", filterType);
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/admin/diagnostics?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data.logs || []);
        setMetrics(data.metrics || null);
      } catch (err) {
        console.error("Diagnostic log load error:", err);
        if (!isBackground) toast.error("Failed to load diagnostic logs");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterType, filterStatus, searchQuery]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  async function handleClearLogs() {
    if (!confirm("Are you sure you want to clear all diagnostic logs?")) return;
    try {
      const res = await fetch("/api/admin/diagnostics", { method: "DELETE" });
      if (!res.ok) throw new Error("Clear failed");
      toast.success("Diagnostic logs cleared");
      setSelectedLog(null);
      fetchLogs();
    } catch {
      toast.error("Failed to clear logs");
    }
  }

  function handleExportJson() {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scraper-diagnostics-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exported to JSON");
  }

  async function handleRunTestScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!testUrl.trim()) {
      toast.error("Please enter a URL to test");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/admin/diagnostics/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: testUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Diagnostic scrape failed");
      } else {
        toast.success("Diagnostic scrape completed");
        if (data.log) {
          setSelectedLog(data.log);
          setActiveTab("trace");
        }
      }
      fetchLogs();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Test scrape failed");
    } finally {
      setTesting(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  function downloadHtmlFile(htmlContent: string, filename: string) {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Raw HTML downloaded");
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors mr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-900 text-white">
              <Terminal className="h-3 w-3 text-emerald-400" />
              Internal Admin Tool
            </span>
            <span className="text-xs text-neutral-400">• Scraper Diagnostics & Raw Payload Inspector</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1.5">
            Scraping & Contact Parsing Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Inspect raw HTTP responses, validate Schema.org microdata, and troubleshoot why address or contact fields failed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              autoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/20"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"
              )}
            />
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh"}
          </button>

          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-primary")} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-medium text-neutral-500">Total Scrapes</div>
            <div className="text-xl font-bold text-neutral-900 mt-1">{metrics.total}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Circular memory store</div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-medium text-emerald-700">Clean Success</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {metrics.total > 0 ? Math.round((metrics.successCount / metrics.total) * 100) : 0}%
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">{metrics.successCount} complete</div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Missing Address
            </div>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {metrics.total > 0 ? Math.round((metrics.missingAddressCount / metrics.total) * 100) : 0}%
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">{metrics.missingAddressCount} pages without address</div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Missing Phone
            </div>
            <div className="text-xl font-bold text-blue-900 mt-1">
              {metrics.total > 0 ? Math.round((metrics.missingPhoneCount / metrics.total) * 100) : 0}%
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">{metrics.missingPhoneCount} without tel/mobile</div>
          </div>

          <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-pink-800 flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Missing Social
            </div>
            <div className="text-xl font-bold text-pink-900 mt-1">
              {metrics.total > 0 ? Math.round((metrics.missingSocialCount / metrics.total) * 100) : 0}%
            </div>
            <div className="text-[10px] text-pink-700 mt-0.5">{metrics.missingSocialCount} without social link</div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
            <div className="text-[11px] font-medium text-neutral-500">Avg Scrape Latency</div>
            <div className="text-xl font-bold text-neutral-900 mt-1">{metrics.avgDurationMs}ms</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">HTTP fetch duration</div>
          </div>
        </div>
      )}

      {/* Live Diagnostic Test Workbench */}
      <div className="rounded-2xl border border-neutral-900/10 bg-gradient-to-b from-neutral-900 to-neutral-950 p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">
              &gt;_
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Live Diagnostic URL Scraper</h2>
              <p className="text-xs text-neutral-400">
                Execute a live crawl on any website or Google Maps URL to test address, phone, and social parsing in real time.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400/90 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Parser: Schema.org + Tel + RegEx + Google Places
          </span>
        </div>

        <form onSubmit={handleRunTestScrape} className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Enter target URL (e.g., https://example.com/contact or Google Maps URL)..."
              className="w-full h-10 rounded-xl bg-neutral-800/90 border border-neutral-700 px-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={testing || !testUrl.trim()}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Scraping & Inspecting...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Run Live Diagnostic
              </>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-neutral-400">
          <span className="text-neutral-500">Quick Test Samples:</span>
          <button
            type="button"
            onClick={() => setTestUrl("https://stripe.com/contact")}
            className="hover:text-emerald-400 underline underline-offset-2"
          >
            stripe.com/contact
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setTestUrl("https://airbnb.com")}
            className="hover:text-emerald-400 underline underline-offset-2"
          >
            airbnb.com (SPA)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setTestUrl("https://maps.google.com/?cid=98412891289128")}
            className="hover:text-emerald-400 underline underline-offset-2"
          >
            Google Maps Place
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by URL, error string, phone, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <span>Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Scrapers</option>
              <option value="website">Website Scraper</option>
              <option value="maps">Google Maps</option>
              <option value="instagram">Instagram</option>
              <option value="direct_test">Direct Test</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success (Complete)</option>
              <option value="partial_warning">Warnings (Missing Fields)</option>
              <option value="error">Errors (Failed Crawl)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Diagnostic Stream ({logs.length} entries)
          </span>
          <span className="text-[11px] text-neutral-500">Click any row to inspect raw HTML &amp; trace</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            Loading scraper diagnostic logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No diagnostic logs match your filter criteria. Run a test crawl above to generate live logs.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {logs.map((log) => {
              const hasAddress = log.parsingOutcome.addressExtracted;
              const hasPhone = log.parsingOutcome.phoneExtracted;
              const hasSocial = Boolean(
                log.parsingOutcome.socialsExtracted.instagram ||
                log.parsingOutcome.socialsExtracted.facebook
              );

              return (
                <div
                  key={log.id}
                  onClick={() => {
                    setSelectedLog(log);
                    setActiveTab("trace");
                  }}
                  className={cn(
                    "p-4 hover:bg-neutral-50/80 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3",
                    selectedLog?.id === log.id && "bg-blue-50/50 hover:bg-blue-50/70"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Status Badge */}
                    <div className="shrink-0 mt-0.5">
                      {log.status === "success" ? (
                        <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      ) : log.status === "partial_warning" ? (
                        <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                          <XCircle className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* URL and Errors */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 truncate max-w-md">
                          {log.targetUrl}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 uppercase">
                          {log.scraperType}
                        </span>
                        {log.httpStatus && (
                          <span
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0.2 rounded",
                              log.httpStatus >= 200 && log.httpStatus < 300
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            )}
                          >
                            HTTP {log.httpStatus}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="h-2.5 w-2.5" />
                          {log.durationMs}ms
                        </span>
                      </div>

                      {/* Diagnostic Breakdown Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Address Status */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                            hasAddress
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          <MapPin className="h-2.5 w-2.5" />
                          {hasAddress ? "Address: Found" : "Address: Missing"}
                        </span>

                        {/* Phone Status */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                            hasPhone
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          )}
                        >
                          <Phone className="h-2.5 w-2.5" />
                          {hasPhone ? `Phone: ${log.parsingOutcome.phoneValue}` : "Phone: Missing"}
                        </span>

                        {/* Social Status */}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
                            hasSocial
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : "bg-neutral-50 text-neutral-600 border-neutral-200"
                          )}
                        >
                          <Share2 className="h-2.5 w-2.5" />
                          {log.parsingOutcome.socialsExtracted.instagram
                            ? log.parsingOutcome.socialsExtracted.instagram
                            : hasSocial
                            ? "Social: Found"
                            : "Social: None"}
                        </span>

                        {/* Raw HTML bytes */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-600 font-mono">
                          <FileCode className="h-2.5 w-2.5" />
                          {log.rawHtmlSize ? `${(log.rawHtmlSize / 1024).toFixed(1)} KB` : "0 KB"}
                        </span>
                      </div>

                      {/* Primary Diagnostic Error Preview */}
                      {log.validationErrors.length > 0 && (
                        <div className="mt-2 text-xs text-amber-800 bg-amber-50/70 border border-amber-200/60 rounded-md p-2 flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                          <span className="font-mono text-[11px] leading-relaxed">
                            {log.validationErrors[0]}
                            {log.validationErrors.length > 1 && (
                              <span className="ml-1 text-amber-900 font-bold">
                                (+{log.validationErrors.length - 1} more diagnostics)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & Action */}
                  <div className="flex items-center md:flex-col md:items-end justify-between shrink-0 text-[11px] text-neutral-400">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="inline-flex items-center gap-1 text-primary font-medium hover:underline mt-1">
                      Inspect Trace &amp; HTML
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Inspection Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      selectedLog.status === "success"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : selectedLog.status === "partial_warning"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    )}
                  >
                    {selectedLog.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-neutral-400 uppercase font-mono">
                    {selectedLog.scraperType} • {selectedLog.durationMs}ms
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white truncate max-w-xl mt-1">
                  {selectedLog.targetUrl}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadHtmlFile(selectedLog.rawHtmlResponseSnippet, `raw-${selectedLog.id}`)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save HTML
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="h-8 w-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 px-4">
              <button
                type="button"
                onClick={() => setActiveTab("trace")}
                className={cn(
                  "py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                  activeTab === "trace"
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Validation Trace &amp; Errors ({selectedLog.validationErrors.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={cn(
                  "py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                  activeTab === "raw"
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                )}
              >
                <Code className="h-3.5 w-3.5" />
                Raw HTML Response ({selectedLog.rawHtmlSize.toLocaleString()} bytes)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("parsed")}
                className={cn(
                  "py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5",
                  activeTab === "parsed"
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                )}
              >
                <FileCode className="h-3.5 w-3.5" />
                Parsed JSON Payload
              </button>
            </div>

            {/* Tab 1: Validation Trace */}
            {activeTab === "trace" && (
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Extraction Summary Matrix */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    Extracted Contact &amp; Location Matrix
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          Physical Address
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            selectedLog.parsingOutcome.addressExtracted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {selectedLog.parsingOutcome.addressExtracted ? "EXTRACTED" : "MISSING"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-900 font-mono mt-2 bg-white p-2 rounded border border-neutral-200 break-words">
                        {selectedLog.parsingOutcome.addressValue || "No physical address found in source HTML"}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        Source Method: {selectedLog.parsingOutcome.addressSource}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                          Phone / Mobile Number
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            selectedLog.parsingOutcome.phoneExtracted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {selectedLog.parsingOutcome.phoneExtracted ? "EXTRACTED" : "MISSING"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-900 font-mono mt-2 bg-white p-2 rounded border border-neutral-200">
                        {selectedLog.parsingOutcome.phoneValue || "No phone or mobile detected"}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">
                        Source Method: {selectedLog.parsingOutcome.phoneSource}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-rose-600" />
                          Email Address
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            selectedLog.parsingOutcome.emailExtracted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-600"
                          )}
                        >
                          {selectedLog.parsingOutcome.emailExtracted ? "EXTRACTED" : "NOT LISTED"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-900 font-mono mt-2 bg-white p-2 rounded border border-neutral-200">
                        {selectedLog.parsingOutcome.emailValue || "No mailto: anchor found"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                          <Share2 className="h-3.5 w-3.5 text-purple-600" />
                          Instagram Handle
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded",
                            selectedLog.parsingOutcome.socialsExtracted.instagram
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {selectedLog.parsingOutcome.socialsExtracted.instagram ? "FOUND" : "NOT FOUND"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-900 font-mono mt-2 bg-white p-2 rounded border border-neutral-200">
                        {selectedLog.parsingOutcome.socialsExtracted.instagram || "None linked"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings / Root Causes */}
                {selectedLog.validationErrors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Parsing Diagnostic Warnings &amp; Root Causes
                    </h4>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                      {selectedLog.validationErrors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                          <span className="font-bold text-amber-600">•</span>
                          <span className="font-mono">{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step-by-Step Validation Trace */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                    Execution Trace Steps
                  </h4>
                  <div className="space-y-2">
                    {selectedLog.validationTrace.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-neutral-200 bg-white flex items-start gap-3"
                      >
                        <div className="mt-0.5">
                          {step.status === "ok" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : step.status === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          ) : step.status === "failed" ? (
                            <XCircle className="h-4 w-4 text-rose-600" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-neutral-800">{step.step}</div>
                          <div className="text-xs text-neutral-600 font-mono mt-0.5 leading-relaxed">
                            {step.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Raw HTML Response Body */}
            {activeTab === "raw" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Search / Filter within HTML */}
                <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <Search className="h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search within raw HTML response (e.g. address, tel, schema, instagram)..."
                      value={htmlSearchTerm}
                      onChange={(e) => setHtmlSearchTerm(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHtmlSearchTerm("address")}
                      className="px-2 py-1 rounded bg-neutral-200/70 hover:bg-neutral-300 text-[10px] font-mono text-neutral-700"
                    >
                      &lt;address&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlSearchTerm("tel:")}
                      className="px-2 py-1 rounded bg-neutral-200/70 hover:bg-neutral-300 text-[10px] font-mono text-neutral-700"
                    >
                      tel:
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlSearchTerm("schema.org")}
                      className="px-2 py-1 rounded bg-neutral-200/70 hover:bg-neutral-300 text-[10px] font-mono text-neutral-700"
                    >
                      schema.org
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlSearchTerm("instagram")}
                      className="px-2 py-1 rounded bg-neutral-200/70 hover:bg-neutral-300 text-[10px] font-mono text-neutral-700"
                    >
                      instagram
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(selectedLog.rawHtmlResponseSnippet, "Raw HTML payload")
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium ml-2"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Raw HTML Monospace Viewer */}
                <div className="flex-1 overflow-auto bg-neutral-950 p-4 font-mono text-xs text-neutral-300 leading-relaxed select-text">
                  <pre className="whitespace-pre-wrap break-all">
                    {htmlSearchTerm
                      ? selectedLog.rawHtmlResponseSnippet
                          .split(new RegExp(`(${htmlSearchTerm})`, "gi"))
                          .map((part, idx) =>
                            part.toLowerCase() === htmlSearchTerm.toLowerCase() ? (
                              <mark key={idx} className="bg-yellow-400 text-neutral-950 font-bold px-0.5 rounded">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )
                      : selectedLog.rawHtmlResponseSnippet || "(Empty response payload)"}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab 3: Parsed JSON */}
            {activeTab === "parsed" && (
              <div className="flex-1 overflow-auto bg-neutral-950 p-4 font-mono text-xs text-emerald-400 select-text">
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(selectedLog, null, 2), "Diagnostic JSON")
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium"
                  >
                    <Copy className="h-3 w-3" />
                    Copy JSON
                  </button>
                </div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
