import type { CreditBalance, CreditTransaction, Lead } from "@/types";

export interface StoredSearch {
  id: string;
  user_id: string;
  location: string;
  business_type: string;
  freelancer_type: string;
  status: string;
  progress: number;
  progress_message?: string;
  results_count: number;
  credits_used: number;
  created_at: string;
}

interface MockStorage {
  balance: CreditBalance;
  transactions: CreditTransaction[];
  searches: StoredSearch[];
  leads: Lead[];
}

const STORAGE_KEY = "freelancefind_local_db_v1";

const DEFAULT_STATE: MockStorage = {
  balance: {
    totalCredits: 20,
    usedCredits: 0,
    availableCredits: 20,
  },
  transactions: [
    {
      id: "initial-signup",
      userId: "demo-user-id",
      type: "bonus",
      creditsAmount: 20,
      action: "signup",
      description: "Free starter credits",
      searchId: null,
      stripeSession: null,
      createdAt: new Date().toISOString(),
    },
  ],
  searches: [],
  leads: [],
};

// In-memory fallback for SSR or when window is not present
let memoryStore: MockStorage = JSON.parse(JSON.stringify(DEFAULT_STATE));

function getStore(): MockStorage {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return memoryStore;
}

function saveStore(data: MockStorage) {
  memoryStore = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Notify other components if needed
      window.dispatchEvent(new Event("freelancefind_store_updated"));
    } catch {
      // Ignore localStorage errors
    }
  }
}

export function getLocalBalance(): CreditBalance {
  return getStore().balance;
}

export function deductLocalCredits(amount: number, description: string, searchId?: string): { success: boolean; newBalance: number } {
  const store = getStore();
  const current = store.balance.availableCredits ?? 20;

  if (current < amount) {
    return { success: false, newBalance: current };
  }

  const newAvailable = current - amount;
  const newUsed = (store.balance.usedCredits ?? 0) + amount;

  store.balance = {
    totalCredits: store.balance.totalCredits ?? 20,
    usedCredits: newUsed,
    availableCredits: newAvailable,
  };

  store.transactions.unshift({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: "demo-user-id",
    type: "usage",
    creditsAmount: -amount,
    action: "search",
    description,
    searchId: searchId ?? null,
    stripeSession: null,
    createdAt: new Date().toISOString(),
  });

  saveStore(store);
  return { success: true, newBalance: newAvailable };
}

export function setLocalBalance(balance: CreditBalance) {
  const store = getStore();
  store.balance = {
    totalCredits: balance.totalCredits ?? 20,
    usedCredits: balance.usedCredits ?? 0,
    availableCredits: balance.availableCredits ?? 20,
  };
  saveStore(store);
}

export function addLocalCredits(
  amount: number,
  description: string,
  type: "purchase" | "bonus" | "refund" = "purchase"
): { success: boolean; newBalance: number } {
  const store = getStore();
  const currentTotal = store.balance.totalCredits ?? 20;
  const currentAvailable = store.balance.availableCredits ?? 20;

  const newTotal = currentTotal + amount;
  const newAvailable = currentAvailable + amount;

  store.balance = {
    totalCredits: newTotal,
    usedCredits: store.balance.usedCredits ?? 0,
    availableCredits: newAvailable,
  };

  store.transactions.unshift({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: "demo-user-id",
    type,
    creditsAmount: amount,
    action: type === "purchase" ? "topup" : "bonus",
    description,
    searchId: null,
    stripeSession: null,
    createdAt: new Date().toISOString(),
  });

  saveStore(store);
  return { success: true, newBalance: newAvailable };
}

export function getLocalTransactions(): CreditTransaction[] {
  return getStore().transactions;
}

export function getLocalSearches(): StoredSearch[] {
  return getStore().searches;
}

export function saveLocalSearch(search: StoredSearch) {
  const store = getStore();
  store.searches.unshift(search);
  saveStore(store);
}

export function getLocalLeads(): Lead[] {
  const store = getStore();
  let modified = false;

  // Sanitize any corrupt/undefined IDs in memory/localStorage
  const sanitized = store.leads.map((lead, idx) => {
    if (!lead.id || lead.id === "undefined" || lead.id === "null") {
      modified = true;
      const cleanName = (lead.businessName || "prospect").toLowerCase().replace(/[^a-z0-9]/g, "");
      return {
        ...lead,
        id: `lead_${cleanName}_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
      };
    }
    return lead;
  });

  if (modified) {
    store.leads = sanitized;
    saveStore(store);
  }

  return store.leads;
}

export function saveLocalLeads(newLeads: Lead[]) {
  const store = getStore();

  const sanitizedNew = newLeads.map((lead, idx) => {
    const raw = lead as unknown as Record<string, unknown>;
    const leadId = (raw.id || raw._id) as string;
    const finalId =
      leadId && leadId !== "undefined" && leadId !== "null"
        ? leadId
        : `lead_${Date.now()}_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`;

    return {
      ...lead,
      id: finalId,
      createdAt: lead.createdAt || new Date().toISOString(),
    } as Lead;
  });

  // Filter out any duplicates by ID and prepend new leads
  const newIds = new Set(sanitizedNew.map((l) => l.id));
  store.leads = [...sanitizedNew, ...store.leads.filter((l) => l.id && !newIds.has(l.id))];
  saveStore(store);
}

export function updateLocalLead(id: string, updates: Partial<Lead>): Lead | null {
  const store = getStore();
  const index = store.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  store.leads[index] = {
    ...store.leads[index],
    ...updates,
  };

  saveStore(store);
  return store.leads[index];
}

export function getLocalLeadById(id: string): Lead | null {
  const leads = getLocalLeads();
  if (!id || id === "undefined" || id === "null") {
    return leads[0] ?? null;
  }
  const found = leads.find((l) => l.id === id);
  if (found) return found;

  // Try fuzzy match by businessName or return first lead
  const byName = leads.find((l) => l.businessName?.toLowerCase() === id.toLowerCase());
  return byName ?? leads[0] ?? null;
}
