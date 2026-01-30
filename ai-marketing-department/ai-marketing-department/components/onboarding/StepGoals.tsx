"use client";

import { cn } from "@/lib/utils";
import { Target, Eye, PenTool, Users, Search, Megaphone } from "lucide-react";

const GOALS = [
  { id: "lead-gen", label: "Generar Leads", icon: Target, desc: "Atraer leads calificados y conversiones" },
  { id: "brand", label: "Visibilidad de Marca", icon: Eye, desc: "Aumentar el conocimiento de tu marca" },
  { id: "content", label: "Marketing de Contenido", icon: PenTool, desc: "Crear y distribuir contenido valioso" },
  { id: "social", label: "Crecimiento Social", icon: Users, desc: "Crecer y enganchar a tu audiencia" },
  { id: "seo", label: "SEO / Posicionamiento", icon: Search, desc: "Mejorar tráfico orgánico y rankings" },
  { id: "paid", label: "Publicidad Pagada", icon: Megaphone, desc: "Optimizar campañas publicitarias" },
];

interface Props {
  selected: string[];
  onChange: (goals: string[]) => void;
}

export function StepGoals({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">¿Cuáles son tus objetivos?</h2>
        <p className="text-zinc-400 text-sm">Selecciona todos los que apliquen. Tus agentes los priorizarán.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GOALS.map(({ id, label, icon: Icon, desc }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                active
                  ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
              )}
            >
              <div className={cn("p-2 rounded-lg", active ? "bg-indigo-600" : "bg-zinc-800")}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
