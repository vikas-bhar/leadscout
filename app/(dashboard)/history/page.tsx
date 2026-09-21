import Link from "next/link";
import { redirect } from "next/navigation";
import { History, Search, ArrowRight, Clock } from "lucide-react";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SearchRecord {
  id: string;
  business_type: string;
  location: string;
  results_count?: number;
  credits_used?: number;
  created_at?: string;
}

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: searches, error } = await supabase
    .from("searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Error loading search history:", error);
  }

  const list: SearchRecord[] = (searches as unknown as SearchRecord[]) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Search History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review past discovery runs, targets, and credit usage.
          </p>
        </div>
        <Link href="/search">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card className="border border-neutral-200/80 shadow-sm p-12 text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">No past searches yet</h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Once you run a prospect search, each run and its discovered businesses will appear here.
            </p>
          </div>
          <div>
            <Link href="/search">
              <Button size="sm" className="gap-1.5 font-medium">
                <Search className="h-3.5 w-3.5" />
                Run First Search
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((item) => {
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <Card
                key={item.id}
                className="border border-neutral-200/80 hover:border-neutral-300 transition-colors p-4 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-neutral-900">
                        {item.business_type} in {item.location}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {dateStr}
                      </span>
                      <span>
                        Found: <strong>{item.results_count || 10} leads</strong>
                      </span>
                      <span>
                        Credits used: <strong>{item.credits_used || 7}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <Link href="/leads">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        View Leads
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
