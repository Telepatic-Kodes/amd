# Phase 5: Brand Monitoring - Research

**Researched:** 2026-01-29
**Domain:** Brand mention detection, competitor tracking, alert systems for RSS feeds
**Confidence:** HIGH

## Summary

This phase adds brand monitoring capabilities to the RSS feed system, enabling detection of brand/company mentions, competitor tracking, and alerting on high-relevance items. The key challenge is balancing detection accuracy with cost and complexity while aligning with the existing batch processing pattern.

The project already has AI enrichment infrastructure (Phase 4) with Claude Haiku 4.5 for classification, structured outputs for reliable JSON, and cron-based batch processing. For brand monitoring, the recommendation is to extend the existing enrichment pipeline with brand/competitor detection rather than building a separate system.

**Primary recommendation:** Extend the enrichment schema with `brandMentions` (array of detected brands) and `competitorMentions` (array of competitors), use semantic detection via Claude prompt rather than string matching to handle variations/context, and implement batched daily digest alerts rather than real-time notifications to align with existing cron pattern.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Haiku 4.5 | claude-haiku-4-5-20250514 | Brand/competitor detection via NER | Already used for enrichment, cost-effective for classification |
| Structured Outputs | structured-outputs-2025-11-13 | Guaranteed JSON for brand detection | Already integrated in Phase 4 enrichment |
| Convex scheduler | Built-in | Batch alert processing | Already used for sync/enrichment crons |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Convex email (planned) | Built-in | Alert delivery | For v1 digest notifications |
| Convex indexes | Built-in | Query high-relevance items | Filter items for alerting |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Semantic LLM detection | String matching (regex) | String matching is cheaper but misses context (e.g., "Apple" fruit vs brand), fails on variations/misspellings |
| Batched daily digest | Real-time alerts (webhooks) | Real-time adds infrastructure complexity, contradicts existing batch pattern, creates alert fatigue |
| Extend enrichment | Separate monitoring system | Separate system duplicates processing, increases token costs, harder to maintain |
| Configurable brand list | Hard-coded brands | Hard-coded is simpler for v1, add configuration in v2 when needs clear |

**Installation:**
```bash
# No new dependencies - extends existing enrichment infrastructure
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── enrichment/
│   ├── prompts.ts            # Modified: Add brand/competitor detection to schema
│   ├── processItems.ts       # Modified: Extract brand mentions from enrichment
│   ├── mutations.ts          # Modified: Store brandMentions/competitorMentions
│   └── ...existing files
├── monitoring/
│   ├── index.ts              # Re-exports
│   ├── queries.ts            # Get brand/competitor mentions for alerts
│   ├── mutations.ts          # Store alert digest records
│   ├── alertDigest.ts        # action: Generate daily digest
│   └── config.ts             # Brand/competitor configuration
├── crons.ts                  # Add daily alert digest cron
└── schema.ts                 # Add brandMentions/competitorMentions to feedItems, new alertDigests table
```

### Pattern 1: Semantic Brand Detection via LLM (Recommended)

**What:** Use Claude to detect brand mentions in context, avoiding false positives from string matching.

**When to use:** Always for v1 - handles variations, context, and misspellings automatically.

**Example:**
```typescript
// Source: Adapted from Phase 4 enrichment pattern + NER best practices
// In convex/enrichment/prompts.ts

export const ENRICHMENT_SCHEMA = {
  type: "object",
  properties: {
    // Existing fields
    topics: { type: "array", items: { type: "string" } },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    summary: { type: "string" },
    relevanceScore: { type: "integer" },

    // NEW: Brand monitoring fields
    brandMentions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          brand: { type: "string", description: "Brand/company name mentioned" },
          context: { type: "string", description: "How it was mentioned (subject/example/competitor)" }
        },
        required: ["brand", "context"]
      },
      description: "Any brands or company names mentioned in the content"
    },
    competitorMentions: {
      type: "array",
      items: { type: "string" },
      description: "Competitors mentioned (from provided list)"
    }
  },
  required: ["topics", "sentiment", "summary", "relevanceScore", "brandMentions", "competitorMentions"],
  additionalProperties: false,
} as const;

export const ENRICHMENT_SYSTEM_PROMPT = `You are a marketing content analyst for a B2B SaaS company. Analyze feed content and provide structured metadata.

Guidelines:
- topics: Extract 3-5 relevant tags. Use lowercase, no hashtags. Focus on marketing, industry, and business topics.
- sentiment: Determine if the content is positive (good news, success), negative (problems, failures), or neutral (informational).
- summary: Write a concise 100-200 word summary. Focus on actionable insights for marketing teams.
- relevanceScore: Rate 0-100 for marketing relevance (see detailed rubric below)
- brandMentions: Detect ANY brand or company names mentioned. For each, note:
  - brand: The company/product name as mentioned
  - context: How it's discussed - "subject" (main topic), "example" (case study/reference), "competitor" (comparison)
- competitorMentions: From the competitor list provided, identify which competitors are mentioned.

IMPORTANT for brand detection:
- Include both explicit mentions and variations (e.g., "AWS", "Amazon Web Services")
- Consider context: "Apple" as tech company vs fruit
- Detect misspellings and abbreviations
- Flag indirect references (e.g., "the search giant" → Google if clear from context)

Competitor list (detect if mentioned):
{{COMPETITOR_LIST}}

Be consistent and accurate. This data feeds into automated brand monitoring systems.`;

// In convex/monitoring/config.ts
export const BRAND_CONFIG = {
  // Primary brand (your company)
  primaryBrand: {
    name: "Your Company",
    variations: ["YourCo", "YC", "Your Company Inc"],
  },

  // Products to track
  products: [
    { name: "Product A", variations: ["ProductA", "Prod-A"] },
    { name: "Product B", variations: ["ProductB", "Prod-B"] },
  ],

  // Competitors to track
  competitors: [
    "Competitor A",
    "Competitor B",
    "Competitor C",
    "Industry Leader X"
  ],

  // Alert thresholds
  alertThresholds: {
    highRelevance: 80,        // Items scoring 80+ always included in digest
    brandMentionRelevance: 60, // Brand mentions with score 60+ included
  }
} as const;

// Build competitor list for prompt injection
export function buildCompetitorList(): string {
  return BRAND_CONFIG.competitors.map((c, i) => `${i + 1}. ${c}`).join('\n');
}
```

**Why semantic over string matching:**
- Handles context: "Apple announces new product" (tech) vs "An apple a day" (fruit)
- Catches variations: "AWS" = "Amazon Web Services" = "Amazon's cloud platform"
- Detects misspellings: "Salesforce" vs "SalesForce" vs "sales force"
- Reduces false positives: Understands when brand is example vs subject vs competitor
- No regex maintenance: LLM adapts to new mention patterns automatically

**Sources:**
- [More Query Understanding: Brand Detection with LLMs](https://opensourceconnections.com/blog/2024/06/26/more-query-understanding-brand-detection-with-llms/)
- [Entity Resolution: Fix Brand Hallucinations in LLMs](https://searchatlas.com/blog/entity-resolution-fix-brand-hallucinations-llms-2026/)

### Pattern 2: Batched Daily Digest (Recommended over Real-Time)

**What:** Process brand mentions once daily, send consolidated email digest with high-priority items.

**When to use:** Always for v1 - aligns with existing batch pattern, reduces alert fatigue.

**Example:**
```typescript
// Source: Adapted from Convex patterns + notification system design
// In convex/monitoring/alertDigest.ts

export const generateDailyDigest = action({
  args: {},
  handler: async (ctx): Promise<{ itemsIncluded: number; alertsSent: number }> => {
    // 1. Get items from last 24h that meet alert criteria
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;

    const alertItems = await ctx.runQuery(
      internal.monitoring.queries.getAlertableItems,
      { since: yesterday }
    );

    if (alertItems.length === 0) {
      console.log("[monitoring] No alertable items in last 24h");
      return { itemsIncluded: 0, alertsSent: 0 };
    }

    // 2. Group by category
    const grouped = {
      highRelevance: alertItems.filter(i => i.relevanceScore >= 80),
      brandMentions: alertItems.filter(i =>
        i.brandMentions?.some(b =>
          BRAND_CONFIG.primaryBrand.variations.includes(b.brand)
        )
      ),
      competitorNews: alertItems.filter(i =>
        i.competitorMentions && i.competitorMentions.length > 0
      ),
    };

    // 3. Build digest email
    const digest = buildDigestEmail(grouped);

    // 4. Send via Convex email (or external service)
    // await ctx.runAction(api.email.sendDigest, { digest });

    // 5. Log digest for audit
    await ctx.runMutation(internal.monitoring.mutations.logDigest, {
      sentAt: Date.now(),
      itemCount: alertItems.length,
      categories: {
        highRelevance: grouped.highRelevance.length,
        brandMentions: grouped.brandMentions.length,
        competitorNews: grouped.competitorNews.length,
      }
    });

    console.log(`[monitoring] Digest sent: ${alertItems.length} items`);
    return { itemsIncluded: alertItems.length, alertsSent: 1 };
  }
});

function buildDigestEmail(grouped: GroupedItems): string {
  // Format: Plain text email with sections
  let email = `# Daily Brand Monitoring Digest\n\n`;
  email += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;

  if (grouped.highRelevance.length > 0) {
    email += `## 🔥 High Relevance Items (${grouped.highRelevance.length})\n\n`;
    grouped.highRelevance.forEach(item => {
      email += formatItem(item);
    });
  }

  if (grouped.brandMentions.length > 0) {
    email += `## 🏷️ Brand Mentions (${grouped.brandMentions.length})\n\n`;
    grouped.brandMentions.forEach(item => {
      email += formatItem(item);
    });
  }

  if (grouped.competitorNews.length > 0) {
    email += `## 👀 Competitor Activity (${grouped.competitorNews.length})\n\n`;
    grouped.competitorNews.forEach(item => {
      email += formatItem(item);
    });
  }

  return email;
}

function formatItem(item: EnrichedFeedItem): string {
  return `### ${item.title}\n` +
    `- Source: ${item.link}\n` +
    `- Published: ${new Date(item.publishedAt).toLocaleDateString()}\n` +
    `- Sentiment: ${item.sentiment} | Relevance: ${item.relevanceScore}/100\n` +
    `- Summary: ${item.aiSummary}\n` +
    (item.brandMentions?.length ? `- Brands: ${item.brandMentions.map(b => `${b.brand} (${b.context})`).join(', ')}\n` : '') +
    (item.competitorMentions?.length ? `- Competitors: ${item.competitorMentions.join(', ')}\n` : '') +
    `\n`;
}

// In convex/crons.ts
// Add daily digest cron - runs 1 hour after enrichment completes
crons.daily(
  "brand-monitoring-digest",
  { hourUTC: 8, minuteUTC: 0 }, // 8 AM UTC (after 6:30 AM enrichment)
  api.monitoring.alertDigest.generateDailyDigest,
  {}
);
```

**Why batched over real-time:**
- **Aligns with existing pattern:** Feed sync (6 AM) → Enrichment (6:30 AM) → Alerts (8 AM)
- **Reduces alert fatigue:** 1 digest/day vs 10+ individual alerts
- **Cost-effective:** No need for webhooks, WebSockets, or push infrastructure
- **Better signal/noise:** Consolidation allows prioritization and deduplication
- **Respects attention:** Users check once daily, not interrupted throughout day

**Sources:**
- [Top 6 Design Patterns for Building Effective Notification Systems](https://www.suprsend.com/post/top-6-design-patterns-for-building-effective-notification-systems-for-developers)
- [Design Guidelines For Better Notifications UX](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/)

### Pattern 3: Extend Enrichment vs Separate Pipeline

**What:** Add brand detection fields to existing enrichment action instead of creating new processing pipeline.

**When to use:** Always - avoids duplicate processing and token costs.

**Example:**
```typescript
// Source: Existing convex/enrichment/processItems.ts pattern
// BEFORE: Phase 4 enrichment only
const response = await fetch("https://api.anthropic.com/v1/messages", {
  body: JSON.stringify({
    model: "claude-haiku-4-5-20250514",
    max_tokens: 512,
    output_format: {
      type: "json_schema",
      schema: PHASE_4_SCHEMA // Only topics, sentiment, summary, relevanceScore
    },
    // ...
  })
});

// AFTER: Phase 5 enrichment includes brand monitoring
const response = await fetch("https://api.anthropic.com/v1/messages", {
  body: JSON.stringify({
    model: "claude-haiku-4-5-20250514",
    max_tokens: 1024, // Increased for brand detection output
    output_format: {
      type: "json_schema",
      schema: ENRICHMENT_SCHEMA // Now includes brandMentions, competitorMentions
    },
    system: ENRICHMENT_SYSTEM_PROMPT.replace(
      '{{COMPETITOR_LIST}}',
      buildCompetitorList()
    ),
    // ...
  })
});

// Store ALL enrichment data in one mutation
await ctx.runMutation(internal.enrichment.mutations.storeEnrichment, {
  itemId: args.itemId,
  // Phase 4 fields
  topics: enrichment.topics,
  sentiment: enrichment.sentiment,
  aiSummary: enrichment.summary,
  relevanceScore: enrichment.relevanceScore,
  // Phase 5 fields (NEW)
  brandMentions: enrichment.brandMentions,
  competitorMentions: enrichment.competitorMentions,
  tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
});
```

**Why extend vs separate:**
- **Single API call:** 1 Claude request instead of 2 (saves 50% token costs)
- **Single cron:** Enrichment already runs daily/hourly, no new scheduling needed
- **Consistent data:** Brand detection happens at same time as topic/sentiment
- **Simpler architecture:** No coordination between separate pipelines
- **Marginal token increase:** Adding brand detection ~100 tokens, negligible vs 512 base

### Pattern 4: Schema Design for Brand Tracking

**What:** Store brand/competitor mentions as structured data in feedItems table.

**When to use:** Always - enables efficient querying for alerts and analytics.

**Example:**
```typescript
// Source: Convex schema best practices + existing feedItems pattern
// In convex/schema.ts

feedItems: defineTable({
  // ... existing fields (title, link, content, publishedAt, etc.)

  // Phase 4: AI Enrichment fields
  topics: v.optional(v.array(v.string())),
  sentiment: v.optional(v.union(
    v.literal("positive"),
    v.literal("neutral"),
    v.literal("negative")
  )),
  aiSummary: v.optional(v.string()),
  relevanceScore: v.optional(v.number()),
  processed: v.optional(v.boolean()),
  processedAt: v.optional(v.number()),
  processingError: v.optional(v.string()),

  // Phase 5: Brand Monitoring fields (NEW)
  brandMentions: v.optional(v.array(
    v.object({
      brand: v.string(),        // e.g., "Salesforce"
      context: v.string(),      // e.g., "subject" | "example" | "competitor"
    })
  )),
  competitorMentions: v.optional(v.array(v.string())), // e.g., ["HubSpot", "Marketo"]
})
  // ... existing indexes
  .index("by_processed", ["processed"])
  .index("by_relevanceScore", ["relevanceScore"])
  // NEW: Indexes for brand monitoring queries
  .index("by_publishedAt", ["publishedAt"]) // For time-range queries in digest

// NEW: Alert digest tracking table
alertDigests: defineTable({
  sentAt: v.number(),           // Timestamp when digest was sent
  itemCount: v.number(),        // Total items included
  categories: v.object({
    highRelevance: v.number(),
    brandMentions: v.number(),
    competitorNews: v.number(),
  }),
  recipientEmails: v.optional(v.array(v.string())), // Who received it (for v2)
})
  .index("by_sentAt", ["sentAt"]),
```

**Why this schema:**
- **brandMentions as objects:** Captures both the brand AND context (how it was mentioned)
- **competitorMentions as strings:** Simpler, just need to know which competitors appeared
- **No separate table:** Keeps data with feed item, avoids joins
- **Optional fields:** Backward compatible with Phase 4, won't break existing items
- **Index on publishedAt:** Efficient "last 24h" queries for digest generation

**Sources:**
- Existing AMD schema patterns in convex/schema.ts
- Convex schema design best practices

## Integration with Enrichment Pipeline

### Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY FLOW (6:00 AM UTC)                     │
└─────────────────────────────────────────────────────────────────┘

1. FEED SYNC (6:00 AM)
   Cron: sync-daily-feeds
   ├─► Fetch RSS feeds
   ├─► Store new feedItems (processed = undefined)
   └─► Log to feedSyncLog

2. AI ENRICHMENT (6:30 AM) - EXTENDED IN PHASE 5
   Cron: enrich-feed-items
   ├─► Query unprocessed items (limit: 10)
   ├─► For each item:
   │   ├─► Call Claude Haiku with ENRICHMENT_SCHEMA
   │   ├─► Extract: topics, sentiment, summary, relevanceScore
   │   ├─► Extract: brandMentions, competitorMentions (PHASE 5 NEW)
   │   └─► Store all fields, mark processed = true
   └─► Log tokens used

3. BRAND MONITORING DIGEST (8:00 AM) - NEW IN PHASE 5
   Cron: brand-monitoring-digest
   ├─► Query items from last 24h WHERE:
   │   ├─► relevanceScore >= 80 (high relevance)
   │   ├─► OR brandMentions contains primary brand
   │   └─► OR competitorMentions.length > 0
   ├─► Group into categories:
   │   ├─► High Relevance Items
   │   ├─► Brand Mentions
   │   └─► Competitor Activity
   ├─► Build email digest
   ├─► Send to configured recipients
   └─► Log to alertDigests table
```

### Agent Access to Brand Data

Agents can query brand mentions just like they query enriched feeds:

```typescript
// In convex/feeds/agentQueries.ts (extend existing)
export const getBrandMentions = internalQuery({
  args: {
    brand: v.string(),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<FeedItem[]> => {
    const cutoff = Date.now() - (args.daysBack ?? 7) * 24 * 60 * 60 * 1000;

    // Query items where brandMentions array contains the brand
    const allItems = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt")
      .filter(q => q.gte(q.field("publishedAt"), cutoff))
      .collect();

    // Filter in memory for brand mentions (Convex doesn't support array contains in index yet)
    return allItems.filter(item =>
      item.brandMentions?.some(m =>
        m.brand.toLowerCase().includes(args.brand.toLowerCase())
      )
    );
  }
});

// Example agent usage:
// "I need to see how competitors are being mentioned this week"
const competitorMentions = await ctx.runQuery(
  internal.feeds.agentQueries.getCompetitorMentions,
  { daysBack: 7 }
);
```

## Implementation Sequence

### Step 1: Extend Enrichment Schema (Low Risk)
- Modify `convex/enrichment/prompts.ts` to add brandMentions/competitorMentions to ENRICHMENT_SCHEMA
- Update ENRICHMENT_SYSTEM_PROMPT to include brand detection instructions
- Add competitor list injection logic
- **Testing:** Run enrichment manually, verify JSON structure

### Step 2: Update Schema and Mutations (Low Risk)
- Add `brandMentions` and `competitorMentions` fields to feedItems in `convex/schema.ts`
- Update `convex/enrichment/mutations.ts` to store new fields
- Add `alertDigests` table to schema
- **Testing:** Verify schema push succeeds, existing data unaffected

### Step 3: Create Brand Configuration (Low Risk)
- Create `convex/monitoring/config.ts` with BRAND_CONFIG
- Define primary brand, products, competitors
- Define alert thresholds
- **Testing:** Import in other files, verify config accessible

### Step 4: Implement Alert Queries (Medium Risk)
- Create `convex/monitoring/queries.ts` with getAlertableItems
- Query logic: last 24h, high relevance OR brand mentions OR competitor mentions
- **Testing:** Run query manually, verify items returned match criteria

### Step 5: Build Digest Generator (Medium Risk)
- Create `convex/monitoring/alertDigest.ts` with generateDailyDigest action
- Implement grouping logic (high relevance, brand mentions, competitor news)
- Build email formatting (plain text for v1)
- Add logging mutation
- **Testing:** Run action manually, verify digest format looks good

### Step 6: Add Digest Cron (Low Risk)
- Add `brand-monitoring-digest` cron to `convex/crons.ts`
- Schedule for 8:00 AM UTC (after enrichment completes)
- **Testing:** Wait for cron to fire, check logs for successful execution

### Step 7: Email Delivery (High Risk - External Dependency)
- For v1: Log digest to console or store in Convex table
- For v2: Integrate email service (SendGrid, Resend, etc.)
- **Testing:** Verify email delivery, check spam folder

### Step 8: Agent Integration (Optional - Future Enhancement)
- Extend `convex/feeds/agentQueries.ts` with brand mention queries
- Update agent tools config to expose brand monitoring queries
- **Testing:** Agents can query "show me brand mentions this week"

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Brand name matching | Regex patterns for variations | Claude semantic detection | LLM handles context, variations, misspellings automatically |
| Competitor tracking | Scrape competitor websites | RSS feeds + brand detection | RSS is opt-in, scraping violates ToS, rate-limited |
| Real-time alerting | WebSocket infrastructure | Batched daily digest | Simpler, aligns with existing cron pattern, reduces alert fatigue |
| Email delivery | Custom SMTP client | Convex email or SendGrid | Production email needs reputation management, deliverability tracking |
| Alert deduplication | Manual filtering logic | Group by category in digest | Digest format naturally deduplicates and prioritizes |

**Key insight:** Don't build a separate monitoring system. Extend existing enrichment pipeline - it's already processing the content, just extract more fields.

## Common Pitfalls

### Pitfall 1: String Matching for Brand Detection
**What goes wrong:** Regex/string matching creates false positives and misses variations.
**Why it happens:** "Apple" matches fruit articles, "AWS" misses "Amazon Web Services", typos fail.
**How to avoid:** Use Claude's semantic understanding to detect brands in context.
**Warning signs:** High false positive rate, missing obvious mentions, support tickets about bad alerts.

### Pitfall 2: Real-Time Alert Spam
**What goes wrong:** Individual alerts for each mention create notification fatigue, users unsubscribe.
**Why it happens:** Real-time seems more impressive but RSS feeds are batch-oriented by nature.
**How to avoid:** Send one consolidated digest per day, prioritize items within digest.
**Warning signs:** Low email open rates, high unsubscribe rate, complaints about too many emails.

### Pitfall 3: Processing Items Twice (Enrichment + Monitoring)
**What goes wrong:** Separate enrichment and monitoring pipelines process same item twice, doubling token costs.
**Why it happens:** Unclear boundaries between Phase 4 (enrichment) and Phase 5 (monitoring).
**How to avoid:** Extend enrichment schema to include brand fields, single API call.
**Warning signs:** Token costs double after Phase 5, processing logs show duplicate item IDs.

### Pitfall 4: Hard-Coding Brand Names in Prompts
**What goes wrong:** Changing competitors requires code deployment, can't A/B test different lists.
**Why it happens:** Putting competitor names directly in ENRICHMENT_SYSTEM_PROMPT.
**How to avoid:** Use `{{COMPETITOR_LIST}}` placeholder, inject from config at runtime.
**Warning signs:** Code changes needed for business decisions, no flexibility for testing.

### Pitfall 5: No Context in Brand Mentions
**What goes wrong:** Alert says "Salesforce mentioned" but unclear if positive/competitive/example reference.
**Why it happens:** Storing brandMentions as simple string array instead of objects with context.
**How to avoid:** Use `{ brand: string, context: string }` schema to capture HOW brand was mentioned.
**Warning signs:** User feedback "I need to read every article to understand if it matters", low alert actionability.

### Pitfall 6: Missing Alert Delivery Tracking
**What goes wrong:** Digest generation succeeds but email never arrives, no visibility into delivery status.
**Why it happens:** Not logging digest sends or checking email service status.
**How to avoid:** Log every digest to `alertDigests` table, track recipient list, monitor delivery metrics.
**Warning signs:** Users report "didn't get digest", no historical record of what was sent when.

## Code Examples

### Complete Brand Detection Enrichment

```typescript
// Source: Phase 4 enrichment + brand monitoring extensions
// In convex/enrichment/processItems.ts (MODIFIED)

export const enrichFeedItem = internalAction({
  args: {
    itemId: v.id("feedItems"),
  },
  handler: async (ctx, args): Promise<EnrichmentResult> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // 1. Get item to enrich
    const item = await ctx.runQuery(internal.enrichment.queries.getItem, {
      itemId: args.itemId
    });
    if (!item) throw new Error("Item not found");

    // 2. Truncate content to control token usage
    const content = (item.content || item.summary || item.title).slice(0, 2000);

    // 3. Build system prompt with competitor list injection
    const systemPrompt = ENRICHMENT_SYSTEM_PROMPT.replace(
      '{{COMPETITOR_LIST}}',
      buildCompetitorList()
    );

    // 4. Call Claude with extended schema (includes brand monitoring)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "structured-outputs-2025-11-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20250514",
        max_tokens: 1024, // Increased from 512 for brand detection
        temperature: 0.3,
        output_format: {
          type: "json_schema",
          schema: ENRICHMENT_SCHEMA // Includes brandMentions, competitorMentions
        },
        system: systemPrompt,
        messages: [{
          role: "user",
          content: buildEnrichmentPrompt(item.title, content)
        }]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const enrichment = JSON.parse(data.content[0].text);

    // 5. Store ALL enrichment data (Phase 4 + Phase 5 fields)
    await ctx.runMutation(internal.enrichment.mutations.storeEnrichment, {
      itemId: args.itemId,
      // Phase 4 fields
      topics: enrichment.topics,
      sentiment: enrichment.sentiment,
      aiSummary: enrichment.summary,
      relevanceScore: enrichment.relevanceScore,
      // Phase 5 fields (NEW)
      brandMentions: enrichment.brandMentions,
      competitorMentions: enrichment.competitorMentions,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    });

    return {
      success: true,
      itemId: args.itemId,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    };
  },
});
```

### Alert Query Implementation

```typescript
// Source: Convex query patterns + alert filtering logic
// In convex/monitoring/queries.ts (NEW)

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { BRAND_CONFIG } from "./config";

/**
 * Get feed items that meet alert criteria
 *
 * Criteria:
 * 1. Published within timeframe (default: last 24h)
 * 2. High relevance (score >= 80)
 * 3. OR mentions primary brand
 * 4. OR mentions competitors
 */
export const getAlertableItems = internalQuery({
  args: {
    since: v.number(), // Timestamp - items published after this
  },
  handler: async (ctx, args) => {
    // Get all processed items since cutoff
    const allItems = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt")
      .filter(q => q.and(
        q.gte(q.field("publishedAt"), args.since),
        q.eq(q.field("processed"), true) // Only processed items
      ))
      .collect();

    // Filter to items meeting alert criteria
    const alertItems = allItems.filter(item => {
      // Criterion 1: High relevance
      if (item.relevanceScore && item.relevanceScore >= BRAND_CONFIG.alertThresholds.highRelevance) {
        return true;
      }

      // Criterion 2: Primary brand mentioned with sufficient relevance
      if (item.brandMentions && item.relevanceScore >= BRAND_CONFIG.alertThresholds.brandMentionRelevance) {
        const mentionsPrimaryBrand = item.brandMentions.some(m =>
          BRAND_CONFIG.primaryBrand.variations.some(v =>
            m.brand.toLowerCase().includes(v.toLowerCase())
          )
        );
        if (mentionsPrimaryBrand) return true;
      }

      // Criterion 3: Competitor mentioned
      if (item.competitorMentions && item.competitorMentions.length > 0) {
        return true;
      }

      return false;
    });

    // Sort by relevance score descending
    return alertItems.sort((a, b) =>
      (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
    );
  }
});

/**
 * Get competitor-specific mentions for analysis
 */
export const getCompetitorMentions = internalQuery({
  args: {
    competitor: v.optional(v.string()), // Specific competitor, or all if omitted
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.daysBack ?? 7) * 24 * 60 * 60 * 1000;

    const allItems = await ctx.db
      .query("feedItems")
      .withIndex("by_publishedAt")
      .filter(q => q.and(
        q.gte(q.field("publishedAt"), cutoff),
        q.eq(q.field("processed"), true)
      ))
      .collect();

    return allItems.filter(item => {
      if (!item.competitorMentions || item.competitorMentions.length === 0) {
        return false;
      }

      if (args.competitor) {
        return item.competitorMentions.some(c =>
          c.toLowerCase().includes(args.competitor!.toLowerCase())
        );
      }

      return true; // Any competitor mention
    });
  }
});
```

### Schema Updates

```typescript
// Source: Existing convex/schema.ts pattern
// In convex/schema.ts (MODIFIED)

feedItems: defineTable({
  // ... existing fields (Phase 1-3) ...

  // Phase 4: AI Enrichment fields
  topics: v.optional(v.array(v.string())),
  sentiment: v.optional(v.union(
    v.literal("positive"),
    v.literal("neutral"),
    v.literal("negative")
  )),
  aiSummary: v.optional(v.string()),
  relevanceScore: v.optional(v.number()),
  processed: v.optional(v.boolean()),
  processedAt: v.optional(v.number()),
  processingError: v.optional(v.string()),

  // Phase 5: Brand Monitoring fields (NEW)
  brandMentions: v.optional(v.array(
    v.object({
      brand: v.string(),
      context: v.string(), // "subject" | "example" | "competitor"
    })
  )),
  competitorMentions: v.optional(v.array(v.string())),
})
  // ... existing indexes ...
  .index("by_processed", ["processed"])
  .index("by_relevanceScore", ["relevanceScore"])
  .index("by_publishedAt", ["publishedAt"]), // For time-range queries

// NEW: Alert digest tracking
alertDigests: defineTable({
  sentAt: v.number(),
  itemCount: v.number(),
  categories: v.object({
    highRelevance: v.number(),
    brandMentions: v.number(),
    competitorNews: v.number(),
  }),
  recipientEmails: v.optional(v.array(v.string())),
  digestContent: v.optional(v.string()), // Store email body for audit
})
  .index("by_sentAt", ["sentAt"]),
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex brand matching | LLM semantic detection | 2024-2025 | Context-aware, handles variations, fewer false positives |
| Real-time individual alerts | Batched daily digests | 2025-2026 | Reduced alert fatigue, better prioritization, simpler infrastructure |
| Separate NER pipeline | Extend enrichment schema | Current | Single API call, 50% cost reduction, simpler architecture |
| Hard-coded brand lists | Configuration-driven | 2026 | Flexibility for testing, no code changes for business updates |

**Deprecated/outdated:**
- Google Alerts for brand monitoring: RSS feeds more reliable, no rate limits
- Regex-based brand detection: LLMs handle context better
- Real-time push notifications for feeds: Batch processing more cost-effective

**Sources:**
- [Brand Monitoring 2026: Blueprint for Real Impact](https://www.sprinklr.com/blog/brand-monitoring/)
- [8 best brand mention tools I'm using in 2026](https://www.gumloop.com/blog/brand-mentions-tool)

## Open Questions

1. **Email Delivery Service**
   - What we know: Convex doesn't have built-in email, need external service
   - What's unclear: Which service (SendGrid, Resend, Postmark) best for this use case
   - Recommendation: Start with console logging for v1, add SendGrid in v2 (already has free tier)

2. **Brand Configuration UI**
   - What we know: Hard-coding competitors in config.ts works for v1
   - What's unclear: When to build UI for non-technical users to manage brand/competitor lists
   - Recommendation: Wait for user feedback - if only developers use AMD, config.ts is fine

3. **Alert Frequency Optimization**
   - What we know: Daily digest aligns with batch pattern
   - What's unclear: Whether users want weekly digest option, or multiple frequencies
   - Recommendation: Start daily, add frequency preference if users request it

4. **Relevance Score Calibration for Alerts**
   - What we know: Using 80+ for high relevance, 60+ for brand mentions
   - What's unclear: Whether these thresholds are optimal
   - Recommendation: Monitor first 2 weeks, adjust based on precision/recall of alerts

5. **Dashboard Integration**
   - What we know: Brand mentions stored in feedItems, could be displayed in dashboard
   - What's unclear: Priority vs other dashboard features, user demand
   - Recommendation: Phase 6 candidate - "Brand Monitoring Dashboard" with visualizations

## Risks & Mitigation

### Risk 1: False Positives in Brand Detection
**Likelihood:** Medium
**Impact:** Medium (alert fatigue, loss of trust)
**Mitigation:**
- Use semantic detection (context-aware) instead of string matching
- Set relevance threshold (60+) to filter low-quality mentions
- Include "context" field in brandMentions to help users assess importance
- Monitor precision in first 2 weeks, tune prompts if needed

### Risk 2: Missing Competitor Mentions
**Likelihood:** Low
**Impact:** Medium (missed intelligence)
**Mitigation:**
- Provide comprehensive competitor list in config
- Use Claude's ability to detect name variations
- Review digest logs to see if competitors are being detected
- Add feedback mechanism for users to report missed mentions

### Risk 3: Digest Email Delivery Failures
**Likelihood:** Medium (external dependency)
**Impact:** High (users miss critical alerts)
**Mitigation:**
- Log every digest to alertDigests table as fallback
- For v1, log to console/Convex dashboard for manual verification
- For v2, add email delivery status tracking (SendGrid webhooks)
- Include digest archive in dashboard for users to check

### Risk 4: Token Cost Increase
**Likelihood:** Low
**Impact:** Low (marginal increase)
**Mitigation:**
- Brand detection adds ~100 output tokens per item (512 → 612)
- With 10 items/day, that's 1k extra tokens = $0.005/day = $1.50/month
- Already using Haiku (cheapest model suitable for task)
- Monitor token usage in execution logs, alert if spikes

### Risk 5: Competitor List Outdated
**Likelihood:** Medium
**Impact:** Low (missed mentions of new competitors)
**Mitigation:**
- Add lastUpdated timestamp to BRAND_CONFIG
- Create checklist item to review quarterly
- For v2, add admin UI to manage competitor list
- Monitor brand mentions for unknown companies that might be new competitors

## Summary

**Key Takeaways for Planner:**

1. **Extend, Don't Rebuild:** Add brand monitoring fields to existing enrichment pipeline instead of building separate system. Single Claude API call processes both enrichment + brand detection.

2. **Semantic over String Matching:** Use Claude's semantic understanding to detect brand mentions in context. Handles variations ("AWS" = "Amazon Web Services"), avoids false positives ("Apple" tech vs fruit), and catches misspellings automatically.

3. **Batched Daily Digest:** Send one consolidated email per day at 8 AM UTC (after enrichment completes at 6:30 AM). Aligns with existing cron pattern, reduces alert fatigue, simpler infrastructure than real-time.

4. **Structured Brand Data:** Store `brandMentions` as `{ brand: string, context: string }[]` to capture HOW brand was mentioned (subject/example/competitor), not just presence. Store `competitorMentions` as simple string array.

5. **Configuration-Driven:** Define brands/competitors in `convex/monitoring/config.ts` and inject into prompt at runtime. Allows testing different competitor lists without code changes.

6. **Alert Criteria:** Include items in digest if: (1) relevanceScore >= 80, OR (2) primary brand mentioned AND score >= 60, OR (3) any competitor mentioned.

7. **Implementation Sequence:**
   - Step 1: Extend enrichment schema (low risk)
   - Step 2: Update database schema (low risk)
   - Step 3: Add brand config (low risk)
   - Step 4: Build alert queries (medium risk)
   - Step 5: Create digest generator (medium risk)
   - Step 6: Add cron job (low risk)
   - Step 7: Email delivery (high risk - external dependency, can defer to v2)

8. **Cost Impact:** Minimal - adds ~100 output tokens per enrichment (10% increase), approximately $1.50/month for 10 items/day processing.

9. **Agent Integration:** Agents automatically get access to brand mention data through existing feed query tools. Can filter by brand, competitor, or timeframe.

10. **Future Enhancements (Phase 6 candidates):**
    - Dashboard visualization of brand mentions over time
    - Email delivery via SendGrid/Resend
    - UI for managing brand/competitor lists
    - Weekly digest option
    - Sentiment trend analysis for brand mentions

**Confidence:** HIGH - Built on proven Phase 4 patterns, well-researched best practices for brand monitoring, aligns with existing architecture.

## Sources

### Primary (HIGH confidence)
- [Monitor and Display Brand Mentions with RSS Feeds](https://rss.app/blog/monitor-and-display-brand-mentions-with-rss-feeds-tXRTAB) - RSS-based brand monitoring patterns
- [Brand Monitoring 2026: Blueprint for Real Impact](https://www.sprinklr.com/blog/brand-monitoring/) - Current state of brand monitoring tools and practices
- [More Query Understanding: Brand Detection with LLMs](https://opensourceconnections.com/blog/2024/06/26/more-query-understanding-brand-detection-with-llms/) - LLM approaches to brand NER
- [Top 6 Design Patterns for Building Effective Notification Systems](https://www.suprsend.com/post/top-6-design-patterns-for-building-effective-notification-systems-for-developers) - Batched vs real-time notification patterns
- [How to Design a Notification System: A Complete Guide](https://www.systemdesignhandbook.com/guides/design-a-notification-system/) - Alert system architecture
- Existing AMD codebase Phase 4 enrichment patterns (`convex/enrichment/*`)

### Secondary (MEDIUM confidence)
- [11 Competitor Monitoring Tools to Trial in 2026](https://www.alpha-sense.com/blog/product/competitor-monitoring-tools/) - Competitor tracking approaches
- [Fuzzy Matching and Semantic Search](https://ipullrank.com/fuzzy-matching-semantic-search) - Semantic vs string matching tradeoffs
- [Entity Resolution: Fix Brand Hallucinations in LLMs](https://searchatlas.com/blog/entity-resolution-fix-brand-hallucinations-llms-2026/) - NER challenges in LLMs
- [Design Guidelines For Better Notifications UX](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) - User experience best practices for alerts

### Tertiary (LOW confidence)
- [8 best brand mention tools I'm using in 2026](https://www.gumloop.com/blog/brand-mentions-tool) - Tool landscape overview
- [How to Monitor Competitors in 2025](https://rss.app/blog/how-to-monitor-competitors-in-2025-pKhUv1) - RSS monitoring tactics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing Phase 4 infrastructure, proven LLM detection
- Architecture: HIGH - Extends established enrichment pattern, aligns with cron workflow
- Pitfalls: MEDIUM - Based on notification system best practices, some AMD-specific validation needed

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (30 days - LLM detection patterns stable, notification UX evolving slowly)
