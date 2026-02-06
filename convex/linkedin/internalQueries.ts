import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Internal query to get connection with sensitive token data
 * Only used by actions, never exposed to frontend
 */
export const getConnectionWithToken = internalQuery({
  args: { connectionId: v.id("linkedinConnections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.connectionId);
  },
});

/**
 * Get content by _id for publish action
 */
export const getContentById = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contentId);
  },
});

/**
 * Get all connected accounts (for cron token check)
 */
export const getActiveConnections = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("linkedinConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .collect();
  },
});

/**
 * Get published posts with LinkedIn URN for engagement fetching
 * Returns posts with publishedAt timestamp and connection ID
 */
export const getPublishedPostsWithUrn = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all published LinkedIn posts with URN
    const publishLogs = await ctx.db
      .query("linkedinPublishLog")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // Filter logs that have a URN
    const logsWithUrn = publishLogs.filter(log => log.linkedinPostUrn);

    // Fetch content data to get publishedAt timestamp
    const results = await Promise.all(
      logsWithUrn.map(async (log) => {
        const content = await ctx.db.get(log.contentId);
        return {
          contentId: log.contentId,
          linkedinPostUrn: log.linkedinPostUrn!,
          publishedAt: log.publishedAt || content?.publishedAt || Date.now(),
          connectionId: log.connectionId,
        };
      })
    );

    // Sort by publishedAt desc (most recent first)
    return results.sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

/**
 * Get latest engagement snapshot for a content piece
 * Used to determine if refresh is needed based on TTL
 */
export const getLatestEngagementSnapshot = internalQuery({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("linkedinEngagement")
      .withIndex("by_contentId_fetchedAt", (q) =>
        q.eq("contentId", args.contentId)
      )
      .order("desc")
      .first();
  },
});
