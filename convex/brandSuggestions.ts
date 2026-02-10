import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// ===========================================
// TYPES
// ===========================================

interface ClaudeResponse {
  content: string;
  usage: { totalTokens: number };
}

interface RawSuggestion {
  category: string;
  title: string;
  description: string;
  priority: string;
  suggestedData?: unknown;
}

// ===========================================
// QUERIES
// ===========================================

export const getSuggestions = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandSuggestions")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect()
      .then((suggestions) =>
        suggestions
          .filter((s) => s.status === "pending")
          .sort((a, b) => {
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
          })
      );
  },
});

export const countPendingSuggestions = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const suggestions = await ctx.db
      .query("brandSuggestions")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();
    return suggestions.filter((s) => s.status === "pending").length;
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const dismissSuggestion = mutation({
  args: { suggestionId: v.id("brandSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    await ctx.db.patch(args.suggestionId, { status: "dismissed" });
  },
});

export const applySuggestion = mutation({
  args: { suggestionId: v.id("brandSuggestions") },
  handler: async (ctx, args) => {
    const suggestion = await ctx.db.get(args.suggestionId);
    if (!suggestion) throw new Error("Suggestion not found");
    await ctx.db.patch(args.suggestionId, {
      status: "applied",
      appliedAt: Date.now(),
    });
  },
});

// ===========================================
// INTERNAL MUTATIONS
// ===========================================

export const _storeSuggestions = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    suggestions: v.array(
      v.object({
        category: v.string(),
        title: v.string(),
        description: v.string(),
        priority: v.string(),
        suggestedData: v.optional(v.any()),
      })
    ),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    // Clear old pending suggestions
    const existing = await ctx.db
      .query("brandSuggestions")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    for (const s of existing) {
      if (s.status === "pending") {
        await ctx.db.delete(s._id);
      }
    }

    // Store new suggestions
    const now = Date.now();
    for (const suggestion of args.suggestions) {
      await ctx.db.insert("brandSuggestions", {
        brandProfileId: args.brandProfileId,
        category: suggestion.category,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        suggestedData: suggestion.suggestedData,
        status: "pending",
        generatedAt: now,
        tokensUsed: args.tokensUsed,
      });
    }
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const generateSuggestions = action({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    // 1. Get brand profile
    const profile = await ctx.runQuery(internal.brandProfile._getBrandProfileById, {
      id: args.brandProfileId,
    }) as Record<string, unknown> | null;

    if (!profile) throw new Error("Brand profile not found");

    // 2. Get brand KB sections for context
    const kbSections = await ctx.runQuery(
      internal.contentAnalysis._getBrandKBSections
    ) as Array<{ title: string; content: string }>;

    const kbContext = kbSections
      .map((s) => `## ${s.title}\n${s.content}`)
      .join("\n\n---\n\n");

    // 3. Determine completeness level
    const voice = profile.voice as { tone: string[]; personality: string[]; dos: string[]; donts: string[] };
    const audience = profile.audience as { segments: Array<{ name: string; painPoints: string[] }> };
    const strategy = profile.strategy as { topics: string[]; channels: string[]; postingFrequency?: string };
    const competitors = profile.competitors as Array<{ name: string; url?: string; notes?: string }>;

    const isPartial =
      voice.tone.length < 2 ||
      audience.segments.length < 1 ||
      strategy.topics.length < 3 ||
      competitors.length < 1;

    // 4. Build prompt
    const baseInfo = `Empresa: ${profile.companyName}
Industria: ${profile.industry}
${profile.website ? `Website: ${profile.website}` : ""}
Descripción: ${profile.description}

Voz — Tono: ${voice.tone.join(", ")}; Personalidad: ${voice.personality.join(", ")}
Dos: ${voice.dos.join(", ")}; Don'ts: ${voice.donts.join(", ")}

Audiencia: ${audience.segments.map((s) => `${s.name} (pain points: ${s.painPoints.join(", ")})`).join("; ")}

Estrategia — Temas: ${strategy.topics.join(", ")}; Canales: ${strategy.channels.join(", ")}; Frecuencia: ${strategy.postingFrequency || "no definida"}

Competidores: ${competitors.map((c) => `${c.name}${c.url ? ` (${c.url})` : ""}`).join(", ") || "ninguno"}`;

    let userMessage: string;

    if (isPartial) {
      userMessage = `Analiza este perfil de marca INCOMPLETO y sugiere valores iniciales para las áreas vacías o débiles.

${baseInfo}

${kbContext ? `\n## Contexto KB\n${kbContext}\n` : ""}

Genera 4-6 sugerencias para completar/mejorar el perfil. Cada sugerencia debe tener:
- category: "voice" | "audience" | "strategy" | "competitors" | "content" | "general"
- title: título corto y accionable (en español)
- description: explicación de qué hacer y por qué (en español, 2-3 oraciones)
- priority: "high" | "medium" | "low"

Responde ÚNICAMENTE con JSON válido:
{ "suggestions": [{ "category": "...", "title": "...", "description": "...", "priority": "..." }] }`;
    } else {
      userMessage = `Analiza este perfil de marca COMPLETO y sugiere mejoras estratégicas.

${baseInfo}

${kbContext ? `\n## Contexto KB\n${kbContext}\n` : ""}

Genera 3-5 sugerencias para optimizar y mejorar la estrategia de marca. Piensa en:
- Refinamiento de voz y tono
- Gaps en audiencia o segmentos no explorados
- Optimización de canales y frecuencia
- Posicionamiento competitivo
- Oportunidades de contenido

Cada sugerencia:
- category: "voice" | "audience" | "strategy" | "competitors" | "content" | "general"
- title: título corto y accionable (en español)
- description: análisis y recomendación específica (en español, 2-3 oraciones)
- priority: "high" | "medium" | "low"

Responde ÚNICAMENTE con JSON válido:
{ "suggestions": [{ "category": "...", "title": "...", "description": "...", "priority": "..." }] }`;
    }

    // 5. Call Claude
    const response: ClaudeResponse = await ctx.runAction(api.actions.callClaude, {
      systemPrompt:
        "Eres un estratega de marketing digital experto. Analizas perfiles de marca y sugieres mejoras accionables. Responde siempre en JSON válido.",
      userMessage,
      temperature: 0.4,
      maxTokens: 2000,
    });

    // 6. Parse response
    let parsed: { suggestions: RawSuggestion[] };
    try {
      let cleaned = response.content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse suggestions from Claude");
    }

    if (!Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid suggestions format");
    }

    // 7. Store suggestions
    const validSuggestions = parsed.suggestions.map((s) => ({
      category: s.category || "general",
      title: s.title || "Sugerencia",
      description: s.description || "",
      priority: s.priority || "medium",
      suggestedData: s.suggestedData,
    }));

    await ctx.runMutation(internal.brandSuggestions._storeSuggestions, {
      brandProfileId: args.brandProfileId,
      suggestions: validSuggestions,
      tokensUsed: response.usage.totalTokens,
    });

    return {
      count: validSuggestions.length,
      tokensUsed: response.usage.totalTokens,
    };
  },
});
