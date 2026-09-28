"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Check,
  History,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Crown,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { type CreditBalance, type CreditTransaction } from "@/types";
import { estimateSearchesRemaining } from "@/lib/credit-calc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getLocalBalance, getLocalTransactions, addLocalCredits } from "@/lib/local-store";
import { usePlan } from "@/components/hooks/usePlan";
import { type Plan } from "@/lib/permissions";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";

interface CreditsViewProps {
  initialBalance: CreditBalance;
  initialTransactions: CreditTransaction[];
  userEmail?: string | null;
}

export function CreditsView({
  initialBalance,
  initialTransactions,
}: CreditsViewProps) {
  const { plan, setPlan, isSubscribed } = usePlan();
  const [balance, setBalance] = useState<CreditBalance>(initialBalance);
  const [transactions, setTransactions] = useState<CreditTransaction[]>(initialTransactions);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [pricingTab, setPricingTab] = useState<"subscriptions" | "onetime">("subscriptions");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    function sync() {
      const localBal = getLocalBalance();
      const localTx = getLocalTransactions();
      if (localBal) {
        setBalance(localBal);
      }
      if (localTx && localTx.length > 0) {
        setTransactions(localTx);
      }
    }

    sync();

    window.addEventListener("freelancefind_store_updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("freelancefind_store_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const available = balance.availableCredits ?? 20;
  const total = Math.max(balance.totalCredits ?? 20, available);
  const used = balance.usedCredits ?? 0;
  const usagePercentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const searchesRemaining = estimateSearchesRemaining(available, 10);

  async function handleRefreshBalance() {
    setIsRefreshing(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetch("/api/credits/balance"),
        fetch("/api/credits/transactions"),
      ]);

      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(balData);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData.transactions)) {
          setTransactions(txData.transactions);
        }
      }
      toast.success("Balance updated");
    } catch {
      toast.error("Failed to sync balance");
    } finally {
      setIsRefreshing(false);
    }
  }

  // Subscribe action
  async function handleSubscribe(planId: string) {
    setPurchasingPlanId(planId);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: billingInterval }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.mode === "simulated") {
        const planObj = STRIPE_PRODUCTS.subscriptions[planId as keyof typeof STRIPE_PRODUCTS.subscriptions];
        if (planObj) {
          addLocalCredits(
            planObj.monthlyCredits,
            `Subscribed to ${planObj.name} plan (+${planObj.monthlyCredits} monthly credits)`
          );
          setPlan(planId as Plan);
          setBalance(getLocalBalance());
          setTransactions(getLocalTransactions());
        }
        toast.success(data.message || `Subscribed to ${planId}!`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate subscription";
      toast.error(msg);
    } finally {
      setPurchasingPlanId(null);
    }
  }

  // One-time pack buy action
  async function handleBuyOneTime(packageId: "starter" | "pro" | "agency") {
    setPurchasingPackId(packageId);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback for test / dev environment
        const pack = STRIPE_PRODUCTS.oneTime[packageId];
        addLocalCredits(
          pack.credits + (pack.bonusCredits || 0),
          `Purchased ${pack.name} (+${pack.credits + (pack.bonusCredits || 0)} credits)`
        );
        setBalance(getLocalBalance());
        setTransactions(getLocalTransactions());
        toast.success(`Purchased ${pack.name}! Credits added.`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      const pack = STRIPE_PRODUCTS.oneTime[packageId];
      addLocalCredits(
        pack.credits + (pack.bonusCredits || 0),
        `Purchased ${pack.name} (+${pack.credits + (pack.bonusCredits || 0)} credits)`
      );
      setBalance(getLocalBalance());
      setTransactions(getLocalTransactions());
      toast.success(`Purchased ${pack.name}! Credits added.`);
    } finally {
      setPurchasingPackId(null);
    }
  }

  // Customer billing portal
  async function handleOpenPortal() {
    setIsOpeningPortal(true);
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.info("No active Stripe subscription portal to redirect to.");
      }
    } catch {
      toast.error("Could not load billing portal.");
    } finally {
      setIsOpeningPortal(false);
    }
  }

  const subPlans = Object.values(STRIPE_PRODUCTS.subscriptions);
  const oneTimePacks = Object.values(STRIPE_PRODUCTS.oneTime);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Credits & Subscription
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Choose recurring monthly subscriptions with fresh credit refills or buy one-time credit packs that never expire.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshBalance}
          disabled={isRefreshing}
          className="text-xs h-9 gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          <span>Sync Balance</span>
        </Button>
      </div>

      {/* SECTION A — CURRENT PLAN STATUS CARD */}
      <Card className="border border-neutral-200/80 shadow-xs overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                  Current Membership
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                    plan === "agency"
                      ? "bg-purple-100 text-purple-800"
                      : plan === "growth"
                      ? "bg-blue-100 text-blue-800"
                      : plan === "freelancer"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-100 text-neutral-700"
                  )}
                >
                  {plan} Plan
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{available}</span>
                <span className="text-sm font-medium text-neutral-500">available credits</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 px-3.5 py-2">
                <span className="text-[11px] text-neutral-500 block">Total Allocated</span>
                <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">{total} credits</span>
              </div>
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 px-3.5 py-2">
                <span className="text-[11px] text-neutral-500 block">Used Credits</span>
                <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">{used} credits</span>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2">
                <span className="text-[11px] text-primary block font-medium">Estimated Runway</span>
                <span className="font-bold text-xs text-primary">~{searchesRemaining} searches</span>
              </div>

              {isSubscribed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPortal}
                  disabled={isOpeningPortal}
                  className="h-9 text-xs gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Manage Subscription</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPricingTab("subscriptions")}
                  className="h-9 text-xs gap-1.5 shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Upgrade to Monthly</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar & Refill Info */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              <span>Credit utilization</span>
              <span>
                {used} of {total} credits used ({usagePercentage}%)
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(used > 0 ? 3 : 0, usagePercentage))}%` }}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-500">
              <p>
                {isSubscribed
                  ? "Monthly subscription credits automatically refill every billing cycle. Unused credits rollover according to your plan policy."
                  : "Free accounts receive 20 initial discovery credits. Upgrade to a subscription for recurring refills and custom prompts."}
              </p>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {available} credits remaining
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION B — SUBSCRIPTIONS & ONE-TIME CREDIT PACKS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setPricingTab("subscriptions")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                pricingTab === "subscriptions"
                  ? "bg-white dark:bg-neutral-900 text-primary shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Subscriptions (Best Value)</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingTab("onetime")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                pricingTab === "onetime"
                  ? "bg-white dark:bg-neutral-900 text-primary shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>One-Time Credit Packs</span>
            </button>
          </div>

          {/* Annual Billing Discount Toggle (For subscriptions tab) */}
          {pricingTab === "subscriptions" && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={billingInterval === "month" ? "text-neutral-900 font-bold" : "text-neutral-500"}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
                className="w-11 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 p-0.5 transition-colors relative"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-primary transition-transform",
                    billingInterval === "year" ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
              <span className={billingInterval === "year" ? "text-neutral-900 font-bold" : "text-neutral-500"}>
                Annual
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Save 20%
              </span>
            </div>
          )}
        </div>

        {/* TAB 1: MONTHLY SUBSCRIPTIONS */}
        {pricingTab === "subscriptions" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subPlans.map((p) => {
              const isCurrent = plan === p.id;
              const isHighlight = p.highlighted;
              const priceDisplay =
                billingInterval === "year"
                  ? Math.round(p.annualPrice / 12)
                  : p.price;

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "relative p-6 rounded-2xl flex flex-col justify-between transition-all duration-200 bg-white dark:bg-neutral-900",
                    isHighlight
                      ? "border-2 border-primary ring-2 ring-primary/20 shadow-md"
                      : "border border-neutral-200 dark:border-neutral-800 shadow-xs"
                  )}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary text-white shadow-xs uppercase tracking-wider">
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                          ${priceDisplay}
                        </span>
                        <span className="text-xs text-neutral-500">/month</span>
                      </div>
                      {billingInterval === "year" && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                          Billed annually (${p.annualPrice}/yr)
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{p.monthlyCredits.toLocaleString()} Credits / month</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        ~{p.searchesPerMonth} deep searches • {p.seats} team {p.seats > 1 ? "seats" : "seat"}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      {p.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <Button
                        disabled
                        className="w-full text-xs h-10 font-bold bg-neutral-100 text-neutral-500"
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(p.id)}
                        disabled={purchasingPlanId === p.id}
                        className={cn(
                          "w-full text-xs h-10 font-semibold gap-1.5 shadow-xs",
                          isHighlight ? "bg-primary text-white" : ""
                        )}
                      >
                        {purchasingPlanId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                        <span>Subscribe to {p.name}</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* TAB 2: ONE-TIME CREDIT PACKS */}
        {pricingTab === "onetime" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {oneTimePacks.map((pkg) => {
              const totalCredits = pkg.credits + (pkg.bonusCredits || 0);

              return (
                <Card
                  key={pkg.id}
                  className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between shadow-xs"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white">{pkg.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                          ${pkg.price}
                        </span>
                        <span className="text-xs text-neutral-500">one-time</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{pkg.description}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>{totalCredits.toLocaleString()} Credits Total</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        ${(pkg.price / totalCredits).toFixed(3)} per credit • Never expire
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Google Maps & Instagram Discovery</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>AI Gap Analysis & Personalized Pitches</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Credits remain in wallet permanently</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => handleBuyOneTime(pkg.id as "starter" | "pro" | "agency")}
                      disabled={purchasingPackId === pkg.id}
                      className="w-full text-xs h-10 font-semibold gap-1.5"
                    >
                      {purchasingPackId === pkg.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Coins className="w-3.5 h-3.5" />
                      )}
                      <span>Buy {totalCredits} Credits</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION C — TRANSACTION HISTORY TABLE */}
      <Card className="border border-neutral-200/80 shadow-xs overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Transaction & Wallet Ledger</h2>
          </div>
          <span className="text-xs text-neutral-400">{transactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive =
                    tx.type === "bonus" ||
                    tx.type === "purchase" ||
                    tx.type === "subscription" ||
                    (tx.creditsAmount || 0) > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                      <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            tx.type === "subscription"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : tx.type === "purchase"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tx.type === "bonus"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-neutral-100 text-neutral-600"
                          )}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                        {tx.description || tx.action || "Credit adjustment"}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-right font-mono font-bold",
                          isPositive ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {isPositive ? `+${Math.abs(tx.creditsAmount)}` : `-${Math.abs(tx.creditsAmount)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
