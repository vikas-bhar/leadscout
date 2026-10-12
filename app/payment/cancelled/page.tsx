"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/design-system";

export default function PaymentCancelledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="text-5xl mb-2">👋</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Checkout Cancelled
        </h1>
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          Your payment was cancelled. Nothing was charged to your card.
        </p>

        <div className="space-y-2 pt-2">
          <Button
            className="w-full"
            onClick={() => router.push("/credits")}
          >
            View all plans & packs →
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/search")}
          >
            Back to search
          </Button>
        </div>

        <p className="text-[11px] text-gray-400 pt-2">
          Questions or need help? Contact{" "}
          <a
            href="mailto:support@leadscout.app"
            className="text-blue-600 hover:underline font-medium"
          >
            support@leadscout.app
          </a>
        </p>
      </div>
    </div>
  );
}
