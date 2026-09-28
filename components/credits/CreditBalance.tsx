"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CreditBalance as CreditBalanceType } from "@/types";
import { getLocalBalance } from "@/lib/local-store";

export function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);

  useEffect(() => {
    let cancelled = false;

    function syncBalance() {
      const local = getLocalBalance();
      if (local && !cancelled) {
        setBalance(local);
      }
    }

    // Initial sync from local storage
    syncBalance();

    async function load() {
      try {
        const response = await fetch("/api/credits/balance");
        if (!response.ok) return;
        const data = (await response.json()) as CreditBalanceType;
        if (!cancelled && typeof data.availableCredits === "number") {
          // If server returns fresh data that is not 20 when local is 20, or matches
          setBalance(data);
        }
      } catch (error) {
        console.log("CreditBalance fetch error", error);
      }
    }

    void load();

    // Listen for storage changes across actions
    window.addEventListener("freelancefind_store_updated", syncBalance);
    window.addEventListener("storage", syncBalance);

    return () => {
      cancelled = true;
      window.removeEventListener("freelancefind_store_updated", syncBalance);
      window.removeEventListener("storage", syncBalance);
    };
  }, []);

  const available = balance?.availableCredits ?? 20;

  return (
    <Link
      href="/credits"
      className="flex items-center rounded-full border border-[#e5e7eb] bg-gray-50 px-3 py-1 text-xs font-medium text-foreground hover:bg-gray-100"
    >
      {available} credits
    </Link>
  );
}
