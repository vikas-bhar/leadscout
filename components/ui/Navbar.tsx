"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LogOut,
  Terminal,
  Settings,
  ChevronDown,
  Sparkles,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { AppLogo } from "@/components/ui/AppLogo";
import {
  getActiveUser,
  getAllAccounts,
  switchActiveAccount,
  logoutUser,
  type UserAccount,
} from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/prompts", label: "Prompts & Filters" },
  { href: "/analyze", label: "Analyze" },
  { href: "/leads", label: "Leads" },
  { href: "/history", label: "History" },
  { href: "/credits", label: "Credits & Plans" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncUser() {
      setCurrentUser(getActiveUser());
      setAccounts(getAllAccounts());
    }
    syncUser();

    window.addEventListener("freelancefind_user_updated", syncUser);
    window.addEventListener("freelancefind_accounts_updated", syncUser);

    return () => {
      window.removeEventListener("freelancefind_user_updated", syncUser);
      window.removeEventListener("freelancefind_accounts_updated", syncUser);
    };
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setIsMenuOpen(false);
    await logoutUser();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  function handleSwitch(accId: string) {
    const acc = switchActiveAccount(accId);
    if (acc) {
      toast.success(`Switched account to ${acc.fullName}`);
      setIsMenuOpen(false);
    }
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
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <AppLogo href="/" size="sm" />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-neutral-100 text-neutral-900 font-bold"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
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

          <NotificationCenter />

          {/* Account Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 p-1 sm:px-2 rounded-lg hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200 text-xs"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs overflow-hidden border border-primary/20 shrink-0">
                {currentUser?.avatarUrl ? (
                  <Image src={currentUser.avatarUrl} alt={currentUser.fullName} width={28} height={28} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser?.fullName?.charAt(0) || "U"
                )}
              </div>
              <span className="hidden sm:inline-block font-semibold text-neutral-800 max-w-[90px] truncate">
                {currentUser?.fullName?.split(" ")[0] || "Account"}
              </span>
              <ChevronDown className="h-3 w-3 text-neutral-400 hidden sm:inline" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white shadow-lg p-2 z-50 animate-in fade-in-50 text-xs space-y-2">
                {/* Active user header */}
                <div className="px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-100">
                  <p className="font-bold text-neutral-900 truncate">{currentUser?.fullName || "User"}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{currentUser?.email}</p>
                  <p className="text-[10px] text-primary font-semibold mt-0.5 truncate">
                    {currentUser?.agencyName || "Freelance Prospector"}
                  </p>
                </div>

                {/* Account Switcher Section */}
                {accounts.length > 1 && (
                  <div className="space-y-1">
                    <p className="px-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Switch Profile
                    </p>
                    {accounts.map((acc) => {
                      const isCurrent = acc.id === currentUser?.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSwitch(acc.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors",
                            isCurrent
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-neutral-700 hover:bg-neutral-50"
                          )}
                        >
                          <div className="truncate min-w-0 pr-1">
                            <p className="truncate font-semibold">{acc.fullName}</p>
                            <p className="text-[10px] text-neutral-400 truncate">{acc.agencyName || acc.email}</p>
                          </div>
                          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="pt-1 border-t border-neutral-100 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium"
                  >
                    <Settings className="h-3.5 w-3.5 text-neutral-400" />
                    Account & Settings
                  </Link>
                  <Link
                    href="/credits"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Manage Credits & Wallet
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium"
                  >
                    <LogIn className="h-3.5 w-3.5 text-blue-600" />
                    Sign in to another account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-medium text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
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
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold",
                active ? "bg-neutral-100 text-neutral-900 font-bold" : "text-neutral-600"
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
