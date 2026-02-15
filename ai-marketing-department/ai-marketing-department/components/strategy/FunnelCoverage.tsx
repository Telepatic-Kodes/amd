"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { Target, AlertTriangle, Loader2, ArrowDown } from "lucide-react";

const FUNNEL_STAGES = [
  {
    key: "reach",
    label: "Alcance",
    color: "bg-sky-500",
    ringColor: "ring-sky-500/20",
    textColor: "text-sky-700",
    bgAccent: "bg-sky-50",
    icon: "📡",
    description: "Atraer nuevas personas a tu marca",
    widthClass: "w-full",
  },
  {
    key: "act",
    label: "Interaccion",
    color: "bg-[var(--accent)]",
    ringColor: "ring-[var(--accent)]/20",
    textColor: "text-orange-700",
    bgAccent: "bg-[var(--accent-subtle)]",
    icon: "👆",
    description: "Motivar interaccion con tu contenido",
    widthClass: "w-[85%]",
  },
  {
    key: "convert",
    label: "Conversion",
    color: "bg-green-500",
    ringColor: "ring-green-500/20",
    textColor: "text-green-700",
    bgAccent: "bg-[var(--badge-green-bg)]",
    icon: "💰",
    description: "Generar ventas o registros",
    widthClass: "w-[70%]",
  },
  {
    key: "engage",
    label: "Fidelizacion",
    color: "bg-purple-500",
    ringColor: "ring-purple-500/20",
    textColor: "text-purple-700",
    bgAccent: "bg-purple-50",
    icon: "🤝",
    description: "Mantener clientes leales",
    widthClass: "w-[55%]",
  },
] as const;

export function FunnelCoverage() {
  const content = useQuery(api.functions.listContent, {});

  if (content === undefined) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando embudo...
        </div>
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <div className="p-1 rounded-md bg-[var(--surface-1)]">
            <Target className="w-3.5 h-3.5 text-orange-500" />
          </div>
          Embudo de Marketing
        </h3>
        <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-2 py-0.5 rounded-full">
          {totalTagged} clasificados
        </span>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] mb-5">
        Distribucion de tu contenido en cada etapa del recorrido del cliente.
      </p>

      {/* Funnel visualization — narrowing shape */}
      <div className="flex flex-col items-center gap-1">
        {stageCounts.map((stage, i) => {
          const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const isGap = stage.count < avgCount * 0.3 && totalTagged > 0;
          const isLast = i === stageCounts.length - 1;

          return (
            <div key={stage.key} className={cn("mx-auto transition-all", stage.widthClass)}>
              <div
                className={cn(
                  "relative rounded-lg border p-3 transition-all",
                  isGap
                    ? "border-dashed border-amber-300 bg-amber-50/30"
                    : "border-[var(--border)] hover:border-orange-200"
                )}
              >
                {/* Color accent left */}
                <div className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-r", stage.color)} />

                <div className="flex items-center gap-3 pl-2.5">
                  <span className="text-base shrink-0">{stage.icon}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {stage.label}
                      </span>
                      {isGap && (
                        <span className="flex items-center gap-0.5 text-[8px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Gap
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                      {stage.description}
                    </p>
                  </div>

                  {/* Count + mini bar */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="w-16">
                      <div className="h-1.5 bg-[var(--surface-1)] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                          style={{ width: `${Math.max(widthPercent, stage.count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm font-bold tabular-nums w-6 text-right",
                      stage.count > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                    )}>
                      {stage.count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow connector between stages */}
              {!isLast && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3 h-3 text-[var(--text-tertiary)] opacity-30" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gap recommendations */}
      {gaps.length > 0 && totalTagged > 3 && (
        <div className="mt-5 pt-3 border-t border-[var(--border)]">
          <p className="text-[11px] text-amber-700 font-medium mb-1.5">
            Oportunidades de mejora:
          </p>
          <ul className="space-y-1">
            {gaps.map((gap) => (
              <li key={gap.key} className="text-[10px] text-[var(--text-secondary)] flex items-start gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", gap.color)} />
                <span>
                  <strong>{gap.label}</strong>: Solo {gap.count} contenido{gap.count !== 1 ? "s" : ""}. Crea más para {gap.description.toLowerCase()}.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state hint */}
      {totalTagged === 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--text-tertiary)] text-center">
            Cuando publiques contenido, el sistema lo clasificará automáticamente en cada etapa del embudo.
          </p>
        </div>
      )}
    </div>
  );
}
