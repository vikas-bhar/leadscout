export interface ApifyActorRun {
  id: string;
  actId: string;
  userId: string;
  startedAt: string;
  finishedAt?: string | null;
  status: "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMING-OUT" | "TIMED-OUT" | "ABORTING" | "ABORTED";
  statusMessage?: string;
  isStatusMessageTerminal?: boolean;
  meta?: {
    origin?: string;
    userAgent?: string;
  };
  stats?: {
    inputBodyLen?: number;
    restartCount?: number;
    resurrectCount?: number;
    memAvgBytes?: number;
    memMaxBytes?: number;
    memCurrentBytes?: number;
    cpuAvgUsage?: number;
    cpuMaxUsage?: number;
    cpuCurrentUsage?: number;
    netRxBytes?: number;
    netTxBytes?: number;
    durationMillis?: number;
    runTimeSecs?: number;
    computeUnits?: number;
  };
  options?: {
    build?: string;
    timeoutSecs?: number;
    memoryMbytes?: number;
    diskMbytes?: number;
  };
  buildId?: string;
  buildNumber?: string;
  exitCode?: number;
  defaultKeyValueStoreId: string;
  defaultDatasetId: string;
  defaultRequestQueueId?: string;
  containerUrl?: string;
  usageTotalUsd?: number;
  usageUsd?: {
    ACTOR_COMPUTE_UNITS?: number;
    DATASET_READS?: number;
    DATASET_WRITES?: number;
    KEY_VALUE_STORE_READS?: number;
    KEY_VALUE_STORE_WRITES?: number;
    REQUEST_QUEUE_READS?: number;
    REQUEST_QUEUE_WRITES?: number;
    DATA_TRANSFER_EXTERNAL_GBYTES?: number;
    PROXY_SERPS?: number;
    PROXY_RESIDENTIAL_TRANSFER_GBYTES?: number;
  };
}

export interface ApifyDatasetItem {
  id?: string;
  publicIdentifier?: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  openToWork?: boolean;
  hiring?: boolean;
  premium?: boolean;
  influencer?: boolean;
  memorialized?: boolean;
  creator?: boolean;
  location?: {
    linkedinText?: string;
    countryCode?: string;
    parsed?: {
      text?: string;
      country?: string;
      state?: string;
      city?: string;
    };
  };
  emails?: string[];
  [key: string]: any;
}

export interface ApifyRunInput {
  companies?: string[];
  maxItems?: number;
  recentlyChangedJobs?: boolean;
  profileScraperMode?: string;
  companyBatchMode?: string;
  [key: string]: any;
}

export interface ApifyEndpointConfig {
  id: string;
  title: string;
  description: string;
  method: "GET" | "POST";
  urlTemplate: string;
  actualUrl: string;
  defaultBody?: any;
}

export interface TestEndpointResult {
  url: string;
  method: string;
  status: number;
  statusText: string;
  latencyMs: number;
  contentType?: string;
  headers?: Record<string, string>;
  data: any;
  error?: string;
}
