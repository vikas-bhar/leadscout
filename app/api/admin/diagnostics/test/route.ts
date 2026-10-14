import { NextRequest, NextResponse } from "next/server";
import { detectLinkType } from "@/lib/analyzer/detectLink";
import { scrapeLinkData } from "@/lib/analyzer/scrapeLink";
import { parseWebsiteScrapedHtml } from "@/lib/scraper-utils";
import { recordDiagnosticLog, type ValidationTraceStep } from "@/lib/diagnostic-logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let targetUrl = "";
  const validationTrace: ValidationTraceStep[] = [];
  const validationErrors: string[] = [];

  try {
    const body = await req.json();
    targetUrl = (body.url || "").trim();

    if (!targetUrl) {
      return NextResponse.json({ error: "URL is required for diagnostic test" }, { status: 400 });
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    validationTrace.push({
      step: "URL Normalization",
      status: "ok",
      detail: `Normalized target input: ${targetUrl}`,
    });

    const detected = detectLinkType(targetUrl);
    validationTrace.push({
      step: "Link Classification",
      status: "ok",
      detail: `Detected as type="${detected.type}" (Domain: ${detected.domain || "N/A"})`,
    });

    if (detected.type === "website") {
      let rawHtml = "";
      let httpStatus = 200;
      let contentType = "";

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const fetchStart = Date.now();
        const res = await fetch(detected.cleanUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 FreelanceFindBot/1.0",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        clearTimeout(timeoutId);

        httpStatus = res.status;
        contentType = res.headers.get("content-type") || "";
        rawHtml = await res.text();
        const fetchDuration = Date.now() - fetchStart;

        validationTrace.push({
          step: "HTTP Network Fetch",
          status: res.ok ? "ok" : "warning",
          detail: `HTTP ${res.status} ${res.statusText} in ${fetchDuration}ms. Length: ${rawHtml.length.toLocaleString()} bytes. Content-Type: ${contentType}`,
        });
      } catch (fetchErr: unknown) {
        const errMsg = fetchErr instanceof Error ? fetchErr.message : "Fetch failed";
        validationTrace.push({
          step: "HTTP Network Fetch",
          status: "failed",
          detail: `Fetch failed or timed out: ${errMsg}`,
        });
        validationErrors.push(`Network fetch error: ${errMsg}`);
      }

      // Execute deep parsing using scraper utils
      const domain = detected.domain || "example.com";
      const parsed = parseWebsiteScrapedHtml(rawHtml, detected.cleanUrl, domain);

      // Address verification
      if (parsed.address) {
        validationTrace.push({
          step: "Physical Address Parsing",
          status: "ok",
          detail: `Extracted address: "${parsed.address}"`,
        });
      } else {
        validationTrace.push({
          step: "Physical Address Parsing",
          status: "warning",
          detail: "No PostalAddress in Schema.org JSON-LD or <address> HTML element. Address data is missing from source page.",
        });
        validationErrors.push("Physical address could not be found in static HTML or Schema.org microdata.");
      }

      // Phone / Mobile verification
      if (parsed.contactPhone) {
        validationTrace.push({
          step: "Phone / Mobile Parsing",
          status: "ok",
          detail: `Extracted telephone number: "${parsed.contactPhone}"`,
        });
      } else {
        validationTrace.push({
          step: "Phone / Mobile Parsing",
          status: "warning",
          detail: "No tel: link or Schema.org telephone attribute found. Standard phone number regex did not detect a phone number.",
        });
        validationErrors.push("Phone or mobile number could not be found in source page.");
      }

      // Email verification
      if (parsed.contactEmail) {
        validationTrace.push({
          step: "Email Parsing",
          status: "ok",
          detail: `Extracted email: "${parsed.contactEmail}"`,
        });
      } else {
        validationTrace.push({
          step: "Email Parsing",
          status: "info",
          detail: "No mailto: link found on this page.",
        });
      }

      // Socials verification
      if (parsed.instagramHandle || parsed.instagramUrl) {
        validationTrace.push({
          step: "Instagram Discovery",
          status: "ok",
          detail: `Found Instagram: ${parsed.instagramHandle || parsed.instagramUrl}`,
        });
      } else {
        validationTrace.push({
          step: "Instagram Discovery",
          status: "warning",
          detail: "No instagram.com link or handle found in HTML anchor tags.",
        });
        validationErrors.push("Instagram link not present in website HTML.");
      }

      const durationMs = Date.now() - startTime;
      const status = validationErrors.length === 0 ? "success" : "partial_warning";

      const log = recordDiagnosticLog({
        scraperType: "website",
        targetUrl,
        durationMs,
        httpStatus,
        status,
        parsingOutcome: {
          addressExtracted: Boolean(parsed.address),
          addressValue: parsed.address,
          addressSource: parsed.address ? "schema_org" : "none",
          phoneExtracted: Boolean(parsed.contactPhone),
          phoneValue: parsed.contactPhone,
          phoneSource: parsed.contactPhone ? "tel_link" : "none",
          emailExtracted: Boolean(parsed.contactEmail),
          emailValue: parsed.contactEmail,
          socialsExtracted: {
            instagram: parsed.instagramHandle,
            facebook: parsed.facebookUrl,
            linkedin: parsed.linkedinUrl,
            twitter: parsed.twitterUrl,
            tiktok: parsed.tiktokUrl,
            youtube: parsed.youtubeUrl,
          },
        },
        validationTrace,
        validationErrors,
        rawHtmlResponseSnippet: rawHtml.slice(0, 45000),
        rawHtmlSize: rawHtml.length,
      });

      return NextResponse.json({
        success: true,
        log,
        parsed,
      });
    }

    // Otherwise use scrapeLinkData general pipeline
    const scraped = await scrapeLinkData(detected);
    const durationMs = Date.now() - startTime;

    if (scraped.type === "maps") {
      const mapsData = scraped.data;
      validationTrace.push({
        step: "Google Maps Place Extraction",
        status: "ok",
        detail: `Retrieved listing "${mapsData.title}" with category "${mapsData.category}"`,
      });

      if (mapsData.address) {
        validationTrace.push({
          step: "Place Address",
          status: "ok",
          detail: `Extracted location: "${mapsData.address}"`,
        });
      } else {
        validationTrace.push({
          step: "Place Address",
          status: "warning",
          detail: "No street address found on Google Maps place item.",
        });
        validationErrors.push("Google Maps place lacks street address.");
      }

      if (mapsData.phone) {
        validationTrace.push({
          step: "Place Phone",
          status: "ok",
          detail: `Extracted phone: "${mapsData.phone}"`,
        });
      } else {
        validationTrace.push({
          step: "Place Phone",
          status: "warning",
          detail: "No telephone number listed on Google Maps place.",
        });
        validationErrors.push("No telephone number on Google Maps place.");
      }

      if (mapsData.instagramHandle) {
        validationTrace.push({
          step: "Instagram Link",
          status: "ok",
          detail: `Instagram profile: ${mapsData.instagramHandle}`,
        });
      } else {
        validationTrace.push({
          step: "Instagram Link",
          status: "warning",
          detail: "Google Maps place has no linked Instagram profile.",
        });
        validationErrors.push("No Instagram link on Google Maps profile.");
      }

      const status = validationErrors.length === 0 ? "success" : "partial_warning";
      const log = recordDiagnosticLog({
        scraperType: "maps",
        targetUrl,
        durationMs,
        httpStatus: 200,
        status,
        parsingOutcome: {
          addressExtracted: Boolean(mapsData.address),
          addressValue: mapsData.address,
          addressSource: "assembled_parts",
          phoneExtracted: Boolean(mapsData.phone),
          phoneValue: mapsData.phone || null,
          phoneSource: mapsData.phone ? "apify" : "none",
          emailExtracted: false,
          emailValue: null,
          socialsExtracted: {
            instagram: mapsData.instagramHandle || null,
            facebook: mapsData.facebookUrl || null,
          },
        },
        validationTrace,
        validationErrors,
        rawHtmlResponseSnippet: JSON.stringify(mapsData, null, 2),
        rawHtmlSize: JSON.stringify(mapsData).length,
      });

      return NextResponse.json({
        success: true,
        log,
        parsed: mapsData,
      });
    }

    // Instagram or other type
    const duration = Date.now() - startTime;
    const log = recordDiagnosticLog({
      scraperType: detected.type as "instagram" | "website" | "maps",
      targetUrl,
      durationMs: duration,
      httpStatus: 200,
      status: "success",
      parsingOutcome: {
        addressExtracted: false,
        addressValue: null,
        addressSource: "none",
        phoneExtracted: false,
        phoneValue: null,
        phoneSource: "none",
        emailExtracted: false,
        emailValue: null,
        socialsExtracted: {
          instagram: detected.type === "instagram" ? `@${detected.handle}` : null,
        },
      },
      validationTrace: [
        { step: "Profile Link", status: "ok", detail: `Parsed profile handle: @${detected.handle}` },
      ],
      validationErrors: [],
      rawHtmlResponseSnippet: JSON.stringify(scraped.data, null, 2),
      rawHtmlSize: JSON.stringify(scraped.data).length,
    });

    return NextResponse.json({
      success: true,
      log,
      parsed: scraped.data,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Diagnostic scrape failed";
    validationTrace.push({
      step: "Execution Error",
      status: "failed",
      detail: errMessage,
    });
    validationErrors.push(errMessage);

    const log = recordDiagnosticLog({
      scraperType: "direct_test",
      targetUrl,
      durationMs: Date.now() - startTime,
      httpStatus: 500,
      status: "error",
      parsingOutcome: {
        addressExtracted: false,
        addressValue: null,
        addressSource: "none",
        phoneExtracted: false,
        phoneValue: null,
        phoneSource: "none",
        emailExtracted: false,
        emailValue: null,
        socialsExtracted: {},
      },
      validationTrace,
      validationErrors,
      rawHtmlResponseSnippet: `Error: ${errMessage}`,
      rawHtmlSize: 0,
      errorMessage: errMessage,
    });

    return NextResponse.json({ success: false, log, error: errMessage }, { status: 500 });
  }
}
