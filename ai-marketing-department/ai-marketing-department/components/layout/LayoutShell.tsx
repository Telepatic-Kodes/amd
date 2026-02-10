"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { ProductTour } from "@/components/ui/ProductTour";
import { shouldShowTour } from "@/lib/tour-utils";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const isOnboarding = pathname.startsWith("/onboarding");
  const [showTour, setShowTour] = useState(false);

  // Check if tour should be shown for first-time users (client-side only)
  useEffect(() => {
    if (!isOnboarding) {
      const shouldShow = shouldShowTour();
      setShowTour(shouldShow);
    }
  }, [isOnboarding]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  // DEV BYPASS: skip auth check to preview dashboard without Clerk login
  // TODO: restore auth gate before production
  // if (isLoading || !isAuthenticated) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-stone-50">
  //       <div className="text-stone-400 animate-pulse">Cargando...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex min-h-screen bg-[var(--surface-0)]">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-56">
        <div className="container mx-auto p-4 md:p-8 pb-20 md:pb-8 max-w-7xl">{children}</div>
      </main>
      <MobileNav />
      <CommandPalette />

      {/* Product Tour - shows only for first-time users */}
      {showTour && (
        <ProductTour
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
