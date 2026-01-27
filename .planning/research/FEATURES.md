# Feature Landscape: RSS Feed Aggregation for AI Agents

**Domain:** RSS feed aggregation for AI agent content consumption
**Researched:** 2026-01-27
**Use Case:** AI Marketing Department (AMD) with 37 agents needing fresh content for inspiration, trend curation, and brand monitoring
**Sync Frequency:** Daily

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-feed subscription** | Core purpose of any aggregator | Low | Support RSS 2.0, Atom, RSS 1.0 (RDF) formats |
| **Feed parsing with error tolerance** | Many feeds have encoding issues, malformed XML | Medium | Use fault-tolerant parser; normalize to UTF-8 |
| **Content normalization** | Different feed formats (RSS/Atom) should expose consistent fields | Medium | Map all formats to unified schema (title, link, content, date, author) |
| **Persistent storage** | Must not re-fetch same items repeatedly | Low | Store fetched items with unique identifiers (GUID or URL hash) |
| **Deduplication** | Same story appears in multiple feeds | Medium | GUID-based + URL-based + title+date fallback |
| **OPML import/export** | Standard for feed list portability | Low | Industry standard; users expect it |
| **Scheduled fetching** | Automated background updates | Low | Daily cadence fits use case; configurable per-feed |
| **Basic keyword filtering** | Filter items by include/exclude keywords | Low | Essential for brand monitoring use case |
| **Feed health tracking** | Know when feeds go stale or break | Medium | Track last success, error count, staleness threshold |
| **Structured output format** | Machine-readable output for AI consumption | Low | JSON output required; not human-readable HTML |

### Table Stakes Rationale for AI Agent Use Case

Unlike human-facing RSS readers, AI agents do not need:
- Pretty reading UI
- Offline reading capability
- Browser extensions

AI agents DO need:
- Clean, structured data (JSON, not HTML rendering)
- Consistent schema across all feeds
- Programmatic access (API or database queries)
- Metadata preservation (publication date critical for freshness)

---

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Full-text extraction** | Many feeds provide only excerpts; fetch full article content | High | Requires web scraping; use heuristics or readability algorithms |
| **AI-powered categorization** | Auto-tag content by topic for agent routing | High | Use embeddings or LLM classification; map to agent specialties |
| **Semantic deduplication** | Catch similar stories even with different titles | High | Requires embeddings; cluster similar content |
| **Content quality scoring** | Rank articles by originality, substance | High | Use heuristics (length, links, sentiment) or LLM evaluation |
| **Feed trust scoring** | Learn which sources provide valuable content over time | Medium | Track engagement metrics, originality, consistency |
| **Multi-page article joining** | Combine paginated articles into single entry | Medium | Detect pagination patterns, fetch all pages |
| **Newsletter integration** | Subscribe to email newsletters as feeds | Medium | Email-to-RSS conversion; parse email content |
| **Change detection for non-RSS sources** | Monitor pages that lack RSS feeds | High | Web scraping + diff detection; compliance considerations |
| **Trend detection** | Identify trending topics across feeds | High | Requires topic modeling, frequency analysis |
| **Brand mention alerting** | Real-time alerts for brand/keyword mentions | Medium | Priority queue for high-interest keywords |
| **Sentiment analysis** | Tag content as positive/negative/neutral | Medium | LLM-based or rule-based sentiment scoring |
| **Summary generation** | AI-generated summaries for quick agent consumption | Medium | LLM integration; useful for agent context windows |
| **Source attribution tracking** | Track which feeds provide most value to agents | Low | Analytics on content usage by downstream agents |

### Differentiator Prioritization for AMD Use Case

**High Value for Marketing AI:**
1. **AI-powered categorization** - Route content to appropriate agents (trend curator vs brand monitor vs inspiration seeker)
2. **Brand mention alerting** - Critical for brand monitoring agents
3. **Sentiment analysis** - Understand tone of brand mentions
4. **Summary generation** - Reduce token usage in agent context

**Medium Value:**
5. **Full-text extraction** - Some feeds truncate; agents need full content
6. **Trend detection** - Supports trend curation use case

**Lower Priority:**
7. **Semantic deduplication** - Nice but GUID dedup covers most cases
8. **Feed trust scoring** - Useful over time but not MVP critical

---

## Anti-Features

Features to explicitly NOT build for v1. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Human-facing reader UI** | Adds complexity; agents don't need it | Expose data via API/database; build admin UI only for feed management |
| **Real-time push notifications** | Daily sync is sufficient; adds infrastructure complexity | Batch processing on schedule; alerts can be async |
| **Social media integration** | Scope creep; social APIs are unstable, rate-limited | Keep focus on RSS; social monitoring is a separate product |
| **User accounts and multi-tenancy** | Single deployment for AMD team; adds auth complexity | Single-tenant design; add auth later if needed |
| **Mobile app** | AI agents are server-side; no mobile use case | API-first design serves agents directly |
| **Browser extension** | Human convenience feature; not relevant for agent consumption | Skip entirely |
| **Sync across devices** | No devices; agents run server-side | Not applicable |
| **Commenting/social features** | Content is consumed by AI, not discussed by humans | Skip entirely |
| **Podcast/video handling** | Different media type; different processing requirements | Focus on text content; media is separate milestone |
| **Offline reading** | Server-side agents have network access | Not applicable |
| **Complex folder hierarchies** | Agents need flat, queryable access, not nested folders | Simple tag/category system instead |
| **Per-user customization** | Single system serving agent pool | Global configuration is sufficient |

### Anti-Feature Rationale

The biggest mistake would be building a traditional RSS reader with a pretty UI when the consumers are AI agents. This would:
- Waste development time on UI that nobody uses
- Miss critical features like structured output and API access
- Add complexity for syncing, offline, mobile that have no use case

**Design principle:** Build a content ingestion pipeline with admin tooling, not a consumer product.

---

## Feature Dependencies

```
Feed Subscription (core)
    |
    +-- Feed Parsing --> Content Normalization --> Persistent Storage
    |                           |
    |                           +-- Deduplication (requires storage)
    |
    +-- Scheduled Fetching (requires subscription + storage)
    |
    +-- Feed Health Tracking (requires scheduled fetching history)

Keyword Filtering (requires parsed content)
    |
    +-- Brand Mention Alerting (extension of filtering)

AI Features (require stored, normalized content):
    |
    +-- Categorization
    +-- Sentiment Analysis
    +-- Summary Generation
    +-- Trend Detection (requires categorization + time series)

Full-Text Extraction (independent, enhances content)
    |
    +-- Requires: web scraping capability
    +-- Enables: better AI analysis
```

### Dependency Summary

1. **Foundation:** Subscription + Parsing + Storage + Deduplication
2. **Layer 2:** Scheduled fetching, health tracking, keyword filtering
3. **Layer 3:** AI enrichment (categorization, sentiment, summaries)
4. **Layer 4:** Advanced analytics (trends, trust scoring)

---

## MVP Recommendation

For MVP serving AI Marketing Department agents with daily sync:

### Must Have (Phase 1)
1. **Multi-feed subscription with OPML import** - Quick onboarding of feed lists
2. **Robust feed parsing** - Handle RSS 2.0, Atom, common encoding issues
3. **Content normalization** - Unified schema for agent consumption
4. **Persistent storage with deduplication** - GUID + URL-based
5. **Scheduled daily fetching** - Cron-based, configurable
6. **Structured JSON output/API** - Agents query for new content
7. **Basic keyword filtering** - Include/exclude lists
8. **Feed health dashboard** - Know when feeds break

### Should Have (Phase 2)
9. **Brand mention alerting** - Priority notifications for monitored terms
10. **AI categorization** - Route content to appropriate agents
11. **Sentiment analysis** - Understand tone of mentions
12. **Summary generation** - Reduce agent token consumption

### Could Have (Phase 3)
13. **Full-text extraction** - Fetch complete articles from truncated feeds
14. **Trend detection** - Identify hot topics across feeds
15. **Feed trust scoring** - Learn source quality over time

### Defer to Post-MVP
- Human-facing reader UI (build admin only)
- Social media monitoring (different product)
- Podcast/video handling (different media type)
- Multi-tenancy (not needed for single team)

---

## Complexity Estimates

| Feature | Complexity | Effort | Risk |
|---------|------------|--------|------|
| Feed parsing + normalization | Medium | 2-3 days | Medium - encoding edge cases |
| OPML import | Low | 0.5 day | Low |
| Deduplication | Medium | 1-2 days | Low |
| Scheduled fetching | Low | 1 day | Low |
| Keyword filtering | Low | 1 day | Low |
| Feed health tracking | Medium | 1-2 days | Low |
| AI categorization | High | 3-5 days | Medium - needs tuning |
| Sentiment analysis | Medium | 2-3 days | Low - well-understood |
| Summary generation | Medium | 2-3 days | Low - LLM integration |
| Full-text extraction | High | 3-5 days | High - site-specific issues |
| Trend detection | High | 4-6 days | Medium - algorithm design |

---

## Sources

### RSS Aggregator Features (HIGH confidence - multiple sources agree)
- [Zapier Best RSS Readers 2026](https://zapier.com/blog/best-rss-feed-reader-apps/)
- [DevOpsSchool RSS Aggregator Comparison](https://www.devopsschool.com/blog/top-10-rss-aggregators-features-pros-cons-comparison/)
- [VPNTierLists RSS Comparison Guide](https://vpntierlists.com/blog/best-rss-feed-readers-2025-complete-comparison-guide)

### AI-Powered RSS Features (MEDIUM confidence)
- [RSSbrew GitHub](https://github.com/yinan-c/RSSbrew) - Self-hosted AI summarization
- [Auto-News GitHub](https://github.com/finaldie/auto-news) - Multi-source LLM aggregator
- [Apify RSS Aggregator](https://apify.com/primeparse/rss-aggregator) - AI-powered summarization
- [n8n RSS AI Workflow](https://n8n.io/workflows/4503-automate-rss-content-with-ai-summarize-notify-and-archive/)

### Feed Parsing & Technical Issues (HIGH confidence)
- [Feedparser Documentation](https://pythonhosted.org/feedparser/content-normalization.html)
- [Superfeedr Debugging Feeds](https://blog.superfeedr.com/debugging-rss-feeds/)
- [MoldStud RSS Development Problems](https://moldstud.com/articles/p-solving-common-rss-development-problems-tips-and-tricks)

### Content Extraction (MEDIUM confidence)
- [FiveFilters Full-Text RSS](https://www.fivefilters.org/full-text-rss/)
- [Apify RSS/XML Scraper](https://apify.com/jupri/rss-xml-scraper)

### Brand Monitoring Features (HIGH confidence)
- [Brand24 Brand Monitoring](https://brand24.com/blog/brand-monitoring-tools/)
- [BrandMentions](https://brandmentions.com/)
- [Talkwalker Alerts](https://www.talkwalker.com/alerts)

### Feed Health Monitoring (MEDIUM confidence)
- [RSS Gizmos Feed Freshness Checker](https://rssgizmos.com/feedage.html)
- [Botster RSS Monitor](https://botster.io/bots/rss-monitoring)
- [Distill Feed Monitor](https://distill.io/docs/web-monitor/feed-monitor/)

---

## Quality Gate Checklist

- [x] Categories are clear (table stakes vs differentiators vs anti-features)
- [x] Complexity noted for each feature
- [x] Dependencies between features identified
- [x] Prioritized for AI agent consumption use case (not human reader use case)
