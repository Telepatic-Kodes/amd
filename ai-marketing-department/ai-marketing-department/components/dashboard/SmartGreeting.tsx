"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { useBrandContext } from "@/hooks/useBrandContext";
import { Zap } from "lucide-react";

interface SmartGreetingProps {
  userName: string;
  contentInReview?: number;
  agentErrors?: number;
  publishedToday?: number;
  strategyProgress?: number;
  tasksCompleted?: number;
  tasksFailed?: number;
  onExecuteAgent: () => void;
}

export const SmartGreeting = memo(function SmartGreeting({
  userName,
  contentInReview = 0,
  agentErrors = 0,
  publishedToday = 0,
  strategyProgress,
  tasksCompleted = 0,
  tasksFailed = 0,
  onExecuteAgent,
}: SmartGreetingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { activeBrand } = useBrandContext();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hour = currentTime.getHours();
  const greeting =
    hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  const dateStr = currentTime.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Context-aware briefing message
  const briefing = useMemo(() => {
    const parts: string[] = [];

    if (hour < 12) {
      // Morning
      if (contentInReview > 0) parts.push(`${contentInReview} contenidos para revisar`);
      if (strategyProgress != null) parts.push(`estrategia al ${strategyProgress}%`);
      if (agentErrors > 0) parts.push(`${agentErrors} agentes con errores`);
    } else if (hour < 18) {
      // Afternoon
      if (publishedToday > 0) parts.push(`${publishedToday} posts publicados hoy`);
      if (contentInReview > 0) parts.push(`${contentInReview} pendientes de revision`);
    } else {
      // Evening
      if (tasksCompleted > 0 || tasksFailed > 0) {
        const summary = [`${tasksCompleted} tareas completadas`];
        if (tasksFailed > 0) summary.push(`${tasksFailed} fallida${tasksFailed > 1 ? "s" : ""}`);
        parts.push(summary.join(", "));
      }
    }

    if (parts.length === 0) return null;
    return parts.join(". ") + ".";
  }, [hour, contentInReview, agentErrors, publishedToday, strategyProgress, tasksCompleted, tasksFailed]);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-base font-medium text-[var(--text-primary)]">
          {greeting}, {userName}
          {activeBrand && (
            <span className="text-[var(--text-tertiary)] font-normal">
              {" "}· {activeBrand.companyName}
            </span>
          )}
        </h1>
        <p className="text-xs capitalize mt-0.5 text-[var(--text-tertiary)]">
          {dateStr}
        </p>
        {briefing && (
          <p className="text-xs mt-1 text-[var(--text-secondary)]">
            {briefing}
          </p>
        )}
      </div>
      <button
        onClick={onExecuteAgent}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors shrink-0"
        style={{ backgroundColor: "var(--brand-accent)" }}
      >
        <Zap className="h-3.5 w-3.5" />
        Ejecutar Agente
      </button>
    </div>
  );
});
