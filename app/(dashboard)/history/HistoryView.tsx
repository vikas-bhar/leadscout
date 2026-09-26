"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { History, Search, ArrowRight, Clock, X, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocalSearches, type StoredSearch } from "@/lib/local-store";

interface HistoryViewProps {
  initialSearches: StoredSearch[];
}

export function HistoryView({ initialSearches }: HistoryViewProps) {
  const [list, setList] = useState<StoredSearch[]>(initialSearches);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7d" | "30d">("all");

  useEffect(() => {
    if (initialSearches.length > 0) {
      setList(initialSearches);
    } else {
      const local = getLocalSearches();
      if (local && local.length > 0) {
        setList(local);
      }
    }
  }, [initialSearches]);

  const filteredSearches = useMemo(() => {
    return list.filter((item) => {
      // 1. Time Filter
      if (timeFilter !== "all" && item.created_at) {
        const itemTime = new Date(item.created_at).getTime();
        const now = Date.now();
        if (timeFilter === "today" && now - itemTime > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "7d" && now - itemTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === "30d" && now - itemTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // 2. Keyword Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesType = (item.business_type || "").toLowerCase().includes(q);
        const matchesLoc = (item.location || "").toLowerCase().includes(q);
        return matchesType || matchesLoc;
      }

      return true;
    });
  }, [list, timeFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Search History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review past discovery runs, targets, timeframes, and credit usage.
          </p>
        </div>
        <Link href="/search">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </Link>
      </div>

      {list.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search history by category or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 h-8 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Time Filter Select */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
            >
              <option value="all">🕒 All Time</option>
              <option value="today">🕒 Last 24 Hours</option>
              <option value="7d">🕒 Past 7 Days</option>
              <option value="30d">🕒 Past 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            {(timeFilter !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setTimeFilter("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            <span>
              Showing <strong>{filteredSearches.length}</strong> of {list.length} searches
            </span>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <Card className="border border-neutral-200/80 shadow-sm p-12 text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">No past searches yet</h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Once you run a prospect search, each run and its discovered businesses will appear here.
            </p>
          </div>
          <div>
            <Link href="/search">
              <Button size="sm" className="gap-1.5 font-medium">
                <Search className="h-3.5 w-3.5" />
                Run First Search
              </Button>
            </Link>
          </div>
        </Card>
      ) : filteredSearches.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-2">
          <div className="h-10 w-10 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">No search runs match this timeframe or query</p>
          <p className="text-xs text-neutral-500">Try changing the time filter to &quot;All Time&quot; or clearing your search term.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTimeFilter("all");
              setSearchQuery("");
            }}
            className="text-xs mt-2"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSearches.map((item) => {
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <Card
                key={item.id}
                className="border border-neutral-200/80 hover:border-neutral-300 transition-colors p-4 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-neutral-900">
                        {item.business_type} in {item.location}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {dateStr}
                      </span>
                      <span>
                        Found: <strong>{item.results_count || 10} leads</strong>
                      </span>
                      <span>
                        Credits used: <strong>{item.credits_used || 7}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <Link href="/leads">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        View Leads
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
