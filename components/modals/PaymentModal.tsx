"use client";

import { useState } from "react";
import { Lock, ShieldCheck, Loader2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  amountUsd: number;
  creditsAwarded: number;
  planOrPackageId: string;
  isSubscription: boolean;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  title,
  amountUsd,
  creditsAwarded,
  planOrPackageId,
  isSubscription,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  async function handleRedirectToStripe(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let endpoint = "";
      let payload = {};

      if (isSubscription) {
        endpoint = "/api/subscriptions/create";
        payload = { planId: planOrPackageId, interval: "month" };
      } else {
        endpoint = "/api/credits/purchase";
        payload = {
          packageId: planOrPackageId,
          customCredits: planOrPackageId === "flexible" ? creditsAwarded : undefined,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to initiate Stripe checkout");
      }

      const checkoutUrl = data.url || data.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Stripe checkout URL not returned");
      }

      // Redirect to real Stripe Hosted Checkout page
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment redirect failed";
      toast.error(msg);
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Stripe Checkout</h2>
              <p className="text-[11px] text-neutral-500">Redirecting to secure payment gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRedirectToStripe} className="p-6 space-y-5">
          {/* Order Summary */}
          <Card className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white">{title}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {creditsAwarded.toLocaleString()} Credits {isSubscription ? "Monthly Subscription" : "One-Time Pack"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-primary">${amountUsd.toFixed(2)}</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Secure SSL</div>
            </div>
          </Card>

          <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
            <p className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">1</span>
              <span>You will be securely redirected to Stripe&apos;s official payment page.</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">2</span>
              <span>Enter your credit card details safely on Stripe&apos;s encrypted gateway.</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">3</span>
              <span>Credits are instantly added to your account upon successful payment.</span>
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full h-11 font-bold text-sm gap-2 shadow-md bg-primary text-white flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Stripe Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured & Processed by Stripe</span>
          </div>
        </form>
      </div>
    </div>
  );
}
