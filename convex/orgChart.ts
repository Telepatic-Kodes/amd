import { v } from "convex/values";
import { query } from "./_generated/server";

// ===========================================
// ORG CHART QUERIES - Agent hierarchy & handoff graph
// ===========================================

/**
 * Returns the handoff graph: aggregated edges between agents.
 * Each edge has fromAgentId, toAgentId (string IDs like "cmo-001"),
 * the count of handoffs, and the most recent timestamp.
 */
export const getHandoffGraph = query({
  args: {},
  handler: async (ctx) => {
    const [handoffs, agents] = await Promise.all([
      ctx.db.query("handoffs").collect(),
      ctx.db.query("agents").collect(),
    ]);

    // Build map: document _id → agentId string (e.g. "cmo-001")
    const idToAgentId = new Map<string, string>();
    for (const agent of agents) {
      idToAgentId.set(agent._id, agent.agentId);
    }

    // Aggregate handoffs by fromAgentId → toAgentId pair
    const edgeMap = new Map<string, { count: number; lastTimestamp: number }>();

    for (const handoff of handoffs) {
      const fromAgentId = idToAgentId.get(handoff.fromAgent);
      const toAgentId = idToAgentId.get(handoff.toAgent);

      // Skip if either agent no longer exists
      if (!fromAgentId || !toAgentId) continue;

      const key = `${fromAgentId}→${toAgentId}`;
      const existing = edgeMap.get(key);

      if (existing) {
        existing.count += 1;
        if (handoff.timestamp > existing.lastTimestamp) {
          existing.lastTimestamp = handoff.timestamp;
        }
      } else {
        edgeMap.set(key, { count: 1, lastTimestamp: handoff.timestamp });
      }
    }

    // Convert to array
    const result: Array<{
      fromAgentId: string;
      toAgentId: string;
      count: number;
      lastTimestamp: number;
    }> = [];

    for (const [key, value] of edgeMap) {
      const [fromAgentId, toAgentId] = key.split("→");
      result.push({
        fromAgentId,
        toAgentId,
        count: value.count,
        lastTimestamp: value.lastTimestamp,
      });
    }

    return result;
  },
});

/**
 * Returns detailed information about an agent including execution stats,
 * recent executions, and handoff connections (from/to).
 */
export const getAgentDetail = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return null;

    // Get last 5 executions (most recent first)
    const recentExecutions = await ctx.db
      .query("executions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(5);

    // Get ALL executions to calculate stats
    const allExecutions = await ctx.db
      .query("executions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const totalTasks = allExecutions.length;
    const successCount = allExecutions.filter((e) => e.status === "success").length;
    const successRate = totalTasks > 0 ? Math.round((successCount / totalTasks) * 100) : 0;
    const totalTokens = allExecutions.reduce((sum, e) => sum + e.tokensUsed.total, 0);

    // Get handoffs FROM this agent
    const handoffsFromRaw = await ctx.db
      .query("handoffs")
      .withIndex("by_from", (q) => q.eq("fromAgent", args.agentId))
      .collect();

    // Aggregate by target agent name → count
    const fromMap = new Map<string, number>();
    for (const h of handoffsFromRaw) {
      const targetAgent = await ctx.db.get(h.toAgent);
      const name = targetAgent?.name ?? "Unknown Agent";
      fromMap.set(name, (fromMap.get(name) ?? 0) + 1);
    }
    const handoffsFrom = Array.from(fromMap, ([name, count]) => ({ name, count }));

    // Get handoffs TO this agent
    const handoffsToRaw = await ctx.db
      .query("handoffs")
      .withIndex("by_to", (q) => q.eq("toAgent", args.agentId))
      .collect();

    // Aggregate by source agent name → count
    const toMap = new Map<string, number>();
    for (const h of handoffsToRaw) {
      const sourceAgent = await ctx.db.get(h.fromAgent);
      const name = sourceAgent?.name ?? "Unknown Agent";
      toMap.set(name, (toMap.get(name) ?? 0) + 1);
    }
    const handoffsTo = Array.from(toMap, ([name, count]) => ({ name, count }));

    return {
      agent,
      stats: {
        totalTasks,
        successRate,
        totalTokens,
      },
      recentExecutions,
      handoffsFrom,
      handoffsTo,
    };
  },
});
