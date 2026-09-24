import { SchemaType } from "@google/generative-ai";

// Gap analysis schema
export const GAP_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    opportunityScore: {
      type: SchemaType.NUMBER,
      description: "Score 0-100. Higher = better opportunity",
    },
    urgencyLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    estimatedMonthlyBudget: {
      type: SchemaType.STRING,
      description: "e.g. $200-500 or $1000-3000",
    },
    gaps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          problem: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high"],
          },
          yourSolution: { type: SchemaType.STRING },
          estimatedRevenueImpact: { type: SchemaType.STRING },
        },
        required: ["category", "problem", "severity", "yourSolution"],
      },
    },
    strengthsFound: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    bestServiceToPitch: { type: SchemaType.STRING },
    secondaryServices: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    buyingSignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    redFlags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    pitchAngle: { type: SchemaType.STRING },
    hookStatement: { type: SchemaType.STRING },
    competitorGap: { type: SchemaType.STRING },
  },
  required: [
    "opportunityScore",
    "urgencyLevel",
    "gaps",
    "bestServiceToPitch",
    "pitchAngle",
    "hookStatement",
  ],
};

// Pitch schema
export const PITCH_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    pitches: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          style: {
            type: SchemaType.STRING,
            enum: ["instagram_dm", "email", "whatsapp"],
          },
          tone: { type: SchemaType.STRING },
          subject: { type: SchemaType.STRING },
          message: { type: SchemaType.STRING },
          bestTimeToSend: {
            type: SchemaType.STRING,
            enum: ["morning", "afternoon", "evening"],
          },
          expectedResponseRate: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high"],
          },
        },
        required: ["style", "message", "bestTimeToSend"],
      },
    },
    followUpMessage: { type: SchemaType.STRING },
    pitchTips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["pitches", "followUpMessage"],
};

// Instagram analysis schema
export const INSTAGRAM_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    accountScore: { type: SchemaType.NUMBER },
    followerHealthScore: { type: SchemaType.NUMBER },
    contentScore: { type: SchemaType.NUMBER },
    engagementScore: { type: SchemaType.NUMBER },
    growthPotentialScore: { type: SchemaType.NUMBER },
    gaps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          area: { type: SchemaType.STRING },
          problem: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high", "critical"],
          },
          fix: { type: SchemaType.STRING },
          estimatedImpact: { type: SchemaType.STRING },
        },
        required: ["area", "problem", "severity", "fix"],
      },
    },
    whatTheyDoWell: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    missedOpportunities: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    contentStrategy: { type: SchemaType.STRING },
    recommendedPostingSchedule: { type: SchemaType.STRING },
    estimatedMonthlyLoss: { type: SchemaType.STRING },
    recommendedServices: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    pitchAngle: { type: SchemaType.STRING },
    instagramDMPitch: { type: SchemaType.STRING },
    emailPitch: { type: SchemaType.STRING },
    urgencyLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
  },
  required: [
    "accountScore",
    "gaps",
    "recommendedServices",
    "pitchAngle",
    "urgencyLevel",
  ],
};

// Website analysis schema
export const WEBSITE_ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    websiteScore: { type: SchemaType.NUMBER },
    seoScore: { type: SchemaType.NUMBER },
    uxScore: { type: SchemaType.NUMBER },
    conversionScore: { type: SchemaType.NUMBER },
    mobileScore: { type: SchemaType.NUMBER },
    gaps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          area: { type: SchemaType.STRING },
          problem: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high", "critical"],
          },
          fix: { type: SchemaType.STRING },
          estimatedImpact: { type: SchemaType.STRING },
        },
        required: ["area", "problem", "severity", "fix"],
      },
    },
    whatTheyDoWell: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    quickWins: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    estimatedRevenueImpact: { type: SchemaType.STRING },
    recommendedServices: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    pitchAngle: { type: SchemaType.STRING },
    outreachEmail: { type: SchemaType.STRING },
    urgencyLevel: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
  },
  required: ["websiteScore", "gaps", "recommendedServices", "urgencyLevel"],
};
