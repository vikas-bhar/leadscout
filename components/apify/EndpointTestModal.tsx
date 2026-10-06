"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { buildCurlCommand } from "@/lib/apify-utils";

interface EndpointTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  method: "GET" | "POST";
  urlTemplate: string;
  actualUrl: string;
  token: string;
  defaultBody?: unknown;
}

interface TestResponseData {
  success?: boolean;
  status: number;
  statusText: string;
  latencyMs: number;
  contentType?: string;
  headers?: Record<string, string>;
  data: unknown;
}

export function EndpointTestModal({
  isOpen,
  onClose,
  title,
  method,
  actualUrl,
  token,
  defaultBody,
}: EndpointTestModalProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TestResponseData | null>(null);
  const [activeTab, setActiveTab] = useState<"response" | "headers" | "curl">("response");
  const [copied, setCopied] = useState(false);
  const [postBody, setPostBody] = useState(defaultBody ? JSON.stringify(defaultBody, null, 2) : "");

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    try {
      let parsedBody: unknown = undefined;
      if (method === "POST" && postBody.trim()) {
        try {
          parsedBody = JSON.parse(postBody);
        } catch {
          // Keep raw or handle error
        }
      }

      const res = await fetch("/api/apify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointUrl: actualUrl,
          method,
          token,
          body: parsedBody,
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network request failed";
      setResponse({
        success: false,
        status: 500,
        statusText: "Client Error",
        latencyMs: 0,
        data: { error: msg },
      });
    } finally {
      setLoading(false);
    }
  }, [actualUrl, method, postBody, token]);

  // Auto-run test once opened
  useEffect(() => {
    if (isOpen) {
      handleExecute();
    } else {
      setResponse(null);
    }
  }, [isOpen, handleExecute]);

  if (!isOpen) return null;

  const curlCommand = buildCurlCommand(actualUrl, method, token, method === "POST" && postBody ? defaultBody : undefined);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold ${
                method === "GET"
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {method}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-lg mt-0.5">
                {actualUrl.replace(token, "***")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Executing..." : "Send Request"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* POST Body Editor if POST */}
        {method === "POST" && (
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/30">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Request Payload (JSON)
            </label>
            <textarea
              rows={3}
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="{}"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {/* Response Metrics Banner */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              {response ? (
                <span
                  className={`font-mono font-semibold ${
                    response.status >= 200 && response.status < 300
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
              ) : loading ? (
                <span className="text-slate-400 animate-pulse font-mono">Running...</span>
              ) : (
                <span className="text-slate-500 font-mono">—</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Latency:</span>
              <span className="font-mono tabular-nums text-slate-300">
                {response?.latencyMs ? `${response.latencyMs}ms` : "—"}
              </span>
            </div>

            {response?.contentType && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Format:</span>
                <span className="font-mono text-slate-400 truncate max-w-[150px]">
                  {response.contentType}
                </span>
              </div>
            )}
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("response")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === "response"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Body
            </button>
            <button
              onClick={() => setActiveTab("headers")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === "headers"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Headers
            </button>
            <button
              onClick={() => setActiveTab("curl")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === "curl"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              cURL
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950 font-mono text-xs">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Fetching live response from Apify API...</span>
            </div>
          ) : activeTab === "response" ? (
            <div>
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() =>
                    handleCopy(
                      typeof response?.data === "string"
                        ? response.data
                        : JSON.stringify(response?.data, null, 2)
                    )
                  }
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Payload"}
                </button>
              </div>
              <pre className="text-slate-200 leading-relaxed overflow-x-auto selection:bg-emerald-500/30 whitespace-pre-wrap">
                {response
                  ? typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data, null, 2)
                  : "// Click 'Send Request' to execute endpoint"}
              </pre>
            </div>
          ) : activeTab === "headers" ? (
            <div>
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => handleCopy(JSON.stringify(response?.headers || {}, null, 2))}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Headers"}
                </button>
              </div>
              {response?.headers ? (
                <div className="space-y-1.5">
                  {Object.entries(response.headers).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 py-1 border-b border-slate-900">
                      <span className="text-emerald-400 font-medium">{key}:</span>
                      <span className="col-span-2 text-slate-300 break-all">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500">No response headers available yet.</div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Terminal cURL command:</span>
                <button
                  onClick={() => handleCopy(curlCommand)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy cURL"}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 whitespace-pre-wrap leading-relaxed">
                {curlCommand}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Apify Platform API v2</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
