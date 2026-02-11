"use client";

import { useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, Zap, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const EXECUTION_STAGES = [
  { label: "Preparando agente...", delay: 0 },
  { label: "Analizando brief...", delay: 2000 },
  { label: "Generando contenido...", delay: 5000 },
  { label: "Finalizando...", delay: 12000 },
];

interface QuickExecuteModalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

type ModalState = "idle" | "executing" | "success" | "error";

export function QuickExecuteModal({ agentId, agentName, onClose }: QuickExecuteModalProps) {
  const [taskType, setTaskType] = useState("manual_execution");
  const [input, setInput] = useState("");
  const [state, setState] = useState<ModalState>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const executeAgent = useAction(api.actions.executeAgent);

  // Advance execution stages on timers
  useEffect(() => {
    if (state !== "executing") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    EXECUTION_STAGES.forEach((stage, i) => {
      if (i === 0) return; // stage 0 is set immediately
      timers.push(setTimeout(() => setStageIndex(i), stage.delay));
    });
    stageTimersRef.current = timers;

    return () => timers.forEach(clearTimeout);
  }, [state]);

  const handleExecute = async () => {
    if (!input.trim()) return;
    setState("executing");
    setStageIndex(0);
    try {
      const res = await executeAgent({
        agentId,
        taskType,
        input: { prompt: input.trim() },
      });
      stageTimersRef.current.forEach(clearTimeout);
      setState("success");
      setResult(res.output?.slice(0, 200) || "Ejecución completada");
    } catch (err: unknown) {
      stageTimersRef.current.forEach(clearTimeout);
      setState("error");
      setResult(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ejecutar Agente</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Agente</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{agentName}</p>
          </div>

          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1.5 block">Tipo de tarea</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              disabled={state === "executing"}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              <option value="manual_execution">Ejecución manual</option>
              <option value="write_blog">Escribir blog</option>
              <option value="analyze_keywords">Analizar keywords</option>
              <option value="create_social">Crear post social</option>
              <option value="optimize_seo">Optimizar SEO</option>
              <option value="generate_report">Generar reporte</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--text-tertiary)] mb-1.5 block">Instrucciones</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={state === "executing"}
              placeholder="Describe lo que quieres que haga el agente..."
              rows={3}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Execution progress stages */}
          {state === "executing" && (
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
              {EXECUTION_STAGES.map((stage, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i < stageIndex ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : i === stageIndex ? (
                    <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  )}
                  <span className={cn(
                    "text-xs transition-colors",
                    i <= stageIndex ? "text-stone-700" : "text-stone-400"
                  )}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Result feedback */}
          {state === "success" && (
            <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 line-clamp-3">{result}</p>
            </div>
          )}
          {state === "error" && (
            <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 p-3">
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 line-clamp-3">{result}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-stone-900 transition-colors rounded-md"
          >
            {state === "success" || state === "error" ? "Cerrar" : "Cancelar"}
          </button>
          {(state === "idle" || state === "error") && (
            <button
              onClick={handleExecute}
              disabled={!input.trim()}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                "bg-emerald-600 hover:bg-emerald-500 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Zap className="h-3 w-3" />
              Ejecutar
            </button>
          )}
          {state === "executing" && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-emerald-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              {EXECUTION_STAGES[stageIndex]?.label ?? "Ejecutando..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
