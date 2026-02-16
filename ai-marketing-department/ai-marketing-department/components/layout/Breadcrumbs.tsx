"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
    content: "Contenido",
    strategy: "Estrategia",
    agents: "Agentes",
    analytics: "Analíticas",
    reports: "Reportes",
    monitoring: "Monitoreo",
    tasks: "Tareas",
    publishing: "Publicaciones",
    settings: "Configuración",
    "knowledge-base": "Base de Conocimiento",
    brand: "Marca",
    manual: "Manual",
};

export function Breadcrumbs() {
    const pathname = usePathname();

    // Don't show breadcrumbs on home page
    if (pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);

    const crumbs = segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 1;
        return { href, label, isLast };
    });

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mb-4">
            <Link
                href="/"
                className="flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors"
            >
                <Home className="h-3 w-3" />
                <span>Inicio</span>
            </Link>
            {crumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                    {crumb.isLast ? (
                        <span className="text-[var(--text-secondary)] font-medium">{crumb.label}</span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="hover:text-[var(--text-secondary)] transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
