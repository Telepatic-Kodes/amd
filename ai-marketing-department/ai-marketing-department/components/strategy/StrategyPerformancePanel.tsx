"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  BarChart3,
  TrendingUp,
  Coins,
  FileText,
  Zap,
  Timer,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-100 bg-stone-50/50">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm font-bold text-stone-900">{value}</p>
        {subValue && <p className="text-[10px] text-stone-400">{subValue}</p>}
      </div>
    </div>
  );
}

function TimelineEvent({ event }: { event: { timestamp: number; title: string; status: string } }) {
  const isSuccess = event.status === "completed";
  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isSuccess ? "bg-green-400" : "bg-red-400"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-stone-600 truncate">{event.title}</p>
        <p className="text-[9px] text-stone-400">
          {new Date(event.timestamp).toLocaleTimeString("es-CL", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          — {new Date(event.timestamp).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
        </p>
      </div>
    </div>
  );
}

interface StrategyPerformancePanelProps {
  strategyDocId: Id<"marketingStrategies">;
}

export function StrategyPerformancePanel({ strategyDocId }: StrategyPerformancePanelProps) {
  const performance = useQuery(api.cmoEngine.getStrategyPerformance, { strategyDocId });

  if (!performance) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-5 animate-pulse">
        <div className="h-4 bg-stone-100 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="h-20 bg-stone-50 rounded" />
          <div className="h-20 bg-stone-50 rounded" />
          <div className="h-20 bg-stone-50 rounded" />
          <div className="h-20 bg-stone-50 rounded" />
        </div>
      </div>
    );
  }

  const avgDurationStr = performance.execution.avgDuration > 0
    ? `${(performance.execution.avgDuration / 1000).toFixed(1)}s promedio`
    : "—";

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-medium text-stone-900">Rendimiento de Estrategia</h3>
      </div>

      {/* Goal indicator */}
      {performance.goal && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
          <Target className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-stone-900">Objetivo</p>
            <p className="text-xs text-stone-600">{performance.goal}</p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Zap}
          label="Ejecuciones"
          value={String(performance.execution.totalExecutions)}
          subValue={`${performance.execution.successRate.toFixed(0)}% éxito`}
          color="bg-orange-100 text-orange-600"
        />
        <MetricCard
          icon={Coins}
          label="Costo Total"
          value={`$${performance.execution.totalCost.toFixed(2)}`}
          subValue={`${(performance.execution.totalTokens / 1000).toFixed(0)}K tokens`}
          color="bg-amber-100 text-amber-600"
        />
        <MetricCard
          icon={FileText}
          label="Contenido"
          value={String(performance.content.total)}
          subValue={`${performance.content.published} publicado`}
          color="bg-blue-100 text-blue-600"
        />
        <MetricCard
          icon={Timer}
          label="Duracion Promedio"
          value={avgDurationStr}
          color="bg-stone-100 text-stone-600"
        />
      </div>

      {/* Task Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task status breakdown */}
        <div>
          <h4 className="text-xs font-medium text-stone-700 mb-2">Desglose de Tareas</h4>
          <div className="space-y-1.5">
            {[
              { label: "Completadas", count: performance.tasks.completed, color: "bg-green-500", icon: CheckCircle2 },
              { label: "Ejecutando", count: performance.tasks.running, color: "bg-orange-500", icon: Zap },
              { label: "Pendientes", count: performance.tasks.pending, color: "bg-stone-300", icon: Timer },
              { label: "Fallidas", count: performance.tasks.failed, color: "bg-red-400", icon: XCircle },
            ].map(({ label, count, color, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`h-3 w-3 ${color === "bg-green-500" ? "text-green-500" : color === "bg-orange-500" ? "text-orange-500" : color === "bg-red-400" ? "text-red-400" : "text-stone-400"}`} />
                <span className="text-[10px] text-stone-600 w-20">{label}</span>
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${performance.tasks.total > 0 ? (count / performance.tasks.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 tabular-nums w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-xs font-medium text-stone-700 mb-2">Actividad Reciente</h4>
          {performance.timeline.length > 0 ? (
            <div className="max-h-[150px] overflow-y-auto space-y-0.5">
              {performance.timeline.slice(-10).reverse().map((event, i) => (
                <TimelineEvent key={i} event={event} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-xs text-stone-400">
              Sin actividad aún
            </div>
          )}
        </div>
      </div>

      {/* Duration */}
      {performance.createdAt && (
        <div className="pt-2 border-t border-stone-100 flex items-center gap-4 text-[10px] text-stone-400">
          <span>
            Iniciada: {new Date(performance.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
          {performance.completedAt && (
            <span>
              Completada: {new Date(performance.completedAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {performance.createdAt && performance.completedAt && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5" />
              Duracion total: {((performance.completedAt - performance.createdAt) / 60000).toFixed(0)} min
            </span>
          )}
        </div>
      )}
    </div>
  );
}
