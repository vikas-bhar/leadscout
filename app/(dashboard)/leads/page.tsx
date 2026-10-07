import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { deduplicateLeads } from "@/lib/deduplication";
import { LeadsView } from "./LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getAuthenticatedUser();
  let cleanLeads = [];

  if (user) {
    try {
      const supabase = createSupabaseServerClient();
      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("opportunity_score", { ascending: false });

      if (error) {
        console.log("Error loading leads in LeadsPage:", error);
      }
      if (leads && leads.length > 0) {
        cleanLeads = deduplicateLeads(leads);
      }
    } catch (err) {
      console.log("Leads fetch error:", err);
    }
  }

  return <LeadsView initialLeads={cleanLeads} />;
}
