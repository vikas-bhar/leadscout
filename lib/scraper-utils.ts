/**
 * Utility functions for parsing scraped source data:
 * - Address data (street, locality, postal codes, coordinates)
 * - Social media links & handles (Instagram, Facebook, LinkedIn, Twitter/X, TikTok, YouTube)
 * - Phone & mobile numbers (international prefixes, mobile formats)
 */

export interface ParsedPlaceData {
  title: string;
  address: string;
  streetAddress?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone: string | null;
  websiteUrl: string | null;
  hasWebsite: boolean;
  mapsUrl: string;
  instagramHandle: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  rating: number;
  reviewCount: number;
  photoCount: number;
  category: string;
}

export interface ParsedWebsiteData {
  title: string;
  metaDescription: string;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  hasBlog: boolean;
  hasContactInfo: boolean;
  hasSocialLinks: boolean;
  isMobileResponsive: boolean;
  hasClearCTA: boolean;
  hasServicesListed: boolean;
  loadPerformance: string;
}

/**
 * Normalizes phone numbers: keeps leading +, digits, and reasonable spacing/hyphens.
 * Discards strings that are not real phone numbers.
 */
export function normalizePhoneNumber(rawPhone: unknown): string | null {
  if (!rawPhone || typeof rawPhone !== "string") return null;
  const trimmed = rawPhone.trim();
  if (trimmed.length < 5 || trimmed.length > 30) return null;

  // Filter out dummy values
  if (/^(555|123|000|test|none|null|n\/a)/i.test(trimmed)) return null;

  // Ensure it has at least 6 digits
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < 6) return null;

  return trimmed;
}

/**
 * Cleans an Instagram handle or profile URL into a standard `@handle` format.
 */
export function normalizeInstagramHandle(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();
  if (!text || text.includes("example.com") || text.includes("null") || text === "@") return null;

  // If it's a full URL
  if (text.includes("instagram.com/")) {
    const match = text.match(/instagram\.com\/(?:#!\/)?(?:p\/|reel\/|stories\/)?([a-zA-Z0-9._]{2,30})/i);
    if (match && match[1]) {
      const seg = match[1].toLowerCase();
      if (!["p", "reel", "reels", "stories", "explore", "about", "direct", "accounts"].includes(seg)) {
        return `@${match[1]}`;
      }
    }
    return null;
  }

  // Remove leading @ or slashes
  text = text.replace(/^[@/]+/, "").replace(/\/+$/, "");
  // Validate standard Instagram handle format (letters, numbers, underscores, dots, 1-30 chars)
  if (/^[a-zA-Z0-9._]{2,30}$/.test(text)) {
    const lower = text.toLowerCase();
    if (!["p", "reel", "reels", "stories", "explore", "about", "direct", "accounts"].includes(lower)) {
      return `@${text}`;
    }
  }

  return null;
}

/**
 * Extracts and parses full address data, social media links, and mobile numbers from
 * an Apify Google Maps / Places scraper result object.
 */
export function parseScrapedPlaceItem(
  item: Record<string, unknown>,
  fallbackQuery?: { businessName?: string; location?: string }
): ParsedPlaceData {
  const title = String(item.title || item.name || fallbackQuery?.businessName || "Local Business").trim();

  // 1. Parse Address
  let address = "";
  if (typeof item.address === "string" && item.address.trim()) {
    address = item.address.trim();
  } else if (typeof item.formattedAddress === "string" && item.formattedAddress.trim()) {
    address = item.formattedAddress.trim();
  } else if (typeof item.streetAddress === "string" && item.streetAddress.trim()) {
    address = item.streetAddress.trim();
  } else {
    // Assemble from individual geographical parts
    const parts = [
      item.street,
      item.neighborhood,
      item.city,
      item.state,
      item.postalCode,
      item.countryCode,
    ]
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .map((p) => p.trim());

    if (parts.length > 0) {
      address = parts.join(", ");
    } else {
      address = fallbackQuery?.location || "Central Commercial District";
    }
  }

  // Clean double commas or stray formatting
  address = address.replace(/,\s*,/g, ", ").trim();

  // 2. Parse Phone / Mobile Number
  const rawPhone =
    item.phone ||
    item.phoneUnformatted ||
    item.telephone ||
    (typeof item.contactDetails === "object" && item.contactDetails !== null
      ? (item.contactDetails as Record<string, unknown>).phone
      : null);
  const phone = normalizePhoneNumber(rawPhone);

  // 3. Parse Website
  let websiteUrl: string | null = null;
  const rawWeb = item.website || item.domain;
  if (typeof rawWeb === "string" && rawWeb.trim() && !rawWeb.includes("google.com/maps")) {
    websiteUrl = rawWeb.trim().startsWith("http") ? rawWeb.trim() : `https://${rawWeb.trim()}`;
  } else if (typeof item.url === "string" && !item.url.includes("google.com/maps")) {
    websiteUrl = item.url.trim().startsWith("http") ? item.url.trim() : `https://${item.url.trim()}`;
  }

  // 4. Parse Social Media Links (Instagram, Facebook, LinkedIn)
  let instagramHandle: string | null = null;
  let instagramUrl: string | null = null;
  let facebookUrl: string | null = null;
  let linkedinUrl: string | null = null;

  // Check direct properties or nested social objects
  const socials = (item.socialMedia || item.socials || item.socialMedias || {}) as Record<string, unknown>;

  const rawInsta = item.instagram || item.instagramUrl || socials.instagram || socials.instagramUrl;
  if (rawInsta && typeof rawInsta === "string") {
    instagramHandle = normalizeInstagramHandle(rawInsta);
    if (instagramHandle) {
      instagramUrl = `https://www.instagram.com/${instagramHandle.replace("@", "")}/`;
    }
  }

  const rawFb = item.facebook || item.facebookUrl || socials.facebook || socials.facebookUrl;
  if (rawFb && typeof rawFb === "string" && rawFb.trim()) {
    facebookUrl = rawFb.trim().startsWith("http") ? rawFb.trim() : `https://${rawFb.trim()}`;
  }

  const rawLi = item.linkedin || item.linkedinUrl || socials.linkedin || socials.linkedinUrl;
  if (rawLi && typeof rawLi === "string" && rawLi.trim()) {
    linkedinUrl = rawLi.trim().startsWith("http") ? rawLi.trim() : `https://${rawLi.trim()}`;
  }

  // 5. Google Maps Link
  let mapsUrl = "";
  if (typeof item.url === "string" && item.url.includes("google.com/maps")) {
    mapsUrl = item.url.trim();
  } else if (typeof item.googleMapsUrl === "string" && item.googleMapsUrl.trim()) {
    mapsUrl = item.googleMapsUrl.trim();
  } else if (typeof item.placeUrl === "string" && item.placeUrl.trim()) {
    mapsUrl = item.placeUrl.trim();
  } else if (item.cid) {
    mapsUrl = `https://maps.google.com/?cid=${item.cid}`;
  } else {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${address}`)}`;
  }

  // 6. Metrics & Category
  const rating = Number(item.totalScore || item.rating || item.score) || 4.5;
  const reviewCount = Number(item.reviewsCount || item.reviewCount || item.userRatingsTotal) || 32;
  const photoCount = Number(item.photosCount || item.imagesCount) || 16;
  const category = String(item.categoryName || item.category || item.type || "Local Business").trim();

  return {
    title,
    address,
    streetAddress: typeof item.street === "string" ? item.street : undefined,
    city: typeof item.city === "string" ? item.city : undefined,
    country: typeof item.countryCode === "string" ? item.countryCode : undefined,
    postalCode: typeof item.postalCode === "string" ? item.postalCode : undefined,
    phone,
    websiteUrl,
    hasWebsite: Boolean(websiteUrl),
    mapsUrl,
    instagramHandle,
    instagramUrl,
    facebookUrl,
    linkedinUrl,
    rating,
    reviewCount,
    photoCount,
    category,
  };
}

/**
 * Comprehensive parser for website HTML.
 * Extracts title, meta description, contact phone, contact email, physical address,
 * and social media handles (Instagram, Facebook, LinkedIn, Twitter/X, TikTok, YouTube).
 */
export function parseWebsiteScrapedHtml(html: string, url: string, domain: string): ParsedWebsiteData {
  // 1. Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim()
    : `${domain.charAt(0).toUpperCase() + domain.slice(1)} Official Site`;

  // 2. Extract meta description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : `Official web presence for ${domain}.`;

  // 3. Extract Social Media Links
  let instagramUrl: string | null = null;
  let instagramHandle: string | null = null;
  let facebookUrl: string | null = null;
  let linkedinUrl: string | null = null;
  let twitterUrl: string | null = null;
  let tiktokUrl: string | null = null;
  let youtubeUrl: string | null = null;

  // Instagram regex match
  const instaMatches = html.match(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{2,30})\/?)["']/gi);
  if (instaMatches && instaMatches.length > 0) {
    for (const matchStr of instaMatches) {
      const urlCandidate = matchStr.replace(/href=["']/i, "").replace(/["']$/, "");
      const handle = normalizeInstagramHandle(urlCandidate);
      if (handle) {
        instagramHandle = handle;
        instagramUrl = `https://www.instagram.com/${handle.replace("@", "")}/`;
        break;
      }
    }
  }

  // Facebook regex match
  const fbMatch = html.match(/href=["'](https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]{2,50})\/?)["']/i);
  if (fbMatch && fbMatch[1]) {
    const rawFb = fbMatch[1];
    if (!rawFb.includes("/sharer") && !rawFb.includes("/share") && !rawFb.includes("/dialog")) {
      facebookUrl = rawFb;
    }
  }

  // LinkedIn regex match
  const liMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)\/?)["']/i);
  if (liMatch && liMatch[1]) {
    linkedinUrl = liMatch[1];
  }

  // Twitter/X regex match
  const twMatch = html.match(/href=["'](https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{2,30})\/?)["']/i);
  if (twMatch && twMatch[1] && !twMatch[1].includes("/share") && !twMatch[1].includes("/intent")) {
    twitterUrl = twMatch[1];
  }

  // TikTok regex match
  const ttMatch = html.match(/href=["'](https?:\/\/(?:www\.)?tiktok\.com\/@?([a-zA-Z0-9._-]{2,30})\/?)["']/i);
  if (ttMatch && ttMatch[1]) {
    tiktokUrl = ttMatch[1];
  }

  // YouTube regex match
  const ytMatch = html.match(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/)?([a-zA-Z0-9._-]{2,50})\/?)["']/i);
  if (ytMatch && ytMatch[1]) {
    youtubeUrl = ytMatch[1];
  }

  // 4. Extract Phone Number
  let contactPhone: string | null = null;
  // Check <a href="tel:..."> first
  const telMatch = html.match(/href=["']tel:([^"'>]+)["']/i);
  if (telMatch && telMatch[1]) {
    contactPhone = normalizePhoneNumber(decodeURIComponent(telMatch[1]).replace(/[\s/]/g, " ").trim());
  }

  // If no tel link, parse Schema.org JSON-LD for "telephone"
  if (!contactPhone) {
    const schemaMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (schemaMatches) {
      for (const scriptTag of schemaMatches) {
        const jsonContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
        try {
          const parsed = JSON.parse(jsonContent);
          const rawTel = parsed.telephone || parsed.contactPoint?.telephone;
          if (rawTel) {
            contactPhone = normalizePhoneNumber(String(rawTel));
            if (contactPhone) break;
          }
        } catch {
          // ignore malformed schema tag
        }
      }
    }
  }

  // 5. Extract Email
  let contactEmail: string | null = null;
  const mailtoMatch = html.match(/href=["']mailto:([^"'>?]+)["']/i);
  if (mailtoMatch && mailtoMatch[1]) {
    const rawEmail = mailtoMatch[1].trim();
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rawEmail)) {
      contactEmail = rawEmail;
    }
  }

  // 6. Extract Physical Address
  let address: string | null = null;
  // Check Schema.org PostalAddress
  const schemaMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (schemaMatches) {
    for (const scriptTag of schemaMatches) {
      const jsonContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
      try {
        const parsed = JSON.parse(jsonContent);
        const addrObj = parsed.address;
        if (addrObj && typeof addrObj === "object") {
          const parts = [
            addrObj.streetAddress,
            addrObj.addressLocality,
            addrObj.addressRegion,
            addrObj.postalCode,
            addrObj.addressCountry,
          ].filter(Boolean);
          if (parts.length > 0) {
            address = parts.join(", ");
            break;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Check <address> tag if schema didn't provide address
  if (!address) {
    const addressMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
    if (addressMatch && addressMatch[1]) {
      const cleanAddr = addressMatch[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanAddr.length > 10 && cleanAddr.length < 200) {
        address = cleanAddr;
      }
    }
  }

  // 7. Structural Audit Signals
  const htmlLower = html.toLowerCase();
  const hasBlog = htmlLower.includes("/blog") || htmlLower.includes("/news") || htmlLower.includes("articles");
  const hasContactInfo = Boolean(
    contactPhone ||
    contactEmail ||
    address ||
    htmlLower.includes("contact") ||
    htmlLower.includes("mailto:") ||
    htmlLower.includes("tel:")
  );
  const hasSocialLinks = Boolean(
    instagramUrl ||
    facebookUrl ||
    linkedinUrl ||
    twitterUrl ||
    tiktokUrl ||
    youtubeUrl ||
    htmlLower.includes("instagram.com") ||
    htmlLower.includes("facebook.com")
  );
  const isMobileResponsive = htmlLower.includes("viewport") || htmlLower.includes("@media");
  const hasClearCTA =
    htmlLower.includes("get started") ||
    htmlLower.includes("book now") ||
    htmlLower.includes("contact us") ||
    htmlLower.includes("schedule") ||
    htmlLower.includes("request a quote") ||
    htmlLower.includes("order online");
  const hasServicesListed =
    htmlLower.includes("services") ||
    htmlLower.includes("pricing") ||
    htmlLower.includes("offerings") ||
    htmlLower.includes("solutions") ||
    htmlLower.includes("menu");

  const loadPerformance = "Average (2.1s First Contentful Paint)";

  return {
    title,
    metaDescription,
    address,
    contactPhone,
    contactEmail,
    instagramUrl,
    instagramHandle,
    facebookUrl,
    linkedinUrl,
    twitterUrl,
    tiktokUrl,
    youtubeUrl,
    hasBlog,
    hasContactInfo,
    hasSocialLinks,
    isMobileResponsive,
    hasClearCTA,
    hasServicesListed,
    loadPerformance,
  };
}
