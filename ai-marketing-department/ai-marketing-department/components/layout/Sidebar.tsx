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
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Agents", href: "/agents", icon: Users },
    { name: "Org Chart", href: "/org", icon: Network },
    { name: "Campaigns", href: "/campaigns", icon: Rocket },
    { name: "Content", href: "/content", icon: FileText },
    { name: "Feeds", href: "/feeds", icon: Rss },
    { name: "Generado", href: "/generated", icon: FolderOutput },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
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

            <div className="flex flex-1 flex-col gap-1 p-4">
                {navigation.map((item) => {
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

            <div className="border-t border-zinc-800 p-4">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white">
                    <LogOut className="h-4 w-4" />
                    Disconnect
                </button>
            </div>
        </div>
    );
}
