"use client";

import { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  Flame,
  Building2,
  CheckSquare,
  MapPin,
  AlertTriangle,
  RotateCcw,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface LeadsFilterSidebarProps {
  minScore: number;
  setMinScore: (val: number) => void;
  maxScore: number;
  setMaxScore: (val: number) => void;
  selectedIndustry: string;
  setSelectedIndustry: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  filterGap: string;
  setFilterGap: (val: string) => void;
  filterTier: "all" | "high" | "medium" | "low";
  setFilterTier: (val: "all" | "high" | "medium" | "low") => void;
  timeFilter: "all" | "today" | "7d" | "30d" | "90d" | "custom";
  setTimeFilter: (val: "all" | "today" | "7d" | "30d" | "90d" | "custom") => void;
  availableIndustries: Array<{ category: string; count: number; avgScore: number }>;
  availableLocations: Array<{ location: string; count: number; avgScore: number }>;
  statusCounts: Record<string, number>;
  totalLeadsCount: number;
  filteredCount: number;
  activeFilterCount: number;
  onResetAll: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const STATUS_ITEMS = [
  { id: "all", label: "All Statuses", color: "bg-neutral-500", badge: "All" },
  { id: "new", label: "New (Uncontacted)", color: "bg-blue-500", badge: "New" },
  { id: "contacted", label: "Contacted", color: "bg-amber-500", badge: "Outreach" },
  { id: "interested", label: "Interested / Qualified", color: "bg-emerald-500", badge: "Qualified" },
  { id: "responded", label: "Responded", color: "bg-purple-500", badge: "Replied" },
  { id: "won", label: "Closed Won", color: "bg-emerald-600", badge: "Won" },
  { id: "lost", label: "Lost", color: "bg-neutral-400", badge: "Lost" },
];

const GAP_PRESETS = [
  { id: "all", label: "All Gap Types" },
  { id: "missing_website", label: "Missing Website" },
  { id: "bad_reputation", label: "Low Rating / Neg. Reviews" },
  { id: "missing_instagram", label: "Missing Social / IG" },
  { id: "inactive_instagram", label: "Inactive Social Posts" },
  { id: "low_photos", label: "Poor Photos (<5)" },
  { id: "missing_hours", label: "Unclaimed / Incomplete Profile" },
];

export function LeadsFilterSidebar({
  minScore,
  setMinScore,
  maxScore,
  setMaxScore,
  selectedIndustry,
  setSelectedIndustry,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
  filterGap,
  setFilterGap,
  filterTier,
  setFilterTier,
  timeFilter,
  setTimeFilter,
  availableIndustries,
  availableLocations,
  statusCounts,
  totalLeadsCount,
  filteredCount,
  activeFilterCount,
  onResetAll,
  isOpenMobile = false,
  onCloseMobile,
}: LeadsFilterSidebarProps) {
  const [industrySearch, setIndustrySearch] = useState("");
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  // Section collapse states
  const [isScoreOpen, setIsScoreOpen] = useState(true);
  const [isIndustryOpen, setIsIndustryOpen] = useState(true);
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [isGapOpen, setIsGapOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  // Filter industries matching search
  const filteredIndustries = useMemo(() => {
    if (!industrySearch.trim()) return availableIndustries;
    const q = industrySearch.toLowerCase();
    return availableIndustries.filter((i) => i.category.toLowerCase().includes(q));
  }, [availableIndustries, industrySearch]);

  const displayedIndustries = showAllIndustries
    ? filteredIndustries
    : filteredIndustries.slice(0, 6);

  const displayedLocations = showAllLocations
    ? availableLocations
    : availableLocations.slice(0, 5);

  const content = (
    <div className="flex flex-col h-full bg-white rounded-xl border border-neutral-200/80 shadow-xs overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Result Count Indicator */}
      <div className="px-4 py-2 bg-neutral-100/60 border-b border-neutral-200/60 flex items-center justify-between text-xs text-neutral-600">
        <span>Showing results:</span>
        <span className="font-semibold text-neutral-900">
          {filteredCount} of {totalLeadsCount} leads
        </span>
      </div>

      {/* Scrollable Filters List */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 px-4 py-2 space-y-4 text-xs">
        {/* 1. OPPORTUNITY SCORE RANGE */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => setIsScoreOpen(!isScoreOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <span>Opportunity Score</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
              <span className="text-[11px] font-normal">
                {minScore > 0 || maxScore < 100 ? `${minScore}–${maxScore}` : "Any"}
              </span>
              {isScoreOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {isScoreOpen && (
            <div className="space-y-3 pt-1 animate-in fade-in-50 duration-150">
              {/* Presets */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMinScore(0);
                    setMaxScore(100);
                    setFilterTier("all");
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all",
                    minScore === 0 && maxScore === 100 && filterTier === "all"
                      ? "bg-neutral-900 text-white border-neutral-900 font-semibold"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  All (0–100)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinScore(75);
                    setMaxScore(100);
                    setFilterTier("high");
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all flex items-center justify-between",
                    minScore === 75 && maxScore === 100
                      ? "bg-rose-50 text-rose-800 border-rose-300 font-semibold ring-1 ring-rose-400"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  <span>🔥 High (75+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinScore(60);
                    setMaxScore(74);
                    setFilterTier("medium");
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all",
                    minScore === 60 && maxScore === 74
                      ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold ring-1 ring-amber-400"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  ⚡ Medium (60–74)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMinScore(85);
                    setMaxScore(100);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all",
                    minScore === 85 && maxScore === 100
                      ? "bg-purple-50 text-purple-800 border-purple-300 font-semibold ring-1 ring-purple-400"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  💎 Elite (85+)
                </button>
              </div>

              {/* Slider for Min Score */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium">
                  <span>Minimum Score:</span>
                  <span className="font-bold text-neutral-900">{minScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinScore(val);
                    if (val > maxScore) setMaxScore(100);
                  }}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Dual Range Min/Max Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-neutral-500 font-medium">Min</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full h-7 px-2 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 font-medium">Max</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Math.max(0, Math.min(100, Number(e.target.value) || 100)))}
                    className="w-full h-7 px-2 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. INDUSTRY / BUSINESS CATEGORY */}
        <div className="pt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setIsIndustryOpen(!isIndustryOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
          >
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Industry / Category</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
              <span className="text-[11px] font-normal truncate max-w-[90px]">
                {selectedIndustry === "all" ? "All" : selectedIndustry}
              </span>
              {isIndustryOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {isIndustryOpen && (
            <div className="space-y-2 pt-1 animate-in fade-in-50 duration-150">
              {/* Search within industries */}
              {availableIndustries.length > 5 && (
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2 top-2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search industries..."
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    className="w-full h-7 pl-6 pr-2 text-xs border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* All Industries Option */}
              <button
                type="button"
                onClick={() => setSelectedIndustry("all")}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors",
                  selectedIndustry === "all"
                    ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200"
                    : "text-neutral-700 hover:bg-neutral-50"
                )}
              >
                <span>All Industries</span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  {totalLeadsCount}
                </span>
              </button>

              {/* List of Industries */}
              <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                {displayedIndustries.map((ind) => {
                  const isSelected = selectedIndustry.toLowerCase() === ind.category.toLowerCase();
                  return (
                    <button
                      key={ind.category}
                      type="button"
                      onClick={() => setSelectedIndustry(isSelected ? "all" : ind.category)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors truncate",
                        isSelected
                          ? "bg-blue-50 text-blue-900 font-semibold border border-blue-200 shadow-2xs"
                          : "text-neutral-700 hover:bg-neutral-50"
                      )}
                      title={`${ind.category} (${ind.count} leads, avg score ${ind.avgScore})`}
                    >
                      <span className="truncate pr-2">{ind.category}</span>
                      <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                        <span className="text-neutral-400">({ind.count})</span>
                        <span className="text-neutral-500 font-medium">{ind.avgScore}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredIndustries.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllIndustries(!showAllIndustries)}
                  className="text-[11px] font-semibold text-primary hover:underline pt-0.5"
                >
                  {showAllIndustries
                    ? "Show fewer industries"
                    : `+${filteredIndustries.length - 6} more industries`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. LEAD STATUS (Contacted, Qualified / Interested, New, Responded, Won, Lost) */}
        <div className="pt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
          >
            <div className="flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>Lead Status</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
              <span className="text-[11px] font-normal capitalize">
                {selectedStatus === "all" ? "All" : selectedStatus}
              </span>
              {isStatusOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {isStatusOpen && (
            <div className="space-y-1 pt-1 animate-in fade-in-50 duration-150">
              {STATUS_ITEMS.map((item) => {
                const count = item.id === "all" ? statusCounts.all : statusCounts[item.id] || 0;
                const isSelected = selectedStatus === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStatus(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors",
                      isSelected
                        ? "bg-indigo-50 text-indigo-950 font-semibold border border-indigo-200"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", item.color)} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md",
                        isSelected
                          ? "bg-indigo-200/80 text-indigo-900 font-bold"
                          : "bg-neutral-100 text-neutral-500"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. DIGITAL GAP TYPE */}
        <div className="pt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setIsGapOpen(!isGapOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Digital Gap Type</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
              <span className="text-[11px] font-normal truncate max-w-[80px]">
                {filterGap === "all" ? "All" : filterGap.replace("_", " ")}
              </span>
              {isGapOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {isGapOpen && (
            <div className="space-y-1 pt-1 animate-in fade-in-50 duration-150">
              {GAP_PRESETS.map((gap) => {
                const isSelected = filterGap === gap.id;
                return (
                  <button
                    key={gap.id}
                    type="button"
                    onClick={() => setFilterGap(gap.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors",
                      isSelected
                        ? "bg-amber-50 text-amber-950 font-semibold border border-amber-200"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <span>{gap.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. LOCATION / TERRITORY */}
        {availableLocations.length > 0 && (
          <div className="pt-3 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Territory / City</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
                <span className="text-[11px] font-normal truncate max-w-[80px]">
                  {selectedLocation === "all" ? "All" : selectedLocation.split(",")[0]}
                </span>
                {isLocationOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            {isLocationOpen && (
              <div className="space-y-1 pt-1 animate-in fade-in-50 duration-150">
                <button
                  type="button"
                  onClick={() => setSelectedLocation("all")}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors",
                    selectedLocation === "all"
                      ? "bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200"
                      : "text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  <span>All Locations</span>
                  <span className="text-[11px] text-neutral-400">{totalLeadsCount}</span>
                </button>

                {displayedLocations.map((loc) => {
                  const isSelected = selectedLocation.toLowerCase() === loc.location.toLowerCase();
                  return (
                    <button
                      key={loc.location}
                      type="button"
                      onClick={() => setSelectedLocation(isSelected ? "all" : loc.location)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors truncate",
                        isSelected
                          ? "bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200"
                          : "text-neutral-700 hover:bg-neutral-50"
                      )}
                      title={`${loc.location} (${loc.count} leads)`}
                    >
                      <span className="truncate pr-2">{loc.location.split(",")[0]}</span>
                      <span className="text-neutral-400 text-[11px] shrink-0">({loc.count})</span>
                    </button>
                  );
                })}

                {availableLocations.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllLocations(!showAllLocations)}
                    className="text-[11px] font-semibold text-primary hover:underline pt-0.5"
                  >
                    {showAllLocations
                      ? "Show fewer locations"
                      : `+${availableLocations.length - 5} more locations`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. DATE ADDED / TIME RANGE */}
        <div className="pt-3 space-y-2.5">
          <button
            type="button"
            onClick={() => setIsTimeOpen(!isTimeOpen)}
            className="flex items-center justify-between w-full text-left font-semibold text-neutral-900 group"
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              <span>Date Added</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-600">
              <span className="text-[11px] font-normal">
                {timeFilter === "all" ? "All Time" : timeFilter}
              </span>
              {isTimeOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </button>

          {isTimeOpen && (
            <div className="grid grid-cols-2 gap-1.5 pt-1 animate-in fade-in-50 duration-150">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today (24h)" },
                { id: "7d", label: "Past 7 Days" },
                { id: "30d", label: "Past 30 Days" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeFilter(tf.id as typeof timeFilter)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-colors",
                    timeFilter === tf.id
                      ? "bg-purple-50 text-purple-900 border-purple-300 font-semibold"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Reset Button */}
      {activeFilterCount > 0 && (
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetAll}
            className="w-full text-xs font-semibold gap-1.5 border-neutral-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="w-72 shrink-0 hidden lg:block sticky top-6 self-start max-h-[calc(100vh-5rem)]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-xl z-50 p-3 overflow-hidden">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
