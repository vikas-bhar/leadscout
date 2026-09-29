export const SUPPORT_EMAIL = "officalleadscout@gmail.com";

export type FreelancerType =
  | "social_media_manager"
  | "web_designer"
  | "graphic_designer"
  | "copywriter"
  | "video_editor"
  | "photographer"
  | "seo_specialist"
  | "virtual_assistant";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type SearchStatus = "pending" | "running" | "completed" | "failed";
export type LeadStatus = "new" | "viewed" | "contacted" | "won" | "lost";
export type CreditType = "purchase" | "usage" | "refund" | "bonus" | "subscription";
export type PitchStyle = "instagram_dm" | "email" | "whatsapp" | "phone_script";
export type PitchSendTime = "morning" | "afternoon" | "evening";
export type ResponseRate = "low" | "medium" | "high";
export type GapSeverity = "low" | "medium" | "high";

export const FREELANCER_TYPES: FreelancerType[] = [
  "social_media_manager",
  "web_designer",
  "graphic_designer",
  "copywriter",
  "video_editor",
  "photographer",
  "seo_specialist",
  "virtual_assistant",
];

export const FREELANCER_TYPE_LABELS: Record<FreelancerType, string> = {
  social_media_manager: "Social Media Manager",
  web_designer: "Web Designer",
  graphic_designer: "Graphic Designer",
  copywriter: "Copywriter",
  video_editor: "Video Editor",
  photographer: "Photographer",
  seo_specialist: "SEO Specialist",
  virtual_assistant: "Virtual Assistant",
};

export const FREELANCER_SKILLS: Record<FreelancerType, string[]> = {
  social_media_manager: [
    "Instagram growth",
    "Content calendar",
    "Reels strategy",
    "Community management",
    "Paid ads",
  ],
  web_designer: [
    "Landing pages",
    "WordPress",
    "Shopify",
    "UX/UI",
    "Webflow",
  ],
  graphic_designer: [
    "Brand identity",
    "Social creatives",
    "Packaging",
    "Print",
    "Presentation design",
  ],
  copywriter: [
    "Website copy",
    "Email sequences",
    "Ads copy",
    "Sales pages",
    "Brand voice",
  ],
  video_editor: [
    "Reels/TikTok",
    "YouTube",
    "Ads video",
    "Motion graphics",
    "Color grading",
  ],
  photographer: [
    "Product photography",
    "Brand photography",
    "Food photography",
    "Headshots",
    "Event photography",
  ],
  seo_specialist: [
    "Technical SEO",
    "Local SEO",
    "Content SEO",
    "Link building",
    "Google Business Profile",
  ],
  virtual_assistant: [
    "Inbox management",
    "Scheduling",
    "CRM",
    "Customer support",
    "Research",
  ],
};

export const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Salon / Spa",
  "Gym / Fitness",
  "Dental clinic",
  "Law firm",
  "Real estate agency",
  "Retail store",
  "Hotel",
  "Auto repair",
  "Medical clinic",
  "Bakery",
  "Pet services",
  "Home services",
  "Photography studio",
] as const;

export interface CustomClientFilter {
  userPrompt: string;
  nicheFocus: string;
  primaryCategory: string;
  targetLocation: {
    country?: string;
    countryCode?: string;
    city?: string;
    place?: string;
    rawLocation: string;
  };
  freelancerType?: FreelancerType;
  digitalGapPriorities: string[];
  budgetLevel: "any" | "medium" | "high" | "enterprise";
  minRating?: number;
  minReviews?: number;
  exclusionKeywords: string[];
  pitchStrategyAngle: string;
  agentUnderstanding: {
    summary: string;
    scoutingStrategy: string[];
    pitchStrategy: string;
    targetPersona: string;
  };
}

export interface AgentThought {
  step: string;
  reasoning: string;
  conclusion: string;
}

export interface ClientProfile {
  // Who they are
  ownerType: string;
  estimatedAge: string;
  techSavviness: "none" | "low" | "medium" | "high";
  businessMindset: string;

  // Psychology
  primaryMotivation: string;
  primaryFear: string;
  currentFrustration: string;
  dreamOutcome: string;

  // Communication style
  preferredTone: "formal" | "casual" | "direct" | "friendly";
  preferredChannel: "instagram_dm" | "email" | "whatsapp" | "call";
  bestTimeToContact: string;
  responseStyle: string;

  // Decision making
  decisionSpeed: "fast" | "medium" | "slow";
  decisionFactors: string[];
  budgetAuthority: "yes" | "maybe" | "no";
  approvalNeeded: string;

  // Objections they will raise
  likelyObjections: Array<{
    objection: string;
    underlyingFear: string;
    howToHandle: string;
  }>;

  // The perfect opener
  perfectFirstMessage: string;
  topicToAvoid: string;
  topicToLeadWith: string;

  // Awareness & Personality tags
  awarenessLevel?: "unaware" | "aware" | "considering";
  personalityType?: "analytical" | "driver" | "expressive" | "amiable";
  decisionMakerType?: "owner" | "manager" | "marketing";
  bestApproach?: string;
  worstApproach?: string;
  painPoints?: string[];
  motivations?: string[];
  objections?: string[];
}

export interface AgentAnalysis {
  // Agent reasoning chain
  thoughts: AgentThought[];

  // Client psychology
  clientProfile: {
    awarenessLevel: "unaware" | "aware" | "considering";
    painPoints: string[];
    motivations: string[];
    objections: string[];
    decisionMakerType: "owner" | "manager" | "marketing";
    personalityType: "analytical" | "driver" | "expressive" | "amiable";
    bestApproach: string;
    worstApproach: string;
    bestTimeToContact: string;
    preferredChannel: "instagram_dm" | "email" | "whatsapp" | "call";
  };

  // Business intelligence
  businessIntel: {
    estimatedRevenue: string;
    estimatedTeamSize: string;
    growthStage: "startup" | "growing" | "established" | "declining";
    digitalMaturity: "none" | "basic" | "intermediate" | "advanced";
    competitorStrength: "weak" | "moderate" | "strong";
    marketPosition: string;
    biggestThreat: string;
    biggestOpportunity: string;
  };

  // Gap analysis
  gapAnalysis: {
    opportunityScore: number;
    urgencyLevel: "low" | "medium" | "high" | "critical";
    estimatedMonthlyBudget: string;
    gaps: Array<{
      id: string;
      category: string;
      problem: string;
      rootCause: string;
      businessImpact: string;
      estimatedRevenueLoss: string;
      severity: "low" | "medium" | "high" | "critical";
      effortToFix: "low" | "medium" | "high";
      yourSolution: string;
      timeToResult: string;
      proofPoints: string[];
    }>;
    priorityGap: string;
    quickWins: string[];
    strengthsFound: string[];
    redFlags: string[];
    buyingSignals: string[];
  };

  // Pitch strategy
  pitchStrategy: {
    angle: string;
    hook: string;
    valueProposition: string;
    socialProof: string;
    callToAction: string;
    followUpStrategy: string;
  };
}

export interface PitchSet {
  instagramDM: {
    message: string;
    characterCount: number;
    bestTimeToSend: string;
    expectedResponseRate: "low" | "medium" | "high";
    whyThisWorks: string;
  };
  email: {
    subject: string;
    message: string;
    bestTimeToSend: string;
    expectedResponseRate: "low" | "medium" | "high";
    whyThisWorks: string;
  };
  whatsapp: {
    message: string;
    bestTimeToSend: string;
    expectedResponseRate: "low" | "medium" | "high";
    whyThisWorks: string;
  };
  followUpSequence: Array<{
    dayNumber: number;
    channel: string;
    message: string;
    purpose: string;
  }>;
  pitchTips: string[];
  whatToAvoid: string[];
  objectionHandlers: Array<{
    objection: string;
    response: string;
  }>;
}

export type FilterDecision = "pursue" | "maybe" | "skip";

export interface FilterResult {
  decision: FilterDecision;
  confidence: number;
  score: number;
  reasoning: string;
  positiveSignals: string[];
  negativeSignals: string[];
  estimatedCloseRate: string;
  estimatedDealSize: string;
  estimatedTimeToClose: string;
  priority: "immediate" | "this_week" | "this_month" | "someday";
}

export interface MasterAgentResult {
  filtered: boolean;
  filterReason?: string;
  filterResult?: FilterResult;
  clientProfile?: ClientProfile;
  analysis?: AgentAnalysis;
  pitches?: PitchSet;
  processingTime: number;
  tokensUsed: number;
  agentSteps: string[];
}

export interface Gap {
  category: string;
  problem: string;
  impact: string;
  severity: GapSeverity;
  yourSolution: string;
}

export interface Pitch {
  style: PitchStyle;
  tone: string;
  subject: string | null;
  message: string;
  bestTimeToSend: PitchSendTime;
  expectedResponseRate: ResponseRate;
}

export interface PitchBundle {
  pitches: Pitch[];
  followUpMessage: string;
  pitchTips: string[];
}

export interface GapAnalysisResult {
  opportunityScore: number;
  urgencyLevel: UrgencyLevel;
  estimatedMonthlyBudget: string;
  gaps: Gap[];
  strengthsFound: string[];
  bestServiceToPitch: string;
  secondaryServices: string[];
  buyingSignals: string[];
  redFlags: string[];
  pitchAngle: string;
  hookStatement: string;
}

export type LeadTag =
  | "Cold"
  | "Warm"
  | "Hot"
  | "Follow-up needed"
  | "Qualified"
  | "High Budget"
  | "Unresponsive";

export interface TagStyle {
  id: LeadTag | string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

export const PRESET_LEAD_TAGS: TagStyle[] = [
  {
    id: "Hot",
    label: "Hot",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800",
    dotColor: "bg-rose-500",
  },
  {
    id: "Warm",
    label: "Warm",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    id: "Cold",
    label: "Cold",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  {
    id: "Follow-up needed",
    label: "Follow-up needed",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-800",
    dotColor: "bg-purple-500",
  },
  {
    id: "Qualified",
    label: "Qualified",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  {
    id: "High Budget",
    label: "High Budget",
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    dotColor: "bg-cyan-500",
  },
];

export function getTagStyle(tag: string): TagStyle {
  const match = PRESET_LEAD_TAGS.find((p) => p.id.toLowerCase() === tag.toLowerCase() || p.label.toLowerCase() === tag.toLowerCase());
  if (match) return match;
  return {
    id: tag,
    label: tag,
    color: "text-neutral-700 dark:text-neutral-300",
    bgColor: "bg-neutral-100 dark:bg-neutral-800",
    borderColor: "border-neutral-200 dark:border-neutral-700",
    dotColor: "bg-neutral-400",
  };
}

export interface LeadFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  searchId: string;
  userId: string;
  rank: number;
  businessName: string;
  businessCategory: string;
  location: string;
  googleRating: number;
  reviewCount: number;
  hasWebsite: boolean;
  websiteUrl: string | null;
  phone: string | null;
  photoCount: number;
  mapsUrl: string | null;
  instagramHandle: string | null;
  instagramFollowers: number | null;
  instagramFollowing: number | null;
  instagramPosts: number | null;
  lastPostDate: string | null;
  engagementRate: number | null;
  hasLinkInBio: boolean | null;
  usesReels: boolean | null;
  opportunityScore: number;
  urgencyLevel: UrgencyLevel;
  gapsFound: Gap[];
  bestService: string;
  secondaryServices: string[];
  buyingSignals: string[];
  pitches: PitchBundle;
  estimatedBudget: string | null;
  folderId?: string | null;
  folderName?: string | null;
  status: LeadStatus;
  notes: string | null;
  tags?: string[];
  contactedAt: string | null;
  agentAnalysis?: AgentAnalysis;
  clientProfile?: ClientProfile;
  filterResult?: FilterResult;
  pitchSet?: PitchSet;
  agentSteps?: string[];
  createdAt: string;
}

export interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditType;
  creditsAmount: number;
  action: string | null;
  description: string | null;
  searchId: string | null;
  stripeSession: string | null;
  createdAt: string;
}

export interface SearchSession {
  id: string;
  userId: string;
  location: string;
  businessType: string;
  freelancerType: FreelancerType;
  status: SearchStatus;
  progress: number;
  progressMessage: string | null;
  resultsCount: number;
  creditsUsed: number;
  error: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  freelancerType: FreelancerType | null;
  freelancerSkills: string[];
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackage {
  id: "starter" | "pro" | "agency" | "flexible";
  name: string;
  credits: number;
  bonusCredits: number;
  priceUsd: number;
  popular: boolean;
  stripePriceEnv?: string;
}

export interface SearchCostBreakdown {
  mapsCredits: number;
  instagramCredits: number;
  analysisCredits: number;
  pitchCredits: number;
  totalCredits: number;
  resultCount: number;
}

export interface MapsBusiness {
  title: string;
  totalScore: number | null;
  reviewsCount: number | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  photosCount: number | null;
  openingHours: string[] | null;
  url: string | null;
  unansweredReviews: number;
  category: string | null;
}

export interface InstagramProfile {
  username: string;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  latestPostDate: string | null;
  engagementRate: number | null;
  externalUrl: string | null;
  biography: string | null;
  hasReels: boolean | null;
  avgLikes: number | null;
}

export interface EnrichedBusiness extends MapsBusiness {
  instagram: InstagramProfile | null;
}

export const CREDIT_COSTS = {
  mapsPerTenResults: 2,
  instagramPerTenProfiles: 3,
  aiGapAnalysisPerBusiness: 0.5,
  aiPitchPerBusiness: 0.5,
  csvExport: 2,
  analyze_link: 5,
  analyzeLink: 5,
} as const;

export interface AnalyzerGap {
  area: string;
  problem: string;
  impact: string;
  severity: "low" | "medium" | "high" | "critical";
  fix: string;
  estimatedImpact: string;
}

export interface AnalyzerResultData {
  linkType: "instagram" | "website" | "maps" | "facebook";
  targetUrl: string;
  title: string;
  handle?: string;
  domain?: string;
  // Scores
  overallScore: number;
  contentScore?: number;
  engagementScore?: number;
  growthScore?: number;
  seoScore?: number;
  uxScore?: number;
  conversionScore?: number;
  followerHealthScore?: number;
  // Gap analysis
  gaps: AnalyzerGap[];
  whatTheyDoWell: string[];
  missedOpportunities: string[];
  estimatedLoss: string;
  recommendedServices: string[];
  pitchAngle: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  // Pitches
  instagramDMPitch?: string;
  emailPitch?: string;
  outreachEmail?: string;
  whatsappPitch?: string;
  // Extracted raw/scraped summary
  metadata?: Record<string, unknown>;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter pack",
    credits: 100,
    bonusCredits: 0,
    priceUsd: 9,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro pack",
    credits: 500,
    bonusCredits: 100,
    priceUsd: 29,
    popular: true,
  },
  {
    id: "agency",
    name: "Agency pack",
    credits: 2000,
    bonusCredits: 0,
    priceUsd: 99,
    popular: false,
  },
  {
    id: "flexible",
    name: "Flexible Pack ($0.10/credit)",
    credits: 100,
    bonusCredits: 0,
    priceUsd: 10,
    popular: false,
  },
];
