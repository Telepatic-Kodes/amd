import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Query audit log entries with pagination and filters.
 * Used in settings/audit-log section of the dashboard.
 */
export const getAuditLog = query({
  args: {
    limit: v.optional(v.number()),
    entityType: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, entityType, action }) => {
    let q = ctx.db.query("auditLog").order("desc");

    if (action) {
      q = ctx.db
        .query("auditLog")
        .withIndex("by_action", (idx) => idx.eq("action", action))
        .order("desc");
    }

    const entries = await q.take(limit);

    // Post-filter by entityType if provided (index covers action only)
    if (entityType) {
      return entries.filter((e) => e.entityType === entityType);
    }

    return entries;
  },
});

/**
 * Export user profile data as JSON (GDPR/compliance).
 */
export const exportUserData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // User record
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), userId))
      .first();

    // User settings
    const settings = await ctx.db
      .query("settings")
      .take(100);

    // Report settings
    const reportSettings = await ctx.db
      .query("reportSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Brand profiles
    const brandProfiles = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Onboarding status
    const onboarding = await ctx.db
      .query("onboarding")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return {
      exportedAt: new Date().toISOString(),
      user: user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          }
        : null,
      settings: settings.map((s) => ({
        key: s.key,
        value: s.value,
      })),
      reportSettings: reportSettings
        ? {
            frequency: reportSettings.frequency,
            emailEnabled: reportSettings.emailEnabled,
            recipientEmail: reportSettings.recipientEmail,
          }
        : null,
      brandProfiles: brandProfiles.map((bp) => ({
        companyName: bp.companyName,
        industry: bp.industry,
        description: bp.description,
        createdAt: bp.createdAt,
      })),
      onboardingComplete: !!onboarding?.completedAt,
    };
  },
});

/**
 * Export all content as structured data (CSV-ready).
 * Returns array of content objects with flat structure.
 */
export const exportContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 500 }) => {
    const content = await ctx.db
      .query("content")
      .order("desc")
      .take(limit);

    return content.map((c) => ({
      id: c._id,
      type: c.type,
      title: c.title,
      status: c.status,
      body: c.body,
      summary: c.summary ?? "",
      createdBy: c.createdBy,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : "",
      wordCount: c.metadata?.wordCount ?? 0,
      readingTime: c.metadata?.readingTime ?? 0,
      metaTitle: c.seo?.metaTitle ?? "",
      metaDescription: c.seo?.metaDescription ?? "",
      slug: c.seo?.slug ?? "",
    }));
  },
});

/**
 * Agent analytics — execution stats per agent.
 * Tracks success rate, average duration, token usage.
 */
export const getAgentAnalytics = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, { daysBack = 30 }) => {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const executions = await ctx.db
      .query("executions")
      .order("desc")
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .take(1000);

    // Aggregate per agent
    const agentStats: Record<
      string,
      {
        agentId: string;
        total: number;
        successful: number;
        failed: number;
        totalTokens: number;
        totalDuration: number;
        totalCost: number;
      }
    > = {};

    for (const exec of executions) {
      const id = exec.agentId as string;
      if (!agentStats[id]) {
        agentStats[id] = {
          agentId: id,
          total: 0,
          successful: 0,
          failed: 0,
          totalTokens: 0,
          totalDuration: 0,
          totalCost: 0,
        };
      }
      const stats = agentStats[id];
      stats.total++;
      if (exec.status === "success") stats.successful++;
      if (exec.status === "failure") stats.failed++;
      stats.totalTokens += exec.tokensUsed?.total ?? 0;
      stats.totalDuration += exec.duration ?? 0;
      stats.totalCost += exec.cost ?? 0;
    }

    return Object.values(agentStats).map((s) => ({
      ...s,
      successRate: s.total > 0 ? Math.round((s.successful / s.total) * 100) : 0,
      avgDuration: s.total > 0 ? Math.round(s.totalDuration / s.total) : 0,
      avgTokens: s.total > 0 ? Math.round(s.totalTokens / s.total) : 0,
    }));
  },
});
