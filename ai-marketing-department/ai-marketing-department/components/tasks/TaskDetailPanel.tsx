"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, RotateCcw, ChevronDown, ChevronRight, Clock, Cpu, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { translateStatus, getStatusVariant } from "@/lib/language";
import type { Id } from "@convex/_generated/dataModel";

interface TaskDetailPanelProps {
  task: {
    _id: string;
    title?: string;
    agentId?: string;
    type: string;
    status: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    createdAt: number;
    updatedAt?: number;
    completedAt?: number;
  };
  onClose: () => void;
}

function CollapsibleJson({
  label,
  data,
}: {
  label: string;
  data: Record<string, unknown> | undefined;
}) {
  const [open, setOpen] = useState(false);

  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && (
        <div className="p-3 rounded-lg bg-[var(--surface-1)] max-h-48 overflow-y-auto">
          <pre className="text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap break-all font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const executionStatus = useQuery(api.agentExecution.getExecutionStatus, {
    taskId: task._id as Id<"tasks">,
  });

  const retryTask = useMutation(api.functions.retryTask);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryTask({ taskId: task._id as Id<"tasks"> });
    } finally {
      setRetrying(false);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Card className="sticky top-8">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">
              {task.title || task.agentId || "Tarea"}
            </h3>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              {task.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors"
          >
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Status + Type */}
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(task.status)}>
            {translateStatus(task.status)}
          </Badge>
          <Badge variant="default">{task.type}</Badge>
        </div>

        {/* Timestamps */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Tiempos
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">Creada:</span>
              <span className="text-[var(--text-primary)]">
                {formatDate(task.createdAt)}
              </span>
            </div>
            {task.completedAt && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <span className="text-[var(--text-secondary)]">
                  Completada:
                </span>
                <span className="text-[var(--text-primary)]">
                  {formatDate(task.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Execution Status */}
        {executionStatus && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Ejecucion
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {executionStatus.tokens != null && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
                  <Cpu className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Tokens
                    </p>
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {executionStatus.tokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {executionStatus.cost != null && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
                  <DollarSign className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Costo
                    </p>
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      ${executionStatus.cost.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
              {executionStatus.duration != null && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      Duracion
                    </p>
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {(executionStatus.duration / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input / Output */}
        <CollapsibleJson label="Input" data={task.input} />
        <CollapsibleJson label="Output" data={task.output} />

        {/* Retry button for failed tasks */}
        {task.status === "failed" && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              retrying
                ? "bg-[var(--surface-1)] text-[var(--text-tertiary)] cursor-not-allowed"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            )}
          >
            <RotateCcw className={cn("h-4 w-4", retrying && "animate-spin")} />
            {retrying ? "Reintentando..." : "Reintentar tarea"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
