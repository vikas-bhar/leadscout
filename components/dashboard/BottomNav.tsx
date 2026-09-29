"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Users, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/credits", label: "Credits", icon: Coins },
  { href: "/settings", label: "Profile", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth/onboarding pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/onboarding") || pathname.startsWith("/payment/")) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1 flex items-center justify-around shadow-lg">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-bold transition-all",
              isActive
                ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "stroke-[2.5]" : "stroke-2")} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
