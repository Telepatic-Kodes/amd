# Project Research Summary

**Project:** RSS Feed Integration for AI Marketing Department (AMD)
**Domain:** RSS feed aggregation for AI agent content consumption
**Researched:** 2026-01-27
**Confidence:** HIGH

## Executive Summary

This project integrates RSS feed aggregation into AMD's existing Next.js 16 + Convex stack to provide 37 AI marketing agents with fresh industry content. The recommended approach is a lightweight, serverless-native solution using **Feedsmith for parsing**, **native fetch for HTTP**, and **Convex built-in crons for scheduling**. This minimalist stack adds only one new dependency while leveraging existing infrastructure.

The critical architectural decision is to adopt a **fan-out pattern** where each feed is synced by a separate Convex action to avoid timeout issues. Feed items are stored with composite-key deduplication (not trusting unreliable GUIDs) and injected into agent contexts at execution time rather than maintained as persistent knowledge. The system follows AMD's established patterns: actions for external operations, mutations for storage, and event-driven handoffs between agents.

The primary risks are GUID unreliability causing duplicates, malformed XML crashing parsers, and action timeouts when scaling to multiple feeds. These are mitigated through composite key hashing, lenient parsing with validation layers, and one-feed-per-action architecture from day one. This approach integrates seamlessly with AMD's existing 37-agent system without requiring significant architectural changes.

## Key Findings

### Recommended Stack

The stack prioritizes serverless-safe, TypeScript-native libraries that integrate with Convex's runtime constraints. **Feedsmith (v2.8.0)** is the clear winner for RSS parsing—released 7 days ago, actively maintained, uses fast-xml-parser internally (no XMLHttpRequest issues), and handles RSS 2.0, RSS 1.0 (RDF), Atom, and JSON feeds with proper namespace support for marketing content (iTunes, Dublin Core, Media RSS).

**Core technologies:**
- **Feedsmith (^2.8.0)**: RSS/Atom/RDF parsing — Modern, TypeScript-native, tree-shakable, serverless-safe (no XMLHttpRequest or native bindings)
- **Native fetch (built-in)**: HTTP retrieval — Already available in Convex actions, no external HTTP library needed
- **Convex built-in crons**: Scheduling — Native feature, no external scheduler required, survives deployments
- **fast-xml-parser (^5.3.0)**: XML processing — Used internally by Feedsmith, handles malformed XML gracefully

**Why not alternatives:**
- rss-parser: Uses XMLHttpRequest internally, causes serverless runtime issues, stale maintenance (3+ years)
- feedparser: Streaming-based, overkill for daily batch sync use case
- axios: Unnecessary dependency when native fetch works in Convex actions

### Expected Features

RSS feed aggregation for AI consumption differs fundamentally from human-facing readers. The focus is on structured data output, consistent schemas, and programmatic access rather than pretty UIs, offline reading, or social features.

**Must have (table stakes):**
- Multi-feed subscription with RSS 2.0, Atom, RSS 1.0 (RDF) support — Core purpose
- Feed parsing with error tolerance — 10% of feeds are malformed at any time
- Content normalization across formats — Unified schema for AI consumption
- Persistent storage with deduplication — Prevent reprocessing same items
- Scheduled daily fetching — Automated background updates
- Basic keyword filtering — Essential for brand monitoring use case
- Feed health tracking — Know when feeds break or go stale
- Structured JSON output — Machine-readable, not HTML rendering

**Should have (competitive):**
- Brand mention alerting — Priority notifications for monitored terms
- AI-powered categorization — Route content to appropriate agents (e.g., trend curator vs brand monitor)
- Sentiment analysis — Understand tone of brand mentions
- Summary generation — Reduce agent token consumption by pre-summarizing

**Defer (v2+):**
- Full-text extraction — Many feeds truncate content; web scraping adds complexity
- Trend detection — Requires topic modeling, frequency analysis across feeds
- Semantic deduplication — Embedding-based similarity detection for near-duplicates
- Human-facing reader UI — Agents are the consumers, not humans; admin UI for feed management only
- Social media integration — Different product domain, adds API complexity
- Podcast/video handling — Different media type, separate processing pipeline

### Architecture Approach

The architecture follows AMD's existing Convex patterns: actions for external fetch, mutations for reliable storage, and cron-triggered orchestration. The design is intentionally simple: **Fetch → Parse → Dedupe → Store → Query**. A cron job triggers a batch orchestrator mutation that schedules individual actions for each feed (fan-out pattern), preventing action timeouts and isolating feed failures. Each action fetches XML, parses with Feedsmith, generates content hashes for deduplication, and hands off to a mutation for atomic storage.

**Major components:**
1. **Feed Registry** — Stores feed URLs, categories, sync config in `feeds` table; supports dynamic feed management
2. **Sync Engine** — Orchestrates fetch + parse + store via actions; implements fan-out pattern (one action per feed)
3. **Deduplication Layer** — Generates composite content hashes (GUID + URL + title) to handle unreliable GUIDs
4. **Storage Layer** — Persists feed items with AI-enhanced fields (summary, topics, sentiment) populated asynchronously
5. **Agent Context Injection** — Queries relevant feed items at agent execution time and injects into systemPrompt
6. **Health Monitoring** — Tracks sync success, consecutive failures, staleness for operational visibility

**Key architectural patterns:**
- **Scheduler-first pattern**: Mutation schedules action (provides audit trail, retry capability, rate limiting)
- **Content hash deduplication**: SHA-256 of GUID or (URL + title) prevents duplicate storage
- **Batch insert with single mutation**: Collect all new items, insert atomically for better performance
- **Agent context injection**: Query fresh data per task rather than persistent agent "knowledge"

### Critical Pitfalls

1. **GUID Unreliability and Deduplication Failures** — RSS GUIDs are not guaranteed unique; some feeds reuse them, change them when URLs change, or omit them entirely. Never trust GUID alone. Implement composite key hashing: `hash(feedUrl + (guid || link) + pubDate + title)`. Store original GUID separately for debugging. Add content-based similarity detection (85% overlap) for near-duplicates. **Phase 1 critical** — foundational for all subsequent work.

2. **Malformed XML and Feed Format Chaos** — Approximately 10% of RSS feeds are invalid XML at any time (unclosed tags, unescaped ampersands, encoding issues). Use lenient parser (Feedsmith/rss-parser) with error recovery. Validate items before storage (must have title or description + link or guid). Normalize all content to UTF-8. Log parsing errors with feed context. **Phase 1 critical** — parsing must be robust from day one.

3. **Convex Action Timeout During Multi-Feed Sync** — Actions have 10-minute timeout; fetching multiple feeds sequentially exhausts this. Implement fan-out pattern: orchestrator mutation schedules separate action for each feed. Set 30-second timeout per individual feed fetch. Track sync status per feed in database. **Architectural decision for Phase 1, critical for Phase 2 scaling**.

4. **Cron Job Skipping Due to Long-Running Executions** — Convex skips subsequent cron runs if previous execution is still running. Track sync state (`lastSyncAttempt`, `lastSuccessfulSync`, `status`) in database. Add health check queries that agents can call to verify content freshness. Alert on sync gaps exceeding 26 hours for daily syncs. Design for idempotency.

5. **Ignoring HTTP 429 Rate Limits** — Rate limiting can permanently block your IP from feed providers. Check and respect `Retry-After` header on HTTP 429. Implement exponential backoff (1s, 2s, 4s, 8s). Spread feed fetches over time rather than burst-fetching. Store rate limit status per feed source.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundation-first with critical reliability features, then scales to multiple feeds, finally adds AI enrichment and operational tooling.

### Phase 1: Core Feed Sync Engine (Foundation)

**Rationale:** Establish reliable single-feed syncing before scaling. This phase addresses the three critical pitfalls (GUID unreliability, malformed XML, action timeouts) and implements the foundational architecture patterns that all subsequent phases depend on.

**Delivers:**
- Database schema (`feeds`, `feedItems`, `feedSyncLog` tables)
- Single-feed sync action with Feedsmith parsing
- Composite key deduplication (hash of GUID/URL/title)
- Lenient XML parsing with validation layer
- Basic feed health tracking (last sync, error count)
- Manual trigger capability for testing

**Addresses (from FEATURES.md):**
- Feed parsing with error tolerance
- Content normalization across RSS/Atom/RDF formats
- Persistent storage with deduplication
- Feed health tracking

**Avoids (from PITFALLS.md):**
- Pitfall #1: GUID unreliability (composite key strategy)
- Pitfall #2: Malformed XML (lenient parser + validation)
- Pitfall #4: Cron skipping (sync state tracking from start)

**Tech decisions:**
- Install Feedsmith (one dependency)
- Use native fetch in Convex actions
- Implement SHA-256 content hashing with native crypto

**Research flag:** Standard patterns — Well-documented RSS parsing, no additional research needed.

### Phase 2: Multi-Feed Orchestration (Scale)

**Rationale:** Expand to multiple feeds using fan-out architecture to prevent action timeouts. This phase implements the orchestration pattern critical for production use at scale (10-100+ feeds).

**Delivers:**
- Batch orchestrator mutation (schedules individual feed actions)
- Fan-out pattern implementation (one action per feed)
- HTTP 429 rate limit handling with exponential backoff
- Staggered feed fetching to avoid burst traffic
- Per-feed error isolation (one feed failure doesn't block others)
- Feed health dashboard (consecutive failures, staleness alerts)

**Addresses (from FEATURES.md):**
- Multi-feed subscription
- Scheduled fetching with configurable intervals
- OPML import for bulk feed onboarding

**Avoids (from PITFALLS.md):**
- Pitfall #3: Action timeout (fan-out pattern prevents sequential processing)
- Pitfall #5: Rate limiting (429 handling, staggered fetches)
- Pitfall #8: No feed health monitoring (operational visibility)

**Uses (from STACK.md):**
- Convex built-in crons for daily orchestration trigger
- Convex scheduler for per-feed action fan-out

**Research flag:** Standard patterns — Established serverless orchestration, no additional research needed.

### Phase 3: Agent Integration (Connection)

**Rationale:** Connect feed content to existing AMD agent system. This phase makes the feed data actually useful by injecting it into agent contexts at execution time.

**Delivers:**
- Agent context injection in `executeAgent` action
- Relevance query (filter by topics, keywords, date range)
- Feed tool registration for agents (`"feeds"` in config.tools)
- Basic keyword filtering (include/exclude lists)
- Content usage tracking (`usedInContentIds` linking to content table)

**Addresses (from FEATURES.md):**
- Basic keyword filtering
- Structured JSON output for AI consumption
- Source attribution tracking

**Avoids (from PITFALLS.md):**
- Pitfall #7: Storing raw HTML (sanitize to plain text for AI consumption)
- Pitfall #9: Partial feed content (flag truncated items, check for content:encoded)

**Implements (from ARCHITECTURE.md):**
- Agent context injection pattern
- Query layer for agent access to feed items

**Research flag:** Needs light research — Agent prompt engineering for optimal feed context injection (format, token limits, relevance scoring).

### Phase 4: AI Enrichment (Intelligence)

**Rationale:** Add AI-powered categorization, sentiment analysis, and summarization to improve content quality and reduce agent token consumption. This phase can run asynchronously without blocking core sync.

**Delivers:**
- Background AI processing (separate cron processes new items)
- Auto-categorization (LLM-based topic extraction)
- Sentiment analysis (positive/neutral/negative tagging)
- AI-generated summaries (reduce context window usage)
- Relevance scoring (0-100 for domain fit)

**Addresses (from FEATURES.md):**
- AI-powered categorization (route to appropriate agents)
- Sentiment analysis (brand mention tone understanding)
- Summary generation (token reduction for agent context)

**Avoids (from PITFALLS.md):**
- Anti-Pattern #4: AI processing during sync (two-phase approach: sync first, enrich later)

**Tech decisions:**
- Reuse existing Claude API integration from AMD
- Process items in batches to control costs
- Mark items as `processed` to avoid reprocessing

**Research flag:** Standard patterns — AI summarization and classification are established use cases in AMD; leverage existing prompt patterns.

### Phase 5: Brand Monitoring & Alerts (Operations)

**Rationale:** Implement real-time monitoring for brand mentions and critical keywords. This phase supports AMD's brand monitoring use case specifically.

**Delivers:**
- Priority keyword alerting (brand mentions, competitor terms)
- Notification system integration (Slack, email, internal alerts)
- Trend detection across feeds (topic frequency analysis)
- Feed trust scoring (track source quality over time)

**Addresses (from FEATURES.md):**
- Brand mention alerting
- Trend detection
- Feed trust scoring

**Avoids:**
- Anti-Feature: Real-time push notifications (batch processing sufficient for daily sync cadence)

**Research flag:** Needs research — Notification system architecture, alert fatigue prevention strategies, trend detection algorithms for marketing content.

### Phase 6: Advanced Features (Polish)

**Rationale:** Add nice-to-have features that improve quality but aren't critical for core functionality. These can be deferred or implemented incrementally based on usage feedback.

**Delivers:**
- Full-text extraction for truncated feeds (web scraping)
- Semantic deduplication (embedding-based similarity)
- HTTP conditional GET (ETag/Last-Modified caching)
- Admin UI for feed management (add/edit/pause feeds)
- OPML export (backup and portability)

**Addresses (from FEATURES.md):**
- Full-text extraction
- Semantic deduplication
- OPML import/export

**Avoids (from PITFALLS.md):**
- Pitfall #11: Fetching unchanged feeds (conditional GET optimization)
- Pitfall #10: Hardcoded feed config (admin UI for dynamic management)

**Research flag:** Needs research — Web scraping strategies, readability algorithms, legal/compliance considerations for full-text extraction.

### Phase Ordering Rationale

- **Foundation first (Phase 1)**: Solve critical pitfalls before scaling. Composite key deduplication and lenient parsing must be correct from day one or you'll rewrite later.
- **Scale second (Phase 2)**: Fan-out architecture enables 10-100+ feeds without code changes. Rate limiting and health monitoring prevent operational fires.
- **Integration third (Phase 3)**: No point collecting content if agents can't access it. Basic keyword filtering here enables brand monitoring use case.
- **Intelligence fourth (Phase 4)**: AI enrichment improves quality but isn't blocking. Two-phase approach (sync then enrich) keeps sync fast and cheap.
- **Monitoring fifth (Phase 5)**: Brand alerts deliver immediate value once basic integration works. Trend detection builds on categorization from Phase 4.
- **Polish last (Phase 6)**: Full-text extraction and semantic deduplication are nice-to-have; defer until core system proves valuable.

**Dependency flow:**
```
Phase 1 (Foundation)
    ├─> Phase 2 (Multi-Feed) — depends on: core sync engine
    │       ├─> Phase 3 (Agent Integration) — depends on: scaled feed collection
    │       │       ├─> Phase 4 (AI Enrichment) — depends on: agent access patterns
    │       │       │       ├─> Phase 5 (Brand Monitoring) — depends on: categorization
    │       │       │       │       └─> Phase 6 (Advanced Features) — depends on: usage feedback
```

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Agent Integration):** Prompt engineering for feed context injection — optimal format, token budget, relevance scoring heuristics
- **Phase 5 (Brand Monitoring):** Notification architecture — alert fatigue prevention, escalation rules, Slack/email integration patterns
- **Phase 6 (Full-Text Extraction):** Web scraping strategies — readability algorithms (Mozilla Readability vs Newspaper3k), legal compliance, site-specific handling

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** RSS parsing is well-documented; Feedsmith docs + examples sufficient
- **Phase 2 (Multi-Feed):** Serverless fan-out is established pattern; Convex docs cover scheduler usage
- **Phase 4 (AI Enrichment):** AMD already has Claude integration; reuse existing summarization/classification patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Feedsmith verified via official docs, npm package inspection, GitHub activity. Convex patterns verified via official docs and existing AMD codebase inspection. |
| Features | HIGH | Multiple authoritative sources (Zapier, DevOpsSchool) agree on RSS aggregator table stakes. AI-powered features validated via existing implementations (RSSbrew, n8n workflows). |
| Architecture | HIGH | Patterns verified via Convex official docs, best practices guide, and direct inspection of AMD's existing `actions.ts`, `crons.ts`, `schema.ts` codebase. Fan-out pattern is standard serverless approach. |
| Pitfalls | HIGH | GUID unreliability confirmed by RSS Board and GitHub issues. Action timeout limits verified via Convex official docs. Malformed XML documented by feedparser, Superfeedr, MDN. Rate limiting is standard HTTP practice. |

**Overall confidence:** HIGH

All four research areas have authoritative sources (official documentation, verified implementations, direct codebase inspection). The stack is proven serverless-safe (Feedsmith explicitly designed for edge/serverless), the architecture follows established AMD patterns (verified via code inspection), and pitfalls are well-documented with clear mitigation strategies.

### Gaps to Address

- **Date parsing edge cases:** While dayjs is recommended for robust date parsing, need to validate specific RSS date formats encountered in target feeds during Phase 1 testing. Fallback strategy (use current time) may cause ordering issues for feeds with missing pubDate.

- **Feed discovery and validation:** Research doesn't cover how AMD will discover and validate new feeds before adding them (e.g., checking feed validity, detecting format, testing parse success). Should establish feed onboarding process during Phase 2 planning.

- **Token cost estimation:** AI enrichment (Phase 4) will consume Claude API tokens for summarization/categorization. Need to estimate cost per feed item and establish budget alerts during Phase 4 planning.

- **Full-text extraction legality:** Phase 6 full-text extraction involves web scraping which has legal/compliance implications (ToS violations, copyright). Consult legal before implementing; may need user-agent transparency, rate limiting, robots.txt respect.

- **Semantic deduplication threshold:** Research suggests 85% similarity threshold for semantic deduplication but doesn't provide validation. Need to experiment with actual feed data during Phase 6 to tune threshold and avoid false positives.

## Sources

### Primary (HIGH confidence)
- [Feedsmith npm package](https://www.npmjs.com/package/feedsmith) — Version 2.8.0, maintenance status, TypeScript support verification
- [Feedsmith Quick Start](https://feedsmith.dev/quick-start) — Official usage examples, API reference
- [Feedsmith GitHub](https://github.com/macieklamberski/feedsmith) — Source code inspection, issue tracker, recent commits
- [Convex Actions Documentation](https://docs.convex.dev/functions/actions) — Action execution model, timeout limits, fetch availability
- [Convex Cron Jobs Documentation](https://docs.convex.dev/scheduling/cron-jobs) — Scheduling patterns, skip behavior, orchestration examples
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) — Mutation-action patterns, batch operations
- AMD existing codebase (`actions.ts`, `crons.ts`, `schema.ts`, `CLAUDE.md`) — Verified architectural patterns via direct file inspection

### Secondary (MEDIUM confidence)
- [Zapier Best RSS Readers 2026](https://zapier.com/blog/best-rss-feed-reader-apps/) — Feature comparison, table stakes identification
- [DevOpsSchool RSS Aggregator Comparison](https://www.devopsschool.com/blog/top-10-rss-aggregators-features-pros-cons-comparison/) — Market analysis, expected features
- [RSSbrew GitHub](https://github.com/yinan-c/RSSbrew) — AI summarization implementation example
- [Auto-News GitHub](https://github.com/finaldie/auto-news) — Multi-source LLM aggregator patterns
- [feedparser Documentation](https://feedparser.readthedocs.io/) — Content normalization, HTML sanitization approaches
- [RSS Board on GUIDs](https://www.rssboard.org/news/217/unique-and-use-rss-guid-like-everybody) — GUID reliability discussion
- [MDN HTTP 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) — Rate limiting best practices
- [Superfeedr Debugging Feeds](https://blog.superfeedr.com/debugging-rss-feeds/) — Common feed parsing issues
- [RSSHub Date Handling](https://docs.rsshub.app/joinus/advanced/pub-date) — Date parsing strategies
- [Brand24 Brand Monitoring](https://brand24.com/blog/brand-monitoring-tools/) — Brand monitoring feature reference

### Tertiary (LOW confidence, needs validation)
- [Raymond Camden: Building RSS Parser with Cloudflare Workers](https://www.raymondcamden.com/2023/10/31/building-a-generic-rss-parser-service-with-cloudflare-workers) — rss-parser XMLHttpRequest issues (2023 article, may be dated)
- [Apify RSS Aggregator](https://apify.com/primeparse/rss-aggregator) — AI summarization approach (commercial product, not verified implementation)
- [FiveFilters Full-Text RSS](https://www.fivefilters.org/full-text-rss/) — Full-text extraction service (mentioned for Phase 6 consideration)

---
*Research completed: 2026-01-27*
*Ready for roadmap: yes*
