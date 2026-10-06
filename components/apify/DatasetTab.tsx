"use client";

import React, { useState, useMemo } from "react";
import { ApifyDatasetItem } from "@/types/apify";
import { downloadCsvFile, downloadJsonFile, downloadTextFile } from "@/lib/apify-utils";
import {
  Search,
  Download,
  Eye,
  FileJson,
  Table as TableIcon,
  LayoutGrid,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface DatasetTabProps {
  items: ApifyDatasetItem[];
  loading: boolean;
  datasetId: string;
  onRefresh: () => void;
  onOpenTestEndpoint: (endpointId: string) => void;
}

export function DatasetTab({
  items,
  loading,
  datasetId,
  onRefresh,
  onOpenTestEndpoint,
}: DatasetTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "json">("table");
  const [filterOpenToWork, setFilterOpenToWork] = useState(false);
  const [filterPremium, setFilterPremium] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApifyDatasetItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterOpenToWork && !item.openToWork) return false;
      if (filterPremium && !item.premium) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const name = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
      const headline = (item.headline || "").toLowerCase();
      const location = (
        typeof item.location === "string"
          ? item.location
          : item.location?.linkedinText || item.location?.parsed?.text || ""
      ).toLowerCase();
      const id = (item.publicIdentifier || item.id || "").toLowerCase();

      return name.includes(q) || headline.includes(q) || location.includes(q) || id.includes(q);
    });
  }, [items, searchQuery, filterOpenToWork, filterPremium]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportNdjson = () => {
    const ndjson = filteredItems.map((item) => JSON.stringify(item)).join("\n");
    downloadTextFile(ndjson, `dataset_${datasetId}.ndjson`);
  };

  return (
    <div className="space-y-4">
      {/* Controls & Toolbar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search & Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, headline, location, or identifier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <button
            onClick={() => setFilterOpenToWork(!filterOpenToWork)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filterOpenToWork
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Open To Work
          </button>

          <button
            onClick={() => setFilterPremium(!filterPremium)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filterPremium
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Premium Only
          </button>
        </div>

        {/* Right: View Mode & Exports */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented view controls */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "cards" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "json" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Raw JSON view"
            >
              <FileJson className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => downloadCsvFile(filteredItems, `dataset_${datasetId}`)}
              disabled={filteredItems.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 disabled:opacity-40"
              title="Export filtered items to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => downloadJsonFile(filteredItems, `dataset_${datasetId}`)}
              disabled={filteredItems.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 disabled:opacity-40"
              title="Export filtered items to JSON"
            >
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportNdjson}
              disabled={filteredItems.length === 0}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 disabled:opacity-40"
              title="Export to NDJSON"
            >
              <span>NDJSON</span>
            </button>
          </div>

          {/* Test Endpoint Button matching user prompt */}
          <button
            onClick={() => onOpenTestEndpoint("get-dataset")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
          >
            Test endpoint
          </button>
        </div>
      </div>

      {/* Dataset stats bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Dataset: <strong className="font-mono text-slate-200 font-normal">{datasetId}</strong></span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Showing <strong className="font-mono text-white font-normal">{filteredItems.length}</strong> of {items.length} items</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh Dataset
        </button>
      </div>

      {/* Main Content Area */}
      {loading && items.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">Loading dataset items from Apify API...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400 p-6 text-center">
          <p className="text-sm font-medium text-slate-300">No matching items found</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search query or toggling off active filters to display items.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* High Density Table adhering to 36-44px row height */
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-medium select-none">
                  <th className="py-2.5 px-4 w-12 text-slate-500 font-mono">#</th>
                  <th className="py-2.5 px-4">Profile & Name</th>
                  <th className="py-2.5 px-4">Headline / Role</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Signals</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item, idx) => {
                  const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.publicIdentifier || "Unknown";
                  const locationText =
                    typeof item.location === "string"
                      ? item.location
                      : item.location?.linkedinText || item.location?.parsed?.text || item.location?.countryCode || "—";
                  const linkedinUrl = item.linkedinUrl || (item.publicIdentifier ? `https://www.linkedin.com/in/${item.publicIdentifier}` : null);

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-semibold text-xs shrink-0">
                            {fullName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-white block truncate">
                              {fullName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 truncate block">
                              {item.publicIdentifier || item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 max-w-md">
                        <span className="text-slate-300 line-clamp-1 text-xs">
                          {item.headline || "—"}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">
                        <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          {locationText}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {item.openToWork && (
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Open to Work
                            </span>
                          )}
                          {item.premium && (
                            <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              Premium
                            </span>
                          )}
                          {!item.openToWork && !item.premium && (
                            <span className="text-slate-500 text-[11px] font-mono">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {linkedinUrl && (
                            <a
                              href={linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Open LinkedIn Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            title="Inspect Record JSON"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => {
            const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.publicIdentifier || "Unknown";
            const locationText =
              typeof item.location === "string"
                ? item.location
                : item.location?.linkedinText || item.location?.parsed?.text || item.location?.countryCode || "—";
            const linkedinUrl = item.linkedinUrl || (item.publicIdentifier ? `https://www.linkedin.com/in/${item.publicIdentifier}` : null);

            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedItem(item)}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-colors group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm">
                        {fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {fullName}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500">
                          {item.publicIdentifier || item.id}
                        </span>
                      </div>
                    </div>
                    {linkedinUrl && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Open LinkedIn"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {item.headline || "No headline available"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {locationText}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.openToWork && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Open To Work
                      </span>
                    )}
                    {item.premium && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Raw JSON Tree View */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[600px]">
          <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(filteredItems, null, 2)}
          </pre>
        </div>
      )}

      {/* Row Inspect Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {(`${selectedItem.firstName || ""}` || "U").slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {`${selectedItem.firstName || ""} ${selectedItem.lastName || ""}`.trim() || selectedItem.publicIdentifier}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedItem.id || selectedItem.publicIdentifier}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(JSON.stringify(selectedItem, null, 2), "drawer")}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
                >
                  <span>{copiedId === "drawer" ? "Copied" : "Copy JSON"}</span>
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-slate-950 font-mono text-xs">
              <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>Field count: {Object.keys(selectedItem).length} attributes</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
