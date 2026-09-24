import { GoogleGenAI } from "@google/genai";
import { type ScrapedLinkData, type InstagramScrapedData, type WebsiteScrapedData, type MapsScrapedData, type FacebookScrapedData } from "./scrapeLink";
import { type DetectedLink } from "./detectLink";
import { type AnalyzerResultData, type AnalyzerGap } from "@/types";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function analyzeScrapedGaps(
  detected: DetectedLink,
  scraped: ScrapedLinkData
): Promise<AnalyzerResultData> {
  const ai = getGeminiClient();

  if (scraped.type === "instagram") {
    return analyzeInstagramGaps(detected, scraped.data, ai);
  }

  if (scraped.type === "website") {
    return analyzeWebsiteGaps(detected, scraped.data, ai);
  }

  if (scraped.type === "maps") {
    return analyzeMapsGaps(detected, scraped.data);
  }

  return analyzeFacebookGaps(detected, scraped.data);
}

// -------------------------------------------------------------
// 1. INSTAGRAM GAP ANALYSIS (MULTI-ENTITY & INFLUENCER AWARE)
// -------------------------------------------------------------
async function analyzeInstagramGaps(
  detected: DetectedLink,
  data: InstagramScrapedData,
  ai: GoogleGenAI | null
): Promise<AnalyzerResultData> {
  const prompt = `You are an elite digital talent manager and social media growth strategist.
You understand that Instagram accounts belong to DIFFERENT TYPES OF ENTITIES, not just traditional brick-and-mortar local businesses!

Analyze this Instagram account data, accurately classify the EXACT PROFILE TYPE (Archetype), and identify concrete monetization and content gaps tailored to what they actually do:

Account Data:
Username: ${data.username}
Followers: ${data.followers}
Following: ${data.following}
Total Posts: ${data.totalPosts}
Last Post: ${data.lastPostDate}
Posts Per Week: ${data.postsPerWeek}
Average Likes: ${data.avgLikes}
Average Comments: ${data.avgComments}
Engagement Rate: ${data.engagementRate}%
Uses Reels: ${data.usesReels ? "Yes" : "No"}
Has Link In Bio: ${data.hasLinkInBio ? "Yes" : "No"}
Bio Text: ${data.bio || "No bio text provided"}
Content Themes: ${data.themes || "General"}

ENTITY CLASSIFICATION & DOMAIN RULES:
1. "creator_influencer" (Content Creators, Vloggers, Models, Lifestyle/Fashion/Fitness/Food/Travel influencers, Meme pages):
   - What they need: Brand sponsorships, media kits, viral short-form video editing (retention-style pacing), YouTube repurposing, Stan Store / Beacons monetization, subscriber growth.
   - NEVER pitch them "local store foot traffic" or "doctor clinic appointments"! Pitch them short-form video editing, thumbnail design, sponsor pitch decks / media kits, or monetization funnels.
2. "personal_brand_coach" (Coaches, Consultants, Keynote Speakers, Authors, Educators, Agency Founders):
   - What they need: High-ticket client acquisition, VSL funnels, ManyChat automated DM flows, booked discovery calls, digital course sales.
   - Pitch them: High-ticket client funnels, ManyChat DM automation, VSL production, carousel design.
3. "ecommerce_brand" (D2C Brands, Shopify Stores, Apparel / Product companies):
   - What they need: ROAS, UGC video ads, conversion rate optimization (CRO), abandoned cart flows (Klaviyo), TikTok Shop integration.
   - Pitch them: UGC video ad creatives, Shopify mobile conversion fixes, email marketing flows.
4. "artist_creative" (Musicians, Singers, DJs, Visual Artists, Photographers, Filmmakers):
   - What they need: Spotify/Apple Music streams, ticket sales, merch drops, portfolio presentation, behind-the-scenes storytelling reels.
   - Pitch them: Music release promotional assets, artist portfolio site, behind-the-scenes editing.
5. "media_podcast" (Podcasts, Media Channels, Curated Community pages):
   - What they need: Episode downloads, viral micro-clips with animated captions, YouTube thumbnail CTR, guest booking workflows.
   - Pitch them: Podcast micro-clip batch editing, animated subtitles, newsletter growth.
6. "local_business" (Restaurants, Cafes, Salons, Clinics, Gyms, Real Estate, Local services):
   - What they need: Local foot traffic, WhatsApp/Google reservations, localized geotagged reels, review management.
   - Pitch them: Mobile booking funnels, local Reels calendar, WhatsApp automation.
7. "personal_dormant" (Personal or unlaunched account with <=3 posts or <150 followers):
   - Accurately identify as dormant/personal. If pitching, offer a 9-post launch foundation package to turn their profile into a brand.

CRITICAL ACCURACY RULES:
- Strictly ground your evaluation in the real numbers above.
- In pitches: Write highly conversational, human copy tailored to their EXACT entity type. Never use generic robotic business phrases if they are a creator/influencer.

Return pure JSON only (no markdown, no backticks, no code fence):
{
  "entityType": "creator_influencer" | "personal_brand_coach" | "ecommerce_brand" | "local_business" | "artist_creative" | "media_podcast" | "personal_dormant",
  "entityLabel": "Content Creator / Lifestyle Influencer" | "Solo Coach & Consultant" | "E-Commerce Brand" | "Local Business" | "Artist / Musician" | "Podcast / Media Channel" | "Personal / Dormant Account",
  "accountScore": number 0-100,
  "followerHealthScore": number 0-100,
  "contentScore": number 0-100,
  "engagementScore": number 0-100,
  "gaps": [
    {
      "area": "Short-Form Video & Retention / Brand Sponsorships / Bio Funnel",
      "problem": "detailed problem statement tailored to their archetype",
      "impact": "specific lost revenue, sponsorships, or audience drop-off",
      "severity": "critical" | "high" | "medium" | "low",
      "fix": "exact deliverable freelancer can build",
      "estimatedImpact": "$1,500+/mo in brand deals / bookings / sales"
    }
  ],
  "whatTheyDoWell": ["point 1", "point 2"],
  "missedOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "estimatedMonthlyLoss": "$1,500 - $3,500 / month",
  "recommendedServices": ["Short-Form Video Editing", "Media Kit Design", "Monetization Link Funnel"],
  "pitchAngle": "Offer 2 sample viral Reel scripts and a customized media kit mockup",
  "instagramDMPitch": "Hey @${data.username}! Loved your recent content...",
  "emailPitch": "Hi @${data.username} team,\\n\\nI analyzed your profile reach...",
  "urgencyLevel": "critical" | "high" | "medium" | "low"
}`;

  if (ai) {
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim() || "{}";
        const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        return {
          linkType: "instagram",
          targetUrl: detected.cleanUrl,
          title: `@${data.username}`,
          handle: data.username,
          overallScore: Math.min(100, Math.max(10, parsed.accountScore || 64)),
          contentScore: Math.min(100, Math.max(10, parsed.contentScore || 60)),
          engagementScore: Math.min(100, Math.max(10, parsed.engagementScore || 65)),
          growthScore: Math.min(100, Math.max(10, parsed.followerHealthScore || 60)),
          followerHealthScore: parsed.followerHealthScore || 60,
          gaps: Array.isArray(parsed.gaps) && parsed.gaps.length > 0 ? parsed.gaps : getInstagramFallbackGaps(data),
          whatTheyDoWell: Array.isArray(parsed.whatTheyDoWell) ? parsed.whatTheyDoWell : ["Established profile identity", "Core engaged audience base"],
          missedOpportunities: Array.isArray(parsed.missedOpportunities) ? parsed.missedOpportunities : ["Under-monetized bio link", "Short-form video retention pacing"],
          estimatedLoss: parsed.estimatedMonthlyLoss || "$1,800 - $3,500 / month",
          recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices : ["Short-Form Video Editing", "Media Kit & Sponsorship Deck", "Bio Funnel Setup"],
          pitchAngle: parsed.pitchAngle || "Offer 2 sample viral Reel concepts tailored to their niche",
          instagramDMPitch: parsed.instagramDMPitch || buildArchetypeInstagramDM(data),
          emailPitch: parsed.emailPitch || buildArchetypeEmailPitch(data),
          urgencyLevel: parsed.urgencyLevel || "high",
          metadata: {
            ...(data as unknown as Record<string, unknown>),
            entityType: parsed.entityType || detectArchetypeFromData(data),
            entityLabel: parsed.entityLabel || "Digital Profile",
          },
        };
      } catch (err) {
        console.log(`Gemini ${modelName} call failed for Instagram gap analysis:`, err);
      }
    }
  }

  // Analytical Fallback when Gemini API is offline
  return buildArchetypeAnalyticalFallback(detected, data);
}

function detectArchetypeFromData(data: InstagramScrapedData): string {
  const bio = (data.bio || "").toLowerCase();
  const username = data.username.toLowerCase();

  if (data.totalPosts <= 3 || data.followers < 150) return "personal_dormant";
  if (/podcast|episode|show|listen on|spotify|apple pod/i.test(bio)) return "media_podcast";
  if (/music|dj|artist|producer|album|single|track|stream/i.test(bio)) return "artist_creative";
  if (/coach|consult|speaker|author|helping|dm me|mentorship|mastermind/i.test(bio)) return "personal_brand_coach";
  if (/shop|store|brand|shipping|discount|use code|apparel|wear|cosmetics/i.test(bio)) return "ecommerce_brand";
  if (/restaurant|cafe|salon|spa|clinic|dentist|gym|dr\.|realtor|estate|bistro|barber/i.test(bio + " " + username)) return "local_business";
  if (data.followers > 2000 || /creator|influencer|vlogger|model|lifestyle|fashion|travel|fitness/i.test(bio)) return "creator_influencer";
  
  return "creator_influencer";
}

function buildArchetypeInstagramDM(data: InstagramScrapedData): string {
  const archetype = detectArchetypeFromData(data);

  if (archetype === "creator_influencer") {
    return `Hey @${data.username}! Love your content and visual style. I noticed your videos have huge viral potential if edited with tighter retention pacing & dynamic captions (Hormozi/Ali Abdaal style). I put together 2 free edited sample clips from your recent posts—mind if I send them over?`;
  }
  if (archetype === "personal_brand_coach") {
    return `Hey @${data.username}! Great insights on your page. Noticed you don't have an automated ManyChat DM keyword funnel set up for your offers, which usually doubles booked discovery calls without extra posting. Put together a 1-page breakdown—worth a look?`;
  }
  if (archetype === "ecommerce_brand") {
    return `Hey @${data.username} team! Love the product aesthetic. Noticed your feed could easily convert 2-3x more profile visitors with organic UGC video reviews and a direct best-seller landing flow. Drafted 2 UGC concept hooks—would you like to see them?`;
  }
  if (archetype === "artist_creative") {
    return `Hey @${data.username}! Big fan of your sound/art. Noticed you could easily drive 40% more streams & pre-saves by pairing your track drops with behind-the-scenes storytelling reels. Put together 2 release visual concepts—mind if I share?`;
  }
  if (archetype === "media_podcast") {
    return `Hey @${data.username} team! Great episode discussions. You have tons of gold nuggets that could be repurposed into 15-second viral TikTok/Reels clips with animated subtitles. Edited a quick 20-second sample clip for you—where can I send it?`;
  }
  if (archetype === "personal_dormant") {
    return `Hey @${data.username}! Noticed you have a great clean handle reserved. If you're planning to launch a personal brand, creator presence, or freelance portfolio, I build out turnkey 9-post launch grids and bio funnels. Mind if I share a couple of launch ideas?`;
  }

  return `Hey @${data.username} team! Big fan of your work. I noticed your profile could easily capture more direct inquiries with structured 15-second Reels and a streamlined booking bio. Put together 2 quick outlines—mind if I share them?`;
}

function buildArchetypeEmailPitch(data: InstagramScrapedData): string {
  const archetype = detectArchetypeFromData(data);

  if (archetype === "creator_influencer") {
    return `Hi @${data.username},\n\nI was reviewing high-growth creators in your niche and loved your profile. You have an authentic audience, but I noticed two huge monetization levers currently missing:\n\n1. No updated Brand Sponsorship Media Kit / Rate Card in bio\n2. Video watch-time could easily be 2x higher with retention-style editing & hooks\n\nI edit high-retention video content and design sponsor decks for creators. Would you be open to a 3-minute video breakdown with 2 free concept hooks?\n\nBest,\nYour Dedicated Video & Growth Partner`;
  }
  if (archetype === "personal_brand_coach") {
    return `Hi @${data.username},\n\nI came across your profile and really value your perspective. I noticed you're putting out great wisdom, but leaving potential high-ticket clients on the table because there's no automated DM inquiry funnel or 1-tap call booking flow.\n\nI build client acquisition systems for coaches and consultants. Would you be open to seeing a quick wireframe of how to automate your inbound bookings?\n\nBest,\nA Freelance Funnel Architect`;
  }

  return `Hi @${data.username} team,\n\nI conducted a quick social audit of your Instagram profile (@${data.username}) and spotted 2 critical digital gaps that are likely costing you weekly growth:\n\n1. Underutilized short-form video reach\n2. Bio link not structured for mobile monetization\n\nI specialize in scaling digital profiles and brands. Would you be open to a 3-minute video walking through the fixes?\n\nBest regards,\nA Freelance Growth Partner`;
}

function buildArchetypeAnalyticalFallback(detected: DetectedLink, data: InstagramScrapedData): AnalyzerResultData {
  const archetype = detectArchetypeFromData(data);
  const gaps = getInstagramFallbackGaps(data, archetype);

  let titleLabel = "Content Creator Profile";
  if (archetype === "creator_influencer") titleLabel = "Content Creator / Influencer";
  else if (archetype === "personal_brand_coach") titleLabel = "Coach & Personal Brand";
  else if (archetype === "ecommerce_brand") titleLabel = "E-Commerce Brand";
  else if (archetype === "artist_creative") titleLabel = "Artist / Creative";
  else if (archetype === "media_podcast") titleLabel = "Podcast / Media Channel";
  else if (archetype === "local_business") titleLabel = "Local Business Presence";
  else if (archetype === "personal_dormant") titleLabel = "Personal / Dormant Account";

  return {
    linkType: "instagram",
    targetUrl: detected.cleanUrl,
    title: `@${data.username} (${titleLabel})`,
    handle: data.username,
    overallScore: data.usesReels && data.hasLinkInBio ? 76 : 58,
    contentScore: data.postsPerWeek >= 3 ? 78 : 54,
    engagementScore: data.engagementRate >= 2.0 ? 82 : 62,
    growthScore: data.usesReels ? 75 : 50,
    followerHealthScore: 65,
    gaps,
    whatTheyDoWell: [
      `Secured strong personal handle @${data.username}`,
      `Authentic audience base (${data.followers.toLocaleString()} followers)`,
      data.hasLinkInBio ? "Active external link configured in bio" : "Clean profile canvas ready for monetization",
    ],
    missedOpportunities: [
      !data.usesReels ? "Missing 70%+ of top-of-funnel reach by not posting vertical short-form Reels" : "Reels retention and sound design can be optimized",
      !data.hasLinkInBio ? "No link in bio to monetize followers into sponsors, bookings, or sales" : "Bio link is unoptimized for mobile conversions",
      "No automated DM funnel to capture and qualify inbound messages",
    ],
    estimatedLoss: archetype === "creator_influencer" ? "$2,000 – $4,500 / month in missed brand sponsorships" : "$1,800 – $3,500 / month in lost client inquiries",
    recommendedServices: [
      archetype === "creator_influencer" ? "Short-Form Video Editing (Hormozi/Retention style)" : "High-Converting Content Production",
      archetype === "creator_influencer" ? "Brand Sponsorship Media Kit & Pitch Deck" : "Bio & Highlight Conversion Architecture",
      "Automated Inbound DM Funnel Setup",
    ],
    pitchAngle: archetype === "creator_influencer"
      ? "Pitch 2 free edited retention Reels and an updated Media Kit deck."
      : "Offer a zero-risk 2-Reel script breakdown and conversion-optimized bio rewrite.",
    instagramDMPitch: buildArchetypeInstagramDM(data),
    emailPitch: buildArchetypeEmailPitch(data),
    urgencyLevel: !data.usesReels || !data.hasLinkInBio ? "critical" : "high",
    metadata: {
      ...(data as unknown as Record<string, unknown>),
      entityType: archetype,
      entityLabel: titleLabel,
    },
  };
}

function getInstagramFallbackGaps(data: InstagramScrapedData, archetype?: string): AnalyzerGap[] {
  const gaps: AnalyzerGap[] = [];
  const type = archetype || detectArchetypeFromData(data);

  if (type === "creator_influencer") {
    if (!data.usesReels) {
      gaps.push({
        area: "Short-Form Video & Algorithmic Virality",
        problem: "Zero active short-form Reels published in recent feed history",
        impact: "Missing out on Instagram's recommendation algorithm which favors Reels by 300% over static photos",
        severity: "critical",
        fix: "Produce 3-4 weekly retention-edited Reels with animated subtitles and strong 2-second visual hooks",
        estimatedImpact: "+60% non-follower reach and sponsor visibility",
      });
    }

    if (!data.hasLinkInBio) {
      gaps.push({
        area: "Monetization & Brand Sponsorships",
        problem: "No professional Media Kit, sponsorship rate card, or digital storefront link in bio",
        impact: "Brands and sponsors cannot easily book collaborations or see verified audience metrics",
        severity: "critical",
        fix: "Build a high-converting Beacons/Stan Store link with downloadable Media Kit and sponsor contact form",
        estimatedImpact: "+$2,000/mo in direct brand sponsorship deals",
      });
    }

    gaps.push({
      area: "Content Retention & Video Pacing",
      problem: "Static posts or unedited video lack retention pacing, sound effects, and B-roll transitions",
      impact: "Viewer watch time drops before the call-to-action, suppressing algorithmic recommendations",
      severity: "high",
      fix: "Deploy retention-style video editing (jump cuts, text popups, sound design, hook optimization)",
      estimatedImpact: "2.5x increase in average watch-through rate",
    });

    gaps.push({
      area: "Cross-Platform Syndication",
      problem: "Content is not formatted or syndicated to YouTube Shorts and TikTok",
      impact: "Leaving 50%+ of potential cross-platform monetization and subscribers on the table",
      severity: "medium",
      fix: "Repurpose Instagram vertical videos into YouTube Shorts and TikTok weekly queue",
      estimatedImpact: "+15,000 cross-platform monthly impressions",
    });

    return gaps;
  }

  if (type === "personal_brand_coach") {
    gaps.push({
      area: "High-Ticket Client Acquisition Funnel",
      problem: "No automated ManyChat keyword DM flow or 1-tap discovery call booking link",
      impact: "High-intent prospective clients bounce without entering a qualified sales conversation",
      severity: "critical",
      fix: "Build an automated ManyChat 'DM keyword' lead magnet funnel + Calendly booking page",
      estimatedImpact: "+8-12 qualified client discovery calls per month",
    });

    gaps.push({
      area: "Authority & Social Proof Highlights",
      problem: "Missing video case studies, student wins, and structured testimonial highlight covers",
      impact: "Prospective buyers lack the trust required to invest in premium coaching/consulting",
      severity: "high",
      fix: "Design custom branded highlight covers for: Client Wins, Method/Framework, About, FAQs",
      estimatedImpact: "+30% boost in offer closing rate",
    });

    if (!data.usesReels) {
      gaps.push({
        area: "Thought Leadership Short-Form Video",
        problem: "Lack of talking-head Reels explaining client transformation frameworks",
        impact: "Missed top-of-funnel inbound leads from algorithm discovery",
        severity: "high",
        fix: "Batch record 6 monthly framework breakdown Reels with animated visual captions",
        estimatedImpact: "+40% inbound DM inquiries",
      });
    }

    return gaps;
  }

  if (type === "media_podcast") {
    gaps.push({
      area: "Episode Micro-Content Repurposing",
      problem: "Full episodes are published without 15-second viral micro-clip Reels",
      impact: "Podcast discoverability is restricted exclusively to existing listeners",
      severity: "critical",
      fix: "Batch slice each podcast episode into 3 viral hook clips with dynamic audiograms & animated captions",
      estimatedImpact: "+300% new listener acquisition",
    });

    gaps.push({
      area: "Listener Conversion & Newsletter Funnel",
      problem: "Bio lacks dedicated newsletter signup or exclusive show notes lead magnet",
      impact: "Zero owned audience data to monetize through direct sponsors",
      severity: "high",
      fix: "Create a 1-tap show notes newsletter opt-in in bio",
      estimatedImpact: "+500 monthly email subscribers",
    });

    return gaps;
  }

  if (type === "artist_creative") {
    gaps.push({
      area: "Release Campaign & Streaming Conversion",
      problem: "No direct Spotify/Apple Music pre-save link or tour ticket widget in bio",
      impact: "Social traffic is lost without converting into track streams, sales, or event attendees",
      severity: "critical",
      fix: "Build a streamlined multi-platform music release landing page (Feature.fm / Linktree)",
      estimatedImpact: "+45% first-week streaming volume",
    });

    gaps.push({
      area: "Behind-The-Scenes Storytelling Content",
      problem: "Feed only shows finished art without the creative process or studio storytelling",
      impact: "Audience emotional connection remains low, decreasing merch and ticket sales",
      severity: "high",
      fix: "Produce weekly behind-the-scenes creation Reels with voiceover storytelling",
      estimatedImpact: "2x higher comment engagement and community loyalty",
    });

    return gaps;
  }

  // General Local Business / Store Fallback
  if (!data.usesReels) {
    gaps.push({
      area: "Short-Form Video & Discovery",
      problem: "Zero active Reels published in recent feed history",
      impact: "Missing out on Instagram's recommendation algorithm which favors Reels by 300% over static posts",
      severity: "critical",
      fix: "Produce 3 monthly batch Reels focusing on customer results, behind-the-scenes, and FAQs",
      estimatedImpact: "+45% organic reach within 30 days",
    });
  }

  if (data.postsPerWeek < 3) {
    gaps.push({
      area: "Content Consistency & Posting Velocity",
      problem: `Posting only ~${data.postsPerWeek} times per week (ideal benchmark is 4-5x)`,
      impact: "Audience engagement fades and Instagram algorithm suppresses stories and feed visibility",
      severity: "high",
      fix: "Implement an automated weekly content queue with carousel templates and scheduled posts",
      estimatedImpact: "2.5x increase in weekly impressions",
    });
  }

  if (!data.hasLinkInBio) {
    gaps.push({
      area: "Traffic & Conversion Funnel",
      problem: "No dedicated booking or website link in profile bio",
      impact: "Zero attribution from profile visits to paying customers; users drop off without action",
      severity: "high",
      fix: "Create a conversion-focused Linktree / direct booking landing page",
      estimatedImpact: "+18% direct appointment conversions",
    });
  }

  gaps.push({
    area: "Story Highlights & Social Proof",
    problem: "Outdated or unstructured Highlights without clear pricing or customer review categories",
    impact: "First-time visitors cannot easily find pricing, testimonials, or location details",
    severity: "medium",
    fix: "Design custom branded highlight covers and organize into: Reviews, Menu/Services, About, FAQs",
    estimatedImpact: "Higher trust score and faster decision-making",
  });

  return gaps;
}

// -------------------------------------------------------------
// 2. WEBSITE GAP ANALYSIS
// -------------------------------------------------------------
async function analyzeWebsiteGaps(
  detected: DetectedLink,
  data: WebsiteScrapedData,
  ai: GoogleGenAI | null
): Promise<AnalyzerResultData> {
  const prompt = `You are an expert web consultant and UX specialist.
Analyze this website data and identify every gap.

Website Data:
URL: ${data.url}
Title: ${data.title}
Meta Description: ${data.metaDescription}
Has Blog: ${data.hasBlog ? "Yes" : "No"}
Has Contact Info: ${data.hasContactInfo ? "Yes" : "No"}
Social Links Present: ${data.hasSocialLinks ? "Yes" : "No"}
Mobile Responsive: ${data.isMobileResponsive ? "Yes" : "No"}
Has Clear CTA: ${data.hasClearCTA ? "Yes" : "No"}
Services Listed: ${data.hasServicesListed ? "Yes" : "No"}
Load Performance: ${data.loadPerformance}

Return pure JSON only (no markdown, no backticks):
{
  "websiteScore": number 0-100,
  "seoScore": number 0-100,
  "uxScore": number 0-100,
  "conversionScore": number 0-100,
  "gaps": [
    {
      "area": "Conversion UX",
      "problem": "detailed problem statement",
      "impact": "concrete business bounce rate or revenue loss impact",
      "severity": "critical" | "high" | "medium" | "low",
      "fix": "concrete design or dev solution",
      "estimatedImpact": "Estimated +25% lead inquiries"
    }
  ],
  "whatTheyDoWell": ["point 1", "point 2"],
  "quickWins": ["quick win 1", "quick win 2"],
  "estimatedRevenueImpact": "$2,000 - $4,500 / month",
  "recommendedServices": ["High-Converting Redesign", "Mobile Speed Optimization", "SEO Landing Pages"],
  "pitchAngle": "Offer a complimentary 5-minute video UX teardown with a wireframe mockup",
  "outreachEmail": "Hi [Name],\\n\\nI reviewed ${data.url}...",
  "urgencyLevel": "critical" | "high" | "medium" | "low"
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        linkType: "website",
        targetUrl: detected.cleanUrl,
        title: data.title || detected.domain || "Website",
        domain: detected.domain,
        overallScore: Math.min(100, Math.max(10, parsed.websiteScore || 65)),
        contentScore: Math.min(100, Math.max(10, parsed.uxScore || 62)),
        engagementScore: Math.min(100, Math.max(10, parsed.conversionScore || 59)),
        growthScore: Math.min(100, Math.max(10, parsed.seoScore || 66)),
        seoScore: parsed.seoScore || 66,
        uxScore: parsed.uxScore || 62,
        conversionScore: parsed.conversionScore || 59,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : getWebsiteFallbackGaps(data),
        whatTheyDoWell: Array.isArray(parsed.whatTheyDoWell) ? parsed.whatTheyDoWell : ["Established domain presence", "Clean baseline structure"],
        missedOpportunities: Array.isArray(parsed.quickWins) ? parsed.quickWins : ["Add sticky mobile contact button", "Install lead capture popup"],
        estimatedLoss: parsed.estimatedRevenueImpact || "$2,200 - $4,800 / month",
        recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices : ["Website Redesign", "Conversion Rate Optimization", "Mobile Speed Fix"],
        pitchAngle: parsed.pitchAngle || "Send a custom desktop vs. mobile conversion redesign mockup.",
        outreachEmail: parsed.outreachEmail || `Hi team,\n\nI was doing some research on ${detected.domain} and noticed a couple of digital gaps on your homepage that are likely causing mobile visitors to bounce.\n\nWould you be open to a 3-minute video showing how to fix your booking flow?\n\nBest,\nA Freelance Web Designer`,
        emailPitch: parsed.outreachEmail || `Hi team,\n\nI was doing some research on ${detected.domain} and noticed a couple of digital gaps on your homepage that are likely causing mobile visitors to bounce.\n\nWould you be open to a 3-minute video showing how to fix your booking flow?\n\nBest,\nA Freelance Web Designer`,
        urgencyLevel: parsed.urgencyLevel || "high",
        metadata: data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      console.log("Gemini API call failed for Website gap analysis, using analytical fallback:", err);
    }
  }

  const gaps = getWebsiteFallbackGaps(data);
  return {
    linkType: "website",
    targetUrl: detected.cleanUrl,
    title: data.title || detected.domain || "Website",
    domain: detected.domain,
    overallScore: data.hasClearCTA && data.isMobileResponsive ? 72 : 55,
    contentScore: data.hasBlog ? 75 : 58,
    engagementScore: data.hasClearCTA ? 70 : 49,
    growthScore: 62,
    seoScore: 64,
    uxScore: 59,
    conversionScore: 52,
    gaps,
    whatTheyDoWell: [
      `Active digital storefront on ${detected.domain}`,
      data.hasContactInfo ? "Contact details prominently visible" : "Clear service categories",
      "Functional responsive viewport layout",
    ],
    missedOpportunities: [
      !data.hasClearCTA ? "Missing prominent sticky Call-To-Action above the mobile fold" : "No live chat or instant booking widget",
      !data.hasBlog ? "Zero SEO content marketing or blog articles to rank for search queries" : "No customer case studies or video testimonials",
      "Page load speed on mobile can be optimized for higher Google PageSpeed scores",
    ],
    estimatedLoss: "$2,400 – $5,000 / month in lost inbound website leads",
    recommendedServices: [
      "Conversion-Focused Web Redesign",
      "Mobile UX & PageSpeed Optimization",
      "Local SEO Landing Page Architecture",
    ],
    pitchAngle: "Provide a complimentary before/after mobile hero section mockup demonstrating instant CTA placement.",
    outreachEmail: `Hi ${detected.domain} team,\n\nI was exploring your website (${detected.cleanUrl}) and noticed 2 specific conversion bottlenecks on smartphones:\n\n1. ${gaps[0]?.problem || "No sticky booking CTA on mobile viewports"}\n2. ${gaps[1]?.problem || "Missing structured social proof above the fold"}\n\nI specialize in rebuilding websites for higher client conversions. I put together a quick wireframe showing how a modernized layout would look: mind if I share the link?\n\nBest regards,\nA Freelance Web Designer`,
    emailPitch: `Hi ${detected.domain} team,\n\nI was exploring your website (${detected.cleanUrl}) and noticed 2 specific conversion bottlenecks on smartphones:\n\n1. ${gaps[0]?.problem || "No sticky booking CTA on mobile viewports"}\n2. ${gaps[1]?.problem || "Missing structured social proof above the fold"}\n\nI specialize in rebuilding websites for higher client conversions. I put together a quick wireframe showing how a modernized layout would look: mind if I share the link?\n\nBest regards,\nA Freelance Web Designer`,
    urgencyLevel: !data.hasClearCTA ? "critical" : "high",
    metadata: data as unknown as Record<string, unknown>,
  };
}

function getWebsiteFallbackGaps(data: WebsiteScrapedData): AnalyzerGap[] {
  const gaps: AnalyzerGap[] = [];

  if (!data.hasClearCTA) {
    gaps.push({
      area: "Conversion Architecture & CTA",
      problem: "No clear, high-contrast Call-To-Action button visible above the fold on mobile",
      impact: "Over 60% of mobile visitors scroll without taking action or submitting a booking request",
      severity: "critical",
      fix: "Add prominent primary CTA ('Book Appointment' / 'Get Instant Quote') with direct appointment integration",
      estimatedImpact: "+35% increase in inquiry form submissions",
    });
  }

  gaps.push({
    area: "Mobile PageSpeed & Core Web Vitals",
    problem: `Mobile speed rating is ${data.loadPerformance}`,
    impact: "Google penalizes slow mobile loading speeds and users bounce after 3 seconds of delay",
    severity: "high",
    fix: "Compress image assets, eliminate render-blocking scripts, and implement Next.js static caching",
    estimatedImpact: "Sub-1.2s load times and 40% reduction in bounce rate",
  });

  if (!data.hasBlog) {
    gaps.push({
      area: "Organic Search & SEO Depth",
      problem: "No dedicated blog or educational resources to capture organic Google search intent",
      impact: "Competitors capture 100% of high-intent search traffic for informative queries",
      severity: "medium",
      fix: "Deploy 5 localized SEO cluster articles targeting primary services in your market",
      estimatedImpact: "+400 qualified monthly organic search visits",
    });
  }

  gaps.push({
    area: "Social Proof & Trust Signals",
    problem: "Lack of interactive Google review badges or real customer case studies",
    impact: "Prospective clients perceive higher purchase risk compared to top-rated rivals",
    severity: "medium",
    fix: "Integrate live Google 5-star review carousel and video testimonial section",
    estimatedImpact: "+20% boost in buyer trust score",
  });

  return gaps;
}

// -------------------------------------------------------------
// 3. GOOGLE MAPS GAP ANALYSIS
// -------------------------------------------------------------
async function analyzeMapsGaps(
  detected: DetectedLink,
  data: MapsScrapedData
): Promise<AnalyzerResultData> {
  const gaps: AnalyzerGap[] = [
    {
      area: "Local Google Pack Ranking",
      problem: "Under-optimized Google Business profile categories and low photo velocity",
      impact: "Business appears outside top-3 Google Maps local pack for high-intent keywords",
      severity: "critical",
      fix: "Fully optimize GBP profile, primary/secondary categories, and implement photo scheduling",
      estimatedImpact: "+50% direct phone call and direction requests",
    },
    {
      area: "Review Response & Velocity",
      problem: `${data.unansweredReviews || 6} customer reviews left unanswered`,
      impact: "Google algorithm demotes profiles that do not engage with reviewer feedback",
      severity: "high",
      fix: "Setup automated review capture system and respond with SEO-keyword rich replies",
      estimatedImpact: "Increased local search trust score and rating bump",
    },
    {
      area: "Online Booking Link",
      problem: "No direct appointment reservation link configured in Google Maps listing",
      impact: "Customers must call manually or search for competitors with instant scheduling",
      severity: "high",
      fix: "Connect direct appointment booking URL to profile CTA",
      estimatedImpact: "+25% increase in automated bookings",
    },
  ];

  return {
    linkType: "maps",
    targetUrl: detected.cleanUrl,
    title: data.title || detected.displayName,
    overallScore: 61,
    contentScore: 65,
    engagementScore: 58,
    growthScore: 60,
    gaps,
    whatTheyDoWell: [
      `Established Google Maps listing with ${data.rating}★ rating`,
      `${data.reviewsCount} customer reviews published`,
      "Verified local physical presence",
    ],
    missedOpportunities: [
      "Keyword-rich replies to existing Google reviews",
      "Regular weekly photo uploads showing staff and finished projects",
      "Google Posts updates highlighting current promotions and seasonal offers",
    ],
    estimatedLoss: "$1,500 – $3,000 / month",
    recommendedServices: [
      "Google Business Profile Optimization",
      "Automated Review Velocity Funnel",
      "Local Map Pack Ranking Retainer",
    ],
    pitchAngle: "Offer to set up an automated review generation link and optimize their GBP tags.",
    emailPitch: `Hi ${data.title} team,\n\nI saw your Google Maps listing (${data.rating}★ across ${data.reviewsCount} reviews). You have great customer feedback, but you're currently missing out on top 3 Map Pack rankings for local searchers because your profile categories and review replies need optimization.\n\nI help local businesses rank #1 on Google Maps. Would you like a 3-minute video showing the exact steps?\n\nBest,\nA Freelance SEO Specialist`,
    urgencyLevel: "high",
    metadata: data as unknown as Record<string, unknown>,
  };
}

// -------------------------------------------------------------
// 4. FACEBOOK GAP ANALYSIS
// -------------------------------------------------------------
async function analyzeFacebookGaps(
  detected: DetectedLink,
  data: FacebookScrapedData
): Promise<AnalyzerResultData> {
  const gaps: AnalyzerGap[] = [
    {
      area: "Post Frequency & Organic Reach",
      problem: `Low posting frequency (last post ${data.lastPostDate})`,
      impact: "Facebook algorithm throttles reach to less than 2% of followers",
      severity: "critical",
      fix: "Publish 4 weekly high-value posts and short Facebook Reels",
      estimatedImpact: "3x increase in weekly page reach",
    },
    {
      area: "Messenger Automation & Lead Capture",
      problem: "No automated instant reply or Messenger chatbot enabled",
      impact: "Prospects inquiring after-hours leave for responsive competitors",
      severity: "high",
      fix: "Deploy automated Facebook Messenger greeting and instant FAQ responder",
      estimatedImpact: "Instant 24/7 lead qualification",
    },
  ];

  return {
    linkType: "facebook",
    targetUrl: detected.cleanUrl,
    title: data.pageName,
    handle: data.pageName,
    overallScore: 56,
    contentScore: 50,
    engagementScore: 62,
    growthScore: 55,
    gaps,
    whatTheyDoWell: [
      `Existing fan base of ${data.followers.toLocaleString()} followers`,
      "Official verified page structure",
    ],
    missedOpportunities: [
      "Cross-posting short vertical Reels to Facebook",
      "Automated Messenger lead capture",
    ],
    estimatedLoss: "$1,200 – $2,500 / month",
    recommendedServices: [
      "Facebook Content & Community Management",
      "Messenger Lead Bot Setup",
    ],
    pitchAngle: "Offer a 1-week free content trial and instant Messenger responder setup.",
    emailPitch: `Hi ${data.pageName} team,\n\nI was looking at your Facebook page and noticed your page could be generating 10-15 more qualified inquiries a week with an automated Messenger reply and weekly Reels.\n\nWould you be open to a quick video showing how to implement this?\n\nBest,\nA Freelance Social Media Specialist`,
    urgencyLevel: "high",
    metadata: data as unknown as Record<string, unknown>,
  };
}
