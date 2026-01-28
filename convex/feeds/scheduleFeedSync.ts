/**
 * Feed Sync Scheduler
 *
 * Provides mutations for scheduling feed sync actions using Convex scheduler.
 * Implements fan-out pattern for scalable multi-feed syncing.
 *
 * @module convex/feeds/scheduleFeedSync
 * @see SYNC-01 requirement for scalable sync mechanism
 * @see SYNC-04 requirement for fan-out pattern
 * @see DASH-04 requirement for manual sync trigger
 */

import { v } from 'convex/values';
import { mutation, internalMutation } from '../_generated/server';
import { api, internal } from '../_generated/api';

/**
 * Schedules a single feed for sync with optional delay
 *
 * Internal mutation used by the orchestrator to fan-out sync operations.
 * Each feed runs in its own action, preventing cascading failures.
 *
 * @param feedId - ID of the feed to sync
 * @param delayMs - Delay in milliseconds before running (default: 0)
 * @returns Scheduled job info
 */
export const scheduleFeedSync = internalMutation({
  args: {
    feedId: v.id('feeds'),
    delayMs: v.optional(v.number()),
  },
  returns: v.object({
    feedId: v.id('feeds'),
    delayMs: v.number(),
  }),
  handler: async (ctx, args) => {
    const delayMs = args.delayMs ?? 0;

    // Schedule the fetchFeed action to run after delay
    await ctx.scheduler.runAfter(
      delayMs,
      api.feeds.fetchFeed.fetchFeed,
      { feedId: args.feedId }
    );

    console.log(
      `[scheduleFeedSync] Scheduled feed ${args.feedId} with ${delayMs}ms delay`
    );

    return {
      feedId: args.feedId,
      delayMs,
    };
  },
});

/**
 * Triggers an immediate manual sync for a single feed
 *
 * Public mutation for dashboard use (DASH-04).
 * Validates feed exists and is not paused before scheduling.
 *
 * @param feedId - ID of the feed to sync
 * @returns Success status and message
 */
export const triggerManualSync = mutation({
  args: {
    feedId: v.id('feeds'),
  },
  handler: async (ctx, args) => {
    // Verify feed exists
    const feed = await ctx.db.get(args.feedId);

    if (!feed) {
      return {
        success: false,
        error: 'Feed not found',
      };
    }

    // Check if feed is paused
    if (feed.status === 'paused') {
      return {
        success: false,
        error: 'Feed is paused',
      };
    }

    // Schedule immediate sync (0ms delay)
    await ctx.scheduler.runAfter(
      0,
      api.feeds.fetchFeed.fetchFeed,
      { feedId: args.feedId }
    );

    console.log(`[triggerManualSync] Manual sync triggered for feed ${args.feedId}`);

    return {
      success: true,
      message: 'Sync scheduled',
    };
  },
});
