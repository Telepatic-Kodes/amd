import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";

// ===========================================
// TYPES
// ===========================================

interface ClaudeResponse {
  content: string;
  usage: { totalTokens: number };
}

interface RawTopicSuggestion {
  topic: string;
  description: string;
  successProbability: number;
  scoreBreakdown: {
    brandAlignment: number;
    audienceRelevance: number;
    trendMomentum: number;
    historicalPerformance: number;
  };
  suggestedChannels: string[];
  trendSources?: string[];
}

// ===========================================
// QUERIES
// ===========================================

export const getTopicSuggestions = query({
  handler: async (ctx) => {
    const suggestions = await ctx.db
      .query("topicSuggestions")
      .withIndex("by_status")
      .collect();

    return suggestions
      .filter((s) => s.status === "active")
      .sort((a, b) => b.successProbability - a.successProbability);
  },
});

export const getQuickSuggestions = query({
  handler: async (ctx) => {
    const suggestions = await ctx.db
      .query("topicSuggestions")
      .withIndex("by_status")
      .collect();

    return suggestions
      .filter((s) => s.status === "active")
      .sort((a, b) => b.successProbability - a.successProbability)
      .slice(0, 5);
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const dismissSuggestion = mutation({
  args: { suggestionId: v.id("topicSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Topic suggestion not found");
    await ctx.db.patch(args.suggestionId, { status: "dismissed" });
  },
});

export const markSuggestionUsed = mutation({
  args: { suggestionId: v.id("topicSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Topic suggestion not found");
    await ctx.db.patch(args.suggestionId, { status: "used" });
  },
});

// ===========================================
// INTERNAL QUERIES
// ===========================================

export const _getRecentTrendingFeedItems = internalQuery({
  handler: async (ctx) => {
    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_relevanceScore")
      .order("desc")
      .take(50);

    return items
      .filter((item) => (item.relevanceScore ?? 0) > 60)
      .slice(0, 15)
      .map((item) => ({
        title: item.title,
        summary: item.aiSummary || item.summary || "",
        topics: item.topics || [],
        relevanceScore: item.relevanceScore || 0,
        source: item.link,
      }));
  },
});

export const _getRecentContentPerformance = internalQuery({
  handler: async (ctx) => {
    const content = await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(20);

    return content.map((c) => ({
      title: c.title,
      type: c.type,
      wordCount: c.metadata?.wordCount || 0,
      hashtags: c.metadata?.hashtags || c.metadata?.targetKeywords || [],
    }));
  },
});

// ===========================================
// INTERNAL MUTATIONS
// ===========================================

export const _storeTopicSuggestions = internalMutation({
  args: {
    suggestions: v.array(
      v.object({
        topic: v.string(),
        description: v.string(),
        successProbability: v.number(),
        scoreBreakdown: v.object({
          brandAlignment: v.number(),
          audienceRelevance: v.number(),
          trendMomentum: v.number(),
          historicalPerformance: v.number(),
        }),
        suggestedChannels: v.array(v.string()),
        trendSources: v.optional(v.array(v.string())),
      })
    ),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    // Clear old active suggestions
    const existing = await ctx.db
      .query("topicSuggestions")
      .withIndex("by_status")
      .collect();

    for (const s of existing) {
      if (s.status === "active") {
        await ctx.db.delete(s._id);
      }
    }

    // Store new suggestions
    const now = Date.now();
    for (const suggestion of args.suggestions) {
      await ctx.db.insert("topicSuggestions", {
        topic: suggestion.topic,
        description: suggestion.description,
        successProbability: Math.round(Math.max(0, Math.min(100, suggestion.successProbability))),
        scoreBreakdown: {
          brandAlignment: Math.round(Math.max(0, Math.min(100, suggestion.scoreBreakdown.brandAlignment))),
          audienceRelevance: Math.round(Math.max(0, Math.min(100, suggestion.scoreBreakdown.audienceRelevance))),
          trendMomentum: Math.round(Math.max(0, Math.min(100, suggestion.scoreBreakdown.trendMomentum))),
          historicalPerformance: Math.round(Math.max(0, Math.min(100, suggestion.scoreBreakdown.historicalPerformance))),
        },
        suggestedChannels: suggestion.suggestedChannels,
        trendSources: suggestion.trendSources,
        status: "active",
        generatedAt: now,
        tokensUsed: args.tokensUsed,
      });
    }
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const generateTopicSuggestions = action({
  handler: async (ctx) => {
    // 1. Get brand profile
    const profile = await ctx.runQuery(internal.brandProfile._getFirstBrandProfile) as Record<string, unknown> | null;

    // 2. Get trending feed items
    const trendingItems = await ctx.runQuery(
      internal.topicSuggestions._getRecentTrendingFeedItems
    ) as Array<{ title: string; summary: string; topics: string[]; relevanceScore: number; source: string }>;

    // 3. Get recent content performance
    const recentContent = await ctx.runQuery(
      internal.topicSuggestions._getRecentContentPerformance
    ) as Array<{ title: string; type: string; wordCount: number; hashtags: string[] }>;

    // 4. Get brand KB context
    const kbSections = await ctx.runQuery(
      internal.contentAnalysis._getBrandKBSections
    ) as Array<{ title: string; content: string }>;

    // 5. Build context string
    let brandContext = "";
    if (profile) {
      const voice = profile.voice as { tone: string[]; personality: string[] } | undefined;
      const audience = profile.audience as { segments: Array<{ name: string; painPoints: string[] }> } | undefined;
      const strategy = profile.strategy as { topics: string[]; channels: string[] } | undefined;

      brandContext = `## Perfil de Marca
Empresa: ${profile.companyName || "No definido"}
Industria: ${profile.industry || "No definido"}
Descripción: ${profile.description || "No definido"}
Tono: ${voice?.tone?.join(", ") || "No definido"}
Personalidad: ${voice?.personality?.join(", ") || "No definido"}
Audiencia: ${audience?.segments?.map((s) => s.name).join(", ") || "No definido"}
Temas estratégicos: ${strategy?.topics?.join(", ") || "No definido"}
Canales: ${strategy?.channels?.join(", ") || "No definido"}`;
    }

    const trendingContext = trendingItems.length > 0
      ? `## Tendencias Actuales (feeds con alta relevancia)\n${trendingItems.map((t) => `- "${t.title}" (relevancia: ${t.relevanceScore}) — ${t.summary.slice(0, 100)}`).join("\n")}`
      : "";

    const historyContext = recentContent.length > 0
      ? `## Contenido Publicado Reciente\n${recentContent.map((c) => `- [${c.type}] "${c.title}" (${c.wordCount} palabras)`).join("\n")}`
      : "";

    const kbContext = kbSections.length > 0
      ? `## Base de Conocimiento\n${kbSections.slice(0, 5).map((s) => `### ${s.title}\n${s.content.slice(0, 200)}`).join("\n\n")}`
      : "";

    // 6. Call Claude
    const userMessage = `Genera 8-10 sugerencias de temas para contenido de marketing basándote en el siguiente contexto:

${brandContext}

${trendingContext}

${historyContext}

${kbContext}

Para cada sugerencia, proporciona:
- topic: título del tema (máx 60 caracteres, en español)
- description: descripción del ángulo y por qué es relevante (2-3 oraciones en español)
- successProbability: score general 0-100
- scoreBreakdown: desglose del score con 4 dimensiones (0-100 cada una):
  - brandAlignment: qué tan alineado está con la marca
  - audienceRelevance: qué tan relevante para la audiencia objetivo
  - trendMomentum: si hay momentum de tendencia actual
  - historicalPerformance: basado en el rendimiento de temas similares
- suggestedChannels: array de canales ideales (de: "linkedin", "twitter", "instagram", "blog", "email", "youtube")
- trendSources: array de fuentes de tendencia que lo respaldan (opcional)

IMPORTANTE: Los scores deben ser variados y realistas, no todos altos. Algunos temas deben ser experimentales (40-60) y otros seguros (70-90).

Responde ÚNICAMENTE con JSON válido:
{ "suggestions": [{ "topic": "...", "description": "...", "successProbability": N, "scoreBreakdown": { "brandAlignment": N, "audienceRelevance": N, "trendMomentum": N, "historicalPerformance": N }, "suggestedChannels": [...], "trendSources": [...] }] }`;

    const response: ClaudeResponse = await ctx.runAction(api.actions.callClaude, {
      systemPrompt: "Eres un estratega de marketing digital experto en identificar temas de alto potencial para contenido. Analizas tendencias, marca y audiencia para recomendar temas con scores de éxito realistas. Responde siempre en JSON válido.",
      userMessage,
      temperature: 0.5,
      maxTokens: 3000,
    });

    // 7. Parse response
    let parsed: { suggestions: RawTopicSuggestion[] };
    try {
      let cleaned = response.content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse topic suggestions from Claude");
    }

    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid topic suggestions format");
    }

    // 8. Validate and store
    const validSuggestions = parsed.suggestions.map((s) => ({
      topic: s.topic || "Tema sugerido",
      description: s.description || "",
      successProbability: s.successProbability || 50,
      scoreBreakdown: {
        brandAlignment: s.scoreBreakdown?.brandAlignment || 50,
        audienceRelevance: s.scoreBreakdown?.audienceRelevance || 50,
        trendMomentum: s.scoreBreakdown?.trendMomentum || 50,
        historicalPerformance: s.scoreBreakdown?.historicalPerformance || 50,
      },
      suggestedChannels: s.suggestedChannels || ["linkedin", "twitter"],
      trendSources: s.trendSources,
    }));

    await ctx.runMutation(internal.topicSuggestions._storeTopicSuggestions, {
      suggestions: validSuggestions,
      tokensUsed: response.usage.totalTokens,
    });

    return {
      count: validSuggestions.length,
      tokensUsed: response.usage.totalTokens,
    };
  },
});
