import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Gets relevant feed items for an agent based on keywords and category.
 * Used by executeAgent to inject feed context into agent prompts.
 *
 * @param keywords - Search terms extracted from task input
 * @param categories - Feed categories relevant to agent's department
 * @param limit - Max items to return (default: 5)
 * @param daysBack - How many days of history to consider (default: 7)
 * @returns Array of feed items with title, link, summary, feedName
 */
export const getRelevantFeedItems = internalQuery({
  args: {
    keywords: v.string(),
    categories: v.array(v.string()),
    limit: v.optional(v.number()),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const daysBack = args.daysBack ?? 7;
    const cutoffDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    // Guard: empty keywords returns empty
    if (!args.keywords.trim()) {
      return [];
    }

    // 1. Get active feeds in target categories
    const feeds = await ctx.db
      .query("feeds")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const relevantFeeds = feeds.filter((f) =>
      args.categories.includes(f.category)
    );

    if (relevantFeeds.length === 0) {
      return [];
    }

    // 2. Search items across all relevant feeds
    const results: Array<{
      _id: any;
      title: string;
      link: string;
      summary: string | null;
      content: string | null;
      publishedAt: number | null;
      feedName: string;
    }> = [];

    for (const feed of relevantFeeds) {
      const items = await ctx.db
        .query("feedItems")
        .withSearchIndex("search_content", (q) =>
          q.search("title", args.keywords).eq("feedId", feed._id)
        )
        .take(limit);

      // Filter by date and map to output format
      for (const item of items) {
        if (item.publishedAt && item.publishedAt < cutoffDate) {
          continue; // Skip old items
        }
        results.push({
          _id: item._id,
          title: item.title,
          link: item.link,
          summary: item.summary ?? null,
          content: item.content?.slice(0, 500) ?? null,
          publishedAt: item.publishedAt ?? null,
          feedName: feed.name,
        });
      }
    }

    // 3. Sort by recency (most recent first) and limit
    return results
      .sort((a, b) => {
        const dateA = a.publishedAt || 0;
        const dateB = b.publishedAt || 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  },
});
