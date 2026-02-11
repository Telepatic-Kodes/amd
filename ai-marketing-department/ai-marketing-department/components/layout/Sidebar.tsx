"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import {
    Home,
    FileText,
    BarChart3,
    Settings,
    Sparkles,
    Activity,
    Palette,
    Brain,
    Sun,
    Moon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { useTheme } from "@/hooks/useTheme";

const mainNavigation = [
    { name: translate("home"), href: "/", icon: Home, label: "Tu centro de comando", badgeKey: null },
    { name: "Marca", href: "/brand", icon: Palette, label: "Tu perfil de marca y contenido", badgeKey: null },
    { name: "Estrategia", href: "/strategy", icon: Brain, label: "Marketing Autopilot y estrategias", badgeKey: "strategy" as const },
    { name: translate("controlCenter"), href: "/control-center", icon: Activity, label: "Monitorea tus agentes en tiempo real", badgeKey: "control" as const },
    { name: translate("content"), href: "/content", icon: FileText, label: "Crea y gestiona contenido", badgeKey: "content" as const },
    { name: translate("analytics"), href: "/results", icon: BarChart3, label: "Ve tus resultados", badgeKey: null },
    { name: translate("settings"), href: "/settings", icon: Settings, label: "Configuración avanzada", badgeKey: null },
];

function ThemeToggle() {
    const { resolved, toggleTheme } = useTheme();
    const isDark = resolved === "dark";

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-lg text-[10px] font-medium text-stone-500 hover:text-stone-300 hover:bg-[#292524] transition-colors"
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {isDark ? (
                <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Modo Claro</span>
                </>
            ) : (
                <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Modo Oscuro</span>
                </>
            )}
        </button>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const agents = useQuery(api.functions.listAgents, {});
    const content = useQuery(api.functions.listContent, {});
    const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);

    // Compute badge counts
    const errorAgents = agents?.filter((a: Record<string, unknown>) => a.status === "error").length ?? 0;
    const reviewContent = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;
    const strategyActive = activeStrategy && ["executing", "generating"].includes(activeStrategy.status) ? 1 : 0;

    const badges: Record<string, number> = {
        control: errorAgents,
        content: reviewContent,
        strategy: strategyActive,
    };

    return (
        <nav
            data-tour="sidebar"
            aria-label="Navegación principal"
            className="hidden md:flex h-screen w-56 flex-col fixed left-0 top-0 bg-[#1c1917] border-r border-[#44403c]"
        >
            {/* Logo Header */}
            <div className="flex h-14 items-center justify-between px-5">
                <Link href="/" className="flex items-center gap-2.5 font-semibold text-stone-200">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <span className="text-sm tracking-tight">AMD</span>
                </Link>
                <NotificationCenter />
            </div>

            {/* Navigation */}
            <div className="flex flex-1 flex-col overflow-y-auto py-2 px-2">
                {mainNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5 relative",
                                isActive
                                    ? "bg-[#292524] text-orange-400"
                                    : "text-stone-400 hover:text-stone-200 hover:bg-[#292524]"
                            )}
                            title={item.label}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r" />
                            )}
                            <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isActive ? "text-orange-400" : ""
                            )} />
                            <span className="flex-1">{item.name}</span>
                            {badgeCount > 0 && (
                                <span className={cn(
                                    "text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                                    item.badgeKey === "control"
                                        ? "bg-red-900/40 text-red-400"
                                        : item.badgeKey === "strategy"
                                        ? "bg-orange-900/40 text-orange-400"
                                        : "bg-amber-900/40 text-amber-400"
                                )}>
                                    {badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Theme Toggle + Keyboard hints */}
            <div className="px-4 py-2 space-y-2">
                <ThemeToggle />
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
                    <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-stone-500 bg-[#292524]">⌘K</kbd>
                    <span>Buscar</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
                    <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-stone-500 bg-[#292524]">?</kbd>
                    <span>Atajos</span>
                </div>
            </div>

            {/* User Menu */}
            <div className="border-t border-[#44403c] p-3">
                <div className="flex items-center justify-center">
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}
