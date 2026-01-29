---
wave: 2
depends_on:
  - 05-PLAN-03-Alert-Digest-Queries
files_modified:
  - convex/crons.ts
  - convex/monitoring/index.ts
files_created:
  - convex/monitoring/actions.ts
  - scripts/test-brand-monitoring.ts
autonomous: true
---

## Objective

Create the daily alert digest generation action, wire it into the cron system at 8 AM UTC, and provide a manual trigger and test script for verification.

## Why This Order

Plans 01-03 must be complete: schema exists, enrichment writes brand/competitor mentions, queries fetch alert candidates, mutations store digests. This plan connects everything with a scheduled action.

## Step-by-step

### 1. Create convex/monitoring/actions.ts

```typescript
/**
 * Brand Monitoring Actions
 *
 * Scheduled and manual actions for generating alert digests.
 *
 * @module convex/monitoring/actions
 */

import { v } from "convex/values";
import { internalAction, action } from "../_generated/server";
import { internal } from "../_generated/api";
import { ALERT_THRESHOLDS } from "./config";

/**
 * Generate a daily alert digest.
 *
 * 1. Determine time window (since last digest, or last 24h)
 * 2. Fetch alert-worthy items from that window
 * 3. Compute stats
 * 4. Store the digest
 *
 * Called by cron at 8 AM UTC daily. Can also be triggered manually.
 */
export const generateAlertDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Determine time window
    const latestDigest = await ctx.runQuery(
      internal.monitoring.queries.getLatestDigest,
      {}
    );

    // Default: last 24 hours. If a previous digest exists, use its creation time.
    const since = latestDigest
      ? latestDigest.createdAt
      : now - 24 * 60 * 60 * 1000;

    console.log(
      `[monitoring] Generating alert digest. Window: ${new Date(since).toISOString()} - ${new Date(now).toISOString()}`
    );

    // 2. Fetch alert candidates
    const candidates = await ctx.runQuery(
      internal.monitoring.queries.getAlertCandidates,
      { since }
    );

    if (candidates.length === 0) {
      console.log("[monitoring] No alert-worthy items found. Skipping digest.");
      return { generated: false, reason: "no_items" };
    }

    // 3. Build digest items and compute stats
    let highRelevance = 0;
    let brandMentionCount = 0;
    let competitorMentionCount = 0;

    const digestItems = candidates.map((item) => {
      const brandMentions = item.brandMentions ?? [];
      const competitorMentions = item.competitorMentions ?? [];
      const relevanceScore = item.relevanceScore ?? 0;

      if (relevanceScore >= ALERT_THRESHOLDS.highRelevanceThreshold) {
        highRelevance++;
      }
      brandMentionCount += brandMentions.length;
      competitorMentionCount += competitorMentions.length;

      return {
        feedItemId: item._id,
        title: item.title,
        relevanceScore,
        brandMentions,
        competitorMentions,
        sentiment: item.sentiment ?? ("neutral" as const),
      };
    });

    const stats = {
      totalItems: digestItems.length,
      highRelevance,
      brandMentionCount,
      competitorMentionCount,
    };

    // 4. Build summary string
    const summaryParts: string[] = [];
    summaryParts.push(`${stats.totalItems} alert-worthy items found.`);
    if (stats.highRelevance > 0) {
      summaryParts.push(`${stats.highRelevance} high-relevance items.`);
    }
    if (stats.brandMentionCount > 0) {
      summaryParts.push(`${stats.brandMentionCount} brand mentions detected.`);
    }
    if (stats.competitorMentionCount > 0) {
      summaryParts.push(
        `${stats.competitorMentionCount} competitor mentions detected.`
      );
    }
    const summary = summaryParts.join(" ");

    // 5. Store digest
    const result = await ctx.runMutation(
      internal.monitoring.mutations.storeAlertDigest,
      {
        period: { start: since, end: now },
        items: digestItems,
        summary,
        stats,
      }
    );

    console.log(
      `[monitoring] Alert digest generated: ${digestItems.length} items, ${highRelevance} high-relevance`
    );

    return { generated: true, digestId: result.digestId, stats };
  },
});

/**
 * Manual trigger for alert digest generation.
 * Exposed as a public action so it can be called from dashboard or CLI.
 */
export const triggerAlertDigest = action({
  args: {},
  handler: async (ctx) => {
    console.log("[monitoring] Manual alert digest triggered");
    const result = await ctx.runAction(
      internal.monitoring.actions.generateAlertDigest,
      {}
    );
    return result;
  },
});
```

### 2. Add daily cron to convex/crons.ts

Add a new section at the end of the file, **before `export default crons;`**:

```typescript
// ===========================================
// BRAND MONITORING CRONS (Phase 5)
// ===========================================

// Generate daily alert digest at 8:00 AM UTC
// Runs after enrichment has processed morning batch (6:30 UTC)
// Collects all alert-worthy items since last digest
crons.daily(
  "generate-alert-digest",
  { hourUTC: 8, minuteUTC: 0 },
  api.monitoring.actions.triggerAlertDigest,
  {}
);
```

**Note:** The cron calls the public `triggerAlertDigest` action (via `api`), which internally calls `generateAlertDigest`. This is because Convex crons use the `api` object, not `internal`.

**Wait** -- check if crons can call `api.monitoring.actions.triggerAlertDigest`. Convex cron `api` paths follow the file structure. Since the file is `convex/monitoring/actions.ts` and the export is `triggerAlertDigest`, the path should be `api.monitoring.actions.triggerAlertDigest`.

If the cron requires an action (not a query/mutation), verify the Convex cron API supports actions. Looking at the existing crons, `api.actions.runScheduledAgents` and `api.enrichment.orchestration.processBatch` are used -- these are actions. So `api.monitoring.actions.triggerAlertDigest` will work.

### 3. Create scripts/test-brand-monitoring.ts

```typescript
/**
 * Test script for Phase 5: Brand Monitoring
 *
 * Verifies the entire brand monitoring pipeline:
 * 1. Config loads correctly
 * 2. Enrichment schema includes brand/competitor fields
 * 3. Alert digest generation works
 *
 * Run: npx convex run monitoring/actions:triggerAlertDigest
 *
 * Or for a full check:
 * npx tsx scripts/test-brand-monitoring.ts
 */

async function main() {
  console.log("=== Phase 5: Brand Monitoring Test ===\n");

  // Test 1: Config
  console.log("1. Testing monitoring config...");
  const {
    MONITORED_COMPETITORS,
    MONITORED_BRAND_TERMS,
    ALERT_THRESHOLDS,
    getCompetitorNames,
    getAllCompetitorTerms,
  } = await import("../convex/monitoring/config");

  console.log(`   Competitors: ${MONITORED_COMPETITORS.length}`);
  console.log(`   Brand terms: ${MONITORED_BRAND_TERMS.length}`);
  console.log(`   Competitor names: ${getCompetitorNames().join(", ")}`);
  console.log(`   All terms (with aliases): ${getAllCompetitorTerms().length}`);
  console.log(`   Min relevance: ${ALERT_THRESHOLDS.minRelevanceScore}`);
  console.log(`   High relevance: ${ALERT_THRESHOLDS.highRelevanceThreshold}`);
  console.log("   PASS\n");

  // Test 2: Enrichment schema
  console.log("2. Testing enrichment schema...");
  const { ENRICHMENT_SCHEMA } = await import("../convex/enrichment/prompts");
  const props = ENRICHMENT_SCHEMA.properties;

  const hasBrand = "brandMentions" in props;
  const hasCompetitor = "competitorMentions" in props;
  console.log(`   brandMentions in schema: ${hasBrand}`);
  console.log(`   competitorMentions in schema: ${hasCompetitor}`);

  if (!hasBrand || !hasCompetitor) {
    console.log("   FAIL: Missing fields in enrichment schema");
    process.exit(1);
  }
  console.log("   PASS\n");

  // Test 3: Prompt building
  console.log("3. Testing prompt building...");
  const { buildEnrichmentPrompt } = await import("../convex/enrichment/prompts");

  const prompt = buildEnrichmentPrompt(
    "Test Title",
    "Test content about HubSpot and marketing",
    [...MONITORED_BRAND_TERMS],
    getCompetitorNames()
  );

  const hasMonitoringContext = prompt.includes("MONITORING CONTEXT");
  const hasBrandTerms = prompt.includes("BRAND TERMS");
  const hasCompetitors = prompt.includes("COMPETITORS");
  console.log(`   Has monitoring context: ${hasMonitoringContext}`);
  console.log(`   Has brand terms: ${hasBrandTerms}`);
  console.log(`   Has competitors: ${hasCompetitors}`);

  if (!hasMonitoringContext || !hasBrandTerms || !hasCompetitors) {
    console.log("   FAIL: Prompt missing monitoring sections");
    process.exit(1);
  }
  console.log("   PASS\n");

  console.log("=== All tests passed ===");
  console.log("\nTo test digest generation with live data:");
  console.log("  npx convex run monitoring/actions:triggerAlertDigest");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

### 4. Verify

```bash
# Compile check
cd /home/tomas/Escritorio/amd && npx convex dev --once

# Run config/schema tests
npx tsx scripts/test-brand-monitoring.ts

# Test manual digest generation (with live Convex)
npx convex run monitoring/actions:triggerAlertDigest
```

Check Convex logs for:
- `[monitoring] Generating alert digest...`
- Either `No alert-worthy items found` (expected if no enriched items yet) or `Alert digest generated: N items`

Check Convex dashboard: `alertDigests` table should have a record if items were found.

## Verification

- [ ] convex/monitoring/actions.ts exports generateAlertDigest (internal) and triggerAlertDigest (public)
- [ ] generateAlertDigest determines time window from last digest
- [ ] generateAlertDigest fetches candidates, computes stats, stores digest
- [ ] generateAlertDigest handles empty results gracefully (no digest created)
- [ ] convex/crons.ts has "generate-alert-digest" daily cron at 8:00 AM UTC
- [ ] scripts/test-brand-monitoring.ts verifies config, schema, and prompt
- [ ] `npx convex dev --once` compiles without errors
- [ ] Manual trigger works: `npx convex run monitoring/actions:triggerAlertDigest`

## must_haves

- generateAlertDigest internal action determines window from last digest or 24h default
- generateAlertDigest fetches alert candidates, builds stats, stores digest via storeAlertDigest
- generateAlertDigest returns early with { generated: false } when no items found
- triggerAlertDigest public action wraps generateAlertDigest for cron and manual use
- Daily cron "generate-alert-digest" at 8:00 AM UTC in crons.ts
- Test script validates config loads, schema has new fields, prompt includes monitoring context
- Full pipeline compiles and runs
