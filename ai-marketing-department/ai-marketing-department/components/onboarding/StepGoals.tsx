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
        <h2 className="text-2xl font-bold text-stone-900">¿Cuáles son tus objetivos?</h2>
        <p className="text-stone-500 text-sm">Selecciona todos los que apliquen. Tus agentes los priorizarán.</p>
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
                  ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div className={cn("p-2 rounded-lg", active ? "bg-orange-600" : "bg-stone-200")}>
                <Icon className={cn("w-5 h-5", active ? "text-white" : "text-stone-500")} />
              </div>
              <div>
                <p className="font-semibold text-sm text-stone-900">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
