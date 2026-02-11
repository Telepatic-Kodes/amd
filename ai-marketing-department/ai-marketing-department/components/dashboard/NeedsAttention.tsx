"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle, XCircle, FileEdit, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttentionItem {
  type: "error" | "warning" | "info";
  label: string;
  detail: string;
  href: string;
}

interface NeedsAttentionProps {
  agentErrors?: number;
  contentInReview?: number;
  failedExecutions?: number;
  pendingTasks?: number;
}

const severityConfig = {
  error: {
    icon: XCircle,
    color: "text-[#E5484D]",
    bg: "bg-[#E5484D]/8",
    border: "border-[#E5484D]/15",
    dot: "bg-[#E5484D]",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-[#F5A623]",
    bg: "bg-[#F5A623]/8",
    border: "border-[#F5A623]/15",
    dot: "bg-[#F5A623]",
  },
  info: {
    icon: FileEdit,
    color: "text-[#5B6AE8]",
    bg: "bg-[#5B6AE8]/8",
    border: "border-[#5B6AE8]/15",
    dot: "bg-[#5B6AE8]",
  },
};

export function NeedsAttention({
  agentErrors = 0,
  contentInReview = 0,
  failedExecutions = 0,
  pendingTasks = 0,
}: NeedsAttentionProps) {
  const items: AttentionItem[] = [];

  if (agentErrors > 0) {
    items.push({
      type: "error",
      label: `${agentErrors} agente${agentErrors > 1 ? "s" : ""} con error`,
      detail: "Requiere atencion inmediata",
      href: "/control-center",
    });
  }

  if (failedExecutions > 0) {
    items.push({
      type: "error",
      label: `${failedExecutions} ejecución${failedExecutions > 1 ? "es" : ""} fallida${failedExecutions > 1 ? "s" : ""}`,
      detail: "En las últimas 24 horas",
      href: "/results",
    });
  }

  if (contentInReview > 0) {
    items.push({
      type: "warning",
      label: `${contentInReview} contenido${contentInReview > 1 ? "s" : ""} en revisión`,
      detail: "Esperando aprobacion",
      href: "/content?status=review",
    });
  }

  if (pendingTasks > 0) {
    items.push({
      type: "info",
      label: `${pendingTasks} tarea${pendingTasks > 1 ? "s" : ""} pendiente${pendingTasks > 1 ? "s" : ""}`,
      detail: "Sin asignar o en cola",
      href: "/control-center",
    });
  }

  const allClear = items.length === 0;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <h3 className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">
        Necesita Atencion
      </h3>

      <div className="rounded-xl bg-[var(--surface-1)] p-4 flex-1 flex flex-col">
        {allClear ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="h-10 w-10 rounded-full bg-[#2FCC71]/10 flex items-center justify-center mb-3">
              <CheckCircle className="h-5 w-5 text-[#2FCC71]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Todo en orden</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">No hay items que requieran atencion</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => {
              const config = severityConfig[item.type];
              const Icon = config.icon;

              return (
                <Link
                  key={i}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3 border transition-all group",
                    "hover:scale-[1.01]",
                    config.bg,
                    config.border,
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function NeedsAttentionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-32 rounded bg-[var(--surface-3)] animate-pulse" />
      <div className="rounded-xl bg-[var(--surface-1)] p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-[var(--surface-2)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
