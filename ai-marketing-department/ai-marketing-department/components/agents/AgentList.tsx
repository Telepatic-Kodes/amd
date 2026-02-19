"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Doc } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { AgentListItem } from "./AgentListItem";

const DEPARTMENTS = [
  { key: "leadership", label: "Liderazgo" },
  { key: "content", label: "Contenido" },
  { key: "social", label: "Social Media" },
  { key: "demandgen", label: "Demand Gen" },
  { key: "seo", label: "SEO" },
  { key: "brand", label: "Marca & Creativo" },
  { key: "ops", label: "Marketing Ops" },
] as const;

interface AgentListProps {
  agents: Doc<"agents">[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onExecuteAgent: (agent: Doc<"agents">) => void;
  onTogglePauseAgent: (agent: Doc<"agents">) => void;
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onExecuteAgent,
  onTogglePauseAgent,
}: AgentListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groupedAgents = useMemo(() => {
    const groups = new Map<string, Doc<"agents">[]>();
    for (const agent of agents) {
      const existing = groups.get(agent.department) ?? [];
      existing.push(agent);
      groups.set(agent.department, existing);
    }
    return groups;
  }, [agents]);

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {DEPARTMENTS.map((dept) => {
        const deptAgents = groupedAgents.get(dept.key);
        if (!deptAgents || deptAgents.length === 0) return null;

        const activeCount = deptAgents.filter(
          (a) => a.status === "active"
        ).length;
        const isCollapsed = collapsed.has(dept.key);

        return (
          <div key={dept.key}>
            <button
              type="button"
              onClick={() => toggleSection(dept.key)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200",
                  isCollapsed && "-rotate-90"
                )}
              />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {dept.label}
              </span>
              <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                {activeCount}/{deptAgents.length} activos
              </span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 pl-2">
                    {deptAgents.map((agent) => (
                      <AgentListItem
                        key={agent._id}
                        agent={agent}
                        isSelected={selectedAgentId === agent._id}
                        onSelect={() => onSelectAgent(agent._id)}
                        onExecute={() => onExecuteAgent(agent)}
                        onTogglePause={() => onTogglePauseAgent(agent)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
