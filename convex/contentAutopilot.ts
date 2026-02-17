import { v } from "convex/values";
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getUserId } from "./lib/auth";

function shortId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Channel → content type mapping for brief generation
const CHANNEL_CONTENT_TYPE: Record<string, string> = {
  linkedin: "social_linkedin",
  twitter: "social_twitter",
  instagram: "social_instagram",
  tiktok: "social_tiktok",
  blog: "blog",
  email: "email",
  newsletter: "newsletter",
  youtube: "video_script",
};

// ===========================================
// QUERIES
// ===========================================

export const getActiveBriefs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return { suggested: [], inProgress: [], generated: [] };

    const briefs = await ctx.db
      .query("contentBriefs")
      .withIndex("by_brandProfileId_status", (q) => q.eq("brandProfileId", profile._id))
      .collect();

    return {
      suggested: briefs
        .filter((b) => b.status === "suggested")
        .sort((a, b) => (b.successProbability ?? 0) - (a.successProbability ?? 0)),
      inProgress: briefs.filter((b) => b.status === "approved" || b.status === "generating"),
      generated: briefs.filter((b) => b.status === "generated"),
    };
  },
});

export const getAutopilotStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!profile) return { pending: 0, generating: 0, awaitingReview: 0, thisWeekGenerated: 0 };

    const briefs = await ctx.db
      .query("contentBriefs")
      .withIndex("by_brandProfileId_status", (q) => q.eq("brandProfileId", profile._id))
      .collect();

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
      pending: briefs.filter((b) => b.status === "suggested").length,
      generating: briefs.filter((b) => b.status === "approved" || b.status === "generating").length,
      awaitingReview: briefs.filter((b) => b.status === "generated").length,
      thisWeekGenerated: briefs.filter((b) => b.status === "generated" && b.createdAt > weekAgo).length,
    };
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const approveBrief = mutation({
  args: {
    briefId: v.id("contentBriefs"),
    userFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) throw new Error("Brief no encontrado");
    if (brief.status !== "suggested" && brief.status !== "failed") {
      throw new Error("Solo se pueden aprobar briefs sugeridos o fallidos");
    }

    await ctx.db.patch(args.briefId, {
      status: "approved",
      userFeedback: args.userFeedback,
      updatedAt: Date.now(),
    });

    // Schedule content generation
    await ctx.scheduler.runAfter(0, internal.contentAutopilot.generateFromBrief, {
      briefId: args.briefId,
    });
  },
});

export const editAndApproveBrief = mutation({
  args: {
    briefId: v.id("contentBriefs"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    channel: v.optional(v.string()),
    promptInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) throw new Error("Brief no encontrado");

    const updates: Record<string, unknown> = {
      status: "approved",
      updatedAt: Date.now(),
    };
    if (args.title) updates.title = args.title;
    if (args.description) updates.description = args.description;
    if (args.channel) {
      updates.channel = args.channel;
      updates.contentType = CHANNEL_CONTENT_TYPE[args.channel] || args.channel;
    }
    if (args.promptInstructions) updates.promptInstructions = args.promptInstructions;

    await ctx.db.patch(args.briefId, updates);

    await ctx.scheduler.runAfter(0, internal.contentAutopilot.generateFromBrief, {
      briefId: args.briefId,
    });
  },
});

export const dismissBrief = mutation({
  args: { briefId: v.id("contentBriefs") },
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) throw new Error("Brief no encontrado");

    await ctx.db.patch(args.briefId, {
      status: "dismissed",
      updatedAt: Date.now(),
    });
  },
});

export const bulkApproveBriefs = mutation({
  args: { briefIds: v.array(v.id("contentBriefs")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.briefIds.length; i++) {
      const brief = await ctx.db.get(args.briefIds[i]);
      if (!brief || brief.status !== "suggested") continue;

      await ctx.db.patch(args.briefIds[i], {
        status: "approved",
        updatedAt: now,
      });

      // Stagger generation by 2 seconds between each
      await ctx.scheduler.runAfter(i * 2000, internal.contentAutopilot.generateFromBrief, {
        briefId: args.briefIds[i],
      });
    }
  },
});

export const bulkDismissBriefs = mutation({
  args: { briefIds: v.array(v.id("contentBriefs")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.briefIds) {
      const brief = await ctx.db.get(id);
      if (!brief || brief.status !== "suggested") continue;
      await ctx.db.patch(id, { status: "dismissed", updatedAt: now });
    }
  },
});

export const requestChanges = mutation({
  args: {
    briefId: v.id("contentBriefs"),
    feedback: v.string(),
  },
  handler: async (ctx, args) => {
    const brief = await ctx.db.get(args.briefId);
    if (!brief) throw new Error("Brief no encontrado");
    if (brief.status !== "generated") {
      throw new Error("Solo se pueden pedir cambios a briefs ya generados");
    }

    await ctx.db.patch(args.briefId, {
      status: "approved",
      userFeedback: args.feedback,
      updatedAt: Date.now(),
    });

    // Re-generate with feedback
    await ctx.scheduler.runAfter(0, internal.contentAutopilot.generateFromBrief, {
      briefId: args.briefId,
    });
  },
});

// ===========================================
// INTERNAL MUTATIONS
// ===========================================

export const _storeBriefs = internalMutation({
  args: {
    briefs: v.array(v.object({
      title: v.string(),
      description: v.string(),
      channel: v.string(),
      contentType: v.string(),
      pillarName: v.optional(v.string()),
      contentTier: v.optional(v.string()),
      funnelStage: v.optional(v.string()),
      tayaCategory: v.optional(v.string()),
      dayOfWeek: v.optional(v.string()),
      promptInstructions: v.optional(v.string()),
      successProbability: v.optional(v.number()),
    })),
    batchId: v.string(),
    brandProfileId: v.id("brandProfiles"),
    strategyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Look up pillar IDs by name if available
    const pillars = await ctx.db
      .query("contentPillars")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    const pillarMap = new Map(pillars.map((p) => [p.name.toLowerCase(), p._id]));

    for (const brief of args.briefs) {
      const pillarId = brief.pillarName
        ? pillarMap.get(brief.pillarName.toLowerCase())
        : undefined;

      await ctx.db.insert("contentBriefs", {
        briefId: `brief_${shortId()}`,
        brandProfileId: args.brandProfileId,
        strategyId: args.strategyId,
        title: brief.title,
        description: brief.description,
        channel: brief.channel,
        contentType: brief.contentType,
        pillarId,
        pillarName: brief.pillarName,
        contentTier: brief.contentTier as "hero" | "hub" | "hygiene" | undefined,
        funnelStage: brief.funnelStage as "reach" | "act" | "convert" | "engage" | undefined,
        tayaCategory: brief.tayaCategory as "cost" | "problems" | "comparisons" | "reviews" | "best" | undefined,
        dayOfWeek: brief.dayOfWeek,
        promptInstructions: brief.promptInstructions,
        successProbability: brief.successProbability
          ? Math.round(Math.max(0, Math.min(100, brief.successProbability)))
          : undefined,
        batchId: args.batchId,
        status: "suggested",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const _updateBriefStatus = internalMutation({
  args: {
    briefId: v.id("contentBriefs"),
    status: v.union(
      v.literal("suggested"),
      v.literal("approved"),
      v.literal("generating"),
      v.literal("generated"),
      v.literal("dismissed"),
      v.literal("failed")
    ),
    generatedContentId: v.optional(v.id("content")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.generatedContentId) {
      updates.generatedContentId = args.generatedContentId;
    }
    await ctx.db.patch(args.briefId, updates);
  },
});

// ===========================================
// ACTIONS
// ===========================================

/**
 * generateBriefs — Main action: reads strategy + pillars + brand + recent content
 * → calls Claude → proposes 5-8 specific briefs → stores via _storeBriefs
 */
export const generateBriefs = internalAction({
  args: {
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    // 1. Get brand profile
    const profile = args.brandProfileId
      ? await ctx.runQuery(api.brandProfile.getBrandProfileById, { id: args.brandProfileId })
      : await ctx.runQuery(api.brandProfile.getBrandProfile);

    if (!profile) throw new Error("Brand profile not found");

    // 2. Get active strategy
    const strategy = await ctx.runQuery(api.cmoEngine.getActiveStrategy);

    // 3. Get active pillars
    const pillars = await ctx.runQuery(api.contentPillars.getPillarsByBrand, {
      brandProfileId: profile._id,
    });
    const activePillars = pillars.filter((p: { status: string }) => p.status === "active");

    // 4. Get topic suggestions
    const topicSuggestions = await ctx.runQuery(api.topicSuggestions.getQuickSuggestions);

    // 5. Get recent content (last 20)
    const recentContent = await ctx.runQuery(api.functions.listContent, {
      brandProfileId: profile._id,
    });
    const last20 = (recentContent || []).slice(0, 20);

    // 6. Build context for Claude
    const pillarContext = activePillars.length > 0
      ? activePillars.map((p: { name: string; description: string; tayaCategories?: string[]; funnelStages?: string[]; contentTiers?: string[] }) =>
          `- ${p.name}: ${p.description} (TAYA: ${p.tayaCategories?.join(", ") || "N/A"}, Funnel: ${p.funnelStages?.join(", ") || "N/A"}, Tiers: ${p.contentTiers?.join(", ") || "N/A"})`
        ).join("\n")
      : "No hay pilares definidos aún";

    const calendarContext = strategy?.strategy?.weeklyCalendar
      ? (strategy.strategy.weeklyCalendar as Array<{ dayOfWeek: string; contentType: string; channel: string; description: string }>)
          .map((e) => `- ${e.dayOfWeek}: ${e.contentType} en ${e.channel} — ${e.description}`)
          .join("\n")
      : "No hay calendario semanal definido";

    const topicContext = topicSuggestions.length > 0
      ? topicSuggestions.map((t: { topic: string; successProbability: number; suggestedChannels: string[] }) =>
          `- "${t.topic}" (prob: ${t.successProbability}%, canales: ${t.suggestedChannels.join(", ")})`
        ).join("\n")
      : "";

    const recentTitles = last20.map((c: { title: string; type: string; status: string }) =>
      `- [${c.type}] "${c.title}" (${c.status})`
    ).join("\n");

    const prompt = `Eres el CMO AI de ${profile.companyName}. Genera briefs de contenido específicos para la próxima semana.

## Perfil de Marca
- Empresa: ${profile.companyName} (${profile.industry})
- Descripción: ${profile.description}
- Tono: ${profile.voice.tone.join(", ")}
- Audiencia: ${profile.audience.segments.map((s: { name: string }) => s.name).join(", ")}
- Canales: ${profile.strategy.channels.join(", ")}

## Pilares de Contenido
${pillarContext}

## Calendario Semanal (estrategia)
${calendarContext}

${topicContext ? `## Temas Sugeridos (alta probabilidad)\n${topicContext}` : ""}

## Contenido Reciente (evitar duplicados)
${recentTitles || "Sin contenido reciente"}

## Instrucciones
Genera 5-8 briefs concretos para la próxima semana. Cada brief debe:
1. Tener un título específico y atractivo (no genérico)
2. Incluir una descripción clara del ángulo y enfoque
3. Estar alineado con un pilar de contenido existente
4. Especificar el canal y tipo de contenido
5. Incluir clasificación de framework (tier, funnel, TAYA)
6. Dar instrucciones claras para la IA que generará el contenido
7. Tener un score de probabilidad de éxito (40-95)

NO repitas temas ya publicados. Varía los canales y tiers.

Responde SOLO con JSON válido:
{
  "briefs": [
    {
      "title": "Título específico del contenido",
      "description": "Por qué este contenido y qué ángulo tomar (2-3 oraciones)",
      "channel": "linkedin|twitter|instagram|blog|email|newsletter",
      "contentType": "social_linkedin|social_twitter|social_instagram|blog|email|newsletter",
      "pillarName": "Nombre del pilar (debe coincidir con los existentes)",
      "contentTier": "hero|hub|hygiene",
      "funnelStage": "reach|act|convert|engage",
      "tayaCategory": "cost|problems|comparisons|reviews|best",
      "dayOfWeek": "Monday|Tuesday|...",
      "promptInstructions": "Instrucciones específicas para generar este contenido",
      "successProbability": 75
    }
  ]
}`;

    // 7. Call Claude
    const response = await ctx.runAction(api.actions.callClaude, {
      systemPrompt: "Eres un CMO AI experto. Generas briefs de contenido concretos, variados y estratégicos. Siempre respondes en JSON válido.",
      userMessage: prompt,
      temperature: 0.6,
      maxTokens: 4000,
    });

    // 8. Parse response
    let parsed: { briefs: Array<{
      title: string;
      description: string;
      channel: string;
      contentType: string;
      pillarName?: string;
      contentTier?: string;
      funnelStage?: string;
      tayaCategory?: string;
      dayOfWeek?: string;
      promptInstructions?: string;
      successProbability?: number;
    }> };
    try {
      let cleaned = response.content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse brief suggestions from Claude");
    }

    if (!Array.isArray(parsed.briefs) || parsed.briefs.length === 0) {
      throw new Error("No briefs generated");
    }

    // 9. Store briefs
    const batchId = `batch_${shortId()}`;
    await ctx.runMutation(internal.contentAutopilot._storeBriefs, {
      briefs: parsed.briefs.map((b) => ({
        title: b.title || "Brief sugerido",
        description: b.description || "",
        channel: b.channel || "linkedin",
        contentType: b.contentType || CHANNEL_CONTENT_TYPE[b.channel] || "social_linkedin",
        pillarName: b.pillarName,
        contentTier: b.contentTier,
        funnelStage: b.funnelStage,
        tayaCategory: b.tayaCategory,
        dayOfWeek: b.dayOfWeek,
        promptInstructions: b.promptInstructions,
        successProbability: b.successProbability,
      })),
      batchId,
      brandProfileId: profile._id,
      strategyId: strategy?.strategyId,
    });

    return { batchId, count: parsed.briefs.length };
  },
});

/**
 * generateFromBrief — Takes an approved brief → generates content via multiChannelGenerate
 * → patches content with framework metadata → updates brief status
 */
export const generateFromBrief = internalAction({
  args: {
    briefId: v.id("contentBriefs"),
  },
  handler: async (ctx, args) => {
    // 1. Get brief
    const brief = await ctx.runQuery(api.contentAutopilot._getBriefById, {
      briefId: args.briefId,
    });
    if (!brief) throw new Error("Brief not found");

    // Mark as generating
    await ctx.runMutation(internal.contentAutopilot._updateBriefStatus, {
      briefId: args.briefId,
      status: "generating",
    });

    try {
      // 2. Build generation instructions
      let instructions = brief.description;
      if (brief.promptInstructions) {
        instructions += `\n\nInstrucciones adicionales: ${brief.promptInstructions}`;
      }
      if (brief.userFeedback) {
        instructions += `\n\nFeedback del usuario (incorporar estos cambios): ${brief.userFeedback}`;
      }

      // 3. Generate content via multiChannelGenerate
      const result = await ctx.runAction(api.multiChannelGenerate.generateMultiChannelContent, {
        topic: brief.title,
        channels: [brief.channel],
        customInstructions: instructions,
        templateId: brief.templateId,
      });

      // 4. Check result
      const channelResult = result.results[0];
      if (!channelResult?.success || !channelResult.contentId) {
        throw new Error(channelResult?.error || "Content generation failed");
      }

      // 5. Patch generated content with framework metadata
      const contentId = channelResult.contentId as Id<"content">;
      await ctx.runMutation(internal.contentAutopilot._patchContentFramework, {
        contentId,
        pillarId: brief.pillarId,
        contentTier: brief.contentTier,
        funnelStage: brief.funnelStage,
        tayaCategory: brief.tayaCategory,
        brandProfileId: brief.brandProfileId,
      });

      // 6. Update brief status to generated
      await ctx.runMutation(internal.contentAutopilot._updateBriefStatus, {
        briefId: args.briefId,
        status: "generated",
        generatedContentId: contentId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.contentAutopilot._updateBriefStatus, {
        briefId: args.briefId,
        status: "failed",
      });
      // Log the failure
      console.error(`Brief generation failed for ${args.briefId}: ${errorMessage}`);
    }
  },
});

/**
 * triggerWeeklyBriefs — Called by cron to auto-generate briefs for all active brands
 */
export const triggerWeeklyBriefs = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all complete brand profiles
    const profiles = await ctx.runQuery(api.contentAutopilot._getCompleteBrandProfiles);

    for (const profile of profiles) {
      try {
        await ctx.runAction(internal.contentAutopilot.generateBriefs, {
          brandProfileId: profile._id,
        });
      } catch (error) {
        console.error(`Failed to generate briefs for brand ${profile._id}:`, error);
      }
    }
  },
});

// ===========================================
// INTERNAL QUERIES (for actions)
// ===========================================

export const _getBriefById = query({
  args: { briefId: v.id("contentBriefs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.briefId);
  },
});

export const _getCompleteBrandProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();
    return profiles.map((p) => ({ _id: p._id }));
  },
});

// ===========================================
// INTERNAL MUTATION: Patch content with framework data
// ===========================================

export const _patchContentFramework = internalMutation({
  args: {
    contentId: v.id("content"),
    pillarId: v.optional(v.id("contentPillars")),
    contentTier: v.optional(v.union(v.literal("hero"), v.literal("hub"), v.literal("hygiene"))),
    funnelStage: v.optional(v.union(v.literal("reach"), v.literal("act"), v.literal("convert"), v.literal("engage"))),
    tayaCategory: v.optional(v.union(v.literal("cost"), v.literal("problems"), v.literal("comparisons"), v.literal("reviews"), v.literal("best"))),
    brandProfileId: v.optional(v.id("brandProfiles")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.pillarId) updates.pillarId = args.pillarId;
    if (args.contentTier) updates.contentTier = args.contentTier;
    if (args.funnelStage) updates.funnelStage = args.funnelStage;
    if (args.tayaCategory) updates.tayaCategory = args.tayaCategory;
    if (args.brandProfileId) updates.brandProfileId = args.brandProfileId;

    await ctx.db.patch(args.contentId, updates);
  },
});

// ===========================================
// PUBLIC ACTION: Manual trigger for generateBriefs
// ===========================================

export const triggerGenerateBriefs = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("No se encontró perfil de marca");
    if (profile.status !== "complete") throw new Error("El perfil de marca debe estar completo");

    await ctx.scheduler.runAfter(0, internal.contentAutopilot.generateBriefs, {
      brandProfileId: profile._id,
    });

    return { triggered: true };
  },
});
