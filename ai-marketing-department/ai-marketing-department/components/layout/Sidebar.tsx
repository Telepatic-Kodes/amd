"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


import {
    LayoutDashboard,
    Users,
    Network,
    Rocket,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Sparkles,
    FolderOutput,
    Rss,
    Target,
    TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NavGroup } from "./NavGroup";

const marketingNavigation = [
    { name: "Campañas", href: "/campaigns", icon: Rocket },
    { name: "Biblioteca", href: "/content", icon: FileText },
    { name: "Contenido Generado", href: "/generated", icon: FolderOutput },
    { name: "Métricas", href: "/metrics", icon: TrendingUp },
];

const systemNavigation = [
    { name: "Agentes IA", href: "/agents", icon: Users },
    { name: "Organigrama", href: "/org", icon: Network },
    { name: "Fuentes RSS", href: "/feeds", icon: Rss },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
            <div className="flex h-16 items-center border-b border-zinc-800 px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span>AMD</span>
                </Link>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto p-4">
                {/* Dashboard - Top Level */}
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 mb-6",
                        pathname === "/"
                            ? "bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Link>

                {/* Marketing Group */}
                <NavGroup
                    title="Marketing"
                    icon={Target}
                    items={marketingNavigation}
                    defaultExpanded={true}
                />

                {/* Sistema Avanzado Group */}
                <NavGroup
                    title="Sistema Avanzado"
                    icon={Settings}
                    items={systemNavigation}
                    defaultExpanded={false}
                />
            </div>

            <div className="border-t border-zinc-800 p-4">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                    <LogOut className="h-4 w-4" />
                    Disconnect
                </button>
            </div>
        </div>
    );
}
