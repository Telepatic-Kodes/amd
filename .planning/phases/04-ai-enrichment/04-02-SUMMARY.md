---
phase: 04-ai-enrichment
plan: 02
subsystem: enrichment
tags: [claude-api, structured-outputs, haiku, ai-enrichment]

dependencies:
  requires: ["04-01"]
  provides: ["enrichFeedItem-action", "enrichment-prompts"]
  affects: ["04-03"]

tech-stack:
  added: []
  patterns: ["structured-outputs", "internalAction"]

files:
  created:
    - convex/enrichment/prompts.ts
    - convex/enrichment/processItems.ts
  modified:
    - convex/enrichment/index.ts

decisions:
  - id: haiku-model
    choice: "claude-haiku-4-5-20250514"
    rationale: "Cost-efficient ($1/$5 per MTok) for high-volume classification"
  - id: structured-outputs
    choice: "anthropic-beta: structured-outputs-2025-11-13"
    rationale: "Guaranteed JSON eliminates parsing failures"
  - id: temperature-03
    choice: "temperature: 0.3"
    rationale: "Lower temperature for consistent classification results"
  - id: content-truncation
    choice: "2000 char limit"
    rationale: "Control token usage while preserving classification context"

metrics:
  duration: "~4 minutes"
  completed: "2026-01-28"
---

# Phase 4 Plan 02: Enrichment Action Summary

**One-liner:** Claude Haiku 4.5 enrichment action with structured outputs for guaranteed JSON topic/sentiment/summary extraction.

## Objective

Implement the core AI enrichment action that calls Claude Haiku 4.5 with structured outputs to extract topics, sentiment, summary, and relevance score from feed items.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create enrichment schema and prompt templates | Done | 4ea7658 |
| 2 | Create enrichFeedItem action with structured outputs | Done | 1802ad2 |
| 3 | Update enrichment module barrel export | Done | 1119512 |

## Key Implementation Details

### Enrichment Schema (prompts.ts)

```typescript
ENRICHMENT_SCHEMA = {
  topics: string[],      // 3-5 lowercase tags
  sentiment: "positive" | "neutral" | "negative",
  summary: string,       // 100-200 words
  relevanceScore: number // 0-100 marketing relevance
}
```

### enrichFeedItem Action (processItems.ts)

- **Input:** `{ itemId: Id<"feedItems"> }`
- **Output:** `{ success: boolean, itemId: Id<"feedItems">, tokensUsed: number }`
- **Model:** `claude-haiku-4-5-20250514`
- **Structured outputs:** Guaranteed valid JSON via beta header
- **Error handling:** Marks failed items to prevent infinite retries

### API Call Structure

```typescript
fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "structured-outputs-2025-11-13",
  },
  body: {
    model: "claude-haiku-4-5-20250514",
    max_tokens: 512,
    temperature: 0.3,
    output_format: { type: "json_schema", schema: ENRICHMENT_SCHEMA }
  }
})
```

## Deviations from Plan

None - plan executed exactly as written.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `convex/enrichment/prompts.ts` | JSON schema and prompt templates for enrichment |
| `convex/enrichment/processItems.ts` | enrichFeedItem internalAction |
| `convex/enrichment/index.ts` | Updated barrel export with new exports |

## Integration Points

- **Uses:** `internal.enrichment.queries.getItem` - fetches item to enrich
- **Uses:** `internal.enrichment.mutations.storeEnrichment` - stores enrichment data
- **Uses:** `internal.enrichment.mutations.markFailed` - marks failed items
- **Requires:** `ANTHROPIC_API_KEY` environment variable in Convex

## Testing Notes

To test manually:
```bash
# Set API key in Convex (if not already set)
npx convex env set ANTHROPIC_API_KEY sk-ant-...

# Run enrichment on a specific item
npx convex run enrichment/processItems:enrichFeedItem --args '{"itemId": "<item-id>"}'
```

## Next Phase Readiness

Plan 04-03 (Cron & Integration) can now:
1. Schedule batch processing using `enrichFeedItem`
2. Integrate with feed sync workflow
3. Add cron job for regular enrichment

**Blockers:** None
**Concerns:** ANTHROPIC_API_KEY must be set in Convex environment before first run
