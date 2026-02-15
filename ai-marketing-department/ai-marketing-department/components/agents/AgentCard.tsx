"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const DEPARTMENT_COLORS: Record<string, string> = {
  leadership: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  content: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  demandgen: "bg-[var(--badge-green-bg)] text-green-700 dark:bg-green-900/30 dark:text-[var(--success)]",
  seo: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  brand: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  ops: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const STATUS_INDICATOR: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-amber-500",
  error: "bg-red-500",
  maintenance: "bg-[var(--text-secondary)]",
};

interface AgentCardProps {
  agent: {
    _id: string;
    agentId: string;
    name: string;
    description: string;
    department: string;
    status: string;
    triggers: string[];
  };
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        isSelected
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] dark:bg-orange-900/10 shadow-sm"
          : "border-[var(--border)] bg-[var(--card-bg)] dark:bg-[var(--surface-0)] hover:border-orange-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", STATUS_INDICATOR[agent.status] || "bg-[var(--text-tertiary)]")} />
          <span className="text-xs font-mono text-[var(--text-secondary)]">{agent.agentId}</span>
        </div>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          DEPARTMENT_COLORS[agent.department] || "bg-[var(--surface-1)] text-[var(--text-primary)]"
        )}>
          {agent.department}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 line-clamp-1">
        {agent.name}
      </h4>
      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
        {agent.description}
      </p>

      <div className="flex flex-wrap gap-1">
        {agent.triggers.slice(0, 3).map((trigger) => (
          <Badge key={trigger} variant="default" className="text-[10px] px-1.5 py-0">
            {trigger}
          </Badge>
        ))}
        {agent.triggers.length > 3 && (
          <span className="text-[10px] text-[var(--text-secondary)]">+{agent.triggers.length - 3}</span>
        )}
      </div>
    </button>
  );
}
