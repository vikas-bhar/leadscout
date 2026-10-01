// Raw data cleaner and normalizer for Maps and Instagram scraping

export interface CleanedMapsData {
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
  isPermanentlyClosed: boolean;
  mapsUrl: string;
  coordinates: { lat: number; lng: number } | null;
  reviews: Array<{ text: string; rating: number; hasOwnerResponse: boolean; date: string | null }>;
  unansweredNegativeReviews: number;
  priceLevel: string | null;
  placeIdSource: string;
}

const toStr = (v: unknown, fallback = "") => (v !== null && v !== undefined ? String(v).trim() : fallback);
const toNum = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, "."));
  return isNaN(n) ? null : n;
};
const toInt = (v: unknown) => parseInt(String(v ?? "").replace(/[^0-9]/g, "")) || 0;

export function cleanMapsData(raw: Record<string, unknown> = {}): CleanedMapsData {
  const name = toStr(raw.title || raw.name || raw.businessName || raw.placeName, "Unknown Business");
  const rating = toNum(raw.totalScore ?? raw.rating ?? raw.stars ?? raw.score);
  const cleanRating = rating !== null && rating >= 0 && rating <= 5 ? rating : null;
  const address = toStr(raw.address || raw.formattedAddress || raw.vicinity || raw.street);
  const city = toStr(raw.city || raw.addressLocality || extractCity(address));
  const country = toStr(raw.countryCode || raw.country || raw.addressCountry).toUpperCase();
  const rawWeb = toStr(raw.website || raw.url || raw.websiteUrl);
  const website = normalizeWebsiteUrl(rawWeb);
  const rawPhone = toStr(raw.phone || raw.phoneNumber || raw.phoneUnformatted || raw.internationalPhoneNumber);
  const phone = rawPhone ? rawPhone.replace(/[\s\-\(\)\.]/g, "") : null;

  const loc = (raw.location as Record<string, unknown>) || {};
  const lat = toNum(loc.lat ?? raw.lat ?? raw.latitude);
  const lng = toNum(loc.lng ?? raw.lng ?? raw.longitude);

  const rawReviews = Array.isArray(raw.reviews || raw.topReviews) ? (raw.reviews || raw.topReviews) as Array<Record<string, unknown>> : [];
  const reviews = rawReviews
    .filter((r) => r?.text || r?.snippet)
    .slice(0, 10)
    .map((r) => ({
      text: toStr(r.text || r.snippet).slice(0, 500),
      rating: toNum(r.stars ?? r.rating) ?? 3,
      hasOwnerResponse: Boolean(r.responseFromOwnerText || r.ownerResponse || r.replyText),
      date: (r.publishedAtDate || r.time || null) as string | null,
    }));

  return {
    placeId: toStr(raw.placeId || raw.id || raw.place_id, generateId(name, address)),
    name,
    category: toStr(raw.categoryName || raw.category || (Array.isArray(raw.types) ? raw.types[0] : null) || raw.primaryType, "Business"),
    address,
    city,
    country,
    rating: cleanRating,
    reviewCount: toInt(raw.reviewsCount || raw.reviewCount || raw.numberOfReviews || raw.userRatingsTotal),
    website,
    phone,
    photoCount: toInt(raw.photosCount || raw.imageCount || (Array.isArray(raw.photos) ? raw.photos.length : 0)),
    hasHours: Boolean(raw.openingHours || raw.hours || raw.weekdayText),
    isVerified: Boolean(raw.isVerified || raw.verified || raw.claimedBusiness),
    isPermanentlyClosed: Boolean(raw.permanentlyClosed || raw.businessStatus === "CLOSED_PERMANENTLY" || raw.status === "closed"),
    mapsUrl: toStr(raw.url || raw.googleMapsUrl || raw.placeUrl || raw.shareUrl),
    coordinates: lat !== null && lng !== null ? { lat, lng } : null,
    reviews,
    unansweredNegativeReviews: reviews.filter((r) => r.rating <= 2 && !r.hasOwnerResponse).length,
    priceLevel: raw.priceLevel ? String(raw.priceLevel) : null,
    placeIdSource: "google_maps",
  };
}

export function cleanInstagramData(raw: Record<string, unknown> | null, expectedBusinessName: string) {
  if (!raw?.username) return null;

  const confidence = calculateConfidence(raw, expectedBusinessName);
  if (confidence < 0.4) return null;

  const followers = toInt(raw.followersCount || raw.followers);
  const postsCount = toInt(raw.postsCount || raw.mediaCount || (raw.edge_media_count as number));
  const rawLastPost = raw.latestPostDate || raw.lastPostDate || (raw.latestPost as Record<string, unknown>)?.timestamp;
  const lastPostDate = rawLastPost ? normalizeDate(rawLastPost) : null;
  const daysSinceLastPost = lastPostDate ? Math.floor((Date.now() - new Date(lastPostDate).getTime()) / 86400000) : null;
  const avgLikes = toNum(raw.avgLikesPerPost || raw.averageLikes) ?? 0;
  const avgComments = toNum(raw.avgCommentsPerPost || raw.averageComments) ?? 0;
  const engagementRate = followers > 100 ? parseFloat((((avgLikes + avgComments) / followers) * 100).toFixed(2)) : null;

  const ageDays = (typeof raw.accountAge === "number" ? raw.accountAge : null) || (raw.joinDate ? Math.floor((Date.now() - new Date(String(raw.joinDate)).getTime()) / 86400000) : null);
  const postsPerWeek = ageDays && postsCount ? parseFloat((postsCount / (ageDays / 7)).toFixed(1)) : null;

  return {
    found: true,
    confidence,
    username: toStr(raw.username).toLowerCase(),
    fullName: raw.fullName ? String(raw.fullName) : null,
    bio: toStr(raw.biography || raw.bio || raw.description) || null,
    followers,
    following: toInt(raw.followingCount || raw.following),
    postsCount,
    lastPostDate,
    daysSinceLastPost,
    postsPerWeek,
    avgLikesPerPost: avgLikes || null,
    avgCommentsPerPost: avgComments || null,
    engagementRate,
    hasLinkInBio: Boolean(raw.externalUrl || raw.linkInBio || raw.external_url),
    usesReels: Boolean(toInt(raw.reelsCount) > 0 || raw.hasReels || ((raw.edge_felix_video_timeline as { count?: number })?.count || 0) > 0),
    reelsCount: toInt(raw.reelsCount) || null,
    hasHighlights: Boolean(toInt(raw.highlightsCount) > 0 || raw.hasHighlights),
    isVerifiedAccount: Boolean(raw.verified || raw.is_verified),
    profileUrl: `https://instagram.com/${raw.username}`,
    isPrivate: Boolean(raw.private || raw.is_private),
    isBusinessAccount: Boolean(raw.isBusinessAccount || raw.is_business_account),
    bio_raw: (raw.biography as string) || null,
  };
}

function calculateConfidence(ig: Record<string, unknown>, businessName: string): number {
  const igName = toStr(ig.fullName || ig.username).toLowerCase();
  const bizName = businessName.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  let score = 0;

  if (igName.includes(bizName) || bizName.includes(igName)) score += 0.5;
  const bizWords = bizName.split(" ").filter((w) => w.length > 3);
  const matched = bizWords.filter((w) => igName.includes(w));
  score += (matched.length / Math.max(bizWords.length, 1)) * 0.3;

  if (ig.externalUrl || ig.external_url) score += 0.1;
  if (ig.isBusinessAccount || ig.is_business_account) score += 0.1;
  if (!ig.private && !ig.is_private) score += 0.05;
  const f = toInt(ig.followersCount || ig.followers);
  if (f > 100 && f < 10000000) score += 0.05;

  return Math.min(score, 1.0);
}

export function isValidWebsiteUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();

  // Reject empty string or common placeholders
  if (
    !trimmed ||
    trimmed === "none" ||
    trimmed === "n/a" ||
    trimmed === "na" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "no website" ||
    trimmed === "nowebsite" ||
    trimmed === "http" ||
    trimmed === "https" ||
    trimmed === "http://" ||
    trimmed === "https://" ||
    trimmed === "false" ||
    trimmed === "true"
  ) {
    return false;
  }

  // Verification step: MUST start with a proper http:// or https:// prefix
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname;
    if (!hostname || hostname === "none" || hostname === "null" || !hostname.includes(".")) {
      return false;
    }
    const parts = hostname.split(".");
    const tld = parts[parts.length - 1];
    if (!tld || tld.length < 2 || !/^[a-z0-9]+$/i.test(tld)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function normalizeWebsiteUrl(url: unknown): string | null {
  if (!url || typeof url !== "string") return null;
  let trimmed = url.trim();

  // If prefix is omitted, prepend https:// for verification
  if (!trimmed.toLowerCase().startsWith("http://") && !trimmed.toLowerCase().startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }

  if (!isValidWebsiteUrl(trimmed)) {
    return null;
  }

  try {
    return new URL(trimmed).href;
  } catch {
    return null;
  }
}

function normalizeDate(d: unknown): string | null {
  try {
    const dt = new Date(String(d));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  } catch {
    return null;
  }
}

function extractCity(address: string): string {
  const parts = address.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : "";
}

function generateId(name: string, address: string): string {
  const str = (name + address).toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
  return `gen_${Math.abs(hash).toString(36)}`;
}
