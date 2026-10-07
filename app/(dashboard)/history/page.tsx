import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { HistoryView } from "./HistoryView";
import type { StoredSearch } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getAuthenticatedUser();
  let list: StoredSearch[] = [];

  if (user) {
    try {
      const supabase = createSupabaseServerClient();
      const { data: searches, error } = await supabase
        .from("searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && searches) {
        list = searches as unknown as StoredSearch[];
      }
    } catch (error) {
      console.log("Error loading search history:", error);
    }
  }

  return <HistoryView initialSearches={list} />;
}
