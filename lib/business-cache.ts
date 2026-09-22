import type { ScrapedLinkData } from "./analyzer/scrapeLink";
import type { AnalyzerResultData, Lead } from "@/types";

export interface CachedAnalysisEntry {
  url: string;
  normalizedKey: string;
  scrapedData: ScrapedLinkData;
  analysis: AnalyzerResultData;
  lead: Lead;
  timestamp: number;
  expiresAt: number;
}

export interface CachedPlacesEntry {
  searchKey: string;
  results: unknown[] | null;
  timestamp: number;
  expiresAt: number;
}

// 24 Hours in Milliseconds
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Global memory cache maps (persists across requests within the Node.js runtime)
declare global {
  // eslint-disable-next-line no-var
  var __businessAnalysisCache: Map<string, CachedAnalysisEntry> | undefined;
  // eslint-disable-next-line no-var
  var __businessPlacesCache: Map<string, CachedPlacesEntry> | undefined;
}

const analysisCache: Map<string, CachedAnalysisEntry> =
  globalThis.__businessAnalysisCache || new Map<string, CachedAnalysisEntry>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__businessAnalysisCache = analysisCache;
}

const placesCache: Map<string, CachedPlacesEntry> =
  globalThis.__businessPlacesCache || new Map<string, CachedPlacesEntry>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__businessPlacesCache = placesCache;
}

/**
 * Normalizes URL or identifier to ensure consistent cache hits
 */
export function normalizeCacheKey(urlOrQuery: string): string {
  if (!urlOrQuery) return "";
  try {
    const trimmed = urlOrQuery.trim().toLowerCase();
    const withProto = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProto);
    // Normalize hostname without www and remove trailing slashes
    const host = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return `${host}${pathname}${parsed.search}`;
  } catch {
    return urlOrQuery.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Retrieves cached business gap analysis if available and within 24 hours
 */
export function getCachedAnalysis(url: string): CachedAnalysisEntry | null {
  const key = normalizeCacheKey(url);
  if (!key) return null;

  const entry = analysisCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    analysisCache.delete(key);
    return null;
  }

  return entry;
}

/**
 * Stores business gap analysis result in cache for 24 hours
 */
export function setCachedAnalysis(
  url: string,
  data: {
    scrapedData: ScrapedLinkData;
    analysis: AnalyzerResultData;
    lead: Lead;
  }
): void {
  const key = normalizeCacheKey(url);
  if (!key) return;

  const now = Date.now();
  const entry: CachedAnalysisEntry = {
    url,
    normalizedKey: key,
    scrapedData: data.scrapedData,
    analysis: data.analysis,
    lead: data.lead,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  analysisCache.set(key, entry);

  // Periodic pruning of expired entries if cache grows large
  if (analysisCache.size > 500) {
    pruneExpiredAnalysisCache();
  }
}

/**
 * Retrieves cached Apify Places results for a search query within 24 hours
 */
export function getCachedPlaces(searchKey: string): unknown[] | null {
  const key = normalizeCacheKey(searchKey);
  if (!key) return null;

  const entry = placesCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    placesCache.delete(key);
    return null;
  }

  return entry.results;
}

/**
 * Stores Apify Places search results for 24 hours
 */
export function setCachedPlaces(searchKey: string, results: unknown[] | null): void {
  const key = normalizeCacheKey(searchKey);
  if (!key) return;

  const now = Date.now();
  const entry: CachedPlacesEntry = {
    searchKey,
    results,
    timestamp: now,
    expiresAt: now + CACHE_TTL_MS,
  };

  placesCache.set(key, entry);

  if (placesCache.size > 500) {
    pruneExpiredPlacesCache();
  }
}

function pruneExpiredAnalysisCache() {
  const now = Date.now();
  analysisCache.forEach((v, k) => {
    if (now > v.expiresAt) {
      analysisCache.delete(k);
    }
  });
}

function pruneExpiredPlacesCache() {
  const now = Date.now();
  placesCache.forEach((v, k) => {
    if (now > v.expiresAt) {
      placesCache.delete(k);
    }
  });
}
