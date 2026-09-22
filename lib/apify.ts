import { ApifyClient } from "apify-client";
import { getCachedPlaces, setCachedPlaces } from "./business-cache";

export interface ApifyGoogleMapsSearchParams {
  businessType: string;
  country?: string;
  city?: string;
  place?: string;
  location?: string;
  maxResults?: number;
}

export function buildApifySearchString(params: ApifyGoogleMapsSearchParams): string {
  const { businessType, country = "", city = "", place = "", location = "" } = params;

  if (location && !country && !city && !place) {
    return `${businessType} in ${location}`.trim();
  }

  const locationParts = [place.trim(), city.trim(), country.trim()].filter(Boolean);
  const loc = locationParts.length > 0 ? locationParts.join(", ") : location.trim();

  if (!loc) return businessType.trim();
  return `${businessType} in ${loc}`.trim();
}

/**
 * Executes or prepares the Apify Google Maps Actor run with 24-hour caching.
 * Repeated calls with the same search string within 24 hours do not consume API resources.
 */
export async function runApifyGoogleMapsScraper(params: ApifyGoogleMapsSearchParams) {
  const searchString = buildApifySearchString(params);

  // 1. Check 24-hour cache layer
  const cached = getCachedPlaces(searchString);
  if (cached) {
    return {
      searchedString: searchString,
      actorInput: null,
      results: cached,
      fromCache: true,
    };
  }

  const apiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;

  // Return formatted input for actor
  const actorInput = {
    searchStrings: [searchString],
    maxCrawledPlacesPerSearch: params.maxResults || 10,
    includeReviews: false,
    includeImages: true,
    scrapeInstagram: true,
  };

  if (!apiKey) {
    return {
      searchedString: searchString,
      actorInput,
      results: null,
      fromCache: false,
    };
  }

  try {
    const client = new ApifyClient({ token: apiKey });
    
    // Use timeout to prevent hanging pipeline and wasting server resources
    const callPromise = client.actor("compass/crawler-google-places").call(actorInput, {
      waitSecs: 20,
    });

    const timeoutPromise = new Promise<{ defaultDatasetId?: string }>((_, reject) =>
      setTimeout(() => reject(new Error("Apify run timed out")), 12000)
    );

    const run = await Promise.race([callPromise, timeoutPromise]);
    if (!run?.defaultDatasetId) {
      return {
        searchedString: searchString,
        actorInput,
        results: null,
        fromCache: false,
      };
    }

    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: params.maxResults || 10 });

    // Store in 24h cache
    if (items && items.length > 0) {
      setCachedPlaces(searchString, items);
    }

    return {
      searchedString: searchString,
      actorInput,
      results: items,
      fromCache: false,
    };
  } catch (error) {
    console.log("Apify Google Maps scraping error or timeout:", error);
    return {
      searchedString: searchString,
      actorInput,
      results: null,
      error,
      fromCache: false,
    };
  }
}
