"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Home, FileText, Brain, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Inicio", href: "/", icon: Home, badgeKey: null },
  { name: "Contenido", href: "/content", icon: FileText, badgeKey: "content" as const },
  { name: "Estrategia", href: "/strategy", icon: Brain, badgeKey: "strategy" as const },
  { name: "Config", href: "/settings", icon: Settings, badgeKey: null },
];

export function MobileNav() {
  const pathname = usePathname();
  const content = useQuery(api.functions.listContent, {});
  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);

  const reviewCount = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;
  const strategyActive = activeStrategy && ["executing", "generating"].includes(activeStrategy.status as string) ? 1 : 0;

  const badges: Record<string, number> = {
    content: reviewCount,
    strategy: strategyActive,
  };

  return (
    <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-0)]/80 backdrop-blur-xl">
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
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] transition-colors",
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-tertiary)] active:bg-[var(--surface-1)]"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 flex-shrink-0" />
                {badgeCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1.5 h-3.5 w-3.5 flex items-center justify-center rounded-full text-[8px] font-bold text-[var(--text-on-accent)]",
                    item.badgeKey === "strategy" ? "bg-[var(--accent)]" : "bg-[var(--warning)]"
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
