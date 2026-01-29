---
wave: 1
depends_on: []
files_modified:
  - convex/feeds/queries.ts
files_created:
  - convex/feeds/opmlExport.ts
  - convex/feeds/utils/opmlGenerator.ts
  - scripts/test-opml-export.ts
autonomous: true
---

# Plan 03: OPML Export

## Objective

Enable bulk feed export to OPML 2.0 format for backup, sharing, and migration to other RSS readers (Feedly, Inoreader, etc.).

## Why This First

- No dependencies on other plans (parallel with Plans 01 and 02)
- Complements Plan 02 (import/export roundtrip)
- Simple query + XML generation — low risk
- Essential for data portability and enterprise backup workflows

## Step-by-step

### 1. Create OPML generator utility

Create `convex/feeds/utils/opmlGenerator.ts`:

```typescript
/**
 * OPML Generator Utility
 *
 * Generates valid OPML 2.0 XML from structured feed data.
 *
 * @module convex/feeds/utils/opmlGenerator
 */

export interface ExportableFeed {
  name: string;
  url: string;
  category: string;
  status: string;
  syncFrequency: string;
  lastSyncAt?: number;
}

/**
 * Generate OPML 2.0 XML string from a list of feeds.
 * Groups feeds by category into folder outlines.
 */
export function generateOPML(
  feeds: ExportableFeed[],
  documentTitle: string = 'AMD Feed Export'
): string {
  const now = new Date().toUTCString();

  // Group feeds by category
  const grouped = new Map<string, ExportableFeed[]>();
  for (const feed of feeds) {
    const cat = feed.category || 'uncategorized';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(feed);
  }

  // Build XML
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<opml version="2.0">');
  lines.push('  <head>');
  lines.push(`    <title>${escapeXML(documentTitle)}</title>`);
  lines.push(`    <dateCreated>${now}</dateCreated>`);
  lines.push(`    <docs>http://opml.org/spec2.opml</docs>`);
  lines.push('  </head>');
  lines.push('  <body>');

  // Sort categories alphabetically
  const sortedCategories = Array.from(grouped.keys()).sort();

  for (const category of sortedCategories) {
    const categoryFeeds = grouped.get(category)!;
    lines.push(`    <outline text="${escapeXML(category)}" title="${escapeXML(category)}">`);

    for (const feed of categoryFeeds) {
      const attrs = [
        `type="rss"`,
        `text="${escapeXML(feed.name)}"`,
        `title="${escapeXML(feed.name)}"`,
        `xmlUrl="${escapeXML(feed.url)}"`,
      ];

      // Add optional metadata as custom attributes
      if (feed.status) attrs.push(`amd:status="${escapeXML(feed.status)}"`);
      if (feed.syncFrequency) attrs.push(`amd:syncFrequency="${escapeXML(feed.syncFrequency)}"`);

      lines.push(`      <outline ${attrs.join(' ')} />`);
    }

    lines.push('    </outline>');
  }

  lines.push('  </body>');
  lines.push('</opml>');

  return lines.join('\n');
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

### 2. Create export query

**Function visibility:**
- `listFeedsForExport` = `internalQuery` (called only by exportAsOPML action)
- `exportAsOPML` = `internalAction` (called by public wrapper)
- `exportOPML` = public `action` (callable from dashboard/UI)

Add to `convex/feeds/queries.ts` a new query for export. Find the end of the file and append:

```typescript
/**
 * List all feeds for OPML export.
 * Returns all feeds regardless of status for complete backup.
 * Visibility: internalQuery — called only by exportAsOPML action.
 */
export const listFeedsForExport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db.query('feeds').collect();
    return feeds.map((f) => ({
      name: f.name,
      url: f.url,
      category: f.category,
      status: f.status,
      syncFrequency: f.syncFrequency,
      lastSyncAt: f.lastSyncAt,
    }));
  },
});
```

### 3. Create OPML export action

Create `convex/feeds/opmlExport.ts`:

```typescript
/**
 * OPML Export Action
 *
 * Queries all feeds and generates OPML 2.0 XML for download.
 *
 * @module convex/feeds/opmlExport
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { generateOPML } from './utils/opmlGenerator';

/**
 * Export all feeds as OPML 2.0 XML string.
 * Visibility: internalAction — called by public wrapper exportOPML.
 */
export const exportAsOPML = internalAction({
  args: {
    title: v.optional(v.string()),
    categoryFilter: v.optional(v.string()), // Export only feeds in this category
    statusFilter: v.optional(
      v.union(v.literal('active'), v.literal('paused'), v.literal('error'))
    ),
  },
  handler: async (ctx, args) => {
    // 1. Query all feeds
    let feeds = await ctx.runQuery(internal.feeds.queries.listFeedsForExport, {});

    // 2. Apply optional filters
    if (args.categoryFilter) {
      feeds = feeds.filter((f: any) => f.category === args.categoryFilter);
    }
    if (args.statusFilter) {
      feeds = feeds.filter((f: any) => f.status === args.statusFilter);
    }

    // 3. Generate OPML XML
    const title = args.title || `AMD Feed Export - ${new Date().toISOString().split('T')[0]}`;
    const opmlXml = generateOPML(feeds, title);

    console.log(`[opmlExport] Exported ${feeds.length} feeds as OPML`);

    return {
      xml: opmlXml,
      feedCount: feeds.length,
      categories: [...new Set(feeds.map((f: any) => f.category))],
    };
  },
});
```

### 4. Add public action wrapper for dashboard access

Add to `convex/feeds/opmlExport.ts`, after `exportAsOPML`:

```typescript
import { action } from '../_generated/server';

/**
 * Public wrapper for OPML export — callable from dashboard/UI.
 */
export const exportOPML = action({
  args: {
    title: v.optional(v.string()),
    categoryFilter: v.optional(v.string()),
    statusFilter: v.optional(
      v.union(v.literal('active'), v.literal('paused'), v.literal('error'))
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.runAction(internal.feeds.opmlExport.exportAsOPML, args);
  },
});
```

**Calling convention:**
- Dashboard/UI calls: `api.feeds.opmlExport.exportOPML` (public `action`)
- Other Convex functions call: `internal.feeds.opmlExport.exportAsOPML` (internalAction)

### 5. Create test script

Create `scripts/test-opml-export.ts`:

```typescript
/**
 * Test OPML Export
 *
 * Usage: npx tsx scripts/test-opml-export.ts
 *
 * Tests the OPML generator with sample data locally.
 */

import { generateOPML, type ExportableFeed } from '../convex/feeds/utils/opmlGenerator';

const sampleFeeds: ExportableFeed[] = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology', status: 'active', syncFrequency: 'daily' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology', status: 'active', syncFrequency: 'daily' },
  { name: 'HubSpot Blog', url: 'https://blog.hubspot.com/rss.xml', category: 'marketing', status: 'active', syncFrequency: 'daily' },
  { name: 'Paused Feed', url: 'https://example.com/paused.xml', category: 'other', status: 'paused', syncFrequency: 'weekly' },
  { name: 'Feed with "quotes" & <special> chars', url: 'https://example.com/special.xml', category: 'other', status: 'active', syncFrequency: 'daily' },
];

console.log('Generating OPML from sample feeds...\n');

const opml = generateOPML(sampleFeeds, 'Test Export');
console.log(opml);

// Validate structure
console.log('\n--- Validation ---');
console.log(`Contains <?xml: ${opml.includes('<?xml')}`);
console.log(`Contains <opml version="2.0": ${opml.includes('version="2.0"')}`);
console.log(`Contains <head>: ${opml.includes('<head>')}`);
console.log(`Contains <body>: ${opml.includes('<body>')}`);
console.log(`Feed count in output: ${(opml.match(/xmlUrl=/g) || []).length}`);
console.log(`Category folders: ${(opml.match(/<outline text="[^"]*" title="[^"]*">/g) || []).length}`);
console.log(`Special chars escaped: ${opml.includes('&amp;') && opml.includes('&quot;') && opml.includes('&lt;')}`);

// --- Roundtrip test: export then re-import ---
console.log('\n--- Roundtrip Test (Export → Re-Import) ---');
import { parseOPML, validateOPMLFeeds } from '../convex/feeds/utils/opmlParser';

const reimported = parseOPML(opml);
const reimportValidation = validateOPMLFeeds(reimported.feeds);

console.log(`Re-imported feeds: ${reimported.feeds.length}`);
console.log(`Valid after reimport: ${reimportValidation.valid.length}`);

// Verify all original URLs survive the roundtrip
const originalUrls = new Set(sampleFeeds.map(f => f.url));
const reimportedUrls = new Set(reimported.feeds.map(f => f.xmlUrl));
const allUrlsPreserved = [...originalUrls].every(url => reimportedUrls.has(url));
console.log(`[${allUrlsPreserved ? 'PASS' : 'FAIL'}] All URLs preserved in roundtrip`);

// Verify all original names survive
const originalNames = new Set(sampleFeeds.map(f => f.name));
const reimportedNames = new Set(reimported.feeds.map(f => f.title));
const allNamesPreserved = [...originalNames].every(name => reimportedNames.has(name));
console.log(`[${allNamesPreserved ? 'PASS' : 'FAIL'}] All names preserved in roundtrip`);

// Verify count matches
const countMatch = reimported.feeds.length === sampleFeeds.length;
console.log(`[${countMatch ? 'PASS' : 'FAIL'}] Feed count matches (${reimported.feeds.length} == ${sampleFeeds.length})`);

console.log('\nDone.');
```

## Verification

- [ ] `generateOPML` produces valid OPML 2.0 XML with `<?xml>`, `<opml>`, `<head>`, `<body>` structure
- [ ] Feeds are grouped by category into folder `<outline>` elements
- [ ] XML special characters (`&`, `<`, `>`, `"`, `'`) are properly escaped
- [ ] `listFeedsForExport` returns all feeds with required fields
- [ ] `exportAsOPML` supports optional category and status filters
- [ ] Generated OPML can be re-imported using Plan 02's `parseOPML` (roundtrip test)
- [ ] `npx convex dev` deploys without errors

## Regression Check

Before marking complete, run existing Phase 1-5 sync tests:
```bash
npx tsx scripts/test-feed-sync.ts
npx tsx scripts/test-multi-feed-sync.ts
```

## must_haves

- generateOPML produces valid OPML 2.0 XML
- All feeds included in export, grouped by category
- XML entities properly escaped
- Export action supports optional filters (category, status)
- Roundtrip: export then re-import preserves feed URLs and names
- No breaking changes to existing queries
