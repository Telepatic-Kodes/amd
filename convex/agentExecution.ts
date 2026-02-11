import { v } from "convex/values";
import { mutation, query, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  calculateCost,
  extractKeywords,
  mapDepartmentToCategories,
  buildEnhancedSystemPrompt,
  buildUserMessage,
} from "./lib/agentHelpers";

/**
 * triggerExecution — Public mutation that returns instantly.
 * Creates a task in "pending" state and schedules the async executor.
 */
export const triggerExecution = mutation({
  args: {
    agentId: v.string(),
    taskType: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Validate agent exists and is active
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      throw new Error(`Agente no encontrado: ${args.agentId}`);
    }
    if (agent.status !== "active") {
      throw new Error(`Agente no está activo: ${agent.status}`);
    }

    // 2. Create task with status "pending"
    const now = Date.now();
    const taskId = `task_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const id = await ctx.db.insert("tasks", {
      taskId,
      title: `${args.taskType} - ${agent.name}`,
      type: args.taskType,
      priority: "medium",
      status: "pending",
      agentId: agent._id,
      input: args.input,
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Schedule the async executor (runs immediately in background)
    await ctx.scheduler.runAfter(0, internal.agentExecution.executeAgentAsync, {
      taskId: id,
      agentId: agent._id,
      agentStringId: args.agentId,
      taskType: args.taskType,
      input: args.input,
    });

    return { taskId: id };
  },
});

/**
 * executeAgentAsync — Internal action that runs in the background.
 * Handles the full execution lifecycle: running → completed/failed.
 */
export const executeAgentAsync = internalAction({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
    agentStringId: v.string(),
    taskType: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Update task to "running"
    await ctx.runMutation(api.functions.updateTaskStatus, {
      id: args.taskId,
      status: "running",
    });

    const startTime = Date.now();

    try {
      // 2. Fetch agent config
      const agent = await ctx.runQuery(api.functions.getAgentById, {
        id: args.agentId,
      });

      if (!agent) {
        throw new Error(`Agent not found: ${args.agentStringId}`);
      }

      // 3. Get feed context (non-blocking)
      let feedItems: Array<{
        _id: Id<"feedItems">;
        title: string;
        link: string;
        summary: string | null;
        content: string | null;
        publishedAt: number | null;
        feedName: string;
      }> = [];
      let feedItemIds: Id<"feedItems">[] = [];

      try {
        const feedsEnabled =
          Array.isArray(agent.config.tools) &&
          agent.config.tools.includes("feeds");

        if (feedsEnabled) {
          const keywords = extractKeywords(args.taskType, args.input);
          const categories = mapDepartmentToCategories(agent.department);

          if (keywords) {
            feedItems = await ctx.runQuery(
              internal.feeds.agentQueries.getRelevantFeedItems,
              { keywords, categories, limit: 5, daysBack: 7 }
            );
            feedItemIds = feedItems.map((item) => item._id);
          }
        }
      } catch (error: unknown) {
        console.warn("Failed to get feed context:", error);
      }

      // 4. Get KB context (non-blocking)
      let kbSections: Array<{
        _id: Id<"kbSections">;
        title: string;
        content: string;
        kbName: string;
        kbCategory: string;
      }> = [];
      let kbSectionIds: Id<"kbSections">[] = [];
      let usedKBId: Id<"knowledgeBases"> | null = null;

      try {
        const kbEnabled =
          Array.isArray(agent.config.tools) &&
          agent.config.tools.includes("kb");

        if (kbEnabled) {
          const visibleKBs = await ctx.runQuery(
            api.kb.agentQueries.getKBForAgent,
            { agentId: agent._id }
          );

          if (visibleKBs && visibleKBs.length > 0) {
            usedKBId = visibleKBs[0]._id;
            const keywords = extractKeywords(args.taskType, args.input);

            if (keywords) {
              kbSections = await ctx.runQuery(
                api.kb.agentQueries.searchKBSections,
                {
                  kbIds: visibleKBs.map((kb: { _id: Id<"knowledgeBases"> }) => kb._id),
                  keywords,
                  limit: 5,
                }
              );
              kbSectionIds = kbSections.map((s) => s._id);
            }
          }
        }
      } catch (error: unknown) {
        console.warn("Failed to get KB context:", error);
      }

      // 5. Build messages
      const userMessage = buildUserMessage(args.taskType, args.input);
      const enhancedSystemPrompt = buildEnhancedSystemPrompt(
        agent.config.systemPrompt,
        feedItems,
        kbSections
      );

      // 6. Call Claude API
      const claudeResponse = await ctx.runAction(api.actions.callClaude, {
        systemPrompt: enhancedSystemPrompt,
        userMessage,
        model: agent.config.model,
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens,
      });

      const duration = Date.now() - startTime;

      // 7. Calculate cost
      const cost = calculateCost(
        agent.config.model || "claude-sonnet-4-20250514",
        claudeResponse.usage.inputTokens,
        claudeResponse.usage.outputTokens
      );

      // 8. Log execution
      await ctx.runMutation(api.functions.logExecution, {
        taskId: args.taskId,
        agentId: agent._id,
        attempt: 1,
        status: "success",
        llmCalls: 1,
        tokensUsed: {
          input: claudeResponse.usage.inputTokens,
          output: claudeResponse.usage.outputTokens,
          total: claudeResponse.usage.totalTokens,
        },
        duration,
        cost,
        feedItemsUsed: feedItemIds.length > 0 ? feedItemIds : undefined,
      });

      // 8b. Log KB access
      if (kbSectionIds.length > 0 && usedKBId) {
        await ctx.runMutation(api.kb.mutations.logKBAccess, {
          agentId: agent._id,
          kbId: usedKBId,
          taskId: args.taskId,
          sectionsUsed: kbSectionIds,
        });
      }

      // 9. Mark task as completed
      await ctx.runMutation(api.functions.updateTaskStatus, {
        id: args.taskId,
        status: "completed",
        output: {
          content: claudeResponse.content,
          tokensUsed: claudeResponse.usage.totalTokens,
          cost,
          duration,
        },
      });

      // 10. Process handoff chains (Phase 26)
      await ctx.runMutation(internal.handoffEngine.processHandoffs, {
        taskId: args.taskId,
        agentId: agent._id,
        taskType: args.taskType,
        output: claudeResponse.content,
      });

      // 11. Auto-save content (Phase 27)
      await ctx.runMutation(internal.contentPipeline.autoSaveGeneratedContent, {
        taskId: args.taskId,
        agentId: agent._id,
        taskType: args.taskType,
        output: claudeResponse.content,
        input: args.input,
      });

      // 12. Strategy task completion callback (CMO Orchestration Engine)
      const strategyId = args.input?.strategyId as string | undefined;
      if (strategyId) {
        await ctx.runMutation(internal.cmoEngine.onStrategyTaskComplete, {
          strategyId,
          taskStatus: "completed",
        });
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await ctx.runMutation(api.functions.updateTaskStatus, {
        id: args.taskId,
        status: "failed",
        error: {
          message: errorMessage,
          code: "EXECUTION_FAILED",
        },
      });

      // Strategy task failure callback (CMO Orchestration Engine)
      const strategyId = args.input?.strategyId as string | undefined;
      if (strategyId) {
        await ctx.runMutation(internal.cmoEngine.onStrategyTaskComplete, {
          strategyId,
          taskStatus: "failed",
        });
      }
    }
  },
});

/**
 * getExecutionStatus — Reactive query for real-time status tracking.
 * The frontend subscribes to this and sees live updates as the task progresses.
 */
export const getExecutionStatus = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    // Get agent name for display
    const agent = await ctx.db.get(task.agentId);

    return {
      taskId: task._id,
      status: task.status,
      agentName: agent?.name || "Desconocido",
      agentDepartment: agent?.department || "unknown",
      taskType: task.type,
      output: task.output,
      error: task.error,
      tokensUsed: task.output?.tokensUsed,
      cost: task.output?.cost,
      duration: task.output?.duration,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    };
  },
});

/**
 * listRecentExecutions — Recent executions with agent info, for the history panel.
 */
export const listRecentExecutions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const executions = await ctx.db
      .query("executions")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);

    // Batch agent lookups
    const agentIds = new Set<Id<"agents">>();
    executions.forEach((exec) => agentIds.add(exec.agentId));

    const agentMap = new Map<string, { name: string; department: string }>();
    for (const agentId of Array.from(agentIds)) {
      const agent = await ctx.db.get(agentId);
      if (agent) {
        agentMap.set(agentId.toString(), {
          name: agent.name,
          department: agent.department,
        });
      }
    }

    // Also get task info for each execution
    return executions.map((exec) => {
      const agentInfo = agentMap.get(exec.agentId.toString());
      return {
        _id: exec._id,
        taskId: exec.taskId,
        agentName: agentInfo?.name || "Desconocido",
        department: agentInfo?.department || "unknown",
        status: exec.status,
        tokensUsed: exec.tokensUsed.total,
        cost: exec.cost,
        duration: exec.duration,
        timestamp: exec.timestamp,
      };
    });
  },
});
