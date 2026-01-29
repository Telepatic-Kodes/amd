# Phase 5, Plan 01: Schema & Configuration - COMPLETED

## Objective
Add `alertDigests` table and monitoring config, creating the foundation for all brand monitoring features.

---

## Changes Implemented

### 1. Schema Changes (`convex/schema.ts`)

#### Added `alertDigests` Table
- **Location:** Inserted after `feedSyncLog`, before `onboarding`
- **Purpose:** Store brand monitoring digest emails with items, stats, and delivery status
- **Fields:**
  - `createdAt`: Timestamp of digest creation
  - `sentAt`: Timestamp when digest was sent (optional)
  - `status`: pending | generated | sent | failed
  - `period`: Time range covered (start, end timestamps)
  - `items`: Array of feed items with relevance data
    - `feedItemId`: Reference to feed item
    - `title`: Item title
    - `relevanceScore`: 0-100 relevance score
    - `brandMentions`: Array of detected brand terms
    - `competitorMentions`: Array of detected competitor names
    - `sentiment`: positive | neutral | negative
  - `summary`: AI-generated digest summary (optional)
  - `stats`: Aggregate statistics (optional)
    - `totalItems`: Total items in digest
    - `highRelevance`: Count of high-relevance items
    - `brandMentionCount`: Total brand mentions
    - `competitorMentionCount`: Total competitor mentions
- **Indexes:**
  - `by_createdAt`: Query digests chronologically
  - `by_status`: Query by delivery status

#### Modified `feedItems` Table
- **Added Fields:**
  - `brandMentions`: Array of detected brand term mentions (optional)
  - `competitorMentions`: Array of detected competitor names (optional)
- **Purpose:** Enable brand/competitor tracking at the feed item level

---

### 2. Monitoring Configuration (`convex/monitoring/`)

#### Created `config.ts`
Comprehensive configuration for brand monitoring system:

**Competitor Definitions:**
- 7 major marketing automation competitors defined
- Each competitor has:
  - Primary name (e.g., "HubSpot")
  - Aliases array (e.g., ["hubspot", "hub spot", "hubspot.com", "hubspot crm"])
- Competitors monitored:
  1. HubSpot
  2. Marketo (Adobe Marketo)
  3. Salesforce Marketing Cloud (SFMC, Pardot)
  4. ActiveCampaign
  5. Mailchimp (Intuit Mailchimp)
  6. Brevo (Sendinblue)
  7. Klaviyo

**Brand Terms:**
- 5 core brand terms monitored:
  - "aiaiai consulting"
  - "aiaiai"
  - "ai marketing department"
  - "amd marketing"
  - "autonomous marketing"

**Alert Thresholds:**
- `minRelevanceScore`: 60 (minimum to include in digest)
- `highRelevanceThreshold`: 70 (classification threshold)
- `maxDigestItems`: 50 (cap per digest)

**Helper Functions:**
- `getCompetitorNames()`: Get all competitor display names
- `getAllCompetitorTerms()`: Get all searchable terms (names + aliases)
- `findCompetitorByTerm(term)`: Resolve term to competitor name
- `extractBrandMentions(text)`: Detect brand mentions in text
- `extractCompetitorMentions(text)`: Detect competitor mentions in text

#### Created `index.ts`
Barrel export for clean imports:
- Exports all config constants
- Exports all helper functions
- Exports TypeScript types (Competitor, AlertThresholds)

---

## File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| `convex/schema.ts` | Modified | Added `alertDigests` table, added 2 fields to `feedItems` |
| `convex/monitoring/config.ts` | Created | 147 lines - competitor/brand config + helpers |
| `convex/monitoring/index.ts` | Created | 16 lines - barrel export |

**Total Lines Added:** 163+ lines
**Files Created:** 2
**Files Modified:** 1

---

## Technical Details

### Schema Compilation
- ✅ Schema verified with `npx convex dev --once`
- ✅ No TypeScript errors
- ✅ All indexes properly defined
- ✅ Convex functions ready (15.33s)

### Type Safety
- All monitoring functions are strongly typed
- TypeScript interfaces exported for external use
- Case-insensitive matching for robustness

### Extensibility
- Easy to add new competitors (just add to array)
- Easy to add new brand terms
- Thresholds configurable without code changes

---

## Next Steps (Future Plans)

This schema and config enables:

1. **Plan 02:** Detection functions to scan feed items
2. **Plan 03:** Digest generation to aggregate relevant items
3. **Plan 04:** Email delivery system for stakeholder alerts
4. **Plan 05:** Dashboard UI for viewing/managing digests

---

## Import Usage

```typescript
// In other Convex functions
import {
  MONITORED_COMPETITORS,
  ALERT_THRESHOLDS,
  extractBrandMentions,
  extractCompetitorMentions,
} from "./monitoring";

// Example: Check feed item for mentions
const brandMentions = extractBrandMentions(feedItem.content);
const competitorMentions = extractCompetitorMentions(feedItem.content);

// Example: Filter by threshold
if (feedItem.relevanceScore >= ALERT_THRESHOLDS.minRelevanceScore) {
  // Include in digest
}
```

---

## Verification

### Schema Validation
```bash
$ npx convex dev --once
✓ Convex functions ready! (15.33s)
```

### File Structure
```
convex/
├── monitoring/
│   ├── config.ts      # Competitor/brand config + helpers
│   └── index.ts       # Barrel export
└── schema.ts          # Added alertDigests table + feedItems fields
```

---

## Commit Message

```
feat(monitoring): add alertDigests schema and brand monitoring config

- Add alertDigests table to schema for digest storage
- Add brandMentions and competitorMentions to feedItems table
- Create monitoring/config.ts with 7 competitors and 5 brand terms
- Add helper functions for mention extraction
- Configure alert thresholds (min: 60, high: 70, max: 50 items)

Phase 5, Plan 01: Schema & Configuration
```

---

**Status:** ✅ COMPLETED
**Date:** 2026-01-29
**Execution Time:** ~2 minutes
**Compilation:** Success
