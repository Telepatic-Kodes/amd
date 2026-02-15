"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/language";

interface Agent {
  _id: string;
  agentId?: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "paused" | "error" | "maintenance";
}

interface AgentStatusGridProps {
  agentsByDepartment?: Record<string, Agent[]>;
  statusCounts?: {
    active: number;
    paused: number;
    error: number;
    maintenance: number;
  };
  onRunAgent?: (agent: Agent) => void;
}

const departmentNames: Record<string, string> = {
  leadership: "Liderazgo",
  content: "Contenido",
  social: "Redes Sociales",
  demandgen: "Generación",
  seo: "SEO",
  brand: "Marca",
  ops: "Operaciones",
};

const statusColors: Record<string, string> = {
  active: "bg-green-400",
  paused: "bg-yellow-400",
  error: "bg-[var(--error)]",
  maintenance: "bg-orange-400",
};

const statusPulse: Record<string, boolean> = {
  active: true,
  paused: false,
  error: true,
  maintenance: false,
};

export function AgentStatusGrid({
  agentsByDepartment,
  statusCounts,
  onRunAgent,
}: AgentStatusGridProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [collapsedDepartments, setCollapsedDepartments] = useState<
    Set<string>
  >(new Set());

  // Loading state with skeleton cards
  if (!agentsByDepartment || !statusCounts) {
    return (
      <div>
        <div className="mb-6 h-10 rounded-lg bg-[var(--surface-1)] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const departments = Object.keys(agentsByDepartment);
  const allDepartments = ["all", ...departments];

  const toggleDepartment = (dept: string) => {
    setCollapsedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  };

  const renderAgentCard = (agent: Agent) => {
    const shouldPulse = statusPulse[agent.status];
    const isActive = agent.status === "active";
    return (
      <Card key={agent._id} className="p-3 min-h-[72px] hover:border-[var(--border)] transition-colors group">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${statusColors[agent.status]} ${
              shouldPulse ? "animate-pulse" : ""
            }`}
          />
          <span className="font-medium text-sm text-[var(--text-primary)] truncate flex-1">
            {agent.name}
          </span>
          <Badge variant="default" className="text-xs">
            {agent.role}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-tertiary)]">
            {departmentNames[agent.department] || agent.department}
          </span>
          {isActive && onRunAgent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRunAgent(agent);
              }}
              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-subtle)] rounded-md hover:bg-orange-100 transition-all"
            >
              <Zap className="h-2.5 w-2.5" />
              Ejecutar
            </button>
          )}
        </div>
      </Card>
    );
  };

  const renderDepartmentSection = (dept: string, agents: Agent[]) => {
    const isCollapsed = collapsedDepartments.has(dept);
    return (
      <div key={dept} className="mb-6">
        <button
          onClick={() => toggleDepartment(dept)}
          className="flex items-center gap-2 mb-3 min-h-[44px] py-2 text-[var(--text-primary)] font-semibold hover:text-[var(--text-secondary)] transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>
            {departmentNames[dept] || dept} ({agents.length}{" "}
            {agents.length === 1 ? "agente" : "agentes"})
          </span>
        </button>
        {!isCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agents.map(renderAgentCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Status Summary Bar */}
      <div className="mb-6 flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          {statusCounts.active} {translate("agentsActive")}
        </span>
        <span className="text-[var(--text-tertiary)]">|</span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          {statusCounts.paused} {translate("agentsPaused")}
        </span>
        <span className="text-[var(--text-tertiary)]">|</span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--error)]" />
          {statusCounts.error} {translate("agentsError")}
        </span>
        <span className="text-[var(--text-tertiary)]">|</span>
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          {statusCounts.maintenance} {translate("agentsMaintenance")}
        </span>
      </div>

      {/* Department Filter Tabs - Horizontal scroll on mobile */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 flex-nowrap min-w-min">
          {allDepartments.map((dept) => {
            const isActive = selectedDepartment === dept;
            const label =
              dept === "all" ? translate("allDepartments") : departmentNames[dept] || dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)] border border-orange-200"
                    : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] border border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent Grid */}
      <div>
        {selectedDepartment === "all" ? (
          // Show all departments as collapsible sections
          <div>
            {departments.map((dept) => {
              const agents = agentsByDepartment[dept];
              return renderDepartmentSection(dept, agents);
            })}
          </div>
        ) : (
          // Show only selected department
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agentsByDepartment[selectedDepartment]?.map(renderAgentCard) || (
              <p className="text-[var(--text-tertiary)] col-span-full">
                No hay agentes en este departamento
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
