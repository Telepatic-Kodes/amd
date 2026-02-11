"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Brain,
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  Archive,
  Target,
  Calendar,
  Search,
  Megaphone,
  Mail,
  ChevronRight,
  BarChart3,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { StrategyGoalInput } from "@/components/strategy/StrategyGoalInput";
import { StrategyExecutionMonitor } from "@/components/strategy/StrategyExecutionMonitor";
import { StrategyPerformancePanel } from "@/components/strategy/StrategyPerformancePanel";

// Status config
const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  generating: { icon: Loader2, color: "text-amber-600", bgColor: "bg-amber-50", label: "Generando" },
  ready: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50", label: "Lista" },
  executing: { icon: Zap, color: "text-orange-600", bgColor: "bg-orange-50", label: "Ejecutando" },
  paused: { icon: Pause, color: "text-stone-500", bgColor: "bg-stone-50", label: "Pausada" },
  completed: { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", label: "Completada" },
  failed: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Fallida" },
};

function StrategyStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.failed;
  const Icon = config.icon;
  const isSpinning = status === "generating" || status === "executing";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <Icon className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

function ProgressRing({ completed, total, size = 48 }: { completed: number; total: number; size?: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ea580c"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-stone-900">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const { success, error: toastError } = useToast();
  const [selectedStrategyId, setSelectedStrategyId] = useState<Id<"marketingStrategies"> | null>(null);
  const [view, setView] = useState<"overview" | "detail">("overview");

  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const strategies = useQuery(api.cmoEngine.listStrategies);
  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);

  const startExecution = useMutation(api.cmoEngine.startExecution);
  const pauseStrategy = useMutation(api.cmoEngine.pauseStrategy);
  const resumeStrategy = useMutation(api.cmoEngine.resumeStrategy);
  const archiveStrategy = useMutation(api.cmoEngine.archiveStrategy);

  const selectedStrategy = selectedStrategyId || activeStrategy?._id;
  const selectedDoc = strategies?.find((s) => s._id === selectedStrategy);

  // Strategy stats
  const stats = useMemo(() => {
    if (!strategies) return { total: 0, active: 0, completed: 0, totalTasks: 0 };
    return {
      total: strategies.length,
      active: strategies.filter((s) => ["generating", "ready", "executing", "paused"].includes(s.status)).length,
      completed: strategies.filter((s) => s.status === "completed").length,
      totalTasks: strategies.reduce((sum, s) => sum + (s.totalTasks || 0), 0),
    };
  }, [strategies]);

  const isProfileComplete = brandProfile?.status === "complete";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-orange-600" />
            <h1 className="text-base font-semibold text-stone-900">Marketing Autopilot</h1>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Define objetivos, genera estrategias y monitorea la ejecución autónoma
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view === "detail" && (
            <button
              onClick={() => { setView("overview"); setSelectedStrategyId(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Ver todas
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-stone-500">Total Estrategias</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-stone-500">Activas</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-stone-500">Completadas</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.completed}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-stone-500">Tareas Totales</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.totalTasks}</p>
        </div>
      </div>

      {/* Goal Input — Natural Language Strategy Launcher */}
      {isProfileComplete && brandProfile && (
        <StrategyGoalInput brandProfileId={brandProfile._id} />
      )}

      {!isProfileComplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-stone-900">Perfil de marca incompleto</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Completa tu{" "}
              <a href="/brand" className="text-orange-600 hover:underline font-medium">
                perfil de marca
              </a>{" "}
              para poder generar estrategias con el Marketing Autopilot.
            </p>
          </div>
        </div>
      )}

      {/* Active Strategy Detail or Strategy List */}
      {view === "detail" && selectedDoc ? (
        <div className="space-y-4">
          {/* Strategy Header Card */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StrategyStatusBadge status={selectedDoc.status} />
                  {selectedDoc.goal && (
                    <span className="text-xs text-stone-400">
                      Objetivo: <span className="text-stone-600 font-medium">{selectedDoc.goal}</span>
                    </span>
                  )}
                </div>
                {selectedDoc.strategy?.summary && (
                  <p className="text-sm text-stone-600">{selectedDoc.strategy.summary}</p>
                )}
                <p className="text-[10px] text-stone-400 mt-2">
                  Creada {new Date(selectedDoc.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedDoc.status === "ready" && (
                  <button
                    onClick={async () => {
                      try {
                        await startExecution({ strategyDocId: selectedDoc._id });
                        success("Ejecución iniciada", "Los agentes comenzaron a trabajar");
                      } catch (err: unknown) {
                        toastError("Error", err instanceof Error ? err.message : "Error");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Ejecutar
                  </button>
                )}
                {selectedDoc.status === "executing" && (
                  <button
                    onClick={async () => {
                      try {
                        await pauseStrategy({ strategyDocId: selectedDoc._id });
                        success("Pausada", "Estrategia pausada");
                      } catch (err: unknown) {
                        toastError("Error", err instanceof Error ? err.message : "Error");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pausar
                  </button>
                )}
                {selectedDoc.status === "paused" && (
                  <button
                    onClick={async () => {
                      try {
                        await resumeStrategy({ strategyDocId: selectedDoc._id });
                        success("Reanudada", "Agentes retomando trabajo");
                      } catch (err: unknown) {
                        toastError("Error", err instanceof Error ? err.message : "Error");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Reanudar
                  </button>
                )}
                {(selectedDoc.status === "completed" || selectedDoc.status === "paused" || selectedDoc.status === "ready") && (
                  <button
                    onClick={async () => {
                      try {
                        await archiveStrategy({ strategyDocId: selectedDoc._id });
                        success("Archivada", "Estrategia archivada correctamente");
                        setView("overview");
                        setSelectedStrategyId(null);
                      } catch (err: unknown) {
                        toastError("Error", err instanceof Error ? err.message : "Error");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archivar
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4">
              <ProgressRing
                completed={selectedDoc.completedTasks || 0}
                total={selectedDoc.totalTasks || 0}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    {selectedDoc.completedTasks || 0} de {selectedDoc.totalTasks || 0} tareas
                  </span>
                  <span className="text-stone-400">
                    {selectedDoc.failedTasks || 0} fallidas
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(selectedDoc.totalTasks || 0) > 0 ? ((selectedDoc.completedTasks || 0) / (selectedDoc.totalTasks || 0)) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-red-400 transition-all duration-500"
                    style={{ width: `${(selectedDoc.totalTasks || 0) > 0 ? ((selectedDoc.failedTasks || 0) / (selectedDoc.totalTasks || 0)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Content: Pillars + Calendar */}
          {selectedDoc.strategy && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <h3 className="text-xs font-medium text-stone-700">Pilares de Contenido</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDoc.strategy.contentPillars.map((pillar) => (
                    <div key={pillar.name} className="rounded-lg border border-stone-200 bg-white p-3 hover:shadow-sm transition-shadow">
                      <h4 className="text-xs font-semibold text-stone-900 mb-1">{pillar.name}</h4>
                      <p className="text-[10px] text-stone-500 mb-2 line-clamp-2">{pillar.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pillar.channels.map((ch) => (
                          <span key={ch} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-50 text-orange-600">{ch}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <h3 className="text-xs font-medium text-stone-700">Calendario Semanal</h3>
                </div>
                <div className="rounded-lg border border-stone-200 bg-white p-3">
                  {selectedDoc.strategy.weeklyCalendar.map((entry, i) => (
                    <div key={`${entry.dayOfWeek}-${i}`} className="flex items-start gap-2 py-1.5 border-b border-stone-100 last:border-0">
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Strategy sub-sections: SEO + Ads + Email */}
          {selectedDoc.strategy && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {selectedDoc.strategy.seoStrategy && (
                <div className="rounded-lg border border-stone-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-3.5 w-3.5 text-green-600" />
                    <h4 className="text-xs font-medium text-stone-700">SEO</h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDoc.strategy.seoStrategy.primaryKeywords.slice(0, 5).map((kw) => (
                      <span key={kw} className="px-1.5 py-0.5 rounded text-[9px] bg-green-50 text-green-700">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedDoc.strategy.adStrategy && (
                <div className="rounded-lg border border-stone-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="h-3.5 w-3.5 text-orange-600" />
                    <h4 className="text-xs font-medium text-stone-700">Ads</h4>
                  </div>
                  {selectedDoc.strategy.adStrategy.budgetSplit.map((bs) => (
                    <div key={bs.platform} className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-stone-600">{bs.platform}</span>
                      <span className="text-[10px] text-stone-500">{bs.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedDoc.strategy.emailStrategy && (
                <div className="rounded-lg border border-stone-200 bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    <h4 className="text-xs font-medium text-stone-700">Email</h4>
                  </div>
                  {selectedDoc.strategy.emailStrategy.sequences.map((seq) => (
                    <p key={seq} className="text-[10px] text-stone-600 flex items-center gap-1 mb-0.5">
                      <ChevronRight className="h-2.5 w-2.5 text-stone-300" />
                      {seq}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Real-time Execution Monitor */}
          {selectedDoc.strategyId && (
            <StrategyExecutionMonitor strategyId={selectedDoc.strategyId} />
          )}

          {/* Performance Panel */}
          <StrategyPerformancePanel strategyDocId={selectedDoc._id} />
        </div>
      ) : (
        /* Strategy List */
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-stone-700">Historial de Estrategias</h2>
          {!strategies || strategies.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
              <Brain className="h-8 w-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm text-stone-500">
                Aun no has creado ninguna estrategia
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Escribe un objetivo arriba para que el CMO genere tu primera estrategia automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {strategies.map((s) => (
                <button
                  key={s._id}
                  onClick={() => { setSelectedStrategyId(s._id); setView("detail"); }}
                  className="w-full rounded-lg border border-stone-200 bg-white p-4 hover:border-orange-200 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StrategyStatusBadge status={s.status} />
                      {s.goal && (
                        <span className="text-xs text-stone-600 font-medium truncate max-w-xs">{s.goal}</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                  {s.strategy?.summary && (
                    <p className="text-xs text-stone-500 line-clamp-2 mb-2">{s.strategy.summary}</p>
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-stone-400">
                    <span>{s.totalTasks || 0} tareas</span>
                    <span>{s.completedTasks || 0} completadas</span>
                    {(s.failedTasks || 0) > 0 && (
                      <span className="text-red-400">{s.failedTasks} fallidas</span>
                    )}
                    <span>
                      {new Date(s.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                    </span>
                    {/* Mini progress */}
                    <div className="flex-1 max-w-[100px]">
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(s.totalTasks || 0) > 0 ? ((s.completedTasks || 0) / (s.totalTasks || 0)) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-red-400"
                          style={{ width: `${(s.totalTasks || 0) > 0 ? ((s.failedTasks || 0) / (s.totalTasks || 0)) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
