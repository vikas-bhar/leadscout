"use client";

import { Badge, Button } from "@/components/ui/design-system";
import { format } from "date-fns";

export interface SubscriptionCardProps {
  sub: {
    planName: string;
    status: string;
    monthlyCredits: number;
    price?: number;
    renewalDate?: string | Date | null;
    creditRollover?: number;
    cancelAtPeriodEnd?: boolean;
  };
  onManage?: () => void;
  onCancel?: () => void;
  onResubscribe?: () => void;
}

export function SubscriptionCard({
  sub,
  onManage,
  onCancel,
  onResubscribe,
}: SubscriptionCardProps) {
  const statusConfig: Record<string, { badge: string; color: "success" | "primary" | "danger" | "warning"; icon: string }> = {
    active: {
      badge: "Active",
      color: "success",
      icon: "✓",
    },
    trialing: {
      badge: "Trial",
      color: "primary",
      icon: "⚡",
    },
    past_due: {
      badge: "Payment failed",
      color: "danger",
      icon: "⚠️",
    },
    cancelled: {
      badge: "Cancelling",
      color: "warning",
      icon: "⏱",
    },
  };

  const config = statusConfig[sub.status] || statusConfig.active;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch {
      return String(date);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-xs">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              {sub.planName} plan
            </h3>
            <Badge variant={config.color}>
              {config.icon} {config.badge}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {sub.monthlyCredits?.toLocaleString()} credits per month
          </p>
        </div>
        {sub.price !== undefined && (
          <div className="text-right">
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">
              ${sub.price}
              <span className="text-xs font-normal text-gray-400">/mo</span>
            </p>
          </div>
        )}
      </div>

      {/* Renewal info */}
      {sub.status === "active" && sub.renewalDate && (
        <div className="bg-gray-50 dark:bg-neutral-800/60 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600 dark:text-neutral-300">
            Next billing date:{" "}
            <span className="font-semibold">{formatDate(sub.renewalDate)}</span>
          </p>
          {sub.creditRollover && sub.creditRollover > 0 ? (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Unused credits roll over (up to {sub.creditRollover})
            </p>
          ) : null}
        </div>
      )}

      {/* Cancelling notice */}
      {sub.cancelAtPeriodEnd && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Subscription cancels on{" "}
            <span className="font-semibold">{formatDate(sub.renewalDate)}</span>. You keep access until then.
          </p>
        </div>
      )}

      {/* Payment failed notice */}
      {sub.status === "past_due" && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">
            Payment failed. Update your payment method to keep your subscription.
          </p>
          <Button size="sm" variant="danger" onClick={onManage}>
            Update payment →
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onManage}>
          Manage subscription
        </Button>
        {!sub.cancelAtPeriodEnd && sub.status === "active" && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 font-medium cursor-pointer"
          >
            Cancel plan
          </button>
        )}
        {sub.cancelAtPeriodEnd && onResubscribe && (
          <Button variant="primary" size="sm" onClick={onResubscribe}>
            Keep subscription
          </Button>
        )}
      </div>
    </div>
  );
}
