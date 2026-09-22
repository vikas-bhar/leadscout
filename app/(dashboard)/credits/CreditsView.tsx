"use client";

import { useState, useEffect } from "react";
import { Coins, Check, History } from "lucide-react";
import { toast } from "sonner";
import { CREDIT_COSTS, type CreditBalance, type CreditTransaction } from "@/types";
import { estimateSearchesRemaining } from "@/lib/credit-calc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getLocalBalance, getLocalTransactions } from "@/lib/local-store";

interface CreditsViewProps {
  initialBalance: CreditBalance;
  initialTransactions: CreditTransaction[];
  userEmail?: string | null;
}

export function CreditsView({
  initialBalance,
  initialTransactions,
}: CreditsViewProps) {
  const [balance, setBalance] = useState<CreditBalance>(initialBalance);
  const [transactions, setTransactions] = useState<CreditTransaction[]>(initialTransactions);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

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

  async function handlePurchase(packageId: "starter" | "pro" | "agency") {
    setPurchasingId(packageId);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.info("Checkout session initiated.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Stripe checkout could not be started";
      toast.error(msg);
    } finally {
      setPurchasingId(null);
    }
  }

  const allPackages = [
    {
      id: "free",
      name: "Free starter",
      credits: 20,
      bonusCredits: 0,
      priceUsd: 0,
      popular: false,
      description: "Included automatically with every free account signup",
      features: [
        "20 Free credits included",
        "Google Maps & local search",
        "Digital gap analysis",
        "Personalized pitch generator",
      ],
      isFree: true,
    },
    {
      id: "starter" as const,
      name: "Starter pack",
      credits: 100,
      bonusCredits: 0,
      priceUsd: 9,
      popular: false,
      description: "Ideal for freelancers kicking off their client acquisition",
      features: [
        "100 Search credits",
        "~14 Complete business audits",
        "Google Maps + Instagram scrapers",
        "Outreach pitch generation",
        "Credits never expire",
      ],
      isFree: false,
    },
    {
      id: "pro" as const,
      name: "Pro pack",
      credits: 500,
      bonusCredits: 100,
      priceUsd: 29,
      popular: true,
      description: "Most popular for steady, weekly freelance client outreach",
      features: [
        "600 Total credits (100 Bonus)",
        "~85 Complete business audits",
        "Prioritized scraping & enrichment",
        "Full AI pitch angle customization",
        "CSV export included",
      ],
      isFree: false,
    },
    {
      id: "agency" as const,
      name: "Agency pack",
      credits: 2000,
      bonusCredits: 0,
      priceUsd: 99,
      popular: false,
      description: "High-volume discovery for agencies and power prospectors",
      features: [
        "2,000 Total credits",
        "~285 Complete business audits",
        "Batch search discovery",
        "Comprehensive lead dossiers",
        "Priority support",
      ],
      isFree: false,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Credits & Balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your search balance, purchase refill packages, and review past transactions.
        </p>
      </div>

      {/* Balance & Progress Bar Section */}
      <Card className="border border-neutral-200/80 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500">Available Balance</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-neutral-900">{available}</span>
                <span className="text-sm font-medium text-neutral-500">credits</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-3.5 py-2">
                <span className="text-xs text-neutral-500 block">Total allocated</span>
                <span className="font-medium text-neutral-800">{total} credits</span>
              </div>
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-3.5 py-2">
                <span className="text-xs text-neutral-500 block">Used so far</span>
                <span className="font-medium text-neutral-800">{used} credits</span>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-3.5 py-2">
                <span className="text-xs text-primary block font-medium">Estimated runway</span>
                <span className="font-medium text-primary">~{searchesRemaining} searches</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-neutral-500 font-medium">
              <span>Credit utilization</span>
              <span>{usagePercentage}% used</span>
            </div>
            <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(4, Math.min(100, 100 - usagePercentage))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Every new search typically costs 7 credits for 10 businesses with full Maps enrichment, Instagram analysis, and outreach pitches.
            </p>
          </div>
        </div>
      </Card>

      {/* Credit Packages */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-neutral-900">Purchase Credit Packages</h2>
          <p className="text-sm text-muted-foreground">
            Top up your balance instantly. Credits never expire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allPackages.map((pkg) => {
            const isPopular = pkg.popular;
            const totalCredits = pkg.credits + pkg.bonusCredits;

            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border bg-white p-5 flex flex-col justify-between transition-shadow duration-200",
                  isPopular
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "border-neutral-200/80 hover:shadow-sm"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-white uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900">{pkg.name}</h3>
                    {pkg.isFree ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        Current
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {pkg.bonusCredits > 0 ? `+${pkg.bonusCredits} Bonus` : ""}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">
                    {pkg.description}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-neutral-900">
                      ${pkg.priceUsd}
                    </span>
                    <span className="text-xs text-neutral-500">one-time</span>
                  </div>

                  <div className="mt-2 text-sm font-medium text-primary">
                    {totalCredits} credits
                  </div>

                  <div className="my-4 border-t border-neutral-100" />

                  <ul className="space-y-2.5 text-xs text-neutral-600">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  {pkg.isFree ? (
                    <Button
                      variant="outline"
                      className="w-full text-xs font-medium text-neutral-500 border-neutral-200 bg-neutral-50 cursor-default"
                      disabled
                    >
                      Included at Signup
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? "default" : "outline"}
                      className={cn("w-full text-xs font-medium", isPopular ? "shadow-sm" : "")}
                      disabled={purchasingId === pkg.id}
                      onClick={() => handlePurchase(pkg.id as "starter" | "pro" | "agency")}
                    >
                      {purchasingId === pkg.id ? "Redirecting..." : `Buy for $${pkg.priceUsd}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit Cost Breakdown */}
      <Card className="border border-neutral-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Credit Cost Breakdown
          </CardTitle>
          <CardDescription>
            Transparent, predictable credit consumption based on data sources and AI processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-800">Google Maps Scraping</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0 whitespace-nowrap">
                  {CREDIT_COSTS.mapsPerTenResults} credits
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Per batch of 10 business listings</p>
            </div>

            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-800">Instagram Profile Scrape</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0 whitespace-nowrap">
                  {CREDIT_COSTS.instagramPerTenProfiles} credits
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Per 10 matched social profiles</p>
            </div>

            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-800">AI Gap Analysis</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0 whitespace-nowrap">
                  5 credits (10x)
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Per 10 analyzed opportunities (0.5 credit each)</p>
            </div>

            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-800">AI Pitch Generation</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0 whitespace-nowrap">
                  5 credits (10x)
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Per 10 tailored pitch bundles (0.5 credit each)</p>
            </div>

            <div className="p-3.5 rounded-lg border border-neutral-100 bg-neutral-50/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-neutral-800">CSV Export</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-700 shrink-0 whitespace-nowrap">
                  {CREDIT_COSTS.csvExport} credits
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Download full lead dossiers</p>
            </div>

            <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-900">Gap Analyzer (Direct URL)</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary text-white shrink-0 whitespace-nowrap">
                  5 credits
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-600">Audit single Instagram, Website, Maps or FB link + custom pitch</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border border-neutral-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <History className="h-4 w-4 text-neutral-700" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Recent credit grants, purchases, and search expenditures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-neutral-500">
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Type</th>
                    <th className="pb-2.5 font-medium">Description</th>
                    <th className="pb-2.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transactions.map((tx) => {
                    const raw = tx as unknown as Record<string, unknown>;
                    const rawAmount = typeof tx.creditsAmount === "number" ? tx.creditsAmount : Number(raw.credits_amount ?? 0);
                    const isPositive = rawAmount > 0;
                    const dateVal = tx.createdAt || (raw.created_at as string | undefined);
                    const formattedDate = dateVal
                      ? new Date(dateVal).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent";

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 text-neutral-600 whitespace-nowrap">{formattedDate}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                              tx.type === "bonus"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : tx.type === "purchase"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : tx.type === "usage"
                                ? "bg-neutral-100 text-neutral-700"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            )}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-800 font-medium max-w-xs truncate">
                          {tx.description || tx.action || "Credit adjustment"}
                        </td>
                        <td
                          className={cn(
                            "py-3 text-right font-semibold whitespace-nowrap",
                            isPositive ? "text-emerald-600" : "text-neutral-700"
                          )}
                        >
                          {isPositive ? `+${rawAmount}` : rawAmount} credits
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
