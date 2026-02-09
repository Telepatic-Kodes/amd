import { query } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

/**
 * Query 1: getAnalyticsWithDateRange
 * Covers AI-01 (internal metrics) + AI-02 (time-series aggregation)
 *
 * Returns analytics data filtered by date range:
 * - Overview metrics: tokens, costs, agent activity, content created
 * - Daily rollups (tasksByDay) for time-series visualization
 * - Top agents by execution count
 * - Recent executions
 */
export const getAnalyticsWithDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Fetch all executions in date range
    const allExecutions = await ctx.db.query("executions").collect();
    const executions = allExecutions.filter(
      (exec) => exec.timestamp >= args.startDate && exec.timestamp <= args.endDate
    );

    // Fetch all tasks in date range (filter by userId)
    const allTasks = await ctx.db.query("tasks").collect();
    const tasks = allTasks.filter(
      (task) =>
        (task.userId === userId || task.userId === undefined) &&
        task.createdAt >= args.startDate &&
        task.createdAt <= args.endDate
    );

    // Fetch all content in date range (filter by userId)
    const allContent = await ctx.db.query("content").collect();
    const content = allContent.filter(
      (item) =>
        (item.userId === userId || item.userId === undefined) &&
        item.createdAt >= args.startDate &&
        item.createdAt <= args.endDate
    );

    // Calculate overview metrics
    const totalExecutions = executions.length;
    const totalTokensInput = executions.reduce((sum, e) => sum + e.tokensUsed.input, 0);
    const totalTokensOutput = executions.reduce((sum, e) => sum + e.tokensUsed.output, 0);
    const totalTokens = executions.reduce((sum, e) => sum + e.tokensUsed.total, 0);
    const totalCost = executions.reduce((sum, e) => sum + e.cost, 0);
    const avgDuration = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
      : 0;
    const successCount = executions.filter((e) => e.status === "success").length;
    const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
    const contentCreated = content.length;

    // Group tasks by day (AI-02 daily rollup)
    const tasksByDay: Record<string, { completed: number; failed: number; total: number }> = {};
    for (const task of tasks) {
      const dateKey = new Date(task.createdAt).toISOString().split("T")[0];
      if (!tasksByDay[dateKey]) {
        tasksByDay[dateKey] = { completed: 0, failed: 0, total: 0 };
      }
      tasksByDay[dateKey].total += 1;
      if (task.status === "completed") {
        tasksByDay[dateKey].completed += 1;
      } else if (task.status === "failed") {
        tasksByDay[dateKey].failed += 1;
      }
    }

    // Group executions by day for sparkline data
    const executionsByDay: Record<string, { tokens: number; cost: number; count: number; successCount: number }> = {};
    for (const exec of executions) {
      const dateKey = new Date(exec.timestamp).toISOString().split("T")[0];
      if (!executionsByDay[dateKey]) {
        executionsByDay[dateKey] = { tokens: 0, cost: 0, count: 0, successCount: 0 };
      }
      executionsByDay[dateKey].tokens += exec.tokensUsed.total;
      executionsByDay[dateKey].cost += exec.cost;
      executionsByDay[dateKey].count += 1;
      if (exec.status === "success") {
        executionsByDay[dateKey].successCount += 1;
      }
    }

    // Group executions by agentId
    const agentStats: Record<
      string,
      { count: number; successCount: number; tokens: number; agentId: string }
    > = {};
    for (const exec of executions) {
      const agentId = exec.agentId;
      if (!agentStats[agentId]) {
        agentStats[agentId] = { count: 0, successCount: 0, tokens: 0, agentId };
      }
      agentStats[agentId].count += 1;
      if (exec.status === "success") {
        agentStats[agentId].successCount += 1;
      }
      agentStats[agentId].tokens += exec.tokensUsed.total;
    }

    // Join agent names
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a.name]));

    const topAgents = Object.values(agentStats)
      .map((stat) => ({
        agentId: stat.agentId,
        name: agentMap.get(stat.agentId as any) || "Unknown",
        count: stat.count,
        successCount: stat.successCount,
        tokens: stat.tokens,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent executions (last 20)
    const recentExecutions = executions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map((exec) => ({
        _id: exec._id,
        agentName: agentMap.get(exec.agentId) || "Unknown",
        status: exec.status,
        tokens: exec.tokensUsed.total,
        cost: exec.cost,
        duration: exec.duration,
        timestamp: exec.timestamp,
      }));

    return {
      overview: {
        totalExecutions,
        totalTokens,
        totalTokensInput,
        totalTokensOutput,
        totalCost,
        avgDuration,
        successRate,
        contentCreated,
      },
      tasksByDay,
      executionsByDay,
      topAgents,
      recentExecutions,
    };
  },
});

/**
 * Query 2: getContentPerformance
 * Covers AL-01 through AL-03 (content performance ranking)
 *
 * Returns content pieces with LinkedIn engagement data, ranked by performance.
 */
export const getContentPerformance = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    sortBy: v.optional(
      v.union(v.literal("engagement"), v.literal("impressions"), v.literal("recent"))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Fetch content filtered by userId and date range
    const allContent = await ctx.db.query("content").collect();
    const content = allContent.filter(
      (item) =>
        (item.userId === userId || item.userId === undefined) &&
        item.createdAt >= args.startDate &&
        item.createdAt <= args.endDate &&
        item.status === "published"
    );

    // Fetch latest engagement snapshot for each content piece
    const contentWithEngagement = await Promise.all(
      content.map(async (item) => {
        // Query by_contentId_fetchedAt index and get the most recent
        const engagements = await ctx.db
          .query("linkedinEngagement")
          .withIndex("by_contentId", (q) => q.eq("contentId", item._id))
          .collect();

        const latestEngagement = engagements.sort((a, b) => b.fetchedAt - a.fetchedAt)[0];

        return {
          contentId: item._id,
          title: item.title,
          type: item.type,
          publishedAt: item.publishedAt || item.createdAt,
          engagement: latestEngagement
            ? {
                likes: latestEngagement.likes,
                comments: latestEngagement.comments,
                shares: latestEngagement.shares,
                impressions: latestEngagement.impressions,
                engagement_rate: latestEngagement.engagement_rate || null,
              }
            : null,
        };
      })
    );

    // Sort by selected metric
    const sortBy = args.sortBy || "engagement";
    const sorted = contentWithEngagement.sort((a, b) => {
      if (sortBy === "engagement") {
        const aEngagement = a.engagement
          ? a.engagement.likes + a.engagement.comments + a.engagement.shares
          : 0;
        const bEngagement = b.engagement
          ? b.engagement.likes + b.engagement.comments + b.engagement.shares
          : 0;
        return bEngagement - aEngagement;
      } else if (sortBy === "impressions") {
        const aImpressions = a.engagement?.impressions || 0;
        const bImpressions = b.engagement?.impressions || 0;
        return bImpressions - aImpressions;
      } else {
        // sortBy === "recent"
        return (b.publishedAt || 0) - (a.publishedAt || 0);
      }
    });

    return sorted.slice(0, 50);
  },
});

/**
 * Query 3: getAgentPerformanceSummary
 * Covers AI-03 (agent performance metrics)
 *
 * Returns per-agent performance: success rate, avg duration, cost per task.
 */
export const getAgentPerformanceSummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx); // Ensure auth

    // Fetch all executions in date range
    const allExecutions = await ctx.db.query("executions").collect();
    const executions = allExecutions.filter(
      (exec) => exec.timestamp >= args.startDate && exec.timestamp <= args.endDate
    );

    // Group by agentId
    const agentStats: Record<
      string,
      {
        totalExecutions: number;
        successCount: number;
        failCount: number;
        totalTokens: number;
        totalCost: number;
        totalDuration: number;
        agentId: string;
      }
    > = {};

    for (const exec of executions) {
      const agentId = exec.agentId;
      if (!agentStats[agentId]) {
        agentStats[agentId] = {
          totalExecutions: 0,
          successCount: 0,
          failCount: 0,
          totalTokens: 0,
          totalCost: 0,
          totalDuration: 0,
          agentId,
        };
      }
      agentStats[agentId].totalExecutions += 1;
      if (exec.status === "success") {
        agentStats[agentId].successCount += 1;
      } else {
        agentStats[agentId].failCount += 1;
      }
      agentStats[agentId].totalTokens += exec.tokensUsed.total;
      agentStats[agentId].totalCost += exec.cost;
      agentStats[agentId].totalDuration += exec.duration;
    }

    // Join agent names and departments
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(
      agents.map((a) => [a._id, { name: a.name, department: a.department }])
    );

    const summary = Object.values(agentStats).map((stat) => {
      const agentInfo = agentMap.get(stat.agentId as any);
      const successRate =
        stat.totalExecutions > 0 ? (stat.successCount / stat.totalExecutions) * 100 : 0;
      const avgDuration =
        stat.totalExecutions > 0 ? stat.totalDuration / stat.totalExecutions : 0;

      return {
        agentId: stat.agentId,
        name: agentInfo?.name || "Unknown",
        department: agentInfo?.department || "unknown",
        totalExecutions: stat.totalExecutions,
        successCount: stat.successCount,
        failCount: stat.failCount,
        successRate,
        totalTokens: stat.totalTokens,
        totalCost: stat.totalCost,
        avgDuration,
      };
    });

    // Sort by totalExecutions descending, limit 20
    return summary.sort((a, b) => b.totalExecutions - a.totalExecutions).slice(0, 20);
  },
});

/**
 * Query 4: getContentPipelineMetrics
 * Covers AI-04 (content pipeline metrics)
 *
 * Returns throughput, status distribution, avg time to publish, bottleneck identification.
 */
export const getContentPipelineMetrics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Fetch all content in date range (by createdAt), filtered by userId
    const allContent = await ctx.db.query("content").collect();
    const content = allContent.filter(
      (item) =>
        (item.userId === userId || item.userId === undefined) &&
        item.createdAt >= args.startDate &&
        item.createdAt <= args.endDate
    );

    const totalContent = content.length;

    // Throughput: count of content that reached "published" status
    const publishedContent = content.filter((item) => item.status === "published");
    const throughput = publishedContent.length;

    // Status distribution
    const statusDistribution: Record<string, number> = {
      draft: 0,
      review: 0,
      revision_needed: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    };
    for (const item of content) {
      statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
    }

    // Avg time to publish (for published content)
    let avgTimeToPublish: number | null = null;
    if (publishedContent.length > 0) {
      const totalTime = publishedContent.reduce((sum, item) => {
        const publishTime = item.publishedAt || item.updatedAt;
        return sum + (publishTime - item.createdAt);
      }, 0);
      avgTimeToPublish = totalTime / publishedContent.length;
    }

    // Bottleneck: status with most content stuck in non-terminal states
    const nonTerminalStatuses = ["draft", "review", "revision_needed"];
    let bottleneck: { status: string; count: number } | null = null;
    let maxCount = 0;
    for (const status of nonTerminalStatuses) {
      const count = statusDistribution[status] || 0;
      if (count > maxCount) {
        maxCount = count;
        bottleneck = { status, count };
      }
    }

    return {
      throughput,
      statusDistribution,
      avgTimeToPublish,
      bottleneck,
      totalContent,
    };
  },
});

/**
 * Query 5: getAnalyticsExportData
 * Returns flat arrays suitable for CSV conversion on the client.
 */
export const getAnalyticsExportData = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Fetch executions
    const allExecutions = await ctx.db.query("executions").collect();
    const executions = allExecutions.filter(
      (exec) => exec.timestamp >= args.startDate && exec.timestamp <= args.endDate
    );

    // Fetch tasks
    const allTasks = await ctx.db.query("tasks").collect();
    const tasks = allTasks.filter(
      (task) =>
        (task.userId === userId || task.userId === undefined) &&
        task.createdAt >= args.startDate &&
        task.createdAt <= args.endDate
    );

    // Fetch content
    const allContent = await ctx.db.query("content").collect();
    const content = allContent.filter(
      (item) =>
        (item.userId === userId || item.userId === undefined) &&
        item.createdAt >= args.startDate &&
        item.createdAt <= args.endDate
    );

    // Join agent names
    const agents = await ctx.db.query("agents").collect();
    const agentMap = new Map(agents.map((a) => [a._id, a.name]));

    // Fetch latest engagement for content
    const contentEngagementMap = new Map<string, any>();
    for (const item of content) {
      const engagements = await ctx.db
        .query("linkedinEngagement")
        .withIndex("by_contentId", (q) => q.eq("contentId", item._id))
        .collect();
      const latest = engagements.sort((a, b) => b.fetchedAt - a.fetchedAt)[0];
      if (latest) {
        contentEngagementMap.set(item._id, latest);
      }
    }

    // Format executions for export
    const executionsExport = executions.map((exec) => ({
      timestamp: exec.timestamp,
      agentName: agentMap.get(exec.agentId) || "Unknown",
      status: exec.status,
      tokens: exec.tokensUsed.total,
      cost: exec.cost,
      duration: exec.duration,
    }));

    // Format tasks for export
    const tasksExport = tasks.map((task) => ({
      createdAt: task.createdAt,
      title: task.title,
      type: task.type,
      priority: task.priority,
      status: task.status,
      agentName: agentMap.get(task.agentId) || "Unknown",
    }));

    // Format content for export
    const contentExport = content.map((item) => {
      const engagement = contentEngagementMap.get(item._id);
      return {
        createdAt: item.createdAt,
        title: item.title,
        type: item.type,
        status: item.status,
        likes: engagement?.likes || 0,
        comments: engagement?.comments || 0,
        shares: engagement?.shares || 0,
        impressions: engagement?.impressions || 0,
      };
    });

    return {
      executions: executionsExport,
      tasks: tasksExport,
      content: contentExport,
    };
  },
});
