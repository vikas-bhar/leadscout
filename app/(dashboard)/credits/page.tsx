import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { getCreditBalance } from "@/lib/credits";
import { CreditsView } from "./CreditsView";
import type { CreditTransaction } from "@/types";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const user = await getAuthenticatedUser();
  let balance = {
    totalCredits: 20,
    usedCredits: 0,
    availableCredits: 20,
  };
  let transactions: CreditTransaction[] = [];

  if (user) {
    try {
      const supabase = createSupabaseServerClient();
      const bal = await getCreditBalance(user.id, supabase);
      if (bal) balance = bal;

      const { data: txs } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (txs && txs.length > 0) {
        transactions = txs as unknown as CreditTransaction[];
      }
    } catch {
      // fallback
    }
  }

  const fallbackTransactions = transactions.length > 0
    ? transactions
    : [
        {
          id: "signup-starter-tx",
          userId: user?.id || "guest",
          type: "bonus" as const,
          creditsAmount: 20,
          action: "signup",
          description: "Free starter credits",
          createdAt: new Date().toISOString(),
        } as CreditTransaction,
      ];

  return (
    <CreditsView
      initialBalance={balance}
      initialTransactions={fallbackTransactions}
      userEmail={user?.email || "guest@leadscout.io"}
    />
  );
}
