"use client";

import Link from "next/link";
import { useRealtimeCredits } from "@/lib/hooks/useRealtimeCredits";

export function CreditBalance() {
  const { availableCredits, isConnected } = useRealtimeCredits();

  return (
    <Link
      href="/credits"
      className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-foreground hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      title={isConnected ? "Realtime connected to Supabase user_credits" : "Supabase credit balance"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
      <span>{availableCredits} credits</span>
    </Link>
  );
}
