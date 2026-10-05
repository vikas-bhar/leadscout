// Comprehensive lead and business deduplication engine
// Prevents duplicate leads from being saved, scraped, or displayed repeatedly.

import type { Lead } from "@/types";

/**
 * Normalizes business names for robust identity matching:
 * - Converts to lower case
 * - Converts '&' to 'and'
 * - Strips common corporate suffixes (llc, inc, ltd, corp, co, etc.)
 * - Strips all non-alphanumeric characters except single spaces
 */
export function normalizeBusinessName(name?: string | null): string {
  if (!name || typeof name !== "string") return "";

  let cleaned = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Strip common corporate suffixes at word boundaries
  cleaned = cleaned
    .replace(/\b(llc|inc|incorporated|ltd|limited|corp|corporation|co|company|group|services|enterprises|holdings|pllc|llp|gmbh)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Normalizes phone numbers to standard digit strings (e.g. "5551234567")
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/[^0-9]/g, "");

  // If 11 digits starting with US/CA country code 1, strip 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits.length >= 7 ? digits : "";
}

/**
 * Normalizes website domain (e.g., "https://www.example.com/contact" -> "example.com")
 */
export function normalizeWebsiteDomain(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim().toLowerCase();

  // Exclude placeholder and invalid values
  if (
    !trimmed ||
    trimmed === "none" ||
    trimmed === "n/a" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "false" ||
    trimmed === "no website"
  ) {
    return "";
  }

  try {
    const withProto = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    if (hostname.startsWith("m.")) {
      hostname = hostname.slice(2);
    }
    return hostname.includes(".") ? hostname : "";
  } catch {
    return "";
  }
}

/**
 * Normalizes location / address for matching
 */
export function normalizeLocation(loc?: string | null): string {
  if (!loc || typeof loc !== "string") return "";
  return loc
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 35);
}

/**
 * Generates a stable, deterministic ID for any business so identical businesses
 * have matching IDs across multiple search runs and storage sessions.
 */
export function generateDeterministicLeadId(item: {
  id?: string;
  businessName?: string;
  name?: string;
  phone?: string | null;
  location?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  website?: string | null;
}): string {
  const normName = normalizeBusinessName(item.businessName || item.name);
  const normPhone = normalizePhoneNumber(item.phone);
  const normDomain = normalizeWebsiteDomain(item.websiteUrl || item.website);
  const normLoc = normalizeLocation(item.location || item.address);

  // If already a valid custom ID that is NOT a random timestamp
  if (
    item.id &&
    !item.id.includes("undefined") &&
    !item.id.includes("null") &&
    !item.id.startsWith("lead_") &&
    item.id.length > 5
  ) {
    return item.id;
  }

  // Create hash seed from best available invariant properties
  const seed = normPhone
    ? `p_${normPhone}`
    : normDomain
    ? `d_${normDomain}`
    : `nl_${normName}_${normLoc}`;

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const cleanPrefix = normName.slice(0, 12).replace(/[^a-z0-9]/g, "") || "biz";
  return `lead_${cleanPrefix}_${Math.abs(hash).toString(36)}`;
}

/**
 * Returns all identity keys/fingerprints for a business entity
 */
export function getBusinessFingerprints(item: {
  id?: string;
  name?: string;
  businessName?: string;
  phone?: string | null;
  website?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  location?: string | null;
  placeId?: string | null;
  mapsUrl?: string | null;
}): string[] {
  const keys: string[] = [];

  const normPhone = normalizePhoneNumber(item.phone);
  if (normPhone) {
    keys.push(`phone:${normPhone}`);
  }

  const normDomain = normalizeWebsiteDomain(item.websiteUrl || item.website);
  if (normDomain) {
    keys.push(`domain:${normDomain}`);
  }

  const normName = normalizeBusinessName(item.businessName || item.name);
  const normLoc = normalizeLocation(item.location || item.address);

  if (normName && normLoc) {
    keys.push(`nameloc:${normName}|${normLoc.slice(0, 15)}`);
  }

  if (item.placeId && !item.placeId.startsWith("gen_") && !item.placeId.startsWith("gm_auto_")) {
    keys.push(`place:${item.placeId}`);
  }

  // If only name is known (distinct name >= 5 characters)
  if (normName && normName.length >= 5 && !normLoc && !normPhone && !normDomain) {
    keys.push(`nameonly:${normName}`);
  }

  return keys;
}

/**
 * Deduplicates an array of leads, keeping the most complete record and
 * preserving user modifications (status, tags, notes, pitches, folder).
 */
export function deduplicateLeads<T extends Lead | Record<string, unknown>>(leads: T[]): T[] {
  if (!Array.isArray(leads) || leads.length === 0) return [];

  const uniqueList: T[] = [];
  // Fingerprint index -> index in uniqueList
  const keyToIndex = new Map<string, number>();

  for (const rawItem of leads) {
    const item = rawItem as unknown as Lead;
    const itemKeys = getBusinessFingerprints({
      id: item.id,
      businessName: item.businessName,
      phone: item.phone,
      websiteUrl: item.websiteUrl,
      location: item.location,
      mapsUrl: item.mapsUrl,
    });

    // Also include ID if present
    if (item.id && item.id !== "undefined" && item.id !== "null") {
      itemKeys.push(`id:${item.id}`);
    }

    // Find if we've already seen any of these keys
    let existingIndex = -1;
    for (const k of itemKeys) {
      if (keyToIndex.has(k)) {
        existingIndex = keyToIndex.get(k)!;
        break;
      }
    }

    if (existingIndex === -1) {
      // New unique business lead
      const newIndex = uniqueList.length;
      uniqueList.push(rawItem);
      for (const k of itemKeys) {
        keyToIndex.set(k, newIndex);
      }
    } else {
      // Merge with existing record to keep richest data and user changes
      const existing = uniqueList[existingIndex] as unknown as Lead;
      const merged = mergeLeadRecords(existing, item) as unknown as T;
      uniqueList[existingIndex] = merged;

      // Register all keys for both records
      for (const k of itemKeys) {
        keyToIndex.set(k, existingIndex);
      }
    }
  }

  return uniqueList;
}

/**
 * Merges two lead representations of the same business, prioritizing user-entered
 * data (status, tags, notes, folders) and richest scraped fields.
 */
function mergeLeadRecords(existing: Lead, incoming: Lead): Lead {
  const isStatusModified = existing.status && existing.status !== "new";
  const finalStatus = isStatusModified ? existing.status : incoming.status || "new";

  // Merge tags uniquely
  const existingTags = Array.isArray(existing.tags) ? existing.tags : [];
  const incomingTags = Array.isArray(incoming.tags) ? incoming.tags : [];
  const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));

  // Merge gaps
  const existingGaps = Array.isArray(existing.gapsFound) ? existing.gapsFound : [];
  const incomingGaps = Array.isArray(incoming.gapsFound) ? incoming.gapsFound : [];
  const gaps = existingGaps.length >= incomingGaps.length ? existingGaps : incomingGaps;

  // Opportunity score: take highest valid score
  const score = Math.max(existing.opportunityScore || 0, incoming.opportunityScore || 0);

  return {
    ...incoming,
    ...existing,
    // Preserve user fields
    status: finalStatus,
    tags: mergedTags,
    notes: existing.notes || incoming.notes || null,
    folderId: existing.folderId || incoming.folderId || null,
    folderName: existing.folderName || incoming.folderName || null,
    contactedAt: existing.contactedAt || incoming.contactedAt || null,
    // Retain higher score and non-empty data
    opportunityScore: score > 0 ? score : existing.opportunityScore || incoming.opportunityScore || 70,
    phone: existing.phone || incoming.phone || null,
    websiteUrl: existing.websiteUrl || incoming.websiteUrl || null,
    hasWebsite: existing.hasWebsite || incoming.hasWebsite || false,
    instagramHandle: existing.instagramHandle || incoming.instagramHandle || null,
    instagramFollowers: existing.instagramFollowers || incoming.instagramFollowers || null,
    gapsFound: gaps,
    pitches: existing.pitches && existing.pitches.pitches?.length > 0 ? existing.pitches : incoming.pitches,
    // Prefer original creation date if earlier
    createdAt:
      existing.createdAt && incoming.createdAt
        ? new Date(existing.createdAt) < new Date(incoming.createdAt)
          ? existing.createdAt
          : incoming.createdAt
        : existing.createdAt || incoming.createdAt || new Date().toISOString(),
  };
}
