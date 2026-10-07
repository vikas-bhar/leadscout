import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { AnalyzeView } from "./AnalyzeView";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const user = await getAuthenticatedUser();
  let available = 20;

  if (user) {
    try {
      const supabase = createSupabaseServerClient();
      const balance = await getCreditBalance(user.id, supabase);
      if (balance?.availableCredits !== undefined) {
        available = balance.availableCredits;
      }
    } catch {
      // fallback to default
    }
  }

  return <AnalyzeView initialAvailableCredits={available} />;
}
