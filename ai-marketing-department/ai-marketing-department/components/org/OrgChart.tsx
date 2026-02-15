"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { AgentNode, AgentNodeSkeleton } from "./AgentNode";

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  description?: string;
  department: string;
  role: string;
  status: string;
}

interface OrgChartProps {
  agents: Agent[] | undefined;
  onAgentSelect?: (agent: Agent) => void;
  selectedAgentId?: string;
}

const _departmentLabels: Record<string, string> = {
  leadership: "Leadership",
  content: "Content",
  social: "Social Media",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Brand & Creative",
  ops: "Marketing Ops",
};

const departmentOrder = ["content", "social", "demandgen", "seo", "brand", "ops"];

export function OrgChart({ agents, onAgentSelect, selectedAgentId }: OrgChartProps) {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(departmentOrder));

  const { cmo, directors, specialists } = useMemo(() => {
    if (!agents) return { cmo: null, directors: [] as Agent[], specialists: {} as Record<string, Agent[]> };

    const cmo = agents.find((a) => a.role === "cmo");
    const directors = agents.filter((a) => a.role === "director");
    const specialists: Record<string, Agent[]> = {};

    agents
      .filter((a) => a.role === "specialist")
      .forEach((agent) => {
        if (!specialists[agent.department]) {
          specialists[agent.department] = [];
        }
        specialists[agent.department].push(agent);
      });

    return { cmo, directors, specialists };
  }, [agents]);

  const toggleDepartment = (dept: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) {
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  if (!agents) {
    return (
      <div className="flex flex-col items-center gap-8 py-8">
        <AgentNodeSkeleton size="lg" />
        <div className="w-px h-8 bg-[var(--surface-2)]" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AgentNodeSkeleton key={i} size="md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 overflow-x-auto">
      {/* CMO Level */}
      {cmo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <AgentNode
            agent={cmo}
            size="lg"
            isSelected={selectedAgentId === cmo._id}
            onClick={() => onAgentSelect?.(cmo)}
          />
        </motion.div>
      )}

      {/* Connector line from CMO to Directors */}
      <svg className="w-full h-12 overflow-visible" style={{ minWidth: "900px" }}>
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="20"
          stroke="rgb(63 63 70)"
          strokeWidth="2"
        />
        <line
          x1="8%"
          y1="20"
          x2="92%"
          y2="20"
          stroke="rgb(63 63 70)"
          strokeWidth="2"
        />
        {departmentOrder.map((_, i) => (
          <line
            key={i}
            x1={`${8 + (i * 84) / 5}%`}
            y1="20"
            x2={`${8 + (i * 84) / 5}%`}
            y2="40"
            stroke="rgb(63 63 70)"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Directors Level */}
      <div className="flex flex-wrap justify-center gap-4" style={{ minWidth: "900px" }}>
        {departmentOrder.map((dept, index) => {
          const director = directors.find((d) => d.department === dept);
          const deptSpecialists = specialists[dept] || [];
          const isExpanded = expandedDepts.has(dept);

          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              {/* Director */}
              {director && (
                <AgentNode
                  agent={director}
                  size="md"
                  isSelected={selectedAgentId === director._id}
                  onClick={() => onAgentSelect?.(director)}
                />
              )}

              {/* Expand/Collapse button */}
              {deptSpecialists.length > 0 && (
                <button
                  onClick={() => toggleDepartment(dept)}
                  className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-tertiary)] transition-colors rounded-md hover:bg-[var(--surface-2)]/50"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <Users className="w-3 h-3" />
                  <span>{deptSpecialists.length}</span>
                </button>
              )}

              {/* Connector to specialists */}
              <AnimatePresence>
                {isExpanded && deptSpecialists.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center mt-2"
                  >
                    <div className="w-px h-4 bg-[var(--surface-2)]" />
                    <div className="flex flex-col gap-2">
                      {deptSpecialists.map((specialist, i) => (
                        <motion.div
                          key={specialist._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <AgentNode
                            agent={specialist}
                            size="sm"
                            isSelected={selectedAgentId === specialist._id}
                            onClick={() => onAgentSelect?.(specialist)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-[var(--text-tertiary)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Paused</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Error</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--accent)]" />
          <span>Maintenance</span>
        </div>
      </motion.div>
    </div>
  );
}
