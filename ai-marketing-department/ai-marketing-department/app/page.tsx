"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
  Bot,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Sparkline } from "@/components/charts/Sparkline";
import { DonutChart } from "@/components/charts/DonutChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { chartColors } from "@/components/charts/theme";
import { SimpleCounter, PercentageCounter } from "@/components/ui/AnimatedCounter";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { SkeletonStat, SkeletonChart, SkeletonDonut } from "@/components/ui/Skeleton";
import { EmptyAgents, EmptyAnalytics } from "@/components/ui/EmptyState";
import { ActivityFeed, ActivityItem } from "@/components/ui/ActivityFeed";

// Mock sparkline data generator
function generateSparklineData(base: number, variance: number = 0.3): { value: number }[] {
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + (Math.random() - 0.5) * base * variance * 2),
  }));
}

// Mock weekly data for area chart
function generateWeeklyData() {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days.map((day, i) => ({
    day,
    tasks: Math.floor(Math.random() * 20) + 5,
    content: Math.floor(Math.random() * 15) + 3,
    executions: Math.floor(Math.random() * 30) + 10,
  }));
}

// Mock activity feed data
function generateMockActivities(): ActivityItem[] {
  const now = Date.now();
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'content_generated',
      title: 'Blog post generated',
      description: 'SEO-optimized article about AI marketing trends',
      timestamp: now - 1000 * 60 * 2, // 2 minutes ago
      agent: 'content-002',
    },
    {
      id: '2',
      type: 'task_completed',
      title: 'Twitter thread completed',
      description: '5-tweet thread about automation benefits',
      timestamp: now - 1000 * 60 * 15, // 15 minutes ago
      agent: 'social-002',
    },
    {
      id: '3',
      type: 'handoff',
      title: 'Handoff to Content Director',
      description: 'Blog post ready for review',
      timestamp: now - 1000 * 60 * 30, // 30 minutes ago
      agent: 'content-001 → content-director',
    },
    {
      id: '4',
      type: 'execution',
      title: 'Claude API execution',
      description: 'Token usage: 2,450 (input: 1,200 / output: 1,250)',
      timestamp: now - 1000 * 60 * 45, // 45 minutes ago
    },
    {
      id: '5',
      type: 'agent_activated',
      title: 'SEO Strategist activated',
      description: 'Scheduled keyword research task',
      timestamp: now - 1000 * 60 * 60, // 1 hour ago
      agent: 'seo-001',
    },
    {
      id: '6',
      type: 'task_started',
      title: 'LinkedIn post creation started',
      description: 'Topic: AI productivity tips',
      timestamp: now - 1000 * 60 * 90, // 1.5 hours ago
      agent: 'social-001',
    },
    {
      id: '7',
      type: 'content_generated',
      title: 'Email newsletter generated',
      description: 'Weekly marketing digest',
      timestamp: now - 1000 * 60 * 120, // 2 hours ago
      agent: 'ops-002',
    },
    {
      id: '8',
      type: 'task_completed',
      title: 'Keyword research completed',
      description: 'Found 15 high-volume keywords',
      timestamp: now - 1000 * 60 * 180, // 3 hours ago
      agent: 'seo-001',
    },
  ];
  return activities;
}

export default function DashboardPage() {
  const stats = useQuery(api.functions.getDashboardStats);

  if (!stats) {
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonChart height={300} />
          <SkeletonDonut size={220} />
        </div>
      </div>
    );
  }

  // Calculate completion rate
  const completionRate = stats.tasks.total > 0
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 0;

  // Generate mock data for charts
  const sparklineAgents = generateSparklineData(stats.agents.active);
  const sparklineTasks = generateSparklineData(stats.tasks.completed);
  const sparklineContent = generateSparklineData(stats.content.draft);
  const weeklyData = generateWeeklyData();
  const mockActivities = generateMockActivities();

  // Prepare donut chart data from departments
  const departmentColors: Record<string, string> = {
    leadership: chartColors.departments.leadership,
    content: chartColors.departments.content,
    social: chartColors.departments.social,
    demandgen: chartColors.departments.demandgen,
    seo: chartColors.departments.seo,
    brand: chartColors.departments.brand,
    ops: chartColors.departments.ops,
  };

  const donutData = Object.entries(stats.agents.byDepartment)
    .filter(([_, count]) => (count as number) > 0)
    .map(([dept, count]) => ({
      name: dept.charAt(0).toUpperCase() + dept.slice(1),
      value: count as number,
      color: departmentColors[dept] || chartColors.primary,
    }));

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

      {/* Main Stats Grid with Sparklines */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardWithSparkline
          title="Active Agents"
          value={stats.agents.active}
          total={stats.agents.total}
          icon={Bot}
          trend={12}
          sparklineData={sparklineAgents}
          description="agents running"
        />
        <StatCardWithSparkline
          title="Tasks Completed"
          value={stats.tasks.completed}
          total={stats.tasks.total}
          icon={CheckCircle2}
          trend={15}
          sparklineData={sparklineTasks}
          description="completion rate"
          trendSuffix="%"
        />
        <StatCardWithSparkline
          title="Content Drafts"
          value={stats.content.draft}
          total={stats.content.total}
          icon={FileText}
          trend={5}
          sparklineData={sparklineContent}
          description="pending review"
        />
        <StatCardWithSparkline
          title="Success Rate"
          value={completionRate}
          icon={TrendingUp}
          trend={-2}
          description="avg completion"
          isPercentage
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Performance Area Chart */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Weekly Performance
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            {weeklyData.length > 0 ? (
              <AreaChart
                data={weeklyData}
                areas={[
                  { dataKey: 'executions', name: 'Executions', color: chartColors.primary },
                  { dataKey: 'tasks', name: 'Tasks', color: chartColors.success },
                  { dataKey: 'content', name: 'Content', color: chartColors.tertiary },
                ]}
                xAxisKey="day"
                height={260}
                showLegend={true}
                showGrid={true}
              />
            ) : (
              <EmptyAnalytics />
            )}
          </CardContent>
        </Card>

        {/* Agent Distribution Donut */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <Users className="h-5 w-5 text-purple-500" />
              Agent Distribution
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                height={260}
                innerRadius={55}
                outerRadius={85}
                showLegend={true}
                centerValue={stats.agents.total}
                centerLabel="Total"
                interactive={true}
              />
            ) : (
              <EmptyAgents />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Task Performance + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Task Performance
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <TaskStatusCard
                label="Completed"
                value={stats.tasks.completed}
                total={stats.tasks.total}
                color="bg-green-500"
              />
              <TaskStatusCard
                label="Running"
                value={stats.tasks.running}
                total={stats.tasks.total}
                color="bg-blue-500"
              />
              <TaskStatusCard
                label="Pending"
                value={stats.tasks.pending}
                total={stats.tasks.total}
                color="bg-yellow-500"
              />
              <TaskStatusCard
                label="Failed"
                value={stats.tasks.failed}
                total={stats.tasks.total}
                color="bg-red-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-semibold text-lg text-white">
              <Activity className="h-5 w-5 text-cyan-500" />
              Recent Activity
            </h3>
          </CardHeader>
          <CardContent className="max-h-[280px] overflow-y-auto">
            <ActivityFeed
              activities={mockActivities}
              maxItems={6}
              emptyMessage="No activity yet"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCardWithSparkline({
  title,
  value,
  total,
  icon: Icon,
  trend,
  sparklineData,
  description,
  isPercentage = false,
  trendSuffix = '',
}: {
  title: string;
  value: number;
  total?: number;
  icon: any;
  trend: number;
  sparklineData?: { value: number }[];
  description: string;
  isPercentage?: boolean;
  trendSuffix?: string;
}) {
  const trendUp = trend > 0;

  return (
    <Card hover>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-zinc-900 p-2 text-zinc-400">
            <Icon className="h-5 w-5" />
          </div>
          <TrendIndicator value={trend} suffix={trendSuffix || ''} size="sm" />
        </div>

        <div className="mt-4">
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-bold text-white">
              {isPercentage ? (
                <PercentageCounter value={value} decimals={0} />
              ) : (
                <SimpleCounter value={value} />
              )}
            </h2>
            {total !== undefined && (
              <span className="mb-1 text-sm text-zinc-500">/ {total}</span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">{title}</p>
          <p className="text-xs text-zinc-600 mt-2">{description}</p>
        </div>

        {sparklineData && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <Sparkline
              data={sparklineData}
              height={36}
              trend={trendUp ? 'up' : 'down'}
              showTooltip={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskStatusCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-zinc-400 text-sm">{label}</span>
        <span className="text-white font-semibold">
          <SimpleCounter value={value} duration={800} />
          <span className="text-zinc-500 text-sm ml-1">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn("h-full transition-all duration-700 ease-out rounded-full", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
