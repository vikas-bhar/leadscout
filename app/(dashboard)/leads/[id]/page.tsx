import { redirect } from "next/navigation";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { LeadDetailView } from "./LeadDetailView";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: { id: string };
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  let lead = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      lead = data;
    }
  } catch (err) {
    console.log("Supabase error fetching lead:", err);
  }

  // If not found in Supabase or Supabase is not connected, pass placeholder with id to client component
  // which will resolve it from local-store
  return <LeadDetailView initialLead={lead || { id: params.id }} />;
}
