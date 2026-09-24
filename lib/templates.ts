import type { Lead } from "@/types";

export type TemplateChannel = "email" | "instagram_dm" | "whatsapp" | "all";
export type TemplateCategory = "cold_outreach" | "audit_pitch" | "value_first" | "urgent_fix" | "follow_up" | "custom";

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  category: TemplateCategory;
  subject: string;
  body: string;
  isDefault?: boolean;
  isSystem?: boolean;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfileSettings {
  name: string;
  title: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  calendarLink: string;
  signature: string;
}

export const TEMPLATE_VARIABLES = [
  { key: "{{business_name}}", label: "Business Name", example: "Bella Italia Restaurant", group: "Lead Info" },
  { key: "{{category}}", label: "Category", example: "Restaurant", group: "Lead Info" },
  { key: "{{city}}", label: "City", example: "Dubai", group: "Lead Info" },
  { key: "{{location}}", label: "Location / Area", example: "Jumeirah, Dubai", group: "Lead Info" },
  { key: "{{google_rating}}", label: "Google Rating", example: "4.6", group: "Metrics" },
  { key: "{{review_count}}", label: "Review Count", example: "84", group: "Metrics" },
  { key: "{{instagram_handle}}", label: "Instagram Handle", example: "@bellaitalia_dxb", group: "Metrics" },
  { key: "{{ai_pitch_message}}", label: "AI Generated Pitch", example: "Saw that your mobile menu has high friction...", group: "AI Pitch Data" },
  { key: "{{ai_pitch_subject}}", label: "AI Generated Subject", example: "Quick idea for Bella Italia's mobile bookings", group: "AI Pitch Data" },
  { key: "{{primary_gap}}", label: "Primary Gap / Issue", example: "No online reservation portal", group: "AI Pitch Data" },
  { key: "{{gap_impact}}", label: "Gap Revenue Impact", example: "Losing up to 20 weekend bookings", group: "AI Pitch Data" },
  { key: "{{gap_solution}}", label: "Proposed Solution", example: "Deploy high-speed 1-click booking page", group: "AI Pitch Data" },
  { key: "{{best_service}}", label: "Recommended Service", example: "Conversion Web Design", group: "AI Pitch Data" },
  { key: "{{estimated_budget}}", label: "Est. Budget / Value", example: "$1,500 - $3,000", group: "AI Pitch Data" },
  { key: "{{freelancer_name}}", label: "Your Name", example: "Alex Vance", group: "Freelancer Profile" },
  { key: "{{freelancer_title}}", label: "Your Title / Specialty", example: "Growth Web Designer", group: "Freelancer Profile" },
  { key: "{{portfolio_url}}", label: "Portfolio URL", example: "https://portfolio.me", group: "Freelancer Profile" },
  { key: "{{calendar_link}}", label: "Booking Link", example: "https://cal.com/alex/15min", group: "Freelancer Profile" },
];

export const DEFAULT_FREELANCER_PROFILE: FreelancerProfileSettings = {
  name: "Alex",
  title: "Growth Freelancer & Digital Specialist",
  email: "alex@growthfreelance.co",
  phone: "+1 (555) 019-2834",
  portfolioUrl: "https://freelancefind.app",
  calendarLink: "https://cal.com/meeting",
  signature: "Best regards,\nAlex | Digital Growth Partner\nportfolio: https://freelancefind.app",
};

export const DEFAULT_TEMPLATES: OutreachTemplate[] = [
  {
    id: "tpl_gap_teaser_email",
    name: "The Digital Gap Teaser (High Response)",
    channel: "email",
    category: "audit_pitch",
    isDefault: true,
    isSystem: true,
    description: "Points out the specific detected digital gap with a zero-pressure 60-second Loom offer.",
    tags: ["Cold Email", "Gap Focused", "Recommended"],
    subject: "Quick observation regarding {{business_name}}'s {{category}} inquiries",
    body: `Hi {{business_name}} team,

I was looking at {{business_name}} in {{city}} and saw you have a strong reputation ({{google_rating}}★ across {{review_count}} Google reviews).

{{ai_pitch_message}}

I specialize in fixing {{primary_gap}} for {{category}}s. I drafted a quick 60-second video walkthrough showing how solving this could add extra direct bookings each week.

Would you be open to me sending that video over? No pitch, just wanted to share the breakdown.

{{freelancer_name}}
{{freelancer_title}}
{{portfolio_url}}`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_executive_audit_email",
    name: "Executive Benchmark & Revenue Leak",
    channel: "email",
    category: "audit_pitch",
    isDefault: false,
    isSystem: true,
    description: "Formal, data-backed pitch comparing local market benchmarks to their current digital footprint.",
    tags: ["Cold Email", "Data Driven", "B2B"],
    subject: "{{business_name}} audit: {{primary_gap}}",
    body: `Hi {{business_name}} Management,

While auditing top-performing {{category}}s in {{location}}, I ran a benchmark analysis on {{business_name}}'s digital customer acquisition funnel.

Here is the primary bottleneck identified:
• Issue: {{primary_gap}}
• Impact: {{gap_impact}}
• Solution: {{gap_solution}}

{{ai_pitch_message}}

We help businesses like {{business_name}} resolve these gaps within 7–14 days to maximize inbound client capture.

Are you available for a brief 10-minute discovery call this Thursday to review our findings? You can also pick a convenient time here: {{calendar_link}}

Sincerely,
{{freelancer_name}}
{{freelancer_title}}`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_no_pitch_value_drop",
    name: "No-Pitch Value Drop (2 Free Concepts)",
    channel: "email",
    category: "value_first",
    isDefault: false,
    isSystem: true,
    description: "Offers 2 free custom mockups/concepts upfront with zero obligation.",
    tags: ["Cold Email", "Value First", "High Conversion"],
    subject: "Drafted 2 free concepts for {{business_name}}",
    body: `Hey {{business_name}} team!

Big fan of what you've built in {{city}}—saw your {{google_rating}}★ rating and customer feedback.

I noticed that {{primary_gap}} is currently creating a small bottleneck for new customers trying to reach you.

{{ai_pitch_message}}

I actually went ahead and mocked up 2 quick visual concepts tailored specifically to {{business_name}} to show how {{gap_solution}} would look in action.

Mind if I drop the screenshots or PDF over for your team to check out? Zero obligation at all.

Best,
{{freelancer_name}}
{{portfolio_url}}`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_urgent_mobile_fix",
    name: "Mobile Conversion & Speed Rescue",
    channel: "email",
    category: "urgent_fix",
    isDefault: false,
    isSystem: true,
    description: "Focuses on smartphone customer drop-offs and lost direct inquiries.",
    tags: ["Cold Email", "Website Gaps", "Technical"],
    subject: "Mobile customer drop-off on {{business_name}}",
    body: `Hi there,

Did you know that over 70% of local {{category}} searches in {{city}} happen directly from mobile devices?

When testing {{business_name}}'s mobile funnel, I identified:
1. {{primary_gap}}
2. {{gap_impact}}

{{ai_pitch_message}}

I can implement {{gap_solution}} in under a week so you never lose high-intent local mobile traffic again.

Do you have 5 minutes this week to discuss?

{{freelancer_name}}
{{freelancer_title}}`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_instagram_dm_hook",
    name: "Conversational Instagram DM (4-Sentence Hook)",
    channel: "instagram_dm",
    category: "cold_outreach",
    isDefault: true,
    isSystem: true,
    description: "Casual, friendly, highly personalized DM starting with a real observation.",
    tags: ["Instagram DM", "Casual", "Short"],
    subject: "",
    body: `Hey {{instagram_handle}}! Loved checking out {{business_name}}'s reviews in {{city}} ({{review_count}} happy guests).

{{ai_pitch_message}}

I put together 2 quick ideas for {{gap_solution}} that could easily pull in extra bookings this month. Mind if I send over a quick 60-second screen recording? No pitch, just wanted to share!`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_whatsapp_direct",
    name: "Direct WhatsApp / SMS Business Message",
    channel: "whatsapp",
    category: "cold_outreach",
    isDefault: true,
    isSystem: true,
    description: "Punchy 2-3 sentence message referencing specific data points and asking an easy yes/no question.",
    tags: ["WhatsApp", "SMS", "Direct"],
    subject: "",
    body: `Hi {{business_name}}! Saw your {{google_rating}}★ rating across {{review_count}} Google reviews—awesome local reputation.

{{ai_pitch_message}}

Would you like me to share a 1-page action plan on how to resolve {{primary_gap}} this week?

— {{freelancer_name}} ({{portfolio_url}})`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "tpl_followup_3day",
    name: "The 3-Day Polite Follow-Up Bump",
    channel: "email",
    category: "follow_up",
    isDefault: false,
    isSystem: true,
    description: "Guilt-free re-anchoring of value 3 days after initial outreach.",
    tags: ["Follow-Up", "Email", "Sequence"],
    subject: "Re: Quick observation regarding {{business_name}}'s {{category}} inquiries",
    body: `Hi {{business_name}} team,

Just wanted to float this back to the top of your inbox in case you were busy earlier this week!

I know running a {{category}} in {{city}} keeps you swamped. To recap: I found that resolving {{primary_gap}} could help {{business_name}} recover {{gap_impact}}.

Still happy to send over that 60-second video mockup if you're interested.

Best regards,
{{freelancer_name}}
{{calendar_link}}`,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
];

const TEMPLATES_STORAGE_KEY = "freelancefind_outreach_templates_v1";
const PROFILE_STORAGE_KEY = "freelancefind_freelancer_profile_v1";

export function getStoredTemplates(): OutreachTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.log("Error reading stored templates:", e);
  }
  return DEFAULT_TEMPLATES;
}

export function saveStoredTemplates(templates: OutreachTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new Event("freelancefind_templates_updated"));
  } catch (e) {
    console.log("Error saving templates:", e);
  }
}

export function getStoredFreelancerProfile(): FreelancerProfileSettings {
  if (typeof window === "undefined") return DEFAULT_FREELANCER_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_FREELANCER_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.log("Error reading freelancer profile:", e);
  }
  return DEFAULT_FREELANCER_PROFILE;
}

export function saveStoredFreelancerProfile(profile: FreelancerProfileSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event("freelancefind_profile_updated"));
  } catch (e) {
    console.log("Error saving freelancer profile:", e);
  }
}

/**
 * Compiles an Outreach Template by replacing all {{variables}} with real data
 * from the lead, AI pitch bundle, and freelancer settings profile.
 */
export function compileOutreachTemplate(
  template: OutreachTemplate,
  lead: Partial<Lead> | Record<string, unknown>,
  profile?: Partial<FreelancerProfileSettings>,
  preferredPitchStyle?: "email" | "instagram_dm" | "whatsapp"
): { subject: string; body: string } {
  const activeProfile = { ...DEFAULT_FREELANCER_PROFILE, ...(profile || getStoredFreelancerProfile()) };
  const rawLead = (lead || {}) as Record<string, unknown>;

  const businessName = (rawLead.businessName || rawLead.business_name || "your business") as string;
  const category = (rawLead.businessCategory || rawLead.business_category || "Business") as string;
  const location = (rawLead.location || "your area") as string;
  const city = location.split(",")[1]?.trim() || location.split(",")[0]?.trim() || "your city";
  const googleRating = String(rawLead.googleRating ?? rawLead.google_rating ?? "4.5");
  const reviewCount = String(rawLead.reviewCount ?? rawLead.review_count ?? "35");
  const instagramHandle = (rawLead.instagramHandle || rawLead.instagram_handle || `@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}`) as string;

  // Extract primary gap
  let primaryGap = "Under-optimized digital customer booking funnel";
  let gapImpact = "Losing high-intent potential customers to nearby competitors";
  let gapSolution = "Build a streamlined, mobile-responsive direct booking page";

  const rawGaps = (rawLead.gapsFound || rawLead.gaps_found || rawLead.gaps) as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(rawGaps) && rawGaps.length > 0) {
    const firstGap = rawGaps[0];
    if (firstGap) {
      primaryGap = String(firstGap.problem || firstGap.category || primaryGap);
      gapImpact = String(firstGap.impact || gapImpact);
      gapSolution = String(firstGap.yourSolution || firstGap.solution || gapSolution);
    }
  }

  // Extract AI Pitch message & subject
  let aiPitchMessage = "";
  let aiPitchSubject = "";

  const pitchesObj = rawLead.pitches as { pitches?: Array<{ style: string; message: string; subject?: string | null }> } | undefined;
  if (pitchesObj && Array.isArray(pitchesObj.pitches) && pitchesObj.pitches.length > 0) {
    const channelToMatch = preferredPitchStyle || (template.channel === "instagram_dm" ? "instagram_dm" : template.channel === "whatsapp" ? "whatsapp" : "email");
    const matchedPitch = pitchesObj.pitches.find((p) => p.style === channelToMatch) || pitchesObj.pitches[0];
    if (matchedPitch) {
      aiPitchMessage = matchedPitch.message;
      aiPitchSubject = matchedPitch.subject || `Quick question regarding ${businessName}`;
    }
  }

  if (!aiPitchMessage) {
    aiPitchMessage = `I noticed ${businessName}'s ${primaryGap.toLowerCase()} is creating a slight barrier for new customers trying to book. Solving this with ${gapSolution.toLowerCase()} can immediately boost direct conversions.`;
  }
  if (!aiPitchSubject) {
    aiPitchSubject = `Quick idea for ${businessName}'s customer acquisition`;
  }

  const bestService = String(rawLead.bestService || rawLead.best_service || "Digital Optimization");
  const estimatedBudget = String(rawLead.estimatedBudget || rawLead.estimated_budget || "$1,500 - $3,000");

  const variableMap: Record<string, string> = {
    "{{business_name}}": businessName,
    "{{category}}": category,
    "{{city}}": city,
    "{{location}}": location,
    "{{google_rating}}": googleRating,
    "{{review_count}}": reviewCount,
    "{{instagram_handle}}": instagramHandle.startsWith("@") ? instagramHandle : `@${instagramHandle}`,
    "{{ai_pitch_message}}": aiPitchMessage,
    "{{ai_pitch_subject}}": aiPitchSubject,
    "{{primary_gap}}": primaryGap,
    "{{gap_impact}}": gapImpact,
    "{{gap_solution}}": gapSolution,
    "{{best_service}}": bestService,
    "{{estimated_budget}}": estimatedBudget,
    "{{freelancer_name}}": activeProfile.name || "Alex",
    "{{freelancer_title}}": activeProfile.title || "Growth Specialist",
    "{{portfolio_url}}": activeProfile.portfolioUrl || "",
    "{{calendar_link}}": activeProfile.calendarLink || "",
  };

  let compiledSubject = template.subject || "";
  let compiledBody = template.body || "";

  Object.entries(variableMap).forEach(([placeholder, value]) => {
    // Replace all occurrences
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    compiledSubject = compiledSubject.replace(regex, value);
    compiledBody = compiledBody.replace(regex, value);
  });

  return {
    subject: compiledSubject.trim(),
    body: compiledBody.trim(),
  };
}
