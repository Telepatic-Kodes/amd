"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
  Bot,
  ChevronDown,
  ChevronUp,
  Timer,
  Coins,
  Filter,
} from "lucide-react";

// Department colors
const DEPT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  content: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  social: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  demandgen: { bg: "bg-[var(--accent-subtle)]", text: "text-orange-700", border: "border-orange-200" },
  seo: { bg: "bg-[var(--badge-green-bg)]", text: "text-green-700", border: "border-green-200" },
  ops: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  brand: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  leadership: { bg: "bg-[var(--surface-0)]", text: "text-[var(--text-secondary)]", border: "border-[var(--border)]" },
};

const TASK_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  running: { icon: Loader2, color: "text-orange-500", label: "Ejecutando" },
  pending: { icon: Clock, color: "text-[var(--text-tertiary)]", label: "Pendiente" },
  queued: { icon: Clock, color: "text-blue-400", label: "En cola" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completada" },
  failed: { icon: XCircle, color: "text-[var(--error)]", label: "Fallida" },
  waiting_review: { icon: Clock, color: "text-amber-500", label: "En revisión" },
  cancelled: { icon: XCircle, color: "text-[var(--text-tertiary)]", label: "Cancelada" },
};

function TaskStatusIcon({ status }: { status: string }) {
  const config = TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isSpinning = status === "running";

  return (
    <Icon className={`h-4 w-4 ${config.color} ${isSpinning ? "animate-spin" : ""}`} />
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return "<$0.01";
  return `$${cost.toFixed(2)}`;
}

interface StrategyExecutionMonitorProps {
  strategyId: string;
}

export function StrategyExecutionMonitor({ strategyId }: StrategyExecutionMonitorProps) {
  const [expanded, setExpanded] = useState(true);
  const [filterDept, setFilterDept] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const tasks = useQuery(api.cmoEngine.getStrategyTasksDetailed, { strategyId });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (filterDept && t.agent?.department !== filterDept) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterDept, filterStatus]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!tasks) return null;
    const running = tasks.filter((t) => t.status === "running").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    const pending = tasks.filter((t) => t.status === "pending" || t.status === "queued").length;

    // Departments involved
    const depts = new Set(tasks.map((t) => t.agent?.department).filter(Boolean));

    return { running, completed, failed, pending, total: tasks.length, departments: Array.from(depts) };
  }, [tasks]);

  if (!tasks) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)] p-5 animate-pulse">
        <div className="h-4 bg-[var(--surface-1)] rounded w-1/4 mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-[var(--surface-1)]/50 rounded" />
          <div className="h-12 bg-[var(--surface-1)]/50 rounded" />
          <div className="h-12 bg-[var(--surface-1)]/50 rounded" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-0)]">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-1)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Monitor de Ejecución</h3>
          {stats && (
            <div className="flex items-center gap-2">
              {stats.running > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  {stats.running} ejecutando
                </span>
              )}
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {stats.completed}/{stats.total} completadas
              </span>
            </div>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] p-4 pt-3">
          {/* Filters */}
          {stats && stats.departments.length > 1 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Filter className="h-3 w-3 text-[var(--text-tertiary)]" />
              <button
                onClick={() => { setFilterDept(null); setFilterStatus(null); }}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  !filterDept && !filterStatus ? "bg-orange-100 text-orange-700" : "bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                }`}
              >
                Todas ({stats.total})
              </button>
              {stats.departments.map((dept) => {
                const colors = DEPT_COLORS[dept as string] || DEPT_COLORS.content;
                const count = tasks.filter((t) => t.agent?.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setFilterDept(filterDept === dept ? null : (dept as string))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors ${
                      filterDept === dept ? `${colors.bg} ${colors.text}` : "bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
              <span className="text-[var(--text-tertiary)] mx-1">|</span>
              {stats.running > 0 && (
                <button
                  onClick={() => setFilterStatus(filterStatus === "running" ? null : "running")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    filterStatus === "running" ? "bg-orange-100 text-orange-700" : "bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  Ejecutando ({stats.running})
                </button>
              )}
              {stats.failed > 0 && (
                <button
                  onClick={() => setFilterStatus(filterStatus === "failed" ? null : "failed")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    filterStatus === "failed" ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]" : "bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  Fallidas ({stats.failed})
                </button>
              )}
            </div>
          )}

          {/* Task List */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filteredTasks.map((task) => {
              const deptColors = task.agent ? DEPT_COLORS[task.agent.department] || DEPT_COLORS.content : DEPT_COLORS.content;

              return (
                <div
                  key={task._id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                    task.status === "running"
                      ? "border-orange-200 bg-[var(--accent-subtle)]/30"
                      : task.status === "failed"
                      ? "border-red-100 bg-[var(--badge-red-bg)]/20"
                      : "border-[var(--border)] bg-[var(--surface-0)] hover:bg-[var(--surface-1)]/30"
                  }`}
                >
                  {/* Status Icon */}
                  <TaskStatusIcon status={task.status} />

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.agent && (
                        <>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium capitalize ${deptColors.bg} ${deptColors.text}`}>
                            {task.agent.department}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
                            <Bot className="h-2.5 w-2.5" />
                            {task.agent.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Execution Metrics */}
                  <div className="flex items-center gap-3 shrink-0">
                    {task.execution && (
                      <>
                        <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5" title="Duración">
                          <Timer className="h-2.5 w-2.5" />
                          {formatDuration(task.execution.duration)}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5" title="Costo">
                          <Coins className="h-2.5 w-2.5" />
                          {formatCost(task.execution.cost)}
                        </span>
                      </>
                    )}
                    {task.status === "running" && !task.execution && (
                      <span className="text-[10px] text-orange-500 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5" />
                        En progreso...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
