"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    { name: translate("home"), href: "/", icon: Home, label: "Tu centro de comando" },
    { name: translate("controlCenter"), href: "/control-center", icon: Activity, label: "Monitorea tus agentes en tiempo real" },
    { name: translate("content"), href: "/content", icon: FileText, label: "Crea y gestiona contenido" },
    { name: translate("analytics"), href: "/results", icon: BarChart3, label: "Ve tus resultados" },
    { name: translate("settings"), href: "/settings", icon: Settings, label: "Configuracion avanzada" },
];

export function Sidebar() {
    const pathname = usePathname();

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
                            <span>{item.name}</span>
                            {/* Tooltip on hover */}
                            <div className="absolute left-56 ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
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
