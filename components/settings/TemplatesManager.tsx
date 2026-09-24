"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Mail,
  MessageCircle,
  Camera,
  Copy,
  Check,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  Search,
  FileText,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  OutreachTemplate,
  DEFAULT_TEMPLATES,
  getStoredTemplates,
  saveStoredTemplates,
  compileOutreachTemplate,
  getStoredFreelancerProfile,
} from "@/lib/templates";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PREVIEW_SAMPLE = {
  businessName: "Artisan Woodfired Bistro",
  businessCategory: "Italian Restaurant",
  location: "Downtown, Austin, TX",
  googleRating: 4.6,
  reviewCount: 114,
  instagramHandle: "@artisanbistro_atx",
  bestService: "Direct Mobile Booking Funnel",
  estimatedBudget: "$2,000 - $4,000",
  gapsFound: [
    {
      category: "Mobile Booking Experience",
      problem: "No mobile table booking portal on Google Places listing",
      impact: "Losing up to 30 weekend reservations to nearby competitors",
      severity: "high" as const,
      yourSolution: "Deploy high-speed 1-click mobile reservation widget",
    },
  ],
  pitches: {
    pitches: [
      {
        style: "email",
        tone: "Warm Professional",
        subject: "Quick idea for Artisan Woodfired Bistro's customer inquiries",
        message: "Saw that Artisan Bistro has a loyal following (4.6★ with 114 reviews), but guests looking on mobile run into friction when trying to book. Setting up direct mobile reservations could easily capture 20+ extra weekend covers.",
        bestTimeToSend: "morning" as const,
        expectedResponseRate: "high" as const,
      },
      {
        style: "instagram_dm",
        tone: "Casual Friendly",
        subject: null,
        message: "Hey @artisanbistro_atx! Loved your menu and customer photos. Spotted a quick opportunity with your reservation link that could add 15-20 more covers this month—mind if I send over a 60-second breakdown?",
        bestTimeToSend: "afternoon" as const,
        expectedResponseRate: "high" as const,
      },
      {
        style: "whatsapp",
        tone: "Direct Results",
        subject: null,
        message: "Hi Artisan Bistro! Saw your 114 reviews—great reputation. Spotted a quick fix for your mobile booking flow that could add 15 direct bookings every week. Want a quick 1-page action plan?",
        bestTimeToSend: "evening" as const,
        expectedResponseRate: "medium" as const,
      },
    ],
    followUpMessage: "Following up on my note about Artisan Bistro's mobile reservation setup—happy to share those ideas whenever you have 2 minutes!",
    pitchTips: ["Send in the afternoon", "Mention their 4.6 star rating"],
  },
};

export function TemplatesManager() {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const list = getStoredTemplates();
    setTemplates(list);
    if (list.length > 0) {
      setSelectedTemplate(list[0]);
    }

    function handleUpdate() {
      const updated = getStoredTemplates();
      setTemplates(updated);
    }

    window.addEventListener("freelancefind_templates_updated", handleUpdate);
    return () => window.removeEventListener("freelancefind_templates_updated", handleUpdate);
  }, []);

  const filteredTemplates = templates.filter((tpl) => {
    const matchesChannel =
      selectedChannel === "all" ||
      tpl.channel === selectedChannel ||
      (selectedChannel === "email" && tpl.channel === "all") ||
      (selectedChannel === "instagram_dm" && tpl.channel === "all") ||
      (selectedChannel === "whatsapp" && tpl.channel === "all");

    const matchesSearch =
      !searchQuery.trim() ||
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesChannel && matchesSearch;
  });

  function handleSaveTemplate(saved: OutreachTemplate) {
    let updated: OutreachTemplate[];
    const exists = templates.some((t) => t.id === saved.id);
    if (exists) {
      updated = templates.map((t) => (t.id === saved.id ? saved : t));
    } else {
      updated = [saved, ...templates];
    }
    setTemplates(updated);
    saveStoredTemplates(updated);
    setSelectedTemplate(saved);
  }

  function handleDeleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this outreach template?")) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveStoredTemplates(updated);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(updated[0] || null);
    }
    toast.success("Template deleted");
  }

  function handleDuplicate(template: OutreachTemplate) {
    const duplicated: OutreachTemplate = {
      ...template,
      id: `tpl_custom_${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...templates];
    setTemplates(updated);
    saveStoredTemplates(updated);
    setSelectedTemplate(duplicated);
    toast.success(`Duplicated "${template.name}"`);
  }

  function handleSetDefault(template: OutreachTemplate) {
    const updated = templates.map((t) => {
      if (t.channel === template.channel) {
        return { ...t, isDefault: t.id === template.id };
      }
      return t;
    });
    setTemplates(updated);
    saveStoredTemplates(updated);
    toast.success(`Set "${template.name}" as default for ${template.channel}`);
  }

  function handleResetDefaults() {
    if (!confirm("Reset all templates to initial high-converting presets? Custom templates will be replaced.")) return;
    setTemplates(DEFAULT_TEMPLATES);
    saveStoredTemplates(DEFAULT_TEMPLATES);
    setSelectedTemplate(DEFAULT_TEMPLATES[0]);
    toast.success("Templates reset to high-converting defaults");
  }

  function handleCopy(text: string, id: string, label = "Template") {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const profile = getStoredFreelancerProfile();
  const compiledActive = selectedTemplate
    ? compileOutreachTemplate(selectedTemplate, PREVIEW_SAMPLE, profile)
    : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Outreach Email & DM Template Library
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Pre-built and custom frameworks that auto-insert AI-generated pitches, digital gap insights, and your freelancer signature.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-neutral-600 gap-1.5"
            title="Restore default high-converting templates"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingTemplate(null);
              setIsEditorOpen(true);
            }}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
        {/* Channel Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Frameworks" },
            { id: "email", label: "Cold Email", icon: Mail },
            { id: "instagram_dm", label: "Instagram DM", icon: Camera },
            { id: "whatsapp", label: "WhatsApp / SMS", icon: MessageCircle },
          ].map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  selectedChannel === ch.id
                    ? "bg-primary text-white font-semibold shadow-2xs"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates or tags..."
            className="w-full rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-neutral-50/50"
          />
        </div>
      </div>

      {/* Main Split Layout: Template Cards on Left, Interactive Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template List */}
        <div className="lg:col-span-5 space-y-3 max-h-[720px] overflow-y-auto pr-1">
          {filteredTemplates.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-neutral-300 bg-white">
              <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-700">No matching templates found</p>
              <p className="text-[11px] text-neutral-500 mt-1">Try adjusting your channel filter or search term.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedChannel("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-all relative text-left bg-white",
                    isSelected
                      ? "border-primary ring-2 ring-primary/10 shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 hover:shadow-2xs"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            template.channel === "email"
                              ? "bg-blue-100 text-blue-800"
                              : template.channel === "instagram_dm"
                              ? "bg-pink-100 text-pink-800"
                              : template.channel === "whatsapp"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          )}
                        >
                          {template.channel === "email"
                            ? "Cold Email"
                            : template.channel === "instagram_dm"
                            ? "Instagram DM"
                            : template.channel === "whatsapp"
                            ? "WhatsApp"
                            : "Universal"}
                        </span>

                        {template.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            Default
                          </span>
                        )}

                        {template.isSystem && (
                          <span className="text-[10px] text-neutral-400 font-medium">Preset</span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-neutral-900 leading-snug">{template.name}</h3>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsEditorOpen(true);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                        title="Edit Template"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(template)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                        title="Duplicate Template"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {!template.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 mt-2 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      {template.tags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>

                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      View Preview <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Auto-Inserted Preview Panel */}
        <div className="lg:col-span-7">
          {selectedTemplate && compiledActive ? (
            <Card className="border border-neutral-200/90 shadow-sm bg-white overflow-hidden sticky top-20">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/60">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{selectedTemplate.name}</h3>
                    {!selectedTemplate.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(selectedTemplate)}
                        className="text-[11px] font-medium text-neutral-500 hover:text-primary transition-colors"
                      >
                        (Set as default)
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    Auto-inserted with real lead metrics and your AI pitch
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(selectedTemplate);
                      setIsEditorOpen(true);
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Template
                  </Button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Subject Line if present */}
                {compiledActive.subject && (
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200/80 p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-neutral-400 font-semibold mr-2 uppercase text-[10px] tracking-wider">Subject:</span>
                      <strong className="text-neutral-900 font-medium">{compiledActive.subject}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(compiledActive.subject, "subj_main", "Subject")}
                      className="h-7 text-xs gap-1 text-neutral-600 hover:text-neutral-900"
                    >
                      {copiedId === "subj_main" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Subject
                    </Button>
                  </div>
                )}

                {/* Formatted Rendered Message Box */}
                <div className="relative rounded-xl bg-neutral-50/70 border border-neutral-200/90 p-4 font-mono text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {compiledActive.body}
                </div>

                {/* Bottom Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-neutral-500">
                    Ready to paste into Gmail, Outlook, Instagram, or WhatsApp.
                  </div>

                  <div className="flex items-center gap-2">
                    {compiledActive.subject && (
                      <a
                        href={`mailto:?subject=${encodeURIComponent(compiledActive.subject)}&body=${encodeURIComponent(compiledActive.body)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-neutral-500" />
                        Open Email App
                      </a>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleCopy(compiledActive.body, "body_main", "Outreach Message")}
                      className="gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      {copiedId === "body_main" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-200" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Formatted Message</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-12 text-center rounded-xl border border-neutral-200 bg-white">
              <Sparkles className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-700">Select a template to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        initialTemplate={editingTemplate}
      />
    </div>
  );
}
