"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { updateLocalBalance, getLocalBalance } from "@/lib/local-store";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { CreditBalance } from "@/types";

export function useRealtimeCredits() {
  const { user } = useAuthUser();
  const [balance, setBalance] = useState<CreditBalance>(() => {
    return (
      getLocalBalance() || {
        totalCredits: 20,
        usedCredits: 0,
        availableCredits: 20,
      }
    );
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchLatestBalance() {
      try {
        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json();
          // If in guest mode, do not overwrite modified local balance
          if (data.isGuest) {
            const currentLocal = getLocalBalance();
            if (currentLocal && typeof currentLocal.availableCredits === "number") {
              setBalance(currentLocal);
              return;
            }
          }
          if (active && typeof data.availableCredits === "number") {
            const fresh: CreditBalance = {
              totalCredits: data.totalCredits ?? 20,
              usedCredits: data.usedCredits ?? 0,
              availableCredits: data.availableCredits ?? 20,
            };
            setBalance(fresh);
            updateLocalBalance(fresh);
          }
        }
      } catch (err) {
        console.log("Realtime credit balance fetch notice:", err);
      }
    }

    void fetchLatestBalance();

    const supabase = createSupabaseBrowserClient();
    const userId = user?.id || "usr_demo_freelancer";

    // Subscribe to Supabase Realtime postgres_changes on 'user_credits' table
    const channel = supabase
      .channel(`realtime-credits-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return;
          const newRecord = payload.new as {
            total_credits?: number;
            used_credits?: number;
            available_credits?: number;
          };

          if (newRecord && typeof newRecord.available_credits === "number") {
            const fresh: CreditBalance = {
              totalCredits: newRecord.total_credits ?? 20,
              usedCredits: newRecord.used_credits ?? 0,
              availableCredits: newRecord.available_credits ?? 20,
            };
            setBalance(fresh);
            updateLocalBalance(fresh);
          }
        }
      )
      .subscribe((status) => {
        if (active) {
          setIsConnected(status === "SUBSCRIBED");
        }
      });

    function handleLocalSync() {
      const currentLocal = getLocalBalance();
      if (currentLocal && active) {
        setBalance(currentLocal);
      }
    }

    window.addEventListener("freelancefind_store_updated", handleLocalSync);
    window.addEventListener("storage", handleLocalSync);

    return () => {
      active = false;
      window.removeEventListener("freelancefind_store_updated", handleLocalSync);
      window.removeEventListener("storage", handleLocalSync);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    balance,
    availableCredits: balance.availableCredits ?? 20,
    usedCredits: balance.usedCredits ?? 0,
    totalCredits: balance.totalCredits ?? 20,
    isConnected,
  };
}
