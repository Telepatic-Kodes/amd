/**
 * Feed Sync Action
 *
 * Main entry point for synchronizing a single RSS/Atom feed.
 * Fetches XML, parses with Feedsmith, validates items, and stores via mutation.
 *
 * @module convex/feeds/fetchFeed
 * @see FEED-02 requirement for feed validation
 * @see FEED-06 requirement for multi-format support
 * @see SYNC-03 requirement for graceful error handling
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { parseFeed } from 'feedsmith';
import { generateContentHash } from './utils/hash';
import {
  validateFeedItem,
  normalizeFeedItem,
  type RawFeedItem,
} from './utils/validation';
import {
  handleRateLimit,
  MAX_RETRY_ATTEMPTS,
} from './utils/rateLimit';

/**
 * HTTP fetch timeout in milliseconds
 */
const FETCH_TIMEOUT_MS = 30000;

/**
 * User-Agent header for feed requests
 */
const USER_AGENT = 'AMD-FeedSync/1.0 (+https://github.com/aiaiai-consulting/amd)';

/**
 * Result type for feed sync operation
 */
export interface FetchFeedResult {
  success: boolean;
  feedId: string;
  feedUrl: string;
  itemsFound: number;
  itemsAdded: number;
  itemsSkipped: number;
  validationErrors: number;
  duration: number;
  error?: string;
  retryAttempt?: number;
}

/**
 * Fetches URL with timeout and returns Response object
 *
 * Returns Response instead of text to allow checking status/headers
 * before reading body (needed for rate limit handling).
 *
 * @param url - URL to fetch
 * @param timeoutMs - Timeout in milliseconds
 * @returns Response object
 * @throws Error on timeout or fetch failure
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches and syncs a single RSS/Atom feed
 *
 * Flow:
 * 1. Query feed by ID to get URL and metadata
 * 2. If feed not found or paused, return early
 * 3. Fetch XML via native fetch() with timeout
 * 4. Parse with Feedsmith (supports RSS 2.0, Atom, RSS 1.0)
 * 5. Validate and normalize each item
 * 6. Generate content hashes for deduplication
 * 7. Call storeFeedItems mutation with normalized items
 * 8. Update feed health and log sync result
 * 9. Return sync summary
 *
 * @param feedId - ID of the feed to sync
 * @returns Sync result with counts and status
 */
export const fetchFeed = internalAction({
  args: {
    feedId: v.id('feeds'),
    retryAttempt: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<FetchFeedResult> => {
    const startTime = Date.now();
    const { feedId } = args;

    // 1. Query feed to get URL and check status
    const feed = await ctx.runQuery(internal.feeds.queries.getFeed, { feedId });

    if (!feed) {
      return {
        success: false,
        feedId: feedId as string,
        feedUrl: '',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: 'Feed not found',
      };
    }

    if (feed.status === 'paused') {
      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: 'Feed is paused',
      };
    }

    let xml: string;
    let parsedFeed: Awaited<ReturnType<typeof parseFeed>>;
    let validationErrors = 0;
    const currentAttempt = args.retryAttempt ?? 0;

    // 2. Fetch with timeout
    let response: Response;
    try {
      response = await fetchWithTimeout(feed.url, FETCH_TIMEOUT_MS);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown fetch error';

      // Update feed health with error
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: false,
        errorMessage,
      });

      // Log failed sync
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'failed',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
        errorMessage,
      });

      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: `Fetch failed: ${errorMessage}`,
      };
    }

    // 2.5. Check for rate limiting (SYNC-05)
    const rateLimitResult = handleRateLimit(
      response.status,
      response.headers.get('Retry-After'),
      currentAttempt
    );

    if (rateLimitResult.isRateLimited) {
      // Check if we should retry
      if (rateLimitResult.retryAttempt < MAX_RETRY_ATTEMPTS) {
        // Schedule retry with backoff delay
        await ctx.scheduler.runAfter(
          rateLimitResult.retryAfterMs!,
          internal.feeds.fetchFeed.fetchFeed,
          {
            feedId,
            retryAttempt: rateLimitResult.retryAttempt,
          }
        );

        console.log(
          `[fetchFeed] Rate limited, scheduling retry ${rateLimitResult.retryAttempt} ` +
            `in ${rateLimitResult.retryAfterMs}ms for feed ${feed.url}`
        );

        return {
          success: false,
          feedId: feedId as string,
          feedUrl: feed.url,
          itemsFound: 0,
          itemsAdded: 0,
          itemsSkipped: 0,
          validationErrors: 0,
          duration: Date.now() - startTime,
          error: `Rate limited, retry ${rateLimitResult.retryAttempt} scheduled`,
          retryAttempt: rateLimitResult.retryAttempt,
        };
      }

      // Max retries exceeded
      const errorMessage = `Rate limited after ${MAX_RETRY_ATTEMPTS} attempts`;

      // Update feed health with error
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: false,
        errorMessage,
      });

      // Log failed sync
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'failed',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
        errorMessage,
      });

      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
        retryAttempt: currentAttempt,
      };
    }

    // 2.6. Not rate limited - check for other HTTP errors
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      // Update feed health with error
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: false,
        errorMessage,
      });

      // Log failed sync
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'failed',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
        errorMessage,
      });

      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: `Fetch failed: ${errorMessage}`,
      };
    }

    // 2.7. Read response body
    try {
      xml = await response.text();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to read response body';

      // Update feed health with error
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: false,
        errorMessage,
      });

      // Log failed sync
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'failed',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
        errorMessage,
      });

      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: `Fetch failed: ${errorMessage}`,
      };
    }

    // 3. Parse XML with Feedsmith
    try {
      parsedFeed = await parseFeed(xml);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown parse error';

      // Update feed health with error
      await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
        feedId,
        success: false,
        errorMessage,
      });

      // Log failed sync
      await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
        feedId,
        status: 'failed',
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        duration: Date.now() - startTime,
        errorMessage,
      });

      return {
        success: false,
        feedId: feedId as string,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        validationErrors: 0,
        duration: Date.now() - startTime,
        error: `Parse failed: ${errorMessage}`,
      };
    }

    // 4. Validate and normalize items
    // Feedsmith returns { format, feed } where feed.items contains the entries
    const feedData = parsedFeed.feed as { items?: unknown[] };
    const items = (feedData.items || []) as RawFeedItem[];
    const normalizedItems: Array<{
      title: string;
      link: string;
      guid: string | null;
      content: string | null;
      summary: string | null;
      author: string | null;
      publishedAt: number | null;
      categories: string[];
      contentHash: string;
    }> = [];

    for (const item of items) {
      const validation = validateFeedItem(item);

      if (!validation.valid) {
        validationErrors++;
        continue;
      }

      const normalized = normalizeFeedItem(item, feed.url);

      // Generate composite key hash for deduplication
      const contentHash = await generateContentHash({
        feedUrl: feed.url,
        guid: normalized.guid ?? undefined,
        link: normalized.link,
        pubDate: normalized.publishedAt?.toString(),
        title: normalized.title,
      });

      normalizedItems.push({
        ...normalized,
        contentHash,
      });
    }

    // 5. Store items via mutation
    const storeResult = await ctx.runMutation(
      internal.feeds.storeFeedItems.storeFeedItems,
      {
        feedId,
        items: normalizedItems,
      }
    );

    // 6. Update feed health (success)
    await ctx.runMutation(internal.feeds.storeFeedItems.updateFeedHealth, {
      feedId,
      success: true,
    });

    // 7. Log successful sync
    const syncStatus = validationErrors > 0 ? 'partial' : 'success';
    await ctx.runMutation(internal.feeds.storeFeedItems.logSync, {
      feedId,
      status: syncStatus,
      itemsFound: items.length,
      itemsAdded: storeResult.itemsAdded,
      itemsSkipped: storeResult.itemsSkipped,
      duration: Date.now() - startTime,
    });

    return {
      success: true,
      feedId: feedId as string,
      feedUrl: feed.url,
      itemsFound: items.length,
      itemsAdded: storeResult.itemsAdded,
      itemsSkipped: storeResult.itemsSkipped,
      validationErrors,
      duration: Date.now() - startTime,
    };
  },
});
