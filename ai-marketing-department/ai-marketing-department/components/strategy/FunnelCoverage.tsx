"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { Target, AlertTriangle, Loader2 } from "lucide-react";

const FUNNEL_STAGES = [
  { key: "reach", label: "Reach", color: "bg-sky-500", lightColor: "bg-sky-100 text-sky-700", icon: "📡", description: "Atraer nuevas audiencias" },
  { key: "act", label: "Act", color: "bg-orange-500", lightColor: "bg-orange-100 text-orange-700", icon: "👆", description: "Generar interacción" },
  { key: "convert", label: "Convert", color: "bg-green-500", lightColor: "bg-green-100 text-green-700", icon: "💰", description: "Convertir leads" },
  { key: "engage", label: "Engage", color: "bg-purple-500", lightColor: "bg-purple-100 text-purple-700", icon: "🤝", description: "Retener y fidelizar" },
] as const;

export function FunnelCoverage() {
  const content = useQuery(api.functions.listContent, {});

  if (content === undefined) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando funnel...
      </div>
    );
  }

  // Count content per funnel stage
  const stageCounts = FUNNEL_STAGES.map((stage) => {
    const count = (content || []).filter(
      (c: Record<string, unknown>) => c.funnelStage === stage.key
    ).length;
    return { ...stage, count };
  });

  const totalTagged = stageCounts.reduce((s, st) => s + st.count, 0);
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  // Identify gaps: stages with 0 content or significantly underrepresented
  const avgCount = totalTagged / FUNNEL_STAGES.length;
  const gaps = stageCounts.filter((s) => s.count < avgCount * 0.3);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-600" />
          Cobertura del Funnel (RACE)
        </h3>
        <span className="text-xs text-stone-500">{totalTagged} con etapa asignada</span>
      </div>

      {/* Funnel visualization */}
      <div className="space-y-3">
        {stageCounts.map((stage) => {
          const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const isGap = stage.count < avgCount * 0.3 && totalTagged > 0;

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stage.icon}</span>
                  <span className="text-xs font-medium text-stone-700">{stage.label}</span>
                  {isGap && (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Gap
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-stone-900">{stage.count}</span>
              </div>

              {/* Bar */}
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    stage.color
                  )}
                  style={{ width: `${Math.max(widthPercent, stage.count > 0 ? 4 : 0)}%` }}
                />
              </div>

              <p className="text-[10px] text-stone-400 mt-0.5">{stage.description}</p>
            </div>
          );
        })}
      </div>

      {/* Gap recommendations */}
      {gaps.length > 0 && totalTagged > 3 && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-[11px] text-amber-700 font-medium mb-1">
            Oportunidades de mejora:
          </p>
          <ul className="space-y-1">
            {gaps.map((gap) => (
              <li key={gap.key} className="text-[10px] text-stone-500 flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", gap.color)} />
                <span>
                  <strong>{gap.label}</strong>: Solo {gap.count} contenido{gap.count !== 1 ? "s" : ""}. Considera crear más contenido para {gap.description.toLowerCase()}.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
