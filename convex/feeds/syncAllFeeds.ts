/**
 * Feed Sync Orchestrator
 *
 * Cron-triggered action that orchestrates multi-feed syncing using fan-out pattern.
 * Each feed runs in its own action, preventing timeout issues and cascading failures.
 *
 * @module convex/feeds/syncAllFeeds
 * @see SYNC-01 requirement for scalable sync mechanism
 * @see SYNC-04 requirement for fan-out pattern
 */

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { internal, api } from '../_generated/api';

/**
 * Result type for syncAllFeeds action
 */
interface SyncAllFeedsResult {
  scheduledCount: number;
  feedIds: string[];
}

/**
 * Orchestrates syncing of all feeds due for a given frequency
 *
 * Flow:
 * 1. Query feeds due for sync based on frequency
 * 2. Schedule each feed with staggered delay (fan-out pattern)
 * 3. Return summary of scheduled feeds
 *
 * Stagger Pattern:
 * - Each feed is scheduled 1 second apart
 * - Prevents thundering herd on target servers
 * - Avoids memory spikes from parallel processing
 * - Spreads database writes over time
 *
 * @param frequency - Sync frequency: hourly, daily, or weekly
 * @returns Count and IDs of scheduled feeds
 */
export const syncAllFeeds = action({
  args: {
    frequency: v.union(
      v.literal('hourly'),
      v.literal('daily'),
      v.literal('weekly')
    ),
  },
  handler: async (ctx, args): Promise<SyncAllFeedsResult> => {
    // 1. Get feeds due for sync
    const feeds = await ctx.runQuery(
      internal.feeds.queries.getFeedsDueForSync,
      { frequency: args.frequency }
    );

    if (feeds.length === 0) {
      console.log(
        `[syncAllFeeds] No feeds due for ${args.frequency} sync`
      );
      return {
        scheduledCount: 0,
        feedIds: [],
      };
    }

    // 2. Schedule each feed with staggered delay (fan-out)
    const feedIds: string[] = [];
    for (let i = 0; i < feeds.length; i++) {
      const feed = feeds[i];
      const delayMs = i * 1000; // 1 second stagger

      await ctx.scheduler.runAfter(
        delayMs,
        internal.feeds.fetchFeed.fetchFeed,
        { feedId: feed._id }
      );

      // Store feed URL or name for logging (not the internal _id)
      feedIds.push(feed.url);
    }

    console.log(
      `[syncAllFeeds] Scheduled ${feeds.length} feeds for ${args.frequency} sync`
    );

    return {
      scheduledCount: feeds.length,
      feedIds,
    };
  },
});
