/**
 * Enrichment Queries
 *
 * Internal queries for AI enrichment processing.
 * Used by enrichment actions to get unprocessed items and fetch item details.
 *
 * @module convex/enrichment/queries
 */

import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

/**
 * Gets unprocessed feed items for enrichment
 *
 * Returns items where `processed` is undefined (never processed).
 * Items with `processed: false` are failed items and are skipped.
 * Orders by publishedAt descending to prioritize newest content.
 *
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of unprocessed feedItem documents
 */
export const getUnprocessedItems = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Query items where processed is undefined (unprocessed)
    // Items with processed: false are failed and should not be retried
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_processed', (q) => q.eq('processed', undefined))
      .order('desc')
      .take(limit);

    // Return only fields needed for enrichment
    return items.map((item) => ({
      _id: item._id,
      feedId: item.feedId,
      title: item.title,
      link: item.link,
      content: item.content,
      summary: item.summary,
      publishedAt: item.publishedAt,
    }));
  },
});

/**
 * Gets a single feed item by ID
 *
 * Used to fetch full item details before enrichment processing.
 *
 * @param itemId - ID of the feedItem to retrieve
 * @returns FeedItem document or null if not found
 */
export const getItem = internalQuery({
  args: {
    itemId: v.id('feedItems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});
