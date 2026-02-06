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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { UserMenu } from "./UserMenu";

const mainNavigation = [
    { name: translate("home"), href: "/", icon: Home, label: "Tu centro de comando", badgeKey: null },
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
        <div data-tour="sidebar" className="hidden md:flex h-screen w-56 flex-col fixed left-0 top-0 border-r border-[var(--border)] bg-[var(--surface)]">
            {/* Logo Header */}
            <div className="flex h-14 items-center border-b border-[var(--border)] px-5">
                <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">AMD</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex flex-1 flex-col overflow-y-auto py-3 px-2">
                {mainNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5 group relative",
                                isActive
                                    ? "border-l-2 border-emerald-500 bg-emerald-500/5 text-white pl-[10px]"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                            )}
                            title={item.label}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{item.name}</span>
                            {badgeCount > 0 && (
                                <span className={cn(
                                    "text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                                    item.badgeKey === "control"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-amber-500/20 text-amber-400"
                                )}>
                                    {badgeCount}
                                </span>
                            )}
                            {/* Tooltip on hover */}
                            <div className="absolute left-56 ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Cmd+K hint */}
            <div className="px-4 py-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-600">
                    <kbd className="border border-zinc-700 rounded px-1 py-0.5">⌘K</kbd>
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
