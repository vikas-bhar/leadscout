// Data quality validator for business listings and Instagram profiles

export interface ValidationResult {
  isValid: boolean;
  quality: "high" | "medium" | "low" | "reject";
  score: number;
  issues: string[];
  warnings: string[];
}

export function validateBusinessData(b: {
  name?: string | null;
  isPermanentlyClosed?: boolean;
  reviewCount?: number;
  address?: string | null;
  category?: string | null;
  mapsUrl?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  rating?: number | null;
}): ValidationResult {
  if (!b.name || b.name === "Unknown Business") {
    return { isValid: false, quality: "reject", score: 0, issues: ["No business name"], warnings: [] };
  }
  if (b.isPermanentlyClosed) {
    return { isValid: false, quality: "reject", score: 0, issues: ["Business permanently closed"], warnings: [] };
  }
  if (typeof b.reviewCount === "number" && b.reviewCount < 3) {
    return { isValid: false, quality: "reject", score: 0, issues: ["Too few reviews"], warnings: [] };
  }

  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!b.address) { issues.push("No address"); score -= 20; }
  if (!b.category || b.category === "Business") { warnings.push("Generic category"); score -= 10; }
  if (!b.mapsUrl) { warnings.push("No Maps URL"); score -= 5; }
  if (!b.coordinates) { warnings.push("No coordinates"); score -= 5; }
  if (b.rating === null || b.rating === undefined) { warnings.push("No rating"); score -= 10; }

  const quality: ValidationResult["quality"] = score >= 80 ? "high" : score >= 60 ? "medium" : score >= 40 ? "low" : "reject";
  return { isValid: quality !== "reject", quality, score, issues, warnings };
}

export function validateInstagramData(
  ig: { found?: boolean; isPrivate?: boolean; confidence?: number; followers?: number | null; lastPostDate?: string | null; engagementRate?: number | null } | null,
  businessName?: string
): ValidationResult {
  if (!ig?.found) return { isValid: false, quality: "reject", score: 0, issues: ["No Instagram found"], warnings: [] };
  if (ig.isPrivate) return { isValid: false, quality: "reject", score: 0, issues: ["Account is private"], warnings: [] };

  const confidence = ig.confidence ?? 1.0;
  if (confidence < 0.4) return { isValid: false, quality: "reject", score: 0, issues: [`Account mismatch for ${businessName || "business"}`], warnings: [] };

  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (confidence < 0.6) { warnings.push("Low confidence match"); score -= 20; }
  if (!ig.followers || ig.followers < 10) { warnings.push("Very low followers"); score -= 15; }
  if (!ig.lastPostDate) { warnings.push("No post date available"); score -= 10; }
  if (ig.engagementRate === null || ig.engagementRate === undefined) { warnings.push("Missing engagement rate"); score -= 10; }

  const quality: ValidationResult["quality"] = score >= 80 ? "high" : score >= 60 ? "medium" : score >= 40 ? "low" : "reject";
  return { isValid: quality !== "reject", quality, score, issues, warnings };
}
