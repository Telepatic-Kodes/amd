"use client";

import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-blue-500",
  running: "bg-amber-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

interface TaskCardProps {
  task: {
    _id: string;
    title?: string;
    agentId?: string;
    type: string;
    status: string;
    createdAt: number;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export function TaskCard({ task, isSelected, onSelect }: TaskCardProps) {
  const label = task.title || task.agentId || "Tarea";
  const date = new Date(task.createdAt);
  const timeStr = date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isSelected
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] dark:bg-orange-900/10 shadow-sm"
          : "border-[var(--border)] bg-[var(--card-bg)] dark:bg-[var(--surface-0)] hover:border-orange-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              STATUS_DOT[task.status] || "bg-[var(--surface-2)]"
            )}
          />
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {task.type}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">
          {timeStr}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
        {label}
      </h4>
    </button>
  );
}
