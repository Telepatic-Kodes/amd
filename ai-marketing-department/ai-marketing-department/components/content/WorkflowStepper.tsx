"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { key: "draft", label: "Borrador" },
  { key: "review", label: "Revisión" },
  { key: "approved", label: "Aprobado" },
  { key: "published", label: "Publicado" },
] as const;

const statusToStep: Record<string, number> = {
  draft: 0,
  review: 1,
  revision_needed: 1,
  approved: 2,
  scheduled: 2,
  published: 3,
  archived: 3,
};

interface WorkflowStepperProps {
  currentStatus: string;
  onAdvance?: (nextStatus: string) => void;
  loading?: boolean;
}

export function WorkflowStepper({
  currentStatus,
  onAdvance,
  loading,
}: WorkflowStepperProps) {
  const currentStepIndex = statusToStep[currentStatus] ?? 0;

  return (
    <div className="flex items-center">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isNext = index === currentStepIndex + 1;
        const lineCompleted = index < currentStepIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Connector line before step (skip first) */}
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-4",
                  lineCompleted
                    ? "bg-[var(--success)]"
                    : "bg-[var(--border)]"
                )}
              />
            )}

            {/* Step pill */}
            <button
              type="button"
              disabled={!isNext || loading || !onAdvance}
              onClick={() => {
                if (isNext && onAdvance && !loading) {
                  onAdvance(step.key);
                }
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                isCompleted &&
                  "bg-[var(--success)]/10 text-[var(--success)]",
                isCurrent &&
                  "bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30",
                isNext &&
                  onAdvance &&
                  "cursor-pointer bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
                isNext && (!onAdvance || loading) &&
                  "bg-[var(--surface-1)] text-[var(--text-tertiary)]",
                !isCompleted && !isCurrent && !isNext &&
                  "bg-[var(--surface-1)] text-[var(--text-tertiary)]",
                (!isNext || loading || !onAdvance) &&
                  "cursor-default"
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {step.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
