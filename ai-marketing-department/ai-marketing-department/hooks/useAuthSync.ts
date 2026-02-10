"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTH_SYNC_KEY = "amd_auth_logout";

/**
 * Multi-tab logout sync.
 * When one tab logs out, all other tabs redirect to sign-in.
 */
export function useAuthSync() {
  const router = useRouter();

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SYNC_KEY && event.newValue === "true") {
        // Another tab triggered logout
        router.push("/sign-in");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);
}

/** Call this when the user logs out to notify other tabs */
export function broadcastLogout() {
  try {
    localStorage.setItem(AUTH_SYNC_KEY, "true");
    // Reset immediately so future logouts also trigger
    localStorage.removeItem(AUTH_SYNC_KEY);
  } catch {
    // localStorage not available (SSR, private browsing)
  }
}
