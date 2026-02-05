"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroupProps {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultExpanded?: boolean;
  badge?: string | number;
}

export function NavGroup({
  title,
  icon: Icon,
  items,
  defaultExpanded = true,
  badge,
}: NavGroupProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Persist state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`nav-group-${title}`);
    if (savedState !== null) {
      setIsExpanded(savedState === "true");
    } else {
      setIsExpanded(defaultExpanded);
    }
  }, [title, defaultExpanded]);

  // Save state to localStorage when toggling
  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`nav-group-${title}`, String(newState));
  };

  // Check if any item in the group is active
  const hasActiveItem = items.some((item) => pathname === item.href);

  return (
    <div className="mb-4">
      {/* Group Header */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
          hasActiveItem
            ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
            : "text-zinc-400 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{title}</span>
        {badge && (
          <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs text-indigo-300">
            {badge}
          </span>
        )}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Group Items - Animated */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-2 flex flex-col gap-1 pl-6 border-l border-zinc-800/50 ml-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
