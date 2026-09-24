import { redirect } from "next/navigation";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { SearchView } from "./SearchView";
import type { FreelancerType } from "@/types";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  const [balance, { data: profile }] = await Promise.all([
    getCreditBalance(user.id, supabase),
    supabase.from("users").select("freelancer_type").eq("id", user.id).maybeSingle(),
  ]);

  const available = balance?.availableCredits ?? 100;
  const freelancerType = (profile?.freelancer_type as FreelancerType) || "web_designer";

  return (
    <SearchView
      initialAvailableCredits={available}
      initialFreelancerType={freelancerType}
    />
  );
}
