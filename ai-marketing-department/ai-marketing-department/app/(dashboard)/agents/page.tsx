"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Crown,
  Briefcase,
  User,
  Bot,
  Filter,
  ChevronDown,
  Activity,
  Zap,
  X,
  Play,
  Pause,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, RoleBadge, Badge } from "@/components/ui/Badge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyAgents, EmptySearchResults } from "@/components/ui/EmptyState";

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
  content: "bg-orange-500/10 text-orange-400 border-orange-500/20",
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
    return agents.find((a: { agentId: string }) => a.agentId === selectedAgent);
  }, [selectedAgent, agents]);

  if (!agents) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Bot className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
              Agents
            </h1>
            <p className="text-stone-400 mt-1">
              Manage and monitor your AI marketing team.
            </p>
          </div>
        </div>
        <SkeletonGrid items={9} columns={3} />
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10">
          <Bot className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
            Agents
          </h1>
          <p className="text-stone-400 mt-1">
            Manage and monitor your AI marketing team of {agents.length} agents.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            inputMode="search"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-[#faf8f4]/50 py-2 pl-10 pr-4 text-sm text-white placeholder-stone-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-[#faf8f4]/50 py-2 pl-10 pr-8 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-[#faf8f4]/50 py-2 pl-4 pr-8 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {agents.filter((a: { status: string }) => a.status === "active").length} Active
        </Badge>
        <Badge variant="warning">
          {agents.filter((a: { status: string }) => a.status === "paused").length} Paused
        </Badge>
        <Badge variant="error">
          {agents.filter((a: { status: string }) => a.status === "error").length} Errors
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Agents Grid */}
        <div className={cn(
          "flex-1 transition-all",
          selectedAgent ? "lg:w-2/3" : "w-full"
        )}>
          <AnimatePresence mode="wait">
            {filteredAgents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {searchQuery || departmentFilter || statusFilter ? (
                  <EmptySearchResults />
                ) : (
                  <EmptyAgents />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredAgents.map((agent, index) => {
                  const RoleIcon = roleIcons[agent.role] || Bot;
                  const isSelected = selectedAgent === agent.agentId;

                  return (
                    <motion.div
                      key={agent._id}
                      variants={itemVariants}
                      layout
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <Card
                        hover
                        className={cn(
                          "cursor-pointer transition-all h-full",
                          isSelected && "border-orange-500 shadow-lg shadow-orange-500/20"
                        )}
                      >
                        <div
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
                                  "relative flex h-10 w-10 items-center justify-center rounded-lg",
                                  agent.status === "active"
                                    ? "bg-orange-500/10 text-orange-400"
                                    : agent.status === "error"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-stone-500/10 text-stone-400"
                                )}
                              >
                                <RoleIcon className="h-5 w-5" />
                                {/* Activity indicator */}
                                {agent.status === "active" && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-sm">
                                  {agent.name}
                                </h3>
                                <p className="text-xs text-stone-500 font-mono">
                                  {agent.agentId}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={agent.status} />
                          </div>

                          {/* Description */}
                          <p className="text-xs text-stone-400 mb-3 line-clamp-2">
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
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Agent Details Panel */}
        <AnimatePresence>
          {selectedAgentData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block w-1/3"
            >
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      Agent Details
                    </h3>
                    <button
                      onClick={() => setSelectedAgent(null)}
                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name & Status */}
                    <div>
                      <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Name</p>
                      <p className="text-white font-medium">
                        {selectedAgentData.name}
                      </p>
                    </div>

                    {/* ID */}
                    <div>
                      <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Agent ID</p>
                      <p className="text-stone-300 font-mono text-sm bg-stone-100/50 rounded px-2 py-1 inline-block">
                        {selectedAgentData.agentId}
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Description</p>
                      <p className="text-stone-300 text-sm">
                        {selectedAgentData.description}
                      </p>
                    </div>

                    {/* Department & Role */}
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Department</p>
                        <Badge className={departmentColors[selectedAgentData.department]}>
                          {selectedAgentData.department}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Role</p>
                        <RoleBadge role={selectedAgentData.role} />
                      </div>
                    </div>

                    {/* Status with actions */}
                    <div>
                      <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Status</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={selectedAgentData.status} />
                        <div className="flex gap-1 ml-auto">
                          <button className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors" title="Start">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors" title="Pause">
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors" title="Configure">
                            <Settings2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Model */}
                    <div>
                      <p className="text-xs text-stone-500 mb-1 uppercase tracking-wider">Model</p>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <p className="text-stone-300 font-mono text-sm">
                          {selectedAgentData.config.model}
                        </p>
                      </div>
                    </div>

                    {/* Config */}
                    <div>
                      <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider">Configuration</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-stone-100/50 p-3 border border-stone-200/50">
                          <p className="text-xs text-stone-500">Temperature</p>
                          <p className="text-stone-300 font-mono text-lg">
                            {selectedAgentData.config.temperature}
                          </p>
                        </div>
                        <div className="rounded-lg bg-stone-100/50 p-3 border border-stone-200/50">
                          <p className="text-xs text-stone-500">Max Tokens</p>
                          <p className="text-stone-300 font-mono text-lg">
                            {selectedAgentData.config.maxTokens.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Triggers */}
                    <div>
                      <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider">Triggers</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAgentData.triggers.map((trigger: string) => (
                          <Badge key={trigger} variant="default" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
