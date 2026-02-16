"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Pause, Play } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

interface StrategyControlsProps {
  strategyDoc: {
    _id: Id<"marketingStrategies">;
    status: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  generating: "Generando",
  ready: "Lista",
  executing: "Ejecutando",
  paused: "Pausada",
  completed: "Completada",
  failed: "Fallida",
};

export function StrategyControls({ strategyDoc }: StrategyControlsProps) {
  const { success, error: toastError } = useToast();
  const pauseStrategy = useMutation(api.cmoEngine.pauseStrategy);
  const resumeStrategy = useMutation(api.cmoEngine.resumeStrategy);

  const canPause = strategyDoc.status === "executing";
  const canResume = strategyDoc.status === "paused";

  if (!canPause && !canResume) return null;

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
      <Badge variant="default" className="text-[10px]">
        {STATUS_LABELS[strategyDoc.status] ?? strategyDoc.status}
      </Badge>
      {canPause && (
        <button
          onClick={async () => {
            try {
              await pauseStrategy({ strategyDocId: strategyDoc._id });
              success("Pausada", "Estrategia pausada correctamente");
            } catch (err: unknown) {
              toastError("Error", err instanceof Error ? err.message : "Error al pausar");
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
        >
          <Pause className="h-3 w-3" />
          Pausar
        </button>
      )}
      {canResume && (
        <button
          onClick={async () => {
            try {
              await resumeStrategy({ strategyDocId: strategyDoc._id });
              success("Reanudada", "Agentes retomando trabajo");
            } catch (err: unknown) {
              toastError("Error", err instanceof Error ? err.message : "Error al reanudar");
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors"
        >
          <Play className="h-3 w-3" />
          Reanudar
        </button>
      )}
    </div>
  );
}
