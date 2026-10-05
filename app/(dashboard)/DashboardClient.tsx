"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, History, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LowCreditWarning } from "@/components/credits/LowCreditWarning";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { estimateSearchesRemaining } from "@/lib/credit-calc";
import { getLocalBalance, getLocalLeads, getLocalSearches } from "@/lib/local-store";

interface DashboardClientProps {
  name: string;
  initialAvailableCredits: number;
  initialLeadCount: number;
  initialSearchCount: number;
}

export function DashboardClient({
  name,
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
      <div>
        <h1 className="text-2xl font-medium">Welcome back, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search Google Maps and Instagram, score digital gaps, and copy outreach pitches.
        </p>
      </div>

      <LowCreditWarning availableCredits={availableCredits} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[12px] text-muted-foreground">Available credits</p>
          <p className="mt-2 text-2xl font-medium">{availableCredits}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Searches remaining</p>
          <p className="mt-2 text-2xl font-medium">{estimateSearchesRemaining(availableCredits)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Leads found</p>
          <p className="mt-2 text-2xl font-medium">{leadCount}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Past searches</p>
          <p className="mt-2 text-2xl font-medium">{searchCount}</p>
        </Card>
      </div>

      {/* Recharts Leads Summary Chart */}
      <LeadsChart />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/search" className="ff-card flex items-center gap-3 hover:bg-gray-50">
          <Search className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">New search</p>
            <p className="text-sm text-muted-foreground">Find businesses with gaps</p>
          </div>
        </Link>
        <Link href="/leads" className="ff-card flex items-center gap-3 hover:bg-gray-50">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">View leads</p>
            <p className="text-sm text-muted-foreground">Ranked by opportunity</p>
          </div>
        </Link>
        <Link href="/history" className="ff-card flex items-center gap-3 hover:bg-gray-50">
          <History className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">Search history</p>
            <p className="text-sm text-muted-foreground">Replay past runs</p>
          </div>
        </Link>
        <Link href="/credits" className="ff-card flex items-center gap-3 hover:bg-gray-50">
          <Coins className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium">Buy credits</p>
            <p className="text-sm text-muted-foreground">Starter, Pro, Agency</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
