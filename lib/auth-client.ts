"use client";

import { getLocalBalance, setLocalBalance } from "./local-store";

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  agencyName?: string;
  avatarUrl?: string;
  freelancerType?: string;
  skills?: string[];
  portfolioUrl?: string;
  phone?: string;
  bio?: string;
  role: "freelancer" | "agency" | "admin";
  createdAt: string;
  lastLoginAt: string;
}

const ACCOUNTS_STORAGE_KEY = "freelancefind_accounts_v1";
const ACTIVE_USER_ID_KEY = "freelancefind_active_user_id_v1";

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: "usr_demo_freelancer",
    email: "pro@freelancefind.io",
    fullName: "Alex Rivera",
    agencyName: "Rivera Digital & Web Design",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    freelancerType: "web_designer",
    skills: ["Web Design", "Framer", "Conversion Rate Optimization", "Instagram Audits"],
    portfolioUrl: "https://alexrivera.design",
    phone: "+1 (555) 349-2041",
    bio: "Freelance web designer and conversion strategist helping local service businesses 3x their appointments.",
    role: "freelancer",
    createdAt: "2026-01-10T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: "usr_demo_agency",
    email: "agency@growthscale.co",
    fullName: "Elena Vance",
    agencyName: "Vance Growth Media",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    freelancerType: "social_media_manager",
    skills: ["Short-form Video", "Instagram Growth", "Lead Generation", "Direct Outreach"],
    portfolioUrl: "https://vancegrowth.co",
    phone: "+44 20 7946 0912",
    bio: "Boutique social media and client acquisition agency for high-end hospitality and beauty brands.",
    role: "agency",
    createdAt: "2026-02-15T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
  },
];

export function getAllAccounts(): UserAccount[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const accounts = JSON.parse(raw);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return accounts;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAllAccounts(accounts: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new Event("freelancefind_accounts_updated"));
  } catch {
    // Ignore storage errors
  }
}

export function getActiveUser(): UserAccount {
  const accounts = getAllAccounts();
  if (typeof window === "undefined") return accounts[0] || DEFAULT_ACCOUNTS[0];

  try {
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (activeId) {
      const match = accounts.find((a) => a.id === activeId);
      if (match) return match;
    }
  } catch {
    // Ignore storage errors
  }

  const fallback = accounts[0] || DEFAULT_ACCOUNTS[0];
  try {
    localStorage.setItem(ACTIVE_USER_ID_KEY, fallback.id);
  } catch {
    // Ignore
  }
  return fallback;
}

export function setActiveUser(user: UserAccount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
    const accounts = getAllAccounts();
    const existingIdx = accounts.findIndex((a) => a.id === user.id);
    if (existingIdx !== -1) {
      accounts[existingIdx] = { ...user, lastLoginAt: new Date().toISOString() };
    } else {
      accounts.push({ ...user, lastLoginAt: new Date().toISOString() });
    }
    saveAllAccounts(accounts);
    window.dispatchEvent(new Event("freelancefind_user_updated"));
    window.dispatchEvent(new Event("freelancefind_store_updated"));
  } catch {
    // Ignore
  }
}

export async function loginUser(
  email: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  password?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Please provide a valid email address." };
  }

  const accounts = getAllAccounts();
  let user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Auto-create account if logging in with new email
    const namePart = cleanEmail.split("@")[0] || "User";
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      fullName: formattedName,
      agencyName: `${formattedName} Studio`,
      freelancerType: "web_designer",
      skills: ["Outreach", "Audit", "Strategy"],
      role: "freelancer",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    accounts.push(user);
    saveAllAccounts(accounts);
  } else {
    user.lastLoginAt = new Date().toISOString();
    saveAllAccounts(accounts);
  }

  setActiveUser(user);

  // Ensure starter balance
  const balance = getLocalBalance();
  if (!balance || (balance.availableCredits ?? 0) === 0) {
    setLocalBalance({
      totalCredits: 100,
      usedCredits: 0,
      availableCredits: 100,
    });
  }

  return { success: true, user };
}

export async function signUpUser(
  email: string,
  fullName: string,
  agencyName?: string,
  freelancerType?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: "Please enter your name and email." };
  }

  const accounts = getAllAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (existing) {
    existing.fullName = cleanName;
    if (agencyName) existing.agencyName = agencyName;
    if (freelancerType) existing.freelancerType = freelancerType;
    existing.lastLoginAt = new Date().toISOString();
    saveAllAccounts(accounts);
    setActiveUser(existing);
    return { success: true, user: existing };
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    fullName: cleanName,
    agencyName: agencyName?.trim() || `${cleanName} Studio`,
    freelancerType: freelancerType || "web_designer",
    skills: ["Client Outreach", "Digital Gap Analysis", "Pitches"],
    role: "freelancer",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  accounts.push(newUser);
  saveAllAccounts(accounts);
  setActiveUser(newUser);

  // Initialize credits for fresh user
  setLocalBalance({
    totalCredits: 100,
    usedCredits: 0,
    availableCredits: 100,
  });

  return { success: true, user: newUser };
}

export function updateUserProfile(updates: Partial<UserAccount>): UserAccount {
  const current = getActiveUser();
  const updated: UserAccount = {
    ...current,
    ...updates,
  };

  const accounts = getAllAccounts();
  const idx = accounts.findIndex((a) => a.id === current.id);
  if (idx !== -1) {
    accounts[idx] = updated;
    saveAllAccounts(accounts);
  }

  setActiveUser(updated);
  return updated;
}

export function switchActiveAccount(userId: string): UserAccount | null {
  const accounts = getAllAccounts();
  const target = accounts.find((a) => a.id === userId);
  if (!target) return null;

  setActiveUser(target);
  return target;
}

export function deleteAccount(userId: string): boolean {
  const accounts = getAllAccounts();
  if (accounts.length <= 1) return false;

  const filtered = accounts.filter((a) => a.id !== userId);
  saveAllAccounts(filtered);

  const activeUser = getActiveUser();
  if (activeUser.id === userId) {
    setActiveUser(filtered[0]);
  }
  return true;
}

export async function logoutUser(): Promise<void> {
  // Reset session marker if needed
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
      window.dispatchEvent(new Event("freelancefind_user_updated"));
    } catch {
      // Ignore
    }
  }
}
