import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getUserId } from "./lib/auth";

// ===========================================
// COPILOT QUERIES
// ===========================================

export const listConversations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = args.limit ?? 20;
    const conversations = await ctx.db
      .query("copilotConversations")
      .withIndex("by_userId_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return conversations;
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.id("copilotConversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("copilotMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});

// ===========================================
// COPILOT MUTATIONS
// ===========================================

export const createConversation = mutation({
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
    context: v.optional(
      v.object({
        page: v.optional(v.string()),
        selectedContentId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("copilotConversations", {
      userId,
      brandProfileId: args.brandProfileId,
      context: args.context,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id("copilotConversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, { updatedAt: now });

    // Auto-set title from first user message
    if (args.role === "user") {
      const conv = await ctx.db.get(args.conversationId);
      if (conv && !conv.title) {
        await ctx.db.patch(args.conversationId, {
          title: args.content.slice(0, 60) + (args.content.length > 60 ? "..." : ""),
        });
      }
    }

    return await ctx.db.insert("copilotMessages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      metadata: args.metadata,
      timestamp: now,
    });
  },
});

export const clearConversation = mutation({
  args: {
    conversationId: v.id("copilotConversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("copilotMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.conversationId);
  },
});

// ===========================================
// COPILOT ACTIONS (Claude integration)
// ===========================================

export const sendMessage = action({
  args: {
    conversationId: v.id("copilotConversations"),
    message: v.string(),
    context: v.optional(
      v.object({
        page: v.optional(v.string()),
        brandName: v.optional(v.string()),
        brandIndustry: v.optional(v.string()),
      })
    ),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    // Store user message
    await ctx.runMutation(api.copilot.addMessage, {
      conversationId: args.conversationId,
      role: "user",
      content: args.message,
    });

    // Get conversation history
    const messages: Array<{ role: string; content: string }> = await ctx.runQuery(api.copilot.getConversationMessages, {
      conversationId: args.conversationId,
    });

    // Build context string
    const contextParts: string[] = [];
    if (args.context?.brandName) contextParts.push(`Marca: ${args.context.brandName}`);
    if (args.context?.brandIndustry) contextParts.push(`Industria: ${args.context.brandIndustry}`);
    if (args.context?.page) contextParts.push(`Página actual: ${args.context.page}`);

    const systemPrompt = `Eres el copiloto de marketing de AMD (AI Marketing Department).
Ayudas a los usuarios a gestionar su marketing digital: crear contenido, analizar rendimiento, ejecutar agentes, y gestionar estrategias.
Responde siempre en español, de forma concisa y accionable.
${contextParts.length > 0 ? `\nContexto actual:\n${contextParts.join("\n")}` : ""}
Si el usuario pide una acción específica (crear contenido, ejecutar agente, etc.), sugiere los pasos concretos.`;

    // Build Claude messages from history
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fallback = "Lo siento, el servicio de IA no está configurado. Verifica tu ANTHROPIC_API_KEY.";
      await ctx.runMutation(api.copilot.addMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: fallback,
      });
      return fallback;
    }

    try {
      const response: Response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: systemPrompt,
          messages: claudeMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: Record<string, unknown> = await response.json();
      const content = data.content as Array<{ text?: string }> | undefined;
      const assistantMessage: string =
        content?.[0]?.text ?? "No pude generar una respuesta. Intenta de nuevo.";

      // Store assistant message
      await ctx.runMutation(api.copilot.addMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (err) {
      const errorMsg = "Error al procesar tu mensaje. Intenta de nuevo en unos segundos.";
      await ctx.runMutation(api.copilot.addMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: errorMsg,
      });
      return errorMsg;
    }
  },
});
