"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Execute an agent with Knowledge Base context integration
 * This is a test action to verify KB functionality before full integration
 */
export const executeAgentWithKB = action({
  args: {
    agentId: v.string(),
    taskType: v.string(),
    input: v.any(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    taskId: string;
    output: string;
    kbSectionsUsed: number;
    metrics: {
      duration: number;
      tokensUsed: number;
      cost: number;
    };
  }> => {
    // 1. Get agent configuration
    const agent = await ctx.runQuery(api.functions.getAgent, {
      agentId: args.agentId,
    });

    if (!agent) {
      throw new Error(`Agent not found: ${args.agentId}`);
    }

    if (agent.status !== "active") {
      throw new Error(`Agent is not active: ${agent.status}`);
    }

    // 2. Query KBs visible to agent's department
    let kbSections: Array<{
      _id: Id<"kbSections">;
      title: string;
      content: string;
      kbName: string;
      kbCategory: string;
    }> = [];
    let kbIds: Id<"kbSections">[] = [];
    let usedKBId: Id<"knowledgeBases"> | null = null;

    try {
      const visibleKBs = await ctx.runQuery(
        api.kb.agentQueries.getKBForAgent,
        {
          agentId: agent._id,
        }
      );

      if (visibleKBs && visibleKBs.length > 0) {
        usedKBId = visibleKBs[0]._id;

        // Extract keywords from task
        const keywords = extractKeywords(args.taskType, args.input);

        if (keywords) {
          // Search KB sections
          kbSections = await ctx.runQuery(
            api.kb.agentQueries.searchKBSections,
            {
              kbIds: visibleKBs.map((kb) => kb._id),
              keywords,
              limit: 5,
            }
          );
          kbIds = kbSections.map((s) => s._id);
        }
      }
    } catch (error: any) {
      console.warn("Failed to get KB context:", error.message);
    }

    // 3. Create task
    const taskResult = await ctx.runMutation(api.functions.createTask, {
      title: `${args.taskType} with KB - ${new Date().toISOString()}`,
      type: args.taskType,
      priority: "medium",
      agentId: agent._id,
      input: args.input,
    });

    const startTime = Date.now();

    try {
      // 4. Build user message
      const userMessage = buildUserMessage(args.taskType, args.input);

      // 5. Build enhanced prompt with KB context
      const enhancedSystemPrompt = buildEnhancedSystemPromptWithKB(
        agent.config.systemPrompt,
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
      });

      // 9. Log KB access
      if (kbIds.length > 0 && usedKBId) {
        await ctx.runMutation(api.kb.mutations.logKBAccess, {
          agentId: agent._id,
          kbId: usedKBId,
          taskId: taskResult.id,
          sectionsUsed: kbIds,
        });
      }

      // 10. Update task status
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
        kbSectionsUsed: kbIds.length,
        metrics: {
          duration,
          tokensUsed: claudeResponse.usage.totalTokens,
          cost,
        },
      };
    } catch (error: any) {
      // Handle error
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
 * Extract search keywords from task input for KB querying
 */
function extractKeywords(taskType: string, input: any): string {
  const parts: string[] = [];

  if (input.topic) parts.push(input.topic);
  if (input.keyword) parts.push(input.keyword);
  if (input.title) parts.push(input.title);
  if (input.industry) parts.push(input.industry);
  if (input.subject) parts.push(input.subject);
  if (input.query) parts.push(input.query);
  if (input.searchTerms) parts.push(input.searchTerms);

  // Task-specific
  if (taskType.includes("seo") || taskType.includes("keyword")) {
    if (input.targetKeyword) parts.push(input.targetKeyword);
    if (input.keywords && Array.isArray(input.keywords)) {
      parts.push(...input.keywords.slice(0, 3));
    }
  }

  return parts.join(" ").slice(0, 100).trim();
}

/**
 * Build enhanced system prompt with KB context
 */
function buildEnhancedSystemPromptWithKB(
  basePrompt: string,
  kbSections: Array<{
    title: string;
    content: string;
    kbName: string;
    kbCategory: string;
  }>
): string {
  let enhancedPrompt = basePrompt;

  if (kbSections && kbSections.length > 0) {
    const kbContext = kbSections
      .map(
        (section, i) =>
          `[KB-${i + 1}] ${section.title}\n` +
          `Category: ${section.kbCategory} | Source: ${section.kbName}\n` +
          `Content:\n${section.content.substring(0, 1500)}${section.content.length > 1500 ? "..." : ""}`
      )
      .join("\n\n---\n\n");

    enhancedPrompt += `

## Company Knowledge Base

The following information comes from your company's knowledge base. Use this as the source of truth for brand voice, product details, and guidelines. Prioritize this information over general knowledge when applicable.

${kbContext}

---
End of knowledge base.`;
  }

  return enhancedPrompt;
}

/**
 * Build user message based on task type
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

    default:
      return `Ejecuta la siguiente tarea: ${taskType}

Input:
${JSON.stringify(input, null, 2)}

Proporciona un resultado estructurado y accionable.`;
  }
}

/**
 * Calculate cost based on model and tokens
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "claude-opus-4-5-20251101": { input: 15, output: 75 },
    "claude-opus-4-20250514": { input: 15, output: 75 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-haiku-3-20250514": { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"];

  return (
    (inputTokens * modelPricing.input) / 1_000_000 +
    (outputTokens * modelPricing.output) / 1_000_000
  );
}
