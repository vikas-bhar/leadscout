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
export type CreditType = "purchase" | "usage" | "refund" | "bonus";
export type PitchStyle = "instagram_dm" | "email" | "whatsapp";
export type PitchSendTime = "morning" | "afternoon" | "evening";
export type ResponseRate = "low" | "medium" | "high";
export type GapSeverity = "low" | "medium" | "high";

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
  status: LeadStatus;
  notes: string | null;
  contactedAt: string | null;
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
  id: "starter" | "pro" | "agency";
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
  aiGapAnalysisPerBusiness: 1,
  aiPitchPerBusiness: 1,
  csvExport: 2,
} as const;

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
];
