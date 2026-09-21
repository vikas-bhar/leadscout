import { redirect } from "next/navigation";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { LeadsView } from "./LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .order("opportunity_score", { ascending: false });

  if (error) {
    console.log("Error loading leads in LeadsPage:", error);
  }

  return <LeadsView initialLeads={leads || []} />;
}
