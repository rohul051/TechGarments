"use client";

import { useSyncExternalStore } from "react";
import type { User } from "@/types/user";

let cachedRawUser: string | null = null;
let cachedUser: User | null = null;

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (raw === cachedRawUser) {
      return cachedUser;
    }
    cachedRawUser = raw;
    cachedUser = raw ? (JSON.parse(raw) as User) : null;
    return cachedUser;
  } catch {
    cachedUser = null;
    return null;
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * Hook to safely read the current authenticated user on the client.
 * Caches the snapshot object reference so useSyncExternalStore doesn't trigger infinite render loops.
 */
export function useCurrentUser(): User | null {
  return useSyncExternalStore(
    subscribe,
    getCachedUser,
    () => null
  );
}
