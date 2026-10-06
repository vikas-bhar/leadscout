"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LowCreditWarning } from "@/components/credits/LowCreditWarning";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { estimateSearchesRemaining } from "@/lib/credit-calc";
import { getLocalBalance, getLocalLeads, getLocalSearches } from "@/lib/local-store";

interface DashboardClientProps {
  name?: string;
  initialAvailableCredits: number;
  initialLeadCount: number;
  initialSearchCount: number;
}

export function DashboardClient({
  initialAvailableCredits,
  initialLeadCount,
  initialSearchCount,
}: DashboardClientProps) {
  const [availableCredits, setAvailableCredits] = useState(initialAvailableCredits);
  const [leadCount, setLeadCount] = useState(initialLeadCount);
  const [searchCount, setSearchCount] = useState(initialSearchCount);

  useEffect(() => {
    function syncStats() {
      const bal = getLocalBalance();
      const localLeads = getLocalLeads();
      const localSearches = getLocalSearches();

      if (bal && typeof bal.availableCredits === "number") {
        setAvailableCredits(bal.availableCredits);
      }
      if (localLeads && localLeads.length > 0) {
        setLeadCount(Math.max(initialLeadCount, localLeads.length));
      }
      if (localSearches && localSearches.length > 0) {
        setSearchCount(Math.max(initialSearchCount, localSearches.length));
      }
    }

    syncStats();

    window.addEventListener("freelancefind_store_updated", syncStats);
    window.addEventListener("storage", syncStats);

    return () => {
      window.removeEventListener("freelancefind_store_updated", syncStats);
      window.removeEventListener("storage", syncStats);
    };
  }, [initialLeadCount, initialSearchCount]);

  return (
    <div className="space-y-6">
      <LowCreditWarning availableCredits={availableCredits} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Available credits</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-neutral-900">{availableCredits}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Searches remaining</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-neutral-900">{estimateSearchesRemaining(availableCredits)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Leads found</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-neutral-900">{leadCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground font-medium">Past searches</p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-neutral-900">{searchCount}</p>
        </Card>
      </div>

      {/* Recharts Leads Summary Chart */}
      <LeadsChart />
    </div>
  );
}
