"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Home, FileText, BarChart3, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Inicio", href: "/", icon: Home, badgeKey: null },
  { name: "Contenido", href: "/content", icon: FileText, badgeKey: "content" as const },
  { name: "Resultados", href: "/results", icon: BarChart3, badgeKey: null },
  { name: "Alertas", href: "/control-center", icon: Bell, badgeKey: "alerts" as const },
];

export function MobileNav() {
  const pathname = usePathname();
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const content = useQuery(api.functions.listContent, {});

  const failedCount = activity?.filter((a: Record<string, unknown>) =>
    a.status === "failure" || a.status === "failed"
  ).length ?? 0;
  const reviewCount = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;

  const badges: Record<string, number> = {
    content: reviewCount,
    alerts: failedCount,
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="grid grid-cols-4 h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] transition-colors",
                isActive
                  ? "text-emerald-400"
                  : "text-zinc-500 active:bg-white/[0.03]"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 flex-shrink-0" />
                {badgeCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1.5 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-bold text-white",
                    item.badgeKey === "alerts" ? "bg-red-500" : "bg-amber-500"
                  )}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
