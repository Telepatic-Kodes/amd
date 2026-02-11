"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Brain,
  Calendar,
  Target,
  Search,
  Mail,
  Megaphone,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Pause,
  Play,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// Department color map
const DEPT_COLORS: Record<string, string> = {
  content: "bg-blue-100 text-blue-700",
  social: "bg-purple-100 text-purple-700",
  demandgen: "bg-orange-100 text-orange-700",
  seo: "bg-green-100 text-green-700",
  ops: "bg-amber-100 text-amber-700",
  brand: "bg-pink-100 text-pink-700",
  leadership: "bg-stone-100 text-stone-700",
  unknown: "bg-stone-100 text-stone-500",
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    generating: { icon: Loader2, color: "text-amber-500", label: "Generando" },
    ready: { icon: Clock, color: "text-blue-500", label: "Lista" },
    executing: { icon: Loader2, color: "text-orange-500", label: "Ejecutando" },
    paused: { icon: Pause, color: "text-stone-400", label: "Pausada" },
    completed: { icon: CheckCircle2, color: "text-green-500", label: "Completada" },
    failed: { icon: XCircle, color: "text-red-500", label: "Fallida" },
  };

  const c = config[status] || config.failed;
  const Icon = c.icon;
  const isSpinning = status === "generating" || status === "executing";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.color}`}>
      <Icon className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`} />
      {c.label}
    </span>
  );
}

// Progress bar
function ProgressBar({ completed, failed, total }: { completed: number; failed: number; total: number }) {
  const successPct = total > 0 ? (completed / total) * 100 : 0;
  const failPct = total > 0 ? (failed / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-stone-500">
        <span>{completed} de {total} tareas completadas</span>
        <span>{Math.round(successPct)}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${successPct}%` }}
        />
        <div
          className="bg-red-400 transition-all duration-500"
          style={{ width: `${failPct}%` }}
        />
      </div>
    </div>
  );
}

// Pillar card
function PillarCard({ pillar }: { pillar: { name: string; description: string; topics: string[]; channels: string[] } }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 hover:shadow-sm transition-shadow">
      <h4 className="text-xs font-semibold text-stone-900 mb-1">{pillar.name}</h4>
      <p className="text-[10px] text-stone-500 mb-2 line-clamp-2">{pillar.description}</p>
      <div className="flex flex-wrap gap-1">
        {pillar.channels.map((ch) => (
          <span key={ch} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-50 text-orange-600">
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

// Calendar day
function CalendarDay({ entry }: { entry: { dayOfWeek: string; contentType: string; channel: string; pillar: string; description: string } }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-stone-100 last:border-0">
      <span className="text-[10px] font-medium text-stone-400 w-14 shrink-0 pt-0.5">
        {entry.dayOfWeek.slice(0, 3)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-700 truncate">{entry.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-stone-400">{entry.channel}</span>
          <span className="text-[9px] text-stone-300">·</span>
          <span className="text-[9px] text-stone-400">{entry.pillar}</span>
        </div>
      </div>
    </div>
  );
}

interface StrategyDashboardProps {
  strategyDocId: Id<"marketingStrategies">;
}

export function StrategyDashboard({ strategyDocId }: StrategyDashboardProps) {
  const { success, error: toastError } = useToast();
  const strategy = useQuery(api.cmoEngine.getStrategy, { strategyDocId });
  const strategyTasks = useQuery(
    api.cmoEngine.getStrategyTasks,
    strategy?.strategyId ? { strategyId: strategy.strategyId } : "skip"
  );

  const startExecution = useMutation(api.cmoEngine.startExecution);
  const pauseStrategy = useMutation(api.cmoEngine.pauseStrategy);
  const resumeStrategy = useMutation(api.cmoEngine.resumeStrategy);

  const taskStats = useMemo(() => {
    if (!strategyTasks) return { byDept: [], total: 0 };
    const depts = Object.entries(strategyTasks).map(([dept, tasks]) => ({
      dept,
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      running: tasks.filter((t) => t.status === "running").length,
      failed: tasks.filter((t) => t.status === "failed").length,
    }));
    return {
      byDept: depts,
      total: depts.reduce((s, d) => s + d.total, 0),
    };
  }, [strategyTasks]);

  if (!strategy) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-stone-100 rounded w-1/3 mb-4" />
        <div className="h-20 bg-stone-50 rounded" />
      </div>
    );
  }

  // Generating state
  if (strategy.status === "generating") {
    return (
      <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/60 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <Brain className="h-5 w-5 text-orange-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">CMO analizando tu marca...</h2>
            <p className="text-xs text-stone-500">Generando estrategia de marketing personalizada. Esto toma ~30 segundos.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          <span className="text-xs text-orange-600">Generando pilares de contenido, calendario, ads, SEO y email...</span>
        </div>
      </div>
    );
  }

  // Failed state
  if (strategy.status === "failed") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Error al generar estrategia</h2>
            <p className="text-xs text-stone-500">Hubo un problema. Puedes intentar nuevamente desde el boton de activar.</p>
          </div>
        </div>
      </div>
    );
  }

  const data = strategy.strategy;

  return (
    <div className="space-y-4">
      {/* Header with status + controls */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-orange-600" />
            <h2 className="text-sm font-semibold text-stone-900">Marketing Autopilot</h2>
            <StatusBadge status={strategy.status} />
          </div>
          <div className="flex items-center gap-2">
            {strategy.status === "ready" && (
              <button
                onClick={async () => {
                  try {
                    await startExecution({ strategyDocId });
                    success("Ejecucion iniciada", "Los agentes comenzaron a trabajar en la estrategia");
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Error";
                    toastError("Error", msg);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                Ejecutar
              </button>
            )}
            {strategy.status === "executing" && (
              <button
                onClick={async () => {
                  try {
                    await pauseStrategy({ strategyDocId });
                    success("Estrategia pausada", "Puedes reanudarla en cualquier momento");
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Error";
                    toastError("Error", msg);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                Pausar
              </button>
            )}
            {strategy.status === "paused" && (
              <button
                onClick={async () => {
                  try {
                    await resumeStrategy({ strategyDocId });
                    success("Estrategia reanudada", "Los agentes retoman el trabajo");
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Error";
                    toastError("Error", msg);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                Reanudar
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {data?.summary && (
          <p className="text-xs text-stone-600 mb-3">{data.summary}</p>
        )}

        {/* Progress bar */}
        <ProgressBar
          completed={strategy.completedTasks || 0}
          failed={strategy.failedTasks || 0}
          total={strategy.totalTasks || 0}
        />
      </div>

      {/* Strategy content: Pillars + Calendar */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Content Pillars (3/5) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className="text-xs font-medium text-stone-700">Pilares de Contenido</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.contentPillars.map((pillar) => (
                <PillarCard key={pillar.name} pillar={pillar} />
              ))}
            </div>
          </div>

          {/* Weekly Calendar (2/5) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-green-500" />
              <h3 className="text-xs font-medium text-stone-700">Calendario Semanal</h3>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              {data.weeklyCalendar.map((entry, i) => (
                <CalendarDay key={`${entry.dayOfWeek}-${i}`} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strategy sections: SEO + Ads + Email */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* SEO Strategy */}
          {data.seoStrategy && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-3.5 w-3.5 text-green-600" />
                <h4 className="text-xs font-medium text-stone-700">Estrategia SEO</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Keywords prioritarias</p>
                  <div className="flex flex-wrap gap-1">
                    {data.seoStrategy.primaryKeywords.slice(0, 5).map((kw) => (
                      <span key={kw} className="px-1.5 py-0.5 rounded text-[9px] bg-green-50 text-green-700">{kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Gaps de contenido</p>
                  {data.seoStrategy.contentGaps.slice(0, 3).map((gap) => (
                    <p key={gap} className="text-[10px] text-stone-600 flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5 text-stone-300" />
                      {gap}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ad Strategy */}
          {data.adStrategy && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-3.5 w-3.5 text-orange-600" />
                <h4 className="text-xs font-medium text-stone-700">Estrategia de Ads</h4>
              </div>
              <div className="space-y-2">
                {data.adStrategy.budgetSplit.map((bs) => (
                  <div key={bs.platform} className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-600">{bs.platform}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${bs.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 w-8 text-right">{bs.percentage}%</span>
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <p className="text-[10px] text-stone-400">Objetivos</p>
                  {data.adStrategy.objectives.map((obj) => (
                    <p key={obj} className="text-[10px] text-stone-600 flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5 text-stone-300" />
                      {obj}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Strategy */}
          {data.emailStrategy && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-3.5 w-3.5 text-amber-600" />
                <h4 className="text-xs font-medium text-stone-700">Estrategia Email</h4>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Secuencias</p>
                  {data.emailStrategy.sequences.map((seq) => (
                    <p key={seq} className="text-[10px] text-stone-600 flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5 text-stone-300" />
                      {seq}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] text-stone-400">Frecuencia: {data.emailStrategy.frequency}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Segmentos</p>
                  <div className="flex flex-wrap gap-1">
                    {data.emailStrategy.segments.map((seg) => (
                      <span key={seg} className="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-700">{seg}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Execution Tracker by Department */}
      {strategyTasks && taskStats.byDept.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h3 className="text-xs font-medium text-stone-700 mb-3">Ejecucion por Departamento</h3>
          <div className="space-y-2">
            {taskStats.byDept.map(({ dept, total, completed, running, failed }) => (
              <div key={dept} className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${DEPT_COLORS[dept] || DEPT_COLORS.unknown}`}>
                  {dept}
                </span>
                <div className="flex-1">
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500"
                      style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-orange-400"
                      style={{ width: `${total > 0 ? (running / total) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-red-400"
                      style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 tabular-nums w-12 text-right">
                  {completed}/{total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
