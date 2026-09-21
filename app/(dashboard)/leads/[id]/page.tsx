import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { LeadDetailView } from "./LeadDetailView";

export const dynamic = "force-dynamic";

interface LeadDetailPageProps {
  params: { id: string };
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !lead) {
    notFound();
  }

  // Auto-mark new leads as viewed
  if (lead.status === "new") {
    await supabase.from("leads").update({ status: "viewed" }).eq("id", lead.id);
  }

  return <LeadDetailView initialLead={lead} />;
}
