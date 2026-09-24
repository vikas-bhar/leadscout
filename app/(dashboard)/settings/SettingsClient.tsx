"use client";

import { useState } from "react";
import { Mail, User, Info, CheckCircle2, Sparkles, Cpu } from "lucide-react";
import { TemplatesManager } from "@/components/settings/TemplatesManager";
import { FreelancerProfileForm } from "@/components/settings/FreelancerProfileForm";
import { McpIntegrationHub } from "@/components/settings/McpIntegrationHub";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<"templates" | "profile" | "mcp" | "guide">("templates");

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Settings & Outreach Automation</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Configure customizable outreach email templates, variables, signature, and Model Context Protocol (MCP) integrations.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-neutral-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "templates"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          Outreach Templates Library
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "profile"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          )}
        >
          <User className="h-3.5 w-3.5" />
          Freelancer Profile & Signature
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mcp")}
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "mcp"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          )}
        >
          <Cpu className="h-3.5 w-3.5 text-indigo-500" />
          MCP Tool & Agent Server
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guide")}
          className={cn(
            "pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "guide"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          )}
        >
          <Info className="h-3.5 w-3.5" />
          Cold Outreach Playbook
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "templates" && <TemplatesManager />}

      {activeTab === "profile" && <FreelancerProfileForm />}

      {activeTab === "mcp" && <McpIntegrationHub />}

      {activeTab === "guide" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 border border-neutral-200/90 bg-white space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              High-Converting Outreach Rules
            </h3>
            <ul className="text-xs text-neutral-700 space-y-2 leading-relaxed list-disc pl-4">
              <li>
                <strong>Always lead with observation:</strong> Never start with &quot;Hi, I am a web designer&quot;. Start with their reviews, rating, or a specific metric.
              </li>
              <li>
                <strong>Keep cold emails under 100 words:</strong> Business owners read emails on smartphones between meetings. 4–6 concise sentences maximum.
              </li>
              <li>
                <strong>Low-commitment call to action:</strong> Ask &quot;Mind if I send over a 60-second breakdown?&quot; instead of asking for a 30-minute sales meeting immediately.
              </li>
              <li>
                <strong>Reference exact numbers:</strong> Mentioning &quot;4.4★ with 92 reviews&quot; proves you actually checked their specific listing.
              </li>
            </ul>
          </Card>

          <Card className="p-5 border border-neutral-200/90 bg-white space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              How Auto-Inserting Works
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              When you open any lead and click <strong>&quot;Apply Outreach Template&quot;</strong>, the template engine automatically evaluates all dynamic tags:
            </p>
            <div className="rounded-lg bg-neutral-50 p-3 text-[11px] font-mono text-neutral-800 space-y-1">
              <div>• <span className="text-primary font-bold">&#123;&#123;ai_pitch_message&#125;&#125;</span> → AI generated pitch text</div>
              <div>• <span className="text-primary font-bold">&#123;&#123;primary_gap&#125;&#125;</span> → High-impact digital bottleneck</div>
              <div>• <span className="text-primary font-bold">&#123;&#123;gap_solution&#125;&#125;</span> → Recommended service deliverable</div>
              <div>• <span className="text-primary font-bold">&#123;&#123;freelancer_name&#125;&#125;</span> → Your signature name</div>
            </div>
            <p className="text-[11px] text-neutral-500">
              You can add or remove any variable in the template editor anytime.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
