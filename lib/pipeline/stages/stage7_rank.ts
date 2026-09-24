import { EnrichedBusiness } from "./stage4_enrich";
import { AIAnalysis } from "./stage5_ai";
import { PitchResult } from "./stage6_pitch";

export interface RankedLead {
  rank: number;
  business: EnrichedBusiness;
  analysis: AIAnalysis;
  pitches: PitchResult;
  finalScore: number;
}

export function rankLeads(
  leads: Array<{
    business: EnrichedBusiness;
    analysis: AIAnalysis;
    pitches: PitchResult;
  }>
): RankedLead[] {
  return leads
    .map((lead) => {
      // Weighted final score: 60% Opportunity Score + 20% Total Gap Count + 20% Budget Signal
      const finalScore = Math.round(
        lead.analysis.opportunityScore * 0.6 +
          lead.business.totalGapCount * 5 * 0.2 +
          (lead.business.budgetSignal === "high"
            ? 20
            : lead.business.budgetSignal === "medium"
            ? 10
            : 0) *
            0.2
      );

      return { ...lead, finalScore };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((lead, index) => ({
      ...lead,
      rank: index + 1,
      finalScore: Math.min(lead.finalScore, 100),
    }));
}
