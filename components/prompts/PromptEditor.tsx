"use client";

import { useState } from "react";
import { Sparkles, Plus, Trash2, Check, Sliders, FileText, Bot, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CustomPromptConfig } from "@/lib/customization/promptBuilder";

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: CustomPromptConfig | null;
  onSave: (prompt: CustomPromptConfig) => void;
}

const AVAILABLE_VARIABLES = [
  { tag: "{businessName}", label: "Business Name" },
  { tag: "{city}", label: "City" },
  { tag: "{rating}", label: "Rating" },
  { tag: "{reviewCount}", label: "Reviews" },
  { tag: "{followers}", label: "Followers" },
  { tag: "{engagementRate}", label: "Engagement %" },
  { tag: "{daysSincePost}", label: "Days Since Post" },
  { tag: "{postsPerWeek}", label: "Posts / Wk" },
  { tag: "{website}", label: "Website" },
  { tag: "{instagramHandle}", label: "IG Handle" },
];

const FREELANCER_TYPES = [
  { id: "social_media_manager", label: "📱 Social Media" },
  { id: "web_designer", label: "💻 Web Design" },
  { id: "video_editor", label: "🎬 Video Editor" },
  { id: "copywriter", label: "✍️ Copywriter" },
  { id: "seo_specialist", label: "🔍 SEO" },
  { id: "graphic_designer", label: "🎨 Brand Design" },
];

export function PromptEditor({
  open,
  onOpenChange,
  initialPrompt,
  onSave,
}: PromptEditorProps) {
  const [activeTab, setActiveTab] = useState<"basics" | "analysis" | "pitch">("basics");

  // Form State
  const [name, setName] = useState(initialPrompt?.name || "");
  const [description, setDescription] = useState(initialPrompt?.description || "");
  const promptType = initialPrompt?.promptType || "full";
  const [freelancerType, setFreelancerType] = useState(
    initialPrompt?.freelancerType || "social_media_manager"
  );
  const [systemPrompt, setSystemPrompt] = useState(
    initialPrompt?.systemPrompt ||
      "You are an expert digital growth consultant. Analyze this business for specific conversion, local SEO, and social engagement leaks. Quantify estimated monthly losses in concrete revenue terms."
  );
  const [analysisPrompt, setAnalysisPrompt] = useState(
    initialPrompt?.analysisPrompt ||
      "Evaluate the business's online footprint. Identify their 3 most critical digital gaps, benchmark each against local competitors, and explain why fixing them will rapidly generate more appointments or orders."
  );
  const [pitchPrompt, setPitchPrompt] = useState(
    initialPrompt?.pitchPrompt ||
      "Write three punchy outreach messages (DM, Email, WhatsApp). Lead with their single most painful metric compared to the local average. Avoid generic greetings. End with a friendly, low-friction question."
  );
  const [scoringCriteria, setScoringCriteria] = useState(
    initialPrompt?.scoringCriteria && initialPrompt.scoringCriteria.length > 0
      ? initialPrompt.scoringCriteria
      : [
          { criterion: "Missing Website", weight: 30, description: "No website or broken URL on profile" },
          { criterion: "Low Instagram Engagement", weight: 25, description: "Engagement rate below 1.5%" },
          { criterion: "Inconsistent Posting", weight: 20, description: "Has not posted in 30+ days" },
          { criterion: "Unanswered Negative Reviews", weight: 25, description: "Reviews without owner responses" },
        ]
  );
  const [isDefault, setIsDefault] = useState(Boolean(initialPrompt?.isDefault));
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  function handleAddCriterion() {
    setScoringCriteria([
      ...scoringCriteria,
      {
        criterion: "New Opportunity Signal",
        weight: 15,
        description: "Custom criterion description",
      },
    ]);
  }

  function handleUpdateCriterion(
    idx: number,
    field: "criterion" | "weight" | "description",
    val: string | number
  ) {
    const updated = [...scoringCriteria];
    const item = { ...updated[idx] };
    if (field === "weight") {
      item.weight = Number(val);
    } else {
      item[field] = String(val);
    }
    updated[idx] = item;
    setScoringCriteria(updated);
  }

  function handleRemoveCriterion(idx: number) {
    setScoringCriteria(scoringCriteria.filter((_, i) => i !== idx));
  }

  function handleInsertVariable(tag: string) {
    setPitchPrompt((prev) => prev + " " + tag);
    toast.success(`Inserted ${tag}`);
  }

  function handleRunTest() {
    setIsTesting(true);
    setTestOutput(null);
    setTimeout(() => {
      setIsTesting(false);
      setTestOutput(
        `AI TEST PREVIEW:\n` +
          `• Target: Bella Cucina Trattoria (Dubai, 3.8★, 42 reviews)\n` +
          `• Digital Health Score: 44/100 (Opportunity: 88/100)\n` +
          `• Primary Gap: No Instagram Reels and link-in-bio is inactive.\n` +
          `• Projected Revenue Leak: ~$2,400/month from missed walk-ins.\n\n` +
          `Sample DM Pitch:\n` +
          `"Hey Bella Cucina team, noticed you have 3,100 followers in Jumeirah but only post static flyers. Your local competitors are averaging 45k monthly views with Reels. Put together a 1-page breakdown showing what they do — open to seeing it?"`
      );
    }, 600);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a name for your prompt.");
      setActiveTab("basics");
      return;
    }
    if (!systemPrompt.trim() || !analysisPrompt.trim()) {
      toast.error("Please fill in the system prompt and analysis instructions.");
      setActiveTab("analysis");
      return;
    }

    const promptObj: CustomPromptConfig = {
      id: initialPrompt?.id || `prompt_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      promptType,
      freelancerType,
      systemPrompt: systemPrompt.trim(),
      analysisPrompt: analysisPrompt.trim(),
      pitchPrompt: pitchPrompt.trim(),
      scoringCriteria,
      isActive: true,
      isDefault,
      usageCount: initialPrompt?.usageCount || 0,
      createdAt: initialPrompt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(promptObj);
    onOpenChange(false);
    toast.success(`Custom prompt "${promptObj.name}" saved!`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                {initialPrompt ? "Edit Custom Prompt" : "Create Custom AI Prompt"}
              </DialogTitle>
              <p className="text-xs text-neutral-500">
                Define the psychology, analysis depth, and pitch angles used during scraping.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 px-5 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("basics")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "basics"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Basics & Role</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "analysis"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Analysis Instructions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pitch")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "pitch"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Pitch Rules & Test</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: BASICS */}
          {activeTab === "basics" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Prompt Name *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dubai Restaurant SMM Outreach"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Description
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this prompt specializes in..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Freelancer Specialty
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FREELANCER_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFreelancerType(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        freelancerType === t.id
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <div className="font-bold text-neutral-800 dark:text-neutral-200">
                    Set as Default Prompt
                  </div>
                  <div className="text-neutral-500">
                    Automatically applies this prompt to future lead searches.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ANALYSIS PROMPT */}
          {activeTab === "analysis" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    System Prompt (AI Persona & Mindset)
                  </Label>
                  <span className="text-[11px] text-neutral-400">How AI thinks about businesses</span>
                </div>
                <Textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are an expert social media consultant with 10 years of experience..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Analysis Instructions
                  </Label>
                  <span className="text-[11px] text-neutral-400">What specific signals to look for</span>
                </div>
                <Textarea
                  rows={5}
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  placeholder="Analyze this business's social media presence. Focus on engagement rates vs industry standards..."
                  className="text-xs font-mono"
                />
              </div>

              {/* Scoring criteria */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200">
                      Opportunity Scoring Weights
                    </div>
                    <div className="text-neutral-500">
                      Configure custom weights (0-100) for ranking business gaps.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCriterion}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Signal</span>
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {scoringCriteria.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 space-y-1 w-full sm:w-auto">
                        <Input
                          value={c.criterion}
                          onChange={(e) => handleUpdateCriterion(idx, "criterion", e.target.value)}
                          className="h-7 text-xs font-semibold bg-white dark:bg-neutral-950"
                          placeholder="Criterion name"
                        />
                        <Input
                          value={c.description}
                          onChange={(e) => handleUpdateCriterion(idx, "description", e.target.value)}
                          className="h-6 text-[11px] text-neutral-500 bg-white dark:bg-neutral-950"
                          placeholder="Short description"
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={c.weight}
                            onChange={(e) => handleUpdateCriterion(idx, "weight", Number(e.target.value))}
                            className="w-24 accent-primary"
                          />
                          <span className="font-mono font-bold text-xs w-7 text-right">
                            {c.weight}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(idx)}
                          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PITCH PROMPT & TEST */}
          {activeTab === "pitch" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Pitch Writing Rules & Tone
                </Label>
                <Textarea
                  rows={4}
                  value={pitchPrompt}
                  onChange={(e) => setPitchPrompt(e.target.value)}
                  placeholder="Write pitches that lead with the specific metric..."
                  className="text-xs font-mono"
                />
              </div>

              {/* Variable Chips */}
              <div className="space-y-2">
                <div className="font-bold text-neutral-800 dark:text-neutral-200">
                  Insert Variables
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertVariable(v.tag)}
                      className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-primary/10 hover:text-primary transition-colors font-mono text-[11px] border border-neutral-200 dark:border-neutral-700"
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test prompt simulator */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-primary" />
                    <span>Test Prompt Simulator</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRunTest}
                    disabled={isTesting}
                    className="h-7 text-xs gap-1"
                  >
                    {isTesting ? "Simulating..." : "Test with Sample Lead"}
                  </Button>
                </div>

                {testOutput && (
                  <div className="p-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                    {testOutput}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {activeTab !== "basics" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveTab(activeTab === "pitch" ? "analysis" : "basics")
                }
                className="text-xs"
              >
                Previous
              </Button>
            )}

            {activeTab !== "pitch" ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setActiveTab(activeTab === "basics" ? "analysis" : "pitch")
                }
                className="text-xs gap-1"
              >
                <span>Next</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className="text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Prompt</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
