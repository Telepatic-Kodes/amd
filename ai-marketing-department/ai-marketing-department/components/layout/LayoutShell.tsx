"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="container mx-auto p-4 md:p-8 pb-20 md:pb-8 max-w-7xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
