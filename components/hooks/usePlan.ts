"use client";

import { useState, useEffect, useCallback } from "react";
import { type Plan, type PlanFeatureMatrix, canUseFeature, getPlanLimit } from "@/lib/permissions";
import { getActiveUser } from "@/lib/auth-client";

export function usePlan() {
  const [plan, setPlanState] = useState<Plan>("free");

  const syncPlan = useCallback(() => {
    try {
      const active = getActiveUser() as { subscriptionPlan?: string } | null;
      if (active?.subscriptionPlan) {
        const p = active.subscriptionPlan.toLowerCase() as Plan;
        if (p === "freelancer" || p === "growth" || p === "agency") {
          setPlanState(p);
          return;
        }
      }
      // Check localStorage directly if set
      if (typeof window !== "undefined") {
        const localPlan = localStorage.getItem("leadscout_current_plan") as Plan;
        if (localPlan && ["free", "freelancer", "growth", "agency"].includes(localPlan)) {
          setPlanState(localPlan);
          return;
        }
      }
      setPlanState("free");
    } catch {
      setPlanState("free");
    }
  }, []);

  useEffect(() => {
    syncPlan();
    if (typeof window !== "undefined") {
      window.addEventListener("freelancefind_user_updated", syncPlan);
      window.addEventListener("storage", syncPlan);
      return () => {
        window.removeEventListener("freelancefind_user_updated", syncPlan);
        window.removeEventListener("storage", syncPlan);
      };
    }
  }, [syncPlan]);

  const setPlan = useCallback((newPlan: Plan) => {
    setPlanState(newPlan);
    if (typeof window !== "undefined") {
      localStorage.setItem("leadscout_current_plan", newPlan);
      const active = getActiveUser() as { subscriptionPlan?: string } | null;
      if (active) {
        active.subscriptionPlan = newPlan;
      }
      window.dispatchEvent(new Event("freelancefind_user_updated"));
    }
  }, []);

  return {
    plan,
    setPlan,
    can: (feature: keyof PlanFeatureMatrix) => canUseFeature(plan, feature),
    limit: (limitKey: keyof PlanFeatureMatrix) => getPlanLimit(plan, limitKey),
    isSubscribed: plan !== "free",
    isPro: plan === "growth" || plan === "agency",
    isAgency: plan === "agency",
  };
}
