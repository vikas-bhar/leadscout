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
// 1. INSTAGRAM GAP ANALYSIS
// -------------------------------------------------------------
async function analyzeInstagramGaps(
  detected: DetectedLink,
  data: InstagramScrapedData,
  ai: GoogleGenAI | null
): Promise<AnalyzerResultData> {
  const prompt = `You are an expert social media consultant.
Analyze this Instagram account data and identify every gap, weakness, and missed opportunity.

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
Bio Text: ${data.bio}
Content Themes: ${data.themes}

Industry benchmarks:
Good engagement rate: 2-3%
Ideal post frequency: 4-5x per week
Reels reach: 3x more than photos

CRITICAL ACCURACY & GROUNDING RULES:
- Strictly ground your evaluation in the real numbers above.
- If totalPosts <= 3 or followers < 150: Explicitly classify this profile as an inactive, dormant, personal, or unlaunched account. NEVER claim "maintaining an active profile presence" or "clear brand aesthetics" if there is only 1-2 posts or a personal photo.
- In "whatTheyDoWell": Only state verifiable truths (e.g., "Clean handle claimed", "Small personal follower base", or "Account active since registration").
- If bio is minimal/non-business (e.g., "Nothing!!"), explicitly identify the lack of any business description or call to action.
- In pitches: Do NOT write generic flattery like "Loved seeing your recent posts" if totalPosts <= 2. Instead, pitch from the angle of turning a dormant or fresh profile into an active brand from scratch.

Return pure JSON only (no markdown, no backticks, no code fence):
{
  "accountScore": number 0-100,
  "followerHealthScore": number 0-100,
  "contentScore": number 0-100,
  "engagementScore": number 0-100,
  "gaps": [
    {
      "area": "Reels & Reach",
      "problem": "detailed problem statement",
      "impact": "specific business and customer loss impact",
      "severity": "critical" | "high" | "medium" | "low",
      "fix": "exact concrete deliverable you can offer",
      "estimatedImpact": "$1,200+/mo in recovered inquiries"
    }
  ],
  "whatTheyDoWell": ["point 1", "point 2"],
  "missedOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "estimatedMonthlyLoss": "$1,500 - $3,200 / month",
  "recommendedServices": ["Reels Content Production", "Bio Conversion Funnel", "Weekly Content Engine"],
  "pitchAngle": "Offer 2 free high-converting Reels concepts to prove value immediately",
  "instagramDMPitch": "Hey @${data.username} team! Loved seeing your recent posts...",
  "emailPitch": "Hi there,\\n\\nI analyzed @${data.username}'s Instagram reach...",
  "urgencyLevel": "critical" | "high" | "medium" | "low"
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return {
        linkType: "instagram",
        targetUrl: detected.cleanUrl,
        title: `@${data.username}`,
        handle: data.username,
        overallScore: Math.min(100, Math.max(10, parsed.accountScore || 62)),
        contentScore: Math.min(100, Math.max(10, parsed.contentScore || 58)),
        engagementScore: Math.min(100, Math.max(10, parsed.engagementScore || 64)),
        growthScore: Math.min(100, Math.max(10, parsed.followerHealthScore || 60)),
        followerHealthScore: parsed.followerHealthScore || 60,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : getInstagramFallbackGaps(data),
        whatTheyDoWell: Array.isArray(parsed.whatTheyDoWell) ? parsed.whatTheyDoWell : ["Consistent aesthetic identity", "Active local audience"],
        missedOpportunities: Array.isArray(parsed.missedOpportunities) ? parsed.missedOpportunities : ["Missing short-form Reels algorithm distribution", "No lead magnet in bio"],
        estimatedLoss: parsed.estimatedMonthlyLoss || "$1,800 - $3,500 / month",
        recommendedServices: Array.isArray(parsed.recommendedServices) ? parsed.recommendedServices : ["Reels Video Production", "Conversion Bio Audit", "Monthly Content Calendar"],
        pitchAngle: parsed.pitchAngle || "Offer 2 sample viral Reel concepts tailored to their niche",
        instagramDMPitch: parsed.instagramDMPitch || `Hey @${data.username} team! Loved your recent posts. Noticed your feed could easily pull 3x more local customers by turning customer highlights into 15-second Reels. Put together 2 quick outlines for you—mind if I send them over?`,
        emailPitch: parsed.emailPitch || `Hi @${data.username} team,\n\nI was reviewing high-growth accounts in your niche and noticed a few simple tweaks to your Instagram profile could unlock 25-40% more weekly bookings without running ads.\n\nWould you be open to a 3-minute video breakdown of how to fix these gaps?\n\nBest,\nYour Freelance Growth Partner`,
        urgencyLevel: parsed.urgencyLevel || "high",
        metadata: data as unknown as Record<string, unknown>,
      };
    } catch (err) {
      console.log("Gemini API call failed for Instagram gap analysis, using analytical fallback:", err);
    }
  }

  // Analytical Fallback when Gemini API key is missing or errored
  const isPersonalOrDormant = data.totalPosts <= 3 || data.followers < 150;
  const gaps = getInstagramFallbackGaps(data);

  if (isPersonalOrDormant) {
    return {
      linkType: "instagram",
      targetUrl: detected.cleanUrl,
      title: `@${data.username}`,
      handle: data.username,
      overallScore: 32,
      contentScore: 24,
      engagementScore: 38,
      growthScore: 28,
      followerHealthScore: 40,
      gaps: [
        {
          area: "Account Maturity & Business Setup",
          problem: `Account is currently inactive or personal (${data.totalPosts} post${data.totalPosts === 1 ? "" : "s"}, ${data.followers} followers)`,
          impact: "Zero business footprint, search discoverability, or brand authority",
          severity: "critical",
          fix: "Launch a 9-post grid foundation establishing clear niche value, services, and bio positioning",
          estimatedImpact: "Establish a baseline trustworthy commercial presence",
        },
        {
          area: "Bio & Offer Positioning",
          problem: `Bio contains no business offer, services, or call to action (currently "${data.bio}")`,
          impact: "Visitors immediately bounce without knowing what value or service is provided",
          severity: "critical",
          fix: "Rewrite bio with: Who you help + How you help them + Clear link to book or DM",
          estimatedImpact: "Capture incoming profile visitors",
        },
        {
          area: "Short-Form Video & Discovery",
          problem: "Zero Reels or regular content engine in place",
          impact: "No algorithmic reach or local discovery",
          severity: "high",
          fix: "Publish 2 short-form video introductions or niche tips per week",
          estimatedImpact: "Generate initial organic reach",
        },
      ],
      whatTheyDoWell: [
        `Handle @${data.username} successfully secured`,
        `Baseline follower audience (${data.followers} followers, ${data.following} following)`,
        `Clean slate ready for brand building or launch`,
      ],
      missedOpportunities: [
        `Dormant profile with only ${data.totalPosts} post${data.totalPosts === 1 ? "" : "s"} published`,
        `Bio lacks commercial positioning or clear service offering (currently "${data.bio}")`,
        "Zero conversion funnel, highlights, or links to monetize profile traffic",
      ],
      estimatedLoss: "Unmonetized profile — missing 100% of potential digital business reach",
      recommendedServices: [
        "Brand Identity & Profile Setup",
        "9-Post Launch Content Grid",
        "High-Converting Bio & Link Funnel",
      ],
      pitchAngle: "Pitch complete zero-to-one launch package to turn a blank personal profile into a professional brand.",
      instagramDMPitch: `Hey @${data.username}! Noticed your profile has a great handle and clean slate (${data.followers} followers, ${data.totalPosts} post), but no active brand setup yet. If you're looking to turn this account into a brand, freelance business, or personal portfolio, I specialize in building out 9-post launch grids and high-converting bios. Mind if I share 2 quick ideas for your profile?`,
      emailPitch: `Hi @${data.username},\n\nI came across your Instagram profile (@${data.username}) and saw you've got the account reserved, but haven't actively launched a brand presence yet.\n\nI build turnkey launch packages for entrepreneurs and creators (including bio setup, 9-post visual grid, and initial Reel templates).\n\nWould you be open to seeing a quick concept mockup for how this profile could look fully launched?\n\nBest,\nYour Freelance Growth Partner`,
      urgencyLevel: "critical",
      metadata: data as unknown as Record<string, unknown>,
    };
  }

  return {
    linkType: "instagram",
    targetUrl: detected.cleanUrl,
    title: `@${data.username}`,
    handle: data.username,
    overallScore: data.usesReels && data.hasLinkInBio ? 74 : 58,
    contentScore: data.postsPerWeek >= 3 ? 78 : 52,
    engagementScore: data.engagementRate >= 2.0 ? 82 : 61,
    growthScore: data.usesReels ? 75 : 48,
    followerHealthScore: 65,
    gaps,
    whatTheyDoWell: [
      `Established profile presence with ${data.followers.toLocaleString()} followers`,
      data.postsPerWeek >= 2 ? "Consistent posting cadence maintained" : "Established community follower base",
      data.hasLinkInBio ? "Active website link present in bio" : "Organic engagement from core customers",
    ],
    missedOpportunities: [
      !data.usesReels ? "Missing 70%+ of top-of-funnel reach by not publishing regular short-form Reels" : "Reels frequency could be scaled to 3x/week",
      data.postsPerWeek < 4 ? "Low posting velocity (currently " + data.postsPerWeek + " posts/week vs. 4-5 ideal)" : "Pinned posts not structured for customer conversion",
      "No story highlight funnel guiding first-time visitors to prices or booking",
    ],
    estimatedLoss: "$1,800 – $3,400 / month in lost customer appointments",
    recommendedServices: [
      "Short-Form Video & Reels Package",
      "Bio & Highlights Conversion Architecture",
      "Monthly Content Calendar & Community Growth",
    ],
    pitchAngle: "Lead with a zero-risk 2-Reel script breakdown and conversion-optimized bio rewrite.",
    instagramDMPitch: `Hey @${data.username} team! Big fan of your work. I noticed your profile could easily capture an extra 15-20 direct bookings a month by turning your customer transformations into 12-second Reels. I drafted 2 quick sample video concepts for you—mind if I send them over? No pitch, just wanted to share!`,
    emailPitch: `Hi @${data.username} team,\n\nI conducted a quick social audit of your Instagram profile (@${data.username}) and spotted 2 critical digital gaps that are likely costing you weekly appointments:\n\n1. ${gaps[0]?.problem || "Underutilized short-form video reach"}\n2. ${gaps[1]?.problem || "Bio link not structured for mobile lead capture"}\n\nI specialize in scaling local businesses through video marketing. Would you be open to a 3-minute Loom video walking through how to fix these?\n\nBest regards,\nA Freelance Growth Partner`,
    urgencyLevel: !data.usesReels || !data.hasLinkInBio ? "critical" : "high",
    metadata: data as unknown as Record<string, unknown>,
  };
}

function getInstagramFallbackGaps(data: InstagramScrapedData): AnalyzerGap[] {
  const gaps: AnalyzerGap[] = [];

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
