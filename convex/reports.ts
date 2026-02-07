import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/**
 * Query: getUserReportSettings
 * Returns user's report settings or defaults
 */
export const getUserReportSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;

    const settings = await ctx.db
      .query("reportSettings")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    if (!settings) {
      return {
        emailEnabled: false,
        frequency: "weekly" as const,
        includeNarrative: true,
        recipientEmail: identity.email,
      };
    }

    return {
      emailEnabled: settings.emailEnabled,
      frequency: settings.frequency,
      includeNarrative: settings.includeNarrative,
      recipientEmail: settings.recipientEmail || identity.email,
    };
  },
});

/**
 * Mutation: updateReportSettings
 * Upsert settings
 */
export const updateReportSettings = mutation({
  args: {
    emailEnabled: v.optional(v.boolean()),
    frequency: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("both"))),
    recipientEmail: v.optional(v.string()),
    includeNarrative: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;

    const existing = await ctx.db
      .query("reportSettings")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.emailEnabled !== undefined && { emailEnabled: args.emailEnabled }),
        ...(args.frequency !== undefined && { frequency: args.frequency }),
        ...(args.recipientEmail !== undefined && { recipientEmail: args.recipientEmail }),
        ...(args.includeNarrative !== undefined && { includeNarrative: args.includeNarrative }),
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      const id = await ctx.db.insert("reportSettings", {
        userId,
        emailEnabled: args.emailEnabled ?? false,
        frequency: args.frequency ?? "weekly",
        recipientEmail: args.recipientEmail,
        includeNarrative: args.includeNarrative ?? true,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

/**
 * Query: getReportHistory
 * Returns user's past reports (without HTML content for list view)
 */
export const getReportHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 20);

    return reports.map((report) => ({
      _id: report._id,
      type: report.type,
      title: report.title,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      metrics: report.metrics,
      narrative: report.narrative,
      emailSent: report.emailSent,
      emailSentAt: report.emailSentAt,
      emailError: report.emailError,
      generatedAt: report.generatedAt,
    }));
  },
});

/**
 * Query: getReportById
 * Returns full report including HTML
 */
export const getReportById = query({
  args: {
    id: v.id("reports"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.subject;

    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new Error("Reporte no encontrado");
    }

    if (report.userId !== userId) {
      throw new Error("No tienes permiso para ver este reporte");
    }

    return report;
  },
});

/**
 * Internal helper: buildReportMetrics
 * Aggregates analytics for a given user and period
 */
export const buildReportMetricsInternal = internalQuery({
  args: {
    userId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Count total content and published content for user
    const allContent = await ctx.db
      .query("content")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .collect();

    const totalContent = allContent.length;

    const contentPublished = allContent.filter(
      (c: any) =>
        c.status === "published" &&
        c.publishedAt &&
        c.publishedAt >= args.periodStart &&
        c.publishedAt <= args.periodEnd
    ).length;

    // Query executions for tokens and cost
    const allExecutions = await ctx.db.query("executions").collect();

    const periodExecutions = allExecutions.filter(
      (e: any) => e.timestamp >= args.periodStart && e.timestamp <= args.periodEnd
    );

    const totalTokens = periodExecutions.reduce(
      (sum: number, e: any) => sum + (e.tokensUsed?.total || 0),
      0
    );

    const totalCost = periodExecutions.reduce(
      (sum: number, e: any) => sum + (e.cost || 0),
      0
    );

    const successCount = periodExecutions.filter((e: any) => e.status === "success").length;
    const successRate = periodExecutions.length > 0 ? (successCount / periodExecutions.length) * 100 : 0;

    // Query LinkedIn engagement for total engagement
    const linkedinEngagement = await ctx.db
      .query("linkedinEngagement")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .collect();

    const periodEngagement = linkedinEngagement.filter(
      (e: any) => e.fetchedAt >= args.periodStart && e.fetchedAt <= args.periodEnd
    );

    const totalEngagement = periodEngagement.reduce(
      (sum: number, e: any) => sum + (e.likes || 0) + (e.comments || 0) + (e.shares || 0),
      0
    );

    // Determine top platform by engagement/posts
    const publishedContent = allContent.filter(
      (c: any) =>
        c.status === "published" &&
        c.publishedAt &&
        c.publishedAt >= args.periodStart &&
        c.publishedAt <= args.periodEnd
    );

    const platformCounts: Record<string, number> = {};
    publishedContent.forEach((c: any) => {
      const type = c.type;
      if (type === "social_linkedin") platformCounts["LinkedIn"] = (platformCounts["LinkedIn"] || 0) + 1;
      else if (type === "social_twitter") platformCounts["Twitter"] = (platformCounts["Twitter"] || 0) + 1;
      else if (type === "social_instagram") platformCounts["Instagram"] = (platformCounts["Instagram"] || 0) + 1;
    });

    const topPlatform = Object.keys(platformCounts).length > 0
      ? Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0][0]
      : undefined;

    return {
      totalContent,
      contentPublished,
      totalTokens,
      totalCost,
      successRate,
      topPlatform,
      totalEngagement,
    };
  },
});

// ===========================================
// INTERNAL HELPERS
// ===========================================

export const getAllReportSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reportSettings").collect();
  },
});

export const insertReport = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(v.literal("weekly"), v.literal("monthly")),
    title: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    htmlContent: v.string(),
    metrics: v.object({
      totalContent: v.number(),
      contentPublished: v.number(),
      totalTokens: v.number(),
      totalCost: v.number(),
      successRate: v.number(),
      topPlatform: v.optional(v.string()),
      totalEngagement: v.optional(v.number()),
    }),
    narrative: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      htmlContent: args.htmlContent,
      metrics: args.metrics,
      narrative: args.narrative,
      emailSent: false,
      generatedAt: Date.now(),
    });
  },
});

export const markReportSent = internalMutation({
  args: {
    reportId: v.id("reports"),
    emailSentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      emailSent: true,
      emailSentAt: args.emailSentAt,
    });
  },
});

export const markReportError = internalMutation({
  args: {
    reportId: v.id("reports"),
    emailError: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      emailSent: false,
      emailError: args.emailError,
    });
  },
});
