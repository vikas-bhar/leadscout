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
  subscriptionPlan?: "free" | "freelancer" | "growth" | "agency";
  password?: string;
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

function syncAuthCookies(user: UserAccount | null): void {
  if (typeof document === "undefined") return;
  try {
    if (user) {
      document.cookie = `ff_auth_session=${encodeURIComponent(user.id)}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `ff_auth_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = `ff_auth_session=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `ff_auth_user=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // Ignore cookie errors
  }
}

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
      if (match) {
        syncAuthCookies(match);
        return match;
      }
    }
  } catch {
    // Ignore storage errors
  }

  const fallback = accounts[0] || DEFAULT_ACCOUNTS[0];
  try {
    localStorage.setItem(ACTIVE_USER_ID_KEY, fallback.id);
    syncAuthCookies(fallback);
  } catch {
    // Ignore
  }
  return fallback;
}

export function setActiveUser(user: UserAccount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
    syncAuthCookies(user);
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
  password?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: "Please provide a valid email address." };
  }

  const accounts = getAllAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  // If user has a set password, verify it strictly
  if (user && user.password) {
    if (!password) {
      return { success: false, error: "Please enter your password to sign in." };
    }
    if (user.password !== password) {
      return { success: false, error: "Incorrect password. Please verify your credentials or click Forgot Password." };
    }
  }

  if (!user) {
    // If new user logging in directly, require valid password (min 6 chars)
    if (password && password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const namePart = cleanEmail.split("@")[0] || "User";
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      fullName: formattedName,
      agencyName: `${formattedName} Studio`,
      freelancerType: "web_designer",
      skills: ["Outreach", "Audit", "Strategy"],
      role: "freelancer",
      password: password || undefined,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    accounts.push(newUser);
    saveAllAccounts(accounts);
    setActiveUser(newUser);

    // Ensure starter balance
    const balance = getLocalBalance();
    if (!balance || (balance.availableCredits ?? 0) === 0) {
      setLocalBalance({
        totalCredits: 20,
        usedCredits: 0,
        availableCredits: 20,
      });
    }

    return { success: true, user: newUser };
  } else {
    user.lastLoginAt = new Date().toISOString();
    if (password && !user.password) {
      user.password = password;
    }
    saveAllAccounts(accounts);
    setActiveUser(user);
    return { success: true, user };
  }
}

export async function resetPassword(
  email: string,
  newPassword?: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: "Please provide an email address." };
  }
  const accounts = getAllAccounts();
  const user = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (user && newPassword) {
    user.password = newPassword;
    saveAllAccounts(accounts);
    return { success: true, message: "Password updated successfully. You can now sign in." };
  }
  return { success: true, message: `If an account exists for ${cleanEmail}, password reset instructions have been sent.` };
}

export async function signUpUser(
  email: string,
  fullName: string,
  agencyName?: string,
  freelancerType?: string,
  plan?: "free" | "freelancer" | "growth" | "agency",
  password?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: "Please enter your name and email." };
  }

  if (password && password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const accounts = getAllAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (existing) {
    existing.fullName = cleanName;
    if (agencyName) existing.agencyName = agencyName;
    if (freelancerType) existing.freelancerType = freelancerType;
    if (plan) existing.subscriptionPlan = plan;
    if (password) existing.password = password;
    existing.lastLoginAt = new Date().toISOString();
    saveAllAccounts(accounts);
    setActiveUser(existing);
    return { success: true, user: existing };
  }

  const selectedPlan = plan || "free";
  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    fullName: cleanName,
    agencyName: agencyName?.trim() || `${cleanName} Studio`,
    freelancerType: freelancerType || "web_designer",
    skills: ["Client Outreach", "Digital Gap Analysis", "Pitches"],
    role: "freelancer",
    subscriptionPlan: selectedPlan,
    password: password || undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  accounts.push(newUser);
  saveAllAccounts(accounts);
  setActiveUser(newUser);

  // Initialize credits:
  // If user signed up with a paid subscription tier, grant plan credits;
  // If free, grant exactly 20 free credits.
  let initialCredits = 20;
  if (selectedPlan === "freelancer") initialCredits = 300;
  else if (selectedPlan === "growth") initialCredits = 1000;
  else if (selectedPlan === "agency") initialCredits = 3000;

  setLocalBalance({
    totalCredits: initialCredits,
    usedCredits: 0,
    availableCredits: initialCredits,
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("leadscout_current_plan", selectedPlan);
    window.dispatchEvent(new Event("freelancefind_user_updated"));
  }

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
      syncAuthCookies(null);
      window.dispatchEvent(new Event("freelancefind_user_updated"));
    } catch {
      // Ignore
    }
  }
}
