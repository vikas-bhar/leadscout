"use client";

import { Check } from "lucide-react";
import { Modal, Button } from "@/components/ui/design-system";

export interface PaymentConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  type: "credits" | "subscription";
  item: {
    name: string;
    credits: number;
    price: number;
    billing?: "monthly" | "annual";
    features?: string[];
  };
}

export function PaymentConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  type,
  item,
}: PaymentConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type === "credits" ? "Confirm purchase" : "Start subscription"}
    >
      <div className="space-y-4">
        {/* What they're getting */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-0.5">
                {item.credits.toLocaleString()} credits
                {type === "subscription" ? "/month" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">${item.price}</p>
              {type === "subscription" && (
                <p className="text-[11px] text-gray-500">
                  per {item.billing === "annual" ? "year" : "month"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        {item.features && item.features.length > 0 && (
          <ul className="space-y-2">
            {item.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-neutral-300">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Trial notice */}
        {type === "subscription" && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              ✓ 7-day free trial included. Cancel anytime before trial ends.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="text-xs text-gray-400 space-y-1">
          {type === "credits" ? (
            <>
              <p>• You will be redirected to secure checkout</p>
              <p>• Credits added instantly after payment</p>
              <p>• Credits never expire</p>
            </>
          ) : (
            <>
              <p>• 7-day free trial starts today</p>
              <p>• First charge on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              <p>• Cancel anytime in Settings</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" loading={loading} onClick={onConfirm}>
            {type === "credits" ? `Pay $${item.price} →` : "Start free trial →"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
