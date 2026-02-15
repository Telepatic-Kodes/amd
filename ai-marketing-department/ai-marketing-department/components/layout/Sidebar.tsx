"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import {
    Home,
    FileText,
    Settings,
    Brain,
    Sun,
    Moon,
    BarChart3,
    TrendingUp,
    Users,
    Shield,
    ListTodo,
    Send,
    BookOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { useTheme } from "@/hooks/useTheme";
import { BrandSwitcher } from "./BrandSwitcher";
import { BrandContextBar } from "./BrandContextBar";

const mainNavigation = [
    { name: translate("home"), href: "/", icon: Home, label: "Dashboard ejecutivo", badgeKey: null },
    { name: translate("content"), href: "/content", icon: FileText, label: "Pipeline, lista y calendario", badgeKey: "content" as const },
    { name: "Estrategia", href: "/strategy", icon: Brain, label: "Autopilot, marca e insights", badgeKey: "strategy" as const },
    { name: "Reportes", href: "/reports", icon: BarChart3, label: "Reportes y métricas", badgeKey: null },
    { name: "Analíticas", href: "/analytics", icon: TrendingUp, label: "Rendimiento de agentes", badgeKey: null },
    { name: "Agentes", href: "/agents", icon: Users, label: "37 agentes IA", badgeKey: null },
    { name: "Monitoreo", href: "/monitoring", icon: Shield, label: "Alertas y menciones", badgeKey: null },
    { name: "Tareas", href: "/tasks", icon: ListTodo, label: "Cola de tareas y ejecuciones", badgeKey: null },
    { name: "Publicaciones", href: "/publishing", icon: Send, label: "Hub de publicación multicanal", badgeKey: null },
    { name: "Base de Conocimiento", href: "/knowledge-base", icon: BookOpen, label: "Documentos y contexto IA", badgeKey: null },
    { name: translate("settings"), href: "/settings", icon: Settings, label: "API keys y apariencia", badgeKey: null },
];

function ThemeToggle() {
    const { resolved, mounted, toggleTheme } = useTheme();
    const isDark = mounted ? resolved === "dark" : false;

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-lg text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-tertiary)] hover:bg-[#292524] transition-colors"
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
    const brandProfile = useQuery(api.brandProfile.getBrandProfile);
    const content = useQuery(api.functions.listContent, brandProfile === undefined ? "skip" : { brandProfileId: brandProfile?._id });
    const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);

    // Compute badge counts
    const reviewContent = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;
    const strategyActive = activeStrategy && ["executing", "generating"].includes(activeStrategy.status) ? 1 : 0;

    const badges: Record<string, number> = {
        content: reviewContent,
        strategy: strategyActive,
    };

    return (
        <nav
            data-tour="sidebar"
            aria-label="Navegación principal"
            className="hidden md:flex h-screen w-56 flex-col fixed left-0 top-0 bg-[#1c1917] border-r border-[#44403c]"
        >
            {/* Brand Switcher Header */}
            <div className="border-b border-[#44403c]">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <BrandSwitcher />
                    </div>
                    <div className="pr-3">
                        <NotificationCenter />
                    </div>
                </div>
                <BrandContextBar />
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
                                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)]"
                                    : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-active-bg)]"
                            )}
                            title={item.label}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--accent)] rounded-r" />
                            )}
                            <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isActive ? "text-[var(--accent)]" : ""
                            )} />
                            <span className="flex-1">{item.name}</span>
                            {badgeCount > 0 && (
                                <span className={cn(
                                    "text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                                    item.badgeKey === "strategy"
                                        ? "bg-orange-900/40 text-[var(--accent)]"
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
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                    <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-[var(--text-tertiary)] bg-[#292524]">⌘K</kbd>
                    <span>Buscar</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                    <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-[var(--text-tertiary)] bg-[#292524]">?</kbd>
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
