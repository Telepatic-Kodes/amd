import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";

const LINKEDIN_API_VERSION = "202601";

/**
 * Fetch engagement data for a single LinkedIn post
 *
 * Calls LinkedIn API to get likes, comments, shares, impressions
 * Stores snapshot in linkedinEngagement table with engagement_rate
 */
export const fetchPostEngagement = internalAction({
  args: {
    contentId: v.id("content"),
    linkedinPostUrn: v.string(),
    connectionId: v.id("linkedinConnections"),
  },
  handler: async (ctx, args) => {
    // Get connection with token
    const connection = await ctx.runQuery(
      internal.linkedin.internalQueries.getConnectionWithToken,
      { connectionId: args.connectionId }
    );

    if (!connection) {
      console.log(`[Engagement] No connection found for ${args.connectionId}`);
      return { success: false, reason: "no_connection" };
    }

    if (!connection.accessToken || connection.status === "expired") {
      console.log(`[Engagement] Connection expired for ${args.connectionId}`);
      return { success: false, reason: "expired" };
    }

    // Extract post ID from URN (format: urn:li:share:1234567890)
    const postId = args.linkedinPostUrn.split(":").pop();
    if (!postId) {
      console.log(`[Engagement] Invalid URN format: ${args.linkedinPostUrn}`);
      return { success: false, reason: "invalid_urn" };
    }

    try {
      // Try the newer v2 posts endpoint first
      // GET https://api.linkedin.com/rest/posts/{postUrn}
      const response = await fetch(
        `https://api.linkedin.com/rest/posts/${encodeURIComponent(args.linkedinPostUrn)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            "Linkedin-Version": LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!response.ok) {
        // Handle 401 - mark connection expired
        if (response.status === 401) {
          await ctx.runMutation(internal.linkedin.mutations.markExpired, {
            connectionId: args.connectionId,
          });
          console.log(`[Engagement] 401 - marked connection expired`);
          return { success: false, reason: "unauthorized" };
        }

        // Handle 429 - rate limited (stop batch)
        if (response.status === 429) {
          console.log(`[Engagement] 429 - rate limited, stopping batch`);
          return { success: false, reason: "rate_limited" };
        }

        // Handle 404 - post not found (may have been deleted)
        if (response.status === 404) {
          console.log(`[Engagement] 404 - post not found: ${args.linkedinPostUrn}`);
          return { success: false, reason: "not_found" };
        }

        const errorBody = await response.text();
        console.log(`[Engagement] Error ${response.status}: ${errorBody}`);
        return { success: false, reason: "api_error" };
      }

      const postData = await response.json();

      // Extract engagement metrics from response
      // LinkedIn v2 API structure may vary, using safe defaults
      const likes = postData.socialDetail?.totalSocialActivityCounts?.numLikes || 0;
      const comments = postData.socialDetail?.totalSocialActivityCounts?.numComments || 0;
      const shares = postData.socialDetail?.totalSocialActivityCounts?.numShares || 0;

      // Impressions are typically not available in personal accounts
      // Only available with Page Admin access or Analytics API
      const impressions = postData.impressionCount || 0;
      const clicks = postData.clickCount || 0;

      // Calculate engagement rate
      const engagement_rate = impressions > 0
        ? ((likes + comments + shares) / impressions) * 100
        : 0;

      // Store engagement snapshot
      await ctx.runMutation(internal.linkedin.mutations.storeEngagementSnapshot, {
        contentId: args.contentId,
        linkedinPostUrn: args.linkedinPostUrn,
        likes,
        comments,
        shares,
        impressions,
        clicks,
        engagement_rate,
      });

      console.log(
        `[Engagement] Fetched for ${postId}: ${likes}L ${comments}C ${shares}S`
      );

      return { success: true };
    } catch (error: any) {
      console.error(`[Engagement] Exception fetching ${postId}:`, error.message);
      return { success: false, reason: "exception" };
    }
  },
});

/**
 * Fetch engagement for all recent published posts
 *
 * Applies dynamic TTL:
 * - Hot (<48h): refresh if last snapshot > 30min
 * - Warm (2-14d): refresh if last snapshot > 4h
 * - Cold (>14d): refresh if last snapshot > 24h
 *
 * Rate limit: max 10 posts per run (~500 calls/day)
 */
export const fetchAllRecentEngagement = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get active connection
    const connection = await ctx.runQuery(api.linkedin.queries.getConnection);
    if (!connection || connection.status === "expired") {
      console.log("[Engagement] No active connection, skipping fetch");
      return { fetched: 0, skipped: 0, errors: 0 };
    }

    // Get all published posts with URN
    const posts = await ctx.runQuery(
      internal.linkedin.internalQueries.getPublishedPostsWithUrn
    );

    if (posts.length === 0) {
      console.log("[Engagement] No published posts found");
      return { fetched: 0, skipped: 0, errors: 0 };
    }

    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;

    let fetched = 0;
    let skipped = 0;
    let errors = 0;

    // Process up to 10 posts per run to stay under rate limits
    for (const post of posts.slice(0, 10)) {
      // Calculate post age
      const ageMs = now - (post.publishedAt || now);
      const ageDays = ageMs / ONE_DAY;

      // Get last engagement snapshot
      const lastSnapshot = await ctx.runQuery(
        internal.linkedin.internalQueries.getLatestEngagementSnapshot,
        { contentId: post.contentId }
      );

      // Determine TTL based on post age
      let ttl: number;
      let category: string;

      if (ageDays < 2) {
        // Hot: refresh every 30 minutes
        ttl = 30 * 60 * 1000;
        category = "hot";
      } else if (ageDays < 14) {
        // Warm: refresh every 4 hours
        ttl = 4 * ONE_HOUR;
        category = "warm";
      } else {
        // Cold: refresh every 24 hours
        ttl = ONE_DAY;
        category = "cold";
      }

      // Check if refresh needed
      const needsRefresh = !lastSnapshot || (now - lastSnapshot.fetchedAt) > ttl;

      if (!needsRefresh) {
        skipped++;
        continue;
      }

      // Fetch engagement
      const result = await ctx.runAction(
        internal.linkedin.engagement.fetchPostEngagement,
        {
          contentId: post.contentId,
          linkedinPostUrn: post.linkedinPostUrn,
          connectionId: post.connectionId,
        }
      );

      if (result.success) {
        fetched++;
      } else {
        errors++;

        // If rate limited, stop batch immediately
        if (result.reason === "rate_limited") {
          console.log("[Engagement] Rate limited - stopping batch");
          break;
        }
      }
    }

    console.log(
      `[Engagement] Batch complete: ${fetched} fetched, ${skipped} skipped, ${errors} errors`
    );

    return { fetched, skipped, errors };
  },
});
