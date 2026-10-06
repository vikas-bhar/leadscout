"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  MapPin,
  Star,
  Globe,
  Phone,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Mail,
  Folder,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { type Lead, type LeadFolder } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getLocalLeads,
  updateLocalLead,
  getLocalFolders,
  createLocalFolder,
  assignLeadsToFolderBulk,
  deleteLocalLead,
  deleteLocalLeadsBulk,
  saveLocalLeads,
  scrubDuplicateLeads,
} from "@/lib/local-store";
import { deduplicateLeads } from "@/lib/deduplication";
import { toast } from "sonner";
import { OutreachTemplateModal } from "@/components/leads/OutreachTemplateModal";

interface LeadsViewProps {
  initialLeads: Lead[];
}

const PRESET_FOLDER_COLORS = [
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
];

export function LeadsView({ initialLeads }: LeadsViewProps) {
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [filterScoreTier, setFilterScoreTier] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score_desc" | "time_desc" | "name_asc">("score_desc");

  // Selection & Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [showBulkMoveDropdown, setShowBulkMoveDropdown] = useState(false);
  const bulkMoveRef = useRef<HTMLDivElement>(null);

  // Folders & Modal
  const [folders, setFolders] = useState<LeadFolder[]>(() => getLocalFolders());
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(PRESET_FOLDER_COLORS[0]);
  const [newFolderDesc, setNewFolderDesc] = useState("");

  // Outreach Template Modal
  const [selectedLeadForTemplate, setSelectedLeadForTemplate] = useState<Lead | null>(null);

  useEffect(() => {
    const local = getLocalLeads();
    const all = [...(local || []), ...(initialLeads || [])];
    const deduped = deduplicateLeads(all);

    if (deduped.length > 0) {
      setLeadsList(deduped);
    } else if (initialLeads.length > 0) {
      setLeadsList(deduplicateLeads(initialLeads));
    }
  }, [initialLeads]);

  // Click outside to close bulk move menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bulkMoveRef.current && !bulkMoveRef.current.contains(e.target as Node)) {
        setShowBulkMoveDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalized list handling DB variations
  const normalizedLeads: Lead[] = useMemo(() => {
    const mapped = leadsList.map((itemRaw) => {
      const item = itemRaw as unknown as Record<string, unknown>;
      const oppScore = Number(item.opportunityScore ?? item.opportunity_score ?? 70);
      const rawId = (item.id ?? item._id) as string;

      return {
        ...itemRaw,
        id: rawId,
        businessName: (item.businessName ?? item.business_name ?? "Unnamed Business") as string,
        businessCategory: (item.businessCategory ?? item.business_category ?? "Local Business") as string,
        location: (item.location ?? "") as string,
        googleRating: Number(item.googleRating ?? item.google_rating ?? 4.5),
        reviewCount: Number(item.reviewCount ?? item.review_count ?? 12),
        opportunityScore: isNaN(oppScore) ? 70 : oppScore,
        urgencyLevel: (item.urgencyLevel ?? item.urgency_level ?? "medium") as Lead["urgencyLevel"],
        status: (item.status ?? "new") as Lead["status"],
        hasWebsite: Boolean(item.hasWebsite ?? item.has_website),
        websiteUrl: (item.websiteUrl ?? item.website_url ?? null) as string | null,
        phone: (item.phone ?? null) as string | null,
        mapsUrl: (item.mapsUrl ?? item.maps_url ?? null) as string | null,
        folderId: (item.folderId ?? item.folder_id ?? null) as string | null,
        folderName: (item.folderName ?? item.folder_name ?? null) as string | null,
        bestService: (item.bestService ?? item.best_service ?? "Digital Optimization") as string,
        gapsFound: Array.isArray(item.gapsFound ?? item.gaps_found)
          ? (item.gapsFound ?? item.gaps_found)
          : [],
        createdAt: (item.createdAt ?? item.created_at ?? new Date().toISOString()) as string,
      } as Lead;
    });

    return deduplicateLeads(mapped);
  }, [leadsList]);

  // Territory locations for quick folder-like filtering
  const locationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    normalizedLeads.forEach((l) => {
      if (!l.location) return;
      const primaryCity = l.location.split(",")[0]?.trim();
      if (primaryCity) {
        counts.set(primaryCity, (counts.get(primaryCity) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [normalizedLeads]);

  // Lead status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: normalizedLeads.length,
      new: 0,
      contacted: 0,
      interested: 0,
      won: 0,
    };
    normalizedLeads.forEach((l) => {
      const st = l.status || "new";
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });
    return counts;
  }, [normalizedLeads]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    return normalizedLeads
      .filter((lead) => {
        // Status filter
        if (selectedStatus !== "all" && lead.status !== selectedStatus) {
          return false;
        }

        // Score Tier filter
        if (filterScoreTier === "high" && lead.opportunityScore < 75) return false;
        if (
          filterScoreTier === "medium" &&
          (lead.opportunityScore < 60 || lead.opportunityScore >= 75)
        )
          return false;
        if (filterScoreTier === "low" && lead.opportunityScore >= 60) return false;

        // Folder filter
        if (selectedFolder !== "all") {
          if (selectedFolder.startsWith("loc:")) {
            const locQuery = selectedFolder.replace("loc:", "").toLowerCase();
            if (!lead.location.toLowerCase().includes(locQuery)) return false;
          } else if (lead.folderId !== selectedFolder) {
            return false;
          }
        }

        // Text search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = lead.businessName.toLowerCase().includes(q);
          const matchLoc = lead.location.toLowerCase().includes(q);
          const matchCat = lead.businessCategory.toLowerCase().includes(q);
          const matchGap = (lead.gapsFound || []).some(
            (g) =>
              g.category.toLowerCase().includes(q) ||
              g.problem.toLowerCase().includes(q)
          );
          if (!matchName && !matchLoc && !matchCat && !matchGap) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score_desc") return b.opportunityScore - a.opportunityScore;
        if (sortBy === "time_desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "name_asc") return a.businessName.localeCompare(b.businessName);
        return 0;
      });
  }, [normalizedLeads, selectedStatus, filterScoreTier, selectedFolder, searchQuery, sortBy]);

  const hasActiveFilters =
    selectedStatus !== "all" ||
    filterScoreTier !== "all" ||
    selectedFolder !== "all" ||
    Boolean(searchQuery.trim());

  function resetFilters() {
    setSelectedStatus("all");
    setFilterScoreTier("all");
    setSelectedFolder("all");
    setSearchQuery("");
    setSortBy("score_desc");
  }

  // Update lead status
  async function handleUpdateLeadStatus(leadId: string, newStatus: Lead["status"]) {
    setLeadsList((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    updateLocalLead(leadId, { status: newStatus });

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local store handles fallback
    }
    toast.success(`Status updated to "${newStatus}"`);
  }

  // Delete lead
  function handleDeleteLead(leadId: string, leadName: string) {
    const toDelete = normalizedLeads.find((l) => l.id === leadId);
    if (!toDelete) return;

    setLeadsList((prev) => prev.filter((l) => l.id !== leadId));
    deleteLocalLead(leadId);
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });

    toast(`Deleted "${leadName}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          setLeadsList((prev) => [toDelete, ...prev]);
          const current = getLocalLeads();
          saveLocalLeads([toDelete, ...current]);
          toast.success(`Restored "${leadName}"`);
        },
      },
    });
  }

  // Bulk deletion
  function handleBulkDelete() {
    if (selectedLeadIds.size === 0) return;
    const count = selectedLeadIds.size;
    const ids = Array.from(selectedLeadIds);
    const backup = normalizedLeads.filter((l) => selectedLeadIds.has(l.id));

    setLeadsList((prev) => prev.filter((l) => !selectedLeadIds.has(l.id)));
    deleteLocalLeadsBulk(ids);
    setSelectedLeadIds(new Set());

    toast.success(`Deleted ${count} leads`, {
      action: {
        label: "Undo",
        onClick: () => {
          setLeadsList((prev) => [...backup, ...prev]);
          const current = getLocalLeads();
          saveLocalLeads([...backup, ...current]);
          toast.success(`Restored ${count} leads`);
        },
      },
    });
  }

  // Bulk move
  function handleBulkMove(folderId: string | null) {
    if (selectedLeadIds.size === 0) return;
    const ids = Array.from(selectedLeadIds);
    assignLeadsToFolderBulk(ids, folderId);
    const folderObj = folderId ? folders.find((f) => f.id === folderId) : null;

    setLeadsList((prev) =>
      prev.map((l) =>
        selectedLeadIds.has(l.id)
          ? {
              ...l,
              folderId: folderId || null,
              folderName: folderObj ? folderObj.name : null,
            }
          : l
      )
    );
    setShowBulkMoveDropdown(false);
    setSelectedLeadIds(new Set());
    toast.success(
      `Moved ${ids.length} leads to ${folderObj ? `"${folderObj.name}"` : "All Leads"}`
    );
  }

  // Toggle selection
  function toggleSelectLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }

  // Clean duplicates action
  function handleCleanDuplicates() {
    const result = scrubDuplicateLeads();
    const updated = getLocalLeads();
    setLeadsList(deduplicateLeads(updated));
    if (result.duplicatesRemoved > 0) {
      toast.success(
        `Deduplicated leads: removed ${result.duplicatesRemoved} duplicates. Total clean: ${result.cleanCount}.`
      );
    } else {
      toast.success(`All ${result.cleanCount} discovered leads are unique.`);
    }
  }

  // Create folder
  function handleCreateFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const folder = createLocalFolder(
      newFolderName.trim(),
      newFolderColor,
      newFolderDesc.trim()
    );
    setFolders(getLocalFolders());
    setSelectedFolder(folder.id);
    setIsFolderModalOpen(false);
    setNewFolderName("");
    setNewFolderDesc("");
    toast.success(`Created folder "${folder.name}"`);
  }

  if (normalizedLeads.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="h-12 w-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
            No leads discovered yet
          </h2>
          <p className="text-sm text-neutral-500">
            Search Google Maps and Instagram to uncover businesses with digital gaps and pitch opportunities.
          </p>
        </div>
        <div>
          <Link href="/search">
            <Button className="font-medium gap-2">
              <Search className="h-4 w-4" />
              <span>Search for Prospects</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Review prospects, spot digital gaps, and initiate personalized outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanDuplicates}
            className="h-9 gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border-neutral-200"
            title="Scan and remove duplicate leads"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Deduplicate</span>
          </Button>
          <Link href="/search">
            <Button size="sm" className="h-9 gap-1.5 text-xs font-medium">
              <Search className="h-3.5 w-3.5" />
              <span>Find New Leads</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Segmented Status Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "all", label: "All Leads", count: statusCounts.all },
            { id: "new", label: "New", count: statusCounts.new },
            { id: "contacted", label: "Contacted", count: statusCounts.contacted },
            { id: "interested", label: "Interested", count: statusCounts.interested },
            { id: "won", label: "Won", count: statusCounts.won },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[11px] font-mono tabular-nums",
                    isActive ? "text-neutral-300" : "text-neutral-400"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quiet summary counters */}
        <div className="hidden md:flex items-center gap-3 text-xs text-neutral-500">
          <span>
            High Opportunity:{" "}
            <strong className="text-neutral-800 font-mono tabular-nums">
              {normalizedLeads.filter((l) => l.opportunityScore >= 75).length}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total:{" "}
            <strong className="text-neutral-800 font-mono tabular-nums">
              {normalizedLeads.length}
            </strong>
          </span>
        </div>
      </div>

      {/* Unified, Clean Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search leads by name, city, or gap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-9 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Folder Filter */}
          <select
            value={selectedFolder}
            onChange={(e) => {
              if (e.target.value === "__create__") {
                setIsFolderModalOpen(true);
              } else {
                setSelectedFolder(e.target.value);
              }
            }}
            className="h-9 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
          >
            <option value="all">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
            {locationOptions.length > 0 && (
              <optgroup label="Locations">
                {locationOptions.map((loc) => (
                  <option key={loc.name} value={`loc:${loc.name}`}>
                    {loc.name} ({loc.count})
                  </option>
                ))}
              </optgroup>
            )}
            <option value="__create__">+ New Folder...</option>
          </select>

          {/* Opportunity Score Tier */}
          <select
            value={filterScoreTier}
            onChange={(e) => setFilterScoreTier(e.target.value as typeof filterScoreTier)}
            className="h-9 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
          >
            <option value="all">All Scores</option>
            <option value="high">High Opportunity (75+)</option>
            <option value="medium">Medium (60–74)</option>
            <option value="low">Low (&lt;60)</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
          >
            <option value="score_desc">Score: High to Low</option>
            <option value="time_desc">Newest Added</option>
            <option value="name_asc">Business Name A–Z</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors ml-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Select All Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-neutral-500">
          <button
            type="button"
            onClick={toggleSelectAll}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors select-none",
              selectedLeadIds.size > 0
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
            )}
          >
            <Check className={cn("h-3 w-3", selectedLeadIds.size > 0 ? "opacity-100" : "opacity-0")} />
            <span>
              {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0
                ? "Deselect All"
                : `Select All (${filteredLeads.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200 space-y-3">
          <p className="text-sm font-medium text-neutral-900">No matching leads found</p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search keywords, score filter, or status tab.
          </p>
          <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs font-medium gap-1.5 mt-2">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLeads.map((lead) => {
            const isSelected = selectedLeadIds.has(lead.id);
            const mainGap = lead.gapsFound?.[0];

            return (
              <div
                key={lead.id}
                className={cn(
                  "group rounded-xl border bg-white p-4 transition-all duration-150",
                  isSelected
                    ? "border-neutral-900/30 bg-neutral-50/50 ring-1 ring-neutral-900/10"
                    : "border-neutral-200 hover:border-neutral-300 hover:shadow-xs"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Column: Checkbox, Score, Name & Clean Metadata */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectLead(lead.id)}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 mt-1 sm:mt-0",
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 hover:border-neutral-400 bg-white"
                      )}
                      title={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                    </button>

                    {/* Opportunity Score (Compact & Clean Tabular) */}
                    <div
                      className={cn(
                        "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-xs font-semibold font-mono tabular-nums border",
                        lead.opportunityScore >= 75
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : lead.opportunityScore >= 60
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-neutral-50 text-neutral-600 border-neutral-200"
                      )}
                      title={`Opportunity Score: ${lead.opportunityScore}/100`}
                    >
                      {lead.opportunityScore}
                    </div>

                    {/* Name, Category, Location, Rating */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-neutral-700 transition-colors truncate"
                        >
                          {lead.businessName}
                        </Link>

                        {/* Unboxed inline metadata with typographic separators */}
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span>{lead.businessCategory}</span>
                          {lead.location && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[180px]">{lead.location}</span>
                            </>
                          )}
                          {lead.googleRating ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-0.5 text-neutral-700 font-medium">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                                <span className="font-mono tabular-nums">{lead.googleRating}</span>
                                {lead.reviewCount ? (
                                  <span className="text-neutral-400 font-normal">
                                    ({lead.reviewCount})
                                  </span>
                                ) : null}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Primary Identified Gap in a clear, high-signal line */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                        <span className="font-medium text-neutral-800">
                          {mainGap?.category || "Opportunity"}:
                        </span>
                        <span className="text-neutral-500 truncate">
                          {mainGap?.problem || lead.bestService || "Digital presence gap"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Select, Quick Links & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
                    {/* Status Dropdown */}
                    <select
                      value={lead.status || "new"}
                      onChange={(e) =>
                        handleUpdateLeadStatus(lead.id, e.target.value as Lead["status"])
                      }
                      className="h-8 px-2 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="responded">Responded</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>

                    {/* Quick Link Icons */}
                    <div className="flex items-center">
                      {lead.websiteUrl && (
                        <a
                          href={
                            lead.websiteUrl.startsWith("http")
                              ? lead.websiteUrl
                              : `https://${lead.websiteUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                          title="Open Website"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                          title={`Call ${lead.phone}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <a
                        href={
                          lead.mapsUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${lead.businessName} ${lead.location}`
                          )}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                        title="View on Google Maps"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Outreach Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLeadForTemplate(lead)}
                      className="h-8 text-xs font-medium gap-1 text-neutral-700 hover:text-neutral-900 border-neutral-200"
                    >
                      <Mail className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Outreach</span>
                    </Button>

                    {/* View Lead Button */}
                    <Link href={`/leads/${lead.id}`}>
                      <Button size="sm" variant="default" className="h-8 text-xs font-medium gap-1">
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>

                    {/* Delete Lead */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead.id, lead.businessName)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete lead"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar (when leads are checked) */}
      {selectedLeadIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-neutral-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <span className="text-xs font-medium pr-2 border-r border-neutral-700">
            {selectedLeadIds.size} selected
          </span>

          {/* Move to Folder */}
          <div className="relative" ref={bulkMoveRef}>
            <button
              type="button"
              onClick={() => setShowBulkMoveDropdown(!showBulkMoveDropdown)}
              className="h-7 px-2.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Folder className="h-3 w-3" />
              <span>Move to Folder</span>
            </button>

            {showBulkMoveDropdown && (
              <div className="absolute left-0 bottom-full mb-2 w-48 p-1 rounded-lg bg-white text-neutral-900 shadow-xl border border-neutral-200 text-xs space-y-0.5 z-50">
                <button
                  type="button"
                  onClick={() => handleBulkMove(null)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-100 text-neutral-600"
                >
                  None (Remove from folder)
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleBulkMove(f.id)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-100 flex items-center gap-2"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: f.color }}
                    />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Selected */}
          <button
            type="button"
            onClick={handleBulkDelete}
            className="h-7 px-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>

          {/* Deselect */}
          <button
            type="button"
            onClick={() => setSelectedLeadIds(new Set())}
            className="text-neutral-400 hover:text-white text-xs transition-colors ml-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Outreach Template Modal */}
      {selectedLeadForTemplate && (
        <OutreachTemplateModal
          isOpen={Boolean(selectedLeadForTemplate)}
          onClose={() => setSelectedLeadForTemplate(null)}
          lead={selectedLeadForTemplate}
          defaultChannel="email"
        />
      )}

      {/* Create Folder Modal */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Create New Folder
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFolderSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium text-neutral-700">Folder Name</Label>
              <Input
                required
                placeholder="e.g. High Priority Outreach"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-neutral-700">Description (Optional)</Label>
              <Input
                placeholder="Targeting specific industry or angle"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-neutral-700">Color Tag</Label>
              <div className="flex items-center gap-2 mt-1.5">
                {PRESET_FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-transform",
                      newFolderColor === c
                        ? "scale-110 ring-2 ring-offset-1 ring-neutral-900"
                        : "opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFolderModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Create Folder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
