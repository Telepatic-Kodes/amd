"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  GitBranch,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; color: string; label: string; variant: "success" | "error" | "warning" | "info" | "default" }
> = {
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completado", variant: "success" },
  running: { icon: Loader2, color: "text-orange-500", label: "Ejecutando", variant: "warning" },
  pending: { icon: Clock, color: "text-[var(--text-tertiary)]", label: "Pendiente", variant: "default" },
  failed: { icon: XCircle, color: "text-[var(--error)]", label: "Error", variant: "error" },
  queued: { icon: Clock, color: "text-[var(--text-tertiary)]", label: "En cola", variant: "default" },
};


export function HandoffChainView() {
  const activeChains = useQuery(api.handoffEngine.listActiveChains);
  const [expandedChain, setExpandedChain] = useState<Id<"tasks"> | null>(null);

  if (!activeChains || activeChains.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Cadenas Activas
        </h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {activeChains.length} cadena{activeChains.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {activeChains.map((chain) => (
          <div key={chain.rootTaskId}>
            <button
              onClick={() =>
                setExpandedChain(
                  expandedChain === chain.rootTaskId
                    ? null
                    : chain.rootTaskId
                )
              }
              className="w-full flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-0)] p-3 hover:border-[var(--border)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="text-xs font-medium text-[var(--text-primary)]">
                  {chain.rootTaskType.replace(/_/g, " ")}
                </div>
                <Badge variant="info">
                  {chain.completedTasks}/{chain.totalTasks} tareas
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {chain.runningTasks > 0 && (
                  <Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
                )}
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {formatTimeAgo(chain.createdAt)}
                </span>
              </div>
            </button>

            {expandedChain === chain.rootTaskId && (
              <ChainDetail taskId={chain.rootTaskId} />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChainDetail({ taskId }: { taskId: Id<"tasks"> }) {
  const chain = useQuery(api.handoffEngine.getHandoffChain, { taskId });

  if (!chain) {
    return (
      <div className="mt-2 p-3 bg-[var(--surface-0)] rounded-lg">
        <div className="h-10 bg-[var(--surface-1)] animate-pulse rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 p-3 bg-[var(--surface-0)] rounded-lg border border-[var(--border)]"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {chain.map((node, i) => {
          const config = statusConfig[node.status] || statusConfig.pending;
          const Icon = config.icon;
          const isRunning = node.status === "running";

          return (
            <div key={node.taskId} className="flex items-center gap-2">
              {i > 0 && (
                <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)] shrink-0" />
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5"
              >
                <Icon
                  className={`h-3 w-3 ${config.color} ${isRunning ? "animate-spin" : ""}`}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-[var(--text-primary)] truncate max-w-[100px]">
                    {node.agentName}
                  </div>
                  <div className="text-[9px] text-[var(--text-tertiary)]">
                    {node.taskType.replace(/_/g, " ")}
                    {node.duration !== undefined && (
                      <> &middot; {(node.duration / 1000).toFixed(1)}s</>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(diff / 86400000)}d`;
}
