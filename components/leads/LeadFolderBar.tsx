"use client";

import { useState } from "react";
import {
  Folder,
  FolderPlus,
  MapPin,
  Trash2,
} from "lucide-react";
import { type LeadFolder } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationGroup {
  name: string;
  count: number;
  avgScore: number;
}

interface LeadFolderBarProps {
  folders: LeadFolder[];
  locationGroups: LocationGroup[];
  selectedFolder: string; // "all" | "loc:City" | "folder_id"
  totalLeadsCount: number;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color: string, description: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

const PRESET_COLORS = [
  "#f43f5e", // Rose
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#ec4899", // Pink
];

export function LeadFolderBar({
  folders,
  locationGroups,
  selectedFolder,
  totalLeadsCount,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: LeadFolderBarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(PRESET_COLORS[0]);
  const [newFolderDesc, setNewFolderDesc] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor, newFolderDesc.trim());
    setNewFolderName("");
    setNewFolderDesc("");
    setIsCreating(false);
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 shadow-xs p-3.5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-neutral-900 tracking-tight">Lead Organization & Folders</span>
          <span className="text-[11px] text-neutral-400 font-medium">
            (Browse by Location Territory or Custom Outreach Folders)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="h-7 text-xs font-semibold gap-1.5 shrink-0"
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary" />
            New Folder
          </Button>
        </div>
      </div>

      {/* New Folder Inline Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-3 animate-in fade-in-50 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-800">Create Custom Folder</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-neutral-400 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">Folder Name</Label>
              <Input
                required
                placeholder="e.g. Q4 Real Estate Outreach"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-8 text-xs bg-white mt-0.5"
              />
            </div>

            <div className="sm:col-span-1">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">Description (Optional)</Label>
              <Input
                placeholder="Targeting high-ticket brokers"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                className="h-8 text-xs bg-white mt-0.5"
              />
            </div>

            <div className="sm:col-span-1">
              <Label className="text-[10px] uppercase font-semibold text-neutral-500">Color Tag</Label>
              <div className="flex items-center gap-1.5 mt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full border transition-transform",
                      newFolderColor === c ? "scale-110 ring-2 ring-offset-1 ring-primary" : "opacity-75 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" size="sm" className="h-7 text-xs font-semibold">
              Save Folder
            </Button>
          </div>
        </form>
      )}

      {/* Main Folders Scrollable Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
        {/* All Leads Tab */}
        <button
          type="button"
          onClick={() => onSelectFolder("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-2 shrink-0",
            selectedFolder === "all"
              ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs"
              : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
          )}
        >
          <Folder className="h-3.5 w-3.5" />
          <span>All Leads</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              selectedFolder === "all" ? "bg-neutral-700 text-white" : "bg-neutral-100 text-neutral-600"
            )}
          >
            {totalLeadsCount}
          </span>
        </button>

        <div className="h-5 w-px bg-neutral-200 shrink-0" />

        {/* Location-Wise Auto Folders */}
        {locationGroups.slice(0, 5).map((loc) => {
          const locKey = `loc:${loc.name}`;
          const isSelected = selectedFolder === locKey;
          return (
            <button
              key={locKey}
              type="button"
              onClick={() => onSelectFolder(isSelected ? "all" : locKey)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0 max-w-[170px]",
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                  : "bg-white text-neutral-700 hover:bg-emerald-50/50 hover:border-emerald-200 border-neutral-200"
              )}
              title={`${loc.name} (${loc.count} leads • avg score ${loc.avgScore})`}
            >
              <MapPin className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-white" : "text-emerald-600")} />
              <span className="truncate">{loc.name}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] shrink-0",
                  isSelected ? "bg-emerald-700 text-white font-bold" : "bg-emerald-50 text-emerald-700 font-semibold"
                )}
              >
                {loc.count}
              </span>
            </button>
          );
        })}

        {locationGroups.length > 5 && (
          <span className="text-[10px] text-neutral-400 font-medium shrink-0">
            +{locationGroups.length - 5} more areas
          </span>
        )}

        <div className="h-5 w-px bg-neutral-200 shrink-0" />

        {/* Custom User Folders */}
        {folders.map((folder) => {
          const isSelected = selectedFolder === folder.id;
          return (
            <div key={folder.id} className="relative group shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => onSelectFolder(isSelected ? "all" : folder.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0",
                  isSelected
                    ? "bg-primary/10 text-primary border-primary font-bold shadow-xs ring-1 ring-primary/30"
                    : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-200"
                )}
                title={folder.description || folder.name}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color || "#6366f1" }}
                />
                <span className="truncate max-w-[130px]">{folder.name}</span>
              </button>

              {/* Quick Delete Folder for non-default folders */}
              {!folder.id.startsWith("folder_hot") &&
                !folder.id.startsWith("folder_follow") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete folder "${folder.name}"? Leads will remain in All Leads.`)) {
                        onDeleteFolder(folder.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 transition-opacity ml-0.5"
                    title="Delete Folder"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
