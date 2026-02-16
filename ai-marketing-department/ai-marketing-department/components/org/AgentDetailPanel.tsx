"use client";

import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { X, CheckCircle, XCircle, ArrowRight, ArrowLeft, Zap, Clock, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentDetailPanelProps {
  agentId: Id<"agents">;
  onClose: () => void;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

const statusBadgeColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-500" },
  paused: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500" },
  error: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  maintenance: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500" },
};

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 rounded bg-[var(--surface-2)] animate-pulse", className)} />
  );
}

export function AgentDetailPanel({ agentId, onClose }: AgentDetailPanelProps) {
  const data = useQuery(api.orgChart.getAgentDetail, { agentId });

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="w-[320px] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-y-auto max-h-[calc(100vh-180px)]"
    >
      {/* Close button */}
      <div className="sticky top-0 z-10 flex justify-end p-3 bg-[var(--card-bg)]">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Loading state */}
      {!data && (
        <div className="px-4 pb-4 space-y-4">
          <SkeletonBar className="w-3/4 h-6" />
          <SkeletonBar className="w-1/2 h-4" />
          <SkeletonBar className="w-full h-16" />
          <SkeletonBar className="w-2/3 h-4" />
        </div>
      )}

      {data && (
        <div className="px-4 pb-4 space-y-5">
          {/* Header */}
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {data.agent.name}
            </h3>
            <code className="text-xs text-[var(--text-tertiary)] font-mono">
              {data.agent.agentId}
            </code>
            <div className="flex items-center gap-2 mt-2">
              {(() => {
                const colors = statusBadgeColors[data.agent.status] || statusBadgeColors.active;
                return (
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colors.bg, colors.text)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                    {data.agent.status}
                  </span>
                );
              })()}
            </div>
            {data.agent.description && (
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {data.agent.description}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-[var(--accent)]" />
              <p className="text-lg font-bold text-[var(--text-primary)]">{data.stats.totalTasks}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Tasks</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
              <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-400" />
              <p className="text-lg font-bold text-[var(--text-primary)]">{data.stats.successRate}%</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Success</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
              <Cpu className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <p className="text-lg font-bold text-[var(--text-primary)]">{formatTokens(data.stats.totalTokens)}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Tokens</p>
            </div>
          </div>

          {/* Recent Executions */}
          {data.recentExecutions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Recent Executions
              </h4>
              <div className="space-y-1.5">
                {data.recentExecutions.map((exec) => (
                  <div
                    key={exec._id}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface-0)] text-xs"
                  >
                    {exec.status === "success" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="text-[var(--text-secondary)] truncate flex-1">
                      {formatTokens(exec.tokensUsed.total)} tok
                    </span>
                    <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exec.duration ? formatDuration(exec.duration) : "—"}
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      {formatTimeAgo(exec._creationTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Handoffs */}
          {(data.handoffsFrom.length > 0 || data.handoffsTo.length > 0) && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Handoffs
              </h4>
              <div className="space-y-1.5">
                {data.handoffsFrom.map((h) => (
                  <div
                    key={`from-${h.name}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-0)] text-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate flex-1">{h.name}</span>
                    <span className="text-[var(--text-tertiary)]">&times;{h.count}</span>
                  </div>
                ))}
                {data.handoffsTo.map((h) => (
                  <div
                    key={`to-${h.name}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-0)] text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate flex-1">{h.name}</span>
                    <span className="text-[var(--text-tertiary)]">&times;{h.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config */}
          {data.agent.config && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Config
              </h4>
              <div className="space-y-1.5 text-xs">
                {data.agent.config.model && (
                  <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-[var(--surface-0)]">
                    <span className="text-[var(--text-tertiary)]">Model</span>
                    <span className="text-[var(--text-secondary)] font-mono">{data.agent.config.model}</span>
                  </div>
                )}
                {data.agent.config.temperature !== undefined && (
                  <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-[var(--surface-0)]">
                    <span className="text-[var(--text-tertiary)]">Temperature</span>
                    <span className="text-[var(--text-secondary)]">{data.agent.config.temperature}</span>
                  </div>
                )}
                {data.agent.triggers && data.agent.triggers.length > 0 && (
                  <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-[var(--surface-0)]">
                    <span className="text-[var(--text-tertiary)]">Triggers</span>
                    <span className="text-[var(--text-secondary)]">{data.agent.triggers.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
