import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Users, History, Coins } from "lucide-react";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance, estimateSearchesRemaining } from "@/lib/credits";
import { Card } from "@/components/ui/card";
import { LowCreditWarning } from "@/components/credits/LowCreditWarning";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  let balance = null;
  try {
    balance = await getCreditBalance(user.id, supabase);
  } catch (error) {
    console.log("dashboard credit balance error", error);
  }

  const [{ data: profile }, { count: leadCount }, { count: searchCount }] = await Promise.all([
    supabase.from("users").select("full_name, freelancer_type").eq("id", user.id).maybeSingle(),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const available = balance?.availableCredits ?? 0;
  const name = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Welcome back, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search Google Maps and Instagram, score digital gaps, and copy outreach pitches.
        </p>
      </div>

      <LowCreditWarning availableCredits={available} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[12px] text-muted-foreground">Available credits</p>
          <p className="mt-2 text-2xl font-medium">{available}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Searches remaining</p>
          <p className="mt-2 text-2xl font-medium">{estimateSearchesRemaining(available)}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Leads found</p>
          <p className="mt-2 text-2xl font-medium">{leadCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-muted-foreground">Past searches</p>
          <p className="mt-2 text-2xl font-medium">{searchCount ?? 0}</p>
        </Card>
      </div>

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
