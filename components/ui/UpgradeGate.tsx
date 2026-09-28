"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { usePlan } from "@/components/hooks/usePlan";
import { type PlanFeatureMatrix } from "@/lib/permissions";

interface UpgradeGateProps {
  feature: string;
  featureKey?: keyof PlanFeatureMatrix;
  requiredPlan: "freelancer" | "growth" | "agency";
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function UpgradeGate({
  feature,
  featureKey,
  requiredPlan,
  children,
  fallbackMessage,
}: UpgradeGateProps) {
  const { plan, can } = usePlan();

  // If specific featureKey is provided, check permission
  let isAllowed = false;
  if (featureKey) {
    isAllowed = can(featureKey);
  } else {
    // If only requiredPlan is provided, check plan tier
    const planOrder = { free: 0, freelancer: 1, growth: 2, agency: 3 };
    isAllowed = planOrder[plan] >= planOrder[requiredPlan];
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  const planCapitalized = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      <div className="opacity-30 pointer-events-none blur-[2px] select-none transition-all">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xs p-6 z-20">
        <div className="max-w-sm w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs border border-amber-200/60">
            <Lock className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3" />
              <span>{planCapitalized} Plan Feature</span>
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              {feature}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {fallbackMessage || `Unlock custom prompt engineering, automated gap scoring, and specialized AI models on the ${planCapitalized} plan.`}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/credits?upgrade=true"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <span>Upgrade to {planCapitalized}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
