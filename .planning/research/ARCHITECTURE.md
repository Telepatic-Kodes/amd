# Architecture Patterns: RSS Feed Integration

**Domain:** RSS feed aggregation integrated with AI agent system
**Researched:** 2026-01-27
**Confidence:** HIGH (based on existing codebase patterns + verified Convex patterns)

## Executive Summary

This architecture defines how RSS feeds integrate with the existing AMD (AI Marketing Department) Convex backend. The design follows the established patterns in `actions.ts` and `crons.ts`, using Convex actions for external fetch, mutations for storage, and the existing cron job pattern for scheduled syncs.

The architecture is intentionally simple: **Fetch -> Parse -> Dedupe -> Store -> Query**. AI agents access feed content through standard Convex queries, treating feeds as another data source alongside existing content, tasks, and campaigns.

---

## Recommended Architecture

```
                         CRON: Daily Sync
                              |
                              v
+------------------------------------------------------------------+
|                     CONVEX ACTIONS LAYER                          |
|  +------------------+     +------------------+                    |
|  | fetchRssFeeds    |---->| parseAndStore    |                    |
|  | (HTTP fetch)     |     | (XML parsing +   |                    |
|  +------------------+     |  deduplication)  |                    |
|                           +------------------+                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     CONVEX DATABASE                               |
|  +-------------+    +-------------+    +------------------+       |
|  | feeds       |    | feedItems   |    | feedSyncLog      |       |
|  | (sources)   |<-->| (articles)  |    | (audit trail)    |       |
|  +-------------+    +-------------+    +------------------+       |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     AGENT ACCESS LAYER                            |
|  +------------------+    +------------------+                     |
|  | getRecentItems   |    | getItemsByTopic  |                     |
|  | (query)          |    | (query + filter) |                     |
|  +------------------+    +------------------+                     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     AI AGENTS (existing)                          |
|  Content Writer | Social Manager | SEO Strategist | ...           |
+------------------------------------------------------------------+
```

---

## Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|---------------|----------|-------------------|
| **Feed Registry** | Store feed URLs, categories, sync config | `schema.ts` (feeds table) | Sync Engine |
| **Sync Engine** | Orchestrate fetch + parse + store | `actions.ts` (new action) | Feed Fetcher, Parser, Storage |
| **Feed Fetcher** | HTTP fetch of RSS XML | `actions.ts` (internal) | External RSS URLs |
| **XML Parser** | Convert RSS/Atom XML to objects | `actions.ts` (using rss-parser) | Sync Engine |
| **Deduplicator** | Prevent duplicate items | `actions.ts` (hash check) | Storage |
| **Storage Layer** | Persist feed items | `functions.ts` (mutations) | Database |
| **Query Layer** | Provide feed data to agents | `functions.ts` (queries) | AI Agents |
| **Sync Scheduler** | Trigger daily/hourly syncs | `crons.ts` (new cron) | Sync Engine |

---

## Data Flow

### 1. Feed Registration (Manual/One-time)

```
Admin -> mutation:addFeed(url, category) -> feeds table
```

### 2. Feed Sync (Automated via Cron)

```
cron:daily
    |
    v
action:syncAllFeeds
    |
    +---> query:listActiveFeeds (get all feed URLs)
    |
    +---> for each feed:
              |
              +---> fetch(feed.url) -> raw XML
              |
              +---> rss-parser.parseString(xml) -> items[]
              |
              +---> for each item:
                        |
                        +---> generate contentHash (guid OR url+title)
                        |
                        +---> query:feedItemExists(contentHash)
                        |
                        +---> if NOT exists:
                                  mutation:insertFeedItem(item)
    |
    v
mutation:logFeedSync(stats)
```

### 3. Agent Access (On Demand)

```
AI Agent (e.g., content-002 Blog Writer)
    |
    +---> Receives task: "Write blog about AI trends"
    |
    +---> action:executeAgent
              |
              +---> query:getRelevantFeedItems({
                        topics: ["AI", "machine learning"],
                        limit: 10,
                        maxAge: 7 days
                    })
              |
              +---> items[] injected into agent systemPrompt/context
              |
              +---> callClaude with enriched context
```

---

## Database Schema Additions

```typescript
// Add to schema.ts

// ===========================================
// FEEDS - RSS feed sources
// ===========================================
feeds: defineTable({
  feedId: v.string(),           // Unique identifier
  url: v.string(),              // RSS feed URL
  name: v.string(),             // Human-readable name
  category: v.union(
    v.literal("industry"),      // Industry news
    v.literal("competitor"),    // Competitor blogs
    v.literal("technology"),    // Tech updates
    v.literal("marketing"),     // Marketing news
    v.literal("custom")         // User-defined
  ),
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("error")
  ),
  syncFrequency: v.union(
    v.literal("hourly"),
    v.literal("daily"),
    v.literal("weekly")
  ),
  lastSyncAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
  itemCount: v.number(),        // Total items fetched
  metadata: v.optional(v.object({
    title: v.optional(v.string()),      // Feed title from XML
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    lastBuildDate: v.optional(v.string()),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_feedId", ["feedId"])
  .index("by_status", ["status"])
  .index("by_category", ["category"])
  .index("by_syncFrequency", ["syncFrequency"]),

// ===========================================
// FEED_ITEMS - Individual articles/entries
// ===========================================
feedItems: defineTable({
  feedId: v.id("feeds"),        // Parent feed
  contentHash: v.string(),      // SHA-256 of guid OR (url + title)
  guid: v.optional(v.string()), // Original GUID from feed
  title: v.string(),
  link: v.string(),             // Article URL
  description: v.optional(v.string()),  // Summary/excerpt
  content: v.optional(v.string()),      // Full content if available
  author: v.optional(v.string()),
  publishedAt: v.optional(v.number()),  // Parsed pub date
  categories: v.optional(v.array(v.string())),  // Tags from feed

  // AI-enhanced fields (populated by agents later)
  summary: v.optional(v.string()),      // AI-generated summary
  topics: v.optional(v.array(v.string())),  // Extracted topics
  sentiment: v.optional(v.union(
    v.literal("positive"),
    v.literal("neutral"),
    v.literal("negative")
  )),
  relevanceScore: v.optional(v.number()),  // 0-100 relevance to our domain

  // Status tracking
  status: v.union(
    v.literal("new"),           // Just imported
    v.literal("processed"),     // AI has analyzed
    v.literal("used"),          // Referenced in content
    v.literal("archived")       // Old/irrelevant
  ),
  usedInContentIds: v.optional(v.array(v.id("content"))),  // Traceability

  fetchedAt: v.number(),        // When we got it
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_contentHash", ["contentHash"])
  .index("by_feed", ["feedId"])
  .index("by_status", ["status"])
  .index("by_publishedAt", ["publishedAt"])
  .index("by_feed_status", ["feedId", "status"]),

// ===========================================
// FEED_SYNC_LOG - Audit trail for syncs
// ===========================================
feedSyncLog: defineTable({
  feedId: v.optional(v.id("feeds")),  // null for batch syncs
  syncType: v.union(
    v.literal("manual"),
    v.literal("cron:hourly"),
    v.literal("cron:daily"),
    v.literal("cron:weekly")
  ),
  status: v.union(
    v.literal("success"),
    v.literal("partial"),       // Some feeds failed
    v.literal("failure")
  ),
  stats: v.object({
    feedsProcessed: v.number(),
    newItems: v.number(),
    duplicatesSkipped: v.number(),
    errors: v.number(),
  }),
  errors: v.optional(v.array(v.object({
    feedId: v.optional(v.string()),
    message: v.string(),
  }))),
  duration: v.number(),         // ms
  timestamp: v.number(),
})
  .index("by_timestamp", ["timestamp"])
  .index("by_feed", ["feedId"]),
```

---

## Patterns to Follow

### Pattern 1: Scheduler-First Action Pattern

**What:** Don't call actions directly from client. Use mutation to schedule, action to execute.

**Why:** This is the established pattern in AMD's `actions.ts`. It provides:
- Audit trail (task logged before execution)
- Retry capability (task persists if action fails)
- Rate limiting (scheduler manages concurrency)

**Example:**
```typescript
// In functions.ts - Mutation schedules the sync
export const triggerFeedSync = mutation({
  args: { feedId: v.optional(v.id("feeds")) },
  handler: async (ctx, args) => {
    // Log intent
    await ctx.db.insert("feedSyncLog", {
      feedId: args.feedId,
      syncType: "manual",
      status: "success", // Optimistic, updated by action
      stats: { feedsProcessed: 0, newItems: 0, duplicatesSkipped: 0, errors: 0 },
      duration: 0,
      timestamp: Date.now(),
    });

    // Schedule action
    await ctx.scheduler.runAfter(0, api.feedActions.syncFeeds, {
      feedId: args.feedId,
    });
  },
});

// In feedActions.ts - Action does the work
export const syncFeeds = internalAction({
  args: { feedId: v.optional(v.id("feeds")) },
  handler: async (ctx, args) => {
    // ... fetch and parse logic
  },
});
```

### Pattern 2: Content Hash Deduplication

**What:** Generate deterministic hash for each item to prevent duplicates.

**Why:** RSS GUIDs are unreliable - some feeds change them, some don't include them.

**Example:**
```typescript
function generateContentHash(item: RssItem): string {
  // Prefer GUID if stable
  if (item.guid && !item.guid.includes('?')) {
    return sha256(item.guid);
  }
  // Fallback to URL + title
  return sha256(`${item.link}:${item.title}`);
}

// Before insert
const hash = generateContentHash(parsedItem);
const existing = await ctx.runQuery(api.functions.getFeedItemByHash, { hash });
if (existing) {
  stats.duplicatesSkipped++;
  continue;
}
```

### Pattern 3: Batch Insert with Single Mutation

**What:** Collect all new items, insert in one mutation call.

**Why:** Convex best practice - atomic transactions, better performance.

**Example:**
```typescript
// Collect all items first
const newItems: FeedItem[] = [];
for (const item of parsedItems) {
  if (!await isDuplicate(item)) {
    newItems.push(transformItem(item));
  }
}

// Single mutation for all
if (newItems.length > 0) {
  await ctx.runMutation(api.functions.batchInsertFeedItems, {
    items: newItems,
  });
}
```

### Pattern 4: Agent Context Injection

**What:** Query feed items and inject into agent's context at execution time.

**Why:** Agents don't need persistent "knowledge" - they query fresh data per task.

**Example:**
```typescript
// In actions.ts - Enhanced executeAgent
export const executeAgent = action({
  // ... existing args
  handler: async (ctx, args) => {
    const agent = await ctx.runQuery(api.functions.getAgent, { agentId: args.agentId });

    // Fetch relevant feed items for this task
    let feedContext = "";
    if (agent.config.tools?.includes("feeds")) {
      const recentItems = await ctx.runQuery(api.functions.getRelevantFeedItems, {
        topics: extractTopics(args.input),
        limit: 5,
        maxAgeDays: 7,
      });

      if (recentItems.length > 0) {
        feedContext = `\n\n## Recent Industry News\n${formatFeedItems(recentItems)}`;
      }
    }

    // Inject into prompt
    const enrichedPrompt = agent.config.systemPrompt + feedContext;

    // ... rest of execution
  },
});
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Full HTML Content

**What:** Saving raw HTML from feed content fields.

**Why bad:**
- Bloats database (some articles are 100KB+)
- Contains tracking pixels, ads, broken markup
- Not useful for AI processing

**Instead:** Store cleaned text only. Use a sanitizer:
```typescript
import { stripHtml } from 'string-strip-html';

const cleanContent = stripHtml(item.content || item.description || '').result;
const truncated = cleanContent.slice(0, 2000); // Max 2K chars
```

### Anti-Pattern 2: Sync All Feeds in One Action

**What:** Single action that iterates all feeds sequentially.

**Why bad:**
- Actions timeout after 10 minutes
- One feed failure kills entire sync
- No parallelism

**Instead:** Fan-out pattern - one action per feed:
```typescript
// Orchestrator action
export const syncAllFeeds = internalAction({
  handler: async (ctx) => {
    const feeds = await ctx.runQuery(api.functions.listActiveFeeds, {});

    // Schedule individual syncs
    for (const feed of feeds) {
      await ctx.scheduler.runAfter(0, api.feedActions.syncSingleFeed, {
        feedId: feed._id,
      });
    }
  },
});
```

### Anti-Pattern 3: Real-Time Feed Polling

**What:** Checking feeds every minute for updates.

**Why bad:**
- Wastes resources (most feeds update once/day)
- Gets rate-limited by feed servers
- No benefit for AI agents (they don't need instant updates)

**Instead:** Use appropriate sync frequencies:
- Industry news: Daily
- Competitor blogs: Daily
- High-volume feeds: Twice daily max

### Anti-Pattern 4: AI Processing During Sync

**What:** Running AI analysis (summarization, topic extraction) during feed sync.

**Why bad:**
- Sync becomes expensive (Claude API calls)
- Sync takes much longer
- Blocks other syncs

**Instead:** Two-phase approach:
1. **Sync phase:** Fetch and store raw items (fast, cheap)
2. **Process phase:** Separate cron processes new items with AI (can be throttled)

---

## Integration Points with Existing Codebase

### 1. Schema Integration (`schema.ts`)

Add the three new tables (`feeds`, `feedItems`, `feedSyncLog`) to existing schema. These are independent tables - no foreign keys to existing tables except optional `usedInContentIds` linking to `content`.

### 2. Functions Integration (`functions.ts`)

Add new queries and mutations:
```typescript
// Queries
getActiveFeed, listActiveFeeds, getFeedItemByHash,
getRecentFeedItems, getRelevantFeedItems, getFeedStats

// Mutations
addFeed, updateFeedStatus, insertFeedItem, batchInsertFeedItems,
markItemUsed, logFeedSync
```

### 3. Actions Integration (`actions.ts`)

Add new file `feedActions.ts` or extend `actions.ts`:
```typescript
// Actions
syncAllFeeds, syncSingleFeed, processFeedItemsWithAI
```

### 4. Crons Integration (`crons.ts`)

Add to existing crons:
```typescript
// Sync feeds daily at 5:00 AM UTC (before daily agents at 6:00 AM)
crons.daily(
  "sync-rss-feeds",
  { hourUTC: 5, minuteUTC: 0 },
  api.feedActions.syncAllFeeds,
  {}
);
```

### 5. Agent Integration

Modify `executeAgent` in `actions.ts` to:
1. Check if agent has `"feeds"` in `config.tools`
2. If yes, query relevant feed items based on task input
3. Inject feed context into system prompt

### 6. Existing Table References

| Existing Table | Integration |
|----------------|-------------|
| `agents` | Add `"feeds"` to tools array for agents that need feed access |
| `content` | `feedItems.usedInContentIds` tracks which items informed content |
| `auditLog` | Feed syncs logged via existing pattern |
| `tasks` | Feed-related tasks use existing task system |

---

## Scalability Considerations

| Concern | At 10 feeds | At 100 feeds | At 1000 feeds |
|---------|-------------|--------------|---------------|
| **Sync time** | < 1 min | 5-10 min (parallel) | Fan-out, staggered |
| **Storage** | ~1K items | ~10K items | Index optimization |
| **Query speed** | Trivial | Use indexes | Pagination required |
| **Cron load** | Single job | Single orchestrator | Shard by category |

**Recommendation:** Design for 100 feeds, plan for 1000. The fan-out pattern handles scale naturally.

---

## Suggested Build Order

Based on dependencies, build in this order:

### Phase 1: Foundation (No external calls)
1. Add schema tables to `schema.ts`
2. Add basic queries/mutations to `functions.ts`
3. Test with manual feed insertion

### Phase 2: Sync Engine (External fetch)
4. Create `feedActions.ts` with sync logic
5. Add `rss-parser` dependency
6. Implement single-feed sync action
7. Test with one feed URL

### Phase 3: Automation
8. Add cron job to `crons.ts`
9. Implement batch sync orchestrator
10. Add error handling and retry logic

### Phase 4: Agent Integration
11. Modify `executeAgent` to inject feed context
12. Add `"feeds"` tool to relevant agents
13. Create helper queries for agent access

### Phase 5: AI Enhancement (Optional)
14. Add background AI processing for summaries
15. Implement topic extraction
16. Add relevance scoring

---

## Technology Choices

### RSS Parser: `rss-parser`

**Why:** Most popular, excellent TypeScript support, handles malformed feeds gracefully.

**Alternative considered:** `feedsmith` - More comprehensive but heavier. rss-parser is sufficient for this use case.

```bash
npm install rss-parser
npm install -D @types/rss-parser  # If needed
```

### Content Hashing: Native `crypto`

**Why:** Built into Node.js, no external dependency.

```typescript
import { createHash } from 'crypto';
const hash = createHash('sha256').update(content).digest('hex');
```

### Text Sanitization: `string-strip-html`

**Why:** Lightweight, well-maintained, handles edge cases.

```bash
npm install string-strip-html
```

---

## Sources

- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) - HIGH confidence
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - HIGH confidence
- [rss-parser npm](https://www.npmjs.com/package/rss-parser) - HIGH confidence
- [RSS Feed Deduplication Patterns](https://postly.ai/rss-feed/filtering-deduplication) - MEDIUM confidence
- [Feedly Deduplication](https://blog.feedly.com/deduplication-skill-feedlyai/) - MEDIUM confidence
- [RSS Aggregator Architecture Research](https://www.researchgate.net/figure/The-high-level-architecture-of-the-proposed-RSS-aggregator_fig1_365419782) - MEDIUM confidence
- Existing AMD codebase (`actions.ts`, `crons.ts`, `schema.ts`) - HIGH confidence (direct inspection)
