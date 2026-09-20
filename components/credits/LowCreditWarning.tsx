"use client";

import Link from "next/link";
import type { CreditBalance } from "@/types";

export function LowCreditWarning({ availableCredits }: Pick<CreditBalance, "availableCredits">) {
  if (availableCredits >= 20) return null;

  return (
    <div className="rounded-[12px] border-[0.5px] border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning-foreground">
      You have {availableCredits} credits left.{" "}
      <Link href="/credits" className="font-medium underline">
        Buy more
      </Link>{" "}
      before your next search.
    </div>
  );
}
