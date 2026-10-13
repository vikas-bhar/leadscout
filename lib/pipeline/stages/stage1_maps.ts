import { ApifyClient } from "apify-client";
import { PIPELINE_CONFIG } from "../config";
import { processMapsData } from "../dataQuality";
import {
  normalizeBusinessName,
  normalizePhoneNumber,
  normalizeWebsiteDomain,
  isBusinessExcluded,
} from "@/lib/deduplication";
import { hasNoWebsite } from "@/lib/website-filter";

const apifyToken =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "";
const apifyClient = apifyToken ? new ApifyClient({ token: apifyToken }) : null;
const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  "";

export interface MapsResult {
  placeId: string;
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  rating: number | null;
  reviewCount: number;
  website: string | null;
  phone: string | null;
  photoCount: number;
  hasHours: boolean;
  isVerified: boolean;
  mapsUrl: string;
  coordinates: { lat: number; lng: number } | null;
  reviews: Array<{
    text: string;
    rating: number;
    hasOwnerResponse: boolean;
  }>;
  unansweredNegativeReviews: number;
  priceLevel: string | null;
  openNow: boolean | null;
}

const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// 1. Direct Official Google Places API (New) with Pagination (up to 3 pages)
async function queryGooglePlacesAPI(
  query: string,
  targetCount: number,
  onProgress?: (message: string) => void,
  requireNoWebsite?: boolean
): Promise<MapsResult[]> {
  if (!googleMapsApiKey) return [];

  const allPlaces: Record<string, unknown>[] = [];
  let nextPageToken: string | undefined = undefined;
  let page = 0;
  const maxPages = 3;

  while (page < maxPages) {
    page++;
    if (page > 1) {
      onProgress?.(`Fetching page ${page} of Google Places results...`);
    }

    const requestBody: Record<string, unknown> = {
      textQuery: query,
      pageSize: 20,
    };
    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.primaryTypeDisplayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.photos,places.regularOpeningHours,places.googleMapsUri,places.location,places.reviews,places.priceLevel,nextPageToken,places.nextPageToken",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Google Places API error (Status: ${res.status}):`, errorBody);
      throw new Error(`Google Places API request failed (Status ${res.status}): ${errorBody}`);
    }

    const data = await res.json();
    const places = (data.places || []) as Record<string, unknown>[];
    allPlaces.push(...places);

    nextPageToken =
      (data.nextPageToken as string) ||
      (data.places?.nextPageToken as string) ||
      undefined;

    // Check if we already have enough results
    let currentEligibleCount = allPlaces.length;
    if (requireNoWebsite) {
      currentEligibleCount = allPlaces.filter((p) =>
        hasNoWebsite((p.websiteUri as string) || null)
      ).length;
    }

    if (currentEligibleCount >= targetCount || !nextPageToken) {
      break;
    }
  }

  if (allPlaces.length === 0) {
    return [];
  }

  return allPlaces.map((p: Record<string, unknown>, idx: number): MapsResult => {
    const displayName =
      (p.displayName as { text?: string })?.text || `Business #${idx + 1}`;
    const address = (p.formattedAddress as string) || query;
    const reviews = Array.isArray(p.reviews)
      ? (p.reviews as Array<Record<string, unknown>>).slice(0, 5).map((r) => ({
          text: (r.text as { text?: string })?.text || "",
          rating: Number(r.rating || 4),
          hasOwnerResponse: Boolean(r.authorAttribution),
        }))
      : [];

    const unansweredNegative = reviews.filter(
      (r) => r.rating <= 2 && !r.hasOwnerResponse
    ).length;
    const loc = p.location as { latitude?: number; longitude?: number } | undefined;

    return {
      placeId: String(p.id || `gplaces_${Date.now()}_${idx}`),
      name: displayName,
      category:
        (p.primaryTypeDisplayName as { text?: string })?.text || "Business",
      address,
      city: address.split(",").slice(-2, -1)[0]?.trim() || "",
      country: address.split(",").slice(-1)[0]?.trim() || "",
      rating: typeof p.rating === "number" ? p.rating : null,
      reviewCount: Number(p.userRatingCount || 0),
      website: (p.websiteUri as string) || null,
      phone: (p.nationalPhoneNumber as string) || null,
      photoCount: Array.isArray(p.photos) ? p.photos.length : 0,
      hasHours: Boolean(p.regularOpeningHours),
      isVerified: true,
      mapsUrl:
        (p.googleMapsUri as string) ||
        `https://maps.google.com/?q=${encodeURIComponent(
          displayName + " " + address
        )}`,
      coordinates: loc ? { lat: loc.latitude || 0, lng: loc.longitude || 0 } : null,
      reviews,
      unansweredNegativeReviews: unansweredNegative,
      priceLevel: (p.priceLevel as string) || null,
      openNow: Boolean(p.regularOpeningHours),
    };
  });
}

export async function scrapeGoogleMaps(
  searchQuery: string,
  maxResults: number,
  onProgress?: (message: string) => void,
  excludeNames?: string[],
  excludePlaceIds?: string[],
  excludePhones?: string[],
  excludeDomains?: string[],
  requireNoWebsite?: boolean
): Promise<MapsResult[]> {
  onProgress?.(`Searching local listings for: ${searchQuery}`);

  const excludedNamesSet = new Set(
    (excludeNames || []).map((n) => normalizeBusinessName(n)).filter(Boolean)
  );
  const excludedPhonesSet = new Set(
    (excludePhones || []).map((p) => normalizePhoneNumber(p)).filter(Boolean)
  );
  const excludedDomainsSet = new Set(
    (excludeDomains || []).map((d) => normalizeWebsiteDomain(d)).filter(Boolean)
  );
  const excludedIdsSet = new Set(excludePlaceIds || []);

  const filterOutDuplicates = (list: MapsResult[]): MapsResult[] => {
    const seenNames = new Set<string>();
    const seenPhones = new Set<string>();
    const seenDomains = new Set<string>();

    return list.filter((item) => {
      // Check against user's past leads and explicit exclusions
      if (
        isBusinessExcluded(
          {
            name: item.name,
            phone: item.phone,
            website: item.website,
            placeId: item.placeId,
            address: item.address,
          },
          {
            names: excludedNamesSet,
            phones: excludedPhonesSet,
            domains: excludedDomainsSet,
            placeIds: excludedIdsSet,
          }
        )
      ) {
        return false;
      }

      const normName = normalizeBusinessName(item.name);
      const normPhone = normalizePhoneNumber(item.phone);
      const normDomain = normalizeWebsiteDomain(item.website);

      // Deduplicate against other items in the same batch
      if (normName && seenNames.has(normName)) return false;
      if (normPhone && seenPhones.has(normPhone)) return false;
      if (normDomain && seenDomains.has(normDomain)) return false;

      if (normName) seenNames.add(normName);
      if (normPhone) seenPhones.add(normPhone);
      if (normDomain) seenDomains.add(normDomain);

      return true;
    });
  };

  // Tier 1: Official Google Places API (supports pagination up to 3 pages)
  if (googleMapsApiKey) {
    onProgress?.("Querying Official Google Places API...");
    // If a Places call fails, this will throw, which propagates a clear error
    const directResults = await queryGooglePlacesAPI(
      searchQuery,
      maxResults,
      onProgress,
      requireNoWebsite
    );

    if (directResults && directResults.length > 0) {
      let uniqueResults = filterOutDuplicates(directResults);
      if (requireNoWebsite) {
        uniqueResults = uniqueResults.filter((b) => hasNoWebsite(b.website));
      }
      if (uniqueResults.length > 0) {
        onProgress?.(`Discovered ${uniqueResults.length} places from Google Places API`);
        return uniqueResults.slice(0, maxResults);
      }
    }
  }

  // Tier 2: Apify Headless Crawler (only if APIFY_API_TOKEN is set)
  if (apifyClient && apifyToken) {
    try {
      onProgress?.("Checking Apify network crawler...");
      const apifyCall = async () => {
        const run = await apifyClient
          .actor(PIPELINE_CONFIG.actors.googleMaps)
          .call(
            {
              searchStrings: [searchQuery],
              maxCrawledPlaces: maxResults + 10,
              language: "en",
              maxReviews: 5,
              reviewsSort: "newest",
              exportPlaceUrls: false,
              additionalInfo: true,
            },
            {
              timeout: 15000,
            }
          );
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        return items;
      };

      const items = await timeoutPromise(apifyCall(), 12000);

      if (items && items.length > 0) {
        onProgress?.(`Found ${items.length} places via Apify. Normalizing...`);
        const { businesses } = processMapsData(items as Array<Record<string, unknown>>);
        let uniqueResults = filterOutDuplicates(businesses);
        if (requireNoWebsite) {
          uniqueResults = uniqueResults.filter((b) => hasNoWebsite(b.website));
        }
        if (uniqueResults.length > 0) {
          return uniqueResults.slice(0, maxResults);
        }
      }
    } catch (error) {
      console.log("Apify scraper notice:", (error as Error)?.message);
    }
  }

  // Tier 3: Return empty list (no fake data or synthetic fallbacks)
  return [];
}
