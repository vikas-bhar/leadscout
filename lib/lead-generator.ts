import type { FreelancerType, Gap, Lead, PitchBundle, UrgencyLevel } from "@/types";
import { FREELANCER_TYPE_LABELS } from "@/types";

export interface GenerateLeadsParams {
  searchId: string;
  userId: string;
  location: string;
  businessCategory: string;
  freelancerType: FreelancerType;
  count: number;
  place?: string;
  city?: string;
  country?: string;
}

// Authentic local districts, neighborhoods, and commercial thoroughfares by city/country
const CITY_DISTRICTS: Record<string, string[]> = {
  // UAE
  dubai: [
    "Jumeirah Beach Road, Jumeirah 1",
    "Al Wasl Road, Al Safa",
    "Sheikh Zayed Road, Trade Centre 1",
    "Marasi Drive, Business Bay",
    "Downtown Boulevard, Downtown Dubai",
    "City Walk, Al Wasl",
    "Dubai Marina Walk, Dubai Marina",
    "Al Barsha 1, near Mall of the Emirates",
    "Al Quoz Industrial Area 3",
    "Gate Precinct, DIFC",
    "Al Maktoum Road, Deira",
    "Cluster T, Jumeirah Lake Towers (JLT)",
    "The Walk, JBR (Jumeirah Beach Residence)",
    "Bluewaters Island Boulevard",
    "Al Meydan Road, Nad Al Sheba",
  ],
  "abu dhabi": [
    "Corniche Road, Al Khalidiyah",
    "Al Maryah Island, Global Market Square",
    "Al Reem Island, Shams Boutik",
    "Hamdan Bin Mohammed Street, Al Danah",
    "Yas Marina Promenade, Yas Island",
    "Al Bateen Marina",
  ],
  sharjah: [
    "Al Majaz Waterfront, Corniche Street",
    "Al Taawun Street",
    "University City Road, Muwailih",
    "King Faisal Street, Al Qasimia",
  ],

  // UK
  london: [
    "Regent Street, St. James's",
    "Oxford Street, Soho",
    "Kings Road, Chelsea",
    "Camden High Street, Camden Town",
    "Shoreditch High Street, Hackney",
    "Kensington High Street, Kensington",
    "Covent Garden Piazza",
    "Marylebone High Street, Marylebone",
    "Canary Wharf, Canada Square",
    "Bermondsey Street, Southwark",
    "Chiswick High Road, Chiswick",
  ],
  manchester: [
    "Deansgate, City Centre",
    "Thomas Street, Northern Quarter",
    "Hardman Square, Spinningfields",
    "Cutting Room Square, Ancoats",
  ],
  birmingham: [
    "Colmore Row, Business District",
    "Custard Factory, Digbeth",
    "Warstone Lane, Jewellery Quarter",
  ],

  // USA
  "new york": [
    "Broadway, SoHo",
    "5th Avenue, Flatiron District",
    "Bedford Ave, Williamsburg, Brooklyn",
    "Madison Ave, Upper East Side",
    "Amsterdam Ave, Upper West Side",
    "DUMBO, Water Street",
    "West 4th Street, Greenwich Village",
  ],
  "los angeles": [
    "Abbot Kinney Blvd, Venice",
    "Sunset Blvd, West Hollywood",
    "Wilshire Blvd, Beverly Hills",
    "Melrose Ave, Fairfax District",
    "Santa Monica Blvd, Santa Monica",
  ],
  chicago: [
    "Michigan Ave, Magnificent Mile",
    "North Halsted St, Lincoln Park",
    "Milwaukee Ave, Wicker Park",
    "Fulton Market, West Loop",
  ],
  miami: [
    "Ocean Drive, South Beach",
    "Brickell Ave, Brickell Financial District",
    "NW 2nd Ave, Wynwood Arts District",
    "Miracle Mile, Coral Gables",
  ],
  "san francisco": [
    "Market St, Financial District",
    "Valencia St, Mission District",
    "Chestnut St, Marina District",
    "Union Street, Cow Hollow",
  ],

  // India
  mumbai: [
    "Hill Road, Bandra West",
    "Linking Road, Khar West",
    "Colaba Causeway, Colaba",
    "Senapati Bapat Marg, Lower Parel",
    "Lokhandwala Complex, Andheri West",
    "Juhu Tara Road, Juhu",
    "Central Avenue, Hiranandani Gardens, Powai",
    "Dr. Annie Besant Road, Worli",
  ],
  delhi: [
    "Connaught Place, Inner Circle",
    "M Block Market, Greater Kailash 1",
    "Khan Market, Rabindra Nagar",
    "Hauz Khas Village",
    "Defence Colony Main Market",
    "Cyber City, DLF Phase 2 (Gurgaon)",
  ],
  bangalore: [
    "100 Feet Road, Indiranagar",
    "80 Feet Road, 4th Block, Koramangala",
    "MG Road, Central Business District",
    "Lavelle Road, Shanthala Nagar",
    "Whitefield Main Road, EPIP Zone",
    "12th Main, HAL 2nd Stage, Indiranagar",
  ],

  // Saudi Arabia
  riyadh: [
    "King Fahd Road, Al Olaya",
    "Prince Muhammad Bin Abdulaziz Rd (Tahlia St)",
    "Northern Ring Branch Rd, Al Nakheel",
    "Hittin District, Boulevard City Area",
    "Diplomatic Quarter (Al Safarat)",
  ],
  jeddah: [
    "Corniche Road, Al Shati",
    "Prince Mohammed Bin Abdulaziz St (Tahlia)",
    "Al Andalus District",
    "Al Rawdah District",
  ],

  // Australia
  sydney: [
    "George Street, CBD",
    "Crown Street, Surry Hills",
    "Campbell Parade, Bondi Beach",
    "King Street, Newtown",
    "Military Road, Mosman",
    "Darling Street, Balmain",
  ],
  melbourne: [
    "Collins Street, Melbourne CBD",
    "Chapel Street, South Yarra",
    "Brunswick Street, Fitzroy",
    "Acland Street, St Kilda",
  ],

  // Canada
  toronto: [
    "Queen Street West, Trinity-Bellwoods",
    "Bloor Street West, Yorkville",
    "King Street West, Entertainment District",
    "Yonge Street, Midtown",
  ],
  vancouver: [
    "Robson Street, Downtown",
    "West 4th Avenue, Kitsilano",
    "Water Street, Gastown",
    "Main Street, Mount Pleasant",
  ],
};

// Realistic business names categorized by business niche and localized tone
const CATEGORY_NAMES: Record<string, string[]> = {
  "Dental clinic": [
    "Smile Boutique Dental Studio",
    "Apex Family & Cosmetic Dentistry",
    "Elite Care Dental Center",
    "Radiant Pearl Dental Lounge",
    "White Oak Dental Associates",
    "Summit Crest Dental Studio",
    "Artisan Smiles Aesthetic Clinic",
    "Harbor View Dental & Orthodontics",
    "Pure Glow Dental Care",
    "Metro Laser Dental Specialists",
    "Bespoke Oral Health Center",
    "Precision Dental Studio",
  ],
  "Salon / Spa": [
    "Luxe Botanica Wellness Spa",
    "Aura Velvet Beauty Lounge",
    "Glow Haven Aesthetic Studio",
    "Oasis Rituals Day Spa",
    "The Parlour Hair & Esthetics",
    "Sage & Stone Wellness Sanctuary",
    "Maison de Beaute Salon",
    "Reverie Organic Spa",
    "Lumiere Aesthetics & Laser Bar",
    "Silk & Slate Beauty Atelier",
  ],
  Restaurant: [
    "Bella Vista Italian Kitchen",
    "The Rustic Oak Table & Bar",
    "Artisan Hearth Modern Bistro",
    "Mercado Cocina & Cantina",
    "Urban Sprout Farm-to-Table",
    "Juniper & Thyme Dining Room",
    "Blue Harbor Seafood Grill",
    "Copper Kettle Social House",
    "Verdant Osteria",
    "The Black Walnut Kitchen",
  ],
  Cafe: [
    "Velvet Bean Specialty Coffee",
    "Morning Echo Artisan Roastery",
    "Timber & Steam Espresso Lab",
    "The Steaming Hearth Bakery & Cafe",
    "Cornerstone Coffee Works",
    "Monarch Brew Bar",
    "Kinfolk Daily Roasters",
    "Amber Leaf Cafe & Pantry",
  ],
  "Gym / Fitness": [
    "Pulse Athletic Club & Performance",
    "Apex Strength & Conditioning Lab",
    "Kinetic Flow Yoga & Pilates",
    "Ironwood CrossFit & Functional Gym",
    "Elevate Fitness Collective",
    "Verve Movement Studio",
    "Titan Performance Club",
    "Origin Wellness & Strength",
  ],
  "Law firm": [
    "Sterling, Vance & Associates",
    "Heritage Commercial Legal Group",
    "Crestview Corporate Advocacy",
    "Pinnacle Trust & Estate Counsel",
    "Fairview Litigation Partners",
    "Beacon Law Advisory",
  ],
  "Real estate agency": [
    "Horizon Prime Realty Partners",
    "Keystone Living Properties",
    "Vista Point Luxury Real Estate",
    "Foundry Urban Realty Group",
    "Legacy Heritage Homes",
    "Sovereign Residential Advisory",
  ],
  "Retail store": [
    "Curated Nomad Lifestyle Goods",
    "Birch & Thread Boutique",
    "The Daily Mercantile & Co.",
    "Sparrow Home & Living",
    "Foundry Crafted Goods",
    "Loom & Timber Concept Store",
  ],
  Hotel: [
    "The Grand Elm Boutique Hotel",
    "Starlight Harbor Suites",
    "The Presidio Luxury Lodge",
    "The Heritage House Hotel",
    "Azure Cove Beach Resort & Suites",
  ],
  "Auto repair": [
    "Precision European Autoworks",
    "Apex Master Mechanics & Tuning",
    "Midtown Fleet & Diagnostic Care",
    "Elite Performance Autocare",
    "Craftsman Collision & Service Lab",
  ],
  "Medical clinic": [
    "Summit Integrative Health Clinic",
    "Prime Horizon Urgent & Family Care",
    "Cedar Grove Wellness Center",
    "Aegis Medical Specialists",
    "Alliance Diagnostic Clinic",
  ],
  Bakery: [
    "Flour & Hearth Artisan Patisserie",
    "Golden Crust Sourdough Bakery",
    "Sweet Briar Fine Pastries",
    "Honey & Rye Micro-Bakery",
    "Boulangerie L'Artisan",
  ],
  "Pet services": [
    "Bark & Bubbles Luxury Pet Spa",
    "Pawsitive Care Veterinary Center",
    "Urban Hound Daycare & Boarding",
    "Tailored Tails Grooming Lounge",
  ],
  "Home services": [
    "Blue Ridge Craft Electrical",
    "Cascade Plumbing & Climate Care",
    "TrueTimber Custom Woodworking",
    "Vertex Roofing & Renovation",
  ],
  "Photography studio": [
    "Lumina Lens Creative Studio",
    "Prism & Frame Portrait Atelier",
    "North Star Commercial Studio",
    "Aura Light Photography Co.",
  ],
};

function getCountryCode(countryStr = ""): string {
  const c = countryStr.toLowerCase().trim();
  if (c.includes("uae") || c.includes("emirate") || c.includes("dubai")) return "AE";
  if (c.includes("uk") || c.includes("united kingdom") || c.includes("britain") || c.includes("london")) return "GB";
  if (c.includes("india") || c.includes("mumbai") || c.includes("delhi")) return "IN";
  if (c.includes("saudi") || c.includes("riyadh") || c.includes("ksa")) return "SA";
  if (c.includes("australia") || c.includes("sydney")) return "AU";
  if (c.includes("canada") || c.includes("toronto")) return "CA";
  if (c.includes("germany") || c.includes("berlin")) return "DE";
  if (c.includes("france") || c.includes("paris")) return "FR";
  if (c.includes("singapore")) return "SG";
  if (c.includes("qatar") || c.includes("doha")) return "QA";
  if (c.includes("kuwait")) return "KW";
  if (c.includes("bahrain")) return "BH";
  if (c.includes("pakistan")) return "PK";
  return "US";
}

function getRealisticPhone(countryCode: string, index: number): string {
  const seed = (index * 73) % 900;
  switch (countryCode) {
    case "AE":
      // Dubai/UAE Landline or Mobile
      if (index % 2 === 0) {
        return `+971 4 3${Math.floor(20 + (seed % 70))} ${Math.floor(1000 + (seed * 9) % 8999)}`;
      }
      return `+971 50 ${Math.floor(200 + (seed % 700))} ${Math.floor(1000 + (seed * 11) % 8999)}`;

    case "GB":
      // UK London or Mobile
      if (index % 2 === 0) {
        return `+44 20 7${Math.floor(100 + (seed % 800))} ${Math.floor(1000 + (seed * 7) % 8999)}`;
      }
      return `+44 7${Math.floor(700 + (seed % 280))} ${Math.floor(100000 + (seed * 13) % 899999)}`;

    case "IN":
      // India Mobile
      const prefixes = ["98", "99", "97", "96", "91", "88"];
      return `+91 ${prefixes[index % prefixes.length]}${Math.floor(10 + (seed % 80))} ${Math.floor(10000 + (seed * 17) % 89999)}`;

    case "SA":
      // Saudi Arabia
      if (index % 2 === 0) {
        return `+966 11 4${Math.floor(10 + (seed % 80))} ${Math.floor(1000 + (seed * 7) % 8999)}`;
      }
      return `+966 50 ${Math.floor(200 + (seed % 700))} ${Math.floor(1000 + (seed * 11) % 8999)}`;

    case "AU":
      // Australia
      if (index % 2 === 0) {
        return `+61 2 9${Math.floor(100 + (seed % 800))} ${Math.floor(1000 + (seed * 7) % 8999)}`;
      }
      return `+61 4${Math.floor(10 + (seed % 80))} ${Math.floor(100 + (seed % 800))} ${Math.floor(100 + (seed * 3) % 890)}`;

    case "CA":
      return `+1 (${["416", "647", "604", "514"][index % 4]}) ${Math.floor(200 + (seed % 700))}-${Math.floor(1000 + (seed * 7) % 8999)}`;

    case "SG":
      return `+65 6${Math.floor(200 + (seed % 700))} ${Math.floor(1000 + (seed * 7) % 8999)}`;

    case "DE":
      return `+49 30 ${Math.floor(2000000 + (seed * 12345) % 7999999)}`;

    case "FR":
      return `+33 1 ${Math.floor(40 + (seed % 50))} ${Math.floor(10 + (seed % 80))} ${Math.floor(10 + (seed * 3) % 80)} ${Math.floor(10 + (seed * 7) % 80)}`;

    case "US":
    default:
      const areaCodes = ["212", "310", "415", "312", "305", "206", "512", "617"];
      return `+1 (${areaCodes[index % areaCodes.length]}) ${Math.floor(220 + (seed % 700))}-${Math.floor(1100 + (seed * 9) % 8800)}`;
  }
}

function getRealisticAddress(
  country: string,
  city: string,
  place: string | undefined,
  index: number
): { streetAddress: string; displayLocation: string } {
  const cityKey = (city || "").toLowerCase().trim();
  const districtList = CITY_DISTRICTS[cityKey];

  if (districtList && districtList.length > 0) {
    const district = districtList[index % districtList.length];
    const displayLocation = `${district}, ${city}, ${country}`.replace(/,\s*,/g, ", ").trim();
    return { streetAddress: district, displayLocation };
  }

  // Fallback for custom cities or unlisted places
  const primaryArea = place?.trim() || city?.trim() || "Central";
  const streetTypes = ["Boulevard", "Avenue", "High Street", "Plaza", "Commercial Way", "Parkway"];
  const streetName = `${primaryArea} ${streetTypes[index % streetTypes.length]}`;
  const displayLocation = [streetName, city, country].filter(Boolean).join(", ");
  return { streetAddress: streetName, displayLocation };
}

export function generateMockLeads({
  searchId,
  userId,
  location,
  businessCategory,
  freelancerType,
  count,
  place,
  city = "",
  country = "",
}: GenerateLeadsParams): Lead[] {
  // Infer missing country or city from location string if not explicitly given
  let effectiveCountry = country.trim();
  let effectiveCity = city.trim();

  if (!effectiveCountry || !effectiveCity) {
    const parts = location.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      effectiveCity = effectiveCity || parts[0];
      effectiveCountry = effectiveCountry || parts[parts.length - 1];
    } else {
      effectiveCity = effectiveCity || location;
      effectiveCountry = effectiveCountry || "UAE";
    }
  }

  const countryCode = getCountryCode(effectiveCountry);

  const baseNames = CATEGORY_NAMES[businessCategory] || [
    `${effectiveCity} Premier ${businessCategory}`,
    `Apex ${businessCategory} Studio`,
    `The ${businessCategory} Collective`,
    `Artisan ${businessCategory} House`,
    `Metro ${businessCategory} Specialists`,
    `Vanguard ${businessCategory} Group`,
    `Prime ${businessCategory} Center`,
  ];

  const results: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const rawName = baseNames[i % baseNames.length];
    const suffix = i >= baseNames.length ? ` (${effectiveCity} Branch)` : "";
    const businessName = `${rawName}${suffix}`;
    const cleanId = `lead_${searchId || "gen"}_${i + 1}_${Math.random().toString(36).slice(2, 8)}`;

    const { streetAddress, displayLocation } = getRealisticAddress(
      effectiveCountry,
      effectiveCity,
      place,
      i
    );

    // Business domain handle
    const domainSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 18);

    // Varied ratings, reviews, website presence
    const googleRating = Number((4.1 + (i % 9) * 0.1).toFixed(1));
    const reviewCount = 28 + (i * 37) % 480;
    const hasWebsite = i % 4 !== 0; // 75% have website
    const hasInstagram = i % 3 !== 0; // 66% have active Instagram
    const usesReels = i % 2 === 0;
    const hasLinkInBio = i % 2 !== 0;

    // Opportunity Score (higher score = bigger freelance opportunity)
    let opportunityScore = 64 + ((i * 11) % 32);
    if (!hasWebsite) opportunityScore = Math.min(98, opportunityScore + 14);
    if (!usesReels) opportunityScore = Math.min(98, opportunityScore + 8);
    if (!hasLinkInBio) opportunityScore = Math.min(98, opportunityScore + 6);

    let urgencyLevel: UrgencyLevel = "medium";
    if (opportunityScore >= 75) urgencyLevel = "critical";
    else if (opportunityScore >= 60) urgencyLevel = "high";
    else urgencyLevel = "low";

    // Build specific digital gaps based on freelancer type
    const gaps: Gap[] = [];
    if (freelancerType === "web_designer") {
      if (!hasWebsite) {
        gaps.push({
          category: "Website Presence",
          problem: `No official website listed on ${effectiveCity} Google Maps listing`,
          impact: "Losing up to 45% of high-intent search prospects directly to local competitors",
          severity: "high",
          yourSolution: "Build a high-converting single-page responsive site with direct WhatsApp & booking funnel",
        });
      } else {
        gaps.push({
          category: "Mobile UX & Speed",
          problem: "Outdated mobile layout without direct click-to-book on smartphone screens",
          impact: "High bounce rate from mobile visitors discovering them on Google Maps",
          severity: "medium",
          yourSolution: "Redesign responsive mobile booking flow with instant appointment confirmation",
        });
      }
      gaps.push({
        category: "Conversion Architecture",
        problem: "No automated inquiry widget or WhatsApp chat trigger",
        impact: "Visitors have to call manually during limited front-desk operating hours",
        severity: "medium",
        yourSolution: "Integrate 24/7 automated inquiry form and one-tap WhatsApp chat button",
      });
    } else if (freelancerType === "social_media_manager") {
      gaps.push({
        category: "Content Consistency",
        problem: "Low posting frequency with no visual updates in recent weeks",
        impact: "Prospective customers assume the establishment is less active or modern",
        severity: "high",
        yourSolution: "Implement a 3x/week content calendar spotlighting client results, ambiance, and team",
      });
      if (!usesReels) {
        gaps.push({
          category: "Short-Form Video (Reels)",
          problem: "Zero short-form video or Reels presence on Instagram",
          impact: `Missing organic discovery on Instagram Explore in the ${effectiveCity} area`,
          severity: "high",
          yourSolution: "Produce 2 high-energy Reels weekly featuring customer reviews and behind-the-scenes",
        });
      }
      if (!hasLinkInBio) {
        gaps.push({
          category: "Traffic Routing",
          problem: "No optimized link-in-bio on profile",
          impact: "Zero measurable attribution from Instagram profile visits to customer bookings",
          severity: "medium",
          yourSolution: "Set up branded link-in-bio linking directly to menu/services and booking",
        });
      }
    } else if (freelancerType === "seo_specialist") {
      gaps.push({
        category: "Local Pack Ranking",
        problem: `Not ranking in the top 3 Google Local Pack for ${businessCategory} in ${effectiveCity}`,
        impact: "Competitors capture 70%+ of the top phone calls and direction requests",
        severity: "high",
        yourSolution: "Optimize Google Business Profile categories, local citations, and review response velocity",
      });
      gaps.push({
        category: "Local Schema & Citations",
        problem: "Missing LocalBusiness structured schema markup on their website",
        impact: "Search engines cannot verify local geo-coordinates and service operating hours",
        severity: "medium",
        yourSolution: "Inject JSON-LD LocalBusiness schema and standardize NAP across local directories",
      });
    } else {
      // Default / copywriter / growth partner
      gaps.push({
        category: "Brand Positioning",
        problem: `Generic messaging identical to competitors in ${effectiveCity}`,
        impact: "Price shoppers pick competitors due to lack of distinct local value proposition",
        severity: "high",
        yourSolution: "Write sharp, benefit-led copy highlighting unique credentials and reviews",
      });
      gaps.push({
        category: "Visual Storytelling",
        problem: "Under-leveraged customer reviews and low visual social proof",
        impact: "Prospects hesitate before reaching out or booking",
        severity: "medium",
        yourSolution: "Curate a showcase of verified client testimonials and high-resolution visuals",
      });
    }

    // Build personalized outreach pitches
    const shortBiz = businessName.split(" ")[0] || "Team";
    const pitchBundle: PitchBundle = {
      pitches: [
        {
          style: "instagram_dm",
          tone: "Friendly, observant, value-first",
          subject: null,
          message: `Hey ${shortBiz} team! Loved seeing your ${googleRating}★ reputation in ${effectiveCity}. I noticed your digital channels could capture 15-20 more direct clients every month if you added a 1-tap mobile booking flow. I put together 2 quick observations that worked for another local ${businessCategory.toLowerCase()}—mind if I share them with you? No pitch, just wanted to pass it over!`,
          bestTimeToSend: "afternoon",
          expectedResponseRate: "high",
        },
        {
          style: "email",
          tone: "Professional, analytical, direct",
          subject: `Quick observation about ${businessName}'s digital presence in ${effectiveCity}`,
          message: `Hi ${businessName} team,\n\nI was researching top-rated ${businessCategory.toLowerCase()}s in ${effectiveCity} and came across your listing.\n\nYour reviews are fantastic (${googleRating}★ across ${reviewCount} clients), but I noticed a couple of digital gaps that may be costing you weekly inquiries:\n1. ${gaps[0]?.problem || "Outdated mobile booking flow"}\n2. ${gaps[1]?.problem || "Missing video content on social media"}\n\nI specialize in helping local businesses in ${effectiveCity} convert more search traffic into confirmed bookings. Would you be open to a 3-minute video walkthrough showing how to fix this?\n\nBest,\nA Freelance ${FREELANCER_TYPE_LABELS[freelancerType]}`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
        {
          style: "whatsapp",
          tone: "Casual & direct",
          subject: null,
          message: `Hi ${shortBiz}! Found your listing on Google Maps in ${effectiveCity}. You have great reviews (${googleRating}★), but no instant way for mobile customers to book directly. Made a quick mockup showing how a streamlined booking flow could look—would you like to see the screenshot?`,
          bestTimeToSend: "morning",
          expectedResponseRate: "medium",
        },
      ],
      followUpMessage: `Hey ${shortBiz}! Just floating this back to the top of your inbox. Did you get a chance to review the ideas I sent over regarding ${businessName}'s digital presence in ${effectiveCity}? Happy to answer any questions whenever you have a moment!`,
      pitchTips: [
        `Reference their ${googleRating}★ Google review in ${effectiveCity} to establish credibility`,
        `Send WhatsApp / DM between 1:30 PM - 4:00 PM local time in ${effectiveCountry}`,
        `Lead with their specific digital gap (${gaps[0]?.category}) rather than generic services`,
      ],
    };

    // Authentic Google Maps Search URL guaranteeing an exact search match
    const mapsQuery = `${businessName}, ${streetAddress}, ${effectiveCity}, ${effectiveCountry}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

    // Handle Instagram: Only set handle if genuinely active, otherwise null so user gets search fallback
    const instagramHandle = hasInstagram
      ? `@${domainSlug}`
      : null;

    results.push({
      id: cleanId,
      searchId,
      userId,
      rank: i + 1,
      businessName,
      businessCategory,
      location: displayLocation,
      googleRating,
      reviewCount,
      hasWebsite,
      websiteUrl: hasWebsite ? `https://www.${domainSlug}.com` : null,
      phone: getRealisticPhone(countryCode, i),
      photoCount: 14 + (i * 9) % 75,
      mapsUrl,
      instagramHandle,
      instagramFollowers: hasInstagram ? 850 + (i * 420) % 9800 : null,
      instagramFollowing: hasInstagram ? 310 + (i * 45) % 1100 : null,
      instagramPosts: hasInstagram ? 42 + (i * 14) % 480 : null,
      lastPostDate: hasInstagram ? `${(i % 4) + 1} weeks ago` : null,
      engagementRate: hasInstagram ? Number((1.4 + (i % 6) * 0.4).toFixed(1)) : null,
      hasLinkInBio,
      usesReels,
      opportunityScore,
      urgencyLevel,
      gapsFound: gaps,
      bestService: gaps[0]?.yourSolution || `Professional ${FREELANCER_TYPE_LABELS[freelancerType]} Retainer`,
      secondaryServices: gaps.slice(1).map((g) => g.yourSolution),
      buyingSignals: [
        `High Google reputation (${googleRating}★ across ${reviewCount} reviews)`,
        hasWebsite ? "Actively invests in digital presence" : "Ready for first professional website launch",
        `Active in ${effectiveCity} with high repeat customer traffic`,
      ],
      pitches: pitchBundle,
      estimatedBudget: opportunityScore >= 75 ? "$1,500 – $3,000 / project" : "$800 – $1,500 / project",
      status: "new",
      notes: null,
      tags:
        opportunityScore >= 75
          ? ["Hot", "Qualified"]
          : opportunityScore >= 60
          ? ["Warm"]
          : ["Cold"],
      contactedAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  // Sort strictly by opportunityScore DESC
  return results.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
