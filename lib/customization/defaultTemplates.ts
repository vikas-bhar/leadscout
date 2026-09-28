import { CustomPromptConfig, CustomFilterConfig } from "./promptBuilder";

export const DEFAULT_PROMPT_TEMPLATES: CustomPromptConfig[] = [
  {
    id: "smm-instagram",
    name: "Social Media Manager — Instagram Focus",
    description: "Best for SMMs targeting businesses with poor Instagram engagement, missing Reels, or inconsistent posting.",
    promptType: "full",
    freelancerType: "social_media_manager",
    systemPrompt: `You are an expert social media consultant with 10 years of experience growing Instagram accounts for local businesses. You analyze Instagram presence with surgical precision. Focus exclusively on social media gaps. Quantify every loss in potential monthly revenue. Be specific — never say "low engagement", say "0.3% engagement which is 5x below the 1.5% industry average for local businesses".`,
    analysisPrompt: `Analyze this business's social media presence.
Focus on:
1. Instagram engagement rate vs industry benchmark
2. Posting consistency — days since last post
3. Content mix — reels vs photos vs carousels
4. Link in bio — are they capturing and converting traffic
5. Hashtag strategy — are they discoverable in local explore
6. Highlights — are they using organized story sections
7. Bio optimization — is there a clear value prop and CTA
8. Story usage — estimated based on content freshness
9. Competitor comparison — what top local competitors do
10. Revenue impact — estimate monthly customer loss from each gap

For each gap calculate:
- Current state: exact metric
- Industry benchmark: exact standard
- Gap: difference in percentage or count
- Monthly revenue impact: estimated dollar value lost`,
    pitchPrompt: `Write pitches for a social media manager.
RULES:
- Open with their most painful Instagram metric
- Compare to industry average with exact numbers
- Show you understand their local business specifically
- DM: casual, punchy, 4 sentences, end with an easy question
- Email: professional, 6 sentences, mention specific case study result
- WhatsApp: 2-3 sentences, one key metric, one direct offer

Example good opener:
"Your cafe has 2,400 followers but only gets 12 likes per post — that is a 0.5% engagement rate when your competitors in the area average 2.3%. Here is what I discovered..."`,
    scoringCriteria: [
      { criterion: "No Instagram", weight: 25, description: "Business has no Instagram at all" },
      { criterion: "Dead account", weight: 20, description: "Not posted in 30+ days" },
      { criterion: "Low engagement", weight: 20, description: "Engagement below 1.5%" },
      { criterion: "No Reels", weight: 15, description: "Missing short-form Reels entirely" },
      { criterion: "No link in bio", weight: 10, description: "Missing website or booking link" },
      { criterion: "Poor bio", weight: 10, description: "Bio is empty, unformatted, or unclear" },
    ],
    isActive: true,
    isDefault: true,
  },
  {
    id: "web-designer",
    name: "Web Designer — Website Focus",
    description: "Best for web designers targeting businesses with no website, outdated design, or broken mobile experience.",
    promptType: "full",
    freelancerType: "web_designer",
    systemPrompt: `You are an expert web consultant who has built high-converting websites for 200+ local businesses. You know exactly what a business loses without a fast, modern website. Focus on website gaps and the real financial cost of not having one. Businesses without websites lose an average of 30-40% of potential customers who search online. Use this framing in every analysis.`,
    analysisPrompt: `Analyze this business's web presence.
Focus on:
1. No website — estimated customers and revenue lost monthly
2. Outdated website — specific speed, mobile, and conversion flaws
3. Mobile experience — 70% of local searches happen on mobile devices
4. Google Maps completeness — photos, hours, address, and menu/services
5. Review response rate — algorithmic ranking signals to Google Maps
6. Local SEO signals — are they findable for high-intent keywords
7. Competitor websites — showcase what competing businesses have built
8. Lead capture — are they collecting emails, phone calls, or appointments
9. Social proof — missing testimonials, portfolio, or customer reviews
10. Call to action — can a visitor order, book, or call within 5 seconds

For each gap:
- Estimate monthly lost revenue
- Show how many people search online for this business category in their city
- Compare to competitor websites`,
    pitchPrompt: `Write pitches for a web designer.
RULES:
- Lead with the number of local customers searching for this business type online
- Show that their direct competitors already have modern mobile sites
- Make it about lost customers and revenue, not just "pretty design"
- Never say "you need a website" — say "customers are finding and booking your competitors instead"
- DM: 4 sentences, mention a specific local competitor
- Email: mention a specific high-intent keyword they are missing out on
- WhatsApp: single killer statistic and a 10-minute audit offer

Example good opener:
"Over 4,200 people searched for restaurants in your neighborhood last month. The top 3 results all have mobile menus and online reservations. Spice Garden doesn't show up at all..."`,
    scoringCriteria: [
      { criterion: "No website", weight: 35, description: "Missing website link on Maps listing" },
      { criterion: "Low review count", weight: 20, description: "Under 30 reviews" },
      { criterion: "Few photos", weight: 15, description: "Under 5 photos on Google Maps" },
      { criterion: "Unanswered reviews", weight: 20, description: "2+ unanswered negative reviews" },
      { criterion: "Not verified", weight: 10, description: "Unverified Google Maps listing" },
    ],
    isActive: true,
  },
  {
    id: "video-editor",
    name: "Video Editor — Short-Form Reels & TikToks",
    description: "Focus on missing short-form video, static photo-only feeds, and video repurposing opportunities.",
    promptType: "full",
    freelancerType: "video_editor",
    systemPrompt: `You are a high-performing video producer and short-form video strategist. You identify businesses that rely on boring static photos while their competitors capture all local attention with Reels, TikToks, and Shorts. Quantify how short-form video achieves 8-12x higher algorithmic reach.`,
    analysisPrompt: `Analyze this business's video opportunities:
1. Are they posting Reels or only static images?
2. Quality of customer experience that could be captured on video
3. Trend adaptability — can their products/services go viral locally?
4. Estimated reach increase if they published 3 high-quality Reels weekly
5. Potential customer acquisition cost reduction through organic video`,
    pitchPrompt: `Write pitches offering short-form video editing and production:
- Emphasize that static images no longer get reach on modern social algorithms
- Propose 3 specific Reel concepts tailor-made for their specific business
- Pitch a pilot package of 5 edited Reels to test results risk-free`,
    scoringCriteria: [
      { criterion: "No Reels", weight: 35, description: "Zero short-form video content on profile" },
      { criterion: "Low views", weight: 25, description: "Reels getting under 500 views" },
      { criterion: "Photo-only feed", weight: 25, description: "Last 10 posts are all static photos" },
      { criterion: "Visual business", weight: 15, description: "Category is highly visual (food, fitness, beauty)" },
    ],
    isActive: true,
  },
  {
    id: "copywriter",
    name: "Copywriter — Brand Messaging & Email Gaps",
    description: "Focus on weak brand voice, missing lead magnets, poor bio copy, and lack of newsletter marketing.",
    promptType: "full",
    freelancerType: "copywriter",
    systemPrompt: `You are a direct-response copywriter and brand messaging strategist. You diagnose vague value propositions, confusing website headlines, and dry social captions that fail to convert interested readers into paying clients.`,
    analysisPrompt: `Evaluate the business's messaging and copy:
1. Is their bio/tagline clear within 3 seconds?
2. Do captions invite conversation and include strong calls to action?
3. Is there a lead magnet, newsletter, or SMS club on their website?
4. Are customer objections addressed in their public copy?`,
    pitchPrompt: `Write punchy pitches highlighting copy and conversion leaks:
- Quote their current bio or headline and rewrite it with more impact
- Offer a complimentary headline and bio rewrite
- Explain how clearer messaging immediately lifts conversion rates`,
    scoringCriteria: [
      { criterion: "Vague bio", weight: 30, description: "No clear customer benefit in bio" },
      { criterion: "No call to action", weight: 25, description: "Posts lack clear action steps" },
      { criterion: "Missing email capture", weight: 25, description: "No lead capture mechanism" },
      { criterion: "Dry captions", weight: 20, description: "Captions are purely descriptive or robotic" },
    ],
    isActive: true,
  },
  {
    id: "seo-specialist",
    name: "SEO Specialist — Local Search & Maps Ranking",
    description: "Focus on Google Maps ranking factors, missing keywords, unoptimized categories, and citations.",
    promptType: "full",
    freelancerType: "seo_specialist",
    systemPrompt: `You are a Local SEO master. You analyze why a business ranks on page 2 or below the top 3 Maps Pack for their primary service keyword in their city. Quantify the massive traffic difference between rank #1 and rank #10.`,
    analysisPrompt: `Analyze local SEO ranking signals:
1. Google Maps primary category vs secondary categories
2. Review velocity and keyword density in customer reviews
3. Unanswered reviews harming ranking engagement
4. Missing business attributes (wheelchair accessible, hours, services)
5. Website title tags, meta descriptions, and schema markup`,
    pitchPrompt: `Write pitches for local SEO services:
- Highlight the exact keyword their competitors rank #1 for
- Calculate how many clicks go to the top 3 Local Pack vs lower positions
- Offer a 10-minute Local Pack visibility audit`,
    scoringCriteria: [
      { criterion: "Not in top 3", weight: 35, description: "Ranks below 3rd position in Maps" },
      { criterion: "Unanswered reviews", weight: 25, description: "Negative or positive reviews without responses" },
      { criterion: "Low review count", weight: 25, description: "Significantly fewer reviews than top competitor" },
      { criterion: "Incomplete profile", weight: 15, description: "Missing hours, photos, or description" },
    ],
    isActive: true,
  },
  {
    id: "brand-designer",
    name: "Brand Designer — Visual Identity & Aesthetic",
    description: "Focus on inconsistent logo usage, outdated color palettes, amateur graphic assets, and menu design.",
    promptType: "full",
    freelancerType: "graphic_designer",
    systemPrompt: `You are an art director and brand identity designer. You spot businesses that deliver great products but look amateurish due to disjointed colors, pixelated logos, and mismatched fonts across Maps and social media.`,
    analysisPrompt: `Evaluate visual identity consistency:
1. Logo clarity and modern aesthetic across platforms
2. Color palette consistency in photography and graphic assets
3. Highlight cover aesthetics on Instagram
4. Visual appeal of digital menus, flyers, or banners`,
    pitchPrompt: `Write pitches focusing on perceived brand value and premium pricing:
- Show how premium visual branding justifies 20-40% higher pricing
- Highlight inconsistency between their quality and their visual presentation
- Provide a mini mood board or aesthetic recommendation`,
    scoringCriteria: [
      { criterion: "Low quality imagery", weight: 30, description: "Blurry or poorly lit photos" },
      { criterion: "Inconsistent aesthetic", weight: 30, description: "No cohesive color palette or style" },
      { criterion: "No brand kit", weight: 25, description: "Generic Canva templates or clip art" },
      { criterion: "Outdated logo", weight: 15, description: "Unscalable or dated logo design" },
    ],
    isActive: true,
  },
];

export const DEFAULT_FILTER_TEMPLATES: CustomFilterConfig[] = [
  {
    id: "filter_no_website",
    name: "No Website Businesses",
    description: "High-value local businesses with strong reviews but zero website presence on Google Maps.",
    mapsFilters: {
      minRating: 3.5,
      maxRating: 5.0,
      minReviews: 15,
      maxReviews: null,
      requireWebsite: false,
      requireNoWebsite: true,
      requirePhone: true,
      minPhotos: null,
      maxPhotos: null,
      priceLevel: [],
      requireVerified: null,
      requireOpenNow: null,
      keywordsInName: [],
      keywordsToExclude: ["chain", "franchise", "mcdonald", "subway"],
      requireUnansweredReviews: null,
      minUnansweredNegative: null,
    },
    instagramFilters: {
      requireInstagram: null,
      requireNoInstagram: null,
      minFollowers: null,
      maxFollowers: null,
      minDaysSincePost: null,
      maxEngagementRate: null,
      requireNoReels: null,
      requireNoLinkInBio: null,
      requireInfrequentPosting: null,
    },
    scoringWeights: {
      noWebsite: 30,
      lowRating: 10,
      fewPhotos: 10,
      unansweredReviews: 10,
      noInstagram: 15,
      deadInstagram: 10,
      lowEngagement: 10,
      noReels: 10,
      budget: 25,
    },
    isActive: true,
    isDefault: true,
  },
  {
    id: "filter_dead_instagram",
    name: "Dead Instagram Accounts",
    description: "Businesses whose last Instagram post was over 30 days ago, or have zero Reels.",
    mapsFilters: {
      minRating: 3.0,
      maxRating: 5.0,
      minReviews: 10,
      maxReviews: null,
      requireWebsite: null,
      requireNoWebsite: null,
      requirePhone: null,
      minPhotos: null,
      maxPhotos: null,
      priceLevel: [],
      requireVerified: null,
      requireOpenNow: null,
      keywordsInName: [],
      keywordsToExclude: [],
      requireUnansweredReviews: null,
      minUnansweredNegative: null,
    },
    instagramFilters: {
      requireInstagram: true,
      requireNoInstagram: false,
      minFollowers: 100,
      maxFollowers: 15000,
      minDaysSincePost: 30,
      maxEngagementRate: 2.0,
      requireNoReels: null,
      requireNoLinkInBio: null,
      requireInfrequentPosting: true,
    },
    scoringWeights: {
      noWebsite: 15,
      lowRating: 10,
      fewPhotos: 10,
      unansweredReviews: 10,
      noInstagram: 20,
      deadInstagram: 30,
      lowEngagement: 25,
      noReels: 20,
      budget: 20,
    },
    isActive: true,
  },
  {
    id: "filter_poor_reviews",
    name: "Poor Review Responders",
    description: "Established businesses with unanswered negative reviews on Google Maps.",
    mapsFilters: {
      minRating: 2.5,
      maxRating: 4.2,
      minReviews: 25,
      maxReviews: null,
      requireWebsite: null,
      requireNoWebsite: null,
      requirePhone: true,
      minPhotos: null,
      maxPhotos: null,
      priceLevel: [],
      requireVerified: null,
      requireOpenNow: null,
      keywordsInName: [],
      keywordsToExclude: [],
      requireUnansweredReviews: true,
      minUnansweredNegative: 1,
    },
    instagramFilters: {
      requireInstagram: null,
      requireNoInstagram: null,
      minFollowers: null,
      maxFollowers: null,
      minDaysSincePost: null,
      maxEngagementRate: null,
      requireNoReels: null,
      requireNoLinkInBio: null,
      requireInfrequentPosting: null,
    },
    scoringWeights: {
      noWebsite: 15,
      lowRating: 25,
      fewPhotos: 10,
      unansweredReviews: 30,
      noInstagram: 10,
      deadInstagram: 10,
      lowEngagement: 10,
      noReels: 5,
      budget: 25,
    },
    isActive: true,
  },
  {
    id: "filter_premium_businesses",
    name: "Premium Businesses Only ($$$ / $$$$)",
    description: "High-ticket establishments with upscale price points and healthy marketing budgets.",
    mapsFilters: {
      minRating: 4.0,
      maxRating: 5.0,
      minReviews: 50,
      maxReviews: null,
      requireWebsite: null,
      requireNoWebsite: null,
      requirePhone: true,
      minPhotos: 10,
      maxPhotos: null,
      priceLevel: ["$$$", "$$$$"],
      requireVerified: true,
      requireOpenNow: null,
      keywordsInName: [],
      keywordsToExclude: ["cheap", "discount", "budget"],
      requireUnansweredReviews: null,
      minUnansweredNegative: null,
    },
    instagramFilters: {
      requireInstagram: true,
      requireNoInstagram: false,
      minFollowers: 1000,
      maxFollowers: 50000,
      minDaysSincePost: null,
      maxEngagementRate: null,
      requireNoReels: null,
      requireNoLinkInBio: null,
      requireInfrequentPosting: null,
    },
    scoringWeights: {
      noWebsite: 20,
      lowRating: 10,
      fewPhotos: 15,
      unansweredReviews: 15,
      noInstagram: 20,
      deadInstagram: 20,
      lowEngagement: 20,
      noReels: 20,
      budget: 30,
    },
    isActive: true,
  },
  {
    id: "filter_small_businesses",
    name: "Small & Emerging Businesses",
    description: "Underdog local businesses under 40 reviews eager for early growth and local discovery.",
    mapsFilters: {
      minRating: 3.5,
      maxRating: 5.0,
      minReviews: 5,
      maxReviews: 40,
      requireWebsite: null,
      requireNoWebsite: null,
      requirePhone: true,
      minPhotos: null,
      maxPhotos: 15,
      priceLevel: ["$", "$$"],
      requireVerified: null,
      requireOpenNow: null,
      keywordsInName: [],
      keywordsToExclude: ["hotel", "chain", "international"],
      requireUnansweredReviews: null,
      minUnansweredNegative: null,
    },
    instagramFilters: {
      requireInstagram: null,
      requireNoInstagram: null,
      minFollowers: null,
      maxFollowers: 3000,
      minDaysSincePost: null,
      maxEngagementRate: null,
      requireNoReels: null,
      requireNoLinkInBio: null,
      requireInfrequentPosting: null,
    },
    scoringWeights: {
      noWebsite: 25,
      lowRating: 15,
      fewPhotos: 20,
      unansweredReviews: 15,
      noInstagram: 20,
      deadInstagram: 20,
      lowEngagement: 15,
      noReels: 15,
      budget: 10,
    },
    isActive: true,
  },
];
