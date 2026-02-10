"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { X, Zap, Loader2, CheckCircle2, XCircle, Clock, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  TASK_TYPES_BY_DEPARTMENT,
  INPUT_FIELDS_BY_TASK_TYPE,
} from "@convex/lib/agentHelpers";
import type { InputFieldDef } from "@convex/lib/agentHelpers";

interface AgentInfo {
  _id: string;
  agentId: string;
  name: string;
  department: string;
  role: string;
}

interface RunAgentModalProps {
  agent: AgentInfo;
  onClose: () => void;
}

type ModalPhase = "configure" | "tracking" | "done";

export function RunAgentModal({ agent, onClose }: RunAgentModalProps) {
  // Derive initial task type from department (no effect needed)
  const [taskType, setTaskType] = useState(() => {
    const departmentTasks = TASK_TYPES_BY_DEPARTMENT[agent.department];
    return departmentTasks && departmentTasks.length > 0 ? departmentTasks[0].value : "";
  });
  const [inputValues, setInputValues] = useState<Record<string, string | number>>({});
  const [basePhase, setBasePhase] = useState<"configure" | "tracking">("configure");
  const [taskId, setTaskId] = useState<Id<"tasks"> | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerExecution = useMutation(api.agentExecution.triggerExecution);

  // Real-time status tracking
  const executionStatus = useQuery(
    api.agentExecution.getExecutionStatus,
    taskId ? { taskId } : "skip"
  );

  // Derive effective phase from basePhase + execution status (no effect needed)
  const phase: ModalPhase = useMemo(() => {
    if (basePhase === "tracking" && (executionStatus?.status === "completed" || executionStatus?.status === "failed")) {
      return "done";
    }
    return basePhase;
  }, [basePhase, executionStatus?.status]);

  // Reset input defaults when task type changes (called from handler, not effect)
  const handleTaskTypeChange = (newType: string) => {
    setTaskType(newType);
    const fields = INPUT_FIELDS_BY_TASK_TYPE[newType] || [];
    const defaults: Record<string, string | number> = {};
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    }
    setInputValues(defaults);
  };

  const handleExecute = async () => {
    const input: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(inputValues)) {
      if (value !== "" && value !== undefined) {
        input[key] = value;
      }
    }

    setBasePhase("tracking");
    try {
      const result = await triggerExecution({
        agentId: agent.agentId,
        taskType,
        input,
      });
      setTaskId(result.taskId);
    } catch {
      setBasePhase("configure");
    }
  };

  const handleCopyOutput = () => {
    if (executionStatus?.output?.content) {
      navigator.clipboard.writeText(executionStatus.output.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const departmentTasks = TASK_TYPES_BY_DEPARTMENT[agent.department] || [
    { value: "manual_execution", label: "Ejecución Manual" },
  ];
  const currentFields = INPUT_FIELDS_BY_TASK_TYPE[taskType] || [];

  const isFormValid = currentFields
    .filter((f) => f.required)
    .every((f) => {
      const val = inputValues[f.key];
      return val !== undefined && val !== "";
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg mx-4 rounded-xl border border-stone-200 bg-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Ejecutar Agente</h3>
              <p className="text-xs text-stone-500">{agent.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{agent.role}</Badge>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-900 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {phase === "configure" && (
              <motion.div
                key="configure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Task Type Selector */}
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Tipo de Tarea
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => handleTaskTypeChange(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-300"
                  >
                    {departmentTasks.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Input Fields */}
                {currentFields.map((field) => (
                  <InputField
                    key={field.key}
                    field={field}
                    value={inputValues[field.key] ?? ""}
                    onChange={(val) =>
                      setInputValues((prev) => ({ ...prev, [field.key]: val }))
                    }
                  />
                ))}
              </motion.div>
            )}

            {(phase === "tracking" || phase === "done") && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Status Pipeline */}
                <ExecutionTracker status={executionStatus} />

                {/* Output Preview */}
                {executionStatus?.status === "completed" && executionStatus.output?.content && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-600">Resultado</span>
                      <button
                        onClick={handleCopyOutput}
                        className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {executionStatus.output.content.slice(0, 1000)}
                      {executionStatus.output.content.length > 1000 && "..."}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {executionStatus?.status === "failed" && executionStatus.error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{executionStatus.error.message}</p>
                  </div>
                )}

                {/* Metrics */}
                {executionStatus?.status === "completed" && (
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    {executionStatus.tokensUsed && (
                      <span>{executionStatus.tokensUsed.toLocaleString()} tokens</span>
                    )}
                    {executionStatus.cost !== undefined && (
                      <span>${executionStatus.cost.toFixed(4)}</span>
                    )}
                    {executionStatus.duration !== undefined && (
                      <span>{(executionStatus.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-stone-200 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors rounded-lg"
          >
            {phase === "done" ? "Cerrar" : "Cancelar"}
          </button>
          {phase === "configure" && (
            <button
              onClick={handleExecute}
              disabled={!isFormValid}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors",
                "bg-orange-600 hover:bg-orange-500 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Zap className="h-3 w-3" />
              Ejecutar
            </button>
          )}
          {phase === "tracking" && !executionStatus && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-orange-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Iniciando...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Sub-components ---

function InputField({
  field,
  value,
  onChange,
}: {
  field: InputFieldDef;
  value: string | number;
  onChange: (val: string | number) => void;
}) {
  const baseClass =
    "w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-300";

  return (
    <div>
      <label className="text-xs font-medium text-stone-600 mb-1.5 block">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={cn(baseClass, "resize-none")}
        />
      ) : field.type === "select" && field.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          <option value="">Seleccionar...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

function ExecutionTracker({
  status,
}: {
  status:
    | {
        status: string;
        agentName: string;
        taskType: string;
        createdAt: number;
        startedAt?: number;
        completedAt?: number;
      }
    | null
    | undefined;
}) {
  const stages = [
    { key: "pending", label: "Pendiente", icon: Clock },
    { key: "running", label: "Ejecutando", icon: Loader2 },
    { key: "completed", label: "Completado", icon: CheckCircle2 },
  ];

  const currentStatus = status?.status || "pending";
  const statusIndex =
    currentStatus === "failed"
      ? 2
      : stages.findIndex((s) => s.key === currentStatus);

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center gap-3">
        {stages.map((stage, i) => {
          const isActive = i === statusIndex;
          const isDone = i < statusIndex;
          const isFailed = currentStatus === "failed" && i === 2;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    "w-8 h-0.5 rounded",
                    isDone || isActive ? "bg-orange-400" : "bg-stone-200"
                  )}
                />
              )}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  opacity: isDone || isActive ? 1 : 0.4,
                }}
                className="flex items-center gap-1.5"
              >
                {isFailed ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : isActive && currentStatus === "running" ? (
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                ) : (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-orange-500" : "text-stone-300"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isFailed
                      ? "text-red-600"
                      : isDone
                        ? "text-green-600"
                        : isActive
                          ? "text-orange-600"
                          : "text-stone-400"
                  )}
                >
                  {isFailed ? "Error" : stage.label}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
