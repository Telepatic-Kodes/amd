"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { ProductTour } from "@/components/ui/ProductTour";
import { shouldShowTour } from "@/lib/tour-utils";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { SessionTimeout } from "@/components/ui/SessionTimeout";
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp";
import { useConvexAuth } from "convex/react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { BrandProvider } from "@/hooks/useBrandContext";

const DEV_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

/**
 * Safe wrapper around useConvexAuth that returns mock values
 * when dev auth bypass is enabled (no Clerk provider available).
 */
function useSafeAuth() {
  if (DEV_BYPASS) {
    return { isLoading: false, isAuthenticated: true };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvexAuth();
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const devBypass = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
  const auth = useSafeAuth();
  const { isLoading, isAuthenticated } = auth;
  const isOnboarding = pathname.startsWith("/onboarding");

  // Multi-tab logout sync
  useAuthSync();

  // Keyboard shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const toggleShortcutsHelp = useCallback(() => setShowShortcutsHelp((v) => !v), []);
  useKeyboardShortcuts(toggleShortcutsHelp);

  const [showTour, setShowTour] = useState(false);

  // Check tour state client-side only to avoid hydration mismatch
  useEffect(() => {
    if (!isOnboarding && shouldShowTour()) {
      queueMicrotask(() => setShowTour(true));
    }
  }, [isOnboarding]);

  // Sync user on any dashboard page (not just home)
  const syncUser = useMutation(api.users.getOrCreateUser);
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isOnboarding && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      syncUser().catch(() => {
        // Silent fail — user sync is best-effort
      });
    }
  }, [isOnboarding, syncUser]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!devBypass && (isLoading || !isAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
        <div className="text-stone-400 animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <BrandProvider>
      <div className="flex flex-col min-h-screen bg-[var(--surface-0)]">
        {/* Skip-to-content link for keyboard/screen reader users */}
        <a href="#main-content" className="skip-to-content">
          Saltar al contenido
        </a>
        <OfflineBanner />
        <div className="flex flex-1">
          <Sidebar />
          <main id="main-content" className="flex-1 ml-0 md:ml-56" role="main" aria-label="Contenido principal">
            <div className="container mx-auto p-4 md:p-8 pb-20 md:pb-8 max-w-7xl">{children}</div>
          </main>
        </div>
        <MobileNav />
        <CommandPalette />
        <SessionTimeout />
        <KeyboardShortcutsHelp open={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />

        {/* Product Tour - shows only for first-time users */}
        {showTour && (
          <ProductTour
            onComplete={() => setShowTour(false)}
            onSkip={() => setShowTour(false)}
          />
        )}
      </div>
    </BrandProvider>
  );
}
