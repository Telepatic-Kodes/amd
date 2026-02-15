"use client";

import { useState, useEffect, memo } from "react";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";

interface DashboardGreetingProps {
  userName: string;
  onExecuteAgent: () => void;
}

export const DashboardGreeting = memo(function DashboardGreeting({
  userName,
  onExecuteAgent,
}: DashboardGreetingProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

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
  const timeStr = currentTime.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-baseline justify-between">
      <div>
        <h1
          className="text-base font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {greeting}, {userName}
        </h1>
        <p
          className="text-xs capitalize mt-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          {dateStr} &middot; {timeStr}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExecuteAgent}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          Ejecutar Agente
        </button>
        <Link
          href="/content"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Tarea
        </Link>
      </div>
    </div>
  );
});
