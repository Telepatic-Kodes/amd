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
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    Pencil,
    Cog,
    X,
    ImageIcon,
    GitBranch,
    Target,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { useTheme } from "@/hooks/useTheme";
import { BrandSwitcher } from "./BrandSwitcher";
import { BrandContextBar } from "./BrandContextBar";
import { NavGroup } from "./NavGroup";
import { usePreference } from "@/hooks/usePreferences";

// Navigation grouped into 4 logical sections
const navGroups = [
    {
        title: "Inicio",
        icon: LayoutDashboard,
        items: [
            { name: translate("home"), href: "/", icon: Home },
        ],
    },
    {
        title: "Contenido",
        icon: Pencil,
        items: [
            { name: translate("content"), href: "/content", icon: FileText },
            { name: "Estrategia", href: "/strategy", icon: Brain },
            { name: "Publicaciones", href: "/publishing", icon: Send },
            { name: "Base de Conocimiento", href: "/knowledge-base", icon: BookOpen },
            { name: "Media", href: "/media", icon: ImageIcon },
        ],
    },
    {
        title: "Operaciones",
        icon: Shield,
        items: [
            { name: "Agentes", href: "/agents", icon: Users },
            { name: "Organigrama", href: "/org", icon: GitBranch },
            { name: "Campañas", href: "/campaigns", icon: Target },
            { name: "Tareas", href: "/tasks", icon: ListTodo },
            { name: "Monitoreo", href: "/monitoring", icon: Shield },
            { name: "Reportes", href: "/reports", icon: BarChart3 },
            { name: "Analíticas", href: "/analytics", icon: TrendingUp },
        ],
    },
    {
        title: "Configuración",
        icon: Cog,
        items: [
            { name: translate("settings"), href: "/settings", icon: Settings },
        ],
    },
];

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
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
                    <Sun className="h-3.5 w-3.5 flex-shrink-0" />
                    {!collapsed && <span>Modo Claro</span>}
                </>
            ) : (
                <>
                    <Moon className="h-3.5 w-3.5 flex-shrink-0" />
                    {!collapsed && <span>Modo Oscuro</span>}
                </>
            )}
        </button>
    );
}

interface SidebarProps {
    overlay?: boolean;
    onClose?: () => void;
}

export function Sidebar({ overlay, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = usePreference("sidebar_collapsed", false);
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

    // In overlay mode, sidebar is never collapsed
    const isCollapsed = overlay ? false : collapsed;

    // Badge count for a group (sum of its items)
    const getGroupBadge = (items: { href: string }[]) => {
        const badgeMap: Record<string, string> = {
            "/content": "content",
            "/strategy": "strategy",
        };
        let total = 0;
        for (const item of items) {
            const key = badgeMap[item.href];
            if (key && badges[key]) total += badges[key];
        }
        return total || undefined;
    };

    return (
        <nav
            data-tour="sidebar"
            aria-label="Navegación principal"
            className={cn(
                "flex h-screen flex-col bg-[#1c1917] border-r border-[#44403c] transition-all duration-200",
                overlay
                    ? "w-72"
                    : cn(
                        "hidden md:flex fixed left-0 top-0",
                        isCollapsed ? "w-16" : "w-56"
                    )
            )}
        >
            {/* Brand Switcher Header */}
            <div className="border-b border-[#44403c]">
                {overlay && onClose && (
                    <div className="flex items-center justify-end px-3 pt-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[#292524] transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
                {isCollapsed ? (
                    <div className="flex items-center justify-center py-3">
                        <NotificationCenter />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <BrandSwitcher />
                            </div>
                            <div className="pr-3">
                                <NotificationCenter />
                            </div>
                        </div>
                        <BrandContextBar />
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="flex flex-1 flex-col overflow-y-auto py-2 px-2">
                {isCollapsed ? (
                    // Collapsed: show only icons with tooltips
                    <div className="flex flex-col gap-1">
                        {navGroups.map((group) =>
                            group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-center rounded-lg p-2.5 transition-colors relative group",
                                            isActive
                                                ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)]"
                                                : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-active-bg)]"
                                        )}
                                        title={item.name}
                                        aria-label={item.name}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--accent)] rounded-r" />
                                        )}
                                        <Icon className={cn("h-4 w-4", isActive ? "text-[var(--accent)]" : "")} />
                                        {/* Tooltip */}
                                        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-[#292524] text-xs text-[var(--sidebar-text-active)] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg border border-[#44403c]">
                                            {item.name}
                                        </span>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                ) : (
                    // Expanded: show grouped navigation
                    navGroups.map((group) => (
                        <NavGroup
                            key={group.title}
                            title={group.title}
                            icon={group.icon}
                            items={group.items}
                            defaultExpanded
                            badge={getGroupBadge(group.items)}
                        />
                    ))
                )}
            </div>

            {/* Collapse Toggle + Theme Toggle + Keyboard hints */}
            <div className="px-2 py-2 space-y-2">
                <ThemeToggle collapsed={isCollapsed} />
                {!isCollapsed && (
                    <>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                            <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-[var(--text-tertiary)] bg-[#292524]">⌘K</kbd>
                            <span>Buscar</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                            <kbd className="border border-[#44403c] rounded px-1.5 py-0.5 text-[var(--text-tertiary)] bg-[#292524]">?</kbd>
                            <span>Atajos</span>
                        </div>
                    </>
                )}
                {/* Collapse/Expand toggle - only on desktop, not in overlay */}
                {!overlay && (
                    <button
                        onClick={() => setCollapsed(!isCollapsed)}
                        className="flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-lg text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-tertiary)] hover:bg-[#292524] transition-colors"
                        title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                        aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                    >
                        {isCollapsed ? (
                            <ChevronsRight className="h-3.5 w-3.5" />
                        ) : (
                            <>
                                <ChevronsLeft className="h-3.5 w-3.5" />
                                <span>Colapsar</span>
                            </>
                        )}
                    </button>
                )}
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
