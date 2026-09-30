"use client";

import { useState, useEffect } from "react";
import { getActiveUser, type UserAccount } from "@/lib/auth-client";

export function useAuthUser() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    function sync() {
      if (typeof window === "undefined") return;
      try {
        const active = getActiveUser();
        if (active && active.id) {
          setUser(active);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      } catch {
        setUser(null);
        setIsSignedIn(false);
      }
    }

    sync();

    window.addEventListener("freelancefind_user_updated", sync);
    window.addEventListener("freelancefind_store_updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("freelancefind_user_updated", sync);
      window.removeEventListener("freelancefind_store_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, isSignedIn };
}
