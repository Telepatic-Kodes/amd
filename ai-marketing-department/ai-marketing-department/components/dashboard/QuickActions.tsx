"use client";

import { useRouter } from "next/navigation";
import { Plus, Zap, FileText, BarChart3 } from "lucide-react";

const actions = [
  {
    label: "Crear Contenido",
    icon: FileText,
    href: "/content",
    color: "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    label: "Ejecutar Agente",
    icon: Zap,
    href: "/control-center",
    color: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    label: "Ver Resultados",
    icon: BarChart3,
    href: "/results",
    color: "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20",
  },
  {
    label: "Nueva Tarea",
    icon: Plus,
    href: "/control-center",
    color: "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20",
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${action.color}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
