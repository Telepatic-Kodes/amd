"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Network,
  Crown,
  Briefcase,
  User,
  Zap,
  Clock,
  Cpu,
  X,
} from "lucide-react";
import { OrgChart } from "@/components/org/OrgChart";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { StatusBadge, RoleBadge, Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  description?: string;
  department: string;
  role: string;
  status: string;
  config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  triggers?: string[];
}

const departmentColors: Record<string, string> = {
  leadership: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  content: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  social: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  demandgen: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  seo: "bg-green-500/10 text-green-400 border-green-500/20",
  brand: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ops: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const departmentLabels: Record<string, string> = {
  leadership: "Leadership",
  content: "Content",
  social: "Social Media",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Brand & Creative",
  ops: "Marketing Ops",
};

export default function OrgPage() {
  const agents = useQuery(api.functions.listAgents, {});
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const stats = agents
    ? {
        total: agents.length,
        active: agents.filter((a: { status: string }) => a.status === "active").length,
        directors: agents.filter((a: { role: string }) => a.role === "director").length,
        departments: new Set(agents.map((a: { department: string }) => a.department)).size,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <Network className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Organizational Chart
            </h1>
            <p className="text-zinc-500 text-sm">
              37 AI Agents - Hierarchical Structure
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-zinc-500">Total</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              <p className="text-xs text-zinc-500">Active</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.directors}</p>
              <p className="text-xs text-zinc-500">Directors</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.departments}</p>
              <p className="text-xs text-zinc-500">Depts</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Org Chart */}
        <div className="flex-1 overflow-x-auto">
          <Card>
            <CardContent className="p-4">
              <OrgChart
                agents={agents as Agent[] | undefined}
                selectedAgentId={selectedAgent?._id}
                onAgentSelect={(agent) => setSelectedAgent(agent as Agent)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Agent Details Panel */}
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 shrink-0"
          >
            <Card className="sticky top-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-semibold text-white">Agent Details</h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agent Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      departmentColors[selectedAgent.department]
                    )}
                  >
                    {selectedAgent.role === "cmo" && <Crown className="w-6 h-6" />}
                    {selectedAgent.role === "director" && <Briefcase className="w-6 h-6" />}
                    {selectedAgent.role === "specialist" && <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{selectedAgent.name}</h4>
                    <p className="text-xs text-zinc-500">{selectedAgent.agentId}</p>
                  </div>
                </div>

                {/* Status & Role */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selectedAgent.status} />
                  <RoleBadge role={selectedAgent.role} />
                  <Badge className={departmentColors[selectedAgent.department]}>
                    {departmentLabels[selectedAgent.department]}
                  </Badge>
                </div>

                {/* Description */}
                {selectedAgent.description && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Description</p>
                    <p className="text-sm text-zinc-300">{selectedAgent.description}</p>
                  </div>
                )}

                {/* Config */}
                {selectedAgent.config && (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">Configuration</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900">
                        <Cpu className="w-4 h-4 text-zinc-500" />
                        <div>
                          <p className="text-[10px] text-zinc-500">Model</p>
                          <p className="text-xs text-white truncate">
                            {selectedAgent.config.model?.split("-").slice(-2).join("-") || "claude"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900">
                        <Zap className="w-4 h-4 text-zinc-500" />
                        <div>
                          <p className="text-[10px] text-zinc-500">Temp</p>
                          <p className="text-xs text-white">
                            {selectedAgent.config.temperature || 0.7}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Triggers */}
                {selectedAgent.triggers && selectedAgent.triggers.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Triggers</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgent.triggers.map((trigger) => (
                        <span
                          key={trigger}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 text-xs text-zinc-400"
                        >
                          <Clock className="w-3 h-3" />
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
