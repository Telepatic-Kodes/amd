import { v } from "convex/values";
import {
  query,
  mutation,
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";

// ===========================================
// STRATEGY REVIEW — P4: Strategy Feedback Loop
//
// Weekly cron-triggered action that aggregates content performance
// by pillar, compares vs. objectives, and generates AI insights.
// The cron in crons.ts calls weeklyStrategyReview every Monday at 9:00 AM UTC.
// ===========================================

/**
 * weeklyStrategyReview — Cron-triggered action that aggregates content performance
 * by pillar, compares vs. objectives, and generates AI insights.
 */
export const weeklyStrategyReview = internalAction({
  handler: async (ctx) => {
    // 1. Get active brand profile
    const profile = await ctx.runQuery(
      internal.brandProfile._getFirstBrandProfile
    );
    if (!profile) return;

    // 2. Get all published content from the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allContent = await ctx.runQuery(
      internal.strategyReview._getRecentPublishedContent,
      { since: sevenDaysAgo }
    );

    if (allContent.length === 0) return;

    // 3. Get content pillars
    const pillars = await ctx.runQuery(
      internal.strategyReview._getActivePillars,
      { brandProfileId: profile._id }
    );

    // 4. Get engagement data (from LinkedIn, etc.)
    const engagementData = await ctx.runQuery(
      internal.strategyReview._getRecentEngagement,
      { since: sevenDaysAgo }
    );

    // 5. Build summary for Claude
    const contentByType: Record<string, number> = {};
    const contentByPillar: Record<string, number> = {};

    for (const c of allContent) {
      contentByType[c.type] = (contentByType[c.type] || 0) + 1;
      if (c.pillarId) {
        const pillar = pillars.find((p) => p._id === c.pillarId);
        const name = pillar?.name || "Sin pilar";
        contentByPillar[name] = (contentByPillar[name] || 0) + 1;
      }
    }

    const prompt = `Eres un CMO analitico. Revisa el rendimiento de contenido de esta semana y genera insights estrategicos.

MARCA: ${profile.companyName} (${profile.industry})

CONTENIDO PUBLICADO ESTA SEMANA (${allContent.length} piezas):
Por tipo: ${JSON.stringify(contentByType)}
Por pilar: ${JSON.stringify(contentByPillar)}

PILARES ACTIVOS: ${pillars.map((p) => p.name).join(", ") || "Ninguno definido"}

ENGAGEMENT (ultimos 7 dias): ${engagementData.length > 0 ? JSON.stringify(engagementData.slice(0, 5)) : "Sin datos de engagement aun"}

Genera 2-4 insights estrategicos en JSON:
{
  "insights": [
    {
      "type": "pillar_performance" | "channel_performance" | "content_recommendation" | "pivot_suggestion",
      "title": "Titulo corto del insight",
      "summary": "Descripcion de 2-3 oraciones con recomendacion accionable",
      "priority": "high" | "medium" | "low",
      "details": { "metric": "valor", "recommendation": "accion sugerida" }
    }
  ]
}

Responde UNICAMENTE con JSON valido.`;

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
          model: "claude-haiku-3-20250514",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        content: Array<{ text: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      // Parse response — strip markdown fences if present
      let cleaned = data.content[0].text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const result = JSON.parse(cleaned) as {
        insights: Array<{
          type: string;
          title: string;
          summary: string;
          priority: string;
          details?: Record<string, unknown>;
        }>;
      };
      const tokensUsed =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      // Store insights
      await ctx.runMutation(internal.strategyReview._storeInsights, {
        brandProfileId: profile._id,
        userId: profile.userId,
        insights: result.insights,
        tokensUsed,
      });
    } catch (e) {
      console.error("[Strategy Review] Failed:", e);
    }
  },
});

// ===========================================
// INTERNAL QUERIES — Used by the weeklyStrategyReview action
// ===========================================

export const _getRecentPublishedContent = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    const content = await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return content.filter(
      (c) => c.publishedAt && c.publishedAt >= args.since
    );
  },
});

export const _getActivePillars = internalQuery({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const pillars = await ctx.db
      .query("contentPillars")
      .withIndex("by_brandProfileId", (q) =>
        q.eq("brandProfileId", args.brandProfileId)
      )
      .collect();
    return pillars.filter((p) => p.status === "active");
  },
});

export const _getRecentEngagement = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("linkedinEngagement")
      .withIndex("by_fetchedAt", (q) => q.gte("fetchedAt", args.since))
      .collect();
  },
});

// ===========================================
// INTERNAL MUTATION — Store generated insights
// ===========================================

export const _storeInsights = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    userId: v.optional(v.string()),
    insights: v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        summary: v.string(),
        priority: v.string(),
        details: v.optional(v.any()),
      })
    ),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const insight of args.insights) {
      await ctx.db.insert("strategyInsights", {
        brandProfileId: args.brandProfileId,
        userId: args.userId,
        type: insight.type as
          | "pillar_performance"
          | "channel_performance"
          | "content_recommendation"
          | "pivot_suggestion",
        title: insight.title,
        summary: insight.summary,
        details: insight.details || {},
        priority: insight.priority as "high" | "medium" | "low",
        status: "active",
        tokensUsed: args.tokensUsed,
        generatedAt: now,
      });
    }
  },
});

// ===========================================
// PUBLIC QUERIES — For the frontend
// ===========================================

/**
 * getInsights — Returns active strategy insights, sorted by most recent.
 */
export const getInsights = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const insights = await ctx.db.query("strategyInsights").collect();
    return insights
      .filter((i) => i.status === "active")
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, args.limit ?? 20);
  },
});

/**
 * getAllInsights — Returns all insights (including acknowledged/dismissed) for history.
 */
export const getAllInsights = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const insights = await ctx.db.query("strategyInsights").collect();
    return insights
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, args.limit ?? 50);
  },
});

// ===========================================
// PUBLIC MUTATIONS — Acknowledge / Dismiss insights
// ===========================================

export const acknowledgeInsight = mutation({
  args: { insightId: v.id("strategyInsights") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.insightId, {
      status: "acknowledged",
      acknowledgedAt: Date.now(),
    });
  },
});

export const dismissInsight = mutation({
  args: { insightId: v.id("strategyInsights") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.insightId, { status: "dismissed" });
  },
});
