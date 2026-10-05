"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { TrendingUp, BarChart2, AreaChart as AreaChartIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getLocalLeads } from "@/lib/local-store";
import { deduplicateLeads } from "@/lib/deduplication";
import type { Lead } from "@/types";
import { cn } from "@/lib/utils";

interface DayData {
  dateKey: string; // YYYY-MM-DD
  dayName: string; // "Mon", "Tue", etc.
  fullDateLabel: string; // "Oct 3, 2026"
  totalLeads: number;
  highOppLeads: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const rawData = (payload[0] as unknown as { payload: DayData }).payload;

    return (
      <div className="bg-neutral-900 text-white p-3 rounded-lg shadow-xl border border-neutral-800 text-xs space-y-1.5 min-w-[150px] animate-in fade-in-50 duration-150">
        <div className="flex items-center justify-between text-neutral-400 font-semibold border-b border-neutral-800 pb-1">
          <span>{rawData.fullDateLabel}</span>
          <span>{rawData.dayName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-300 font-medium">Total Leads:</span>
          <span className="font-bold text-white">{rawData.totalLeads}</span>
        </div>
        <div className="flex items-center justify-between text-rose-400">
          <span className="font-medium">High Opp (75+):</span>
          <span className="font-bold">{rawData.highOppLeads}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function LeadsChart() {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [fetchedLeads, setFetchedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLeads() {
      try {
        const local = getLocalLeads();
        let apiLeads: Lead[] = [];

        try {
          const res = await fetch("/api/leads");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.leads)) {
              apiLeads = data.leads;
            }
          }
        } catch {
          // Fallback to local store
        }

        if (!isMounted) return;

        // Combine local and API leads with robust multi-key deduplication
        const allLeads = [...(local || []), ...(apiLeads || [])];
        setFetchedLeads(deduplicateLeads(allLeads));
      } catch (err) {
        console.log("Error loading leads for chart:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLeads();

    function handleStoreUpdate() {
      loadLeads();
    }

    window.addEventListener("freelancefind_store_updated", handleStoreUpdate);
    window.addEventListener("storage", handleStoreUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("freelancefind_store_updated", handleStoreUpdate);
      window.removeEventListener("storage", handleStoreUpdate);
    };
  }, []);

  // Compute 7-day rolling window data
  const chartData: DayData[] = useMemo(() => {
    const days: DayData[] = [];
    const now = new Date();

    // Generate last 7 days array [6 days ago ... today]
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dateNum = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${dateNum}`;

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDateLabel = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      days.push({
        dateKey,
        dayName,
        fullDateLabel,
        totalLeads: 0,
        highOppLeads: 0,
      });
    }

    // Map fetched leads into daily buckets
    fetchedLeads.forEach((lead) => {
      if (!lead) return;
      const rawDate = lead.createdAt || (lead as unknown as { created_at?: string }).created_at;
      if (!rawDate) return;

      const leadDate = new Date(rawDate);
      if (isNaN(leadDate.getTime())) return;

      const year = leadDate.getFullYear();
      const month = String(leadDate.getMonth() + 1).padStart(2, "0");
      const dateNum = String(leadDate.getDate()).padStart(2, "0");
      const leadDateKey = `${year}-${month}-${dateNum}`;

      const matchedDay = days.find((d) => d.dateKey === leadDateKey);
      if (matchedDay) {
        matchedDay.totalLeads += 1;
        if ((lead.opportunityScore ?? (lead as unknown as { opportunity_score?: number }).opportunity_score ?? 0) >= 75) {
          matchedDay.highOppLeads += 1;
        }
      }
    });

    // If total leads across all 7 days is 0 (brand new account), generate a clean sample curve to illustrate chart functionality
    const totalFoundInWindow = days.reduce((acc, d) => acc + d.totalLeads, 0);
    if (totalFoundInWindow === 0 && fetchedLeads.length === 0) {
      // Sample trend curve for new accounts
      const sampleCounts = [4, 8, 6, 12, 15, 9, 14];
      const sampleHighOpp = [1, 3, 2, 5, 7, 3, 6];
      days.forEach((day, idx) => {
        day.totalLeads = sampleCounts[idx % sampleCounts.length];
        day.highOppLeads = sampleHighOpp[idx % sampleHighOpp.length];
      });
    }

    return days;
  }, [fetchedLeads]);

  // Derived metrics
  const weekTotalLeads = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.totalLeads, 0);
  }, [chartData]);

  const weekHighOppLeads = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.highOppLeads, 0);
  }, [chartData]);

  const dailyAverage = useMemo(() => {
    return Math.round((weekTotalLeads / 7) * 10) / 10;
  }, [weekTotalLeads]);

  const peakDay = useMemo(() => {
    if (chartData.length === 0) return { dayName: "None", count: 0 };
    return chartData.reduce(
      (max, d) => (d.totalLeads > max.count ? { dayName: d.dayName, count: d.totalLeads } : max),
      { dayName: chartData[0].dayName, count: chartData[0].totalLeads }
    );
  }, [chartData]);

  return (
    <Card className="p-6 space-y-5 bg-white border border-neutral-200/90 shadow-2xs rounded-xl">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Leads Found Per Day (Last Week)
            </h2>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Rolling 7-day breakdown of prospect discovery velocity and high-converting opportunities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart Type Toggle */}
          <div className="inline-flex items-center p-1 rounded-lg bg-neutral-100 border border-neutral-200/80">
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                chartType === "area"
                  ? "bg-white text-neutral-900 shadow-2xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <AreaChartIcon className="h-3.5 w-3.5" />
              <span>Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                chartType === "bar"
                  ? "bg-white text-neutral-900 shadow-2xs font-bold"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 p-3 rounded-lg border border-neutral-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">7-Day Discovery</span>
          <p className="text-lg font-bold text-neutral-900 flex items-baseline gap-1 mt-0.5">
            {weekTotalLeads}
            <span className="text-[10px] font-normal text-neutral-500">leads</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Daily Avg</span>
          <p className="text-lg font-bold text-neutral-900 flex items-baseline gap-1 mt-0.5">
            {dailyAverage}
            <span className="text-[10px] font-normal text-neutral-500">/ day</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">High Opp (75+)</span>
          <p className="text-lg font-bold text-rose-600 flex items-baseline gap-1 mt-0.5">
            {weekHighOppLeads}
            <span className="text-[10px] font-normal text-rose-500">
              ({weekTotalLeads > 0 ? Math.round((weekHighOppLeads / weekTotalLeads) * 100) : 0}%)
            </span>
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Peak Day</span>
          <p className="text-lg font-bold text-neutral-900 flex items-baseline gap-1 mt-0.5">
            {peakDay.dayName}
            <span className="text-[10px] font-normal text-neutral-500">({peakDay.count})</span>
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="h-64 w-full pt-2">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-neutral-400 gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Calculating discovery trends...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorHighOpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="dayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalLeads"
                  name="Total Leads"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  activeDot={{ r: 6, stroke: "#1d4ed8", strokeWidth: 2, fill: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="highOppLeads"
                  name="High Opportunity"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHighOpp)"
                  activeDot={{ r: 5, stroke: "#be123c", strokeWidth: 2, fill: "#ffffff" }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="dayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalLeads" name="Total Leads" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.totalLeads > 10 ? "#1d4ed8" : "#3b82f6"} />
                  ))}
                </Bar>
                <Bar dataKey="highOppLeads" name="High Opportunity" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend & Footer note */}
      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span className="font-medium text-neutral-700">Total Leads Found</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-medium text-rose-700">High Opportunity (75+)</span>
          </div>
        </div>
        <span className="text-[11px] text-neutral-400">
          Updated in real-time as discovery runs complete
        </span>
      </div>
    </Card>
  );
}
