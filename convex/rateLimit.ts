import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Rate limit configuration per endpoint.
 * maxRequests: max calls allowed in the window
 * windowMs: time window in milliseconds
 */
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  callClaude: { maxRequests: 20, windowMs: 60_000 }, // 20 calls/min
  executeAgent: { maxRequests: 10, windowMs: 60_000 }, // 10 executions/min
};

/**
 * Check if a request is within rate limits and record it.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export const checkAndRecord = mutation({
  args: {
    identifier: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, { identifier, endpoint }) => {
    const config = RATE_LIMITS[endpoint];
    if (!config) {
      // No rate limit configured for this endpoint
      return { allowed: true, remaining: -1, retryAfterMs: 0 };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Find existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_endpoint", (q) =>
        q.eq("identifier", identifier).eq("endpoint", endpoint)
      )
      .first();

    if (!existing) {
      // First request — create record
      await ctx.db.insert("rateLimits", {
        identifier,
        endpoint,
        windowStart: now,
        count: 1,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        retryAfterMs: 0,
      };
    }

    // If window has expired, reset
    if (existing.windowStart < windowStart) {
      await ctx.db.patch(existing._id, {
        windowStart: now,
        count: 1,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        retryAfterMs: 0,
      };
    }

    // Within window — check count
    if (existing.count >= config.maxRequests) {
      const retryAfterMs = existing.windowStart + config.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(retryAfterMs, 1000),
      };
    }

    // Increment count
    await ctx.db.patch(existing._id, {
      count: existing.count + 1,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - existing.count - 1,
      retryAfterMs: 0,
    };
  },
});

/**
 * Query current rate limit status without recording.
 */
export const getStatus = query({
  args: {
    identifier: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, { identifier, endpoint }) => {
    const config = RATE_LIMITS[endpoint];
    if (!config) return { remaining: -1, windowMs: 0, count: 0 };

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_endpoint", (q) =>
        q.eq("identifier", identifier).eq("endpoint", endpoint)
      )
      .first();

    if (!existing) {
      return { remaining: config.maxRequests, windowMs: config.windowMs, count: 0 };
    }

    const now = Date.now();
    if (existing.windowStart < now - config.windowMs) {
      return { remaining: config.maxRequests, windowMs: config.windowMs, count: 0 };
    }

    return {
      remaining: Math.max(0, config.maxRequests - existing.count),
      windowMs: config.windowMs,
      count: existing.count,
    };
  },
});
