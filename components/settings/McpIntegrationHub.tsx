"use client";

import { useState } from "react";
import {
  Cpu,
  Copy,
  Check,
  Play,
  Sparkles,
  Terminal,
  Database,
  ExternalLink,
  Code,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { MCP_TOOLS } from "@/lib/mcp";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function McpIntegrationHub() {
  const [selectedTool, setSelectedTool] = useState<string>(MCP_TOOLS[0].name);
  const [toolParams, setToolParams] = useState<string>(
    JSON.stringify(
      {
        location: "Austin, TX",
        businessType: "Italian Restaurant",
        freelancerType: "web_designer",
        limit: 3,
      },
      null,
      2
    )
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [configMode, setConfigMode] = useState<"solo" | "combined">("combined");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentHost = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const mcpEndpointUrl = `${currentHost}/api/mcp`;

  const soloConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        freelancefind: {
          url: mcpEndpointUrl,
          headers: {
            "Content-Type": "application/json",
          },
        },
      },
    },
    null,
    2
  );

  const combinedApifyConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        freelancefind: {
          url: mcpEndpointUrl,
          headers: {
            "Content-Type": "application/json",
          },
        },
        apify: {
          command: "npx",
          args: [
            "mcp-remote",
            "https://mcp.apify.com/?tools=compass/crawler-google-places,apify/instagram-scraper",
            "--header",
            "Authorization: Bearer <YOUR_APIFY_API_TOKEN>",
          ],
        },
      },
    },
    null,
    2
  );

  const activeConfigSnippet = configMode === "combined" ? combinedApifyConfigSnippet : soloConfigSnippet;

  const activeToolDef = MCP_TOOLS.find((t) => t.name === selectedTool) || MCP_TOOLS[0];

  function handleSelectTool(toolName: string) {
    setSelectedTool(toolName);
    setExecutionResult(null);

    // Pre-populate sample parameters for each tool
    if (toolName === "freelancefind_search_leads") {
      setToolParams(
        JSON.stringify(
          {
            location: "Austin, TX",
            businessType: "Italian Restaurant",
            freelancerType: "web_designer",
            limit: 3,
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_scrape_url") {
      setToolParams(
        JSON.stringify(
          {
            url: "https://bluebottlecoffee.com",
            extractContacts: true,
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_analyze_business") {
      setToolParams(
        JSON.stringify(
          {
            businessName: "Gusto Woodfired Pizza",
            websiteUrl: "https://gustowoodfired.com",
            category: "Restaurant",
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_generate_pitch") {
      setToolParams(
        JSON.stringify(
          {
            businessName: "Artisan Coffee Roasters",
            category: "Coffee Shop",
            location: "Brooklyn, NY",
            primaryGap: "Zero short-form Reels and missing mobile table reservation",
            channel: "instagram_dm",
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_list_leads") {
      setToolParams(
        JSON.stringify(
          {
            minScore: 70,
            status: "all",
            tag: "Hot",
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_compile_template") {
      setToolParams(
        JSON.stringify(
          {
            templateId: "default",
            businessName: "Bella Italia Bistro",
            location: "Chicago, IL",
            primaryGap: "No online reservation link on Google Places",
          },
          null,
          2
        )
      );
    } else if (toolName === "freelancefind_get_credit_balance") {
      setToolParams(JSON.stringify({}, null, 2));
    }
  }

  async function handleExecuteTool() {
    setIsExecuting(true);
    setExecutionResult(null);
    const start = performance.now();

    try {
      let parsedArgs = {};
      if (toolParams.trim()) {
        try {
          parsedArgs = JSON.parse(toolParams);
        } catch {
          toast.error("Invalid JSON in tool parameters");
          setIsExecuting(false);
          return;
        }
      }

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `mcp_test_${Date.now()}`,
          method: "tools/call",
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setExecutionTime(elapsed);
      setExecutionResult(JSON.stringify(data, null, 2));
      toast.success(`MCP Tool "${selectedTool}" executed in ${elapsed}ms`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult(JSON.stringify({ error: msg }, null, 2));
      toast.error("Execution error");
    } finally {
      setIsExecuting(false);
    }
  }

  function handleCopy(text: string, key: string, label = "Config") {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 border border-primary/20 bg-linear-to-r from-primary/5 via-white to-primary/5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary text-white">
                <Cpu className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-neutral-900">
                Model Context Protocol (MCP) Server & Tool Suite
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live & Active
              </span>
            </div>
            <p className="text-xs text-neutral-600 max-w-2xl">
              Connect FreelanceFind directly to <strong>Claude Desktop, Cursor, Windsurf, Zed</strong>, or external AI agents. Query local business leads, run automated gap audits, and compile personalized pitches directly through the official Model Context Protocol.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/mcp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 shadow-2xs transition-colors"
            >
              <Server className="h-3.5 w-3.5 text-neutral-500" />
              <span>Inspect Server Manifest</span>
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            </a>
          </div>
        </div>
      </Card>

      {/* Quick Configuration Snippet for Claude Desktop / Cursor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 border border-neutral-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-neutral-900">Claude Desktop / Cursor Config</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(activeConfigSnippet, "claude_json", "MCP Configuration")}
                className="h-7 text-xs gap-1 self-start sm:self-auto"
              >
                {copiedKey === "claude_json" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                Copy JSON
              </Button>
            </div>

            {/* Server Mode Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs">
              <button
                type="button"
                onClick={() => setConfigMode("combined")}
                className={`flex-1 py-1 px-2.5 rounded-md font-medium text-center transition-all ${
                  configMode === "combined"
                    ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                FreelanceFind + Apify MCP
              </button>
              <button
                type="button"
                onClick={() => setConfigMode("solo")}
                className={`flex-1 py-1 px-2.5 rounded-md font-medium text-center transition-all ${
                  configMode === "solo"
                    ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                FreelanceFind Only
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              {configMode === "combined"
                ? "Combined Multi-Server: Equips your AI agent with Apify's live scrapers alongside FreelanceFind's lead gap audits & pitch generators."
                : "Paste this into your claude_desktop_config.json or IDE MCP settings:"}
            </p>

            <pre className="rounded-xl bg-neutral-900 text-neutral-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-56">
              {activeConfigSnippet}
            </pre>

            <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-500">
              <span>Endpoint: <strong className="font-mono text-neutral-700">{mcpEndpointUrl}</strong></span>
              <button
                onClick={() => handleCopy(mcpEndpointUrl, "endpoint_url", "Endpoint URL")}
                className="text-primary hover:underline font-semibold"
              >
                Copy URL
              </button>
            </div>
          </Card>

          {/* Exposed MCP Resources & Prompts */}
          <Card className="p-5 border border-neutral-200 bg-white space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Exposed MCP Resources & Prompts
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 flex items-start justify-between">
                <div>
                  <strong className="font-mono text-primary text-[11px]">freelancefind://leads/saved</strong>
                  <p className="text-neutral-500 text-[11px] mt-0.5">Stream of all discovered high-opportunity business leads</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 font-bold">Resource</span>
              </div>

              <div className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 flex items-start justify-between">
                <div>
                  <strong className="font-mono text-primary text-[11px]">freelancefind://templates/library</strong>
                  <p className="text-neutral-500 text-[11px] mt-0.5">Outreach email and DM templates library with variable definitions</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 font-bold">Resource</span>
              </div>

              <div className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 flex items-start justify-between">
                <div>
                  <strong className="text-neutral-800 font-semibold">prompt: audit_local_business</strong>
                  <p className="text-neutral-500 text-[11px] mt-0.5">Structured prompt template for local digital gap audit generation</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">Prompt</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Interactive MCP Tool Playground */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 border border-neutral-200 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900">Interactive MCP Tool Tester</h3>
              </div>
              <span className="text-[11px] text-neutral-500">JSON-RPC 2.0</span>
            </div>

            {/* Tool Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700">Select MCP Tool</label>
              <select
                value={selectedTool}
                onChange={(e) => handleSelectTool(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-neutral-300 text-xs font-mono bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {MCP_TOOLS.map((tool) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
              {activeToolDef.description}
            </p>

            {/* Input Arguments Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700">Tool Arguments (JSON)</label>
                <span className="text-[10px] text-neutral-400">params.arguments</span>
              </div>
              <textarea
                rows={5}
                value={toolParams}
                onChange={(e) => setToolParams(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-3 font-mono text-xs leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-neutral-50/50"
              />
            </div>

            <Button
              onClick={handleExecuteTool}
              disabled={isExecuting}
              className="w-full gap-2 text-xs font-semibold"
            >
              {isExecuting ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Executing MCP Tool...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Execute MCP Tool ({selectedTool})</span>
                </>
              )}
            </Button>

            {/* Output Result */}
            {executionResult && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-emerald-600" />
                    MCP JSON-RPC Response
                    {executionTime !== null && (
                      <span className="text-[10px] font-normal text-neutral-400 font-mono">({executionTime}ms)</span>
                    )}
                  </span>
                  <button
                    onClick={() => handleCopy(executionResult, "mcp_resp", "MCP Response")}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Copy Output
                  </button>
                </div>
                <pre className="rounded-xl bg-neutral-900 text-emerald-400 p-3.5 font-mono text-xs max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                  {executionResult}
                </pre>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
