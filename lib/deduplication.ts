// Comprehensive lead and business deduplication engine
// Ensures that leads are never repeated again and again across searches, sessions, or views.

import type { Lead } from "@/types";

/**
 * Normalizes business names for robust identity matching:
 * - Converts to lower case
 * - Converts '&' to 'and'
 * - Strips leading articles ('the', 'a', 'an')
 * - Strips common corporate suffixes and generic business descriptors (llc, inc, ltd, corp, co, etc.)
 * - Strips all non-alphanumeric characters except single spaces
 */
export function normalizeBusinessName(name?: string | null): string {
  if (!name || typeof name !== "string") return "";

  let cleaned = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['"’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Strip leading articles
  cleaned = cleaned.replace(/^(the|a|an)\s+/i, "").trim();

  // Strip common corporate suffixes and generic business descriptors at word boundaries
  cleaned = cleaned
    .replace(
      /\b(llc|inc|incorporated|ltd|limited|corp|corporation|co|company|group|services|enterprises|holdings|pllc|llp|gmbh|solutions|agency|pros|associates|clinic|studio|center|store|shop)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Extracts the core identity tokens from a business name
 * e.g., "Apex Plumbing Solutions" -> "apex"
 */
export function extractCoreBusinessTokens(name?: string | null): string {
  const norm = normalizeBusinessName(name);
  if (!norm) return "";
  // Split into tokens and remove very short words
  const tokens = norm.split(" ").filter((t) => t.length >= 3);
  return tokens.slice(0, 3).sort().join("_");
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
 * Normalizes website domain (e.g., "https://www.example.com/contact?ref=1" -> "example.com")
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
    trimmed === "no website" ||
    trimmed === "http://" ||
    trimmed === "https://"
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
    // If not a parseable URL, try regex
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
    return match ? match[1].toLowerCase() : "";
  }
}

/**
 * Normalizes Instagram handles (strips '@', URL prefixes, query parameters)
 */
export function normalizeInstagramHandle(handle?: string | null): string {
  if (!handle || typeof handle !== "string") return "";
  let cleaned = handle.trim().toLowerCase();
  cleaned = cleaned.replace(/^@/, "");
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  cleaned = cleaned.split(/[?#/]/)[0].trim();
  return cleaned.length >= 2 ? cleaned : "";
}

/**
 * Extracts city name from an address string
 */
export function extractCity(address?: string | null): string {
  if (!address || typeof address !== "string") return "";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Often City is second to last before state/country
    const candidate = parts[parts.length - 2];
    // Strip zip codes or state abbreviations
    const cleaned = candidate.replace(/[0-9]/g, "").trim().toLowerCase();
    if (cleaned.length >= 3) return cleaned;
  }
  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }
  return "";
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
    .slice(0, 40);
}

/**
 * Calculates string similarity between 0 and 1 using bigram Dice coefficient
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const s1 = str1.length < str2.length ? str1 : str2;
  const s2 = str1.length < str2.length ? str2 : str1;

  if (s1.length < 2) return s1 === s2 ? 1 : 0;

  // Substring check
  if (s2.includes(s1) && s1.length >= 4) {
    return s1.length / s2.length > 0.7 ? 0.9 : 0.75;
  }

  const bigrams = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams.get(bigram) || 0;
    if (count > 0) {
      bigrams.set(bigram, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length + s2.length - 2);
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
  instagramHandle?: string | null;
}): string[] {
  const keys: string[] = [];

  const rawName = item.businessName || item.name;
  const normName = normalizeBusinessName(rawName);
  const normPhone = normalizePhoneNumber(item.phone);
  const normDomain = normalizeWebsiteDomain(item.websiteUrl || item.website);
  const normIg = normalizeInstagramHandle(item.instagramHandle);
  const rawLoc = item.location || item.address;
  const normLoc = normalizeLocation(rawLoc);
  const city = extractCity(rawLoc);

  // 1. Phone number is an absolute unique identity
  if (normPhone) {
    keys.push(`phone:${normPhone}`);
  }

  // 2. Website domain is an absolute unique identity
  if (normDomain) {
    keys.push(`domain:${normDomain}`);
  }

  // 3. Instagram handle
  if (normIg) {
    keys.push(`ig:${normIg}`);
  }

  // 4. Normalized Business Name (CRITICAL: prevents identical business names from repeating)
  if (normName && normName.length >= 3) {
    keys.push(`name:${normName}`);
  }

  // 5. Name + Location combination
  if (normName && normLoc) {
    keys.push(`nameloc:${normName}|${normLoc.slice(0, 20)}`);
  }

  // 6. Name + City
  if (normName && city) {
    keys.push(`namecity:${normName}|${city}`);
  }

  // 7. Core token + City
  const core = extractCoreBusinessTokens(rawName);
  if (core && city && core.length >= 4) {
    keys.push(`corecity:${core}|${city}`);
  }

  // 8. Place ID
  if (item.placeId && !item.placeId.startsWith("gen_") && !item.placeId.startsWith("gm_auto_")) {
    keys.push(`place:${item.placeId}`);
  }

  return keys;
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
    !item.id.startsWith("lead_rank_") &&
    !item.id.startsWith("gen_") &&
    !item.id.startsWith("gm_auto_") &&
    item.id.length > 8
  ) {
    return item.id;
  }

  // Create hash seed from best available invariant properties
  const seed = normPhone
    ? `p_${normPhone}`
    : normDomain
    ? `d_${normDomain}`
    : normName && normLoc
    ? `nl_${normName}_${normLoc.slice(0, 25)}`
    : `n_${normName || "biz"}`;

  // Simple deterministic 32-bit string hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const cleanPrefix = normName.slice(0, 14).replace(/[^a-z0-9]/g, "") || "biz";
  return `lead_${cleanPrefix}_${Math.abs(hash).toString(36)}`;
}

/**
 * Checks if two business items are duplicates via multi-factor heuristics
 */
export function isDuplicateBusiness(
  itemA: {
    id?: string;
    businessName?: string;
    name?: string;
    phone?: string | null;
    websiteUrl?: string | null;
    website?: string | null;
    location?: string | null;
    address?: string | null;
    instagramHandle?: string | null;
    placeId?: string | null;
  },
  itemB: {
    id?: string;
    businessName?: string;
    name?: string;
    phone?: string | null;
    websiteUrl?: string | null;
    website?: string | null;
    location?: string | null;
    address?: string | null;
    instagramHandle?: string | null;
    placeId?: string | null;
  }
): boolean {
  // 1. Phone match
  const phoneA = normalizePhoneNumber(itemA.phone);
  const phoneB = normalizePhoneNumber(itemB.phone);
  if (phoneA && phoneB && phoneA === phoneB) return true;

  // 2. Domain match
  const domainA = normalizeWebsiteDomain(itemA.websiteUrl || itemA.website);
  const domainB = normalizeWebsiteDomain(itemB.websiteUrl || itemB.website);
  if (domainA && domainB && domainA === domainB) return true;

  // 3. Instagram match
  const igA = normalizeInstagramHandle(itemA.instagramHandle);
  const igB = normalizeInstagramHandle(itemB.instagramHandle);
  if (igA && igB && igA === igB) return true;

  // 4. PlaceId match
  if (
    itemA.placeId &&
    itemB.placeId &&
    !itemA.placeId.startsWith("gen_") &&
    !itemB.placeId.startsWith("gen_") &&
    itemA.placeId === itemB.placeId
  ) {
    return true;
  }

  // 5. Normalized business name match
  const nameA = normalizeBusinessName(itemA.businessName || itemA.name);
  const nameB = normalizeBusinessName(itemB.businessName || itemB.name);

  if (nameA && nameB) {
    if (nameA === nameB) return true;

    // Substring / word overlap with city check
    const cityA = extractCity(itemA.location || itemA.address);
    const cityB = extractCity(itemB.location || itemB.address);
    const sameCity = Boolean(cityA && cityB && cityA === cityB);

    if (sameCity) {
      if (nameA.includes(nameB) || nameB.includes(nameA)) return true;
      if (calculateStringSimilarity(nameA, nameB) >= 0.8) return true;
    } else {
      if (calculateStringSimilarity(nameA, nameB) >= 0.9) return true;
    }
  }

  return false;
}

/**
 * Checks if a candidate business matches any excluded names, phones, or domains
 */
export function isBusinessExcluded(
  candidate: {
    name?: string;
    businessName?: string;
    phone?: string | null;
    website?: string | null;
    websiteUrl?: string | null;
    placeId?: string | null;
    location?: string | null;
    address?: string | null;
  },
  exclusions: {
    names?: Set<string> | string[];
    phones?: Set<string> | string[];
    domains?: Set<string> | string[];
    placeIds?: Set<string> | string[];
  }
): boolean {
  const normName = normalizeBusinessName(candidate.businessName || candidate.name);
  const normPhone = normalizePhoneNumber(candidate.phone);
  const normDomain = normalizeWebsiteDomain(candidate.websiteUrl || candidate.website);
  const placeId = candidate.placeId;

  const namesSet = exclusions.names instanceof Set ? exclusions.names : new Set((exclusions.names || []).map(normalizeBusinessName).filter(Boolean));
  const phonesSet = exclusions.phones instanceof Set ? exclusions.phones : new Set((exclusions.phones || []).map(normalizePhoneNumber).filter(Boolean));
  const domainsSet = exclusions.domains instanceof Set ? exclusions.domains : new Set((exclusions.domains || []).map(normalizeWebsiteDomain).filter(Boolean));
  const placeIdsSet = exclusions.placeIds instanceof Set ? exclusions.placeIds : new Set(exclusions.placeIds || []);

  if (placeId && placeIdsSet.has(placeId)) return true;
  if (normPhone && phonesSet.has(normPhone)) return true;
  if (normDomain && domainsSet.has(normDomain)) return true;
  if (normName && namesSet.has(normName)) return true;

  // Fuzzy match against excluded names
  if (normName && normName.length >= 4) {
    for (const exName of Array.from(namesSet)) {
      if (exName && (exName === normName || exName.includes(normName) || normName.includes(exName))) {
        return true;
      }
      if (calculateStringSimilarity(normName, exName) >= 0.85) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Deduplicates an array of leads, keeping the most complete record and
 * preserving user modifications (status, tags, notes, pitches, folder).
 */
export function deduplicateLeads<T extends Lead | Record<string, unknown>>(leads: T[]): T[] {
  if (!Array.isArray(leads) || leads.length === 0) return [];

  const uniqueList: T[] = [];
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
      instagramHandle: item.instagramHandle,
    });

    if (item.id && item.id !== "undefined" && item.id !== "null") {
      itemKeys.push(`id:${item.id}`);
    }

    // Pass 1: Direct key lookup
    let existingIndex = -1;
    for (const k of itemKeys) {
      if (keyToIndex.has(k)) {
        existingIndex = keyToIndex.get(k)!;
        break;
      }
    }

    // Pass 2: If no key match, do a fuzzy check against existing entries
    if (existingIndex === -1 && uniqueList.length > 0) {
      for (let i = 0; i < uniqueList.length; i++) {
        const existing = uniqueList[i] as unknown as Lead;
        if (isDuplicateBusiness(existing, item)) {
          existingIndex = i;
          break;
        }
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
      // Merge with existing record to keep richest data and user modifications
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
    // Prefer earlier creation date
    createdAt:
      existing.createdAt && incoming.createdAt
        ? new Date(existing.createdAt) < new Date(incoming.createdAt)
          ? existing.createdAt
          : incoming.createdAt
        : existing.createdAt || incoming.createdAt || new Date().toISOString(),
  };
}
