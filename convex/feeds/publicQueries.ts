/**
 * Public Feed Queries
 *
 * Public queries for dashboard consumption.
 * Provides read access to feeds, items, and sync logs for UI rendering.
 *
 * @module convex/feeds/publicQueries
 * @see DASH-01 requirement for feed listing
 * @see DASH-02 requirement for feed details
 * @see DASH-03 requirement for item display
 */

import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Lists all feeds with optional status filter
 *
 * Returns feeds with computed itemCount for dashboard display.
 * Sorted by name ascending for consistent ordering.
 *
 * @param status - Optional filter: "active", "paused", or "error"
 * @returns Array of feeds with itemCount
 */
export const listAllFeeds = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('paused'),
        v.literal('error')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get feeds, optionally filtered by status
    let feeds;
    if (args.status) {
      feeds = await ctx.db
        .query('feeds')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else {
      feeds = await ctx.db.query('feeds').collect();
    }

    // Compute itemCount for each feed
    const feedsWithCount = await Promise.all(
      feeds.map(async (feed) => {
        const items = await ctx.db
          .query('feedItems')
          .withIndex('by_feedId', (q) => q.eq('feedId', feed._id))
          .collect();

        return {
          ...feed,
          itemCount: items.length,
        };
      })
    );

    // Sort by name ascending
    return feedsWithCount.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Gets detailed information about a single feed
 *
 * Includes itemCount and most recent sync log entry.
 *
 * @param feedId - ID of the feed to retrieve
 * @returns Feed with itemCount and lastSync info
 */
export const getFeedDetails = query({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    const feed = await ctx.db.get(args.feedId);

    if (!feed) {
      return null;
    }

    // Count items for this feed
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_feedId', (q) => q.eq('feedId', args.feedId))
      .collect();

    // Get most recent sync log
    const lastSync = await ctx.db
      .query('feedSyncLog')
      .withIndex('by_feedId_syncedAt', (q) => q.eq('feedId', args.feedId))
      .order('desc')
      .first();

    return {
      ...feed,
      itemCount: items.length,
      lastSync,
    };
  },
});

/**
 * Lists feed items with pagination
 *
 * Returns items sorted by publishedAt descending (newest first).
 *
 * @param feedId - ID of the feed
 * @param limit - Maximum items to return (default: 20)
 * @returns Array of feed items
 */
export const listFeedItems = query({
  args: {
    feedId: v.id('feeds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Query items ordered by publishedAt descending
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_feedId_publishedAt', (q) => q.eq('feedId', args.feedId))
      .order('desc')
      .take(limit);

    return items;
  },
});

/**
 * Gets recent sync log entries for a feed
 *
 * Useful for debugging and monitoring sync history.
 *
 * @param feedId - ID of the feed
 * @param limit - Maximum entries to return (default: 5)
 * @returns Array of sync log entries
 */
export const getLatestSyncLog = query({
  args: {
    feedId: v.id('feeds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    const logs = await ctx.db
      .query('feedSyncLog')
      .withIndex('by_feedId_syncedAt', (q) => q.eq('feedId', args.feedId))
      .order('desc')
      .take(limit);

    return logs;
  },
});

/**
 * Lists recent items across all feeds
 *
 * Joins with feeds table to include feed name.
 * Useful for "latest news" dashboard widgets.
 *
 * @param limit - Maximum items to return (default: 10)
 * @returns Array of items with feedName
 */
export const listRecentItems = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Query items by publishedAt index, descending
    const items = await ctx.db
      .query('feedItems')
      .withIndex('by_publishedAt')
      .order('desc')
      .take(limit);

    // Join with feeds to get feed name
    const itemsWithFeedName = await Promise.all(
      items.map(async (item) => {
        const feed = await ctx.db.get(item.feedId);
        return {
          ...item,
          feedName: feed?.name ?? 'Unknown Feed',
        };
      })
    );

    return itemsWithFeedName;
  },
});
