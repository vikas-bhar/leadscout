"use client";

import { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Plus,
  Eye,
  Mail,
  MessageCircle,
  Camera,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  OutreachTemplate,
  TEMPLATE_VARIABLES,
  TemplateChannel,
  TemplateCategory,
  compileOutreachTemplate,
  getStoredFreelancerProfile,
} from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: OutreachTemplate) => void;
  initialTemplate?: OutreachTemplate | null;
}

const SAMPLE_LEAD = {
  businessName: "Gusto Woodfired Pizza",
  businessCategory: "Italian Restaurant",
  location: "Downtown, Chicago, IL",
  googleRating: 4.4,
  reviewCount: 92,
  instagramHandle: "@gustochicago",
  bestService: "Conversion Web & Mobile Booking",
  estimatedBudget: "$1,800 - $3,200",
  gapsFound: [
    {
      category: "Mobile Booking Experience",
      problem: "No mobile-optimized direct table reservation link on profile",
      impact: "Losing up to 25 peak weekend table reservations",
      severity: "high" as const,
      yourSolution: "Launch a 1-click direct reservation widget and mobile landing page",
    },
  ],
  pitches: {
    pitches: [
      {
        style: "email",
        tone: "Warm Professional",
        subject: "Quick idea for Gusto Woodfired Pizza's weekend reservations",
        message: "Saw that Gusto has amazing local reputation (4.4★ with 92 reviews), but guests looking on mobile run into friction when trying to book directly. Adding a streamlined 1-click reservation page could easily drive 20+ extra table covers each weekend.",
        bestTimeToSend: "morning" as const,
        expectedResponseRate: "high" as const,
      },
      {
        style: "instagram_dm",
        tone: "Casual Conversational",
        subject: null,
        message: "Hey @gustochicago! Loved checking out your menu and customer photos. Spotted a quick opportunity with your mobile reservation link that could add 15-20 more covers this month—mind if I send a 60s breakdown?",
        bestTimeToSend: "afternoon" as const,
        expectedResponseRate: "high" as const,
      },
      {
        style: "whatsapp",
        tone: "Direct Results",
        subject: null,
        message: "Hi Gusto team! Saw your 92 reviews on Google. Quick note: adding direct mobile reservations could capture 15+ lost weekend bookings. Would you like a 1-page action plan?",
        bestTimeToSend: "evening" as const,
        expectedResponseRate: "medium" as const,
      },
    ],
    followUpMessage: "Following up on my note about Gusto's mobile reservation setup—happy to share those ideas whenever you have 2 minutes!",
    pitchTips: ["Send around 2 PM", "Attach a screen mockup"],
  },
};

export function TemplateEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTemplate,
}: TemplateEditorModalProps) {
  const [name, setName] = useState(initialTemplate?.name || "");
  const [channel, setChannel] = useState<TemplateChannel>(initialTemplate?.channel || "email");
  const [category, setCategory] = useState<TemplateCategory>(initialTemplate?.category || "cold_outreach");
  const [description, setDescription] = useState(initialTemplate?.description || "");
  const [subject, setSubject] = useState(initialTemplate?.subject || "");
  const [body, setBody] = useState(
    initialTemplate?.body ||
      `Hi {{business_name}} team,\n\nSaw your {{google_rating}}★ reputation in {{city}}.\n\n{{ai_pitch_message}}\n\nWould you be open to a quick 60-second video breakdown showing how {{gap_solution}} can increase direct inquiries?\n\nBest,\n{{freelancer_name}}\n{{portfolio_url}}`
  );
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewDevice, setPreviewDevice] = useState<"email" | "instagram" | "whatsapp">("email");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastActiveTarget = useRef<"subject" | "body">("body");

  if (!isOpen) return null;

  const profile = getStoredFreelancerProfile();

  const currentTemplateObj: OutreachTemplate = {
    id: initialTemplate?.id || `tpl_custom_${Date.now()}`,
    name: name.trim() || "Untitled Template",
    channel,
    category,
    description: description.trim() || "Custom user outreach template",
    subject,
    body,
    tags: initialTemplate?.tags || ["Custom", channel === "email" ? "Cold Email" : channel === "instagram_dm" ? "Instagram DM" : "WhatsApp"],
    isDefault: initialTemplate?.isDefault || false,
    isSystem: initialTemplate?.isSystem || false,
    createdAt: initialTemplate?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const compiled = compileOutreachTemplate(currentTemplateObj, SAMPLE_LEAD, profile);

  function insertVariable(variableKey: string) {
    if (lastActiveTarget.current === "subject" && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const nextSubject = subject.substring(0, start) + variableKey + subject.substring(end);
      setSubject(nextSubject);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    } else if (bodyTextareaRef.current) {
      const textarea = bodyTextareaRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const nextBody = body.substring(0, start) + variableKey + body.substring(end);
      setBody(nextBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    }
    toast.success(`Inserted ${variableKey}`);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!body.trim()) {
      toast.error("Template body cannot be empty");
      return;
    }
    onSave(currentTemplateObj);
    toast.success("Outreach template saved successfully!");
    onClose();
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-neutral-50/50">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {initialTemplate ? "Edit Outreach Template" : "Create New Outreach Template"}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customize email, DM, or WhatsApp frameworks that auto-insert AI-generated pitches.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Mode Switcher */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-2.5 bg-white text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5",
                activeTab === "edit"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Template Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5",
                activeTab === "preview"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Live Lead Preview
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 font-medium">
            Auto-compiles with real search data & AI pitches
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          {activeTab === "edit" ? (
            <>
              {/* Basic Meta Settings */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Template Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., The Digital Gap Teaser (High Conversion)"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Target Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as TemplateChannel)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="email">Cold Email</option>
                    <option value="instagram_dm">Instagram DM</option>
                    <option value="whatsapp">WhatsApp / SMS</option>
                    <option value="all">Universal (All Channels)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Category / Strategy</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="cold_outreach">Cold Outreach</option>
                    <option value="audit_pitch">Audit & Gap Pitch</option>
                    <option value="value_first">Value-First / Free Concepts</option>
                    <option value="urgent_fix">Urgent Fix / Mobile Rescue</option>
                    <option value="follow_up">Follow-Up Sequence</option>
                    <option value="custom">Custom Framework</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Strategy Description / Purpose</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Points out the top digital gap with a 60-second video walkthrough offer"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Variable Quick-Insert Toolbar */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Auto-Insert Dynamic Variables
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Click any tag to insert into Subject or Body
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      title={`Insert ${v.key} (e.g. "${v.example}")`}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all",
                        v.key === "{{ai_pitch_message}}" || v.key === "{{primary_gap}}"
                          ? "bg-primary text-white hover:bg-primary/90 shadow-2xs font-semibold"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                      )}
                    >
                      <span>{v.key}</span>
                      <Plus className="h-2.5 w-2.5 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Line (if Email or Universal) */}
              {(channel === "email" || channel === "all") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700">Email Subject Line</label>
                    <span className="text-[10px] text-neutral-400">Supports variables like &#123;&#123;business_name&#125;&#125;</span>
                  </div>
                  <input
                    ref={subjectInputRef}
                    onFocus={() => {
                      lastActiveTarget.current = "subject";
                    }}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Quick observation regarding {{business_name}}'s {{category}} inquiries"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Body Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">Message Framework Body</label>
                  <span className="text-[10px] text-neutral-500">
                    Use <strong className="text-primary font-mono">&#123;&#123;ai_pitch_message&#125;&#125;</strong> to auto-inject the tailored pitch!
                  </span>
                </div>
                <textarea
                  ref={bodyTextareaRef}
                  onFocus={() => {
                    lastActiveTarget.current = "body";
                  }}
                  rows={9}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Draft your outreach template here..."
                  className="w-full rounded-lg border border-neutral-300 p-3 text-xs font-mono leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                />
              </div>
            </>
          ) : (
            /* Live Preview Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">Previewing with Sample Lead:</span>
                  <span className="px-2 py-0.5 rounded bg-white font-medium border border-neutral-200">
                    {SAMPLE_LEAD.businessName} ({SAMPLE_LEAD.businessCategory})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("email")}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                      previewDevice === "email" ? "bg-white font-bold text-primary shadow-2xs" : "text-neutral-500"
                    )}
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("instagram")}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                      previewDevice === "instagram" ? "bg-white font-bold text-pink-600 shadow-2xs" : "text-neutral-500"
                    )}
                  >
                    <Camera className="h-3 w-3" />
                    Instagram DM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("whatsapp")}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                      previewDevice === "whatsapp" ? "bg-white font-bold text-emerald-600 shadow-2xs" : "text-neutral-500"
                    )}
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Rendered Mockup */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
                {compiled.subject && (
                  <div className="rounded-lg bg-white border border-neutral-200 p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-400 font-medium mr-2">Subject:</span>
                      <strong className="text-neutral-900">{compiled.subject}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(compiled.subject, "subject_preview")}
                      className="h-7 text-[11px] gap-1"
                    >
                      {copiedKey === "subject_preview" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      Copy Subject
                    </Button>
                  </div>
                )}

                <div className="rounded-lg bg-white border border-neutral-200 p-4 font-mono text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {compiled.body}
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleCopy(compiled.body, "body_preview")}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {copiedKey === "body_preview" ? <Check className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Formatted Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 bg-neutral-50/70">
          <span className="text-xs text-neutral-500">
            {initialTemplate?.isSystem ? "Editing preloaded system template" : "Custom template saved in your personal library"}
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5 font-semibold">
              <Check className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
