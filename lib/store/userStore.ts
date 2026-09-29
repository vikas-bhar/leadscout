import { create } from "zustand";
import type { PlanTier, SubscriptionState } from "@/lib/subscriptions/subscriptionEngine";

interface UserStore {
  // User data
  userId: string | null;
  email: string | null;
  name: string | null;
  freelancerType: string | null;

  // Subscription
  plan: PlanTier;
  subscriptionState: SubscriptionState;
  monthlyCredits: number;
  renewalDate: Date | null;

  // Credits
  availableCredits: number;
  usedCredits: number;

  // Permissions
  canRunSearch: boolean;
  canUseCustomPrompts: boolean;
  canExportCSV: boolean;
  canUseGapAnalyzer: boolean;

  // Search state
  currentSearchId: string | null;
  searchProgress: number;
  searchMessage: string;
  searchStatus: "idle" | "running" | "complete" | "failed";

  // Actions
  setUser: (user: Partial<UserStore>) => void;
  updateCredits: (available: number, used: number) => void;
  setSearchState: (searchState: Partial<UserStore>) => void;
  refreshSubscription: () => Promise<void>;
  reset: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  email: null,
  name: null,
  freelancerType: null,
  plan: "free",
  subscriptionState: "free",
  monthlyCredits: 0,
  renewalDate: null,
  availableCredits: 20,
  usedCredits: 0,
  canRunSearch: true,
  canUseCustomPrompts: false,
  canExportCSV: false,
  canUseGapAnalyzer: false,
  currentSearchId: null,
  searchProgress: 0,
  searchMessage: "",
  searchStatus: "idle",

  setUser: (user) => set((state) => ({ ...state, ...user })),

  updateCredits: (available, used) =>
    set({
      availableCredits: available,
      usedCredits: used,
    }),

  setSearchState: (searchState) =>
    set((state) => ({
      ...state,
      ...searchState,
    })),

  refreshSubscription: async () => {
    try {
      const response = await fetch("/api/user/subscription");
      if (!response.ok) return;
      const data = await response.json();

      set({
        plan: data.plan,
        subscriptionState: data.state,
        availableCredits: data.availableCredits,
        monthlyCredits: data.monthlyCredits,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        canRunSearch: data.canRunSearch,
        canUseCustomPrompts: data.canUseCustomPrompts,
        canExportCSV: data.canExportCSV,
        canUseGapAnalyzer: data.canUseGapAnalyzer,
      });
    } catch (err) {
      console.error("Failed to refresh user subscription store", err);
    }
  },

  reset: () =>
    set({
      userId: null,
      email: null,
      plan: "free",
      availableCredits: 20,
    }),
}));
