"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SubscriptionCard } from "@/components/payments/SubscriptionCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import { clearLocalLeads, clearLocalSearches } from "@/lib/local-store";

export function SettingsSubscriptionManager() {
  const router = useRouter();
  const [sub, setSub] = useState<{
    planName: string;
    status: string;
    monthlyCredits: number;
    price?: number;
    renewalDate?: string | Date | null;
    creditRollover?: number;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSub() {
      try {
        const res = await fetch("/api/subscriptions/status");
        if (res.ok) {
          const data = await res.json();
          setSub({
            planName: data.planName || "Free",
            status: data.state || "active",
            monthlyCredits: data.monthlyCredits || 0,
            price: data.plan === "agency" ? 99 : data.plan === "growth" ? 49 : data.plan === "freelancer" ? 19 : 0,
            renewalDate: data.renewalDate,
            creditRollover: data.creditRollover,
            cancelAtPeriodEnd: data.state === "cancelled",
          });
        }
      } catch (err) {
        console.error("Failed to load subscription in settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadSub();
  }, []);

  async function handleManagePortal() {
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/credits");
      }
    } catch {
      toast.error("Could not load Stripe billing portal");
    }
  }

  async function handleCancelSubscription() {
    if (!confirm("Are you sure you want to cancel your plan? You will keep full access until the end of your billing cycle.")) {
      return;
    }
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Subscription set to cancel at period end.");
        setSub((prev) => (prev ? { ...prev, cancelAtPeriodEnd: true } : prev));
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("Network error while cancelling subscription");
    }
  }

  function handleClearLeads() {
    if (confirm("Are you sure you want to delete all stored leads? This cannot be undone.")) {
      clearLocalLeads();
      toast.success("All local leads cleared.");
    }
  }

  function handleClearSearches() {
    if (confirm("Are you sure you want to clear your search history?")) {
      clearLocalSearches();
      toast.success("Search history cleared.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Subscription */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
          Current Plan & Billing
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Manage your subscription tier, billing period, invoices, and credit allocations.
        </p>

        {isLoading ? (
          <div className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ) : sub ? (
          <SubscriptionCard
            sub={sub}
            onManage={handleManagePortal}
            onCancel={handleCancelSubscription}
            onResubscribe={() => router.push("/credits")}
          />
        ) : (
          <Card className="p-6 border border-neutral-200 text-center space-y-3">
            <Sparkles className="w-6 h-6 text-primary mx-auto" />
            <h4 className="text-sm font-bold text-neutral-900">You are on the Free Plan</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Upgrade to Freelancer ($19/mo) or Growth ($49/mo) to unlock monthly credit refills and custom prompts.
            </p>
            <Button onClick={() => router.push("/credits")}>
              View Subscription Plans →
            </Button>
          </Card>
        )}
      </div>

      {/* Customer Support & Helpdesk */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
          Support & Concierge
        </h3>
        <p className="text-xs text-neutral-500 mb-3">
          Need help with scraping credits, billing invoices, or custom prompt engineering?
        </p>

        <Card className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-neutral-900 dark:text-white">Official Support Email</p>
            <a
              href="mailto:officalleadscout@gmail.com"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              officalleadscout@gmail.com
            </a>
            <p className="text-[11px] text-neutral-400 mt-0.5">Average response time: &lt; 2 hours</p>
          </div>
          <a
            href="mailto:officalleadscout@gmail.com?subject=LeadScout%20Support%20Request"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            Email Support →
          </a>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-bold text-red-600 flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Irreversible actions on your account data and prospecting history.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4 border border-red-200 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Delete All Leads</h4>
              <p className="text-[11px] text-neutral-500">Remove all prospects from your database</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleClearLeads}>
              Delete Leads
            </Button>
          </Card>

          <Card className="p-4 border border-red-200 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Clear Search History</h4>
              <p className="text-[11px] text-neutral-500">Wipe past queries and cached audit logs</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleClearSearches}>
              Clear History
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
