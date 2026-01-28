/**
 * Feeds Module Barrel Export
 *
 * Re-exports the public API for the feeds module.
 *
 * Phase 1 (Core Feed Sync):
 * - fetchFeed: Internal action for syncing a single feed
 * - storeFeedItems: Internal mutation for storing items
 * - updateFeedHealth: Internal mutation for health tracking
 * - logSync: Internal mutation for sync logging
 * - getFeed, listFeeds, getFeedsDueForSync: Internal queries
 *
 * Phase 2 (Multi-Feed Orchestration):
 * - addFeed, updateFeed, deleteFeed, pauseFeed, resumeFeed: Public mutations
 * - listAllFeeds, getFeedDetails, listFeedItems, getLatestSyncLog, listRecentItems: Public queries
 *
 * Phase 3 (Agent Integration):
 * - getRelevantFeedItems: Internal query for agent feed access with search
 *
 * @module convex/feeds
 */

// Core sync functionality (Phase 1)
export { fetchFeed } from './fetchFeed';
export {
  storeFeedItems,
  updateFeedHealth,
  logSync,
} from './storeFeedItems';

// Internal queries (Phase 1)
export {
  getFeed,
  listFeeds,
  getFeedsDueForSync,
} from './queries';

// Public mutations (Phase 2)
export {
  addFeed,
  updateFeed,
  deleteFeed,
  pauseFeed,
  resumeFeed,
} from './mutations';

// Public queries (Phase 2)
export {
  listAllFeeds,
  getFeedDetails,
  listFeedItems,
  getLatestSyncLog,
  listRecentItems,
} from './publicQueries';

// Sync orchestration (Phase 2 - Plan 02)
export { syncAllFeeds } from './syncAllFeeds';
export { scheduleFeedSync, triggerManualSync } from './scheduleFeedSync';

// Agent integration (Phase 3 - Plan 01)
export { getRelevantFeedItems } from './agentQueries';
