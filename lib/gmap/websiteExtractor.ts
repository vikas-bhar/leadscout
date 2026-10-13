import {
  hasNoWebsite as checkHasNoWebsite,
  hasRealWebsite as checkHasRealWebsite,
  NON_WEBSITE_DOMAINS_AND_PATTERNS,
  normalizeWebsiteUrlForFilter,
} from "@/lib/website-filter";

export {
  NON_WEBSITE_DOMAINS_AND_PATTERNS,
  normalizeWebsiteUrlForFilter,
  checkHasNoWebsite as hasNoWebsite,
};

export const SOCIAL_AND_AGGREGATOR_DOMAINS = new Set(
  NON_WEBSITE_DOMAINS_AND_PATTERNS.filter((d) => !d.includes("/"))
);

/**
 * Checks if a given website URL is actually a social media page, link-in-bio, or directory profile
 * rather than a dedicated business website.
 */
export function isSocialOrAggregatorUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // If url is not empty, check if it's considered "NO website"
  return checkHasNoWebsite(url);
}

export function extractWebsite(raw: Record<string, unknown> | null | undefined): string | null {
  if (!raw || typeof raw !== "object") return null;

  // Google Maps API / Apify use many different field names
  // Check every candidate
  const candidates = [
    raw.website,
    raw.websiteUrl,
    raw.websiteUri,
    raw.url,
    raw.homePage,
    raw.homepage,
    raw.siteUrl,
    raw.site_url,
    raw.web,
    raw.webPage,
    raw.webpage,
    raw.webUrl,
    raw.web_url,
    raw.contactWebsite,
    raw.businessWebsite,
    raw.domain,
    raw.externalUrl,
    raw.external_url,
    raw.link,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "string" &&
      candidate.trim() !== "" &&
      candidate.trim().toLowerCase() !== "null" &&
      candidate.trim().toLowerCase() !== "undefined" &&
      candidate.trim().toLowerCase() !== "n/a" &&
      candidate.trim().toLowerCase() !== "none" &&
      candidate.trim().length > 3
    ) {
      // Must look like a URL
      const val = candidate.trim();
      if (
        val.startsWith("http") ||
        val.startsWith("www.") ||
        (val.includes(".") && !val.includes(" "))
      ) {
        try {
          const normalized = val.startsWith("http") ? val : `https://${val}`;
          new URL(normalized);
          return normalized;
        } catch {
          // Not a valid URL, try next
          continue;
        }
      }
    }
  }

  return null;
}

/**
 * Returns the website ONLY if it is an actual dedicated website (not Facebook, Linktree, Instagram, etc.).
 */
export function extractDedicatedWebsite(raw: Record<string, unknown> | null | undefined): string | null {
  const url = extractWebsite(raw);
  if (!url) return null;
  if (checkHasNoWebsite(url)) return null;
  return url;
}

export function hasRealWebsite(raw: Record<string, unknown> | string | null | undefined): boolean {
  if (typeof raw === "string" || raw === null || raw === undefined) {
    return checkHasRealWebsite(raw);
  }
  return extractDedicatedWebsite(raw) !== null;
}

// Log all website-related fields for debugging
export function debugWebsiteFields(raw: Record<string, unknown> | null | undefined): void {
  if (!raw) return;
  const fields = [
    "website",
    "websiteUrl",
    "websiteUri",
    "url",
    "homePage",
    "homepage",
    "siteUrl",
  ];
  console.log("Website fields for:", raw.title || raw.name);
  fields.forEach((f) => {
    if (raw[f] !== undefined) {
      console.log(`  ${f}: "${raw[f]}"`);
    }
  });
}
