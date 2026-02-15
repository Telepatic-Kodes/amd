"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = ["Bienvenida", "Objetivos", "Canales", "Feeds", "Agentes", "Lanzar"];

interface StepperProps {
  currentStep: number;
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 px-4">
      {STEPS.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border",
                  done && "bg-[var(--accent)] border-[var(--accent)] text-white",
                  active && "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)] ring-2 ring-[var(--accent)]/30",
                  !done && !active && "bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-tertiary)]"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium hidden sm:block",
                  active ? "text-[var(--accent)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-6 sm:w-12 h-px transition-colors duration-300 mb-4 sm:mb-5",
                  i < currentStep ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
