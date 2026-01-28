import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

    return {
      content: data.content[0].text,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
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

      // 6. Build enhanced prompt with feed context
      const enhancedSystemPrompt = buildEnhancedSystemPrompt(
        agent.config.systemPrompt,
        feedItems
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

      // 9. Guardar ejecución (with feed tracking)
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

/**
 * Calcular costo basado en modelo y tokens
 * Precios por millón de tokens (input/output)
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    // Claude Opus 4.5 (Max Plan) - Most powerful
    "claude-opus-4-5-20251101": { input: 15, output: 75 },
    // Claude Opus 4
    "claude-opus-4-20250514": { input: 15, output: 75 },
    // Claude Sonnet 4 (Default)
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    // Claude Haiku 3 (Fast & cheap)
    "claude-haiku-3-20250514": { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"];

  return (
    (inputTokens * modelPricing.input) / 1_000_000 +
    (outputTokens * modelPricing.output) / 1_000_000
  );
}

/**
 * Extract search keywords from task input for feed querying.
 * Combines topic, keyword, title, and industry fields.
 *
 * Limitations: Basic extraction from common input fields only.
 * Does not include stop word filtering or stemming - these can be
 * added in future iterations if search relevance needs improvement.
 */
function extractKeywords(taskType: string, input: any): string {
  const parts: string[] = [];

  // Common input fields that contain searchable content
  if (input.topic) parts.push(input.topic);
  if (input.keyword) parts.push(input.keyword);
  if (input.title) parts.push(input.title);
  if (input.industry) parts.push(input.industry);
  if (input.subject) parts.push(input.subject);
  if (input.query) parts.push(input.query);
  if (input.searchTerms) parts.push(input.searchTerms);

  // Task-type specific handling
  if (taskType.includes("seo") || taskType.includes("keyword")) {
    if (input.targetKeyword) parts.push(input.targetKeyword);
    if (input.keywords && Array.isArray(input.keywords)) {
      parts.push(...input.keywords.slice(0, 3)); // Limit array keywords
    }
  }

  // Join and limit length to avoid overly long search queries
  return parts.join(" ").slice(0, 100).trim();
}

/**
 * Map agent department to relevant feed categories.
 * Used to filter feeds by relevance to agent's role.
 *
 * Feed categories: "industry", "competitor", "technical", "trends"
 * Agent departments: leadership, content, social, demandgen, seo, brand, ops
 */
function mapDepartmentToCategories(department: string): string[] {
  const mapping: Record<string, string[]> = {
    content: ["industry", "technical", "trends"],
    social: ["industry", "competitor", "trends"],
    seo: ["technical", "competitor", "industry"],
    demandgen: ["competitor", "industry"],
    brand: ["industry", "trends"],
    ops: ["technical"],
    leadership: ["industry", "competitor", "trends"],
  };
  return mapping[department] || ["industry"];
}

/**
 * Enhance agent system prompt with relevant feed context.
 * Appends formatted feed items as structured context.
 */
function buildEnhancedSystemPrompt(
  basePrompt: string,
  feedItems: Array<{
    title: string;
    link: string;
    summary: string | null;
    content: string | null;
    publishedAt: number | null;
    feedName: string;
  }>
): string {
  if (feedItems.length === 0) {
    return basePrompt;
  }

  const feedContext = feedItems
    .map(
      (item, i) =>
        `[${i + 1}] ${item.title}\n` +
        `Source: ${item.feedName} - ${item.link}\n` +
        `Published: ${item.publishedAt ? new Date(item.publishedAt).toISOString().split("T")[0] : "Unknown"}\n` +
        `Summary: ${item.summary || item.content || "No content available"}`
    )
    .join("\n\n---\n\n");

  return `${basePrompt}

## Relevant Industry Context

The following recent feed items may be relevant to your task. Use this context when appropriate, but prioritize the user's specific request.

${feedContext}

---
End of feed context.`;
}

/**
 * Construir mensaje de usuario basado en tipo de tarea
 */
function buildUserMessage(taskType: string, input: any): string {
  switch (taskType) {
    case "write_blog":
      return `Escribe un artículo de blog basado en el siguiente brief:

Título: ${input.title || "Sin título"}
Keyword principal: ${input.keyword || "N/A"}
Palabras objetivo: ${input.wordCount || 1000}
Tono: ${input.tone || "profesional"}
Audiencia: ${input.audience || "general"}

${input.instructions ? `Instrucciones adicionales:\n${input.instructions}` : ""}

Devuelve el artículo completo en formato Markdown.`;

    case "create_linkedin_post":
      return `Crea un post de LinkedIn basado en:

Tema: ${input.topic || input.title}
Objetivo: ${input.objective || "engagement"}
Tono: ${input.tone || "profesional pero cercano"}

${input.sourceContent ? `Contenido fuente para adaptar:\n${input.sourceContent}` : ""}

El post debe:
- Tener un hook que capture atención en las primeras líneas
- Usar espaciado estratégico
- Incluir un CTA al final
- No usar hashtags excesivos (máximo 3-5)`;

    case "create_twitter_thread":
      return `Crea un thread de Twitter/X basado en:

Tema: ${input.topic || input.title}
Tweets objetivo: ${input.tweetCount || 5}
Estilo: ${input.style || "educativo con personalidad"}

${input.sourceContent ? `Contenido fuente:\n${input.sourceContent}` : ""}

Reglas:
- Primer tweet debe ser el hook más fuerte
- Cada tweet debe tener valor independiente
- Último tweet con CTA y potencial para RT`;

    case "keyword_research":
      return `Realiza investigación de keywords para:

Tema principal: ${input.topic}
Industria: ${input.industry || "general"}
Intención: ${input.intent || "informacional y transaccional"}

Proporciona:
1. 10 keywords principales con volumen estimado
2. 20 long-tail keywords relacionadas
3. Preguntas frecuentes sobre el tema
4. Sugerencias de clusters de contenido`;

    case "analyze_engagement":
      return `Analiza las siguientes métricas de engagement:

${JSON.stringify(input.metrics, null, 2)}

Proporciona:
1. Resumen ejecutivo
2. Tendencias identificadas
3. Top performing content
4. Áreas de mejora
5. Recomendaciones accionables`;

    default:
      return `Ejecuta la siguiente tarea: ${taskType}

Input:
${JSON.stringify(input, null, 2)}

Proporciona un resultado estructurado y accionable.`;
  }
}

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
