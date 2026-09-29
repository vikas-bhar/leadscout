"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getLocalBalance } from "@/lib/local-store";

export interface SubscriptionInfo {
  state: "free" | "trialing" | "active" | "past_due" | "cancelled" | "expired";
  plan: string;
  planName: string;
  availableCredits: number;
  renewalDate: string | null;
  message?: string;
}

export function SubscriptionBanner() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/subscriptions/status");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSub(data);
        }
      } catch {
        const local = getLocalBalance();
        if (!cancelled && local) {
          setSub({
            state: "free",
            plan: "free",
            planName: "Free",
            availableCredits: local.availableCredits ?? 20,
            renewalDate: null,
          });
        }
      }
    }

    void loadStatus();

    function handleStoreUpdate() {
      const local = getLocalBalance();
      if (local) {
        setSub((prev) => (prev ? { ...prev, availableCredits: local.availableCredits ?? prev.availableCredits } : prev));
      }
    }

    window.addEventListener("freelancefind_store_updated", handleStoreUpdate);
    window.addEventListener("storage", handleStoreUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("freelancefind_store_updated", handleStoreUpdate);
      window.removeEventListener("storage", handleStoreUpdate);
    };
  }, []);

  if (!sub) return null;

  // 1. Past due state (RED BANNER)
  if (sub.state === "past_due") {
    return (
      <div className="bg-rose-600 text-white px-4 py-2.5 shadow-sm text-xs font-semibold flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
          <span>Payment failed for your {sub.planName} plan. Update your payment method to keep access.</span>
        </div>
        <Link
          href="/credits"
          className="inline-flex items-center gap-1 bg-white text-rose-700 px-3 py-1 rounded-md font-bold hover:bg-rose-50 transition-colors shrink-0"
        >
          <span>Update Payment</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 2. Cancelled state but still has active days (AMBER BANNER)
  if (sub.state === "cancelled" && sub.renewalDate) {
    const formattedDate = format(new Date(sub.renewalDate), "MMMM d, yyyy");
    return (
      <div className="bg-amber-500 text-white px-4 py-2 shadow-sm text-xs font-semibold flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span>Your {sub.planName} subscription will end on {formattedDate}. You have full access until then.</span>
        </div>
        <Link
          href="/credits"
          className="inline-flex items-center gap-1 bg-white text-amber-800 px-3 py-1 rounded-md font-bold hover:bg-amber-50 transition-colors shrink-0"
        >
          <span>Resubscribe</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // 3. Low Credits Alert (<= 20 credits)
  if (sub.availableCredits <= 20) {
    return (
      <div
        className={cn(
          "px-4 py-2 border-b text-xs flex items-center justify-between flex-wrap gap-2 transition-colors",
          sub.availableCredits === 0
            ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
        )}
      >
        <div className="flex items-center gap-2">
          {sub.availableCredits === 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <span className="font-medium">
            {sub.availableCredits === 0
              ? "You have 0 credits remaining in your LeadScout wallet."
              : `Running low: You have ${sub.availableCredits} credit${sub.availableCredits === 1 ? "" : "s"} left (approx ${Math.floor(sub.availableCredits / 10)} searches).`}
          </span>
        </div>
        <Link
          href="/credits"
          className="font-bold underline hover:opacity-80 transition-opacity ml-auto"
        >
          Top up credits & plans →
        </Link>
      </div>
    );
  }

  return null;
}
