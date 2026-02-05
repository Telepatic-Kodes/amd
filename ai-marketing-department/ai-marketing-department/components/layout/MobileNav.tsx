"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Mobile bottom navigation - 4 primary items
const mobileNavItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Contenido", href: "/content", icon: FileText },
  { name: "Resultados", href: "/results", icon: BarChart3 },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 h-20">
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
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-zinc-400 active:bg-white/5"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
