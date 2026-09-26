import { applyHardFilters, runFilterAgent } from "./filterAgent";
import { profileClient } from "./clientProfiler";
import { runAnalysisAgent } from "./analysisAgent";
import { runPitchAgent } from "./pitchAgent";
import type { MasterAgentResult } from "@/types";
import type { BusinessInput, InstagramInput } from "./filterAgent";

export type { MasterAgentResult };

export async function runMasterAgent(
  business: BusinessInput,
  instagram: InstagramInput,
  freelancerType = "web_designer",
  freelancerSkills: string[] = ["outreach", "growth", "design"],
  onStep?: (step: string) => void
): Promise<MasterAgentResult> {
  const startTime = Date.now();
  const steps: string[] = [];
  let tokensUsed = 0;

  const log = (step: string) => {
    steps.push(step);
    onStep?.(step);
  };

  // ─────────────────────────────────
  // STAGE 1: HARD FILTER (free, 0 tokens)
  // ─────────────────────────────────
  log(`Applying hard qualification filters for ${business.name}...`);
  const hardFilter = applyHardFilters(business, instagram);

  if (!hardFilter.passed) {
    return {
      filtered: true,
      filterReason: hardFilter.reason,
      processingTime: Date.now() - startTime,
      tokensUsed: 0,
      agentSteps: steps,
    };
  }

  // ─────────────────────────────────
  // STAGE 2: AI FILTER AGENT (fast model)
  // ─────────────────────────────────
  log(`Evaluating budget & gap viability with AI Filter Agent...`);
  const filterResult = await runFilterAgent(business, instagram, freelancerType);
  tokensUsed += 500;

  if (filterResult.decision === "skip") {
    return {
      filtered: true,
      filterReason: filterResult.reasoning,
      filterResult,
      processingTime: Date.now() - startTime,
      tokensUsed,
      agentSteps: steps,
    };
  }

  // ─────────────────────────────────
  // STAGE 3: CLIENT PROFILING (pursue & maybe)
  // ─────────────────────────────────
  log(`Profiling client psychology, mindset & communication style...`);
  const clientProfile = await profileClient(
    business,
    instagram,
    business.reviews || []
  );
  tokensUsed += 1000;

  // ─────────────────────────────────
  // STAGE 4 & 5: DEEP ANALYSIS & PITCH SYNTHESIS (pursue leads)
  // ─────────────────────────────────
  if (filterResult.decision === "pursue") {
    log(`Conducting deep 6-step business intelligence analysis...`);
    const analysis = await runAnalysisAgent(
      business,
      instagram,
      freelancerType,
      freelancerSkills
    );
    tokensUsed += 2000;

    log(`Synthesizing psychologically matched outreach pitches...`);
    const pitches = await runPitchAgent(
      analysis,
      business,
      freelancerType,
      freelancerSkills
    );
    tokensUsed += 1500;

    return {
      filtered: false,
      filterResult,
      clientProfile,
      analysis,
      pitches,
      processingTime: Date.now() - startTime,
      tokensUsed,
      agentSteps: steps,
    };
  }

  // Maybe leads get client profile and strategic reasoning
  return {
    filtered: false,
    filterResult,
    clientProfile,
    processingTime: Date.now() - startTime,
    tokensUsed,
    agentSteps: steps,
  };
}
