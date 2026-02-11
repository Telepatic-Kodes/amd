import { v } from "convex/values";
import { action } from "./_generated/server";
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
 * Action para llamar a Claude API
 * Útil cuando quieres ejecutar agentes directamente desde Convex
 * sin pasar por n8n
 */
export const callClaude = action({
  args: {
    systemPrompt: v.string(),
    userMessage: v.string(),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Rate limit check — 20 calls/min per user
    const rateCheck = await ctx.runMutation(api.rateLimit.checkAndRecord, {
      identifier: "system",
      endpoint: "callClaude",
    });
    if (!rateCheck.allowed) {
      throw new Error(
        `Límite de velocidad excedido. Intenta de nuevo en ${Math.ceil(rateCheck.retryAfterMs / 1000)}s.`
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: args.model || "claude-sonnet-4-20250514",
        max_tokens: args.maxTokens || 4096,
        temperature: args.temperature || 0.7,
        system: args.systemPrompt,
        messages: [
          {
            role: "user",
            content: args.userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();

    // Safety check: validate Claude API response structure
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error("Claude API returned empty response — no content blocks");
    }
    const textBlock = data.content[0];
    if (!textBlock || textBlock.type !== "text" || !textBlock.text) {
      throw new Error("Claude API returned non-text response block");
    }

    return {
      content: textBlock.text,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      model: data.model,
      stopReason: data.stop_reason,
    };
  },
});

/**
 * Ejecutar un agente directamente desde Convex
 */
export const executeAgent = action({
  args: {
    agentId: v.string(),
    taskType: v.string(),
    input: v.any(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    taskId: string;
    output: string;
    metrics: {
      duration: number;
      tokensUsed: number;
      cost: number;
    };
  }> => {
    // 0. Rate limit check — 10 executions/min
    const rateCheck = await ctx.runMutation(api.rateLimit.checkAndRecord, {
      identifier: "system",
      endpoint: "executeAgent",
    });
    if (!rateCheck.allowed) {
      throw new Error(
        `Límite de ejecuciones excedido. Intenta de nuevo en ${Math.ceil(rateCheck.retryAfterMs / 1000)}s.`
      );
    }

    // 1. Obtener configuración del agente
    const agent = await ctx.runQuery(api.functions.getAgent, {
      agentId: args.agentId,
    });

    if (!agent) {
      throw new Error(`Agent not found: ${args.agentId}`);
    }

    if (agent.status !== "active") {
      throw new Error(`Agent is not active: ${agent.status}`);
    }

    // 2. Get relevant feed context (non-blocking)
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
      // Feed access gating strategy: OPT-IN
      // - Feeds are enabled ONLY if agent.config.tools explicitly includes "feeds"
      // - If tools is undefined or empty, feeds are NOT enabled (safe default)
      // - This prevents unintended feed injection for agents not configured for it
      const feedsEnabled =
        Array.isArray(agent.config.tools) &&
        agent.config.tools.includes("feeds");

      if (feedsEnabled) {
        const keywords = extractKeywords(args.taskType, args.input);
        const categories = mapDepartmentToCategories(agent.department);

        if (keywords) {
          feedItems = await ctx.runQuery(
            internal.feeds.agentQueries.getRelevantFeedItems,
            {
              keywords,
              categories,
              limit: 5,
              daysBack: 7,
            }
          );
          feedItemIds = feedItems.map((item) => item._id);
        }
      }
    } catch (error: any) {
      // Non-blocking: log warning but continue execution
      console.warn("Failed to get feed context for agent:", error.message);
    }

    // 2c. Get relevant KB context (non-blocking, opt-in via tools config)
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
      // KB access gating: OPT-IN via agent.config.tools
      const kbEnabled =
        Array.isArray(agent.config.tools) && agent.config.tools.includes("kb");

      if (kbEnabled) {
        // Get KBs visible to this agent's department
        const visibleKBs = await ctx.runQuery(
          api.kb.agentQueries.getKBForAgent,
          {
            agentId: agent._id,
          }
        );

        if (visibleKBs && visibleKBs.length > 0) {
          usedKBId = visibleKBs[0]._id;

          // Extract keywords from task input
          const keywords = extractKeywords(args.taskType, args.input);

          if (keywords) {
            // Search KB sections (max 5 for token efficiency)
            kbSections = await ctx.runQuery(
              api.kb.agentQueries.searchKBSections,
              {
                kbIds: visibleKBs.map((kb: any) => kb._id),
                keywords,
                limit: 5,
              }
            );
            kbSectionIds = kbSections.map((s) => s._id);
          }
        }
      }
    } catch (error: any) {
      // Non-blocking: log warning but continue execution
      console.warn("Failed to get KB context for agent:", error.message);
    }

    // 3. Crear tarea
    const taskResult = await ctx.runMutation(api.functions.createTask, {
      title: `${args.taskType} - ${new Date().toISOString()}`,
      type: args.taskType,
      priority: "medium",
      agentId: agent._id,
      input: args.input,
    });

    // 4. Actualizar estado a running
    await ctx.runMutation(api.functions.updateTaskStatus, {
      id: taskResult.id,
      status: "running",
    });

    const startTime = Date.now();

    try {
      // 5. Construir mensaje para Claude basado en el tipo de tarea
      const userMessage = buildUserMessage(args.taskType, args.input);

      // 6. Build enhanced prompt with feed and KB context
      const enhancedSystemPrompt = buildEnhancedSystemPrompt(
        agent.config.systemPrompt,
        feedItems,
        kbSections
      );

      // 7. Llamar a Claude (enhanced with feed context)
      const claudeResponse = await ctx.runAction(api.actions.callClaude, {
        systemPrompt: enhancedSystemPrompt,
        userMessage,
        model: agent.config.model,
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens,
      });

      const duration = Date.now() - startTime;

      // 8. Calcular costo según modelo
      const cost = calculateCost(
        agent.config.model || "claude-sonnet-4-20250514",
        claudeResponse.usage.inputTokens,
        claudeResponse.usage.outputTokens
      );

      // 9. Guardar ejecución (with feed and KB tracking)
      await ctx.runMutation(api.functions.logExecution, {
        taskId: taskResult.id,
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

      // 9b. Log KB access if sections were used
      if (kbSectionIds.length > 0 && usedKBId) {
        await ctx.runMutation(api.kb.mutations.logKBAccess, {
          agentId: agent._id,
          kbId: usedKBId,
          taskId: taskResult.id,
          sectionsUsed: kbSectionIds,
        });
      }

      // 10. Actualizar tarea como completada
      await ctx.runMutation(api.functions.updateTaskStatus, {
        id: taskResult.id,
        status: "completed",
        output: {
          content: claudeResponse.content,
          tokensUsed: claudeResponse.usage.totalTokens,
          cost,
        },
      });

      return {
        success: true,
        taskId: taskResult.taskId,
        output: claudeResponse.content,
        metrics: {
          duration,
          tokensUsed: claudeResponse.usage.totalTokens,
          cost,
        },
      };
    } catch (error: any) {
      // Manejar error
      await ctx.runMutation(api.functions.updateTaskStatus, {
        id: taskResult.id,
        status: "failed",
        error: {
          message: error.message || "Unknown error",
          code: "EXECUTION_FAILED",
        },
      });

      throw error;
    }
  },
});

// Helper functions (calculateCost, extractKeywords, mapDepartmentToCategories,
// buildEnhancedSystemPrompt, buildUserMessage) are now imported from ./lib/agentHelpers

/**
 * Scheduled action para ejecutar agentes con cron triggers
 */
export const runScheduledAgents = action({
  args: {
    trigger: v.union(
      v.literal("cron:hourly"),
      v.literal("cron:daily"),
      v.literal("cron:weekly")
    ),
  },
  handler: async (ctx, args): Promise<{
    trigger: string;
    timestamp: number;
    agentsRun: number;
    results: Array<{
      agentId: string;
      success: boolean;
      result?: any;
      error?: string;
    }>;
  }> => {
    // Obtener agentes que tienen este trigger
    const allAgents = await ctx.runQuery(api.functions.listAgents, {
      status: "active",
    });

    const agentsToRun = allAgents.filter((agent: any) =>
      agent.triggers.includes(args.trigger)
    );

    const results = [];

    for (const agent of agentsToRun) {
      try {
        // Para agentes scheduled, el input viene de la configuración o es vacío
        const result = await ctx.runAction(api.actions.executeAgent, {
          agentId: agent.agentId,
          taskType: `scheduled_${agent.agentId}`,
          input: agent.metadata?.scheduledInput || {},
        });
        results.push({ agentId: agent.agentId, success: true, result });
      } catch (error: any) {
        results.push({
          agentId: agent.agentId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      trigger: args.trigger,
      timestamp: Date.now(),
      agentsRun: agentsToRun.length,
      results,
    };
  },
});
