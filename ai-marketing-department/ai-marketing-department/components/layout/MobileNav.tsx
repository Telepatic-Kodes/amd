"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Contenido", href: "/content", icon: FileText },
  { name: "Resultados", href: "/results", icon: BarChart3 },
  { name: "Config", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="grid grid-cols-4 h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] transition-colors",
                isActive
                  ? "text-emerald-400"
                  : "text-zinc-500 active:bg-white/[0.03]"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
