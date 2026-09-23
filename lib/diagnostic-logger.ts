/**
 * Diagnostic Logging System for Web & Places Scraping
 * Captures raw HTML responses, HTTP metadata, extraction traces, and validation errors.
 */

export interface ValidationTraceStep {
  step: string;
  status: "ok" | "warning" | "failed" | "info";
  detail: string;
}

export interface ScraperDiagnosticLog {
  id: string;
  timestamp: string;
  scraperType: "website" | "maps" | "instagram" | "places_api" | "direct_test";
  targetUrl: string;
  durationMs: number;
  httpStatus: number | null;
  status: "success" | "partial_warning" | "error";
  parsingOutcome: {
    addressExtracted: boolean;
    addressValue: string | null;
    addressSource: "schema_org" | "html_address_tag" | "apify_formatted" | "gemini_intelligence" | "assembled_parts" | "none";
    phoneExtracted: boolean;
    phoneValue: string | null;
    phoneSource: "tel_link" | "schema_org" | "regex_text" | "apify" | "gemini" | "none";
    emailExtracted: boolean;
    emailValue: string | null;
    socialsExtracted: {
      instagram?: string | null;
      facebook?: string | null;
      linkedin?: string | null;
      twitter?: string | null;
      tiktok?: string | null;
      youtube?: string | null;
    };
  };
  validationTrace: ValidationTraceStep[];
  validationErrors: string[];
  rawHtmlResponseSnippet: string;
  rawHtmlSize: number;
  responseHeaders?: Record<string, string>;
  errorMessage?: string | null;
}

// Global in-memory log buffer (preserves up to 300 logs across requests in Node.js runtime)
declare global {
  // eslint-disable-next-line no-var
  var __scraperDiagnosticLogs: ScraperDiagnosticLog[] | undefined;
}

const MAX_LOGS = 300;

function getLogStore(): ScraperDiagnosticLog[] {
  if (!globalThis.__scraperDiagnosticLogs) {
    globalThis.__scraperDiagnosticLogs = [];
    seedInitialSampleLogs(globalThis.__scraperDiagnosticLogs);
  }
  return globalThis.__scraperDiagnosticLogs;
}

/**
 * Records a new diagnostic log entry into the circular buffer.
 */
export function recordDiagnosticLog(
  entry: Omit<ScraperDiagnosticLog, "id" | "timestamp">
): ScraperDiagnosticLog {
  const store = getLogStore();
  const id = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const log: ScraperDiagnosticLog = {
    ...entry,
    id,
    timestamp: new Date().toISOString(),
    // Keep snippet within reasonable memory limits (max 50,000 characters)
    rawHtmlResponseSnippet: entry.rawHtmlResponseSnippet
      ? entry.rawHtmlResponseSnippet.slice(0, 50000)
      : "",
  };

  store.unshift(log);
  if (store.length > MAX_LOGS) {
    store.length = MAX_LOGS;
  }

  return log;
}

/**
 * Retrieves diagnostic logs with optional filtering.
 */
export function getDiagnosticLogs(filters?: {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
}): {
  logs: ScraperDiagnosticLog[];
  metrics: {
    total: number;
    successCount: number;
    warningCount: number;
    errorCount: number;
    missingAddressCount: number;
    missingPhoneCount: number;
    missingSocialCount: number;
    avgDurationMs: number;
  };
} {
  const store = getLogStore();
  let results = [...store];

  if (filters?.type && filters.type !== "all") {
    results = results.filter((log) => log.scraperType === filters.type);
  }

  if (filters?.status && filters.status !== "all") {
    results = results.filter((log) => log.status === filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      (log) =>
        log.targetUrl.toLowerCase().includes(q) ||
        log.validationErrors.some((e) => e.toLowerCase().includes(q)) ||
        (log.parsingOutcome.addressValue && log.parsingOutcome.addressValue.toLowerCase().includes(q)) ||
        (log.parsingOutcome.phoneValue && log.parsingOutcome.phoneValue.toLowerCase().includes(q))
    );
  }

  const total = store.length;
  const successCount = store.filter((l) => l.status === "success").length;
  const warningCount = store.filter((l) => l.status === "partial_warning").length;
  const errorCount = store.filter((l) => l.status === "error").length;
  const missingAddressCount = store.filter((l) => !l.parsingOutcome.addressExtracted).length;
  const missingPhoneCount = store.filter((l) => !l.parsingOutcome.phoneExtracted).length;
  const missingSocialCount = store.filter(
    (l) => !l.parsingOutcome.socialsExtracted.instagram && !l.parsingOutcome.socialsExtracted.facebook
  ).length;

  const totalDuration = store.reduce((acc, l) => acc + l.durationMs, 0);
  const avgDurationMs = total > 0 ? Math.round(totalDuration / total) : 0;

  const limit = filters?.limit || 100;
  return {
    logs: results.slice(0, limit),
    metrics: {
      total,
      successCount,
      warningCount,
      errorCount,
      missingAddressCount,
      missingPhoneCount,
      missingSocialCount,
      avgDurationMs,
    },
  };
}

/**
 * Retrieves a single diagnostic log by ID.
 */
export function getDiagnosticLogById(id: string): ScraperDiagnosticLog | null {
  const store = getLogStore();
  return store.find((l) => l.id === id) || null;
}

/**
 * Clears all diagnostic logs.
 */
export function clearDiagnosticLogs(): void {
  const store = getLogStore();
  store.length = 0;
}

/**
 * Seeds initial demonstrative diagnostic entries when the buffer starts up.
 */
function seedInitialSampleLogs(store: ScraperDiagnosticLog[]) {
  const sample1: ScraperDiagnosticLog = {
    id: `diag_init_1`,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    scraperType: "website",
    targetUrl: "https://modernbistro.com/contact",
    durationMs: 840,
    httpStatus: 200,
    status: "success",
    parsingOutcome: {
      addressExtracted: true,
      addressValue: "1482 Grand Avenue, Suite 100, Austin, TX 78701",
      addressSource: "schema_org",
      phoneExtracted: true,
      phoneValue: "+1 (512) 555-0199",
      phoneSource: "tel_link",
      emailExtracted: true,
      emailValue: "reservations@modernbistro.com",
      socialsExtracted: {
        instagram: "@modernbistro_atx",
        facebook: "https://facebook.com/modernbistro",
      },
    },
    validationTrace: [
      { step: "HTTP Fetch", status: "ok", detail: "HTTP 200 OK in 840ms. Content-Type: text/html" },
      { step: "Schema.org Extraction", status: "ok", detail: "Found PostalAddress in JSON-LD script tag" },
      { step: "Phone Parsing", status: "ok", detail: "Found tel: link matching +1 (512) 555-0199" },
      { step: "Socials Detection", status: "ok", detail: "Discovered Instagram profile @modernbistro_atx and Facebook page" },
    ],
    validationErrors: [],
    rawHtmlSize: 42150,
    rawHtmlResponseSnippet: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Modern Bistro | Contact & Reservations</title>
  <meta name="description" content="Visit Modern Bistro in Austin, TX for seasonal dining." />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Modern Bistro",
    "telephone": "+1-512-555-0199",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1482 Grand Avenue, Suite 100",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78701",
      "addressCountry": "US"
    }
  }
  </script>
</head>
<body>
  <header><h1>Modern Bistro</h1></header>
  <main>
    <p>Call us at <a href="tel:+15125550199">(512) 555-0199</a></p>
    <a href="mailto:reservations@modernbistro.com">Email Us</a>
  </main>
  <footer>
    <a href="https://instagram.com/modernbistro_atx">Instagram</a>
    <a href="https://facebook.com/modernbistro">Facebook</a>
  </footer>
</body>
</html>`,
  };

  const sample2: ScraperDiagnosticLog = {
    id: `diag_init_2`,
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    scraperType: "website",
    targetUrl: "https://apexarchitects-studio.io",
    durationMs: 1250,
    httpStatus: 200,
    status: "partial_warning",
    parsingOutcome: {
      addressExtracted: false,
      addressValue: null,
      addressSource: "none",
      phoneExtracted: false,
      phoneValue: null,
      phoneSource: "none",
      emailExtracted: true,
      emailValue: "inquiries@apexarchitects-studio.io",
      socialsExtracted: {
        instagram: "@apexarchitects",
        linkedin: "https://linkedin.com/company/apex-architects",
      },
    },
    validationTrace: [
      { step: "HTTP Fetch", status: "ok", detail: "HTTP 200 OK in 1250ms" },
      { step: "Address Parsing", status: "warning", detail: "No <address> tag or Schema.org PostalAddress found. Client-rendered single page app (SPA) bundle detected." },
      { step: "Phone Parsing", status: "warning", detail: "No tel: anchor tag or valid telephone pattern found in static HTML body." },
      { step: "Socials Detection", status: "ok", detail: "Discovered Instagram @apexarchitects and LinkedIn" },
    ],
    validationErrors: [
      "Missing physical address: No Schema.org PostalAddress or <address> tag in static HTML",
      "Missing phone number: Site appears to use dynamic form inquiry without a tel: link",
    ],
    rawHtmlSize: 28400,
    rawHtmlResponseSnippet: `<!DOCTYPE html>
<html>
<head>
  <title>Apex Architects Studio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="__next">
    <header>Apex Architecture</header>
    <p>Contact: <a href="mailto:inquiries@apexarchitects-studio.io">Email</a></p>
    <div class="socials">
      <a href="https://instagram.com/apexarchitects">Instagram</a>
      <a href="https://linkedin.com/company/apex-architects">LinkedIn</a>
    </div>
  </div>
</body>
</html>`,
  };

  const sample3: ScraperDiagnosticLog = {
    id: `diag_init_3`,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    scraperType: "maps",
    targetUrl: "https://maps.google.com/?cid=98412891289128",
    durationMs: 910,
    httpStatus: 200,
    status: "partial_warning",
    parsingOutcome: {
      addressExtracted: true,
      addressValue: "742 Evergreen Terrace, Sector 4",
      addressSource: "assembled_parts",
      phoneExtracted: true,
      phoneValue: "+91 98201 54321",
      phoneSource: "apify",
      emailExtracted: false,
      emailValue: null,
      socialsExtracted: {
        instagram: null,
      },
    },
    validationTrace: [
      { step: "Google Maps Resolution", status: "ok", detail: "Extracted place title, coordinates, and street details" },
      { step: "Address Parsing", status: "ok", detail: "Assembled locality and street parts" },
      { step: "Phone Parsing", status: "ok", detail: "Parsed normalized mobile number +91 98201 54321" },
      { step: "Socials Detection", status: "warning", detail: "Google Maps listing has no linked Instagram profile or website domain" },
    ],
    validationErrors: [
      "No Instagram handle provided on Google Maps listing",
      "No website domain associated with Google Maps Place",
    ],
    rawHtmlSize: 18200,
    rawHtmlResponseSnippet: JSON.stringify(
      {
        title: "Zenith Dental Care",
        address: "742 Evergreen Terrace, Sector 4",
        phone: "+91 98201 54321",
        website: null,
        instagram: null,
        totalScore: 4.8,
        reviewsCount: 112,
      },
      null,
      2
    ),
  };

  store.push(sample1, sample2, sample3);
}
