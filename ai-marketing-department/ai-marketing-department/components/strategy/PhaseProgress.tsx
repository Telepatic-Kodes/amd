"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2, FileText, Lightbulb, CalendarDays, Rocket, TrendingUp } from "lucide-react";

const PHASES = [
  { key: "foundation", label: "Fundamentos", icon: FileText, description: "Marca, messaging, posicionamiento" },
  { key: "strategy", label: "Estrategia", icon: Lightbulb, description: "CMO genera pilares y plan" },
  { key: "planning", label: "Planificación", icon: CalendarDays, description: "Calendario y asignación" },
  { key: "execution", label: "Ejecución", icon: Rocket, description: "Agentes crean contenido" },
  { key: "optimization", label: "Optimización", icon: TrendingUp, description: "Análisis y mejora" },
] as const;

const STATUS_STYLES = {
  completed: { ring: "ring-green-500 bg-green-50", icon: "text-green-600", label: "text-green-700" },
  in_progress: { ring: "ring-orange-500 bg-orange-50", icon: "text-orange-600", label: "text-orange-700" },
  pending: { ring: "ring-stone-200 bg-stone-50", icon: "text-stone-400", label: "text-stone-500" },
  skipped: { ring: "ring-stone-200 bg-stone-100", icon: "text-stone-300", label: "text-stone-400" },
};

interface PhaseProgressProps {
  onPhaseClick?: (phase: string) => void;
  compact?: boolean;
}

export function PhaseProgress({ onPhaseClick, compact }: PhaseProgressProps) {
  const phaseProgress = useQuery(api.marketingPhases.getPhaseProgress);

  if (!phaseProgress) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando fases...
      </div>
    );
  }

  const phaseMap = new Map(phaseProgress.phases.map((p) => [p.phase, p]));

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {PHASES.map((phase, idx) => {
          const data = phaseMap.get(phase.key);
          const status = data?.status || "pending";
          return (
            <div key={phase.key} className="flex items-center">
              <button
                onClick={() => onPhaseClick?.(phase.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  status === "completed" && "bg-green-50 text-green-700 border border-green-200",
                  status === "in_progress" && "bg-orange-50 text-orange-700 border border-orange-200",
                  status === "pending" && "bg-stone-50 text-stone-500 border border-stone-200",
                  status === "skipped" && "bg-stone-50 text-stone-400 border border-stone-100",
                )}
                title={`${phase.label}: ${phase.description}`}
              >
                {status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                {status === "in_progress" && <Loader2 className="w-3 h-3 animate-spin" />}
                {(status === "pending" || status === "skipped") && <Circle className="w-3 h-3" />}
                {phase.label}
              </button>
              {idx < PHASES.length - 1 && (
                <div className={cn(
                  "w-4 h-0.5 mx-0.5",
                  status === "completed" ? "bg-green-300" : "bg-stone-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-700">Fase de Marketing</h3>
        <span className="text-xs text-stone-500">
          {phaseProgress.completedCount}/{phaseProgress.totalPhases} completadas
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-stone-100 rounded-full mb-5">
        <div
          className="h-2 bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${phaseProgress.progressPercent}%` }}
        />
      </div>

      {/* Phase steps */}
      <div className="flex items-start justify-between gap-2">
        {PHASES.map((phase, idx) => {
          const data = phaseMap.get(phase.key);
          const status = data?.status || "pending";
          const styles = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.pending;
          const Icon = phase.icon;

          return (
            <div key={phase.key} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {idx > 0 && (
                <div className={cn(
                  "absolute top-5 -left-1/2 w-full h-0.5",
                  status === "completed" || (phaseMap.get(PHASES[idx - 1].key)?.status === "completed")
                    ? "bg-green-300"
                    : "bg-stone-200"
                )} style={{ zIndex: 0 }} />
              )}

              {/* Circle */}
              <button
                onClick={() => onPhaseClick?.(phase.key)}
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full ring-2 flex items-center justify-center transition-all hover:scale-110",
                  styles.ring
                )}
              >
                {status === "completed" ? (
                  <CheckCircle2 className={cn("w-5 h-5", styles.icon)} />
                ) : status === "in_progress" ? (
                  <Icon className={cn("w-5 h-5", styles.icon)} />
                ) : (
                  <Icon className={cn("w-5 h-5", styles.icon)} />
                )}
              </button>

              {/* Label */}
              <span className={cn("text-[11px] font-medium mt-2 text-center", styles.label)}>
                {phase.label}
              </span>
              <span className="text-[9px] text-stone-400 text-center mt-0.5 line-clamp-2 max-w-[80px]">
                {phase.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
