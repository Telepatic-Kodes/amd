"use client";

import { useState } from "react";
import { ChevronDown, Calendar, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodayBriefingProps {
  scheduledContent?: number;
  contentInReview?: number;
  agentErrors?: number;
  topMetricChange?: { label: string; value: string; trend: "up" | "down" };
  nextScheduled?: string;
}

export function TodayBriefing({
  scheduledContent = 0,
  contentInReview = 0,
  agentErrors = 0,
  topMetricChange,
  nextScheduled,
}: TodayBriefingProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasData = scheduledContent > 0 || contentInReview > 0 || agentErrors > 0 || topMetricChange;

  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-1)] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" style={{ color: "var(--brand-accent)" }} />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Resumen del dia
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-[var(--text-tertiary)] transition-transform",
          isCollapsed && "-rotate-90"
        )} />
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Scheduled */}
          <div className="rounded-lg bg-[var(--surface-1)] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                Programado
              </span>
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]">{scheduledContent}</p>
            {nextScheduled && (
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">
                Prox: {nextScheduled}
              </p>
            )}
          </div>

          {/* In review */}
          <div className="rounded-lg bg-[var(--surface-1)] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                En revision
              </span>
            </div>
            <p className="text-lg font-bold text-[var(--text-primary)]">{contentInReview}</p>
          </div>

          {/* Agent errors */}
          {agentErrors > 0 && (
            <div className="rounded-lg bg-[var(--badge-red-bg)] dark:bg-red-500/10 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-3 w-3 text-[var(--error)]" />
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                  Errores
                </span>
              </div>
              <p className="text-lg font-bold text-red-600">{agentErrors}</p>
            </div>
          )}

          {/* Top metric */}
          {topMetricChange && (
            <div className="rounded-lg bg-[var(--surface-1)] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className={cn(
                  "h-3 w-3",
                  topMetricChange.trend === "up" ? "text-green-500" : "text-[var(--error)]"
                )} />
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                  {topMetricChange.label}
                </span>
              </div>
              <p className={cn(
                "text-lg font-bold",
                topMetricChange.trend === "up" ? "text-[var(--success)]" : "text-red-600"
              )}>
                {topMetricChange.value}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
