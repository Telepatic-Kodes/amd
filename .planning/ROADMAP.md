# Roadmap: AMD RSS Feed Integration

**Version:** v1.0
**Created:** 2026-01-27
**Phases:** 6

## Milestone Overview

```
Phase 1 (Foundation) ──┐
                       ├── Phase 2 (Scale) ──┐
                       │                      ├── Phase 3 (Integration) ──┐
                       │                      │                            ├── Phase 4 (Intelligence)
                       │                      │                            │          │
                       │                      │                            │          ├── Phase 5 (Monitoring)
                       │                      │                            │          │          │
                       │                      │                            │          │          └── Phase 6 (Polish)
```

---

## Phase 1: Core Feed Sync Engine (Foundation)

**Goal:** Establish reliable single-feed syncing with robust parsing and deduplication.

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Foundation setup (Feedsmith + database schema)
- [ ] 01-02-PLAN.md — Core utilities (hash + validation)
- [ ] 01-03-PLAN.md — Sync engine (fetchFeed + storeFeedItems)

**Rationale:** Solve critical pitfalls (GUID unreliability, malformed XML) before scaling. Composite key deduplication must be correct from day one.

### Deliverables

1. Database schema in `convex/schema.ts`:
   - `feeds` table (feedId, url, name, category, status, syncFrequency, lastSyncAt)
   - `feedItems` table (feedId, contentHash, title, link, content, publishedAt)
   - `feedSyncLog` table (feedId, syncedAt, itemsAdded, errorMessage)

2. Core sync action in `convex/feeds/`:
   - `fetchFeed.ts` — Single-feed fetch with Feedsmith parsing
   - `storeFeedItems.ts` — Mutation for atomic item storage
   - Composite key generation: `SHA-256(feedUrl + (guid || link) + pubDate + title)`

3. Lenient XML parsing:
   - Feedsmith with error recovery
   - Validation layer (must have title/description + link/guid)
   - UTF-8 normalization

4. Basic health tracking:
   - `lastSyncAt`, `consecutiveErrors`, `status` fields
   - Sync log per execution

### Requirements Covered

- FEED-02, FEED-06
- SYNC-02, SYNC-03, SYNC-06, SYNC-07
- STOR-01, STOR-02, STOR-03, STOR-04, STOR-05

### Tech Decisions

- Install `feedsmith@^2.8.0` (one dependency)
- Use native `fetch` in Convex actions
- Use Web Crypto API for SHA-256 hashing

### Success Criteria

- [ ] Schema deployed with 3 new tables
- [ ] Single feed syncs successfully end-to-end
- [ ] Duplicates prevented via contentHash
- [ ] Malformed XML handled gracefully (logged, not crashed)
- [ ] Sync log records each execution

### Research Flag

**Standard patterns** — Feedsmith docs sufficient, no additional research needed.

---

## Phase 2: Multi-Feed Orchestration (Scale)

**Goal:** Expand to multiple feeds using fan-out architecture to prevent action timeouts.

**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md — Feed CRUD mutations + public queries
- [ ] 02-02-PLAN.md — Fan-out orchestration + cron jobs
- [ ] 02-03-PLAN.md — Rate limiting with exponential backoff
- [ ] 02-04-PLAN.md — Dashboard UI (/feeds page)
- [ ] 02-05-PLAN.md — End-to-end verification checkpoint

**Rationale:** Fan-out pattern (one action per feed) enables 10-100+ feeds without timeout issues.

### Deliverables

1. Orchestrator system:
   - `scheduleFeedSync.ts` — Mutation that schedules individual feed actions
   - `syncAllFeeds.ts` — Cron-triggered orchestrator
   - Fan-out: separate action per feed

2. Rate limiting:
   - HTTP 429 detection with `Retry-After` header
   - Exponential backoff (1s, 2s, 4s, 8s)
   - Staggered fetches (spread over time window)

3. Dashboard UI components:
   - Feed list view (`/feeds` page)
   - Add feed form with validation
   - Feed status indicators (active, paused, error)
   - Manual sync trigger button

4. Feed management mutations:
   - `addFeed`, `updateFeed`, `deleteFeed`, `pauseFeed`

### Requirements Covered

- FEED-01, FEED-03, FEED-04, FEED-05
- SYNC-01, SYNC-04, SYNC-05
- DASH-01, DASH-02, DASH-03, DASH-04

### Tech Decisions

- Use Convex scheduler for fan-out (`ctx.scheduler.runAfter`)
- Daily cron at 6:00 UTC
- 30-second timeout per individual feed fetch

### Success Criteria

- [ ] 10+ feeds sync without timeout
- [ ] Individual feed failures don't block others
- [ ] Dashboard shows all feeds with status
- [ ] Manual sync works from UI
- [ ] Rate limiting prevents 429 bans

### Research Flag

**Standard patterns** — Convex scheduler patterns established.

---

## Phase 3: Agent Integration (Connection)

**Goal:** Connect feed content to existing AMD agent system.

**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — Schema update (search index) + agent feed query
- [ ] 03-02-PLAN.md — executeAgent modification with feed context injection

**Rationale:** Make feed data useful by injecting into agent contexts at execution time.

### Deliverables

1. Agent context injection:
   - Modify `executeAgent` action in `convex/actions.ts`
   - Query relevant feed items by topic/keyword
   - Inject as structured context in systemPrompt

2. Relevance querying:
   - Filter by keywords (include/exclude lists)
   - Filter by date range (last 7 days default)
   - Filter by category (industry, competitor, technical)

3. Feed tool registration:
   - Add `"feeds"` option to agent config.tools
   - Enable per-agent feed access control

4. Usage tracking:
   - `feedItemsUsed` field on executions table
   - Link consumed items to agent execution logs

### Requirements Covered

- AGNT-01, AGNT-02, AGNT-03, AGNT-04, AGNT-05, AGNT-06, AGNT-07

### Tech Decisions

- Context injection format: Structured text with title, summary, link, date
- Token budget: ~2000 tokens for feed context (5 items max)
- Relevance: Convex text search with BM25 ranking
- Search index on feedItems.title with feedId filter

### Success Criteria

- [ ] Content agents receive relevant feed items
- [ ] Social agents can curate from feeds
- [ ] SEO agents monitor competitor content
- [ ] Usage tracking links items to executions
- [ ] Keyword filtering works accurately

### Research Flag

**Research complete** — See 03-RESEARCH.md for implementation patterns.

---

## Phase 4: AI Enrichment (Intelligence)

**Goal:** Add AI-powered categorization, sentiment, and summarization.

**Plans:** 3 plans

Plans:
- [ ] 04-01-PLAN.md — Schema updates + enrichment queries/mutations
- [ ] 04-02-PLAN.md — Core enrichment action with Claude Haiku 4.5
- [ ] 04-03-PLAN.md — Cron integration + batch processing

**Rationale:** Improve content quality and reduce agent token consumption.

### Deliverables

1. Background enrichment processor:
   - Separate cron for AI processing (post-sync)
   - Process unprocessed items in batches
   - Mark items as `processed: true`

2. AI features:
   - Topic extraction (auto-categorization)
   - Sentiment analysis (positive/neutral/negative)
   - Summary generation (100-200 word summaries)
   - Relevance scoring (0-100 for domain fit)

3. Schema updates:
   - Add `topics`, `sentiment`, `summary`, `relevanceScore` to feedItems
   - Add `processed` flag for enrichment status

### Requirements Covered

- ENRCH-01, ENRCH-02, ENRCH-03, ENRCH-04

### Tech Decisions

- Reuse existing Claude API integration
- Batch size: 10 items per API call
- Cost control: process only high-relevance items first

### Success Criteria

- [ ] Items have auto-generated topics
- [ ] Sentiment tagged accurately
- [ ] Summaries reduce context size
- [ ] Enrichment doesn't block sync
- [ ] Token costs stay within budget

### Research Flag

**Research complete** — See 04-RESEARCH.md for implementation patterns.

---

## Phase 5: Brand Monitoring & Alerts (Operations)

**Goal:** Implement priority alerting for brand mentions and trends.

**Rationale:** Support AMD's brand monitoring use case specifically.

### Deliverables

1. Keyword monitoring:
   - Priority keyword configuration (brand names, competitors)
   - Real-time detection during sync
   - Alert generation for matches

2. Notification system:
   - Alert storage in new `alerts` table
   - Dashboard alert view
   - (Optional) Slack/email integration

3. Trend detection:
   - Topic frequency analysis across feeds
   - Rising topic identification
   - Weekly trend summary

4. Feed trust scoring:
   - Track accuracy over time
   - Quality metrics (content completeness, update frequency)
   - Surface low-quality feeds for review

### Requirements Covered

- MNTR-01, MNTR-02, MNTR-03

### Tech Decisions

- Alert fatigue prevention: group similar alerts
- Trend window: 7-day rolling
- Trust score: 0-100 based on sync success rate + content quality

### Success Criteria

- [ ] Brand mentions trigger alerts
- [ ] Trends visible in dashboard
- [ ] Feed trust scores calculated
- [ ] No alert fatigue (grouped/prioritized)

### Research Flag

**Needs research** — Notification architecture, alert fatigue prevention.

---

## Phase 6: Advanced Features (Polish)

**Goal:** Add nice-to-have features based on usage feedback.

**Rationale:** Defer until core system proves valuable.

### Deliverables

1. Full-text extraction:
   - Detect truncated content
   - Web scraping for full article (with legal compliance)
   - Readability parsing (extract main content)

2. HTTP optimization:
   - Conditional GET (ETag, Last-Modified)
   - Skip unchanged feeds

3. Admin improvements:
   - OPML import for bulk feed onboarding
   - OPML export for backup
   - Advanced feed management UI

4. Semantic deduplication:
   - Embedding-based similarity detection
   - Near-duplicate identification (85% threshold)

### Requirements Covered

- ADV-01, ADV-02, ADV-03, ADV-04, ADV-05, ADV-06 (v2)

### Tech Decisions

- Full-text: evaluate Readability.js vs custom
- Embeddings: evaluate cost/benefit of vector DB

### Success Criteria

- [ ] Truncated feeds have full content
- [ ] Conditional GET reduces bandwidth
- [ ] OPML import/export functional
- [ ] Near-duplicates detected

### Research Flag

**Needs research** — Web scraping legal compliance, embedding strategies.

---

## Phase Dependencies

```
Phase 1 ──────────────────────────────────────────────────────────────►
         └──► Phase 2 ────────────────────────────────────────────────►
                       └──► Phase 3 ──────────────────────────────────►
                                     └──► Phase 4 ────────────────────►
                                                   └──► Phase 5 ──────►
                                                                └──► Phase 6
```

| Phase | Depends On | Reason |
|-------|------------|--------|
| Phase 2 | Phase 1 | Fan-out requires working single-feed sync |
| Phase 3 | Phase 2 | Agent integration needs multiple feeds available |
| Phase 4 | Phase 3 | AI enrichment prioritizes based on agent usage |
| Phase 5 | Phase 4 | Brand monitoring uses categorization data |
| Phase 6 | Phase 5 | Polish based on operational feedback |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| GUID unreliability causes duplicates | HIGH | Composite key from Phase 1 |
| Action timeout with many feeds | HIGH | Fan-out pattern from Phase 2 |
| Malformed XML crashes parser | MEDIUM | Lenient parsing + validation |
| Rate limiting blocks IP | MEDIUM | 429 handling + exponential backoff |
| Token costs exceed budget | MEDIUM | Batch processing + cost alerts |
| Full-text extraction legal issues | LOW | Legal review before Phase 6 |

---
*Roadmap created: 2026-01-27*
*Last updated: 2026-01-28 after phase 3 planning*
