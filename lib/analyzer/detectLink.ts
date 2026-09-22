export type DetectedLinkType = "instagram" | "website" | "maps" | "facebook" | "unknown";

export interface DetectedLink {
  type: DetectedLinkType;
  handle?: string;
  domain?: string;
  cleanUrl: string;
  originalUrl: string;
  displayName: string;
  isBlocked?: boolean;
}

/**
 * Checks whether an IP or hostname is private/loopback/internal (SSRF mitigation)
 */
function isDisallowedHost(host: string): boolean {
  const normalized = host.toLowerCase().trim();

  // Loopback and internal hostnames
  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".lan") ||
    normalized.endsWith(".test") ||
    normalized.endsWith(".example") ||
    normalized.endsWith(".invalid")
  ) {
    return true;
  }

  // Cloud metadata IP
  if (normalized === "169.254.169.254" || normalized.startsWith("169.254.")) {
    return true;
  }

  // Private IPv4 ranges
  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 0) return true; // 0.0.0.0/8
  }

  return false;
}

/**
 * Detects the business link type (Instagram, Website, Google Maps, Facebook)
 * and extracts relevant handles and domains while ensuring safety.
 */
export function detectLinkType(url: string): DetectedLink {
  if (!url || typeof url !== "string") {
    return {
      type: "unknown",
      cleanUrl: "",
      originalUrl: "",
      displayName: "Unknown Link",
    };
  }

  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1000) {
    return {
      type: "unknown",
      cleanUrl: "",
      originalUrl: "",
      displayName: "Invalid Link",
    };
  }

  // Check for dangerous URI schemes
  if (/^(javascript|data|file|vbscript|blob):/i.test(trimmed)) {
    return {
      type: "unknown",
      cleanUrl: "",
      originalUrl: trimmed,
      displayName: "Blocked Scheme",
      isBlocked: true,
    };
  }

  // Auto-prepend https:// if missing
  const withProto =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProto);

    // Validate protocol
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        type: "unknown",
        cleanUrl: "",
        originalUrl: trimmed,
        displayName: "Invalid Protocol",
        isBlocked: true,
      };
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = parsed.pathname;

    // Disallow SSRF targets
    if (isDisallowedHost(host)) {
      return {
        type: "unknown",
        cleanUrl: "",
        originalUrl: trimmed,
        displayName: "Private / Blocked Address",
        isBlocked: true,
      };
    }

    // 1. Instagram Profile
    if (host === "instagram.com" || host === "instagr.am") {
      const parts = pathname.split("/").filter(Boolean);
      let handle = parts[0] || "";
      // Filter out non-profile segments
      if (["p", "reel", "reels", "stories", "explore", "direct", "tv"].includes(handle.toLowerCase())) {
        handle = parts[1] || "";
      }
      handle = handle.replace(/[^a-zA-Z0-9._]/g, "");

      return {
        type: "instagram",
        handle: handle || undefined,
        domain: "instagram.com",
        cleanUrl: handle ? `https://www.instagram.com/${handle}/` : withProto,
        originalUrl: url,
        displayName: handle ? `@${handle}` : "Instagram Profile",
      };
    }

    // 2. Google Maps / Place
    if (
      host.includes("maps.google") ||
      (host.includes("google.") && pathname.includes("/maps")) ||
      host === "g.page" ||
      host === "maps.app.goo.gl"
    ) {
      let placeName = "Google Maps Listing";
      if (pathname.includes("/place/")) {
        const placePart = pathname.split("/place/")[1]?.split("/")[0];
        if (placePart) {
          placeName = decodeURIComponent(placePart.replace(/\+/g, " "));
        }
      }
      return {
        type: "maps",
        domain: host,
        cleanUrl: withProto,
        originalUrl: url,
        displayName: placeName,
      };
    }

    // 3. Facebook Page
    if (host === "facebook.com" || host === "fb.com" || host === "fb.watch") {
      const parts = pathname.split("/").filter(Boolean);
      let handle = parts[0] || "";
      if (["pages", "groups", "profile.php", "watch", "events"].includes(handle.toLowerCase())) {
        handle = parts[1] || parts[0] || "";
      }
      handle = handle.replace(/[/?&].*$/, "");
      return {
        type: "facebook",
        handle: handle || undefined,
        domain: "facebook.com",
        cleanUrl: withProto,
        originalUrl: url,
        displayName: handle ? `fb.com/${handle}` : "Facebook Page",
      };
    }

    // 4. Any other URL is a Website
    const domain = host;
    return {
      type: "website",
      domain,
      cleanUrl: withProto,
      originalUrl: url,
      displayName: domain,
    };
  } catch {
    return {
      type: "unknown",
      cleanUrl: "",
      originalUrl: trimmed,
      displayName: "Malformed URL",
    };
  }
}
