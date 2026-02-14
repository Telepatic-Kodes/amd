import { v } from "convex/values";
import {
  query,
  mutation,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

// ===========================================
// CONTENT RECYCLING — P7: Content Recycling Engine
//
// Weekly cron-triggered action that finds high-performing published content
// eligible for recycling/repurposing. Manual recycleContent mutation creates
// new drafts in target channels from existing published content.
// The cron in crons.ts calls identifyRecyclingCandidates every Sunday at 10:00 AM UTC.
// ===========================================

/**
 * identifyRecyclingCandidates — Weekly cron that finds high-performing published content
 * eligible for recycling/repurposing.
 */
export const identifyRecyclingCandidates = internalAction({
  handler: async (ctx) => {
    // Get published content that hasn't been recently recycled
    const candidates = await ctx.runQuery(
      internal.contentRecycling._getRecyclingCandidates
    );

    if (candidates.length === 0) return;

    // Get engagement data for scoring
    const withEngagement: Array<{
      _id: string;
      title: string;
      type: string;
      engagement: {
        likes: number;
        comments: number;
        shares: number;
        impressions: number;
      };
    }> = [];

    for (const content of candidates) {
      const engagement = await ctx.runQuery(
        internal.contentRecycling._getContentEngagement,
        { contentId: content._id }
      );
      if (engagement) {
        withEngagement.push({
          _id: content._id,
          title: content.title,
          type: content.type,
          engagement: {
            likes: engagement.likes,
            comments: engagement.comments,
            shares: engagement.shares,
            impressions: engagement.impressions,
          },
        });
      }
    }

    // Sort by engagement and log top performers
    const topPerformers = withEngagement
      .sort((a, b) => {
        const scoreA =
          (a.engagement.likes || 0) +
          (a.engagement.comments || 0) * 3 +
          (a.engagement.shares || 0) * 5;
        const scoreB =
          (b.engagement.likes || 0) +
          (b.engagement.comments || 0) * 3 +
          (b.engagement.shares || 0) * 5;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    if (topPerformers.length > 0) {
      console.log(
        `[Content Recycling] Found ${topPerformers.length} candidates for recycling:`,
        topPerformers.map((p) => p.title)
      );
    }
  },
});

// ===========================================
// INTERNAL QUERIES — Used by the identifyRecyclingCandidates action
// ===========================================

export const _getRecyclingCandidates = internalQuery({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const published = await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return published.filter((c) => {
      // Must be published at least 30 days ago
      if (!c.publishedAt || c.publishedAt > thirtyDaysAgo) return false;
      // Must not have been recycled in the last 60 days
      if (c.recycledAt && c.recycledAt > sixtyDaysAgo) return false;
      // Max 3 recycles
      if ((c.recycleCount || 0) >= 3) return false;
      return true;
    });
  },
});

export const _getContentEngagement = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("linkedinEngagement")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .first();
  },
});

// ===========================================
// PUBLIC MUTATION — Manual content recycling
// ===========================================

/**
 * recycleContent — Manual action to recycle a specific content piece.
 * Creates new draft content for each target channel.
 */
export const recycleContent = mutation({
  args: {
    contentId: v.id("content"),
    targetChannels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.contentId);
    if (!content) throw new Error("Content not found");
    if (content.status !== "published")
      throw new Error("Only published content can be recycled");

    const now = Date.now();

    // Mark original as recycled
    await ctx.db.patch(args.contentId, {
      recycledAt: now,
      recycleCount: (content.recycleCount || 0) + 1,
      updatedAt: now,
    });

    // Map channel names to content types
    const typeMap: Record<string, string> = {
      linkedin: "social_linkedin",
      twitter: "social_twitter",
      instagram: "social_instagram",
      blog: "blog",
      email: "newsletter",
    };

    // Create new draft content for each target channel
    const newContentIds = [];
    for (const channel of args.targetChannels) {
      const contentId = `recycled_${now}_${Math.random().toString(36).substr(2, 9)}`;
      const newType = typeMap[channel] || "blog";

      const newId = await ctx.db.insert("content", {
        contentId,
        type: newType as
          | "blog"
          | "social_linkedin"
          | "social_twitter"
          | "social_instagram"
          | "social_tiktok"
          | "email"
          | "newsletter"
          | "ad_copy"
          | "landing_page"
          | "whitepaper"
          | "case_study"
          | "video_script",
        title: `[Reciclado] ${content.title}`,
        body: content.body,
        summary: `Reciclado de "${content.title}" para ${channel}`,
        metadata: content.metadata,
        status: "draft",
        createdBy: content.createdBy,
        parentContentId: args.contentId,
        createdAt: now,
        updatedAt: now,
      });
      newContentIds.push(newId);
    }

    // Audit log
    await ctx.db.insert("auditLog", {
      action: "content.recycled",
      entityType: "content",
      entityId: content.contentId,
      performedBy: "user",
      changes: {
        recycleCount: (content.recycleCount || 0) + 1,
        targetChannels: args.targetChannels,
        newContentIds,
      },
      timestamp: now,
    });

    return { recycledFrom: args.contentId, newContentIds };
  },
});

// ===========================================
// PUBLIC QUERIES — For the frontend
// ===========================================

/**
 * getRecyclableContent — Returns published content older than 30 days
 * that can still be recycled (max 3 times).
 */
export const getRecyclableContent = query({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const published = await ctx.db
      .query("content")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    return published
      .filter(
        (c) =>
          c.publishedAt &&
          c.publishedAt <= thirtyDaysAgo &&
          (c.recycleCount || 0) < 3
      )
      .sort((a, b) => (a.publishedAt || 0) - (b.publishedAt || 0))
      .slice(0, 20)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        type: c.type,
        publishedAt: c.publishedAt,
        recycleCount: c.recycleCount || 0,
        summary: c.summary,
      }));
  },
});

/**
 * getRecycledContent — Returns content that was created from recycling.
 */
export const getRecycledContent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const content = await ctx.db.query("content").collect();
    return content
      .filter((c) => c.parentContentId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 20)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        type: c.type,
        status: c.status,
        parentContentId: c.parentContentId,
        createdAt: c.createdAt,
      }));
  },
});
