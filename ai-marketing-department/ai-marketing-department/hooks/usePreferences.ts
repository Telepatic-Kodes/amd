"use client";

import { useState, useCallback } from "react";

/**
 * Lightweight localStorage-backed preferences hook.
 * Stores user preferences that persist across sessions without DB calls.
 *
 * Usage:
 *   const [value, setValue] = usePreference("lastContentType", "blog");
 */
export function usePreference<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const storageKey = `amd_pref_${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersisted = useCallback(
    (newValue: T) => {
      setValue(newValue);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newValue));
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    },
    [storageKey]
  );

  return [value, setPersisted];
}
