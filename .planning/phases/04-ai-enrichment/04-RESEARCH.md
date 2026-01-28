# Phase 4: AI Enrichment - Research

**Researched:** 2026-01-28
**Domain:** AI-powered content enrichment (topic extraction, sentiment analysis, summarization, relevance scoring)
**Confidence:** HIGH

## Summary

This phase adds AI-powered categorization, sentiment analysis, summarization, and relevance scoring to feed items. The enrichment runs as a background process separate from feed sync to avoid blocking operations.

The project already has a working Claude API integration in `convex/actions.ts` using direct fetch to the Messages API. For AI enrichment, the key decision is whether to use the existing synchronous approach (process items one at a time) or leverage Claude's newer Batch API for 50% cost savings on large volumes.

**Primary recommendation:** Use the existing `callClaude` action pattern with structured outputs for guaranteed JSON parsing, process items in application-level batches of 10 per cron run, and use Claude Haiku 4.5 for cost-effective classification tasks.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Anthropic Messages API | 2023-06-01 | LLM for enrichment | Already integrated in project |
| Claude Haiku 4.5 | claude-haiku-4-5-20250514 | Cost-effective classification | $1/$5 per MTok vs $3/$15 for Sonnet |
| Structured Outputs | Beta (structured-outputs-2025-11-13) | Guaranteed JSON schema compliance | Eliminates parsing errors |
| Convex scheduler | Built-in | Background job scheduling | Already used for feed sync |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Claude Sonnet 4 | claude-sonnet-4-20250514 | Complex summaries | When Haiku quality insufficient |
| Batches API | /v1/messages/batches | 50% cost reduction | Future optimization for high volume |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synchronous enrichment | Batches API | 50% cheaper but async (up to 24h), adds complexity for polling/result retrieval |
| Claude Haiku 4.5 | Claude Haiku 3 | Haiku 3 is 4x cheaper ($0.25/$1.25) but lower quality for nuanced classification |
| Structured outputs | Manual JSON parsing | Structured outputs guarantee schema compliance, manual parsing requires retry logic |

**Installation:**
```bash
# No new dependencies - uses existing @anthropic-ai/claude-code and direct fetch
```

## Architecture Patterns

### Recommended Project Structure
```
convex/
├── enrichment/
│   ├── index.ts              # Re-exports for clean imports
│   ├── processItems.ts       # internalAction: enrichment logic
│   ├── mutations.ts          # Store enriched data back to feedItems
│   ├── queries.ts            # Get unprocessed items
│   └── prompts.ts            # Enrichment prompt templates
├── crons.ts                  # Add enrichment cron (runs after sync)
└── schema.ts                 # Add enrichment fields to feedItems
```

### Pattern 1: Fan-Out Background Processing
**What:** Schedule enrichment as a separate cron that runs after feed sync completes.
**When to use:** When enrichment should not block sync operations.
**Example:**
```typescript
// Source: Existing AMD pattern in convex/feeds/syncAllFeeds.ts
// crons.ts - Add enrichment cron 30 minutes after sync
crons.daily(
  "enrich-feed-items",
  { hourUTC: 6, minuteUTC: 30 }, // 30 min after sync
  api.enrichment.processItems.processBatch,
  { batchSize: 10 }
);
```

### Pattern 2: Structured Output for Reliable JSON
**What:** Use Claude's structured outputs beta to guarantee JSON schema compliance.
**When to use:** When extracting structured data (topics, sentiment, scores).
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
const enrichmentSchema = {
  type: "object",
  properties: {
    topics: { type: "array", items: { type: "string" } },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    summary: { type: "string" },
    relevanceScore: { type: "integer" }
  },
  required: ["topics", "sentiment", "summary", "relevanceScore"],
  additionalProperties: false
};

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
    max_tokens: 1024,
    output_format: {
      type: "json_schema",
      schema: enrichmentSchema
    },
    messages: [{ role: "user", content: enrichmentPrompt }]
  }),
});
```

### Pattern 3: Processed Flag for Idempotency
**What:** Mark items as `processed: true` after enrichment to prevent re-processing.
**When to use:** When background jobs may run multiple times.
**Example:**
```typescript
// Source: Standard idempotency pattern
// Query unprocessed items
const unprocessed = await ctx.runQuery(internal.enrichment.queries.getUnprocessedItems, {
  limit: args.batchSize
});

// After successful enrichment
await ctx.runMutation(internal.enrichment.mutations.markProcessed, {
  itemId: item._id,
  enrichmentData: result
});
```

### Anti-Patterns to Avoid
- **Enriching during sync:** Don't call Claude during feed fetch - it blocks sync and can timeout.
- **Processing all items at once:** Don't load all unprocessed items - use pagination/batching.
- **No retry logic:** Don't assume Claude calls always succeed - implement backoff.
- **Ignoring cost:** Don't use Sonnet/Opus for simple classification - Haiku is 3-5x cheaper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing | Custom regex extraction | Structured outputs | Guaranteed schema compliance, no parsing errors |
| Topic extraction | Keyword frequency analysis | Claude prompt | LLM understands context, not just word counts |
| Sentiment analysis | Rule-based sentiment | Claude prompt | Handles nuance, sarcasm, context |
| Batch job status | Custom state machine | Convex scheduler | Built-in retry, scheduling, state management |

**Key insight:** Claude's structured outputs eliminate the #1 source of enrichment failures - malformed JSON responses.

## Common Pitfalls

### Pitfall 1: Enrichment Blocking Feed Sync
**What goes wrong:** Calling Claude during `fetchFeed` causes timeouts and failed syncs.
**Why it happens:** Claude calls add 1-5 seconds per item, feeds timeout at 30s.
**How to avoid:** Run enrichment as separate cron, never in sync path.
**Warning signs:** Feed syncs timing out, `partial` sync status increasing.

### Pitfall 2: Uncontrolled Token Costs
**What goes wrong:** Processing thousands of items with Sonnet/Opus explodes costs.
**Why it happens:** Default model is Sonnet ($3/$15 per MTok), enrichment is high volume.
**How to avoid:** Use Haiku ($1/$5) for classification, only escalate to Sonnet for complex summaries.
**Warning signs:** Daily API costs exceeding budget, token counts spiking.

### Pitfall 3: Re-Processing Items
**What goes wrong:** Same items enriched multiple times, wasting tokens.
**Why it happens:** No `processed` flag or race condition between cron runs.
**How to avoid:** Mark items `processed: true` atomically after enrichment, query only unprocessed.
**Warning signs:** Duplicate enrichment logs, token usage higher than expected.

### Pitfall 4: JSON Parsing Failures
**What goes wrong:** Claude returns invalid JSON, enrichment fails silently.
**Why it happens:** Without structured outputs, Claude may include markdown or explanation.
**How to avoid:** Use `anthropic-beta: structured-outputs-2025-11-13` header with JSON schema.
**Warning signs:** Frequent retry attempts, `JSON.parse` errors in logs.

### Pitfall 5: Prompt Injection via Feed Content
**What goes wrong:** Malicious feed content manipulates Claude's enrichment output.
**Why it happens:** Raw feed content passed directly to Claude prompt.
**How to avoid:** Sanitize content, truncate to reasonable length, use system prompt to establish boundaries.
**Warning signs:** Unexpected enrichment results, topics/sentiment that don't match content.

## Code Examples

### Enrichment Action with Structured Outputs
```typescript
// Source: Pattern from existing convex/actions.ts + structured outputs docs
export const enrichFeedItem = internalAction({
  args: {
    itemId: v.id("feedItems"),
  },
  handler: async (ctx, args): Promise<EnrichmentResult> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Get item to enrich
    const item = await ctx.runQuery(internal.enrichment.queries.getItem, {
      itemId: args.itemId
    });
    if (!item) throw new Error("Item not found");

    // Truncate content to control token usage
    const content = (item.content || item.summary || item.title).slice(0, 2000);

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
        max_tokens: 512,
        temperature: 0.3, // Lower temp for consistent classification
        output_format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: { type: "string" },
                description: "3-5 relevant topic tags"
              },
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"]
              },
              summary: {
                type: "string",
                description: "100-200 word summary"
              },
              relevanceScore: {
                type: "integer",
                description: "0-100 score for marketing domain relevance"
              }
            },
            required: ["topics", "sentiment", "summary", "relevanceScore"],
            additionalProperties: false
          }
        },
        system: `You are a marketing content analyst. Analyze the following content and provide:
1. topics: 3-5 relevant topic tags (lowercase, no hashtags)
2. sentiment: overall sentiment (positive/neutral/negative)
3. summary: a concise 100-200 word summary
4. relevanceScore: 0-100 score for how relevant this is to marketing/business (0=irrelevant, 100=highly relevant)

Focus on accuracy and consistency. This is for automated content categorization.`,
        messages: [{
          role: "user",
          content: `Analyze this content:\n\nTitle: ${item.title}\n\nContent: ${content}`
        }]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const enrichment = JSON.parse(data.content[0].text);

    // Store enrichment data
    await ctx.runMutation(internal.enrichment.mutations.storeEnrichment, {
      itemId: args.itemId,
      topics: enrichment.topics,
      sentiment: enrichment.sentiment,
      summary: enrichment.summary,
      relevanceScore: enrichment.relevanceScore,
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

### Batch Processing Cron Pattern
```typescript
// Source: Pattern from convex/feeds/syncAllFeeds.ts
export const processBatch = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ processed: number; failed: number }> => {
    const batchSize = args.batchSize || 10;

    // Get unprocessed items, prioritize by relevance or recency
    const items = await ctx.runQuery(
      internal.enrichment.queries.getUnprocessedItems,
      { limit: batchSize }
    );

    if (items.length === 0) {
      console.log("[enrichment] No unprocessed items");
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    // Process sequentially to avoid rate limits
    for (const item of items) {
      try {
        await ctx.runAction(internal.enrichment.processItems.enrichFeedItem, {
          itemId: item._id
        });
        processed++;
      } catch (error: any) {
        console.error(`[enrichment] Failed to enrich ${item._id}: ${error.message}`);
        failed++;
        // Mark as failed to prevent infinite retries
        await ctx.runMutation(internal.enrichment.mutations.markFailed, {
          itemId: item._id,
          error: error.message
        });
      }
    }

    console.log(`[enrichment] Processed ${processed}, failed ${failed}`);
    return { processed, failed };
  },
});
```

### Schema Updates
```typescript
// Source: convex/schema.ts additions
// Add to feedItems table
feedItems: defineTable({
  // ... existing fields ...

  // Enrichment fields (Phase 4)
  topics: v.optional(v.array(v.string())),
  sentiment: v.optional(v.union(
    v.literal("positive"),
    v.literal("neutral"),
    v.literal("negative")
  )),
  summary: v.optional(v.string()),
  relevanceScore: v.optional(v.number()),
  processed: v.optional(v.boolean()),
  processedAt: v.optional(v.number()),
  processingError: v.optional(v.string()),
})
  // ... existing indexes ...
  .index("by_processed", ["processed"]) // For enrichment queries
  .index("by_relevanceScore", ["relevanceScore"]), // For high-relevance filtering
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual JSON parsing with retries | Structured outputs (beta) | Nov 2025 | Zero parsing errors, guaranteed schema |
| Single model for all tasks | Model routing (Haiku/Sonnet/Opus) | 2025 | 3-5x cost reduction for classification |
| Batch API for async | Synchronous + structured | Current | Simpler architecture, acceptable latency |
| Prompt engineering only | Context engineering | 2026 | Holistic context window management |

**Deprecated/outdated:**
- Manual JSON extraction prompts: Use structured outputs instead
- Claude 3.x models: Prefer 4.x for improved instruction following

## Open Questions

1. **Batch API vs Synchronous**
   - What we know: Batch API offers 50% cost savings, async processing within 24h
   - What's unclear: Whether async is acceptable for this use case
   - Recommendation: Start with synchronous for simplicity, migrate to Batch API if volume exceeds ~1000 items/day

2. **Haiku 3 vs Haiku 4.5**
   - What we know: Haiku 3 is 4x cheaper ($0.25/$1.25 vs $1/$5)
   - What's unclear: Quality difference for marketing content classification
   - Recommendation: Test with Haiku 4.5 first, downgrade to Haiku 3 if quality acceptable

3. **Relevance Score Calibration**
   - What we know: Claude can generate 0-100 scores
   - What's unclear: What thresholds to use for "high relevance"
   - Recommendation: Collect data for first 2 weeks, then calibrate thresholds based on actual distribution

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - JSON schema format, beta header, implementation examples
- [Anthropic Batch Processing Docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing) - 50% discount, 24h processing, custom_id tracking
- [Convex Background Jobs](https://stack.convex.dev/background-job-management) - Scheduler patterns, job state management
- AMD codebase `convex/actions.ts` - Existing Claude integration pattern
- AMD codebase `convex/feeds/syncAllFeeds.ts` - Fan-out background processing pattern

### Secondary (MEDIUM confidence)
- [Anthropic Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) - Claude 4.x specific guidance
- [Caylent Claude Haiku 4.5 Analysis](https://caylent.com/blog/claude-haiku-4-5-deep-dive-cost-capabilities-and-the-multi-agent-opportunity) - Cost/capability tradeoffs
- [Convex Cron Jobs Documentation](https://docs.convex.dev/scheduling/cron-jobs) - Scheduling patterns

### Tertiary (LOW confidence)
- WebSearch results on token optimization strategies - General guidance, verify with actual usage data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing project patterns + official Anthropic docs
- Architecture: HIGH - Follows established AMD patterns (fan-out, internalAction)
- Pitfalls: MEDIUM - Based on common patterns, some project-specific validation needed

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - structured outputs still in beta, may change)
