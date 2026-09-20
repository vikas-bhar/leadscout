"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CreditBalance as CreditBalanceType } from "@/types";

export function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/credits/balance");
        if (!response.ok) return;
        const data = (await response.json()) as CreditBalanceType;
        if (!cancelled) setBalance(data);
      } catch (error) {
        console.log("CreditBalance fetch error", error);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const available = balance?.availableCredits ?? null;

  return (
    <Link
      href="/credits"
      className="flex items-center rounded-full border border-[#e5e7eb] bg-gray-50 px-3 py-1 text-xs font-medium text-foreground hover:bg-gray-100"
    >
      {available === null ? "Credits …" : `${available} credits`}
    </Link>
  );
}
