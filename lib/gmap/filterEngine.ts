/* eslint-disable @typescript-eslint/no-explicit-any */
import { SearchFilters, InstagramFilters } from "@/types";
import { extractWebsite, isSocialOrAggregatorUrl } from "./websiteExtractor";

export interface FilterResult {
  passed: any[];
  rejected: Array<{ business: any; reason: string }>;
  summary: {
    total: number;
    passed: number;
    rejected: number;
    reasons: Record<string, number>;
  };
}

export function applyFilters(
  businesses: any[],
  filters: SearchFilters | null | undefined
): FilterResult {
  // If no filters provided use safe defaults
  const f: SearchFilters = filters || {
    requireNoWebsite: null,
    requireWebsite: null,
    minRating: null,
    maxRating: null,
    minReviews: 3,
    maxReviews: null,
    maxPhotos: null,
    priceLevel: [],
    keywordsInName: [],
    keywordsToExclude: [],
    requireVerified: null,
    requireUnansweredReviews: null,
    instagram: null,
  };

  console.log("═══ FILTER ENGINE ═══");
  console.log("Input:", businesses.length, "businesses");
  console.log("Active filters:");
  console.log("  requireNoWebsite:", f.requireNoWebsite);
  console.log("  requireWebsite:", f.requireWebsite);
  console.log("  minRating:", f.minRating);
  console.log("  maxRating:", f.maxRating);
  console.log("  minReviews:", f.minReviews);
  console.log("  priceLevel:", f.priceLevel);

  if (businesses.length > 0) {
    console.log("WEBSITE DEBUG:", businesses.slice(0, 3).map((b) => ({
      name: b.title || b.name,
      extractedWebsite: extractWebsite(b),
      website: b.website,
      websiteUri: b.websiteUri,
      url: b.url,
      siteUrl: b.siteUrl,
      allKeys: Object.keys(b).filter((k) =>
        k.toLowerCase().includes("web") ||
        k.toLowerCase().includes("url") ||
        k.toLowerCase().includes("site")
      ),
    })));
  }

  const passed: any[] = [];
  const rejected: Array<{ business: any; reason: string }> = [];
  const reasons: Record<string, number> = {};

  const reject = (business: any, reason: string) => {
    rejected.push({ business, reason });
    reasons[reason] = (reasons[reason] || 0) + 1;
    console.log(`  ❌ ${business.title || business.name}: ${reason}`);
  };

  const pass = (business: any) => {
    passed.push(business);
    console.log(`  ✅ ${business.title || business.name}`);
  };

  for (const business of businesses) {
    const name = business.title || business.name || "";
    const website = extractWebsite(business);
    const hasWebsite = website !== null;
    const isSocialOnly = isSocialOrAggregatorUrl(website);
    const hasDedicatedWebsite = hasWebsite && !isSocialOnly;

    if (isSocialOnly) {
      business.isSocialOnlyWebsite = true;
      business.websiteNote = "Social profile or Linktree only (No dedicated website)";
    }

    const rating =
      parseFloat(
        String(business.totalScore || business.rating || "0").replace(",", ".")
      ) || null;

    const reviewCount =
      parseInt(
        String(business.reviewsCount || business.reviewCount || "0").replace(
          /[^0-9]/g,
          ""
        )
      ) || 0;

    const photoCount =
      parseInt(
        String(
          business.photosCount ||
            business.imageCount ||
            business.photoCount ||
            "0"
        )
      ) || 0;

    // ── HARD REJECTS (always apply) ──────────

    // Skip permanently closed
    if (
      business.permanentlyClosed ||
      business.businessStatus === "CLOSED_PERMANENTLY" ||
      business.isClosed === true
    ) {
      reject(business, "permanently_closed");
      continue;
    }

    // Skip businesses with no name
    if (!name || name.trim() === "") {
      reject(business, "no_name");
      continue;
    }

    // ── WEBSITE FILTER ───────────────────────

    // User wants ONLY businesses with NO dedicated website
    // (Businesses with NO website OR whose website is merely Facebook/Linktree/Instagram will pass!)
    if (f.requireNoWebsite === true) {
      if (hasDedicatedWebsite) {
        reject(business, `has_dedicated_website: ${website}`);
        continue;
      }
    }

    // User wants ONLY businesses WITH a dedicated website
    if (f.requireWebsite === true) {
      if (!hasDedicatedWebsite) {
        reject(business, isSocialOnly ? "social_only_no_real_website" : "no_website");
        continue;
      }
    }

    // ── RATING FILTER ────────────────────────

    if (f.minRating !== null && f.minRating !== undefined) {
      if (rating === null || rating < f.minRating) {
        reject(business, `rating_too_low: ${rating}`);
        continue;
      }
    }

    if (f.maxRating !== null && f.maxRating !== undefined) {
      if (rating !== null && rating > f.maxRating) {
        reject(business, `rating_too_high: ${rating}`);
        continue;
      }
    }

    // ── REVIEW COUNT FILTER ──────────────────

    const minReviewsThreshold = f.minReviews ?? 3;
    if (reviewCount < minReviewsThreshold) {
      reject(business, `too_few_reviews: ${reviewCount}`);
      continue;
    }

    if (f.maxReviews !== null && f.maxReviews !== undefined) {
      if (reviewCount > f.maxReviews) {
        reject(business, `too_many_reviews: ${reviewCount}`);
        continue;
      }
    }

    // ── PHOTO COUNT FILTER ───────────────────

    if (f.maxPhotos !== null && f.maxPhotos !== undefined) {
      if (photoCount > f.maxPhotos) {
        reject(business, `too_many_photos: ${photoCount}`);
        continue;
      }
    }

    // ── PRICE LEVEL FILTER ───────────────────

    if (f.priceLevel && f.priceLevel.length > 0) {
      const price = business.priceLevel || business.price;
      if (price && !f.priceLevel.includes(price)) {
        reject(business, `wrong_price_level: ${price}`);
        continue;
      }
    }

    // ── KEYWORD INCLUDE FILTER ───────────────

    if (f.keywordsInName && f.keywordsInName.length > 0) {
      const nameLower = name.toLowerCase();
      const hasKeyword = f.keywordsInName.some((k) =>
        nameLower.includes(k.toLowerCase().trim())
      );
      if (!hasKeyword) {
        reject(business, `missing_keyword: ${f.keywordsInName.join(",")}`);
        continue;
      }
    }

    // ── KEYWORD EXCLUDE FILTER ───────────────

    if (f.keywordsToExclude && f.keywordsToExclude.length > 0) {
      const nameLower = name.toLowerCase();
      const hasExcluded = f.keywordsToExclude.some((k) =>
        nameLower.includes(k.toLowerCase().trim())
      );
      if (hasExcluded) {
        reject(business, "excluded_keyword_found");
        continue;
      }
    }

    // ── VERIFIED FILTER ──────────────────────

    if (f.requireVerified === true) {
      const isVerified = Boolean(
        business.isVerified ||
          business.claimedBusiness ||
          business.verified
      );
      if (!isVerified) {
        reject(business, "not_verified");
        continue;
      }
    }

    // ── UNANSWERED REVIEWS FILTER ────────────

    if (f.requireUnansweredReviews === true) {
      const reviews = business.reviews || [];
      const unanswered = reviews.filter(
        (r: any) =>
          (r.stars || r.rating || 3) <= 2 &&
          !r.responseFromOwnerText &&
          !r.ownerResponse
      ).length;
      if (unanswered === 0) {
        reject(business, "no_unanswered_reviews");
        continue;
      }
    }

    // ── ALL FILTERS PASSED ───────────────────
    pass(business);
  }

  const summary = {
    total: businesses.length,
    passed: passed.length,
    rejected: rejected.length,
    reasons,
  };

  console.log("Filter summary:", summary);
  console.log("═══════════════════");

  return { passed, rejected, summary };
}

// Apply Instagram-specific filters after Instagram scraping
export function applyInstagramFilters(
  businesses: Array<{ business: any; instagram: any }>,
  filters: InstagramFilters | null | undefined
): Array<{ business: any; instagram: any }> {
  if (!filters) return businesses;

  return businesses.filter(({ instagram }) => {
    const ig = instagram;
    const igFound = ig && ig.found === true;

    // Require NO Instagram
    if (filters.requireNoInstagram === true) {
      if (igFound) return false;
    }

    // Require Instagram present
    if (filters.requireInstagram === true) {
      if (!igFound) return false;
    }

    if (igFound) {
      const followers = ig.followers || 0;
      const daysSince = ig.daysSinceLastPost || 0;
      const engagement = ig.engagementRate || 0;

      if (filters.minFollowers && followers < filters.minFollowers) return false;
      if (filters.maxFollowers && followers > filters.maxFollowers) return false;
      if (filters.minDaysSincePost && daysSince < filters.minDaysSincePost)
        return false;
      if (filters.maxEngagementRate && engagement > filters.maxEngagementRate)
        return false;
      if (filters.requireNoReels === true && ig.usesReels) return false;
      if (filters.requireNoLinkInBio === true && ig.hasLinkInBio) return false;
    }

    return true;
  });
}
