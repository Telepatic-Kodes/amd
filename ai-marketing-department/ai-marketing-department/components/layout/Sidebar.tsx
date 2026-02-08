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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

const mainNavigation = [
    { name: translate("home"), href: "/", icon: Home, label: "Tu centro de comando", badgeKey: null },
    { name: "Marca", href: "/brand", icon: Palette, label: "Tu perfil de marca y contenido", badgeKey: null },
    { name: translate("controlCenter"), href: "/control-center", icon: Activity, label: "Monitorea tus agentes en tiempo real", badgeKey: "control" as const },
    { name: translate("content"), href: "/content", icon: FileText, label: "Crea y gestiona contenido", badgeKey: "content" as const },
    { name: translate("analytics"), href: "/results", icon: BarChart3, label: "Ve tus resultados", badgeKey: null },
    { name: translate("settings"), href: "/settings", icon: Settings, label: "Configuracion avanzada", badgeKey: null },
];

export function Sidebar() {
    const pathname = usePathname();
    const agents = useQuery(api.functions.listAgents, {});
    const content = useQuery(api.functions.listContent, {});

    // Compute badge counts
    const errorAgents = agents?.filter((a: Record<string, unknown>) => a.status === "error").length ?? 0;
    const reviewContent = content?.filter((c: Record<string, unknown>) => c.status === "review").length ?? 0;

    const badges: Record<string, number> = {
        control: errorAgents,
        content: reviewContent,
    };

    return (
        <div
            data-tour="sidebar"
            className="hidden md:flex h-screen w-56 flex-col fixed left-0 top-0 bg-[var(--surface-0)]"
        >
            {/* Logo Header */}
            <div className="flex h-14 items-center justify-between px-5">
                <Link href="/" className="flex items-center gap-2.5 font-semibold text-[var(--text-primary)]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                    </div>
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
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors mb-0.5 group relative",
                                isActive
                                    ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03]"
                            )}
                            title={item.label}
                        >
                            <Icon className={cn(
                                "h-4 w-4 flex-shrink-0 transition-colors",
                                isActive ? "text-[var(--accent)]" : ""
                            )} />
                            <span className="flex-1">{item.name}</span>
                            {badgeCount > 0 && (
                                <span className={cn(
                                    "text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                                    item.badgeKey === "control"
                                        ? "bg-[var(--error)]/20 text-[var(--error)]"
                                        : "bg-[var(--warning)]/20 text-[var(--warning)]"
                                )}>
                                    {badgeCount}
                                </span>
                            )}
                            {/* Tooltip on hover */}
                            <div className="absolute left-56 ml-2 px-2 py-1 bg-[var(--surface-3)] text-[var(--text-primary)] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Cmd+K hint */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                    <kbd className="border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--text-tertiary)]">⌘K</kbd>
                    <span>Buscar</span>
                </div>
            </div>

            {/* User Menu */}
            <div className="border-t border-[var(--border)] p-3">
                <div className="flex items-center justify-center">
                    <UserMenu />
                </div>
            </div>
        </div>
    );
}
