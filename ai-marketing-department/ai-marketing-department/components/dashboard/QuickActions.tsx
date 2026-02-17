"use client";

import Link from "next/link";
import {
  FileText,
  AlertCircle,
  PlayCircle,
  Plus,
  Zap,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  priority: number;
  count?: number;
  variant: "urgent" | "normal";
}

interface QuickActionsProps {
  contentInReview?: number;
  agentErrors?: number;
  failedExecutions?: number;
  strategyPaused?: boolean;
  recentContentCount?: number;
  onExecuteAgent?: () => void;
}

export function QuickActions({
  contentInReview = 0,
  agentErrors = 0,
  failedExecutions = 0,
  strategyPaused = false,
  recentContentCount = 0,
  onExecuteAgent,
}: QuickActionsProps) {
  const actions: QuickAction[] = [];

  // Priority-based: urgent items first
  if (contentInReview > 0) {
    actions.push({
      label: "Revisar contenido",
      icon: FileText,
      href: "/content",
      priority: 1,
      count: contentInReview,
      variant: "urgent",
    });
  }

  if (agentErrors > 0) {
    actions.push({
      label: "Ver errores",
      icon: AlertCircle,
      href: "/agents",
      priority: 2,
      count: agentErrors,
      variant: "urgent",
    });
  }

  if (failedExecutions > 0) {
    actions.push({
      label: "Ejecuciones fallidas",
      icon: Zap,
      href: "/analytics",
      priority: 3,
      count: failedExecutions,
      variant: "urgent",
    });
  }

  if (strategyPaused) {
    actions.push({
      label: "Reanudar estrategia",
      icon: PlayCircle,
      href: "/strategy",
      priority: 4,
      variant: "normal",
    });
  }

  // Fill remaining with defaults
  if (recentContentCount === 0) {
    actions.push({
      label: "Crear contenido",
      icon: Plus,
      href: "/content",
      priority: 10,
      variant: "normal",
    });
  }

  actions.push({
    label: "Ejecutar agente",
    icon: Zap,
    href: "#",
    priority: 11,
    variant: "normal",
  });

  actions.push({
    label: "Ver resultados",
    icon: BarChart3,
    href: "/analytics",
    priority: 12,
    variant: "normal",
  });

  // Sort by priority and take max 4
  const displayed = actions.sort((a, b) => a.priority - b.priority).slice(0, 4);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      {displayed.map((action) => {
        const Icon = action.icon;
        const isExecuteAgent = action.label === "Ejecutar agente";

        const content = (
          <>
            <Icon className="h-3.5 w-3.5" />
            {action.label}
            {action.count != null && action.count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                action.variant === "urgent"
                  ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] dark:bg-red-500/20 dark:text-[var(--error)]"
                  : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
              }`}>
                {action.count}
              </span>
            )}
          </>
        );

        const baseClass = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
          action.variant === "urgent"
            ? "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)] dark:bg-red-500/10 dark:text-[var(--error)] dark:hover:bg-red-500/20"
            : "text-[var(--text-secondary)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
        }`;

        if (isExecuteAgent && onExecuteAgent) {
          return (
            <button
              key={action.label}
              onClick={onExecuteAgent}
              className={baseClass}
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={action.label} href={action.href} className={baseClass}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
