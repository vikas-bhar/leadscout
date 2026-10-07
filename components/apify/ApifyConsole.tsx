"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ApifyActorRun, ApifyDatasetItem, ApifyRunInput } from "@/types/apify";
import { ApifyHeader } from "./ApifyHeader";
import { RunSummaryHeader } from "./RunSummaryHeader";
import { RunOverviewTab } from "./RunOverviewTab";
import { DatasetTab } from "./DatasetTab";
import { InputRecordTab } from "./InputRecordTab";
import { LogsTab } from "./LogsTab";
import { ApiTestBenchTab } from "./ApiTestBenchTab";
import { TokenModal } from "./TokenModal";
import { EndpointTestModal } from "./EndpointTestModal";
import { toast } from "sonner";

const DEFAULT_RUN_ID = "nIH0dNyLGe66edgys";
const DEFAULT_KVS_ID = "BuQtnXkouKFscVWBd";
const DEFAULT_DATASET_ID = "b1wOSq2O5NFTnJfpi";
const DEFAULT_TOKEN = "";

export function ApifyConsole() {
  const [runId, setRunId] = useState(DEFAULT_RUN_ID);
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [activeTab, setActiveTab] = useState<"overview" | "dataset" | "input" | "logs" | "endpoints">("overview");

  // State data
  const [run, setRun] = useState<ApifyActorRun | null>(null);
  const [inputData, setInputData] = useState<ApifyRunInput | null>(null);
  const [datasetItems, setDatasetItems] = useState<ApifyDatasetItem[]>([]);
  const [logText, setLogText] = useState<string>("");

  // Loading flags
  const [loadingRun, setLoadingRun] = useState(false);
  const [loadingInput, setLoadingInput] = useState(false);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh polling
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);

  // Modals
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [testModalConfig, setTestModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    method: "GET" | "POST";
    urlTemplate: string;
    actualUrl: string;
    defaultBody?: unknown;
  }>({
    isOpen: false,
    title: "",
    method: "GET",
    urlTemplate: "",
    actualUrl: "",
  });

  // Load saved token from localStorage on client mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("apify_custom_token");
      if (savedToken) {
        setToken(savedToken);
      }
      const savedRunId = localStorage.getItem("apify_target_run_id");
      if (savedRunId) {
        setRunId(savedRunId);
      }
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const handleSaveToken = (newToken: string) => {
    setToken(newToken || DEFAULT_TOKEN);
    try {
      if (newToken) {
        localStorage.setItem("apify_custom_token", newToken);
      } else {
        localStorage.removeItem("apify_custom_token");
      }
    } catch {
      // Ignore
    }
    toast.success("Apify API Token updated");
  };

  const handleSetRunId = (newRunId: string) => {
    setRunId(newRunId);
    try {
      localStorage.setItem("apify_target_run_id", newRunId);
    } catch {
      // Ignore
    }
    toast.info(`Loaded Actor Run ${newRunId}`);
  };

  // 1. Fetch Run details
  const fetchRun = useCallback(async () => {
    setLoadingRun(true);
    try {
      const res = await fetch(`/api/apify/run?runId=${encodeURIComponent(runId)}&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRun(json.data);
      } else {
        toast.error(json.error || "Failed to fetch run details");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to contact Apify API";
      toast.error(msg);
    } finally {
      setLoadingRun(false);
    }
  }, [runId, token]);

  // 2. Fetch Input record
  const fetchInput = useCallback(async (kvsIdToUse?: string) => {
    const kvsId = kvsIdToUse || run?.defaultKeyValueStoreId || DEFAULT_KVS_ID;
    setLoadingInput(true);
    try {
      const res = await fetch(`/api/apify/input?kvsId=${encodeURIComponent(kvsId)}&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setInputData(json.data);
      }
    } catch (err: unknown) {
      console.error("Input fetch error:", err);
    } finally {
      setLoadingInput(false);
    }
  }, [run?.defaultKeyValueStoreId, token]);

  // 3. Fetch Dataset items
  const fetchDataset = useCallback(async (datasetIdToUse?: string) => {
    const datasetId = datasetIdToUse || run?.defaultDatasetId || DEFAULT_DATASET_ID;
    setLoadingDataset(true);
    try {
      const res = await fetch(`/api/apify/dataset?datasetId=${encodeURIComponent(datasetId)}&token=${encodeURIComponent(token)}&limit=100`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDatasetItems(json.data);
      }
    } catch (err: unknown) {
      console.error("Dataset fetch error:", err);
    } finally {
      setLoadingDataset(false);
    }
  }, [run?.defaultDatasetId, token]);

  // 4. Fetch Logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/apify/log?runId=${encodeURIComponent(runId)}&token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.success && typeof json.log === "string") {
        setLogText(json.log);
      }
    } catch (err: unknown) {
      console.error("Log fetch error:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [runId, token]);

  // Refresh all
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchRun(), fetchInput(), fetchDataset(), fetchLogs()]);
    setIsRefreshing(false);
  }, [fetchRun, fetchInput, fetchDataset, fetchLogs]);

  // Initial load on mount or runId/token change
  useEffect(() => {
    handleRefreshAll();
  }, [handleRefreshAll]);

  // Auto-refresh polling timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchRun();
      fetchLogs();
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchRun, fetchLogs]);

  // Abort Run handler
  const handleAbortRun = async () => {
    if (!confirm(`Are you sure you want to abort actor run ${runId}?`)) return;
    try {
      const res = await fetch("/api/apify/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, action: "abort", token }),
      });
      const data = await res.json();
      if (data.success) {
        toast.warning("Abort signal sent to actor run");
        fetchRun();
      } else {
        toast.error(data.error || "Failed to abort run");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to abort run";
      toast.error(msg);
    }
  };

  // Resurrect Run handler
  const handleResurrectRun = async () => {
    try {
      const res = await fetch("/api/apify/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, action: "resurrect", token }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Actor run resurrected successfully");
        fetchRun();
      } else {
        toast.error(data.error || "Failed to resurrect run");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resurrect run";
      toast.error(msg);
    }
  };

  // Open Test Endpoint modal
  const handleOpenTestEndpoint = (endpointId: string) => {
    const kvsId = run?.defaultKeyValueStoreId || DEFAULT_KVS_ID;
    const datasetId = run?.defaultDatasetId || DEFAULT_DATASET_ID;

    switch (endpointId) {
      case "get-run":
        setTestModalConfig({
          isOpen: true,
          title: "Get run",
          method: "GET",
          urlTemplate: `https://api.apify.com/v2/actor-runs/${runId}?token=***`,
          actualUrl: `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`,
        });
        break;

      case "get-input":
        setTestModalConfig({
          isOpen: true,
          title: "Get input",
          method: "GET",
          urlTemplate: `https://api.apify.com/v2/key-value-stores/${kvsId}/records/INPUT?token=***`,
          actualUrl: `https://api.apify.com/v2/key-value-stores/${kvsId}/records/INPUT?token=${token}`,
        });
        break;

      case "get-dataset":
        setTestModalConfig({
          isOpen: true,
          title: "Get dataset items",
          method: "GET",
          urlTemplate: `https://api.apify.com/v2/datasets/${datasetId}/items?token=***`,
          actualUrl: `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`,
        });
        break;

      case "get-log":
        setTestModalConfig({
          isOpen: true,
          title: "Get log",
          method: "GET",
          urlTemplate: `https://api.apify.com/v2/logs/${runId}?token=***`,
          actualUrl: `https://api.apify.com/v2/logs/${runId}?token=${token}`,
        });
        break;

      case "abort-run":
        setTestModalConfig({
          isOpen: true,
          title: "Abort run",
          method: "POST",
          urlTemplate: `https://api.apify.com/v2/actor-runs/${runId}/abort?token=***`,
          actualUrl: `https://api.apify.com/v2/actor-runs/${runId}/abort?token=${token}`,
        });
        break;

      case "resurrect-run":
        setTestModalConfig({
          isOpen: true,
          title: "Resurrect run",
          method: "POST",
          urlTemplate: `https://api.apify.com/v2/actor-runs/${runId}/resurrect?token=***`,
          actualUrl: `https://api.apify.com/v2/actor-runs/${runId}/resurrect?token=${token}`,
        });
        break;
    }
  };

  const currentDatasetId = run?.defaultDatasetId || DEFAULT_DATASET_ID;
  const currentKvsId = run?.defaultKeyValueStoreId || DEFAULT_KVS_ID;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <ApifyHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        runId={runId}
        setRunId={handleSetRunId}
        token={token}
        onOpenTokenModal={() => setTokenModalOpen(true)}
        onRefreshAll={handleRefreshAll}
        isRefreshing={isRefreshing}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        datasetItemCount={datasetItems.length}
        onAbortRun={handleAbortRun}
        onResurrectRun={handleResurrectRun}
        runStatus={run?.status}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Metric Summary Header */}
        <RunSummaryHeader
          run={run}
          loading={loadingRun}
          onOpenTestEndpoint={handleOpenTestEndpoint}
          datasetItemCount={datasetItems.length}
        />

        {/* Tab Views */}
        {activeTab === "overview" && (
          <RunOverviewTab
            run={run}
            onOpenTestEndpoint={handleOpenTestEndpoint}
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === "dataset" && (
          <DatasetTab
            items={datasetItems}
            loading={loadingDataset}
            datasetId={currentDatasetId}
            onRefresh={() => fetchDataset(currentDatasetId)}
            onOpenTestEndpoint={handleOpenTestEndpoint}
          />
        )}

        {activeTab === "input" && (
          <InputRecordTab
            inputData={inputData}
            loading={loadingInput}
            kvsId={currentKvsId}
            onRefresh={() => fetchInput(currentKvsId)}
            onOpenTestEndpoint={handleOpenTestEndpoint}
          />
        )}

        {activeTab === "logs" && (
          <LogsTab
            logText={logText}
            loading={loadingLogs}
            runId={runId}
            onRefresh={fetchLogs}
            onOpenTestEndpoint={handleOpenTestEndpoint}
          />
        )}

        {activeTab === "endpoints" && (
          <ApiTestBenchTab
            runId={runId}
            kvsId={currentKvsId}
            datasetId={currentDatasetId}
            token={token}
            onOpenTestEndpoint={handleOpenTestEndpoint}
          />
        )}
      </main>

      {/* Token Modal */}
      <TokenModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        token={token}
        onSaveToken={handleSaveToken}
        defaultToken={DEFAULT_TOKEN}
      />

      {/* Endpoint Test Modal */}
      <EndpointTestModal
        isOpen={testModalConfig.isOpen}
        onClose={() => setTestModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={testModalConfig.title}
        method={testModalConfig.method}
        urlTemplate={testModalConfig.urlTemplate}
        actualUrl={testModalConfig.actualUrl}
        token={token}
        defaultBody={testModalConfig.defaultBody}
      />
    </div>
  );
}
