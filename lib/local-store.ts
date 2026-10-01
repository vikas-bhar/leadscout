import type { CreditBalance, CreditTransaction, Lead, LeadFolder } from "@/types";
import type { CustomPromptConfig, CustomFilterConfig } from "@/lib/customization/promptBuilder";
import { DEFAULT_PROMPT_TEMPLATES, DEFAULT_FILTER_TEMPLATES } from "@/lib/customization/defaultTemplates";

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

export interface StoredSearchTemplate {
  id: string;
  name: string;
  config: Record<string, unknown>;
  customPromptId?: string;
  customFilterId?: string;
  createdAt: string;
}

interface MockStorage {
  balance: CreditBalance;
  transactions: CreditTransaction[];
  searches: StoredSearch[];
  leads: Lead[];
  folders: LeadFolder[];
  customPrompts: CustomPromptConfig[];
  customFilters: CustomFilterConfig[];
  searchTemplates: StoredSearchTemplate[];
}

const STORAGE_KEY = "freelancefind_local_db_v1";

const DEFAULT_FOLDERS: LeadFolder[] = [
  {
    id: "folder_hot_deals",
    name: "🔥 Hot Prospects",
    color: "#f43f5e", // Rose
    description: "Urgent digital gaps ready for immediate pitch",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_follow_ups",
    name: "⏳ Follow-up Pipeline",
    color: "#8b5cf6", // Purple
    description: "Sent initial outreach, awaiting reply",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_high_budget",
    name: "💎 High Budget Clients",
    color: "#06b6d4", // Cyan
    description: "Established businesses with $2k+ monthly budget signal",
    createdAt: new Date().toISOString(),
  },
  {
    id: "folder_closed_won",
    name: "🏆 Closed / Won",
    color: "#10b981", // Emerald
    description: "Converted client projects",
    createdAt: new Date().toISOString(),
  },
];

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
      description: "Free starter credits (20 credits)",
      searchId: null,
      stripeSession: null,
      createdAt: new Date().toISOString(),
    },
  ],
  searches: [],
  leads: [],
  folders: DEFAULT_FOLDERS,
  customPrompts: DEFAULT_PROMPT_TEMPLATES,
  customFilters: DEFAULT_FILTER_TEMPLATES,
  searchTemplates: [],
};

// In-memory fallback for SSR or when window is not present
let memoryStore: MockStorage = JSON.parse(JSON.stringify(DEFAULT_STATE));

function getStore(): MockStorage {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.folders || !Array.isArray(parsed.folders) || parsed.folders.length === 0) {
          parsed.folders = DEFAULT_FOLDERS;
        }
        if (!parsed.customPrompts || !Array.isArray(parsed.customPrompts) || parsed.customPrompts.length === 0) {
          parsed.customPrompts = DEFAULT_PROMPT_TEMPLATES;
        }
        if (!parsed.customFilters || !Array.isArray(parsed.customFilters) || parsed.customFilters.length === 0) {
          parsed.customFilters = DEFAULT_FILTER_TEMPLATES;
        }
        if (!parsed.searchTemplates || !Array.isArray(parsed.searchTemplates)) {
          parsed.searchTemplates = [];
        }
        // Normalize any old 100-credit default down to 20 free credits if unused
        if (parsed.balance && parsed.balance.totalCredits === 100 && parsed.balance.usedCredits === 0) {
          parsed.balance.totalCredits = 20;
          parsed.balance.availableCredits = 20;
        }
        return parsed;
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return memoryStore;
}

function isDomOrNonSerializable(val: unknown): boolean {
  if (!val || typeof val !== "object") return false;
  const o = val as Record<string, unknown>;

  if (
    (typeof window !== "undefined" && (val instanceof HTMLElement || val instanceof Node || val instanceof Window)) ||
    ("nodeType" in o && typeof o.nodeType === "number") ||
    ("ownerDocument" in o)
  ) {
    return true;
  }

  if (
    "_reactName" in o ||
    "nativeEvent" in o ||
    "dispatchConfig" in o ||
    "stateNode" in o ||
    "_owner" in o ||
    ("type" in o && "props" in o && "key" in o && "ref" in o)
  ) {
    return true;
  }

  const cName = o.constructor?.name || "";
  if (
    cName.includes("HTML") ||
    cName.includes("Element") ||
    cName.includes("Node") ||
    cName.includes("Window") ||
    cName.includes("Event") ||
    cName.includes("Fiber")
  ) {
    return true;
  }

  return false;
}

export function safeJsonStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (key && (key.startsWith("__react") || key.startsWith("$$react"))) {
      return undefined;
    }

    if (typeof value === "function") {
      return undefined;
    }

    if (typeof value === "object" && value !== null) {
      if (isDomOrNonSerializable(value)) {
        return undefined;
      }
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);
    }
    return value;
  });
}

function saveStore(data: MockStorage) {
  memoryStore = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, safeJsonStringify(data));
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

export function updateLocalBalance(balance: CreditBalance) {
  const store = getStore();
  store.balance = balance;
  saveStore(store);
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

export function getLocalFolders(): LeadFolder[] {
  const store = getStore();
  if (!store.folders || store.folders.length === 0) {
    store.folders = DEFAULT_FOLDERS;
    saveStore(store);
  }
  return store.folders;
}

export function createLocalFolder(name: string, color = "#6366f1", description = ""): LeadFolder {
  const store = getStore();
  const newFolder: LeadFolder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    color,
    description: description.trim(),
    createdAt: new Date().toISOString(),
  };

  store.folders = [...(store.folders || []), newFolder];
  saveStore(store);
  return newFolder;
}

export function updateLocalFolder(id: string, updates: Partial<LeadFolder>): LeadFolder | null {
  const store = getStore();
  const index = (store.folders || []).findIndex((f) => f.id === id);
  if (index === -1) return null;

  store.folders[index] = {
    ...store.folders[index],
    ...updates,
  };
  saveStore(store);
  return store.folders[index];
}

export function deleteLocalFolder(id: string): void {
  const store = getStore();
  // Unassign leads in this folder
  store.leads = store.leads.map((lead) => {
    if (lead.folderId === id) {
      return { ...lead, folderId: null, folderName: null };
    }
    return lead;
  });

  store.folders = (store.folders || []).filter((f) => f.id !== id);
  saveStore(store);
}

export function assignLeadToFolder(leadId: string, folderId: string | null): Lead | null {
  const store = getStore();
  const index = store.leads.findIndex((l) => l.id === leadId);
  if (index === -1) return null;

  const folder = folderId ? (store.folders || []).find((f) => f.id === folderId) : null;

  store.leads[index] = {
    ...store.leads[index],
    folderId: folderId || null,
    folderName: folder ? folder.name : null,
  };

  saveStore(store);
  return store.leads[index];
}

export function assignLeadsToFolderBulk(leadIds: string[], folderId: string | null): void {
  const store = getStore();
  const idSet = new Set(leadIds);
  const folder = folderId ? (store.folders || []).find((f) => f.id === folderId) : null;

  store.leads = store.leads.map((lead) => {
    if (idSet.has(lead.id)) {
      return {
        ...lead,
        folderId: folderId || null,
        folderName: folder ? folder.name : null,
      };
    }
    return lead;
  });

  saveStore(store);
}

export function deleteLocalLead(id: string): void {
  const store = getStore();
  store.leads = store.leads.filter((l) => l.id !== id);
  saveStore(store);
}

export function deleteLocalLeadsBulk(ids: string[]): void {
  const store = getStore();
  const idSet = new Set(ids);
  store.leads = store.leads.filter((l) => !idSet.has(l.id));
  saveStore(store);
}

export function getDiscoveredBusinessFingerprints(): { names: string[]; phoneNumbers: string[] } {
  const store = getStore();
  const names = store.leads
    .map((l) => (l.businessName || "").trim().toLowerCase())
    .filter(Boolean);
  const phoneNumbers = store.leads
    .map((l) => (l.phone || "").replace(/[^0-9]/g, ""))
    .filter((p) => p.length > 5);

  return { names, phoneNumbers };
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

// ── CUSTOM PROMPTS CRUD ──
export function getLocalPrompts(): CustomPromptConfig[] {
  return getStore().customPrompts || DEFAULT_PROMPT_TEMPLATES;
}

export function saveLocalPrompt(prompt: CustomPromptConfig): CustomPromptConfig {
  const store = getStore();
  const existingIdx = store.customPrompts.findIndex((p) => p.id === prompt.id);
  const updatedPrompt = {
    ...prompt,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    store.customPrompts[existingIdx] = updatedPrompt;
  } else {
    store.customPrompts.unshift(updatedPrompt);
  }

  saveStore(store);
  return updatedPrompt;
}

export function deleteLocalPrompt(id: string): boolean {
  const store = getStore();
  const initialLen = store.customPrompts.length;
  store.customPrompts = store.customPrompts.filter((p) => p.id !== id);
  if (store.customPrompts.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// ── CUSTOM FILTERS CRUD ──
export function getLocalFilters(): CustomFilterConfig[] {
  return getStore().customFilters || DEFAULT_FILTER_TEMPLATES;
}

export function saveLocalFilter(filter: CustomFilterConfig): CustomFilterConfig {
  const store = getStore();
  const existingIdx = store.customFilters.findIndex((f) => f.id === filter.id);

  if (existingIdx !== -1) {
    store.customFilters[existingIdx] = filter;
  } else {
    store.customFilters.unshift(filter);
  }

  saveStore(store);
  return filter;
}

export function deleteLocalFilter(id: string): boolean {
  const store = getStore();
  const initialLen = store.customFilters.length;
  store.customFilters = store.customFilters.filter((f) => f.id !== id);
  if (store.customFilters.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

// ── SEARCH TEMPLATES CRUD ──
export function getLocalTemplates(): StoredSearchTemplate[] {
  return getStore().searchTemplates || [];
}

export function saveLocalTemplate(template: StoredSearchTemplate): StoredSearchTemplate {
  const store = getStore();
  const existingIdx = store.searchTemplates.findIndex((t) => t.id === template.id);

  if (existingIdx !== -1) {
    store.searchTemplates[existingIdx] = template;
  } else {
    store.searchTemplates.unshift(template);
  }

  saveStore(store);
  return template;
}

export function deleteLocalTemplate(id: string): boolean {
  const store = getStore();
  const initialLen = store.searchTemplates.length;
  store.searchTemplates = store.searchTemplates.filter((t) => t.id !== id);
  if (store.searchTemplates.length !== initialLen) {
    saveStore(store);
    return true;
  }
  return false;
}

export function clearLocalLeads(): void {
  const store = getStore();
  store.leads = [];
  saveStore(store);
}

export function clearLocalSearches(): void {
  const store = getStore();
  store.searches = [];
  saveStore(store);
}


