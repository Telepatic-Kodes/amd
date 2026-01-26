"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Search,
  Users,
  Crown,
  Briefcase,
  User,
  Bot,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, RoleBadge, Badge } from "@/components/ui/Badge";

const DEPARTMENTS = [
  { value: "", label: "All Departments" },
  { value: "leadership", label: "Leadership" },
  { value: "content", label: "Content" },
  { value: "social", label: "Social Media" },
  { value: "demandgen", label: "Demand Gen" },
  { value: "seo", label: "SEO" },
  { value: "brand", label: "Brand & Creative" },
  { value: "ops", label: "Marketing Ops" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error", label: "Error" },
  { value: "maintenance", label: "Maintenance" },
];

const departmentColors: Record<string, string> = {
  leadership: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  content: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  social: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  demandgen: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  seo: "bg-green-500/10 text-green-400 border-green-500/20",
  brand: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ops: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const roleIcons: Record<string, React.ElementType> = {
  cmo: Crown,
  director: Briefcase,
  specialist: User,
};

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const agents = useQuery(api.functions.listAgents, {
    department: departmentFilter || undefined,
    status: statusFilter || undefined,
  });

  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    let filtered = [...agents];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.agentId.toLowerCase().includes(query)
      );
    }

    // Sort by role hierarchy: CMO -> Director -> Specialist
    const roleOrder = { cmo: 0, director: 1, specialist: 2 };
    filtered.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
      const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [agents, searchQuery]);

  const selectedAgentData = useMemo(() => {
    if (!selectedAgent || !agents) return null;
    return agents.find((a) => a.agentId === selectedAgent);
  }, [selectedAgent, agents]);

  if (!agents) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Agents
          </h1>
          <p className="text-zinc-400 mt-2">
            Manage and monitor your AI marketing team.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Agents
        </h1>
        <p className="text-zinc-400 mt-2">
          Manage and monitor your AI marketing team of {agents.length} agents.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-4 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {agents.filter((a) => a.status === "active").length} Active
        </Badge>
        <Badge variant="warning">
          {agents.filter((a) => a.status === "paused").length} Paused
        </Badge>
        <Badge variant="error">
          {agents.filter((a) => a.status === "error").length} Errors
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Agents Grid */}
        <div className={cn(
          "flex-1 transition-all",
          selectedAgent ? "lg:w-2/3" : "w-full"
        )}>
          {filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 py-16">
              <Users className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No agents found</p>
              <p className="text-sm text-zinc-500 mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent) => {
                const RoleIcon = roleIcons[agent.role] || Bot;
                const isSelected = selectedAgent === agent.agentId;

                return (
                  <Card
                    key={agent._id}
                    hover
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    )}
                  >
                    <CardContent
                      className="p-4"
                      onClick={() =>
                        setSelectedAgent(isSelected ? null : agent.agentId)
                      }
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg",
                              agent.status === "active"
                                ? "bg-indigo-500/10 text-indigo-400"
                                : agent.status === "error"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            )}
                          >
                            <RoleIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm">
                              {agent.name}
                            </h3>
                            <p className="text-xs text-zinc-500">
                              {agent.agentId}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={agent.status} />
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                        {agent.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <Badge
                          className={departmentColors[agent.department]}
                        >
                          {agent.department}
                        </Badge>
                        <RoleBadge role={agent.role} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Agent Details Panel */}
        {selectedAgentData && (
          <div className="hidden lg:block w-1/3">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Agent Details
                  </h3>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name & Status */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Name</p>
                    <p className="text-white font-medium">
                      {selectedAgentData.name}
                    </p>
                  </div>

                  {/* ID */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Agent ID</p>
                    <p className="text-zinc-300 font-mono text-sm">
                      {selectedAgentData.agentId}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Description</p>
                    <p className="text-zinc-300 text-sm">
                      {selectedAgentData.description}
                    </p>
                  </div>

                  {/* Department & Role */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Department</p>
                      <Badge className={departmentColors[selectedAgentData.department]}>
                        {selectedAgentData.department}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Role</p>
                      <RoleBadge role={selectedAgentData.role} />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Status</p>
                    <StatusBadge status={selectedAgentData.status} />
                  </div>

                  {/* Model */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Model</p>
                    <p className="text-zinc-300 font-mono text-sm">
                      {selectedAgentData.config.model}
                    </p>
                  </div>

                  {/* Config */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Configuration</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-zinc-900/50 p-2">
                        <p className="text-xs text-zinc-500">Temperature</p>
                        <p className="text-zinc-300 font-mono">
                          {selectedAgentData.config.temperature}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-900/50 p-2">
                        <p className="text-xs text-zinc-500">Max Tokens</p>
                        <p className="text-zinc-300 font-mono">
                          {selectedAgentData.config.maxTokens}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Triggers */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Triggers</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgentData.triggers.map((trigger: string) => (
                        <Badge key={trigger} variant="default">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
