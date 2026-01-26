"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const stats = useQuery(api.functions.getDashboardStats);

  if (!stats) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">
          Overview of your AI Marketing Department performance.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Agents"
          value={stats.agents.active}
          total={stats.agents.total}
          icon={Bot}
          trend="+2"
          trendUp={true}
          description="agents running"
        />
        <StatCard
          title="Tasks Completed"
          value={stats.tasks.completed}
          total={stats.tasks.total}
          icon={CheckCircle2}
          trend="+15%"
          trendUp={true}
          description="completion rate"
        />
        <StatCard
          title="Content Drafts"
          value={stats.content.draft}
          total={stats.content.total}
          icon={FileText}
          trend="+5"
          trendUp={true}
          description="pending review"
        />
        <StatCard
          title="Avg Duration"
          value="45s" // This would ideally come from the backend if available in this query
          total="-"
          icon={Clock}
          trend="-10%"
          trendUp={true}
          description="per task"
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Status */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur-xl">
          <h3 className="mb-6 flex items-center gap-2 font-semibold text-lg">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Task Performance
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Success Rate"
              value={stats.tasks.completed}
              total={stats.tasks.total}
              color="bg-green-500"
            />
            <ProgressBar
              label="Running"
              value={stats.tasks.running}
              total={stats.tasks.total}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Pending"
              value={stats.tasks.pending}
              total={stats.tasks.total}
              color="bg-yellow-500"
            />
            <ProgressBar
              label="Failed"
              value={stats.tasks.failed}
              total={stats.tasks.total}
              color="bg-red-500"
            />
          </div>
        </div>

        {/* Agent Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur-xl">
          <h3 className="mb-6 flex items-center gap-2 font-semibold text-lg">
            <Users className="h-5 w-5 text-purple-500" />
            Agent Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.agents.byDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
                <span className="capitalize text-zinc-400">{dept}</span>
                <span className="font-mono font-bold">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  total,
  icon: Icon,
  trend,
  trendUp,
  description
}: {
  title: string;
  value: string | number;
  total?: string | number;
  icon: any;
  trend: string;
  trendUp: boolean;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 backdrop-blur-xl transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-indigo-500/10">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-zinc-900 p-2 text-zinc-400">
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          trendUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end gap-2">
          <h2 className="text-3xl font-bold text-white">{value}</h2>
          {total && <span className="mb-1 text-sm text-zinc-500">/ {total}</span>}
        </div>
        <p className="text-sm text-zinc-400 mt-1">{title}</p>
        <p className="text-xs text-zinc-600 mt-2">{description}</p>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300">{value} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
        <div
          className={cn("h-full transition-all duration-500 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
