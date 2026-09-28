"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Plus,
  Sparkles,
  Copy,
  Trash2,
  Edit2,
  Star,
  Layers,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import { PromptEditor } from "@/components/prompts/PromptEditor";
import { FilterEditor } from "@/components/filters/FilterEditor";
import type { CustomPromptConfig, CustomFilterConfig } from "@/lib/customization/promptBuilder";
import { DEFAULT_PROMPT_TEMPLATES } from "@/lib/customization/defaultTemplates";
import {
  getLocalPrompts,
  saveLocalPrompt,
  deleteLocalPrompt,
  getLocalFilters,
  saveLocalFilter,
  deleteLocalFilter,
} from "@/lib/local-store";

const TEMPLATE_ICONS: Record<string, string> = {
  social_media_manager: "📱",
  web_designer: "💻",
  video_editor: "🎬",
  copywriter: "✍️",
  seo_specialist: "🔍",
  graphic_designer: "🎨",
};

export function PromptsClient() {
  const [activeTab, setActiveTab] = useState<"prompts" | "templates" | "filters">("prompts");

  const [prompts, setPrompts] = useState<CustomPromptConfig[]>([]);
  const [filters, setFilters] = useState<CustomFilterConfig[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<CustomPromptConfig | null>(null);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CustomFilterConfig | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const resPrompts = await fetch("/api/prompts");
      if (resPrompts.ok) {
        const data = await resPrompts.json();
        if (data.prompts && data.prompts.length > 0) {
          setPrompts(data.prompts);
        } else {
          setPrompts(getLocalPrompts());
        }
      } else {
        setPrompts(getLocalPrompts());
      }
    } catch {
      setPrompts(getLocalPrompts());
    }

    try {
      const resFilters = await fetch("/api/filters");
      if (resFilters.ok) {
        const data = await resFilters.json();
        if (data.filters && data.filters.length > 0) {
          setFilters(data.filters);
        } else {
          setFilters(getLocalFilters());
        }
      } else {
        setFilters(getLocalFilters());
      }
    } catch {
      setFilters(getLocalFilters());
    }
  }

  // ── Prompt Handlers ──
  async function handleSavePrompt(prompt: CustomPromptConfig) {
    saveLocalPrompt(prompt);
    setPrompts(getLocalPrompts());

    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      });
    } catch {
      // Offline fallback already updated
    }
  }

  async function handleDeletePrompt(id: string) {
    deleteLocalPrompt(id);
    setPrompts(getLocalPrompts());
    toast.success("Prompt deleted.");

    try {
      await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
    } catch {
      // Offline handled
    }
  }

  function handleDuplicatePrompt(p: CustomPromptConfig) {
    const duplicated: CustomPromptConfig = {
      ...p,
      id: `prompt_${Date.now()}`,
      name: `${p.name} (Copy)`,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleSavePrompt(duplicated);
    toast.success(`Duplicated "${p.name}"`);
  }

  function handleSetDefaultPrompt(p: CustomPromptConfig) {
    const updated = { ...p, isDefault: true };
    handleSavePrompt(updated);
    toast.success(`"${p.name}" is now your default prompt.`);
  }

  function handleUseTemplate(template: CustomPromptConfig) {
    const customized: CustomPromptConfig = {
      ...template,
      id: `prompt_${Date.now()}`,
      name: `My ${template.name}`,
      isDefault: false,
      usageCount: 0,
    };
    setEditingPrompt(customized);
    setPromptModalOpen(true);
  }

  // ── Filter Handlers ──
  async function handleSaveFilter(filter: CustomFilterConfig) {
    saveLocalFilter(filter);
    setFilters(getLocalFilters());

    try {
      await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filter),
      });
    } catch {
      // Fallback updated
    }
  }

  async function handleDeleteFilter(id: string) {
    deleteLocalFilter(id);
    setFilters(getLocalFilters());
    toast.success("Filter deleted.");

    try {
      await fetch(`/api/filters?id=${id}`, { method: "DELETE" });
    } catch {
      // Offline handled
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Custom Prompts & Filters
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              Growth Plan Feature
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Define exactly how AI analyzes businesses, spots high-converting digital gaps, and writes your outreach pitches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "filters" ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingFilter(null);
                setFilterModalOpen(true);
              }}
              className="text-xs gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Filter</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setEditingPrompt(null);
                setPromptModalOpen(true);
              }}
              className="text-xs gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Prompt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 space-x-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "prompts"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>My Prompts ({prompts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "templates"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Template Library ({DEFAULT_PROMPT_TEMPLATES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filters")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "filters"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters ({filters.length})</span>
        </button>
      </div>

      {/* TAB 1: MY PROMPTS */}
      {activeTab === "prompts" && (
        <UpgradeGate feature="Custom Prompts" requiredPlan="growth" featureKey="customPrompts">
          <div className="space-y-4">
            {prompts.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-neutral-200 bg-neutral-50/50 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto text-2xl">
                  🤖
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900">No custom prompts yet</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Create your first prompt or clone a template to customize how AI analyzes and pitches your leads.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingPrompt(null);
                    setPromptModalOpen(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Prompt</span>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map((p) => {
                  const icon = TEMPLATE_ICONS[p.freelancerType || ""] || "🤖";
                  return (
                    <Card
                      key={p.id}
                      className="p-5 border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-neutral-900">{p.name}</h3>
                                {p.isDefault && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-400 capitalize">
                                {p.freelancerType?.replace(/_/g, " ") || "All specialties"}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-neutral-400 font-mono">
                            Used {p.usageCount || 0}x
                          </div>
                        </div>

                        {p.description && (
                          <p className="text-xs text-neutral-600 line-clamp-2">{p.description}</p>
                        )}

                        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 font-mono text-[11px] text-neutral-500 line-clamp-2">
                          {p.systemPrompt}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPrompt(p);
                              setPromptModalOpen(true);
                            }}
                            className="h-7 text-xs gap-1 px-2"
                          >
                            <Edit2 className="w-3 h-3 text-neutral-500" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicatePrompt(p)}
                            className="h-7 text-xs gap-1 px-2"
                          >
                            <Copy className="w-3 h-3 text-neutral-500" />
                            <span>Copy</span>
                          </Button>

                          {!p.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultPrompt(p)}
                              className="h-7 text-xs gap-1 px-2 text-amber-700 hover:text-amber-800"
                            >
                              <Star className="w-3 h-3" />
                              <span>Set Default</span>
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePrompt(p.id)}
                          className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </UpgradeGate>
      )}

      {/* TAB 2: TEMPLATE LIBRARY */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_PROMPT_TEMPLATES.map((tmpl) => {
            const icon = TEMPLATE_ICONS[tmpl.freelancerType || ""] || "🤖";
            return (
              <Card
                key={tmpl.id}
                className="p-5 border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                      {icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{tmpl.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tmpl.scoringCriteria.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-600"
                      >
                        {c.criterion} ({c.weight}%)
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(tmpl)}
                  className="w-full text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use This Template</span>
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: FILTERS */}
      {activeTab === "filters" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filters.map((f) => (
              <Card
                key={f.id}
                className="p-5 border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Filter className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-neutral-900">{f.name}</h3>
                          {f.isDefault && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {f.mapsFilters?.minRating ?? 0}★ — {f.mapsFilters?.maxRating ?? 5}★ •{" "}
                          {f.mapsFilters?.minReviews ?? 0}+ reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  {f.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2">{f.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {f.mapsFilters?.requireNoWebsite && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        No Website
                      </span>
                    )}
                    {f.instagramFilters?.requireNoInstagram && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        No Instagram
                      </span>
                    )}
                    {f.instagramFilters?.requireInstagram && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        Inactive Instagram
                      </span>
                    )}
                    {f.mapsFilters?.requireUnansweredReviews && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Unanswered Reviews
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingFilter(f);
                      setFilterModalOpen(true);
                    }}
                    className="h-7 text-xs gap-1 px-2"
                  >
                    <Edit2 className="w-3 h-3 text-neutral-500" />
                    <span>Edit Filter</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFilter(f.id)}
                    className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {promptModalOpen && (
        <PromptEditor
          open={promptModalOpen}
          onOpenChange={setPromptModalOpen}
          initialPrompt={editingPrompt}
          onSave={handleSavePrompt}
        />
      )}

      {filterModalOpen && (
        <FilterEditor
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          initialFilter={editingFilter}
          onSave={handleSaveFilter}
        />
      )}
    </div>
  );
}
