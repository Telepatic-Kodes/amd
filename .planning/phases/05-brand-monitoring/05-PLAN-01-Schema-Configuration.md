---
wave: 1
depends_on: []
files_modified:
  - convex/schema.ts
files_created:
  - convex/monitoring/config.ts
  - convex/monitoring/index.ts
autonomous: true
---

## Objective

Add the `alertDigests` table to the Convex schema and create the competitor monitoring configuration module. This is the foundation for all brand monitoring features.

## Why This First

Everything in Phase 5 depends on two things: (1) a place to store alert digests, and (2) a list of competitors to detect. No enrichment extension or alert pipeline can work without these.

## Step-by-step

### 1. Add alertDigests table to convex/schema.ts

Insert a new table section **after the `feedSyncLog` table** (line ~496) and **before the `onboarding` table**:

```typescript
  // ===========================================
  // ALERT_DIGESTS - Daily brand monitoring digests (Phase 5)
  // ===========================================
  alertDigests: defineTable({
    createdAt: v.number(),
    sentAt: v.optional(v.number()), // When digest was delivered/consumed
    status: v.union(
      v.literal("pending"),
      v.literal("generated"),
      v.literal("sent"),
      v.literal("failed")
    ),
    period: v.object({
      start: v.number(), // Timestamp: start of digest window
      end: v.number(),   // Timestamp: end of digest window
    }),
    items: v.array(
      v.object({
        feedItemId: v.id("feedItems"),
        title: v.string(),
        relevanceScore: v.number(),
        brandMentions: v.array(v.string()),
        competitorMentions: v.array(v.string()),
        sentiment: v.union(
          v.literal("positive"),
          v.literal("neutral"),
          v.literal("negative")
        ),
      })
    ),
    summary: v.optional(v.string()), // AI-generated digest summary
    stats: v.optional(
      v.object({
        totalItems: v.number(),
        highRelevance: v.number(),     // items with relevanceScore >= 70
        brandMentionCount: v.number(),
        competitorMentionCount: v.number(),
      })
    ),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"]),
```

### 2. Add brandMentions and competitorMentions fields to feedItems table

In the `feedItems` table definition, add two new optional fields **after `processedAt`** (line ~463) and **before `processingError`**:

```typescript
    brandMentions: v.optional(v.array(v.string())),       // Brand names detected (Phase 5)
    competitorMentions: v.optional(v.array(v.string())),   // Competitor names detected (Phase 5)
```

### 3. Create convex/monitoring/config.ts

```typescript
/**
 * Brand Monitoring Configuration
 *
 * Static configuration for brand and competitor monitoring.
 * Edit this file to add/remove monitored entities.
 *
 * @module convex/monitoring/config
 */

/**
 * Competitors to monitor in feed content.
 * Each entry has a canonical name and aliases for fuzzy matching.
 * The AI enrichment prompt receives these names to detect mentions.
 */
export const MONITORED_COMPETITORS = [
  {
    name: "HubSpot",
    aliases: ["hubspot", "HubSpot CRM"],
    category: "marketing-platform",
  },
  {
    name: "Salesforce",
    aliases: ["salesforce", "SFDC", "Salesforce Marketing Cloud"],
    category: "crm",
  },
  {
    name: "Marketo",
    aliases: ["marketo", "Adobe Marketo", "Marketo Engage"],
    category: "marketing-automation",
  },
  {
    name: "Mailchimp",
    aliases: ["mailchimp", "Intuit Mailchimp"],
    category: "email-marketing",
  },
  {
    name: "Semrush",
    aliases: ["semrush", "SEMrush"],
    category: "seo-tools",
  },
] as const;

/**
 * Brand terms to detect (your own brand).
 * Add your company name, product names, key people, etc.
 */
export const MONITORED_BRAND_TERMS = [
  "AIAIAI",
  "AI Marketing Department",
  "AMD Platform",
] as const;

/**
 * Alert thresholds for digest generation
 */
export const ALERT_THRESHOLDS = {
  /** Minimum relevance score to include in alert digest */
  minRelevanceScore: 60,
  /** Score at or above which an item is "high relevance" */
  highRelevanceThreshold: 70,
  /** Maximum items per digest */
  maxDigestItems: 50,
} as const;

/**
 * Returns competitor names as a flat string list for prompt injection.
 */
export function getCompetitorNames(): string[] {
  return MONITORED_COMPETITORS.map((c) => c.name);
}

/**
 * Returns all competitor names + aliases as a flat list for detection.
 */
export function getAllCompetitorTerms(): string[] {
  return MONITORED_COMPETITORS.flatMap((c) => [c.name, ...c.aliases]);
}
```

### 4. Create convex/monitoring/index.ts

```typescript
/**
 * Brand Monitoring Module
 *
 * Phase 5: Brand mention detection and competitor tracking.
 *
 * @module convex/monitoring
 */

export {
  MONITORED_COMPETITORS,
  MONITORED_BRAND_TERMS,
  ALERT_THRESHOLDS,
  getCompetitorNames,
  getAllCompetitorTerms,
} from "./config";
```

### 5. Verify schema compiles

Run:
```bash
cd /home/tomas/Escritorio/amd && npx convex dev --once
```

If there are type errors, fix them. The schema must compile cleanly before proceeding.

## Verification

- [ ] `alertDigests` table exists in schema.ts with `by_createdAt` and `by_status` indexes
- [ ] `feedItems` table has `brandMentions` and `competitorMentions` optional fields
- [ ] `convex/monitoring/config.ts` exports `MONITORED_COMPETITORS`, `MONITORED_BRAND_TERMS`, `ALERT_THRESHOLDS`
- [ ] `convex/monitoring/index.ts` barrel exports all config
- [ ] `npx convex dev --once` compiles without errors

## must_haves

- alertDigests table created with by_createdAt and by_status indexes
- feedItems has brandMentions and competitorMentions optional array fields
- MONITORED_COMPETITORS exported from convex/monitoring/config.ts with at least 5 competitors
- MONITORED_BRAND_TERMS exported with brand terms
- ALERT_THRESHOLDS exported with minRelevanceScore, highRelevanceThreshold, maxDigestItems
- getCompetitorNames() and getAllCompetitorTerms() helper functions exported
- Schema compiles successfully
