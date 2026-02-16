"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import Link from "next/link";
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
  ChevronLeft,
  BarChart3,
  Zap,
  AlertCircle,
  Palette,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles,
  Eye,
  ListChecks,
  LayoutGrid,
  Timer,
  Layers,
  ArrowRight,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { StrategyGoalInput } from "@/components/strategy/StrategyGoalInput";
import { StrategyExecutionMonitor } from "@/components/strategy/StrategyExecutionMonitor";
import { StrategyPerformancePanel } from "@/components/strategy/StrategyPerformancePanel";
import { PhaseProgress } from "@/components/strategy/PhaseProgress";
import { ContentPillarsPanel } from "@/components/strategy/ContentPillarsPanel";
import { PillarPerformance } from "@/components/strategy/PillarPerformance";
import { FunnelCoverage } from "@/components/strategy/FunnelCoverage";
import { TAYACoverage } from "@/components/strategy/TAYACoverage";
import { StrategyInsightsPanel } from "@/components/strategy/StrategyInsightsPanel";
import { StrategyControls } from "@/components/strategy/StrategyControls";
import { StrategyTasksBreakdown } from "@/components/strategy/StrategyTasksBreakdown";
import { BrandProfileSummary } from "@/components/brand/BrandProfileSummary";
import { BrandMaturityBar } from "@/components/brand/BrandMaturityBar";
import { BrandAuditPanel } from "@/components/brand/BrandAuditPanel";

type StrategyTab = "autopilot" | "brand" | "insights";
type DetailTab = "overview" | "tasks" | "performance";
type StrategyDoc = NonNullable<ReturnType<typeof useQuery<typeof api.cmoEngine.listStrategies>>>[number];

/* ─── Status config ─── */
const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string; dotColor: string; ringColor: string }> = {
  generating: { icon: Loader2, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", label: "Generando", dotColor: "bg-amber-400", ringColor: "ring-amber-400" },
  ready: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", label: "Lista", dotColor: "bg-blue-400", ringColor: "ring-blue-400" },
  executing: { icon: Zap, color: "text-[var(--accent)]", bgColor: "bg-[var(--accent-subtle)] border-orange-200", label: "Ejecutando", dotColor: "bg-orange-400", ringColor: "ring-orange-400" },
  paused: { icon: Pause, color: "text-[var(--text-tertiary)]", bgColor: "bg-[var(--surface-1)] border-[var(--border)]", label: "Pausada", dotColor: "bg-[var(--text-tertiary)]", ringColor: "ring-[var(--text-tertiary)]" },
  completed: { icon: CheckCircle2, color: "text-[var(--success)]", bgColor: "bg-[var(--badge-green-bg)] border-[var(--badge-green-bg)]", label: "Completada", dotColor: "bg-emerald-400", ringColor: "ring-emerald-400" },
  failed: { icon: XCircle, color: "text-red-600", bgColor: "bg-[var(--badge-red-bg)] border-[var(--badge-red-bg)]", label: "Fallida", dotColor: "bg-[var(--error)]", ringColor: "ring-red-400" },
};

const strategyTabs: { key: StrategyTab; label: string; icon: typeof Brain; desc: string }[] = [
  { key: "autopilot", label: "Autopilot", icon: Rocket, desc: "Estrategias IA" },
  { key: "brand", label: "Marca", icon: Palette, desc: "Identidad" },
  { key: "insights", label: "Insights", icon: BarChart3, desc: "Análisis" },
];

/* ─── Reusable micro-components ─── */

function StrategyStatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.failed;
  const Icon = config.icon;
  const isSpinning = status === "generating" || status === "executing";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium border",
      config.color, config.bgColor,
      size === "lg" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]"
    )}>
      <Icon className={cn(size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3", isSpinning && "animate-spin")} />
      {config.label}
    </span>
  );
}

function ProgressRing({ completed, total, size = 56, strokeWidth = 4 }: { completed: number; total: number; size?: number; strokeWidth?: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? "#059669" : pct >= 60 ? "#ea580c" : pct > 0 ? "#d97706" : "#d6d3d1";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f5f5f4" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function MiniProgressBar({ completed, total, failed = 0 }: { completed: number; total: number; failed?: number }) {
  const cPct = total > 0 ? (completed / total) * 100 : 0;
  const fPct = total > 0 ? (failed / total) * 100 : 0;
  return (
    <div className="h-1.5 bg-[var(--surface-1)] rounded-full overflow-hidden flex w-full">
      <div className="bg-emerald-500 transition-all duration-500 rounded-l-full" style={{ width: `${cPct}%` }} />
      {fPct > 0 && <div className="bg-[var(--error)] transition-all duration-500" style={{ width: `${fPct}%` }} />}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count, action }: { icon: typeof Brain; title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <div className="p-1 rounded-md bg-[var(--surface-1)]">
          <Icon className="h-3.5 w-3.5 text-orange-500" />
        </div>
        {title}
        {count !== undefined && (
          <span className="text-[10px] font-normal text-[var(--text-tertiary)] bg-[var(--surface-1)] px-1.5 py-0.5 rounded-full">{count}</span>
        )}
      </h3>
      {action}
    </div>
  );
}

function StatMini({ label, value, sub, color = "text-[var(--text-primary)]" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-lg font-bold tabular-nums leading-none", color)}>{value}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{label}</p>
      {sub && <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(ts).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function StrategyPage() {
  const { success, error: toastError } = useToast();
  const [selectedStrategyId, setSelectedStrategyId] = useState<Id<"marketingStrategies"> | null>(null);
  const [view, setView] = useState<"overview" | "detail">("overview");
  const [activeStrategyTab, setActiveStrategyTab] = useState<StrategyTab>("autopilot");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const strategies = useQuery(api.cmoEngine.listStrategies);
  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);
  const brandMaturity = useQuery(api.brandMaturity.computeBrandMaturity);

  const startExecution = useMutation(api.cmoEngine.startExecution);
  const pauseStrategy = useMutation(api.cmoEngine.pauseStrategy);
  const resumeStrategy = useMutation(api.cmoEngine.resumeStrategy);
  const archiveStrategy = useMutation(api.cmoEngine.archiveStrategy);

  const selectedStrategy = selectedStrategyId || activeStrategy?._id;
  const selectedDoc = strategies?.find((s: StrategyDoc) => s._id === selectedStrategy);
  const isProfileComplete = brandProfile?.status === "complete";

  // Aggregate content pillars from all strategies as fallback for ContentPillarsPanel
  const strategyPillars = useMemo(() => {
    if (!strategies) return undefined;
    const pillarsMap = new Map<string, { name: string; description: string; channels: string[] }>();
    for (const s of strategies) {
      if (s.strategy?.contentPillars) {
        for (const p of s.strategy.contentPillars) {
          if (!pillarsMap.has(p.name)) {
            pillarsMap.set(p.name, { name: p.name, description: p.description, channels: p.channels });
          }
        }
      }
    }
    return Array.from(pillarsMap.values());
  }, [strategies]);

  const stats = useMemo(() => {
    if (!strategies || strategies.length === 0) return null;
    const active = strategies.filter((s: StrategyDoc) => ["generating", "ready", "executing", "paused"].includes(s.status)).length;
    const completed = strategies.filter((s: StrategyDoc) => s.status === "completed").length;
    const failed = strategies.filter((s: StrategyDoc) => s.status === "failed").length;
    const totalTasks = strategies.reduce((sum: number, s: StrategyDoc) => sum + (s.totalTasks || 0), 0);
    const completedTasks = strategies.reduce((sum: number, s: StrategyDoc) => sum + (s.completedTasks || 0), 0);
    const failedTasks = strategies.reduce((sum: number, s: StrategyDoc) => sum + (s.failedTasks || 0), 0);
    const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { total: strategies.length, active, completed, failed, totalTasks, completedTasks, failedTasks, successRate };
  }, [strategies]);

  function openDetail(id: Id<"marketingStrategies">) {
    setSelectedStrategyId(id);
    setView("detail");
    setDetailTab("overview");
  }

  async function handleAction(action: "start" | "pause" | "resume" | "archive", doc: typeof selectedDoc) {
    if (!doc) return;
    try {
      if (action === "start") {
        await startExecution({ strategyDocId: doc._id });
        success("Ejecución iniciada", "Los agentes comenzaron a trabajar");
      } else if (action === "pause") {
        await pauseStrategy({ strategyDocId: doc._id });
        success("Pausada", "Estrategia pausada correctamente");
      } else if (action === "resume") {
        await resumeStrategy({ strategyDocId: doc._id });
        success("Reanudada", "Agentes retomando trabajo");
      } else if (action === "archive") {
        await archiveStrategy({ strategyDocId: doc._id });
        success("Archivada", "Estrategia archivada");
        setView("overview");
        setSelectedStrategyId(null);
      }
    } catch (err: unknown) {
      toastError("Error", err instanceof Error ? err.message : "Error desconocido");
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Estrategia</h1>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              CMO Autopilot · Marca · Insights estratégicos
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {activeStrategyTab === "autopilot" && view === "detail" && (
            <button
              onClick={() => { setView("overview"); setSelectedStrategyId(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Volver
            </button>
          )}
          {stats && stats.active > 0 && view === "overview" && activeStrategy && (
            <button
              onClick={() => openDetail(activeStrategy._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors shadow-sm"
            >
              <Activity className="h-3.5 w-3.5" />
              Estrategia activa
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] w-fit">
        {strategyTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveStrategyTab(key); if (key !== "autopilot") { setView("overview"); } }}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all",
              activeStrategyTab === key
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          AUTOPILOT TAB
         ════════════════════════════════════════════ */}
      {activeStrategyTab === "autopilot" && (
        <>
          {view === "detail" && selectedDoc ? (
            /* ═══ DETAIL VIEW ═══ */
            <StrategyDetailView
              doc={selectedDoc}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              onAction={handleAction}
            />
          ) : (
            /* ═══ OVERVIEW ═══ */
            <>
              {/* How it works — always visible, most useful for new users */}
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Como funciona:</span> Escribes un objetivo de marketing → el CMO genera pilares de contenido, calendario semanal y tareas → los 37 agentes IA ejecutan la estrategia automaticamente.
                </p>
              </div>

              {/* Goal Input or Brand CTA */}
              {brandProfile === undefined ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-8 animate-pulse">
                  <div className="h-5 w-48 bg-[var(--surface-1)] rounded mb-3" />
                  <div className="h-10 w-full bg-[var(--surface-1)] rounded-lg" />
                </div>
              ) : brandProfile ? (
                <StrategyGoalInput brandProfileId={brandProfile._id} />
              ) : (
                <BrandSetupCTA />
              )}

              {/* Active Strategy Spotlight — only when there's an active one */}
              {activeStrategy && !["failed", "completed"].includes(activeStrategy.status) && (
                <ActiveStrategySpotlight
                  strategy={activeStrategy}
                  onViewDetail={() => openDetail(activeStrategy._id)}
                />
              )}

              {/* KPI strip — only show when there's data */}
              {stats && <KPIStrip stats={stats} />}

              {/* Phase Progress — shows when brand profile exists (returns null if no phases) */}
              {brandProfile && <PhaseProgress />}

              <StrategyHistoryList
                strategies={strategies}
                onSelect={openDetail}
              />
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════
          BRAND TAB
         ════════════════════════════════════════════ */}
      {activeStrategyTab === "brand" && (
        <BrandTabContent
          brandProfile={brandProfile}
          brandMaturity={brandMaturity}
        />
      )}

      {/* ════════════════════════════════════════════
          INSIGHTS TAB
         ════════════════════════════════════════════ */}
      {activeStrategyTab === "insights" && (
        <InsightsTabContent
          brandProfile={brandProfile}
          isProfileComplete={isProfileComplete}
          strategyPillars={strategyPillars}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE STRATEGY SPOTLIGHT
   ═══════════════════════════════════════════════════ */

function ActiveStrategySpotlight({ strategy, onViewDetail }: {
  strategy: { _id: Id<"marketingStrategies">; status: string; goal?: string; completedTasks?: number; totalTasks?: number; failedTasks?: number; strategy?: { summary?: string }; createdAt: number };
  onViewDetail: () => void;
}) {
  const pct = (strategy.totalTasks || 0) > 0
    ? Math.round(((strategy.completedTasks || 0) / (strategy.totalTasks || 0)) * 100) : 0;

  return (
    <div className="relative rounded-xl border border-orange-200/80 overflow-hidden group">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-white to-amber-50/30" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-100/30 to-transparent rounded-bl-full" />

      {/* Animated side accent */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-r",
        strategy.status === "executing" ? "bg-[var(--accent)]" : "bg-blue-500"
      )} />

      <div className="relative p-5 pl-6">
        <div className="flex items-start gap-5">
          {/* Left: Progress ring */}
          <div className="shrink-0">
            <ProgressRing completed={strategy.completedTasks || 0} total={strategy.totalTasks || 0} size={72} strokeWidth={5} />
          </div>

          {/* Center: Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wider">Estrategia Activa</span>
              <StrategyStatusBadge status={strategy.status} />
              {strategy.status === "executing" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                </span>
              )}
            </div>

            {strategy.goal && (
              <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1 mb-1">{strategy.goal}</p>
            )}
            {strategy.strategy?.summary && (
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{strategy.strategy.summary}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold text-[var(--text-primary)]">{strategy.completedTasks || 0}</span>
                <span className="text-[var(--text-tertiary)]">completadas</span>
              </div>
              {(strategy.failedTasks || 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <XCircle className="h-3.5 w-3.5 text-[var(--error)]" />
                  <span className="font-semibold text-red-600">{strategy.failedTasks}</span>
                  <span className="text-[var(--text-tertiary)]">fallidas</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs">
                <Timer className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-tertiary)]">{formatRelativeDate(strategy.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={onViewDetail}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-all shadow-sm hover:shadow group-hover:scale-[1.02]"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver detalle
            </button>
            <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
              {pct}% progreso
            </span>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="mt-4">
          <MiniProgressBar
            completed={strategy.completedTasks || 0}
            total={strategy.totalTasks || 0}
            failed={strategy.failedTasks || 0}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   KPI STRIP
   ═══════════════════════════════════════════════════ */

function KPIStrip({ stats }: { stats: { total: number; active: number; completed: number; failed: number; totalTasks: number; completedTasks: number; failedTasks: number; successRate: number } }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Estrategias creadas",
          value: stats.total,
          icon: Rocket,
          color: "text-orange-500",
          bgColor: "bg-[var(--accent-subtle)]",
          desc: stats.active > 0 ? `${stats.active} en ejecucion ahora` : "Ninguna activa",
          descColor: stats.active > 0 ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]",
        },
        {
          label: "Finalizadas con exito",
          value: stats.completed,
          icon: CheckCircle2,
          color: "text-emerald-500",
          bgColor: "bg-[var(--badge-green-bg)]",
          desc: stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% del total` : "—",
          descColor: "text-[var(--success)]",
        },
        {
          label: "Tareas ejecutadas",
          value: stats.totalTasks,
          icon: ListChecks,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          desc: `${stats.completedTasks} completadas · ${stats.failedTasks} con error`,
          descColor: "text-[var(--text-tertiary)]",
        },
        {
          label: "Tasa de exito",
          value: `${stats.successRate}%`,
          icon: TrendingUp,
          color: stats.successRate >= 70 ? "text-emerald-500" : stats.successRate >= 40 ? "text-amber-500" : "text-[var(--error)]",
          bgColor: stats.successRate >= 70 ? "bg-[var(--badge-green-bg)]" : stats.successRate >= 40 ? "bg-amber-50" : "bg-[var(--badge-red-bg)]",
          desc: `${stats.completedTasks} de ${stats.totalTasks} tareas exitosas`,
          descColor: "text-[var(--text-tertiary)]",
        },
      ].map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={cn("p-1.5 rounded-lg", kpi.bgColor)}>
                <Icon className={cn("h-4 w-4", kpi.color)} />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)]">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)] mb-1">{kpi.value}</p>
            <p className={cn("text-[11px]", kpi.descColor)}>{kpi.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BRAND SETUP CTA
   ═══════════════════════════════════════════════════ */

function BrandSetupCTA() {
  return (
    <div className="relative rounded-xl border border-amber-200/80 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-50 via-orange-50/30 to-white" />
      <div className="relative p-6 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-100 shrink-0">
          <Shield className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Configura tu perfil de marca</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3 max-w-lg">
            El CMO Autopilot necesita conocer tu marca para generar estrategias personalizadas.
            Completa la identidad, audiencia, voz y canales para activar la generación automática.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/brand"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors shadow-sm"
            >
              <Palette className="h-3.5 w-3.5" />
              Crear perfil de marca
            </Link>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Identidad</span>
              <ArrowRight className="h-2.5 w-2.5" />
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Audiencia</span>
              <ArrowRight className="h-2.5 w-2.5" />
              <span className="flex items-center gap-1"><Megaphone className="h-3 w-3" /> Canales</span>
              <ArrowRight className="h-2.5 w-2.5" />
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Autopilot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STRATEGY HISTORY LIST
   ═══════════════════════════════════════════════════ */

function StrategyHistoryList({ strategies, onSelect }: {
  strategies: Array<{ _id: Id<"marketingStrategies">; status: string; goal?: string; strategy?: { summary?: string; contentPillars: Array<{ name: string; channels: string[] }> }; totalTasks?: number; completedTasks?: number; failedTasks?: number; createdAt: number }> | undefined;
  onSelect: (id: Id<"marketingStrategies">) => void;
}) {
  if (strategies === undefined) {
    return (
      <div className="space-y-3">
        <SectionHeader icon={Layers} title="Historial de Estrategias" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-20 rounded-full bg-[var(--surface-1)]" />
                <div className="h-4 w-64 rounded bg-[var(--surface-1)]" />
              </div>
              <div className="h-3 w-full rounded bg-[var(--surface-1)]/50 mb-3" />
              <div className="flex gap-4">
                <div className="h-3 w-20 rounded bg-[var(--surface-1)]/50" />
                <div className="h-3 w-24 rounded bg-[var(--surface-1)]/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader icon={Layers} title="Historial" />
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Sin estrategias aún
          </p>
          <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto leading-relaxed">
            Escribe un objetivo de marketing arriba y el CMO generará automáticamente una estrategia con pilares de contenido, calendario semanal y tareas asignadas a los 37 agentes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        icon={Layers}
        title="Estrategias anteriores"
        count={strategies.length}
      />
      <p className="text-xs text-[var(--text-tertiary)] -mt-1">
        Cada estrategia genera pilares de contenido, calendario semanal y tareas para los agentes IA.
      </p>

      <div className="space-y-2">
        {strategies.map((s) => {
          const pct = (s.totalTasks || 0) > 0 ? Math.round(((s.completedTasks || 0) / (s.totalTasks || 0)) * 100) : 0;
          const config = STATUS_CONFIG[s.status] || STATUS_CONFIG.failed;
          const completedTasks = s.completedTasks || 0;
          const totalTasks = s.totalTasks || 0;
          const failedTasks = s.failedTasks || 0;

          return (
            <button
              key={s._id}
              onClick={() => onSelect(s._id)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5 hover:border-orange-200 hover:shadow-sm transition-all text-left group relative overflow-hidden"
            >
              {/* Left status accent */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-r", config.dotColor)} />

              <div className="flex items-start gap-4 pl-3">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StrategyStatusBadge status={s.status} />
                    <span className="text-[10px] text-[var(--text-tertiary)]">{formatRelativeDate(s.createdAt)}</span>
                  </div>
                  {s.goal && (
                    <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-1">{s.goal}</p>
                  )}
                  {s.strategy?.summary && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{s.strategy.summary}</p>
                  )}

                  {/* Bottom metrics — clearer labels */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-[var(--surface-1)] px-2 py-1 rounded-md">
                      <ListChecks className="h-3 w-3 text-purple-500" />
                      <span className="font-medium">{totalTasks}</span> tareas
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--badge-green-text)] bg-[var(--badge-green-bg)] px-2 py-1 rounded-md">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="font-medium">{completedTasks}</span> exitosas
                    </div>
                    {failedTasks > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--badge-red-text)] bg-[var(--badge-red-bg)] px-2 py-1 rounded-md">
                        <XCircle className="h-3 w-3" />
                        <span className="font-medium">{failedTasks}</span> con error
                      </div>
                    )}
                    {s.strategy?.contentPillars && s.strategy.contentPillars.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] bg-[var(--surface-1)] px-2 py-1 rounded-md">
                        <LayoutGrid className="h-3 w-3 text-orange-500" />
                        <span className="font-medium">{s.strategy.contentPillars.length}</span> pilares
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: progress ring + arrow */}
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  {totalTasks > 0 && (
                    <ProgressRing completed={completedTasks} total={totalTasks} size={48} strokeWidth={3.5} />
                  )}
                  <span className="text-[9px] text-[var(--text-tertiary)]">progreso</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STRATEGY DETAIL VIEW
   ═══════════════════════════════════════════════════ */

function StrategyDetailView({ doc, detailTab, setDetailTab, onAction }: {
  doc: StrategyDoc;
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  onAction: (action: "start" | "pause" | "resume" | "archive", doc: StrategyDoc) => void;
}) {
  const pct = (doc.totalTasks || 0) > 0
    ? Math.round(((doc.completedTasks || 0) / (doc.totalTasks || 0)) * 100) : 0;

  const detailTabs: { key: DetailTab; label: string; icon: typeof Brain }[] = [
    { key: "overview", label: "Vista general", icon: LayoutGrid },
    { key: "tasks", label: "Tareas", icon: ListChecks },
    { key: "performance", label: "Rendimiento", icon: BarChart3 },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Detail Header Card ─── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
        {/* Top colored accent */}
        <div className={cn(
          "h-1",
          doc.status === "executing" ? "bg-gradient-to-r from-orange-400 to-amber-400" :
          doc.status === "completed" ? "bg-gradient-to-r from-emerald-400 to-green-400" :
          doc.status === "failed" ? "bg-gradient-to-r from-red-400 to-rose-400" :
          doc.status === "paused" ? "bg-[var(--text-tertiary)]" :
          "bg-gradient-to-r from-blue-400 to-sky-400"
        )} />

        <div className="p-5">
          <div className="flex items-start gap-5">
            {/* Progress ring */}
            <ProgressRing completed={doc.completedTasks || 0} total={doc.totalTasks || 0} size={72} strokeWidth={5} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StrategyStatusBadge status={doc.status} size="lg" />
                {doc.status === "executing" && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                  </span>
                )}
              </div>
              {doc.goal && <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{doc.goal}</p>}
              {doc.strategy?.summary && <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{doc.strategy.summary}</p>}

              <div className="flex items-center gap-5 mt-3 text-xs text-[var(--text-tertiary)]">
                <span className="tabular-nums">{doc.completedTasks || 0}/{doc.totalTasks || 0} tareas ({pct}%)</span>
                {(doc.failedTasks || 0) > 0 && <span className="text-[var(--error)]">{doc.failedTasks} fallidas</span>}
                <span>{formatRelativeDate(doc.createdAt)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="shrink-0 flex items-center gap-2">
              {doc.status === "ready" && (
                <button onClick={() => onAction("start", doc)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors shadow-sm">
                  <Play className="h-3.5 w-3.5" /> Ejecutar
                </button>
              )}
              {doc.status === "executing" && (
                <button onClick={() => onAction("pause", doc)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors">
                  <Pause className="h-3.5 w-3.5" /> Pausar
                </button>
              )}
              {doc.status === "paused" && (
                <button onClick={() => onAction("resume", doc)} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors shadow-sm">
                  <Play className="h-3.5 w-3.5" /> Reanudar
                </button>
              )}
              {["completed", "paused", "ready"].includes(doc.status) && (
                <button onClick={() => onAction("archive", doc)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] transition-colors">
                  <Archive className="h-3.5 w-3.5" /> Archivar
                </button>
              )}
            </div>
          </div>

          <StrategyControls strategyDoc={doc} />

          {/* Progress bar */}
          <div className="mt-4">
            <MiniProgressBar completed={doc.completedTasks || 0} total={doc.totalTasks || 0} failed={doc.failedTasks || 0} />
          </div>
        </div>
      </div>

      {/* ─── Detail Sub-tabs ─── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        {detailTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setDetailTab(key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
              detailTab === key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Tab content ─── */}
      {detailTab === "overview" && doc.strategy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 cols: Strategy content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Content Pillars */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5">
              <SectionHeader icon={Target} title="Pilares de Contenido" count={doc.strategy.contentPillars.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {doc.strategy.contentPillars.map((pillar: { name: string; description: string; channels: string[] }) => (
                  <div key={pillar.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/30 p-3.5 hover:border-orange-200 transition-colors">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1.5">{pillar.name}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mb-2.5">{pillar.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {pillar.channels.map((ch: string) => (
                        <span key={ch} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--accent-subtle)] text-[var(--accent)] border border-orange-100">{ch}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-strategies: SEO + Ads + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {doc.strategy.seoStrategy && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-[var(--badge-green-bg)]"><Search className="h-3.5 w-3.5 text-[var(--success)]" /></div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">SEO</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.strategy.seoStrategy.primaryKeywords.slice(0, 6).map((kw: string) => (
                      <span key={kw} className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border border-emerald-100">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {doc.strategy.adStrategy && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-[var(--accent-subtle)]"><Megaphone className="h-3.5 w-3.5 text-[var(--accent)]" /></div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Ads</h4>
                  </div>
                  <div className="space-y-2">
                    {doc.strategy.adStrategy.budgetSplit.map((bs: { platform: string; percentage: number }) => (
                      <div key={bs.platform} className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-secondary)] flex-1 truncate">{bs.platform}</span>
                        <div className="w-14 h-1.5 bg-[var(--surface-1)] rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${bs.percentage}%` }} />
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right tabular-nums">{bs.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {doc.strategy.emailStrategy && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-50"><Mail className="h-3.5 w-3.5 text-amber-600" /></div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Email</h4>
                  </div>
                  <div className="space-y-1.5">
                    {doc.strategy.emailStrategy.sequences.map((seq: string) => (
                      <p key={seq} className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                        <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)] shrink-0" />
                        {seq}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Calendar sidebar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-4">
              <SectionHeader icon={Calendar} title="Calendario Semanal" />
              <div className="mt-3 space-y-0.5">
                {doc.strategy.weeklyCalendar.map((entry: { dayOfWeek: string; channel: string; pillar: string; contentType: string; description: string; topic?: string; contentTier?: string; funnelStage?: string; tayaCategory?: string }, i: number) => {
                  const dayColors: Record<string, string> = {
                    Lunes: "bg-blue-500", Martes: "bg-emerald-500", Miércoles: "bg-purple-500",
                    Jueves: "bg-amber-500", Viernes: "bg-[var(--accent)]", Sábado: "bg-pink-500", Domingo: "bg-[var(--surface-2)]",
                  };
                  return (
                    <div key={`${entry.dayOfWeek}-${i}`} className="flex items-start gap-2.5 py-2 border-b border-[var(--border)] last:border-0">
                      <div className="flex items-center gap-1.5 w-16 shrink-0 pt-0.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", dayColors[entry.dayOfWeek] || "bg-[var(--surface-2)]")} />
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                          {entry.dayOfWeek.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[var(--text-primary)] font-medium truncate">{entry.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-1.5 py-0.5 rounded">{entry.channel}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)]">{entry.pillar}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailTab === "tasks" && (
        <div className="space-y-5">
          {doc.strategyId && <StrategyExecutionMonitor strategyId={doc.strategyId} />}
          <StrategyTasksBreakdown strategyDocId={doc._id} />
        </div>
      )}

      {detailTab === "performance" && (
        <StrategyPerformancePanel strategyDocId={doc._id} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BRAND TAB CONTENT
   ═══════════════════════════════════════════════════ */

function BrandTabContent({ brandProfile, brandMaturity }: {
  brandProfile: ReturnType<typeof useQuery<typeof api.brandProfile.getBrandProfile>>;
  brandMaturity: ReturnType<typeof useQuery<typeof api.brandMaturity.computeBrandMaturity>>;
}) {
  if (!brandProfile) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-50 mx-auto mb-4 flex items-center justify-center">
          <Palette className="h-7 w-7 text-purple-400" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">No hay perfil de marca</p>
        <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto mb-4">
          Crea tu perfil de marca para ver la identidad visual, madurez y auditoría de marca aquí.
        </p>
        <Link href="/brand" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors">
          <Palette className="h-3.5 w-3.5" /> Crear perfil de marca
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Maturity + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          {brandMaturity && (
            <BrandMaturityBar
              score={brandMaturity.score}
              level={brandMaturity.level}
              breakdown={brandMaturity.breakdown}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/brand"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <Palette className="h-3.5 w-3.5" />
            Editar Perfil
          </Link>
          <Link
            href="/brand/manual"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Manual de Marca
          </Link>
        </div>
      </div>

      {/* Brand Identity — BrandProfileSummary has its own accordion sections */}
      <BrandProfileSummary
        data={{
          companyName: brandProfile.companyName,
          industry: brandProfile.industry,
          website: brandProfile.website,
          description: brandProfile.description,
          voice: brandProfile.voice,
          audience: {
            segments: brandProfile.audience.segments.map((s: { name: string; demographics?: string; painPoints: string[] }) => ({
              name: s.name,
              demographics: s.demographics,
              painPoints: s.painPoints,
            })),
          },
          strategy: brandProfile.strategy,
          competitors: brandProfile.competitors,
          visual: brandProfile.visual,
        }}
      />

      {/* Brand Audit — BrandAuditPanel has its own internal header */}
      <BrandAuditPanel
        brandProfileId={brandProfile._id}
        instagramHandle={
          brandProfile.strategy.channels.includes("instagram")
            ? brandProfile.companyName.toLowerCase().replace(/\s+/g, "")
            : undefined
        }
        websiteUrl={brandProfile.website || undefined}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INSIGHTS TAB CONTENT
   ═══════════════════════════════════════════════════ */

function InsightsTabContent({ brandProfile, isProfileComplete, strategyPillars }: {
  brandProfile: ReturnType<typeof useQuery<typeof api.brandProfile.getBrandProfile>>;
  isProfileComplete: boolean;
  strategyPillars?: { name: string; description: string; channels: string[] }[];
}) {
  if (!brandProfile) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-0)] p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-50 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-blue-400" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sin perfil de marca</p>
        <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto mb-4">
          Los insights se generan automáticamente a partir de tu estrategia y contenido.
        </p>
        <Link href="/brand" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors">
          Crear perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Pillars — ContentPillarsPanel has its own "Pilares de Contenido" header */}
      <ContentPillarsPanel brandProfileId={brandProfile._id} strategyPillars={strategyPillars} />

      {/* Coverage Analysis — each panel has its own header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PillarPerformance brandProfileId={brandProfile._id} />
        <FunnelCoverage />
        <TAYACoverage />
      </div>

      {/* AI Recommendations — StrategyInsightsPanel has its own "Insights Estrategicos" header */}
      <StrategyInsightsPanel />
    </div>
  );
}
