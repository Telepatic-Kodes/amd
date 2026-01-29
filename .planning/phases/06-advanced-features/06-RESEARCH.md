# Phase 6: Advanced Features - Research

**Researched:** 2026-01-29
**Domain:** Full-text extraction, HTTP optimization, OPML import/export, semantic deduplication
**Confidence:** MEDIUM-HIGH

## Summary

Phase 6 adds polish features to enhance the RSS feed system based on operational feedback from Phases 1-5. These are "nice-to-have" optimizations that improve efficiency, reduce bandwidth, enable bulk feed management, and detect semantic duplicates.

The project currently has:
- **Phases 1-2:** Core feed sync with multi-feed orchestration (100+ feeds)
- **Phase 3:** Agent integration with feed context injection
- **Phase 4:** AI enrichment (topics, sentiment, summaries, relevance scores)
- **Phase 5:** Brand monitoring with daily digest alerts

Phase 6 builds on this foundation with four feature categories:

1. **Full-Text Extraction** - Scrape complete article content when RSS feeds provide only truncated summaries
2. **HTTP Optimization** - Use ETag/Last-Modified headers to skip unchanged feeds, saving bandwidth
3. **OPML Import/Export** - Enable bulk feed management for onboarding and backup
4. **Semantic Deduplication** - Detect near-duplicate articles across feeds using embeddings

**Primary recommendation:** Prioritize HTTP optimization (highest ROI, lowest complexity) and OPML import/export (enables bulk onboarding) for Phase 6.1. Defer full-text extraction and semantic deduplication to Phase 6.2 based on user demand (both are complex with legal/cost considerations).

## Standard Stack

### Core Technologies

| Component | Version/Library | Purpose | Why Standard |
|-----------|----------------|---------|--------------|
| HTTP Conditional GET | Native fetch | ETag/Last-Modified support | Built into HTTP spec, zero dependencies |
| OPML Parser | opml@0.4.x | Parse OPML imports | Maintained by Dave Winer (OPML creator) |
| OPML Generator | opml@0.4.x | Generate OPML exports | Same library handles both directions |
| Readability.js | @mozilla/readability@0.5.x | Article extraction | Industry standard, used by Firefox Reader |
| Cheerio | cheerio@1.0.x | HTML parsing for scraping | Fast, jQuery-like API for server-side |

### Optional/Future

| Component | Version/Library | Purpose | When to Use |
|-----------|----------------|---------|-------------|
| OpenAI Embeddings | text-embedding-3-small | Vector embeddings for dedup | Phase 6.2+ if semantic dedup needed |
| Voyage AI Embeddings | voyage-3 | Alternative embeddings | Better accuracy, higher cost than OpenAI |
| Local Embeddings | BGE-M3, E5-Mistral | Self-hosted embeddings | High volume (1M+ items), privacy concerns |
| FiveFilters Readability | PHP service | Full-text extraction API | Alternative to self-hosted Readability.js |
| robots-txt-parser | robots-parser@3.x | Respect robots.txt | Legal compliance for web scraping |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ETag/Last-Modified | Always fetch feeds | Conditional GET saves 60-80% bandwidth, trivial to implement |
| OPML library | Hand-roll XML parsing | OPML spec is simple but has edge cases, library is battle-tested |
| Readability.js | Custom scraping logic | Readability handles diverse HTML structures, custom logic fragile |
| OpenAI embeddings | Cohere/Mistral embeddings | Similar pricing, OpenAI more widely supported |
| Embeddings | MinHash LSH (fuzzy hashing) | LSH cheaper but less accurate, embeddings 95%+ precision |

**Installation:**
```bash
# HTTP optimization - no dependencies (native fetch)

# OPML import/export
npm install opml@^0.4.14

# Full-text extraction
npm install @mozilla/readability@^0.5.0 cheerio@^1.0.0 jsdom@^25.0.0

# Web scraping compliance
npm install robots-parser@^3.0.1

# Semantic deduplication (Phase 6.2+)
npm install openai@^4.70.0  # For text-embedding-3-small
```

## Full-Text Extraction

### Problem Statement

Many RSS feeds truncate content to drive traffic to the original site, providing only 100-300 word summaries instead of full articles. This reduces the value of feed content for AI agents and brand monitoring.

**Detection heuristics:**
- Description field ends mid-sentence or with "..." / "[Read more]"
- Word count < 200 words (typical article is 500-1500 words)
- Content contains truncation signals: "Continue reading →", "Read the full article"
- Feed items consistently have similar short lengths (suggests publisher policy)

### Technical Approach

**Flow:**
1. During feed sync, detect truncated content using heuristics
2. Mark item with `isTruncated: true` flag
3. Background job scrapes full content from `link` URL
4. Extract article text using Readability.js
5. Store full content in `fullContent` field
6. Update `isTruncated: false`, mark `fullContentFetched: true`

**Architecture:**
```typescript
// In convex/schema.ts - extend feedItems
feedItems: defineTable({
  // ... existing fields ...

  // Phase 6: Full-text extraction
  isTruncated: v.optional(v.boolean()),          // Detected as truncated
  fullContent: v.optional(v.string()),           // Scraped full article
  fullContentFetchedAt: v.optional(v.number()),  // When scraped
  fullContentError: v.optional(v.string()),      // Scraping error if failed
})
  .index("by_truncated", ["isTruncated"]) // Query items needing full-text fetch

// In convex/feeds/fullTextExtraction.ts
export const extractFullContent = internalAction({
  args: { itemId: v.id("feedItems") },
  handler: async (ctx, args) => {
    const item = await ctx.runQuery(internal.feeds.queries.getFeedItem, {
      itemId: args.itemId
    });

    // 1. Check robots.txt compliance
    const robotsParser = await getRobotsParser(item.link);
    if (!robotsParser.isAllowed(item.link, USER_AGENT)) {
      throw new Error("Blocked by robots.txt");
    }

    // 2. Fetch HTML with rate limiting
    await rateLimitDelay(item.link); // Enforce per-domain rate limit
    const html = await fetch(item.link, {
      headers: { "User-Agent": USER_AGENT }
    }).then(r => r.text());

    // 3. Extract article content with Readability
    const { JSDOM } = await import("jsdom");
    const { Readability } = await import("@mozilla/readability");

    const dom = new JSDOM(html, { url: item.link });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      throw new Error("Failed to extract article content");
    }

    // 4. Store full content
    await ctx.runMutation(internal.feeds.mutations.updateFeedItem, {
      itemId: args.itemId,
      fullContent: article.textContent,
      fullContentFetchedAt: Date.now(),
      isTruncated: false,
    });

    return {
      success: true,
      contentLength: article.textContent.length
    };
  }
});
```

### Legal & Ethical Considerations

**CRITICAL:** Web scraping for full-text extraction has legal and ethical implications that MUST be addressed before implementation.

**Legal compliance checklist:**
- ✅ **Respect robots.txt:** Check `User-agent: *` Disallow rules before scraping
- ✅ **Public content only:** Only scrape publicly accessible pages (no paywalls, logins)
- ✅ **Rate limiting:** Max 1 request per second per domain to avoid server burden
- ✅ **Copyright:** Full content stored for internal use only (not redistributed publicly)
- ✅ **Terms of Service:** Review site ToS - some explicitly prohibit scraping
- ⚠️ **DMCA/Safe Harbor:** Be prepared to remove content on DMCA takedown notice

**Best practices:**
- Identify crawler with descriptive User-Agent: `AMD-FeedSync/1.0 (+https://your-project.com/bot)`
- Cache scraped content for 7-30 days to avoid re-fetching
- Implement per-domain politeness delays (1-5 seconds between requests)
- Log all scraping activity for audit trail
- Provide contact info in User-Agent for webmaster complaints

**Risk mitigation:**
- Start with opt-in: Only scrape feeds explicitly marked "Allow full-text extraction"
- Monitor for 403/429 responses, automatically disable scraping for problematic domains
- Legal review recommended before production deployment
- Consider FiveFilters Readability API as managed alternative (shifts legal liability)

**Sources:**
- [Web Scraping #2: Ethics, Legality, & Robots.txt (How to Stay Out of Trouble)](https://medium.com/@ridhopujiono.work/web-scraping-2-ethics-legality-robots-txt-how-to-stay-out-of-trouble-39052f7dc63f)
- [DOs and DON'Ts of Web Scraping 2026: Best Practices](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-in-2025-e4f9b2a49431)
- [Robots.txt for Web Scraping: How to Read, Follow, and Stay Out of Legal Trouble](https://dataprixa.com/robots-txt-for-web-scraping/)

### Implementation Complexity

**Effort:** HIGH
- Dependencies: Readability, JSDOM, Cheerio, robots-parser
- Legal review required
- Per-domain rate limiting logic
- robots.txt caching and parsing
- Error handling for diverse HTML structures
- Background job scheduling (separate from enrichment)

**ROI:** MEDIUM
- Benefits: Fuller context for AI agents, better summaries
- Costs: Increased storage, scraping infrastructure, legal risk
- Usage: Only valuable if many feeds are truncated (measure first)

**Recommendation:** Defer to Phase 6.2. First measure truncation rate across current feeds (add detection heuristic without scraping). If < 20% of feeds are truncated, ROI is low.

## HTTP Optimization (ETag / Last-Modified)

### Problem Statement

Current implementation fetches full RSS XML for every feed on every sync, even if the feed hasn't changed. This wastes bandwidth (both client and server), increases sync time, and may trigger rate limiting on high-frequency feeds.

**Impact:**
- ~60-80% of feed requests return unchanged content
- Daily sync of 100 feeds = ~60-80 unnecessary downloads daily
- Each feed averages 50-200KB XML = 3-16MB wasted bandwidth/day
- Server-side bandwidth costs for feed publishers

### Technical Approach

HTTP Conditional GET uses `ETag` and `Last-Modified` headers to check if content has changed before downloading the full response.

**Flow:**
1. First sync: Server returns `ETag: "abc123"` and `Last-Modified: Mon, 27 Jan 2025 12:00:00 GMT`
2. Store ETag and Last-Modified in feeds table
3. Next sync: Send `If-None-Match: "abc123"` and `If-Modified-Since: Mon, 27 Jan 2025 12:00:00 GMT`
4. Server response:
   - **304 Not Modified** - Feed unchanged, no body sent (saves bandwidth)
   - **200 OK** - Feed changed, new content in body with updated ETag/Last-Modified

**Schema changes:**
```typescript
// In convex/schema.ts - extend feeds table
feeds: defineTable({
  // ... existing fields ...

  // Phase 6: HTTP optimization
  lastETag: v.optional(v.string()),              // ETag from last sync
  lastModified: v.optional(v.string()),          // Last-Modified header
  consecutiveNotModified: v.optional(v.number()), // Count of 304 responses
})

// In convex/feeds/fetchFeed.ts (MODIFIED)
export const fetchFeed = internalAction({
  handler: async (ctx, args) => {
    const feed = await ctx.runQuery(internal.feeds.queries.getFeed, {
      feedId: args.feedId
    });

    // Build conditional request headers
    const headers: HeadersInit = {
      "User-Agent": USER_AGENT,
      "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    };

    if (feed.lastETag) {
      headers["If-None-Match"] = feed.lastETag;
    }
    if (feed.lastModified) {
      headers["If-Modified-Since"] = feed.lastModified;
    }

    const response = await fetch(feed.url, { headers });

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.log(`[fetchFeed] Feed ${feed.url} not modified (304), skipping parse`);

      // Update consecutive not-modified counter
      await ctx.runMutation(internal.feeds.mutations.updateFeed, {
        feedId: args.feedId,
        consecutiveNotModified: (feed.consecutiveNotModified ?? 0) + 1,
      });

      return {
        success: true,
        feedId: args.feedId,
        feedUrl: feed.url,
        itemsFound: 0,
        itemsAdded: 0,
        itemsSkipped: 0,
        notModified: true,
        duration: Date.now() - startTime,
      };
    }

    // 200 OK - content changed, parse and store
    const xml = await response.text();
    const parsedFeed = await parseFeed(xml);

    // Extract and store new ETag/Last-Modified
    const newETag = response.headers.get("ETag");
    const newLastModified = response.headers.get("Last-Modified");

    // ... existing parsing and storage logic ...

    // Update feed headers
    await ctx.runMutation(internal.feeds.mutations.updateFeed, {
      feedId: args.feedId,
      lastETag: newETag ?? undefined,
      lastModified: newLastModified ?? undefined,
      consecutiveNotModified: 0, // Reset counter on change
    });

    return { success: true, /* ... */ };
  }
});
```

### Benefits

**Bandwidth savings:**
- 304 response: ~500 bytes (headers only)
- 200 response with full feed: 50-200KB
- Savings per 304: 99% less bandwidth

**Performance:**
- Faster sync times (no XML parsing needed for 304s)
- Reduced server load on feed publishers
- Lower Convex action execution time (faster = cheaper)

**Operational:**
- `consecutiveNotModified` counter identifies stale feeds (e.g., 30+ consecutive 304s = abandoned blog)
- Can adjust sync frequency based on update patterns (feeds with frequent 304s sync less often)

### Implementation Complexity

**Effort:** LOW
- No new dependencies (native fetch supports headers)
- Minimal schema changes (2 optional fields)
- ~20 lines of code modification to fetchFeed.ts
- Backward compatible (works with feeds that don't send ETag/Last-Modified)

**ROI:** HIGH
- Immediate 60-80% bandwidth reduction
- Faster sync times
- Simple implementation
- Zero risk (gracefully degrades for unsupported feeds)

**Recommendation:** HIGH PRIORITY for Phase 6.1. This is a quick win with significant impact.

**Sources:**
- [HTTP Conditional Get for RSS Hackers](https://fishbowl.pastiche.org/2002/10/21/http_conditional_get_for_rss_hackers)
- [ETag and Last-Modified Headers — feedparser documentation](https://pythonhosted.org/feedparser/http-etag.html)
- [Best practices for syndication feed caching](https://www.ctrl.blog/entry/feed-caching.html)

## OPML Import/Export

### Problem Statement

Currently, feeds must be added one-by-one through the dashboard UI. For users migrating from other RSS readers or managing 50+ feeds, this is tedious and error-prone.

**Use cases:**
- **Bulk onboarding:** Import 100+ feeds from Feedly/Inoreader/NetNewsWire in one operation
- **Backup/restore:** Export feed list for backup, restore after data loss
- **Feed sharing:** Export curated feed lists to share with team/community
- **Migration:** Move feeds between environments (dev → staging → prod)

### OPML Format Overview

OPML (Outline Processor Markup Language) is the standard XML format for exchanging RSS feed lists.

**Example OPML structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>AMD Feed List</title>
    <dateCreated>Mon, 27 Jan 2025 12:00:00 GMT</dateCreated>
    <ownerName>AMD Marketing Team</ownerName>
  </head>
  <body>
    <outline text="Industry News" title="Industry News">
      <outline type="rss" text="TechCrunch" title="TechCrunch"
               xmlUrl="https://techcrunch.com/feed/"
               htmlUrl="https://techcrunch.com/"
               category="industry" />
      <outline type="rss" text="Ars Technica" title="Ars Technica"
               xmlUrl="https://feeds.arstechnica.com/arstechnica/index"
               htmlUrl="https://arstechnica.com/"
               category="industry" />
    </outline>
    <outline text="Competitors" title="Competitors">
      <outline type="rss" text="Competitor Blog" title="Competitor Blog"
               xmlUrl="https://competitor.com/feed/"
               htmlUrl="https://competitor.com/"
               category="competitor" />
    </outline>
  </body>
</opml>
```

**Key fields:**
- `outline[@type="rss"]` - RSS feed entry
- `@xmlUrl` - Feed URL (REQUIRED)
- `@text` or `@title` - Feed name (at least one REQUIRED)
- `@htmlUrl` - Website URL (optional)
- `@category` - Custom attribute for AMD categorization

**Sources:**
- [OPML - Wikipedia](https://en.wikipedia.org/wiki/OPML)
- [Understanding OPML](https://www.deskshare.com/resources/articles/awr_UnderstandingOPML.aspx)
- [Outline Processor Markup Language (OPML) 2.0](https://loc.gov/preservation/digital/formats/fdd/fdd000554.shtml)

### Technical Approach - OPML Import

**Flow:**
1. User uploads OPML file via dashboard
2. Frontend sends file to Convex mutation
3. Mutation stores file, triggers background action to parse
4. Action parses OPML, validates feed URLs, detects duplicates
5. Creates new feeds in batch, assigns default category/syncFrequency
6. Returns summary: feeds added, duplicates skipped, errors

**Implementation:**
```typescript
// In convex/feeds/opmlImport.ts
import { opml } from "opml"; // npm package by Dave Winer

export const importOPML = action({
  args: {
    opmlContent: v.string(), // OPML XML string
    defaultCategory: v.optional(v.string()),
    defaultSyncFrequency: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<OPMLImportResult> => {
    // 1. Parse OPML
    const parsed = opml.parse(args.opmlContent);

    if (!parsed || !parsed.opml || !parsed.opml.body) {
      throw new Error("Invalid OPML format");
    }

    // 2. Extract feed outlines (flatten nested structure)
    const feedOutlines = extractFeedOutlines(parsed.opml.body.outline);

    let added = 0;
    let skipped = 0;
    const errors: Array<{ url: string; error: string }> = [];

    // 3. Get existing feed URLs for deduplication
    const existingFeeds = await ctx.runQuery(
      internal.feeds.publicQueries.listFeeds,
      {}
    );
    const existingUrls = new Set(existingFeeds.map(f => f.url));

    // 4. Process each feed
    for (const outline of feedOutlines) {
      const feedUrl = outline.xmlUrl || outline.url;
      const feedName = outline.text || outline.title || feedUrl;

      if (!feedUrl) {
        errors.push({ url: "unknown", error: "Missing xmlUrl/url" });
        continue;
      }

      // Skip duplicates
      if (existingUrls.has(feedUrl)) {
        skipped++;
        continue;
      }

      // Validate feed URL format
      try {
        new URL(feedUrl);
      } catch {
        errors.push({ url: feedUrl, error: "Invalid URL format" });
        continue;
      }

      // Create feed
      try {
        await ctx.runMutation(internal.feeds.mutations.addFeed, {
          url: feedUrl,
          name: feedName,
          category: outline.category || args.defaultCategory || "imported",
          syncFrequency: args.defaultSyncFrequency || "daily",
        });
        added++;
      } catch (error: any) {
        errors.push({ url: feedUrl, error: error.message });
      }
    }

    return {
      success: true,
      feedsFound: feedOutlines.length,
      feedsAdded: added,
      feedsSkipped: skipped,
      errors: errors.slice(0, 10), // Limit error list
    };
  }
});

// Helper: Recursively extract feed outlines from nested structure
function extractFeedOutlines(outlines: any[]): any[] {
  const feeds: any[] = [];

  for (const outline of outlines || []) {
    // Check if this is a feed (has xmlUrl or type="rss")
    if (outline.xmlUrl || outline.type === "rss" || outline.type === "atom") {
      feeds.push(outline);
    }

    // Recursively check nested outlines (folders)
    if (outline.outline && Array.isArray(outline.outline)) {
      feeds.push(...extractFeedOutlines(outline.outline));
    }
  }

  return feeds;
}
```

**Dashboard UI flow:**
```typescript
// In ai-marketing-department/ai-marketing-department/app/feeds/import/page.tsx
"use client";

export default function ImportOPMLPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<OPMLImportResult | null>(null);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const opmlContent = await file.text();

    const result = await importOPMLAction({ opmlContent });
    setResult(result);
    setImporting(false);
  };

  return (
    <div>
      <h1>Import Feeds from OPML</h1>
      <input
        type="file"
        accept=".opml,.xml"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <button onClick={handleImport} disabled={!file || importing}>
        {importing ? "Importing..." : "Import Feeds"}
      </button>

      {result && (
        <div>
          <p>Found: {result.feedsFound} feeds</p>
          <p>Added: {result.feedsAdded} new feeds</p>
          <p>Skipped: {result.feedsSkipped} duplicates</p>
          {result.errors.length > 0 && (
            <ul>
              {result.errors.map((err, i) => (
                <li key={i}>{err.url}: {err.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

### Technical Approach - OPML Export

**Flow:**
1. User clicks "Export Feeds" button
2. Query all active feeds from database
3. Build OPML XML structure with feeds grouped by category
4. Return OPML as downloadable file

**Implementation:**
```typescript
// In convex/feeds/opmlExport.ts
import { opml } from "opml";

export const exportOPML = query({
  args: {
    includeCategories: v.optional(v.array(v.string())), // Filter by category
  },
  handler: async (ctx, args): Promise<string> => {
    // 1. Query feeds
    let feeds = await ctx.db.query("feeds").collect();

    // Filter by category if specified
    if (args.includeCategories && args.includeCategories.length > 0) {
      feeds = feeds.filter(f => args.includeCategories!.includes(f.category));
    }

    // 2. Group feeds by category
    const grouped = new Map<string, typeof feeds>();
    for (const feed of feeds) {
      const category = feed.category || "uncategorized";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(feed);
    }

    // 3. Build OPML structure
    const outlines: any[] = [];

    for (const [category, categoryFeeds] of grouped) {
      const categoryOutline = {
        text: category,
        title: category,
        outline: categoryFeeds.map(feed => ({
          type: "rss",
          text: feed.name,
          title: feed.name,
          xmlUrl: feed.url,
          category: feed.category,
        }))
      };
      outlines.push(categoryOutline);
    }

    // 4. Generate OPML XML
    const opmlDoc = {
      opml: {
        version: "2.0",
        head: {
          title: "AMD Feed List",
          dateCreated: new Date().toUTCString(),
          ownerName: "AMD Marketing Department",
        },
        body: {
          outline: outlines,
        }
      }
    };

    const opmlXml = opml.stringify(opmlDoc);
    return opmlXml;
  }
});
```

### Implementation Complexity

**Effort:** LOW-MEDIUM
- Dependency: `opml@^0.4.14` (maintained by OPML creator Dave Winer)
- Import: ~100 lines (parsing, validation, batch insert)
- Export: ~50 lines (query, group, stringify)
- Dashboard UI: ~100 lines (file upload, result display)

**ROI:** HIGH
- Enables bulk onboarding (100+ feeds in one operation vs 100 manual adds)
- Standard format supported by all RSS readers (easy migration)
- Backup/restore capability for disaster recovery
- Low implementation cost

**Recommendation:** HIGH PRIORITY for Phase 6.1. Critical for scaling feed management.

**Sources:**
- [opml - npm](https://www.npmjs.com/package/opml)
- [How to Import and Export feeds | RSS.app Help Center](https://help.rss.app/en/articles/10641828-how-to-import-and-export-feeds)
- [Creating an OPML File for my Blogroll](https://rknight.me/blog/creating-an-opml-file-for-my-blogroll/)

## Semantic Deduplication

### Problem Statement

Current deduplication uses content hash (SHA-256 of feedUrl + guid + link + title). This detects **exact duplicates** but misses **near-duplicates**:

- Same article syndicated across feeds with different titles/URLs
- Article reprinted on multiple sites (TechCrunch → Hacker News → Reddit)
- Updated/edited versions of same article (v1 vs v2 with minor changes)
- Cross-posted content (author's blog → Medium → LinkedIn)

**Impact:**
- Enrichment processes same article multiple times (wastes tokens)
- Brand monitoring alerts duplicate for same mention
- Agent context cluttered with redundant content

### Technical Approach

Semantic deduplication uses vector embeddings to detect similar content based on meaning, not exact text matching.

**Flow:**
1. Generate embedding for each feed item (title + content/summary)
2. Store embedding vector in database or vector DB
3. For new items, query for similar embeddings (cosine similarity > 0.85)
4. If match found, mark as duplicate of original
5. Optionally merge metadata (sources, dates) into canonical item

**Vector embedding options:**

| Model | Cost (per 1M tokens) | Dimensions | Best For |
|-------|---------------------|------------|----------|
| OpenAI text-embedding-3-small | $0.02 | 1536 | Low cost, good accuracy |
| OpenAI text-embedding-3-large | $0.13 | 3072 | Highest accuracy |
| Voyage AI voyage-3 | ~$0.12 | 1024 | Better than OpenAI small, cheaper than large |
| Cohere embed-v4 | $0.12 | 1536 | Multimodal (text + images) |
| Local BGE-M3 | Free (self-hosted) | 1024 | High volume, no API costs |

**Storage options:**

| Solution | Best For | Tradeoff |
|----------|----------|----------|
| Convex array field | <10K items | Simple, no new infra, but no ANN search |
| Pinecone | 10K-1M items | Managed vector DB, $70+/mo, fast ANN |
| Weaviate Cloud | 10K-1M items | Open-source, $25+/mo, full-text + vector |
| Supabase pgvector | Any scale | PostgreSQL extension, free tier, DIY |
| Local ChromaDB | High volume | Self-hosted, free, requires server |

**Implementation with OpenAI + Convex:**
```typescript
// In convex/schema.ts - extend feedItems
feedItems: defineTable({
  // ... existing fields ...

  // Phase 6: Semantic deduplication
  embedding: v.optional(v.array(v.number())),     // 1536-dim vector
  embeddingModel: v.optional(v.string()),         // "text-embedding-3-small"
  duplicateOf: v.optional(v.id("feedItems")),     // Points to canonical item
  similarItems: v.optional(v.array(v.object({     // Near-duplicates found
    itemId: v.id("feedItems"),
    similarity: v.number(),                       // Cosine similarity 0-1
  }))),
})

// In convex/deduplication/embeddings.ts
export const generateEmbedding = internalAction({
  args: { itemId: v.id("feedItems") },
  handler: async (ctx, args) => {
    const item = await ctx.runQuery(internal.feeds.queries.getFeedItem, {
      itemId: args.itemId
    });

    // 1. Prepare text for embedding (title + content)
    const text = `${item.title}\n\n${item.content || item.summary || ""}`.slice(0, 8000);

    // 2. Generate embedding via OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float", // Returns array of floats
    });

    const embedding = response.data[0].embedding; // [1536 floats]

    // 3. Store embedding
    await ctx.runMutation(internal.deduplication.mutations.storeEmbedding, {
      itemId: args.itemId,
      embedding: embedding,
      embeddingModel: "text-embedding-3-small",
    });

    // 4. Find similar items (cosine similarity > 0.85)
    const allItems = await ctx.runQuery(
      internal.deduplication.queries.getItemsWithEmbeddings,
      {}
    );

    const similar: Array<{ itemId: Id<"feedItems">; similarity: number }> = [];

    for (const other of allItems) {
      if (other._id === args.itemId) continue;
      if (!other.embedding) continue;

      const similarity = cosineSimilarity(embedding, other.embedding);

      if (similarity > 0.85) {
        similar.push({ itemId: other._id, similarity });
      }
    }

    // 5. Mark as duplicate if high similarity found
    if (similar.length > 0) {
      // Sort by similarity, take highest
      similar.sort((a, b) => b.similarity - a.similarity);
      const canonical = similar[0];

      await ctx.runMutation(internal.deduplication.mutations.markDuplicate, {
        itemId: args.itemId,
        duplicateOf: canonical.itemId,
        similarItems: similar,
      });
    }

    return {
      embedding: embedding,
      similarCount: similar.length
    };
  }
});

// Helper: Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Naive linear search limitation:**
- Checking 1 item against 1000 items = 1000 comparisons
- Checking 1000 items against each other = 500K comparisons (O(n²))
- Not scalable beyond ~10K items

**Vector DB alternative (Pinecone):**
```typescript
// With Pinecone for Approximate Nearest Neighbor (ANN) search
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index("feed-items");

// Store embedding
await index.upsert([{
  id: itemId,
  values: embedding,
  metadata: { title: item.title, link: item.link }
}]);

// Query for similar (fast ANN search, not linear)
const results = await index.query({
  vector: embedding,
  topK: 5,
  includeMetadata: true,
});

// results.matches has top 5 similar items with scores
```

### Cost Analysis

**Embedding generation costs (OpenAI text-embedding-3-small):**
- $0.02 per 1M tokens
- Average article: ~1000 tokens (title + summary)
- 100 feeds × 10 items/day = 1000 items/day
- 1000 items × 1000 tokens = 1M tokens/day
- **Cost: $0.02/day = $0.60/month**

**Storage costs:**
- Convex: 1536 floats × 4 bytes = 6KB per item
- 30K items (1 month @ 1000/day) = 180MB
- Convex storage: Free up to 1GB, then $0.10/GB/month
- **Cost: Free (under 1GB)**

**Vector DB costs (if using Pinecone):**
- Starter: 100K vectors free, then $70/mo for 1M vectors
- Serverless: Pay per query + storage ($0.30 per 1M queries)

**Total cost for semantic dedup:**
- Embeddings: $0.60/mo
- Storage: Free (Convex) or $70+/mo (Pinecone)
- **Minimum: $0.60/mo (Convex only, linear search, <10K items)**
- **Scaled: $70+/mo (Pinecone, ANN search, 10K-1M items)**

### Implementation Complexity

**Effort:** HIGH
- Embedding generation: MEDIUM (OpenAI API integration)
- Linear search (Convex): LOW (simple cosine similarity loop)
- Vector DB integration: HIGH (Pinecone setup, data sync, query logic)
- Duplicate merging UI: MEDIUM (show canonical + duplicates)

**ROI:** LOW-MEDIUM
- Benefits: Reduces duplicate processing, cleaner data
- Costs: $0.60-$70+/mo, significant implementation effort
- Usage: Only valuable if cross-feed duplicates are common (measure first)

**Recommendation:** Defer to Phase 6.2 or later. First analyze current feed overlap:
- If feeds are topically diverse, duplicates rare → ROI is LOW
- If many feeds cover same topics (e.g., tech news), duplicates common → ROI is MEDIUM

**Simpler alternative:** MinHash LSH (fuzzy hashing) is 10x faster and cheaper than embeddings but 5-10% less accurate. Consider for Phase 6.2 if embeddings too expensive.

**Sources:**
- [Semantic Deduplication - NeMo-Curator | NVIDIA](https://docs.nvidia.com/nemo/curator/latest/curate-text/process-data/deduplication/semdedup.html)
- [13 Best Embedding Models in 2026: OpenAI vs Voyage AI vs Ollama](https://elephas.app/blog/best-embedding-models)
- [How do I use embeddings for duplicate detection? - Zilliz](https://zilliz.com/ai-faq/how-do-i-use-embeddings-for-duplicate-detection)

## Integration Approach

### Backward Compatibility

All Phase 6 features must be **optional** and **backward compatible**:

**Schema changes:**
- All new fields are `v.optional()` (won't break existing data)
- Existing feed sync continues to work without Phase 6 features
- New features enabled per-feed via flags (e.g., `enableFullTextExtraction: boolean`)

**Migration strategy:**
```typescript
// No schema migration needed - all fields optional
// Existing feeds work as-is, new features opt-in

// Example: Enable full-text extraction for specific feed
await updateFeed({
  feedId: "feed-001",
  enableFullTextExtraction: true,  // Opt-in
  respectRobotsTxt: true,           // Safety flag
});
```

### Performance Impact

**Concern:** Phase 6 adds processing overhead to daily cron jobs.

**Mitigation:**
- **HTTP optimization:** REDUCES sync time (304 responses skip parsing)
- **OPML import/export:** One-time operations, no cron impact
- **Full-text extraction:** Separate cron (runs after enrichment), only for truncated items
- **Semantic dedup:** Separate cron (runs after enrichment), batched processing

**Cron schedule with Phase 6:**
```
6:00 AM UTC: Feed sync (with HTTP conditional GET - FASTER)
6:30 AM UTC: AI enrichment (unchanged)
7:00 AM UTC: Full-text extraction (NEW - only truncated items)
7:30 AM UTC: Semantic deduplication (NEW - only new items)
8:00 AM UTC: Brand monitoring digest (unchanged)
```

**Token cost impact:**
- HTTP optimization: Zero (no API calls)
- OPML: Zero (no API calls)
- Full-text extraction: Zero (no LLM calls, just scraping)
- Semantic dedup: ~$0.60/mo (embeddings via OpenAI)

### Database Schema Changes

**Required changes:**
```typescript
// In convex/schema.ts

// 1. feeds table - HTTP optimization fields
feeds: defineTable({
  // ... existing fields ...
  lastETag: v.optional(v.string()),
  lastModified: v.optional(v.string()),
  consecutiveNotModified: v.optional(v.number()),
  enableFullTextExtraction: v.optional(v.boolean()), // Opt-in flag
  respectRobotsTxt: v.optional(v.boolean()),         // Safety flag
})

// 2. feedItems table - Phase 6 fields
feedItems: defineTable({
  // ... existing fields ...

  // Full-text extraction
  isTruncated: v.optional(v.boolean()),
  fullContent: v.optional(v.string()),
  fullContentFetchedAt: v.optional(v.number()),
  fullContentError: v.optional(v.string()),

  // Semantic deduplication
  embedding: v.optional(v.array(v.number())),
  embeddingModel: v.optional(v.string()),
  duplicateOf: v.optional(v.id("feedItems")),
  similarItems: v.optional(v.array(v.object({
    itemId: v.id("feedItems"),
    similarity: v.number(),
  }))),
})
  .index("by_truncated", ["isTruncated"])
  .index("by_duplicateOf", ["duplicateOf"])
```

**Deployment:**
1. Push schema changes (all optional fields, zero downtime)
2. Deploy new actions/mutations
3. Update dashboard UI (import/export pages)
4. Add new cron jobs (full-text, dedup) - initially disabled
5. Enable features per-feed via dashboard

## Prioritization & Sequencing

### Phase 6.1 (High Priority - Quick Wins)

**Goals:** Immediate value, low risk, enables scale

**Features:**
1. **HTTP Optimization (ETag/Last-Modified)** - HIGHEST ROI
   - Effort: 1-2 days
   - Impact: 60-80% bandwidth reduction, faster syncs
   - Risk: Zero (graceful degradation)

2. **OPML Import/Export** - ENABLES SCALE
   - Effort: 3-5 days
   - Impact: Bulk onboarding, backup/restore
   - Risk: Low (standard format, existing libraries)

**Deliverables:**
- Schema updates for ETag/Last-Modified
- Modified fetchFeed.ts to use conditional GET
- OPML import action + dashboard UI
- OPML export query + download button
- Documentation for users

**Timeline:** 1-2 weeks

### Phase 6.2 (Medium Priority - Based on Demand)

**Goals:** Add advanced features if usage patterns justify cost/complexity

**Features (prioritize based on metrics):**
3. **Full-Text Extraction** - IF truncation rate > 20%
   - Effort: 1-2 weeks (including legal review)
   - Impact: Fuller content for agents
   - Risk: Medium (legal, scraping infrastructure)
   - **Decision criteria:** Measure truncation rate in Phase 6.1 first

4. **Semantic Deduplication** - IF cross-feed duplicates > 10%
   - Effort: 1-2 weeks
   - Impact: Cleaner data, reduced token waste
   - Risk: Low-Medium (cost predictable, complexity manageable)
   - **Decision criteria:** Analyze feed overlap in Phase 6.1 first

**Timeline:** 2-4 weeks (if needed)

### Deferred to Future (Low Priority)

**Features that can wait for user requests:**
- Advanced feed health dashboard (visualize consecutiveNotModified trends)
- Auto-adjust sync frequency based on update patterns (AI-powered scheduling)
- Batch OPML import from URL (instead of file upload)
- OPML feed discovery (suggest popular feeds to import)
- Feed similarity clustering (group related feeds automatically)

## Risks & Mitigation

### Risk 1: Web Scraping Legal Liability (Full-Text Extraction)

**Likelihood:** MEDIUM
**Impact:** HIGH (DMCA complaints, IP bans, legal action)

**Mitigation:**
- Legal review before production deployment
- Implement robots.txt checking (required)
- Opt-in per feed (not auto-enabled)
- Provide User-Agent with contact info
- Monitor for 403/429 responses, auto-disable problematic domains
- Implement DMCA takedown process
- Consider FiveFilters API as managed alternative (shifts liability)

**Recommendation:** Only implement if demand is clear. Start with opt-in beta.

### Risk 2: Semantic Dedup False Positives

**Likelihood:** LOW-MEDIUM
**Impact:** MEDIUM (legitimate content marked as duplicate)

**Mitigation:**
- Use conservative similarity threshold (0.90+ instead of 0.85)
- Don't auto-delete duplicates - mark for review
- Store `similarItems` array so users can verify
- Provide UI to unmark false duplicates
- Monitor precision/recall metrics

**Recommendation:** Start with 0.90 threshold, tune based on feedback.

### Risk 3: HTTP Optimization Compatibility

**Likelihood:** LOW
**Impact:** LOW (feeds without ETag/Last-Modified continue to work normally)

**Mitigation:**
- Graceful degradation: if no ETag/Last-Modified, fetch as usual
- Don't fail if headers missing
- Log which feeds support conditional GET for monitoring

**Recommendation:** Zero risk - implement without concern.

### Risk 4: OPML Import Validation Failures

**Likelihood:** MEDIUM
**Impact:** LOW (user sees error, can retry with fixed file)

**Mitigation:**
- Validate OPML structure before processing
- Show clear error messages for malformed files
- Provide sample OPML for users to reference
- Support both OPML 1.0 and 2.0
- Handle nested folder structures correctly

**Recommendation:** Implement robust validation, clear error messages.

### Risk 5: Embedding Cost Overruns (Semantic Dedup)

**Likelihood:** MEDIUM (if volume grows unexpectedly)
**Impact:** MEDIUM (monthly costs increase to $5-50+)

**Mitigation:**
- Start with text-embedding-3-small (cheapest)
- Only embed new items (not full backfill)
- Set monthly budget alerts
- Consider local embeddings (BGE-M3) if volume > 10K items/month
- Use batching to reduce API calls

**Recommendation:** Monitor costs weekly, migrate to local if exceeds $10/mo.

## Summary

### Key Takeaways

1. **Quick Wins (Phase 6.1):**
   - HTTP optimization (ETag/Last-Modified): 60-80% bandwidth savings, 1-2 days effort, zero risk → IMPLEMENT IMMEDIATELY
   - OPML import/export: Bulk onboarding, 3-5 days effort, low risk → IMPLEMENT IMMEDIATELY

2. **Data-Driven Decisions (Phase 6.2):**
   - Full-text extraction: Only if truncation rate > 20%, requires legal review → MEASURE FIRST
   - Semantic deduplication: Only if cross-feed duplicates > 10%, ~$0.60/mo cost → MEASURE FIRST

3. **Architectural Principles:**
   - All features optional and backward compatible
   - Separate cron jobs (don't slow down core sync)
   - Opt-in per feed (user control)
   - Graceful degradation (missing headers, failed scraping)

4. **Cost Impact:**
   - HTTP optimization: $0/mo (saves bandwidth)
   - OPML: $0/mo (one-time operations)
   - Full-text extraction: $0/mo (no LLM, just scraping)
   - Semantic dedup: $0.60-$70+/mo (embeddings + optional vector DB)
   - **Total minimum: $0.60/mo additional cost**

5. **Implementation Sequence:**
   ```
   Week 1-2: Phase 6.1 (HTTP opt + OPML)
   └─► Measure truncation rate + duplicate rate
       └─► IF metrics justify:
           Week 3-6: Phase 6.2 (Full-text + Semantic dedup)
   ```

6. **Legal Considerations:**
   - Full-text extraction requires robots.txt compliance
   - Provide User-Agent with contact info
   - Opt-in only, not auto-enabled
   - Legal review recommended before production

7. **Technology Choices:**
   - HTTP: Native fetch (zero dependencies)
   - OPML: `opml@^0.4.x` (by Dave Winer, OPML creator)
   - Full-text: `@mozilla/readability` (Firefox Reader standard)
   - Embeddings: OpenAI text-embedding-3-small (best cost/accuracy)
   - Vector storage: Convex (free <10K items) or Pinecone (scaled)

8. **Success Metrics:**
   - HTTP optimization: Track 304 response rate (target: 60%+)
   - OPML import: Track bulk imports (target: 50+ feeds per import)
   - Full-text extraction: Track successful extractions (target: 90%+ success rate)
   - Semantic dedup: Track precision (target: 95%+ correct matches)

9. **When to Skip Features:**
   - Full-text extraction: If < 20% of feeds are truncated
   - Semantic dedup: If < 10% cross-feed duplicates
   - Both: If user feedback doesn't request them

10. **Recommended Roadmap:**
    - **Phase 6.1 (2 weeks):** HTTP optimization + OPML import/export
    - **Measure & Decide (1 week):** Analyze truncation + duplicate rates
    - **Phase 6.2 (conditional, 2-4 weeks):** Full-text + Semantic dedup if metrics justify

## Sources

### Primary (HIGH confidence)
- [HTTP Conditional Get for RSS Hackers](https://fishbowl.pastiche.org/2002/10/21/http_conditional_get_for_rss_hackers) - ETag/Last-Modified implementation
- [ETag and Last-Modified Headers — feedparser documentation](https://pythonhosted.org/feedparser/http-etag.html) - HTTP caching patterns
- [opml - npm](https://www.npmjs.com/package/opml) - OPML parsing library documentation
- [OPML - Wikipedia](https://en.wikipedia.org/wiki/OPML) - Format specification
- [How to extract article or blogpost content in JS using Readability.js](https://webcrawlerapi.com/blog/how-to-extract-article-or-blogpost-content-in-js-using-readabilityjs) - Readability implementation
- [Web Scraping #2: Ethics, Legality, & Robots.txt](https://medium.com/@ridhopujiono.work/web-scraping-2-ethics-legality-robots-txt-how-to-stay-out-of-trouble-39052f7dc63f) - Legal compliance
- [Semantic Deduplication - NeMo-Curator](https://docs.nvidia.com/nemo/curator/latest/curate-text/process-data/deduplication/semdedup.html) - Vector deduplication patterns
- [13 Best Embedding Models in 2026](https://elephas.app/blog/best-embedding-models) - Embeddings cost comparison

### Secondary (MEDIUM confidence)
- [Best practices for syndication feed caching](https://www.ctrl.blog/entry/feed-caching.html) - RSS caching strategies
- [DOs and DON'Ts of Web Scraping 2026](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-in-2025-e4f9b2a49431) - Scraping best practices
- [How do I use embeddings for duplicate detection?](https://zilliz.com/ai-faq/how-do-i-use-embeddings-for-duplicate-detection) - Vector similarity search
- [GitHub - MinishLab/semhash](https://github.com/MinishLab/semhash) - Fast semantic deduplication library

### Tertiary (LOW confidence)
- [Robots.txt for Web Scraping](https://dataprixa.com/robots-txt-for-web-scraping/) - Compliance guidelines
- [Embedding Models: OpenAI vs Gemini vs Cohere in 2026](https://research.aimultiple.com/embedding-models/) - Model comparison

## Metadata

**Confidence breakdown:**
- HTTP optimization: HIGH - Standard HTTP spec, proven patterns, zero risk
- OPML import/export: HIGH - Standard format, existing libraries, well-documented
- Full-text extraction: MEDIUM - Legal complexity, diverse HTML structures, ethical concerns
- Semantic deduplication: MEDIUM - Cost predictability varies with volume, vector DB choice impacts complexity

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - web standards stable, embedding prices may change)
