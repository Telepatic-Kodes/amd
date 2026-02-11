"use client";

import { useState } from "react";
import { X, Zap, Clock, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import dynamic from "next/dynamic";

const QuickExecuteModal = dynamic(
  () => import("./QuickExecuteModal").then((m) => m.QuickExecuteModal),
  { ssr: false }
);

interface AgentActivity {
  description: string;
  timestamp: number;
  status: string;
}

interface AgentSlideOverProps {
  agent: {
    _id: string;
    agentId: string;
    name: string;
    department: string;
    status: "active" | "paused" | "error" | "maintenance";
    role?: string;
    description?: string;
    systemPrompt?: string;
    config?: Record<string, unknown>;
  };
  recentActivity?: AgentActivity[];
  recentExecutions?: string[];
  onClose: () => void;
}

const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
  active: { color: "text-emerald-400", label: "Activo", bg: "bg-emerald-500/10" },
  paused: { color: "text-amber-400", label: "Pausado", bg: "bg-amber-500/10" },
  error: { color: "text-red-400", label: "Error", bg: "bg-red-500/10" },
  maintenance: { color: "text-orange-400", label: "Mantenimiento", bg: "bg-orange-500/10" },
};

const departmentLabels: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Generacion de Demanda",
  seo: "SEO",
  brand: "Marca & Creativo",
  ops: "Operaciones",
};

const roleLabels: Record<string, string> = {
  cmo: "CMO",
  director: "Director",
  specialist: "Especialista",
};

const execStatusIcons: Record<string, { color: string; label: string }> = {
  success: { color: "bg-emerald-500", label: "Exitosa" },
  completed: { color: "bg-emerald-500", label: "Completada" },
  failure: { color: "bg-red-500", label: "Fallida" },
  failed: { color: "bg-red-500", label: "Fallida" },
  running: { color: "bg-amber-500", label: "En curso" },
  pending: { color: "bg-stone-400", label: "Pendiente" },
};

export function AgentSlideOver({ agent, recentActivity, recentExecutions, onClose }: AgentSlideOverProps) {
  const [showExecute, setShowExecute] = useState(false);
  const config = statusConfig[agent.status] || statusConfig.paused;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("shrink-0 h-2.5 w-2.5 rounded-full", config.color.replace("text-", "bg-"))} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate">{agent.name}</h2>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {departmentLabels[agent.department] || agent.department}
                {agent.role && ` · ${roleLabels[agent.role] || agent.role}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Status + Execute */}
          <div className="flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium", config.color, config.bg)}>
              <Activity className="h-3 w-3" />
              {config.label}
            </span>
            <button
              onClick={() => setShowExecute(true)}
              disabled={agent.status !== "active"}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                agent.status === "active"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
              )}
            >
              <Zap className="h-3 w-3" />
              Ejecutar
            </button>
          </div>

          {/* Description */}
          {agent.description && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Descripcion</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{agent.description}</p>
            </div>
          )}

          {/* Config summary */}
          {agent.config && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Configuracion</h3>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3 space-y-1.5">
                {Boolean(agent.config.model) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Modelo</span>
                    <span className="text-[var(--text-secondary)] font-mono">{String(agent.config.model)}</span>
                  </div>
                )}
                {agent.config.temperature !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Temperatura</span>
                    <span className="text-[var(--text-secondary)]">{String(agent.config.temperature)}</span>
                  </div>
                )}
                {Array.isArray(agent.config.tools) && agent.config.tools.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Tools</span>
                    <span className="text-[var(--text-secondary)]">{agent.config.tools.length} habilitados</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent executions timeline */}
          {recentActivity && recentActivity.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Actividad Reciente
              </h3>
              <div className="space-y-1">
                {recentActivity.slice(0, 8).map((act, i) => {
                  const execInfo = execStatusIcons[act.status] || execStatusIcons.pending;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-md px-3 py-2 border border-[var(--border)] bg-[var(--surface-raised)]"
                    >
                      <div className={cn("shrink-0 mt-1 h-1.5 w-1.5 rounded-full", execInfo.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-secondary)] truncate">{act.description}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {execInfo.label} · {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Execution status bars (visual) */}
          {recentExecutions && recentExecutions.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Historial de Ejecuciones
              </h3>
              <div className="flex items-center gap-1">
                {recentExecutions.map((exec, i) => {
                  const info = execStatusIcons[exec] || execStatusIcons.pending;
                  return (
                    <div
                      key={i}
                      className={cn("h-2 flex-1 rounded-sm", info.color)}
                      title={info.label}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[var(--text-tertiary)]">Mas reciente</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Mas antigua</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!recentActivity || recentActivity.length === 0) && (!recentExecutions || recentExecutions.length === 0) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-6 w-6 text-stone-400 mb-2" />
              <p className="text-sm text-[var(--text-tertiary)]">Sin actividad reciente</p>
            </div>
          )}

          {/* Warning for error agents */}
          {agent.status === "error" && (
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                Este agente está en estado de error. Revisa la configuración o reinícialo desde el Centro de Control.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Execute Modal */}
      {showExecute && (
        <QuickExecuteModal
          agentId={agent.agentId}
          agentName={agent.name}
          onClose={() => setShowExecute(false)}
        />
      )}
    </>
  );
}
