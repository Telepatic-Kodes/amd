"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, AlertTriangle, CheckCircle, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "execution" | "task";
  agentName: string;
  department: string;
  description: string;
  status: string;
  timestamp: number;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-emerald-400", label: "Exitoso" },
  completed: { icon: CheckCircle, color: "text-emerald-400", label: "Completado" },
  failure: { icon: XCircle, color: "text-red-400", label: "Fallido" },
  failed: { icon: XCircle, color: "text-red-400", label: "Fallido" },
  running: { icon: Zap, color: "text-amber-400", label: "En curso" },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activity = useQuery(api.controlCenter.getRecentActivity, {});
  const agents = useQuery(api.functions.listAgents, {});

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filter to only important notifications: failures + errors
  const alerts: ActivityItem[] = (activity || [])
    .filter((a: ActivityItem) => a.status === "failure" || a.status === "failed")
    .slice(0, 10);

  const errorAgents = agents?.filter((a: Record<string, unknown>) => a.status === "error") || [];
  const alertCount = alerts.length + errorAgents.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-1.5 rounded-md transition-colors",
          "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        )}
      >
        <Bell className="h-4 w-4" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full ml-2 top-0 w-72 rounded-lg border border-[var(--border)] bg-zinc-900 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notificaciones</span>
            {alertCount > 0 && (
              <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                {alertCount} alertas
              </span>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[320px] overflow-y-auto">
            {alertCount === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Todo funcionando correctamente</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {/* Agent errors */}
                {errorAgents.map((agent: Record<string, unknown>) => (
                  <div key={agent._id as string} className="flex items-start gap-2.5 px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {agent.name as string}
                      </p>
                      <p className="text-[11px] text-red-400">Agente en estado de error</p>
                    </div>
                  </div>
                ))}

                {/* Failed executions */}
                {alerts.map((item) => {
                  const config = statusConfig[item.status] || statusConfig.failure;
                  const Icon = config.icon;
                  const timeAgo = formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                    locale: es,
                  });

                  return (
                    <div key={item.id} className="flex items-start gap-2.5 px-3 py-2.5">
                      <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", config.color)} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {item.agentName}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                          {config.label} · {timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
