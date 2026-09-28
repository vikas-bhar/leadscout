export interface OneTimeProduct {
  id: string;
  name: string;
  credits: number;
  bonusCredits?: number;
  price: number;
  priceId: string;
  description: string;
}

export interface SubscriptionProduct {
  id: string;
  name: string;
  monthlyCredits: number;
  price: number;
  annualPrice: number;
  priceId: string;
  annualPriceId: string;
  interval: "month" | "year";
  features: string[];
  searchesPerMonth: number;
  seats: number;
  creditRollover: number | "unlimited";
  badge?: string;
  highlighted?: boolean;
}

export const STRIPE_PRODUCTS = {
  // ONE-TIME CREDIT PACKS (existing)
  oneTime: {
    starter: {
      id: "starter",
      name: "Starter Pack",
      credits: 100,
      price: 9,
      priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter_placeholder",
      description: "100 credits, never expire",
    },
    pro: {
      id: "pro",
      name: "Pro Pack",
      credits: 600,
      bonusCredits: 100,
      price: 29,
      priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
      description: "500 + 100 bonus credits",
    },
    agency: {
      id: "agency",
      name: "Agency Pack",
      credits: 2000,
      price: 99,
      priceId: process.env.STRIPE_AGENCY_PRICE_ID || "price_agency_placeholder",
      description: "2000 credits, 3 seats",
    },
  },

  // MONTHLY SUBSCRIPTIONS (new)
  subscriptions: {
    freelancer: {
      id: "freelancer",
      name: "Freelancer",
      monthlyCredits: 300,
      price: 19,
      annualPrice: 182, // ~20% discount ($15.16/mo)
      priceId: process.env.STRIPE_SUB_FREELANCER_ID || "price_sub_freelancer_placeholder",
      annualPriceId: process.env.STRIPE_SUB_FREELANCER_ANNUAL_ID || "price_sub_freelancer_annual_placeholder",
      interval: "month" as const,
      badge: "Most affordable",
      features: [
        "300 credits per month",
        "Credits reset monthly",
        "Google Maps + Instagram",
        "AI gap analysis",
        "Personalized pitches",
        "Custom search filters",
        "Email support",
      ],
      searchesPerMonth: 12,
      seats: 1,
      creditRollover: 0,
    },
    growth: {
      id: "growth",
      name: "Growth",
      monthlyCredits: 1000,
      price: 49,
      annualPrice: 470, // ~20% discount ($39.16/mo)
      priceId: process.env.STRIPE_SUB_GROWTH_ID || "price_sub_growth_placeholder",
      annualPriceId: process.env.STRIPE_SUB_GROWTH_ANNUAL_ID || "price_sub_growth_annual_placeholder",
      interval: "month" as const,
      badge: "Most popular ⭐",
      highlighted: true,
      features: [
        "1,000 credits per month",
        "Everything in Freelancer",
        "Gap Analyzer (unlimited)",
        "Custom AI prompts",
        "Advanced filters",
        "CSV export",
        "Priority support",
        "Credit rollover (up to 500)",
      ],
      searchesPerMonth: 40,
      seats: 1,
      creditRollover: 500,
    },
    agency: {
      id: "agency",
      name: "Agency",
      monthlyCredits: 3000,
      price: 99,
      annualPrice: 950, // ~20% discount ($79.16/mo)
      priceId: process.env.STRIPE_SUB_AGENCY_ID || "price_sub_agency_placeholder",
      annualPriceId: process.env.STRIPE_SUB_AGENCY_ANNUAL_ID || "price_sub_agency_annual_placeholder",
      interval: "month" as const,
      badge: "Best for teams",
      features: [
        "3,000 credits per month",
        "Everything in Growth",
        "Custom prompt library",
        "Team seats (5)",
        "White-label pitches",
        "API access",
        "Dedicated support",
        "Custom onboarding",
        "Full credit rollover",
      ],
      searchesPerMonth: 120,
      seats: 5,
      creditRollover: "unlimited" as const,
    },
  },
};
