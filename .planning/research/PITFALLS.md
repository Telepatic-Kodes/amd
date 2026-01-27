# Domain Pitfalls: RSS Feed Integration

**Domain:** RSS feed integration for AI content consumption
**Stack:** Next.js 16 + Convex (serverless)
**Researched:** 2026-01-27

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or system failures.

---

### Pitfall 1: GUID Unreliability and Deduplication Failures

**What goes wrong:** RSS feeds have unreliable or missing GUIDs (Globally Unique Identifiers). Some feeds use non-unique GUIDs (same value for all items), change GUIDs when URLs change, or omit them entirely. This causes duplicate entries in your database or missed updates.

**Why it happens:** The RSS specification does not enforce a format for GUIDs and leaves uniqueness up to feed publishers. Many feed generators use URLs as GUIDs, which break when domains change or articles are updated.

**Consequences:**
- Duplicate content stored in Convex database
- AI agents process the same content multiple times, wasting resources
- Storage bloat over time
- Inconsistent content state

**Prevention:**
1. **Never trust GUID alone.** Implement a composite key strategy:
   ```typescript
   // Generate reliable unique ID
   const getItemId = (item: FeedItem): string => {
     const guid = item.guid || '';
     const link = item.link || '';
     const pubDate = item.pubDate || '';
     const title = item.title || '';

     // Hash combination for reliable deduplication
     return hash(`${feedUrl}:${guid || link}:${pubDate}:${title.slice(0, 50)}`);
   };
   ```
2. **Store the original GUID separately** for debugging, but use your generated ID for deduplication
3. **Add content-based similarity detection** (85% overlap threshold) for catching near-duplicates

**Detection:**
- Monitor for rapidly growing database size
- Log when duplicate detection catches items with same content but different GUIDs
- Alert when feed item count per sync exceeds historical norms

**Phase:** Implement in Phase 1 (Core Sync) - this is foundational

**Confidence:** HIGH - Multiple sources confirm GUID unreliability ([RSS Board](https://www.rssboard.org/news/217/unique-and-use-rss-guid-like-everybody), [Gitea issue #21542](https://github.com/go-gitea/gitea/issues/21542))

---

### Pitfall 2: Malformed XML and Feed Format Chaos

**What goes wrong:** Real-world RSS feeds frequently contain invalid XML - unclosed tags, unescaped ampersands, illegal characters, mixed encodings, and violations of RSS/Atom specs. Parsing fails silently or crashes.

**Why it happens:** Approximately 10% of all RSS feeds are not well-formed XML at any given time. Publishers use various CMS systems with inconsistent XML generation.

**Consequences:**
- Sync jobs fail completely
- Partial data extraction (some fields parse, others don't)
- Character corruption (mojibake) in stored content
- Silent data loss

**Prevention:**
1. **Use a lenient parser** that handles malformed feeds:
   ```typescript
   // Use rss-parser or feedparser with error recovery
   import Parser from 'rss-parser';

   const parser = new Parser({
     customFields: { item: ['content:encoded'] },
     // Enable lenient parsing
   });
   ```
2. **Implement validation before storage:**
   ```typescript
   const validateItem = (item: FeedItem): boolean => {
     return !!(item.title || item.description) &&
            !!(item.link || item.guid);
   };
   ```
3. **Add encoding normalization:**
   - Check Content-Type header for charset
   - Detect encoding from XML declaration
   - Convert everything to UTF-8 before storage
4. **Log parsing errors with feed context** for debugging

**Detection:**
- Track parsing error rates per feed
- Flag feeds with >5% parse failures for manual review
- Monitor for character encoding issues (look for `?` or replacement characters)

**Phase:** Implement in Phase 1 (Core Sync) - parsing must be robust from day one

**Confidence:** HIGH - Well-documented issue ([feedparser docs](https://feedparser.readthedocs.io/en/latest/html-sanitization.html), [CSS-Tricks](https://css-tricks.com/how-to-fetch-and-parse-rss-feeds-in-javascript/))

---

### Pitfall 3: Convex Action Timeout During Multi-Feed Sync

**What goes wrong:** A single Convex action tries to fetch and process multiple RSS feeds sequentially. The action hits the 10-minute timeout limit before completing, leaving the database in an inconsistent state.

**Why it happens:** Convex actions have a 10-minute execution timeout. Fetching multiple external feeds (each potentially slow or timing out) in sequence quickly exhausts this budget.

**Consequences:**
- Incomplete syncs (some feeds updated, others not)
- No clear indication of which feeds succeeded
- Potential data inconsistency
- Stuck cron jobs

**Prevention:**
1. **One feed per action:** Schedule separate actions for each feed source
   ```typescript
   // crons.ts - Bad: single action for all feeds
   // crons.define({ ... handler: syncAllFeeds })

   // Good: fan out to individual feed actions
   export const scheduleFeedSyncs = action({
     handler: async (ctx) => {
       const feeds = await ctx.runQuery(internal.feeds.list);
       for (const feed of feeds) {
         await ctx.scheduler.runAfter(0, internal.feeds.syncSingle, {
           feedId: feed._id
         });
       }
     }
   });
   ```
2. **Set individual fetch timeouts** (30 seconds per feed max)
3. **Track sync status per feed** in the database
4. **Implement parallel fan-out** using Convex's built-in parallelization for actions

**Detection:**
- Monitor action execution times
- Alert on actions approaching 8-minute mark
- Log individual feed fetch durations

**Phase:** Architecture decision in Phase 1, critical for Phase 2 (Multiple Feeds)

**Confidence:** HIGH - Verified via [Convex docs](https://docs.convex.dev/functions/actions), [Convex limits](https://docs.convex.dev/production/state/limits)

---

### Pitfall 4: Cron Job Skipping Due to Long-Running Previous Executions

**What goes wrong:** If a cron job takes longer than the interval between scheduled runs, Convex skips subsequent executions. For daily syncs, this might seem safe, but edge cases (slow feeds, retries, network issues) can cause missed syncs.

**Why it happens:** Convex enforces that at most one run of each cron job can execute at any moment. Following runs are skipped to prevent execution from falling behind.

**Consequences:**
- Missed daily syncs without notification
- Stale content for AI agents
- No visibility into skipped executions

**Prevention:**
1. **Implement sync state tracking:**
   ```typescript
   // Track in database
   interface SyncState {
     lastSyncAttempt: number;
     lastSuccessfulSync: number;
     status: 'pending' | 'running' | 'completed' | 'failed';
   }
   ```
2. **Add health check queries** that AI agents can call to verify content freshness
3. **Set up alerting** for sync gaps exceeding expected intervals
4. **Design for idempotency** - safe to run sync multiple times

**Detection:**
- Query for `lastSuccessfulSync` > 26 hours ago (for daily syncs)
- Log when cron job finds previous run still in progress
- Monitor the Convex dashboard Schedules tab

**Phase:** Implement in Phase 1, monitor throughout

**Confidence:** HIGH - [Convex cron docs](https://docs.convex.dev/scheduling/cron-jobs) explicitly state this limitation

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded functionality.

---

### Pitfall 5: Ignoring HTTP 429 Rate Limits

**What goes wrong:** When fetching multiple feeds, rate limiting kicks in (HTTP 429). The sync continues to hammer the same server, gets blocked, and the feed becomes permanently unfetchable from your IP.

**Why it happens:** Developers fetch feeds without respecting rate limits or the `Retry-After` header.

**Consequences:**
- IP gets blocklisted by feed providers
- Specific feeds become inaccessible
- Compliance issues with feed providers' ToS

**Prevention:**
1. **Check for and respect `Retry-After` header:**
   ```typescript
   const fetchFeed = async (url: string): Promise<FeedResponse> => {
     const response = await fetch(url);

     if (response.status === 429) {
       const retryAfter = response.headers.get('Retry-After');
       const waitMs = retryAfter
         ? parseInt(retryAfter) * 1000
         : 60000; // Default 1 minute

       // Schedule retry
       await ctx.scheduler.runAfter(waitMs, internal.feeds.syncSingle, {
         feedId,
         attempt: attempt + 1
       });
       return { status: 'rate_limited', retryAt: Date.now() + waitMs };
     }
     // ... handle success
   };
   ```
2. **Implement exponential backoff** for retries (1s, 2s, 4s, 8s...)
3. **Spread feed fetches over time** rather than burst-fetching all at once
4. **Store rate limit status per feed source** to avoid repeated failures

**Detection:**
- Log all 429 responses with feed URL
- Track failure rates per domain
- Alert on consecutive 429s from same source

**Phase:** Implement in Phase 1 (essential for reliability)

**Confidence:** MEDIUM - Standard HTTP practice ([MDN 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429))

---

### Pitfall 6: Date/Timezone Parsing Chaos

**What goes wrong:** RSS `pubDate` fields use RFC-822 format with timezone variations. Some use abbreviations (EST, PST), some use offsets (+0100), some omit timezone entirely. Parsing these incorrectly causes wrong ordering, missed items, or duplicate detection failures.

**Why it happens:** The RFC-822 format is loosely enforced, and many feed generators produce non-compliant dates.

**Consequences:**
- Items appear in wrong chronological order
- "New" items detected as old or vice versa
- Duplicate detection based on pubDate fails
- AI agents receive content out of order

**Prevention:**
1. **Use a robust date parsing library:**
   ```typescript
   import dayjs from 'dayjs';
   import customParseFormat from 'dayjs/plugin/customParseFormat';
   import utc from 'dayjs/plugin/utc';
   import timezone from 'dayjs/plugin/timezone';

   dayjs.extend(customParseFormat);
   dayjs.extend(utc);
   dayjs.extend(timezone);

   const parseDate = (dateStr: string): number | null => {
     const parsed = dayjs(dateStr);
     if (!parsed.isValid()) {
       console.warn(`Invalid date: ${dateStr}`);
       return Date.now(); // Fallback to current time
     }
     return parsed.valueOf();
   };
   ```
2. **Store all dates as UTC timestamps** (milliseconds since epoch)
3. **Define fallback strategy:** When timezone is missing, assume UTC
4. **Never use `Date.parse()` directly** - behavior varies across environments

**Detection:**
- Log date parsing warnings with original string
- Monitor for items with future dates (often indicates parsing errors)
- Check for clusters of items with identical timestamps

**Phase:** Implement in Phase 1 (affects all subsequent logic)

**Confidence:** MEDIUM - Multiple sources confirm issue ([RSSHub docs](https://docs.rsshub.app/joinus/advanced/pub-date), [whitep4nth3r](https://whitep4nth3r.com/blog/how-to-format-dates-for-rss-feeds-rfc-822/))

---

### Pitfall 7: Storing Full HTML Without Sanitization

**What goes wrong:** RSS item descriptions and `content:encoded` fields contain arbitrary HTML. Storing this raw exposes XSS risks and causes AI agents to process markup noise instead of clean content.

**Why it happens:** Developers assume feed content is safe or forget that AI agents need clean text, not HTML.

**Consequences:**
- XSS vulnerabilities if content is ever displayed
- AI agents waste tokens processing HTML tags
- Inconsistent content quality for content generation
- Storage bloat from HTML overhead

**Prevention:**
1. **Sanitize HTML before storage:**
   ```typescript
   import sanitizeHtml from 'sanitize-html';

   const cleanContent = sanitizeHtml(item.content, {
     allowedTags: [], // Strip all tags for AI consumption
     allowedAttributes: {},
   });
   ```
2. **Store both versions** if display is needed:
   ```typescript
   interface StoredItem {
     rawContent: string;      // Original for debugging
     cleanContent: string;    // Sanitized for AI
     textContent: string;     // Plain text version
   }
   ```
3. **Extract and store links separately** if needed for reference

**Detection:**
- Check for `<script>` tags in stored content (critical security issue)
- Monitor content length ratios (HTML vs text)
- Sample review of stored content

**Phase:** Implement in Phase 1 (security and AI quality)

**Confidence:** HIGH - [feedparser sanitization docs](https://feedparser.readthedocs.io/en/latest/html-sanitization.html)

---

### Pitfall 8: No Feed Health Monitoring

**What goes wrong:** Feeds silently fail (404, 500, timeouts) or go stale (publisher stopped updating). The system continues "syncing" dead feeds without alerting anyone.

**Why it happens:** Developers focus on the happy path and don't implement monitoring for feed degradation.

**Consequences:**
- AI agents work with stale content
- Wasted resources polling dead feeds
- No visibility into content freshness
- Gradual degradation goes unnoticed

**Prevention:**
1. **Track feed health metrics:**
   ```typescript
   interface FeedHealth {
     feedId: Id<"feeds">;
     lastSuccessfulFetch: number;
     lastAttempt: number;
     consecutiveFailures: number;
     lastError?: string;
     averageFetchDuration: number;
     itemsLastSync: number;
   }
   ```
2. **Implement health check endpoint** for monitoring dashboards
3. **Auto-disable feeds** after N consecutive failures (e.g., 5)
4. **Alert on staleness:** If a feed that usually updates daily hasn't had new items in 3+ days

**Detection:**
- Dashboard showing feed status at a glance
- Alerts for feeds with >3 consecutive failures
- Weekly report of feed health metrics

**Phase:** Implement basic tracking in Phase 1, dashboard in Phase 3

**Confidence:** MEDIUM - Best practice pattern

---

## Minor Pitfalls

Mistakes that cause annoyance or minor technical debt.

---

### Pitfall 9: Not Handling Partial Feed Content

**What goes wrong:** Many feeds only include summaries, not full article content. AI agents receive truncated content insufficient for quality content generation.

**Why it happens:** Publishers intentionally truncate to drive traffic to their sites.

**Prevention:**
1. **Check for `content:encoded`** field (often has full content when present)
2. **Consider full-text extraction services** like FiveFilters for important feeds
3. **Store and flag content length** to identify truncated items
4. **Let AI agents know** when content is a summary vs full text

**Phase:** Phase 2 consideration, not critical for MVP

**Confidence:** LOW - Depends on use case requirements

---

### Pitfall 10: Hardcoded Feed Configuration

**What goes wrong:** Feed URLs and sync settings are hardcoded, requiring code changes and redeployment to add/modify feeds.

**Why it happens:** Starting simple without considering operational flexibility.

**Prevention:**
1. **Store feed configuration in Convex database:**
   ```typescript
   interface FeedConfig {
     url: string;
     name: string;
     syncInterval: 'hourly' | 'daily' | 'weekly';
     enabled: boolean;
     tags: string[];
   }
   ```
2. **Build admin UI** for feed management
3. **Use Convex's runtime cron component** (`@convex-dev/crons`) for dynamic scheduling

**Phase:** Implement database storage in Phase 1, admin UI in Phase 3

**Confidence:** HIGH - [Convex crons component](https://github.com/get-convex/crons) addresses this

---

### Pitfall 11: Fetching Unchanged Feeds

**What goes wrong:** Every sync fetches the full feed XML even when nothing has changed, wasting bandwidth and processing time.

**Why it happens:** Not implementing HTTP conditional GET (ETag/Last-Modified).

**Prevention:**
1. **Store and send conditional headers:**
   ```typescript
   const headers: Record<string, string> = {};

   if (feed.lastEtag) {
     headers['If-None-Match'] = feed.lastEtag;
   }
   if (feed.lastModified) {
     headers['If-Modified-Since'] = feed.lastModified;
   }

   const response = await fetch(feed.url, { headers });

   if (response.status === 304) {
     // Not modified, skip processing
     return { status: 'not_modified' };
   }

   // Store new headers for next request
   const newEtag = response.headers.get('ETag');
   const newModified = response.headers.get('Last-Modified');
   ```

**Phase:** Nice-to-have optimization in Phase 2

**Confidence:** MEDIUM - Standard HTTP caching

---

## Convex-Specific Warnings

| Issue | Description | Mitigation |
|-------|-------------|------------|
| Static cron definitions | Built-in crons require static `crons.ts` file | Use `@convex-dev/crons` component for runtime registration |
| Action side effects | Actions aren't transactional - scheduled functions run even if action fails later | Schedule at end of action after all processing |
| Memory limits | Node.js runtime has 512MB limit | Stream large feeds, don't load all into memory |
| No action retries | Unlike mutations, failed actions aren't automatically retried | Implement manual retry logic with scheduler |
| CORS for external fetch | Convex actions run server-side, no CORS issues | N/A - but be aware if moving logic client-side |

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Core Sync | GUID unreliability | Implement composite key strategy from day one |
| Phase 1: Core Sync | Malformed feeds | Use lenient parser, add validation layer |
| Phase 1: Core Sync | Action timeout | One feed per action architecture |
| Phase 2: Multi-Feed | Rate limiting | Implement 429 handling, spread fetches |
| Phase 2: Multi-Feed | Feed health | Add monitoring before scaling to many feeds |
| Phase 3: Admin UI | Hardcoded config | Database-driven configuration |
| Ongoing | Stale content | Health checks, staleness alerts |

---

## Sources

### HIGH Confidence (Official Documentation)
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) - Cron limitations and behavior
- [Convex Actions](https://docs.convex.dev/functions/actions) - Timeout and execution constraints
- [Convex Limits](https://docs.convex.dev/production/state/limits) - Memory and execution limits
- [feedparser Sanitization](https://feedparser.readthedocs.io/en/latest/html-sanitization.html) - HTML sanitization patterns

### MEDIUM Confidence (Multiple Sources Agree)
- [RSS Board on GUIDs](https://www.rssboard.org/news/217/unique-and-use-rss-guid-like-everybody) - GUID reliability issues
- [MDN HTTP 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) - Rate limiting handling
- [W3C Feed Validator](https://validator.w3.org/feed/docs/warning/EncodingMismatch.html) - Encoding issues
- [RSSHub Date Handling](https://docs.rsshub.app/joinus/advanced/pub-date) - Date parsing approaches

### LOW Confidence (Single Source / Community)
- [Vercel Cron Troubleshooting](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs) - Vercel-specific (not Convex)
- Various GitHub issues - Individual bug reports

---

## Summary

The most critical pitfalls for this RSS feed integration project are:

1. **GUID Unreliability** - Must solve in Phase 1 with composite key strategy
2. **Malformed XML** - Must use lenient parsing from day one
3. **Action Timeouts** - Architecture must be one-feed-per-action
4. **Rate Limiting** - Essential for reliability when scaling to multiple feeds

These four issues, if not addressed early, will cause significant rework. The remaining pitfalls are important but can be addressed incrementally.
