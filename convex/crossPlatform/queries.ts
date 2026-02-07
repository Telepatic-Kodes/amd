import { v } from "convex/values";
import { query } from "../_generated/server";
import { getUserId } from "../lib/auth";
import { Id } from "../_generated/dataModel";

/**
 * UNIFIED PUBLISHING HISTORY
 *
 * Merges publishing logs from LinkedIn, Twitter, and Instagram
 * into a single chronological timeline.
 */

interface UnifiedPublishEntry {
  _id: string;
  platform: "linkedin" | "twitter" | "instagram";
  contentId: Id<"content">;
  contentTitle: string;
  status: "pending" | "published" | "failed" | "deleted";
  publishedAt?: number;
  createdAt: number;
  error?: string;
  platformUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get unified publishing history from all platforms
 */
export const getUnifiedPublishHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<UnifiedPublishEntry[]> => {
    // Authentication
    const userId = await getUserId(ctx);

    const limit = args.limit ?? 50;

    // Query all 3 publish log tables
    const linkedinLogs = await ctx.db
      .query("linkedinPublishLog")
      .order("desc")
      .take(limit);

    const twitterLogs = await ctx.db
      .query("twitterPublishLog")
      .order("desc")
      .take(limit);

    const instagramLogs = await ctx.db
      .query("instagramPublishLog")
      .order("desc")
      .take(limit);

    // Normalize LinkedIn entries
    const linkedinEntries = await Promise.all(
      linkedinLogs.map(async (log) => {
        const content = await ctx.db.get(log.contentId);
        const contentTitle = content?.title || "Sin título";

        // Get connection for username
        let platformUrl: string | undefined;
        if (log.linkedinPostUrn && log.status === "published") {
          // LinkedIn URLs require the URN but we don't have direct URL
          // Store URN in metadata instead
          platformUrl = undefined;
        }

        return {
          _id: log._id,
          platform: "linkedin" as const,
          contentId: log.contentId,
          contentTitle,
          status: log.status,
          publishedAt: log.publishedAt,
          createdAt: log.createdAt,
          error: log.errorMessage,
          platformUrl,
          metadata: {
            linkedinPostUrn: log.linkedinPostUrn,
            ...(log.metadata || {}),
          },
        };
      })
    );

    // Normalize Twitter entries
    const twitterEntries = await Promise.all(
      twitterLogs.map(async (log) => {
        const content = await ctx.db.get(log.contentId);
        const contentTitle = content?.title || "Sin título";

        // Get connection for username
        let platformUrl: string | undefined;
        if (log.tweetIds && log.tweetIds.length > 0) {
          // Try to get username from connection
          const connection = await ctx.db.get(log.connectionId);
          if (connection && connection.username) {
            const firstTweetId = log.tweetIds[0];
            platformUrl = `https://twitter.com/${connection.username}/status/${firstTweetId}`;
          }
        }

        return {
          _id: log._id,
          platform: "twitter" as const,
          contentId: log.contentId,
          contentTitle,
          status: log.status,
          publishedAt: log.publishedAt,
          createdAt: log.createdAt,
          error: log.errorMessage,
          platformUrl,
          metadata: {
            tweetIds: log.tweetIds,
            isThread: log.metadata?.isThread,
            threadUrl: log.metadata?.threadUrl,
            tweetCount: log.metadata?.tweetCount,
          },
        };
      })
    );

    // Normalize Instagram entries
    const instagramEntries = await Promise.all(
      instagramLogs.map(async (log) => {
        const content = await ctx.db.get(log.contentId);
        const contentTitle = content?.title || "Sin título";

        return {
          _id: log._id,
          platform: "instagram" as const,
          contentId: log.contentId,
          contentTitle,
          status: log.status,
          publishedAt: log.publishedAt,
          createdAt: log.createdAt,
          error: log.errorMessage,
          platformUrl: log.metadata?.permalink,
          metadata: {
            instagramMediaId: log.instagramMediaId,
            mediaType: log.mediaType,
            permalink: log.metadata?.permalink,
            imageCount: log.metadata?.imageCount,
          },
        };
      })
    );

    // Merge and sort by createdAt (newest first)
    const allEntries = [
      ...linkedinEntries,
      ...twitterEntries,
      ...instagramEntries,
    ].sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    return allEntries.slice(0, limit);
  },
});

/**
 * Get publishing summary statistics across all platforms
 */
export const getPublishingSummary = query({
  args: {},
  handler: async (ctx): Promise<{
    linkedin: { published: number; failed: number; pending: number };
    twitter: { published: number; failed: number; pending: number };
    instagram: { published: number; failed: number; pending: number };
    total: { published: number; failed: number; pending: number };
  }> => {
    // Authentication
    const userId = await getUserId(ctx);

    // Count LinkedIn
    const linkedinPublished = await ctx.db
      .query("linkedinPublishLog")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const linkedinFailed = await ctx.db
      .query("linkedinPublishLog")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    const linkedinPending = await ctx.db
      .query("linkedinPublishLog")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Count Twitter
    const twitterPublished = await ctx.db
      .query("twitterPublishLog")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const twitterFailed = await ctx.db
      .query("twitterPublishLog")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    const twitterPending = await ctx.db
      .query("twitterPublishLog")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Count Instagram
    const instagramPublished = await ctx.db
      .query("instagramPublishLog")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const instagramFailed = await ctx.db
      .query("instagramPublishLog")
      .filter((q) => q.eq(q.field("status"), "failed"))
      .collect();

    const instagramPending = await ctx.db
      .query("instagramPublishLog")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return {
      linkedin: {
        published: linkedinPublished.length,
        failed: linkedinFailed.length,
        pending: linkedinPending.length,
      },
      twitter: {
        published: twitterPublished.length,
        failed: twitterFailed.length,
        pending: twitterPending.length,
      },
      instagram: {
        published: instagramPublished.length,
        failed: instagramFailed.length,
        pending: instagramPending.length,
      },
      total: {
        published:
          linkedinPublished.length +
          twitterPublished.length +
          instagramPublished.length,
        failed:
          linkedinFailed.length +
          twitterFailed.length +
          instagramFailed.length,
        pending:
          linkedinPending.length +
          twitterPending.length +
          instagramPending.length,
      },
    };
  },
});
