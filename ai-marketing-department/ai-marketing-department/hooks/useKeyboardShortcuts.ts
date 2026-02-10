"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcuts for dashboard navigation.
 * Ignores keypresses when focused on input/textarea/contenteditable.
 *
 * Shortcuts:
 *   ? → toggle keyboard shortcuts help
 *   N → go to /content (create new content)
 *   G then H → go home
 *   G then C → go to control center
 *   G then R → go to results
 *   G then S → go to settings
 *   G then B → go to brand
 */
export function useKeyboardShortcuts(onToggleHelp: () => void) {
  const router = useRouter();
  const pendingG = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip if modifier keys are held (Cmd+K is handled by CommandPalette)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // ? → toggle help
      if (key === "?") {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      // N → new content
      if (key === "n" || key === "N") {
        e.preventDefault();
        navigate("/content");
        return;
      }

      // G-prefixed two-key shortcuts
      if (key === "g" || key === "G") {
        if (!pendingG.current) {
          pendingG.current = true;
          // Reset after 1 second if no second key
          clearTimeout(gTimerRef.current);
          gTimerRef.current = setTimeout(() => {
            pendingG.current = false;
          }, 1000);
          return;
        }
      }

      if (pendingG.current) {
        pendingG.current = false;
        clearTimeout(gTimerRef.current);

        switch (key.toLowerCase()) {
          case "h":
            e.preventDefault();
            navigate("/");
            break;
          case "c":
            e.preventDefault();
            navigate("/control-center");
            break;
          case "r":
            e.preventDefault();
            navigate("/results");
            break;
          case "s":
            e.preventDefault();
            navigate("/settings");
            break;
          case "b":
            e.preventDefault();
            navigate("/brand");
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(gTimerRef.current);
    };
  }, [navigate, onToggleHelp]);
}
