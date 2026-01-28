/**
 * Feed Queries
 *
 * Internal queries for feed operations.
 *
 * @module convex/feeds/queries
 */

import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

/**
 * Gets a feed by its ID
 *
 * Used internally by fetchFeed action to retrieve feed metadata
 * before syncing.
 *
 * @param feedId - ID of the feed to retrieve
 * @returns Feed document or null if not found
 */
export const getFeed = internalQuery({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.feedId);
  },
});

/**
 * Lists feeds by status
 *
 * @param status - Filter by status (optional)
 * @returns Array of feed documents
 */
export const listFeeds = internalQuery({
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
    if (args.status) {
      return await ctx.db
        .query('feeds')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    }
    return await ctx.db.query('feeds').collect();
  },
});

/**
 * Gets active feeds due for sync based on frequency
 *
 * @param frequency - Sync frequency to filter by
 * @returns Array of feed documents ready for sync
 */
export const getFeedsDueForSync = internalQuery({
  args: {
    frequency: v.union(
      v.literal('hourly'),
      v.literal('daily'),
      v.literal('weekly')
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const frequencyMs: Record<string, number> = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const threshold = now - frequencyMs[args.frequency];

    // Get all active feeds with matching frequency
    const feeds = await ctx.db
      .query('feeds')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    // Filter by frequency and last sync time
    return feeds.filter((feed) => {
      if (feed.syncFrequency !== args.frequency) {
        return false;
      }
      // If never synced or last sync was before threshold
      return !feed.lastSyncAt || feed.lastSyncAt < threshold;
    });
  },
});
