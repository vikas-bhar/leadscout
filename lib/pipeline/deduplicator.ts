// Deduplication layer to remove duplicate places and keep richest records

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
  const seen = new Map<string, T>();

  for (const b of businesses) {
    const nameKey = (b.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    const fingerprint = b.placeId || `${nameKey}_${(b.address || "").slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    const existing = seen.get(fingerprint);
    if (!existing || dataCompleteness(b) > dataCompleteness(existing)) {
      seen.set(fingerprint, b);
    }
  }

  return Array.from(seen.values());
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
