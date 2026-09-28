"use client";

import { useState } from "react";
import { Lock, CreditCard, ShieldCheck, Loader2, X, CheckCircle2 } from "lucide-react";
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
  onSuccess,
}: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [cardholder, setCardholder] = useState("Alex Morgan");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Call secure payment processing endpoint or server action
      const res = await fetch("/api/credits/checkout-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: isSubscription ? "subscription" : "credits",
          id: planOrPackageId,
          credits: creditsAwarded,
          amount: amountUsd,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment processing failed");
      }

      setIsSuccess(true);
      toast.success(`Payment of $${amountUsd.toFixed(2)} successful! ${creditsAwarded} credits added.`);
      setTimeout(() => {
        setIsSuccess(false);
        setIsProcessing(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error occurred";
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
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Secure Checkout</h2>
              <p className="text-[11px] text-neutral-500">256-bit Bank Grade SSL Encryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Payment Successful!</h3>
            <p className="text-xs text-neutral-500">
              Your payment of <strong className="text-neutral-900 dark:text-white">${amountUsd.toFixed(2)}</strong> was processed successfully. {creditsAwarded} credits have been credited to your wallet.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="p-6 space-y-5">
            {/* Order Summary */}
            <Card className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{title}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {creditsAwarded} Credits {isSubscription ? "Monthly Subscription" : "One-Time Pack"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-primary">${amountUsd.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Instant Access</div>
              </div>
            </Card>

            {/* Card Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Cardholder Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardholder}
                  onChange={(e) => setCardholder(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Full name on card"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Card Number</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="4242 4242 4242 4242"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="MM/YY"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <span>CVC / CVV</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full h-11 font-bold text-sm gap-2 shadow-md bg-primary text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pay ${amountUsd.toFixed(2)} & Get {creditsAwarded} Credits</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted & Secured by Stripe Payments</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
