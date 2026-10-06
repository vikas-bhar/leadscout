"use client";

import React, { useState } from "react";
import {
  buildCurlCommand,
  buildNodeJsSnippet,
  buildPythonSnippet,
} from "@/lib/apify-utils";
import {
  Play,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";

interface ApiTestBenchTabProps {
  runId: string;
  kvsId: string;
  datasetId: string;
  token: string;
  onOpenTestEndpoint: (endpointId: string) => void;
}

export function ApiTestBenchTab({
  runId,
  kvsId,
  datasetId,
  token,
  onOpenTestEndpoint,
}: ApiTestBenchTabProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, "curl" | "node" | "python">>({
    "get-run": "curl",
    "get-input": "curl",
    "get-dataset": "curl",
    "get-log": "curl",
    "abort-run": "curl",
    "resurrect-run": "curl",
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    "get-run": true,
    "get-input": true,
    "get-dataset": true,
    "get-log": true,
    "abort-run": false,
    "resurrect-run": false,
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const endpoints = [
    {
      id: "get-run",
      title: "Get run",
      description: "Returns an object containing all details of this run.",
      method: "GET" as const,
      url: `https://api.apify.com/v2/actor-runs/${runId}?token=***`,
      actualUrl: `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/actor-runs/run-object-and-its-storages/get-run",
    },
    {
      id: "get-input",
      title: "Get input",
      description: "Returns the input of this run from its key-value store.",
      method: "GET" as const,
      url: `https://api.apify.com/v2/key-value-stores/${kvsId}/records/INPUT?token=***`,
      actualUrl: `https://api.apify.com/v2/key-value-stores/${kvsId}/records/INPUT?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/key-value-stores/record/get-record",
    },
    {
      id: "get-dataset",
      title: "Get dataset items",
      description: "Returns items stored in the default dataset of this run.",
      method: "GET" as const,
      url: `https://api.apify.com/v2/datasets/${datasetId}/items?token=***`,
      actualUrl: `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/datasets/item-collection/get-items",
    },
    {
      id: "get-log",
      title: "Get log",
      description: "Returns the log of this run.",
      method: "GET" as const,
      url: `https://api.apify.com/v2/logs/${runId}?token=***`,
      actualUrl: `https://api.apify.com/v2/logs/${runId}?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/logs/log/get-log",
    },
    {
      id: "abort-run",
      title: "Abort run",
      description: "Aborts the current run.",
      method: "POST" as const,
      url: `https://api.apify.com/v2/actor-runs/${runId}/abort?token=***`,
      actualUrl: `https://api.apify.com/v2/actor-runs/${runId}/abort?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/actor-runs/abort-run/abort-run",
    },
    {
      id: "resurrect-run",
      title: "Resurrect run",
      description: "Resurrects the current run.",
      method: "POST" as const,
      url: `https://api.apify.com/v2/actor-runs/${runId}/resurrect?token=***`,
      actualUrl: `https://api.apify.com/v2/actor-runs/${runId}/resurrect?token=${token}`,
      docUrl: "https://docs.apify.com/api/v2#/reference/actor-runs/resurrect-run/resurrect-run",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Apify Actor Run API Reference & Test Bench
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive test bench for the 6 primary endpoints governing this actor run. Click &ldquo;Test endpoint&rdquo; on any entry to execute live HTTP requests.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {endpoints.map((ep) => {
          const isExpanded = expandedCards[ep.id] ?? true;
          const snippetTab = activeSnippetTab[ep.id] || "curl";
          const ids = { runId, kvsId, datasetId };

          const getCodeSnippet = () => {
            if (snippetTab === "curl") {
              return buildCurlCommand(ep.actualUrl, ep.method, token);
            }
            if (snippetTab === "node") {
              return buildNodeJsSnippet(ep.id, ids, token);
            }
            return buildPythonSnippet(ep.id, ids);
          };

          const snippet = getCodeSnippet();

          return (
            <div
              key={ep.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              {/* Card Header */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        ep.method === "GET"
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      {ep.title}
                    </h3>
                    <a
                      href={ep.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      title="View Apify API reference documentation"
                    >
                      <span className="hidden sm:inline">View API reference</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400">{ep.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenTestEndpoint(ep.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Test endpoint</span>
                  </button>

                  <button
                    onClick={() =>
                      setExpandedCards((prev) => ({ ...prev, [ep.id]: !isExpanded }))
                    }
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                    title={isExpanded ? "Collapse details" : "Expand details"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Card Body with URL and Code Snippets */}
              {isExpanded && (
                <div className="p-5 border-t border-slate-800/80 space-y-4">
                  {/* Endpoint URL Box */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Endpoint URL
                    </label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200">
                      <span className="truncate pr-2">{ep.url}</span>
                      <button
                        onClick={() => handleCopy(ep.url, `url-${ep.id}`)}
                        className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                        title="Copy endpoint URL"
                      >
                        {copiedKey === `url-${ep.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Generator Tabs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                        <button
                          onClick={() =>
                            setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "curl" }))
                          }
                          className={`px-2.5 py-1 rounded font-medium transition-colors ${
                            snippetTab === "curl"
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          cURL
                        </button>
                        <button
                          onClick={() =>
                            setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "node" }))
                          }
                          className={`px-2.5 py-1 rounded font-medium transition-colors ${
                            snippetTab === "node"
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Node.js (apify-client)
                        </button>
                        <button
                          onClick={() =>
                            setActiveSnippetTab((prev) => ({ ...prev, [ep.id]: "python" }))
                          }
                          className={`px-2.5 py-1 rounded font-medium transition-colors ${
                            snippetTab === "python"
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Python
                        </button>
                      </div>

                      <button
                        onClick={() => handleCopy(snippet, `code-${ep.id}`)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                      >
                        {copiedKey === `code-${ep.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === `code-${ep.id}` ? "Copied" : "Copy Snippet"}</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-emerald-300/90 overflow-x-auto">
                      <pre className="whitespace-pre leading-relaxed">{snippet}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
