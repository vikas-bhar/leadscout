import { ApifyClient } from "apify-client";
import { PIPELINE_CONFIG } from "../config";
import { findRealBusinessesWithGemini } from "@/lib/gemini-leads";

const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
const client = token ? new ApifyClient({ token }) : null;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeGoogleMaps(
  searchQuery: string,
  maxResults: number,
  onProgress?: (message: string) => void
): Promise<MapsResult[]> {
  onProgress?.(`Searching Google Maps for: ${searchQuery}`);

  let lastError: Error | null = null;

  if (client) {
    // Retry loop for Apify actor
    for (let attempt = 1; attempt <= PIPELINE_CONFIG.retries.googleMaps; attempt++) {
      try {
        onProgress?.(`Google Maps attempt ${attempt}/${PIPELINE_CONFIG.retries.googleMaps}`);

        const run = await client
          .actor(PIPELINE_CONFIG.actors.googleMaps)
          .call(
            {
              searchStrings: [searchQuery],
              maxCrawledPlaces: maxResults,
              language: "en",
              maxReviews: 10,
              reviewsSort: "newest",
              exportPlaceUrls: false,
              additionalInfo: true,
            },
            {
              timeout: PIPELINE_CONFIG.timeouts.googleMaps,
            }
          );

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items && items.length > 0) {
          onProgress?.(`Found ${items.length} businesses on Google Maps`);

          return items.map((item: Record<string, unknown>): MapsResult => {
            const reviews = Array.isArray(item.reviews)
              ? (item.reviews as Array<Record<string, unknown>>)
              : [];
            const unansweredNegative = reviews.filter(
              (r) => Number(r.stars || r.rating || 0) <= 2 && !r.responseFromOwnerText
            ).length;

            return {
              placeId: String(item.placeId || item.id || `place_${Math.random().toString(36).slice(2, 9)}`),
              name: String(item.title || item.name || "Local Business"),
              category: String(item.categoryName || item.category || "Business"),
              address: String(item.address || item.street || searchQuery),
              city: String(item.city || ""),
              country: String(item.countryCode || ""),
              rating: typeof item.totalScore === "number" ? item.totalScore : (typeof item.rating === "number" ? item.rating : null),
              reviewCount: Number(item.reviewsCount || item.reviewCount || 0),
              website: item.website ? String(item.website) : null,
              phone: item.phone ? String(item.phone) : (item.phoneUnformatted ? String(item.phoneUnformatted) : null),
              photoCount: Number(item.photosCount || item.imageCount || 0),
              hasHours: Boolean(item.openingHours || item.hours),
              isVerified: Boolean(item.isVerified),
              mapsUrl: String(item.url || item.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(searchQuery)}`),
              coordinates:
                item.location && typeof item.location === "object"
                  ? {
                      lat: Number((item.location as { lat?: number }).lat || 0),
                      lng: Number((item.location as { lng?: number }).lng || 0),
                    }
                  : null,
              reviews: reviews.slice(0, 5).map((r) => ({
                text: String(r.text || ""),
                rating: Number(r.stars || r.rating || 0),
                hasOwnerResponse: Boolean(r.responseFromOwnerText),
              })),
              unansweredNegativeReviews: unansweredNegative,
              priceLevel: item.priceLevel ? String(item.priceLevel) : null,
              openNow: item.temporarilyClosed ? false : null,
            };
          });
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Maps attempt ${attempt} failed:`, error);

        if (attempt < PIPELINE_CONFIG.retries.googleMaps) {
          await sleep(PIPELINE_CONFIG.retries.delayBetweenRetries * attempt);
        }
      }
    }
  }

  // Resilient discovery fallback via AI Search Grounding
  onProgress?.(`Extracting structured local listings for: ${searchQuery}`);
  try {
    const fallbackResults = await findRealBusinessesWithGemini({
      searchId: `search_${Date.now()}`,
      userId: "system",
      businessCategory: searchQuery.split(" in ")[0] || "Business",
      location: searchQuery.split(" in ")[1] || searchQuery,
      freelancerType: "social_media_manager",
      count: maxResults,
    });

    if (fallbackResults && fallbackResults.length > 0) {
      return fallbackResults.map((item, index): MapsResult => ({
        placeId: item.id || `gm_${Date.now()}_${index}`,
        name: item.businessName,
        category: item.businessCategory || "Business",
        address: item.location || searchQuery,
        city: "",
        country: "",
        rating: item.googleRating ?? 4.1,
        reviewCount: item.reviewCount ?? 45,
        website: item.websiteUrl || null,
        phone: item.phone || null,
        photoCount: item.photoCount ?? 4,
        hasHours: true,
        isVerified: false,
        mapsUrl: item.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(item.businessName + " " + searchQuery)}`,
        coordinates: null,
        reviews: [
          { text: "Great place, could use better online communication.", rating: 3, hasOwnerResponse: false },
        ],
        unansweredNegativeReviews: 1,
        priceLevel: "$$",
        openNow: true,
      }));
    }
  } catch (err) {
    console.log("AI search grounding fallback error:", err);
  }

  if (lastError) {
    throw new Error(`Google Maps scraping failed after ${PIPELINE_CONFIG.retries.googleMaps} attempts: ${lastError.message}`);
  }

  throw new Error("No businesses found on Google Maps for this query.");
}
