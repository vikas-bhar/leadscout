import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { SearchView } from "./SearchView";
import type { FreelancerType } from "@/types";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getAuthenticatedUser();
  let available = 20;
  let freelancerType: FreelancerType = "web_designer";

  if (user) {
    try {
      const supabase = createSupabaseServerClient();
      const [balance, { data: profile }] = await Promise.all([
        getCreditBalance(user.id, supabase),
        supabase.from("users").select("freelancer_type").eq("id", user.id).maybeSingle(),
      ]);
      if (balance?.availableCredits !== undefined) available = balance.availableCredits;
      if (profile?.freelancer_type) freelancerType = profile.freelancer_type as FreelancerType;
    } catch {
      // fallback to defaults
    }
  }

  return (
    <SearchView
      initialAvailableCredits={available}
      initialFreelancerType={freelancerType}
    />
  );
}
