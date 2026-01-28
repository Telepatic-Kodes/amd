/**
 * Funciones de soporte para Agent SDK
 * El SDK se ejecuta localmente, estas funciones guardan los resultados
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Guardar resultado de ejecución del Agent SDK
 */
export const saveResult = mutation({
  args: {
    agentId: v.string(),
    taskType: v.string(),
    input: v.any(),
    output: v.string(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = `sdk_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Buscar agente
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) {
      throw new Error(`Agent not found: ${args.agentId}`);
    }

    // Crear tarea
    const id = await ctx.db.insert("tasks", {
      taskId,
      title: `[SDK] ${args.taskType}`,
      type: args.taskType,
      priority: "medium",
      status: args.success ? "completed" : "failed",
      agentId: agent._id,
      input: args.input,
      output: args.success ? { content: args.output, source: "agent-sdk-max" } : undefined,
      error: args.errorMessage ? { message: args.errorMessage, code: "SDK_ERROR" } : undefined,
      retryCount: 0,
      maxRetries: 0,
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    });

    // Log de ejecución (costo $0 con Max plan)
    await ctx.db.insert("executions", {
      taskId: id,
      agentId: agent._id,
      attempt: 1,
      status: args.success ? "success" : "failure",
      llmCalls: 1,
      tokensUsed: { input: 0, output: 0, total: 0 },
      duration: 0,
      cost: 0,
      timestamp: now,
    });

    return {
      taskId,
      success: args.success,
      cost: 0,
      source: "agent-sdk-max-plan",
    };
  },
});

/**
 * Obtener configuración de un agente para el SDK
 */
export const getAgentConfig = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!agent) return null;

    return {
      agentId: agent.agentId,
      name: agent.name,
      department: agent.department,
      systemPrompt: agent.config.systemPrompt,
      model: agent.config.model,
      temperature: agent.config.temperature,
    };
  },
});
