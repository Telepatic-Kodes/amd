"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, Inbox, FileText, Bot, BarChart3, Zap, Search } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      icon: 'h-8 w-8',
      title: 'text-sm',
      description: 'text-xs',
      padding: 'py-6',
    },
    md: {
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-sm',
      padding: 'py-12',
    },
    lg: {
      icon: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-base',
      padding: 'py-16',
    },
  };

  const s = sizes[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.padding,
        className
      )}
    >
      <div className="rounded-full bg-zinc-800/50 p-4 mb-4">
        <Icon className={cn("text-zinc-500", s.icon)} />
      </div>
      <h3 className={cn("font-medium text-zinc-300 mb-1", s.title)}>{title}</h3>
      {description && (
        <p className={cn("text-zinc-500 max-w-sm mb-4", s.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function EmptyContent({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="No hay contenido"
      description="El contenido generado aparecerá aquí una vez que los agentes completen sus tareas."
      className={className}
    />
  );
}

export function EmptyAgents({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Bot}
      title="Sin actividad de agentes"
      description="Los agentes están inactivos. Ejecuta un workflow para ver la actividad."
      className={className}
    />
  );
}

export function EmptyAnalytics({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={BarChart3}
      title="Sin datos de analytics"
      description="Las métricas se mostrarán después de las primeras ejecuciones."
      className={className}
    />
  );
}

export function EmptyExecutions({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Zap}
      title="Sin ejecuciones"
      description="No hay ejecuciones registradas aún. Ejecuta un agente para comenzar."
      className={className}
    />
  );
}

export function EmptySearchResults({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Sin resultados"
      description="No se encontraron resultados para tu búsqueda. Intenta con otros términos."
      size="sm"
      className={className}
    />
  );
}

// Card variant for grid layouts
interface EmptyStateCardProps extends EmptyStateProps {
  colSpan?: number;
}

export function EmptyStateCard({
  colSpan = 1,
  ...props
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-950/50",
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-3",
        colSpan === 4 && "md:col-span-4 lg:col-span-4"
      )}
    >
      <EmptyState {...props} />
    </div>
  );
}
