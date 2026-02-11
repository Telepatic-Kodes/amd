"use client";

import { cn } from "@/lib/utils";
import { PenTool, Users, Search, TrendingUp, Palette, Settings, Crown } from "lucide-react";

const DEPARTMENTS = [
  { id: "content", label: "Contenido", icon: PenTool, agents: 6, desc: "Blog, copywriting, editorial" },
  { id: "social", label: "Social", icon: Users, agents: 5, desc: "Gestion de redes sociales y engagement" },
  { id: "seo", label: "SEO", icon: Search, agents: 5, desc: "Optimización de búsqueda y analytics" },
  { id: "demandgen", label: "Demand Gen", icon: TrendingUp, agents: 6, desc: "Leads, ads, campañas de email" },
  { id: "brand", label: "Marca", icon: Palette, agents: 5, desc: "Estrategia de marca y diseño" },
  { id: "ops", label: "Ops", icon: Settings, agents: 5, desc: "Automatización, datos y reportes" },
  { id: "leadership", label: "Liderazgo", icon: Crown, agents: 5, desc: "CMO, estrategas y coordinadores" },
];

interface Props {
  selected: string[];
  onChange: (depts: string[]) => void;
}

export function StepAgents({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((d) => d !== id) : [...selected, id]);
  };

  const totalAgents = DEPARTMENTS.filter((d) => selected.includes(d.id)).reduce((s, d) => s + d.agents, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-stone-900">Activar Departamentos</h2>
        <p className="text-stone-500 text-sm">
          Elige que equipos activar.{" "}
          <span className="text-orange-400 font-medium">{totalAgents} agentes</span> seleccionados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEPARTMENTS.map(({ id, label, icon: Icon, agents, desc }) => {
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
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-stone-900">{label}</p>
                  <span className="text-[10px] text-stone-500">{agents} agentes</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
