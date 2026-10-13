/**
 * Normalises a URL for website filter evaluation:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips protocol (http://, https://, or //)
 * - Strips leading "www."
 * - Strips leading slashes
 */
export function normalizeWebsiteUrlForFilter(url: unknown): string {
  if (url === null || url === undefined) return "";
  if (typeof url !== "string") return "";
  let s = url.trim().toLowerCase();
  if (!s) return "";

  // Strip protocol prefixes: http://, https://, //
  s = s.replace(/^(?:https?:)?\/\//i, "");

  // Strip leading www.
  s = s.replace(/^www\./i, "");

  // Strip leading slashes
  s = s.replace(/^\/+/, "");

  return s;
}

/**
 * List of domains, paths, or subdomains that are NOT considered real, dedicated business websites.
 * When a business has a URL matching any of these, it still counts as having "NO website".
 */
export const NON_WEBSITE_DOMAINS_AND_PATTERNS = [
  // Social media
  "facebook.com",
  "fb.com",
  "m.facebook.com",
  "instagram.com",
  "instagr.am",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",

  // Link in bio
  "linktr.ee",
  "linktree.com",
  "bio.link",
  "beacons.ai",
  "taplink.cc",
  "campsite.bio",
  "lnk.bio",
  "carrd.co",

  // Messaging
  "wa.me",
  "whatsapp.com",
  "api.whatsapp.com",

  // Google Maps / Business Site / Place Profiles
  "google.com/maps",
  "maps.google.com",
  "google.com/search",
  "g.page",
  "business.site",

  // Directory / aggregator profiles
  "tripadvisor.com",
  "yelp.com",
  "yellowpages.com",
  "zomato.com",
  "swiggy.com",
  "justdial.com",
] as const;

/**
 * Determines whether a business has NO real website.
 *
 * Rules:
 * - Treat a business as having NO website only when the website field is null, empty, or whitespace.
 * - Also treat the following as NOT a real website (so the business still counts as "no website"):
 *   URLs on facebook.com, instagram.com, linktr.ee, wa.me, whatsapp.com, google.com/maps, g.page, business.site,
 *   and similar social or link-in-bio domains.
 * - Normalise the URL (trim, lowercase, strip protocol and "www.") before checking.
 *
 * Returns:
 * - `true` if the business has NO real website (eligible for "no website" filter).
 * - `false` if the business HAS a real, dedicated website (should be excluded by "no website" filter).
 */
export function hasNoWebsite(url: unknown): boolean {
  // 1. null, undefined, non-string -> NO website
  if (url === null || url === undefined) return true;
  if (typeof url !== "string") return true;

  // 2. empty or whitespace -> NO website
  const trimmed = url.trim();
  if (trimmed === "") return true;

  // 3. Common placeholder strings that mean "no website"
  const lower = trimmed.toLowerCase();
  if (
    lower === "none" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "no website" ||
    lower === "nowebsite" ||
    lower === "false" ||
    lower === "true" ||
    lower === "http://" ||
    lower === "https://"
  ) {
    return true;
  }

  // 4. Normalise the URL: trim, lowercase, strip protocol and "www."
  const normalized = normalizeWebsiteUrlForFilter(trimmed);
  if (!normalized) return true;

  // Split into host and path/query
  const slashIdx = normalized.indexOf("/");
  const host = slashIdx === -1 ? normalized : normalized.slice(0, slashIdx);

  // 5. Check against social, messaging, directory, Google Maps, and link-in-bio patterns
  for (const pattern of NON_WEBSITE_DOMAINS_AND_PATTERNS) {
    if (pattern.includes("/")) {
      // Path-specific pattern like "google.com/maps"
      if (
        normalized === pattern ||
        normalized.startsWith(pattern + "/") ||
        normalized.startsWith(pattern + "?") ||
        normalized.startsWith(pattern + "#")
      ) {
        return true;
      }
    } else {
      // Host pattern like "facebook.com", "g.page", "business.site", "wa.me"
      // Checks exact host match or subdomain match (e.g. "mybakery.business.site")
      if (host === pattern || host.endsWith("." + pattern)) {
        return true;
      }
    }
  }

  // If the host doesn't look like a real domain (needs at least one dot with a valid TLD)
  if (!host.includes(".") || host.endsWith(".")) {
    return true;
  }

  // It is a real, dedicated website!
  return false;
}

/**
 * Returns true if the URL represents a genuine, dedicated business website.
 */
export function hasRealWebsite(url: unknown): boolean {
  return !hasNoWebsite(url);
}
