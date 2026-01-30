"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Home,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

// Simplified navigation: 4 main sections only
const mainNavigation = [
    { name: translate("home"), href: "/", icon: Home, label: "Tu centro de comando" },
    { name: translate("content"), href: "/content", icon: FileText, label: "Crea y gestiona contenido" },
    { name: translate("analytics"), href: "/results", icon: BarChart3, label: "Ve tus resultados" },
    { name: translate("settings"), href: "/settings", icon: Settings, label: "Configuración avanzada" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div data-tour="sidebar" className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
            {/* Logo Header */}
            <div className="flex h-16 items-center border-b border-zinc-800 px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span>AMD</span>
                </Link>
            </div>

            {/* Navigation - Simplified to 4 main items */}
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
                {mainNavigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 mb-2 group relative",
                                isActive
                                    ? "bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                            title={item.label}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span>{item.name}</span>
                            {/* Tooltip on hover */}
                            <div className="absolute left-64 ml-2 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Disconnect Button */}
            <div className="border-t border-zinc-800 p-4">
                <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                    <LogOut className="h-5 w-5" />
                    Salir
                </button>
            </div>
        </div>
    );
}
