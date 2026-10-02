export function extractWebsite(raw: Record<string, unknown> | null | undefined): string | null {
  if (!raw || typeof raw !== "object") return null;

  // Google Maps API / Apify use many different field names
  // Check every single candidate
  const candidates = [
    raw.website,
    raw.websiteUrl,
    raw.websiteUri,
    raw.url,
    raw.homePage,
    raw.homepage,
    raw.siteUrl,
    raw.web,
    raw.webPage,
    raw.webpage,
    raw.contactWebsite,
    raw.businessWebsite,
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

export function hasRealWebsite(raw: Record<string, unknown> | null | undefined): boolean {
  return extractWebsite(raw) !== null;
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
