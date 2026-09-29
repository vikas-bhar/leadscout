import { Navbar } from "@/components/ui/Navbar";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { BottomNav } from "@/components/dashboard/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col pb-16 md:pb-0">
      <SubscriptionBanner />
      <Navbar />
      <main className="mx-auto max-w-6xl w-full px-4 py-6 flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
