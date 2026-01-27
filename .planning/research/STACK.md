# Technology Stack: RSS Feed Integration

**Project:** AMD (AI Marketing Department) - RSS Feed Integration Milestone
**Researched:** 2026-01-27
**Focus:** RSS parsing and aggregation in Convex serverless environment

---

## Executive Recommendation

**Use Feedsmith + native fetch** for RSS feed integration in Convex.

| Component | Recommendation | Version | Confidence |
|-----------|---------------|---------|------------|
| RSS Parser | Feedsmith | ^2.8.0 | HIGH |
| HTTP Fetching | Native `fetch()` | Built-in | HIGH |
| Cron Scheduling | Convex built-in crons | N/A | HIGH |
| XML Fallback | fast-xml-parser (via Feedsmith) | ^5.3.0 | HIGH |

---

## Recommended Stack

### Core: RSS Parsing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **feedsmith** | ^2.8.0 | Parse RSS/Atom/RDF/JSON feeds | Modern (2025), TypeScript-native, tree-shakable, uses fast-xml-parser internally, no XMLHttpRequest dependency |

**Why Feedsmith over alternatives:**

1. **Serverless-safe**: Uses `fast-xml-parser` internally (pure JS, no native bindings, no XMLHttpRequest)
2. **Modern & maintained**: v2.8.0 released 7 days ago (as of research date), active development
3. **TypeScript-first**: Complete type definitions for all feed formats - perfect for Convex's TypeScript environment
4. **Universal format support**: RSS 2.0, RSS 1.0 (RDF), Atom, JSON Feed - handles whatever feeds you encounter
5. **Namespace handling**: Properly handles iTunes, Dublin Core, Media RSS namespaces (common in marketing/content feeds)
6. **Tree-shakable**: Import only what you need, reducing bundle size for serverless cold starts

**Usage in Convex action:**

```typescript
import { internalAction } from "./_generated/server";
import { parseFeed, parseRssFeed } from "feedsmith";

export const fetchAndParseFeed = internalAction({
  args: { feedUrl: v.string() },
  handler: async (ctx, { feedUrl }) => {
    // Native fetch works in Convex actions
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "AMD-RSS-Bot/1.0",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }

    const content = await response.text();

    // Universal parser detects format automatically
    const { format, feed } = parseFeed(content);

    // Process items and call mutation to store
    await ctx.runMutation(internal.feeds.storeFeedItems, {
      feedUrl,
      format,
      items: feed.items || []
    });
  }
});
```

### HTTP Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Native fetch** | Built-in | Retrieve RSS feed content | Convex actions support native fetch; no external HTTP library needed |

**Why native fetch:**
- Convex's JavaScript runtime supports `fetch` natively
- No need for `axios`, `node-fetch`, or other HTTP libraries
- Simpler dependency tree = fewer serverless issues
- Full control over headers, timeouts, error handling

**Fetch configuration for RSS:**

```typescript
const fetchFeed = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AMD-RSS-Bot/1.0 (+https://yoursite.com/bot)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Encoding": "gzip, deflate",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};
```

### Scheduling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Convex crons** | Built-in | Daily feed sync | Native Convex feature, no external scheduler needed, survives restarts |

**Why Convex built-in crons:**
- Already part of your stack - zero additional dependencies
- Survives deployments and restarts
- Visible in Convex dashboard for monitoring
- Can trigger actions (for fetch) or mutations (for processing)

**Cron configuration example:**

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sync all feeds daily at 6 AM UTC
crons.daily(
  "sync-all-rss-feeds",
  { hourUTC: 6, minuteUTC: 0 },
  internal.feeds.syncAllFeeds
);

// Or use interval for more frequent syncs (e.g., every 4 hours)
crons.interval(
  "sync-feeds-interval",
  { hours: 4 },
  internal.feeds.syncAllFeeds
);

export default crons;
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| RSS Parser | Feedsmith | rss-parser | rss-parser uses XMLHttpRequest internally, causing issues in serverless/edge environments; last meaningful update 3+ years ago |
| RSS Parser | Feedsmith | feedparser (node-feedparser) | Streaming-based, steeper learning curve, overkill for daily batch sync; better for real-time high-volume scenarios |
| RSS Parser | Feedsmith | @rowanmanning/feed-parser | Good alternative but less feature-rich; Feedsmith has broader format support and better namespace handling |
| RSS Parser | Feedsmith | fast-xml-parser (direct) | Requires manual RSS structure handling; Feedsmith already uses it internally with proper RSS abstractions |
| HTTP Client | Native fetch | axios | Unnecessary dependency; native fetch works in Convex actions |
| HTTP Client | Native fetch | node-fetch | Convex runtime already has fetch; adding this creates version conflicts |
| Scheduling | Convex crons | External cron (Vercel, etc.) | Adds external dependency; Convex crons are built-in and integrated |

### Detailed Alternative Analysis

#### rss-parser (NOT RECOMMENDED)

```
Status: NOT RECOMMENDED for Convex
Version: 3.13.0 (last updated 3+ years ago)
Weekly downloads: ~400k (legacy popularity)
```

**Problems:**
1. Uses `xml2js` which uses `XMLHttpRequest` for some operations
2. Known issues in Cloudflare Workers and edge runtimes
3. Stale maintenance - RSS hasn't changed, but the JS ecosystem has
4. No tree-shaking support

**Evidence:** Raymond Camden's 2023 article documents XMLHttpRequest errors when using rss-parser in Cloudflare Workers. Convex uses a similar serverless runtime model.

#### feedparser / node-feedparser (OVERKILL)

```
Status: Consider only for high-volume real-time scenarios
Version: Actively maintained
```

**When to use instead:**
- Processing 1000s of feeds simultaneously
- Need streaming to handle very large feeds
- Building a dedicated RSS service, not integrating into existing app

**Why not for AMD:**
- Streaming adds complexity for simple daily sync
- Steeper learning curve
- Your use case (daily sync of curated feeds) doesn't need streaming

#### fast-xml-parser (INDIRECT USE)

```
Status: Used internally by Feedsmith - don't use directly
Version: 5.3.3
```

**Why not direct use:**
- Requires manual RSS/Atom structure handling
- You'd be reimplementing what Feedsmith already does
- Feedsmith provides proper TypeScript types for feed structures

---

## Installation

```bash
# Production dependency
npm install feedsmith

# That's it - no other RSS-related dependencies needed
```

**package.json addition:**

```json
{
  "dependencies": {
    "feedsmith": "^2.8.0"
  }
}
```

---

## Convex-Specific Implementation Pattern

### Architecture Overview

```
[Cron Trigger]
    |
    v
[Mutation: Get feed URLs from DB]
    |
    v
[Schedule Action for each feed]
    |
    v
[Action: fetch() + Feedsmith parse]
    |
    v
[Mutation: Store items in Convex DB]
    |
    v
[Agents query feed items as needed]
```

### Key Patterns for Convex

**1. Actions for external fetch, Mutations for DB writes:**

```typescript
// convex/feeds.ts
import { internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { parseFeed } from "feedsmith";

// Action: Fetch and parse (can fail, not retried automatically)
export const fetchFeed = internalAction({
  args: { feedId: v.id("feeds"), feedUrl: v.string() },
  handler: async (ctx, { feedId, feedUrl }) => {
    const response = await fetch(feedUrl);
    const content = await response.text();
    const { feed } = parseFeed(content);

    // Hand off to mutation for reliable storage
    await ctx.runMutation(internal.feeds.storeFeedItems, {
      feedId,
      items: (feed.items || []).map(item => ({
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || null,
        description: item.description || "",
        content: item.content || item.description || "",
      }))
    });
  }
});

// Mutation: Reliable storage (retried until success)
export const storeFeedItems = internalMutation({
  args: {
    feedId: v.id("feeds"),
    items: v.array(v.object({
      title: v.string(),
      link: v.string(),
      pubDate: v.union(v.string(), v.null()),
      description: v.string(),
      content: v.string(),
    }))
  },
  handler: async (ctx, { feedId, items }) => {
    for (const item of items) {
      // Upsert pattern: check if item exists by link
      const existing = await ctx.db
        .query("feedItems")
        .withIndex("by_link", q => q.eq("link", item.link))
        .first();

      if (!existing) {
        await ctx.db.insert("feedItems", {
          feedId,
          ...item,
          fetchedAt: Date.now(),
        });
      }
    }

    // Update feed's last sync time
    await ctx.db.patch(feedId, { lastSyncedAt: Date.now() });
  }
});
```

**2. Orchestrator pattern for multiple feeds:**

```typescript
// convex/feeds.ts
export const syncAllFeeds = internalMutation({
  handler: async (ctx) => {
    const feeds = await ctx.db.query("feeds").collect();

    for (const feed of feeds) {
      // Schedule each feed fetch as separate action
      // This prevents one failing feed from blocking others
      await ctx.scheduler.runAfter(0, internal.feeds.fetchFeed, {
        feedId: feed._id,
        feedUrl: feed.url,
      });
    }
  }
});
```

---

## Convex Constraints to Remember

| Constraint | Limit | Mitigation |
|------------|-------|------------|
| Action timeout | 10 minutes | Process feeds individually, not in batch |
| Memory limit (Convex runtime) | 64MB | Parse feeds one at a time, don't load all in memory |
| Memory limit (Node.js runtime) | 512MB | Sufficient for typical RSS feeds |
| No direct DB access in actions | N/A | Use `ctx.runMutation()` to write data |
| Actions not automatically retried | N/A | Implement retry logic or use mutation-first pattern |

---

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| `rss-parser` | XMLHttpRequest issues in serverless; stale maintenance |
| `axios` | Unnecessary; native fetch works |
| `xml2js` directly | Feedsmith handles this better |
| External cron services | Adds complexity; Convex crons are built-in |
| `feedparser` streaming | Overkill for daily batch sync |
| Browser-specific XML parsers | Won't work in Convex's server environment |

---

## TypeScript Types Reference

Feedsmith provides complete types. Here's what's available for RSS:

```typescript
import type { Rss } from "feedsmith/types";

// Feed-level types
type Feed = Rss.Feed;
type Item = Rss.Item;
type Channel = Rss.Channel;

// Common namespace types (for marketing feeds)
type ItunesItem = Rss.Itunes.Item;  // Podcast metadata
type MediaContent = Rss.Media.Content;  // Media attachments
type DublinCore = Rss.Dc;  // dc:creator, dc:date, etc.

// Your Convex schema might look like:
// feedItems: defineTable({
//   feedId: v.id("feeds"),
//   title: v.string(),
//   link: v.string(),
//   pubDate: v.optional(v.string()),
//   description: v.string(),
//   content: v.string(),
//   author: v.optional(v.string()),  // from dc:creator
//   categories: v.optional(v.array(v.string())),
//   fetchedAt: v.number(),
// }).index("by_link", ["link"])
//   .index("by_feed", ["feedId"])
//   .index("by_date", ["pubDate"])
```

---

## Sources

### HIGH Confidence (Official/Authoritative)
- [Feedsmith npm package](https://www.npmjs.com/package/feedsmith) - Version 2.8.0, last updated 7 days ago
- [Feedsmith Quick Start](https://feedsmith.dev/quick-start) - Official documentation
- [Feedsmith GitHub](https://github.com/macieklamberski/feedsmith) - 365 stars, active development
- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) - Official Convex docs on actions
- [Convex Cron Jobs Documentation](https://docs.convex.dev/scheduling/cron-jobs) - Official Convex docs on scheduling
- [Convex Tutorial: Calling External Services](https://docs.convex.dev/tutorial/actions) - Official example of fetch in actions

### MEDIUM Confidence (Verified with multiple sources)
- [fast-xml-parser npm](https://www.npmjs.com/package/fast-xml-parser) - Version 5.3.3, Feedsmith dependency
- [rss-parser npm](https://www.npmjs.com/package/rss-parser) - Version 3.13.0, documented issues
- [npm-compare: RSS parsers](https://npm-compare.com/feed,feedparser,rss,rss-parser) - Comparison data

### LOW Confidence (Single source, needs validation)
- [Raymond Camden: Building RSS Parser with Cloudflare Workers](https://www.raymondcamden.com/2023/10/31/building-a-generic-rss-parser-service-with-cloudflare-workers) - Documents rss-parser XMLHttpRequest issues (2023, may be dated)

---

## Summary

For RSS feed integration into AMD's existing Next.js 16 + Convex stack:

1. **Install Feedsmith** (`npm install feedsmith`) - one dependency, everything you need
2. **Use native fetch** in Convex actions - no HTTP library needed
3. **Use Convex built-in crons** for daily scheduling - no external services
4. **Follow action-mutation pattern** - actions fetch, mutations store

This stack is:
- **Minimal**: One new dependency (feedsmith)
- **Serverless-safe**: No XMLHttpRequest, no native bindings
- **TypeScript-native**: Full type safety with Convex
- **Maintainable**: Modern library, active development
- **Integrated**: Uses Convex's built-in features for scheduling and storage
