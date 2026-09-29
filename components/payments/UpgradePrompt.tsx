"use client";

import { useRouter } from "next/navigation";
import { Button, Modal } from "@/components/ui/design-system";
import { cn } from "@/lib/utils";

// Inline upgrade prompt (inside feature)
export function InlineUpgradePrompt({
  feature,
  requiredPlan,
  description,
}: {
  feature: string;
  requiredPlan: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <div className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-2xl p-6 text-center bg-blue-50/50 dark:bg-blue-950/20">
      <div className="text-3xl mb-2">🔒</div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-base">{feature}</h3>
      <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4 max-w-md mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button size="sm" onClick={() => router.push("/credits")}>
          Upgrade to {requiredPlan} →
        </Button>
        <Button variant="ghost" size="sm" onClick={() => router.push("/credits")}>
          See all plans
        </Button>
      </div>
    </div>
  );
}

// Low credits banner
export function LowCreditsBanner({
  creditsLeft,
  onBuyClick,
}: {
  creditsLeft: number;
  onBuyClick: () => void;
}) {
  if (creditsLeft > 20) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs shadow-xs",
        creditsLeft === 0
          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{creditsLeft === 0 ? "🚫" : "⚠️"}</span>
        <span className="font-medium">
          {creditsLeft === 0
            ? "No credits left — buy more to search"
            : `${creditsLeft} credits left — about ${Math.floor(creditsLeft / 50)} search left`}
        </span>
      </div>
      <button onClick={onBuyClick} className="font-bold underline ml-4 flex-shrink-0 cursor-pointer">
        Buy credits →
      </button>
    </div>
  );
}

// Out of credits modal
export function OutOfCreditsModal({
  open,
  onClose,
  creditsNeeded,
}: {
  open: boolean;
  onClose: () => void;
  creditsNeeded: number;
}) {
  const router = useRouter();

  return (
    <Modal open={open} onClose={onClose} title="Not enough credits">
      <div className="space-y-4">
        <div className="text-center py-3">
          <div className="text-4xl mb-2">💎</div>
          <p className="text-gray-700 dark:text-neutral-300 text-sm">
            This action needs <span className="font-bold text-gray-900 dark:text-white">{creditsNeeded} credits</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">Get more credits to continue searching and pitching</p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => {
              onClose();
              router.push("/credits");
            }}
            className="w-full flex items-center justify-between bg-blue-600 text-white rounded-xl p-4 hover:bg-blue-700 transition-colors cursor-pointer text-left"
          >
            <div>
              <p className="font-bold text-sm">Starter Pack</p>
              <p className="text-blue-200 text-xs">100 credits (never expire)</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-base">$9</p>
              <p className="text-blue-200 text-[10px]">one-time</p>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              router.push("/credits");
            }}
            className="w-full flex items-center justify-between border border-gray-200 dark:border-neutral-700 rounded-xl p-4 hover:border-blue-400 transition-colors cursor-pointer text-left"
          >
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">Freelancer Plan</p>
              <p className="text-gray-500 text-xs">300 credits/month + all features</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-base text-gray-900 dark:text-white">$19</p>
              <p className="text-gray-400 text-[10px]">per month</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white py-1 cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
