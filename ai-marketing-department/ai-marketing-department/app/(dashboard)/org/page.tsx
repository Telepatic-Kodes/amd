"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { GitBranch } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { OrgChart } from "@/components/org/OrgChart";
import { HandoffOverlay } from "@/components/org/HandoffOverlay";
import { AgentDetailPanel } from "@/components/org/AgentDetailPanel";

const DEPARTMENTS = [
  { id: "all", label: "Todos" },
  { id: "leadership", label: "Leadership" },
  { id: "content", label: "Content" },
  { id: "social", label: "Social Media" },
  { id: "demandgen", label: "Demand Gen" },
  { id: "seo", label: "SEO" },
  { id: "brand", label: "Brand" },
  { id: "ops", label: "Marketing Ops" },
];

const STATUSES = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activo" },
  { id: "paused", label: "Pausado" },
  { id: "error", label: "Error" },
];

export default function OrgPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positions, setPositions] = useState<Map<string, DOMRect>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Queries
  const agents = useQuery(
    api.functions.listAgents,
    deptFilter === "all" ? {} : { department: deptFilter }
  );

  const handoffGraph = useQuery(api.orgChart.getHandoffGraph);

  // Filter agents by status client-side (listAgents only supports one index at a time)
  const filteredAgents = useMemo(() => {
    if (!agents) return undefined;
    if (statusFilter === "all") return agents;
    return agents.filter((a: Record<string, string>) => a.status === statusFilter);
  }, [agents, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!agents) return { total: 0, departments: 0, active: 0 };
    const departments = new Set(agents.map((a: Record<string, string>) => a.department));
    const active = agents.filter((a: Record<string, string>) => a.status === "active").length;
    return { total: agents.length, departments: departments.size, active };
  }, [agents]);

  // Track container rect for SVG overlay positioning
  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => {
      if (containerRef.current) {
        setContainerRect(containerRef.current.getBoundingClientRect());
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);
    window.addEventListener("scroll", update, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  const handleAgentSelect = useCallback((agent: { _id: string }) => {
    setSelectedAgentId((prev) =>
      prev === agent._id ? null : (agent._id as Id<"agents">)
    );
  }, []);

  const handlePositionsChange = useCallback((newPositions: Map<string, DOMRect>) => {
    setPositions(newPositions);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <GitBranch className="w-8 h-8 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organigrama</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {agents === undefined ? "Cargando..." : `${stats.total} agentes · ${stats.departments} departamentos · ${stats.active} activos`}
          </p>
        </div>
      </div>

      {/* Department Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setDeptFilter(dept.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              deptFilter === dept.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            )}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2">
        {STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
              statusFilter === status.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]"
            )}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex gap-4">
        {/* Org Chart + Overlay container */}
        <div ref={containerRef} className="relative flex-1 min-w-0">
          <OrgChart
            agents={filteredAgents}
            onAgentSelect={handleAgentSelect}
            selectedAgentId={selectedAgentId ?? undefined}
            hoveredAgentId={hoveredAgentId}
            onAgentHover={setHoveredAgentId}
            onPositionsChange={handlePositionsChange}
          />

          {/* Handoff Overlay */}
          {handoffGraph && handoffGraph.length > 0 && (
            <HandoffOverlay
              edges={handoffGraph}
              positions={positions}
              containerRect={containerRect}
              hoveredAgentId={hoveredAgentId}
            />
          )}
        </div>

        {/* Agent Detail Panel */}
        <AnimatePresence>
          {selectedAgentId && (
            <AgentDetailPanel
              agentId={selectedAgentId}
              onClose={() => setSelectedAgentId(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
