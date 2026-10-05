// Deduplication layer to remove duplicate places and keep richest records
import {
  normalizeBusinessName,
  normalizePhoneNumber,
  normalizeWebsiteDomain,
  normalizeLocation,
} from "@/lib/deduplication";

export function deduplicateBusinesses<T extends {
  placeId?: string;
  name?: string;
  address?: string;
  rating?: number | null;
  website?: string | null;
  phone?: string | null;
  photoCount?: number;
  reviews?: Array<unknown>;
  coordinates?: { lat: number; lng: number } | null;
}>(businesses: T[]): T[] {
  if (!Array.isArray(businesses) || businesses.length === 0) return [];

  const uniqueList: T[] = [];
  const keyToIndex = new Map<string, number>();

  for (const b of businesses) {
    const keys: string[] = [];

    if (b.placeId && !b.placeId.startsWith("gen_") && !b.placeId.startsWith("gm_auto_")) {
      keys.push(`place:${b.placeId}`);
    }

    const normPhone = normalizePhoneNumber(b.phone);
    if (normPhone) {
      keys.push(`phone:${normPhone}`);
    }

    const normDomain = normalizeWebsiteDomain(b.website);
    if (normDomain) {
      keys.push(`domain:${normDomain}`);
    }

    const normName = normalizeBusinessName(b.name);
    const normLoc = normalizeLocation(b.address);
    if (normName && normLoc) {
      keys.push(`nameloc:${normName}|${normLoc.slice(0, 15)}`);
    } else if (normName && normName.length >= 6) {
      keys.push(`name:${normName}`);
    }

    // Check if any key matches an existing entry
    let existingIndex = -1;
    for (const k of keys) {
      if (keyToIndex.has(k)) {
        existingIndex = keyToIndex.get(k)!;
        break;
      }
    }

    if (existingIndex === -1) {
      const newIndex = uniqueList.length;
      uniqueList.push(b);
      for (const k of keys) {
        keyToIndex.set(k, newIndex);
      }
    } else {
      const existing = uniqueList[existingIndex];
      if (dataCompleteness(b) > dataCompleteness(existing)) {
        uniqueList[existingIndex] = b;
      }
      for (const k of keys) {
        keyToIndex.set(k, existingIndex);
      }
    }
  }

  return uniqueList;
}

function dataCompleteness(b: {
  name?: string;
  address?: string;
  rating?: number | null;
  website?: string | null;
  phone?: string | null;
  photoCount?: number;
  reviews?: Array<unknown>;
  coordinates?: { lat: number; lng: number } | null;
}): number {
  return [b.name, b.address, b.rating !== null && b.rating !== undefined, b.website, b.phone, (b.photoCount || 0) > 0, (b.reviews?.length || 0) > 0, b.coordinates].filter(Boolean).length;
}
