import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";

// ===========================================
// CONTROL CENTER QUERIES
// ===========================================
// Optimized queries for the Control Center UI.
// These queries prevent subscription cost explosion by aggregating data
// and using .take(limit) for performance on large tables.

/**
 * getControlCenterStatus - Single aggregated subscription for all agent statuses
 *
 * Instead of 37 separate subscriptions (one per agent), this query returns
 * all agents grouped by department with status counts in a single subscription.
 * This prevents Pitfall #1: Subscription Cost Explosion.
 *
 * @returns {
 *   agentsByDepartment: Record<string, Agent[]>,
 *   statusCounts: { active, paused, error, maintenance },
 *   totalAgents: number
 * }
 */
export const getControlCenterStatus = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all agents (37 agents is small, safe to collect)
    const allAgents = await ctx.db.query("agents").collect();

    // Group agents by department
    const agentsByDepartment: Record<string, Doc<"agents">[]> = {};
    for (const agent of allAgents) {
      if (!agentsByDepartment[agent.department]) {
        agentsByDepartment[agent.department] = [];
      }
      agentsByDepartment[agent.department].push(agent);
    }

    // Count agents by status
    const statusCounts = {
      active: 0,
      paused: 0,
      error: 0,
      maintenance: 0,
    };

    for (const agent of allAgents) {
      statusCounts[agent.status]++;
    }

    return {
      agentsByDepartment,
      statusCounts,
      totalAgents: allAgents.length,
    };
  },
});

/**
 * getRecentActivity - Chronological activity feed from executions and tasks
 *
 * Merges recent executions and tasks into a single chronological feed.
 * Uses .take(limit) for performance and batches agent lookups to avoid N+1 queries.
 *
 * @param limit - Maximum number of items to return (default: 50)
 * @param departmentFilter - Optional department filter
 * @returns Array of activity items sorted by timestamp descending
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
    departmentFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Fetch recent executions using index
    const executions = await ctx.db
      .query("executions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    // Fetch recent tasks
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .take(limit);

    // Batch agent lookups - collect unique agentIds first
    const agentIds = new Set<Id<"agents">>();
    executions.forEach((exec) => agentIds.add(exec.agentId));
    tasks.forEach((task) => agentIds.add(task.agentId));

    // Lookup each agent once
    const agentMap = new Map<string, Doc<"agents">>();
    for (const agentId of Array.from(agentIds)) {
      const agent = await ctx.db.get(agentId);
      if (agent && agent._id) {
        agentMap.set(agentId.toString(), agent);
      }
    }

    // Build activity items from executions
    const executionItems = executions.map((exec) => {
      const agent = agentMap.get(exec.agentId.toString());
      return {
        id: exec._id.toString(),
        type: "execution" as const,
        agentName: agent?.name || "Unknown",
        agentId: exec.agentId.toString(),
        department: agent?.department || "unknown",
        description: `Ejecución ${exec.status === "success" ? "exitosa" : "fallida"}`,
        status: exec.status,
        timestamp: exec.timestamp,
        tokensUsed: exec.tokensUsed.total,
        duration: exec.duration,
      };
    });

    // Build activity items from tasks
    const taskItems = tasks.map((task) => {
      const agent = agentMap.get(task.agentId.toString());
      return {
        id: task._id.toString(),
        type: "task" as const,
        agentName: agent?.name || "Unknown",
        agentId: task.agentId.toString(),
        department: agent?.department || "unknown",
        description: task.title,
        status: task.status,
        timestamp: task.createdAt,
      };
    });

    // Merge and sort by timestamp descending
    let allItems = [...executionItems, ...taskItems];
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    // Apply department filter if provided
    if (args.departmentFilter) {
      allItems = allItems.filter((item) => item.department === args.departmentFilter);
    }

    // Return limited results
    return allItems.slice(0, limit);
  },
});

/**
 * getControlCenterMetrics - Operational metrics for the Control Center
 *
 * Aggregates token usage, task counts, success rate, and cost metrics.
 * Includes both total and "today" breakdowns for time-based comparisons.
 *
 * @returns {
 *   tokens: { total, today },
 *   tasks: { completed, failed, running, completedToday },
 *   successRate: number,
 *   avgDuration: number,
 *   totalCost: number
 * }
 */
export const getControlCenterMetrics = query({
  args: {},
  handler: async (ctx) => {
    // Fetch last 100 executions for metrics calculation
    const executions = await ctx.db
      .query("executions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(100);

    // Calculate start of today (midnight UTC)
    const now = Date.now();
    const startOfToday = new Date().setUTCHours(0, 0, 0, 0);

    // Calculate token metrics
    const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed.total, 0);
    const todayExecutions = executions.filter((e) => e.timestamp >= startOfToday);
    const todayTokens = todayExecutions.reduce((sum, e) => sum + e.tokensUsed.total, 0);

    // Calculate cost metrics
    const totalCost = executions.reduce((sum, e) => sum + e.cost, 0);

    // Calculate success rate
    const successfulExecutions = executions.filter((e) => e.status === "success").length;
    const successRate =
      executions.length > 0 ? (successfulExecutions / executions.length) * 100 : 0;

    // Calculate average duration
    const avgDuration =
      executions.length > 0
        ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
        : 0;

    // Fetch task counts using status index for performance
    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    const failedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();

    const runningTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();

    // Calculate today's completed tasks
    const completedToday = completedTasks.filter(
      (t) => t.completedAt && t.completedAt >= startOfToday
    ).length;

    return {
      tokens: {
        total: totalTokens,
        today: todayTokens,
      },
      tasks: {
        completed: completedTasks.length,
        failed: failedTasks.length,
        running: runningTasks.length,
        completedToday,
      },
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      avgDuration: Math.round(avgDuration), // Round to nearest ms
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    };
  },
});
