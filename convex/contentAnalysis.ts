import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// ===========================================
// TYPES
// ===========================================

interface BrandKBSection {
  title: string;
  content: string;
}

interface Suggestion {
  type: string;
  description: string;
  priority: string;
  suggestedText?: string;
}

interface ClaudeResponse {
  content: string;
  usage: { totalTokens: number };
}

interface ContentDoc {
  _id: string;
  type: string;
  title: string;
  body: string;
  summary?: string;
}

// ===========================================
// QUERIES
// ===========================================

export const getContentAnalysis = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("contentAnalyses")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    if (analyses.length === 0) return null;

    // Return the most recent analysis
    return analyses.sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const saveAnalysis = mutation({
  args: {
    contentId: v.id("content"),
    brandAlignment: v.number(),
    engagementPrediction: v.number(),
    channelOptimization: v.number(),
    overallScore: v.number(),
    details: v.object({
      brandNotes: v.array(v.string()),
      engagementNotes: v.array(v.string()),
      channelNotes: v.array(v.string()),
    }),
    suggestions: v.array(
      v.object({
        type: v.string(),
        description: v.string(),
        priority: v.string(),
        suggestedText: v.optional(v.string()),
      })
    ),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contentAnalyses", {
      ...args,
      analyzedAt: Date.now(),
    });
  },
});

// ===========================================
// INTERNAL QUERIES (used by actions in this file)
// ===========================================

export const _getBrandKBSections = internalQuery({
  handler: async (ctx): Promise<BrandKBSection[]> => {
    const brandKBs = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_category", (q) => q.eq("category", "brand"))
      .collect();

    const activeKBs = brandKBs.filter((kb) => kb.status === "active");

    if (activeKBs.length === 0) return [];

    const sections = [];
    for (const kb of activeKBs) {
      const kbSections = await ctx.db
        .query("kbSections")
        .withIndex("by_kbId", (q) => q.eq("kbId", kb._id))
        .collect();
      sections.push(...kbSections);
    }

    return sections.map((s) => ({
      title: s.title,
      content: s.content,
    }));
  },
});

export const _getAnalysisById = internalQuery({
  args: { id: v.id("contentAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===========================================
// PUBLIC QUERIES (for frontend)
// ===========================================

export const getBrandKBSections = query({
  handler: async (ctx): Promise<BrandKBSection[]> => {
    const brandKBs = await ctx.db
      .query("knowledgeBases")
      .withIndex("by_category", (q) => q.eq("category", "brand"))
      .collect();

    const activeKBs = brandKBs.filter((kb) => kb.status === "active");

    if (activeKBs.length === 0) return [];

    const sections = [];
    for (const kb of activeKBs) {
      const kbSections = await ctx.db
        .query("kbSections")
        .withIndex("by_kbId", (q) => q.eq("kbId", kb._id))
        .collect();
      sections.push(...kbSections);
    }

    return sections.map((s) => ({
      title: s.title,
      content: s.content,
    }));
  },
});

export const getAnalysisById = query({
  args: { id: v.id("contentAnalyses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const analyzeContent = action({
  args: { contentId: v.id("content") },
  handler: async (ctx, args): Promise<Record<string, unknown>> => {
    // 1. Read content
    const content = await ctx.runQuery(api.functions.getContentById, {
      id: args.contentId,
    }) as ContentDoc | null;

    if (!content) {
      throw new Error("Content not found");
    }

    // 2. Get brand KB sections
    const brandKBs: BrandKBSection[] = await ctx.runQuery(internal.contentAnalysis._getBrandKBSections);
    const brandContext: string = brandKBs
      .map((s: BrandKBSection) => `## ${s.title}\n${s.content}`)
      .join("\n\n---\n\n");

    // 3. Call Claude with analysis prompt
    const analysisPrompt: string = `Eres un analista de contenido experto. Analiza el siguiente contenido y proporciona una evaluación estructurada.

${brandContext ? `## Contexto de Marca\n${brandContext}\n\n---\n\n` : ""}

## Contenido a Analizar
Tipo: ${content.type}
Título: ${content.title}
${content.summary ? `Resumen: ${content.summary}` : ""}

Contenido:
${content.body.substring(0, 3000)}${content.body.length > 3000 ? "..." : ""}

---

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "brandAlignment": <number 0-100>,
  "engagementPrediction": <number 0-100>,
  "channelOptimization": <number 0-100>,
  "overallScore": <number 0-100>,
  "details": {
    "brandNotes": ["nota1", "nota2", "nota3"],
    "engagementNotes": ["nota1", "nota2", "nota3"],
    "channelNotes": ["nota1", "nota2", "nota3"]
  },
  "suggestions": [
    {
      "type": "rewrite_hook" | "add_cta" | "adjust_tone" | "add_data" | "improve_structure" | "optimize_length" | "add_hashtags" | "improve_seo",
      "description": "descripción de la mejora",
      "priority": "high" | "medium" | "low",
      "suggestedText": "texto sugerido si aplica (opcional)"
    }
  ]
}

Criterios de evaluación:
- brandAlignment: ¿El contenido refleja la voz, tono y personalidad de marca?
- engagementPrediction: ¿Tiene un buen hook, CTA, estructura para engagement?
- channelOptimization: ¿Está optimizado para el canal específico (${content.type})?
- overallScore: Promedio ponderado de los tres scores

Proporciona 3-5 sugerencias ordenadas por prioridad.`;

    const claudeResponse: ClaudeResponse = await ctx.runAction(api.actions.callClaude, {
      systemPrompt: "Eres un analista de contenido y marketing digital experto. Responde siempre en JSON válido.",
      userMessage: analysisPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // 4. Parse response
    let analysis: Record<string, unknown>;
    try {
      let cleanedResponse = claudeResponse.content.trim();
      if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      analysis = JSON.parse(cleanedResponse);
    } catch {
      throw new Error("Failed to parse analysis response from Claude");
    }

    // 5. Validate and clamp scores
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

    const validatedAnalysis = {
      contentId: args.contentId,
      brandAlignment: clamp((analysis.brandAlignment as number) || 0),
      engagementPrediction: clamp((analysis.engagementPrediction as number) || 0),
      channelOptimization: clamp((analysis.channelOptimization as number) || 0),
      overallScore: clamp((analysis.overallScore as number) || 0),
      details: {
        brandNotes: Array.isArray((analysis.details as Record<string, unknown>)?.brandNotes) ? (analysis.details as Record<string, unknown>).brandNotes as string[] : [],
        engagementNotes: Array.isArray((analysis.details as Record<string, unknown>)?.engagementNotes) ? (analysis.details as Record<string, unknown>).engagementNotes as string[] : [],
        channelNotes: Array.isArray((analysis.details as Record<string, unknown>)?.channelNotes) ? (analysis.details as Record<string, unknown>).channelNotes as string[] : [],
      },
      suggestions: Array.isArray(analysis.suggestions)
        ? (analysis.suggestions as Suggestion[]).map((s: Suggestion) => ({
            type: s.type || "general",
            description: s.description || "",
            priority: s.priority || "medium",
            suggestedText: s.suggestedText || undefined,
          }))
        : [],
      tokensUsed: claudeResponse.usage.totalTokens,
    };

    // 6. Store analysis
    await ctx.runMutation(api.contentAnalysis.saveAnalysis, validatedAnalysis);

    return validatedAnalysis;
  },
});

// ===========================================
// B4: INTERNAL MUTATIONS (for auto-analysis)
// ===========================================

// B4: Internal mutation to mark content as revision_needed without RBAC checks
// Used by autoAnalyzeContent when brand alignment is below threshold
export const _markRevisionNeeded = internalMutation({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content) return;
    // Only mark as revision_needed if currently in draft status
    if (content.status === "draft") {
      await ctx.db.patch(args.id, {
        status: "revision_needed",
        updatedAt: Date.now(),
      });
    }
  },
});

// ===========================================
// B4: AUTO-ANALYSIS (Brand Consistency Checker)
// ===========================================

// B4: Lightweight auto-analysis for brand consistency on auto-generated content
// Scheduled automatically after content generation via contentPipeline.autoSaveGeneratedContent
export const autoAnalyzeContent = internalAction({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    // 1. Get the content
    const content = await ctx.runQuery(api.functions.getContentById, { id: args.contentId }) as ContentDoc | null;
    if (!content) return;

    // 2. Get brand profile for context
    const profile = await ctx.runQuery(internal.brandProfile._getFirstBrandProfile) as Record<string, unknown> | null;
    if (!profile) return; // No brand profile, skip analysis

    const voice = profile.voice as { tone: string[]; personality: string[]; dos: string[]; donts: string[] };
    const messaging = profile.messaging as Record<string, string> | undefined;

    // 3. Build a lighter prompt (fewer tokens than full analysis)
    const prompt = `Analiza rápidamente la consistencia de marca de este contenido.

MARCA:
- Empresa: ${profile.companyName}
- Tono: ${voice.tone.join(", ")}
- Personalidad: ${voice.personality.join(", ")}
- DOs: ${voice.dos.join(", ")}
- DON'Ts: ${voice.donts.join(", ")}
${messaging?.guide ? `- Guía de marca: ${messaging.guide}` : ""}

CONTENIDO:
Tipo: ${content.type}
Título: ${content.title}
Cuerpo (primeros 500 chars): ${content.body.slice(0, 500)}

Evalúa de 0-100:
- brandAlignment: ¿Respeta el tono, personalidad y guidelines?
- engagementPrediction: ¿Tiene potencial de generar engagement?
- channelOptimization: ¿Está optimizado para su canal (${content.type})?

Responde ÚNICAMENTE con JSON válido:
{
  "brandAlignment": <number>,
  "engagementPrediction": <number>,
  "channelOptimization": <number>,
  "overallScore": <number>,
  "brandNotes": ["nota1"],
  "engagementNotes": ["nota1"],
  "channelNotes": ["nota1"]
}`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) return;

      const data = await response.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } };
      const text = data.content[0].text;

      // Strip markdown fences if present
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const result = JSON.parse(cleaned);
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      // Validate and clamp scores
      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

      // Save analysis
      await ctx.runMutation(api.contentAnalysis.saveAnalysis, {
        contentId: args.contentId,
        brandAlignment: clamp(result.brandAlignment || 0),
        engagementPrediction: clamp(result.engagementPrediction || 0),
        channelOptimization: clamp(result.channelOptimization || 0),
        overallScore: clamp(result.overallScore || 0),
        details: {
          brandNotes: Array.isArray(result.brandNotes) ? result.brandNotes : [],
          engagementNotes: Array.isArray(result.engagementNotes) ? result.engagementNotes : [],
          channelNotes: Array.isArray(result.channelNotes) ? result.channelNotes : [],
        },
        suggestions: [],
        tokensUsed,
      });

      // B4: If brand alignment is below threshold, auto-mark as revision_needed
      const BRAND_THRESHOLD = 60;
      if (clamp(result.brandAlignment || 0) < BRAND_THRESHOLD) {
        await ctx.runMutation(internal.contentAnalysis._markRevisionNeeded, {
          id: args.contentId,
        });
      }
    } catch {
      // Non-critical — don't fail content creation if analysis fails
      console.log(`[B4 Auto-Analysis] Failed for content ${args.contentId}`);
    }
  },
});

// ===========================================
// ACTIONS (Manual Analysis)
// ===========================================

export const applyContentSuggestions = action({
  args: {
    contentId: v.id("content"),
    analysisId: v.id("contentAnalyses"),
    suggestionIndices: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; tokensUsed: number }> => {
    // 1. Read content and analysis
    const content = await ctx.runQuery(api.functions.getContentById, {
      id: args.contentId,
    }) as ContentDoc | null;

    if (!content) throw new Error("Content not found");

    const analysis = await ctx.runQuery(internal.contentAnalysis._getAnalysisById, {
      id: args.analysisId,
    }) as { suggestions: Suggestion[] } | null;

    if (!analysis) throw new Error("Analysis not found");

    // 2. Get selected suggestions
    const selectedSuggestions: Suggestion[] = args.suggestionIndices
      .map((i: number) => analysis.suggestions[i])
      .filter(Boolean) as Suggestion[];

    if (selectedSuggestions.length === 0) {
      throw new Error("No valid suggestions selected");
    }

    // 3. Get brand KB context
    const brandKBs: BrandKBSection[] = await ctx.runQuery(internal.contentAnalysis._getBrandKBSections);
    const brandContext: string = brandKBs
      .map((s: BrandKBSection) => `## ${s.title}\n${s.content}`)
      .join("\n\n---\n\n");

    // 4. Build regeneration prompt
    const suggestionsText: string = selectedSuggestions
      .map((s: Suggestion, i: number) => `${i + 1}. [${s.type}] ${s.description}${s.suggestedText ? `\n   Texto sugerido: ${s.suggestedText}` : ""}`)
      .join("\n");

    const regenerationPrompt: string = `Mejora el siguiente contenido aplicando las sugerencias indicadas.

${brandContext ? `## Contexto de Marca\n${brandContext}\n\n---\n\n` : ""}

## Contenido Original
Tipo: ${content.type}
Título: ${content.title}

${content.body}

---

## Sugerencias a Aplicar
${suggestionsText}

---

Reescribe el contenido completo aplicando TODAS las sugerencias listadas. Mantén el mismo formato y estructura general pero mejora según las indicaciones. Devuelve SOLO el contenido mejorado, sin explicaciones ni comentarios adicionales.`;

    const claudeResponse: ClaudeResponse = await ctx.runAction(api.actions.callClaude, {
      systemPrompt: "Eres un editor de contenido experto. Mejora el contenido aplicando las sugerencias indicadas manteniendo la voz de marca.",
      userMessage: regenerationPrompt,
      temperature: 0.5,
      maxTokens: 4096,
    });

    // 5. Update content
    await ctx.runMutation(api.functions.updateContent, {
      id: args.contentId,
      body: claudeResponse.content,
    });

    return {
      success: true,
      tokensUsed: claudeResponse.usage.totalTokens,
    };
  },
});
