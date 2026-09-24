"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, LogOut, Terminal } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/analyze", label: "Analyze" },
  { href: "/leads", label: "Leads" },
  { href: "/history", label: "History" },
  { href: "/credits", label: "Credits" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("signOut error", error);
      toast.error("Could not sign out");
      setSigningOut(false);
      return;
    }
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  // Hidden admin hotkey: Ctrl+Shift+D or Cmd+Shift+D
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        router.push("/admin/diagnostics");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Compass className="h-4 w-4" />
          </span>
          FreelanceFind
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  active ? "bg-gray-100 text-foreground" : "text-muted-foreground hover:bg-gray-50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Scraper Diagnostic Tool button */}
          <Link
            href="/admin/diagnostics"
            title="Scraper Diagnostics (Ctrl+Shift+D)"
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors",
              pathname === "/admin/diagnostics" && "bg-neutral-900 text-emerald-400 hover:bg-neutral-900 hover:text-emerald-400"
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
          </Link>

          <CreditBalance />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:bg-gray-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-[#e5e7eb] px-4 py-2 md:hidden">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                active ? "bg-gray-100 text-foreground" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

