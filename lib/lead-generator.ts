import type { FreelancerType, Gap, Lead, PitchBundle, UrgencyLevel } from "@/types";
import { FREELANCER_TYPE_LABELS } from "@/types";

const CATEGORY_NAMES: Record<string, string[]> = {
  Restaurant: [
    "Bella Vista Bistro",
    "The Rustic Oak Kitchen",
    "Copper Kettle Table",
    "Harvest & Hearth",
    "Blue Heron Grill",
    "Mercado Cocina",
    "Urban Sprout Eatery",
    "Juniper & Thyme",
  ],
  Cafe: [
    "Velvet Bean Roastery",
    "Morning Echo Coffee",
    "Artisan Grind Co.",
    "Cornerstone Espresso",
    "Timber & Steam Cafe",
    "The Steaming Hearth",
    "Monarch Coffee Lab",
  ],
  "Salon / Spa": [
    "Aura Botanica Spa",
    "Luxe & Co Hair Studio",
    "Glow Haven Wellness",
    "Velvet Lounge Salon",
    "Pure Ritual Spa",
    "Oasis Aesthetics",
    "Sage & Stone Retreat",
  ],
  "Gym / Fitness": [
    "Apex Strength & Conditioning",
    "Pulse Athletic Club",
    "Ironwood Crossfit",
    "Verve Yoga & Pilates",
    "Kinetic Flow Studio",
    "Elevate Performance Gym",
  ],
  "Dental clinic": [
    "Oakwood Family Dental",
    "Beacon Smiles Dentistry",
    "Summit Crest Dental Studio",
    "Radiant Dental Care",
    "Valley Pediatric & Family Dental",
  ],
  "Law firm": [
    "Sterling & Vance Partners",
    "Heritage Legal Group",
    "Crestview Advocacy LLC",
    "Pinnacle Trust Law",
    "Fairview Litigation Associates",
  ],
  "Real estate agency": [
    "Horizon Realty Partners",
    "Keystone Living Properties",
    "Vista Point Real Estate",
    "Foundry Urban Realty",
    "Legacy Heritage Homes",
  ],
  "Retail store": [
    "Curated Nomad Goods",
    "Birch & Thread Boutique",
    "The Daily Mercantile",
    "Sparrow Home Decor",
    "Foundry Goods Co.",
  ],
  Hotel: [
    "The Grand Elm Inn",
    "Starlight Harbor Hotel",
    "The Presidio Boutique Lodge",
    "The Westfall House",
  ],
  "Auto repair": [
    "Precision European Autoworks",
    "Midtown Master Mechanics",
    "Apex Transmission & Brakes",
    "Apex Fleet & Diesel Care",
  ],
  "Medical clinic": [
    "Summit Health Collective",
    "Prime Horizon Urgent Care",
    "Cedar Grove Integrative Health",
  ],
  Bakery: [
    "Flour & Hearth Patisserie",
    "Golden Crust Sourdough",
    "Sweet Briar Artisan Pastries",
    "Honey & Rye Bakery",
  ],
  "Pet services": [
    "Bark & Bubbles Pet Spa",
    "Pawsitive Care Veterinary",
    "Urban Hound Daycare & Boarding",
  ],
  "Home services": [
    "Blue Ridge Craft Electric",
    "Cascade Plumbing & Heating",
    "TrueTimber Custom Woodworking",
  ],
  "Photography studio": [
    "Lumina Lens Studio",
    "Prism & Frame Creative",
    "North Star Portrait Atelier",
  ],
};

export function generateMockLeads({
  searchId,
  userId,
  location,
  businessCategory,
  freelancerType,
  count,
  place,
  city,
  country,
}: {
  searchId: string;
  userId: string;
  location: string;
  businessCategory: string;
  freelancerType: FreelancerType;
  count: number;
  place?: string;
  city?: string;
  country?: string;
}): Array<Omit<Lead, "id" | "createdAt">> {
  const primaryArea = place?.trim() || city?.trim() || location.split(",")[0]?.trim() || "Metro";
  const baseNames = CATEGORY_NAMES[businessCategory] || [
    `${primaryArea} Premier ${businessCategory}`,
    `The ${businessCategory} Spot`,
    `Classic ${businessCategory} Works`,
    `Apex ${businessCategory} Studio`,
    `Metro ${businessCategory} Group`,
  ];

  const results: Array<Omit<Lead, "id" | "createdAt">> = [];

  for (let i = 0; i < count; i++) {
    const rawName = baseNames[i % baseNames.length];
    const suffix = i >= baseNames.length ? ` #${Math.floor(i / baseNames.length) + 1}` : "";
    const businessName = `${rawName}${suffix}`;
    const handle = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16);

    // Varied ratings, reviews, website presence
    const googleRating = Number((3.8 + (i % 12) * 0.1).toFixed(1));
    const reviewCount = 14 + (i * 27) % 320;
    const hasWebsite = i % 4 !== 0; // 25% don't have website
    const hasInstagram = i % 5 !== 0; // 80% have Instagram
    const usesReels = i % 3 === 0;
    const hasLinkInBio = i % 2 === 0;

    // Determine Opportunity Score (higher score = bigger opportunity / digital gap)
    let opportunityScore = 65 + ((i * 13) % 33);
    if (!hasWebsite) opportunityScore = Math.min(98, opportunityScore + 15);
    if (!usesReels) opportunityScore = Math.min(98, opportunityScore + 8);
    if (!hasLinkInBio) opportunityScore = Math.min(98, opportunityScore + 6);

    let urgencyLevel: UrgencyLevel = "medium";
    if (opportunityScore >= 85) urgencyLevel = "critical";
    else if (opportunityScore >= 75) urgencyLevel = "high";
    else if (opportunityScore < 65) urgencyLevel = "low";

    // Build specific digital gaps based on freelancer type
    const gaps: Gap[] = [];
    if (freelancerType === "web_designer") {
      if (!hasWebsite) {
        gaps.push({
          category: "Website Presence",
          problem: "No official website listed on Google Maps profile",
          impact: "Losing an estimated 35-50% of direct search inquiries to competitors",
          severity: "high",
          yourSolution: "Build a high-converting single-page landing page with direct booking integration",
        });
      } else {
        gaps.push({
          category: "Mobile UX & Speed",
          problem: "Outdated template without clear call-to-action or mobile optimization",
          impact: "High bounce rate on smartphone visitors from Google Maps",
          severity: "medium",
          yourSolution: "Redesign responsive booking flow and modernize typography and layout",
        });
      }
      gaps.push({
        category: "Conversion Architecture",
        problem: "No online inquiry form or reservation widget",
        impact: "Customers have to call manually during business hours",
        severity: "medium",
        yourSolution: "Embed automated scheduling widget and instant quote inquiry form",
      });
    } else if (freelancerType === "social_media_manager") {
      gaps.push({
        category: "Content Consistency",
        problem: "Inactive feed with no posts in the last 45+ days",
        impact: "Followers assume business might be inactive or low-engagement",
        severity: "high",
        yourSolution: "Implement a 3x/week content calendar focusing on staff, process, and customer reviews",
      });
      if (!usesReels) {
        gaps.push({
          category: "Algorithm Reach",
          problem: "Zero short-form video or Reels presence",
          impact: "Missing 70% of organic discovery traffic on Instagram Explore",
          severity: "high",
          yourSolution: "Produce 2 short-form Reels weekly featuring behind-the-scenes and customer spotlights",
        });
      }
      if (!hasLinkInBio) {
        gaps.push({
          category: "Traffic Routing",
          problem: "No link-in-bio or outdated link",
          impact: "Zero attribution from profile visits to customer bookings",
          severity: "medium",
          yourSolution: "Configure a custom Linktree or direct lead capture landing page",
        });
      }
    } else if (freelancerType === "seo_specialist") {
      gaps.push({
        category: "Local Pack Ranking",
        problem: "Missing secondary Google Business Profile categories and low review velocity",
        impact: "Ranked below top 3 local pack for high-intent keywords in " + location,
        severity: "high",
        yourSolution: "Optimize GBP profile, categories, photo uploads, and review capture system",
      });
      gaps.push({
        category: "On-Page SEO",
        problem: "No localized schema markup or city-specific landing pages",
        impact: "Google cannot reliably connect service pages to nearby search queries",
        severity: "medium",
        yourSolution: "Implement LocalBusiness JSON-LD schema and geo-targeted meta tags",
      });
    } else {
      // Default / copywriter / video editor / etc.
      gaps.push({
        category: "Brand Positioning",
        problem: "Generic copy that sounds identical to 5 other local competitors",
        impact: "Price shoppers choose cheapest option due to lack of distinct value proposition",
        severity: "high",
        yourSolution: "Write sharp, benefit-driven copy emphasizing unique craftsmanship and reviews",
      });
      gaps.push({
        category: "Visual Storytelling",
        problem: "Low-quality stock photography instead of authentic behind-the-scenes content",
        impact: "Lower trust score among modern prospective clients",
        severity: "medium",
        yourSolution: "Curate a high-definition photo/video asset library highlighting the local team",
      });
    }

    // Build personalized pitches
    const pitchBundle: PitchBundle = {
      pitches: [
        {
          style: "instagram_dm",
          tone: "Friendly, observant, value-first",
          subject: null,
          message: `Hey ${businessName.split(" ")[0]} team! Loved seeing your recent reviews in ${location}. I noticed your Instagram profile could be bringing in 3x more local customers if you posted short Reels of your work. I put together 2 quick ideas that worked for a similar ${businessCategory.toLowerCase()}—mind if I send the screenshot over? No pitch, just wanted to share!`,
          bestTimeToSend: "afternoon",
          expectedResponseRate: "high",
        },
        {
          style: "email",
          tone: "Professional, analytical, direct",
          subject: `Quick observation about ${businessName}'s online presence in ${location}`,
          message: `Hi there,\n\nI was doing some research on top-rated ${businessCategory.toLowerCase()}s in ${location} and came across ${businessName}.\n\nYour Google reviews are fantastic (${googleRating}★), but I noticed a couple of digital gaps that are likely costing you weekly appointments:\n1. ${gaps[0]?.problem || "Outdated online booking flow"}\n2. ${gaps[1]?.problem || "Missing video content"}\n\nI specialize in helping local businesses fix exactly this. Would you be open to a 5-minute loom video showing how to capture an extra 10-15 clients a month?\n\nBest,\nA Freelance ${FREELANCER_TYPE_LABELS[freelancerType]}`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
        {
          style: "whatsapp",
          tone: "Casual & direct",
          subject: null,
          message: `Hi ${businessName}! Found you via Google Maps. You have great reviews, but no fast way for mobile customers to book instantly from their phone. Made a quick mockup showing how it could look: would you like to see it?`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
      ],
      followUpMessage: `Hey! Just floating this back to the top of your inbox. Did you get a chance to review the ideas I sent over regarding ${businessName}'s digital presence? Happy to answer any questions whenever you have a moment!`,
      pitchTips: [
        `Reference their recent ${googleRating}★ review to build immediate rapport`,
        `Send the Instagram DM between 1:00 PM - 3:30 PM local time in ${location}`,
        `Lead with the specific gap (${gaps[0]?.category}) rather than listing generic services`,
      ],
    };

    results.push({
      searchId,
      userId,
      rank: i + 1,
      businessName,
      businessCategory,
      location,
      googleRating,
      reviewCount,
      hasWebsite,
      websiteUrl: hasWebsite ? `https://www.${handle}.com` : null,
      phone: `(${300 + (i * 17) % 600}) 555-${1000 + (i * 83) % 8999}`,
      photoCount: 12 + (i * 7) % 85,
      mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessName + " " + location)}`,
      instagramHandle: hasInstagram ? `@${handle}` : null,
      instagramFollowers: hasInstagram ? 450 + (i * 320) % 9400 : null,
      instagramFollowing: hasInstagram ? 280 + (i * 55) % 1200 : null,
      instagramPosts: hasInstagram ? 35 + (i * 12) % 450 : null,
      lastPostDate: hasInstagram ? `${(i % 5) + 1} months ago` : null,
      engagementRate: hasInstagram ? Number((1.2 + (i % 7) * 0.4).toFixed(1)) : null,
      hasLinkInBio,
      usesReels,
      opportunityScore,
      urgencyLevel,
      gapsFound: gaps,
      bestService: gaps[0]?.yourSolution || `Professional ${FREELANCER_TYPE_LABELS[freelancerType]} Retainer`,
      secondaryServices: gaps.slice(1).map((g) => g.yourSolution),
      buyingSignals: [
        `Strong Google reputation (${googleRating}★)`,
        hasWebsite ? "Invests in digital marketing" : "Ready for first serious online presence",
        country ? `Active in ${country} local market with repeat clientele` : "Active in local market with repeat clientele",
      ],
      pitches: pitchBundle,
      estimatedBudget: opportunityScore > 80 ? "$1,500 – $3,000 / project" : "$800 – $1,500 / project",
      status: "new",
      notes: null,
      tags:
        opportunityScore >= 80
          ? ["Hot", "Qualified"]
          : opportunityScore >= 68
          ? ["Warm"]
          : !usesReels
          ? ["Follow-up needed", "Cold"]
          : ["Cold"],
      contactedAt: null,
    });
  }

  // Sort by opportunityScore DESC
  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
