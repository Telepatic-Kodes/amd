"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

const TASK_TYPES = [
  { value: "content_generation", label: "Generación de Contenido" },
  { value: "social_post", label: "Post Social" },
  { value: "seo_analysis", label: "Análisis SEO" },
  { value: "email_campaign", label: "Campaña Email" },
  { value: "ad_copy", label: "Copy Publicitario" },
  { value: "research", label: "Investigación" },
];

interface ExecuteAgentModalProps {
  agent: { agentId: string; _id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
}

export function ExecuteAgentModal({ agent, isOpen, onClose }: ExecuteAgentModalProps) {
  const [taskType, setTaskType] = useState("content_generation");
  const [input, setInput] = useState("");
  const [taskId, setTaskId] = useState<Id<"tasks"> | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const triggerExecution = useMutation(api.agentExecution.triggerExecution);
  const executionStatus = useQuery(
    api.agentExecution.getExecutionStatus,
    taskId ? { taskId } : "skip"
  );

  const { success, error: showError } = useToast();

  const handleExecute = async () => {
    if (!input.trim()) return;
    setIsTriggering(true);
    try {
      let parsedInput: unknown = input;
      try {
        parsedInput = JSON.parse(input);
      } catch {
        // keep as string
      }
      const result = await triggerExecution({
        agentId: agent.agentId,
        taskType,
        input: parsedInput,
      });
      setTaskId(result as unknown as Id<"tasks">);
      success("Ejecución iniciada");
    } catch (err) {
      showError("Error al ejecutar agente");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleClose = () => {
    setTaskId(null);
    setInput("");
    setTaskType("content_generation");
    setIsTriggering(false);
    onClose();
  };

  const isCompleted = executionStatus?.status === "completed";
  const isFailed = executionStatus?.status === "failed";
  const isRunning = taskId && !isCompleted && !isFailed;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Ejecutar Agente</h3>
            <p className="text-xs text-[var(--text-secondary)]">{agent.name}</p>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-[var(--surface-1)] transition-colors">
            <X className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!taskId ? (
            <>
              {/* Task Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Tipo de Tarea</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Input (texto o JSON)</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='{"topic": "AI Marketing Trends", "tone": "professional"}'
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>

              {/* Execute Button */}
              <button
                onClick={handleExecute}
                disabled={!input.trim() || isTriggering}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isTriggering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isTriggering ? "Iniciando..." : "Ejecutar"}
              </button>
            </>
          ) : (
            /* Execution Status */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-1)]">
                {isRunning && <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />}
                {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isFailed && <AlertCircle className="h-5 w-5 text-[var(--error)]" />}
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {isRunning && "Ejecutando..."}
                    {isCompleted && "Completado"}
                    {isFailed && "Error en ejecución"}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {executionStatus?.status || "pending"}
                  </p>
                </div>
              </div>

              {isCompleted && executionStatus && (
                <div className="grid grid-cols-3 gap-3">
                  {executionStatus.tokensUsed != null && (
                    <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
                      <p className="text-xs text-[var(--text-secondary)]">Tokens</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {executionStatus.tokensUsed.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {executionStatus.cost != null && (
                    <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
                      <p className="text-xs text-[var(--text-secondary)]">Costo</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        ${executionStatus.cost.toFixed(4)}
                      </p>
                    </div>
                  )}
                  {executionStatus.duration != null && (
                    <div className="p-3 rounded-lg bg-[var(--surface-1)] text-center">
                      <p className="text-xs text-[var(--text-secondary)]">Duración</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {executionStatus.duration.toFixed(1)}s
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
