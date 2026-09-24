import { redirect } from "next/navigation";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { AnalyzeView } from "./AnalyzeView";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const balance = await getCreditBalance(user.id, supabase);

  return <AnalyzeView initialAvailableCredits={balance?.availableCredits ?? 100} />;
}
