import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { DashboardClient } from "../DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const supabase = createSupabaseServerClient();
  let balance = null;
  let leadCount = 0;
  let searchCount = 0;
  let fullName: string | null = null;

  if (user) {
    try {
      balance = await getCreditBalance(user.id, supabase);
      const [{ data: profile }, { count: lc }, { count: sc }] = await Promise.all([
        supabase.from("users").select("full_name, freelancer_type").eq("id", user.id).maybeSingle(),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      fullName = profile?.full_name || null;
      leadCount = lc ?? 0;
      searchCount = sc ?? 0;
    } catch (error) {
      console.log("dashboard query error", error);
    }
  }

  const available = balance?.availableCredits ?? 20;
  const name = fullName || user?.email?.split("@")[0] || "Freelancer";

  return (
    <DashboardClient
      name={name}
      initialAvailableCredits={available}
      initialLeadCount={leadCount}
      initialSearchCount={searchCount}
    />
  );
}
