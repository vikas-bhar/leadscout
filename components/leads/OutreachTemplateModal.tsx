"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Camera,
  Settings,
  Star,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import {
  OutreachTemplate,
  getStoredTemplates,
  compileOutreachTemplate,
  getStoredFreelancerProfile,
} from "@/lib/templates";
import type { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OutreachTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Partial<Lead> | Record<string, unknown>;
  defaultChannel?: "email" | "instagram_dm" | "whatsapp";
}

export function OutreachTemplateModal({
  isOpen,
  onClose,
  lead,
  defaultChannel = "email",
}: OutreachTemplateModalProps) {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>(defaultChannel);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = getStoredTemplates();
      setTemplates(list);

      // Find best default template for current channel
      const channelMatches = list.filter(
        (t) => t.channel === defaultChannel || t.channel === "all"
      );
      const defaultTpl = channelMatches.find((t) => t.isDefault) || channelMatches[0] || list[0];
      if (defaultTpl) {
        setSelectedTemplateId(defaultTpl.id);
      }
    }
  }, [isOpen, defaultChannel]);

  if (!isOpen) return null;

  const profile = getStoredFreelancerProfile();

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedChannel === "all") return true;
    return tpl.channel === selectedChannel || tpl.channel === "all";
  });

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || templates[0];

  const compiled = activeTemplate
    ? compileOutreachTemplate(
        activeTemplate,
        lead,
        profile,
        selectedChannel as "email" | "instagram_dm" | "whatsapp"
      )
    : null;

  function handleCopy(text: string, key: string, label = "Content") {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const rawLead = lead as Record<string, unknown>;
  const businessName = (rawLead.businessName || rawLead.business_name || "Lead") as string;
  const leadPhone = (rawLead.phone || "") as string;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-neutral-50/70">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Apply Outreach Template for {businessName}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Auto-inserted with {businessName}&apos;s digital gaps, Google metrics, and AI pitch.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Channel Filter Strip */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-2.5 bg-white text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: "email", label: "Cold Email", icon: Mail },
              { id: "instagram_dm", label: "Instagram DM", icon: Camera },
              { id: "whatsapp", label: "WhatsApp / SMS", icon: MessageCircle },
              { id: "all", label: "All Frameworks", icon: Sparkles },
            ].map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannel(ch.id);
                    const matching = templates.filter((t) => ch.id === "all" || t.channel === ch.id || t.channel === "all");
                    if (matching.length > 0 && !matching.some((m) => m.id === selectedTemplateId)) {
                      setSelectedTemplateId(matching[0].id);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
                    selectedChannel === ch.id
                      ? "bg-primary text-white font-semibold shadow-2xs"
                      : "text-neutral-600 hover:bg-neutral-100"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {ch.label}
                </button>
              );
            })}
          </div>

          <Link
            href="/settings"
            onClick={onClose}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold shrink-0 ml-2"
          >
            <Settings className="h-3 w-3" />
            <span>Settings</span>
          </Link>
        </div>

        {/* Modal Body: Split Template Selector on Left, Rendered Message on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[calc(80vh-140px)] overflow-hidden">
          {/* Template Selection List */}
          <div className="md:col-span-4 border-r border-neutral-100 p-4 space-y-2 overflow-y-auto max-h-[500px]">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
              Select Framework
            </span>

            {filteredTemplates.map((t) => {
              const isSelected = activeTemplate?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all relative block",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-2xs text-neutral-900"
                      : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase",
                        t.channel === "email"
                          ? "bg-blue-100 text-blue-800"
                          : t.channel === "instagram_dm"
                          ? "bg-pink-100 text-pink-800"
                          : t.channel === "whatsapp"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 text-purple-800"
                      )}
                    >
                      {t.channel === "email" ? "Email" : t.channel === "instagram_dm" ? "IG DM" : t.channel === "whatsapp" ? "WhatsApp" : "All"}
                    </span>
                    {t.isDefault && (
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    )}
                  </div>

                  <p className="text-xs font-bold mt-1 line-clamp-1">{t.name}</p>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">{t.description}</p>
                </button>
              );
            })}
          </div>

          {/* Compiled Output View */}
          <div className="md:col-span-8 p-6 space-y-4 overflow-y-auto max-h-[500px] bg-neutral-50/40">
            {activeTemplate && compiled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{activeTemplate.name}</h3>
                    <p className="text-xs text-neutral-500">{activeTemplate.description}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Compiled
                  </span>
                </div>

                {/* Subject Line if present */}
                {compiled.subject && (
                  <div className="rounded-lg bg-white border border-neutral-200/90 p-3 text-xs flex items-center justify-between shadow-2xs">
                    <div className="mr-2">
                      <span className="text-neutral-400 font-semibold mr-1.5 uppercase text-[10px]">Subject:</span>
                      <strong className="text-neutral-900">{compiled.subject}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(compiled.subject, "modal_subj", "Subject")}
                      className="h-7 text-xs gap-1"
                    >
                      {copiedKey === "modal_subj" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy
                    </Button>
                  </div>
                )}

                {/* Formatted Message Box */}
                <div className="rounded-xl bg-white border border-neutral-200/90 p-4 font-mono text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {compiled.body}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {activeTemplate.channel === "whatsapp" && (
                      <a
                        href={
                          leadPhone
                            ? `https://api.whatsapp.com/send?phone=${leadPhone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(compiled.body)}`
                            : `https://web.whatsapp.com/send?text=${encodeURIComponent(compiled.body)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Send on WhatsApp
                      </a>
                    )}

                    {leadPhone && (
                      <a
                        href={`tel:${leadPhone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                        title="Direct Dial Lead"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call
                      </a>
                    )}

                    {(activeTemplate.channel === "email" || activeTemplate.channel === "all") && (
                      <a
                        href={`mailto:?subject=${encodeURIComponent(compiled.subject || `Inquiry regarding ${businessName}`)}&body=${encodeURIComponent(compiled.body)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Open Email Client
                      </a>
                    )}

                    {activeTemplate.channel === "instagram_dm" && (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${lead.location || ""} site:instagram.com`)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          navigator.clipboard.writeText(compiled.body);
                          toast.success("Copied DM to clipboard!");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Copy & Open Instagram
                      </a>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCopy(compiled.body, "modal_body", "Outreach Message")}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {copiedKey === "modal_body" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-200" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Personalized Message</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500">
                Please select a template framework on the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
