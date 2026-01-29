---
wave: 1
depends_on: []
files_modified:
  - convex/feeds/mutations.ts
files_created:
  - convex/feeds/opmlImport.ts
  - convex/feeds/utils/opmlParser.ts
  - scripts/test-opml-import.ts
  - scripts/sample.opml
autonomous: true
---

# Plan 02: OPML Import

## Objective

Enable bulk feed import from OPML files — the standard export format from Feedly, Inoreader, NewsBlur, and other RSS readers. Users can upload a single OPML file and onboard dozens or hundreds of feeds at once.

## Why This First

- No dependencies on other plans (parallel with Plan 01)
- OPML is a well-defined XML standard — parsing is deterministic
- Enables enterprise-scale feed onboarding (100+ feeds in one action)
- Leverages existing `addFeed` logic for validation and deduplication

## Step-by-step

### 1. Create OPML parser utility

Create `convex/feeds/utils/opmlParser.ts`. Do NOT use an npm library — OPML is simple enough to parse with regex/string methods since Convex actions have limited npm support:

```typescript
/**
 * OPML Parser Utility
 *
 * Parses OPML 2.0 XML format into structured feed objects.
 * OPML spec: http://opml.org/spec2.opml
 *
 * @module convex/feeds/utils/opmlParser
 */

export interface OPMLFeed {
  title: string;
  xmlUrl: string;         // RSS/Atom feed URL
  htmlUrl?: string;       // Website URL
  category?: string;      // From parent <outline> text
  type?: string;          // "rss" typically
  description?: string;
}

export interface OPMLParseResult {
  title: string;          // Document title from <head>
  feeds: OPMLFeed[];
  errors: string[];
}

/**
 * Parse OPML XML string into structured feed list.
 *
 * Handles:
 * - Flat structure (all outlines at top level)
 * - Nested structure (outlines grouped by category folders)
 * - Mixed (some feeds in folders, some at root)
 */
export function parseOPML(xmlString: string): OPMLParseResult {
  const errors: string[] = [];
  const feeds: OPMLFeed[] = [];

  // Extract document title
  const titleMatch = xmlString.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Imported OPML';

  // Extract all <outline> elements with xmlUrl attribute (these are feeds)
  const outlineRegex = /<outline\s[^>]*xmlUrl\s*=\s*"([^"]*)"[^>]*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = outlineRegex.exec(xmlString)) !== null) {
    const outlineTag = match[0];
    const xmlUrl = match[1];

    if (!xmlUrl || !xmlUrl.startsWith('http')) {
      errors.push(`Invalid xmlUrl: ${xmlUrl}`);
      continue;
    }

    // Extract attributes from the outline tag
    const getAttr = (name: string): string | undefined => {
      const attrMatch = outlineTag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
      return attrMatch ? decodeXMLEntities(attrMatch[1]) : undefined;
    };

    const feedTitle = getAttr('title') || getAttr('text') || xmlUrl;
    const htmlUrl = getAttr('htmlUrl');
    const type = getAttr('type');
    const description = getAttr('description');

    // Determine category from parent outline (folder)
    const category = findParentCategory(xmlString, match.index) || 'uncategorized';

    feeds.push({
      title: feedTitle,
      xmlUrl: decodeXMLEntities(xmlUrl),
      htmlUrl: htmlUrl ? decodeXMLEntities(htmlUrl) : undefined,
      category,
      type,
      description,
    });
  }

  if (feeds.length === 0) {
    errors.push('No valid feed outlines found in OPML');
  }

  return { title, feeds, errors };
}

/**
 * Find the parent category folder for an outline at a given position.
 * Looks backward for the nearest <outline> without xmlUrl (i.e., a folder).
 */
function findParentCategory(xml: string, position: number): string | undefined {
  const before = xml.substring(0, position);
  const folderRegex = /<outline\s[^>]*text\s*=\s*"([^"]*)"[^>]*(?!xmlUrl)[^>]*>/gi;
  let lastFolder: string | undefined;
  let folderMatch: RegExpExecArray | null;

  while ((folderMatch = folderRegex.exec(before)) !== null) {
    if (!folderMatch[0].includes('xmlUrl')) {
      lastFolder = folderMatch[1];
    }
  }

  return lastFolder ? decodeXMLEntities(lastFolder) : undefined;
}

/**
 * Decode common XML entities
 */
function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Validate parsed feeds before import
 */
export interface ValidationResult {
  valid: OPMLFeed[];
  invalid: Array<{ feed: OPMLFeed; reason: string }>;
  duplicateUrls: string[];
}

export function validateOPMLFeeds(feeds: OPMLFeed[]): ValidationResult {
  const valid: OPMLFeed[] = [];
  const invalid: Array<{ feed: OPMLFeed; reason: string }> = [];
  const seenUrls = new Set<string>();
  const duplicateUrls: string[] = [];

  for (const feed of feeds) {
    if (!feed.xmlUrl.startsWith('http://') && !feed.xmlUrl.startsWith('https://')) {
      invalid.push({ feed, reason: 'URL must start with http:// or https://' });
      continue;
    }

    const normalizedUrl = feed.xmlUrl.toLowerCase().replace(/\/+$/, '');
    if (seenUrls.has(normalizedUrl)) {
      duplicateUrls.push(feed.xmlUrl);
      continue;
    }
    seenUrls.add(normalizedUrl);

    if (!feed.title || feed.title.trim().length === 0) {
      feed.title = new URL(feed.xmlUrl).hostname;
    }

    valid.push(feed);
  }

  return { valid, invalid, duplicateUrls };
}
```

### 2. Create OPML import action

Create `convex/feeds/opmlImport.ts`.

**Function visibility:**
- `importFromOPML` = `internalAction` (called by dashboard action wrapper or scripts)
- `batchInsertFeeds` = `internalMutation` (called only by importFromOPML)
- A public `action` wrapper will be added in step 5 for dashboard access.

**UUID generation:** Uses `crypto.randomUUID()` which is already used in the codebase
(see `convex/feeds/mutations.ts` line 56: `const feedId = crypto.randomUUID();`).
This works in Convex mutations and actions.

```typescript
/**
 * OPML Import Action
 *
 * Accepts OPML XML content, parses it, validates feeds,
 * and batch-inserts them using existing feed schema.
 *
 * @module convex/feeds/opmlImport
 */

import { v } from 'convex/values';
import { internalAction, internalMutation, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { parseOPML, validateOPMLFeeds } from './utils/opmlParser';

export interface ImportResult {
  success: boolean;
  totalParsed: number;
  feedsAdded: number;
  feedsSkipped: number;
  feedsInvalid: number;
  duplicatesInFile: number;
  errors: string[];
  addedFeeds: Array<{ name: string; url: string }>;
}

/**
 * Import feeds from OPML XML content
 */
export const importFromOPML = internalAction({
  args: {
    opmlContent: v.string(),
    defaultCategory: v.optional(v.string()),
    defaultSyncFrequency: v.optional(
      v.union(v.literal('hourly'), v.literal('daily'), v.literal('weekly'))
    ),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    const { opmlContent, defaultCategory, defaultSyncFrequency } = args;
    const errors: string[] = [];
    const addedFeeds: Array<{ name: string; url: string }> = [];

    // 1. Parse OPML
    const parsed = parseOPML(opmlContent);
    errors.push(...parsed.errors);

    if (parsed.feeds.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        feedsAdded: 0,
        feedsSkipped: 0,
        feedsInvalid: 0,
        duplicatesInFile: 0,
        errors: ['No feeds found in OPML content'],
        addedFeeds: [],
      };
    }

    // 2. Validate
    const validation = validateOPMLFeeds(parsed.feeds);
    const feedsInvalid = validation.invalid.length;
    const duplicatesInFile = validation.duplicateUrls.length;

    for (const inv of validation.invalid) {
      errors.push(`Invalid: ${inv.feed.xmlUrl} - ${inv.reason}`);
    }

    // 3. Batch insert valid feeds (batches of 10 for Convex transaction limits)
    let feedsAdded = 0;
    let feedsSkipped = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < validation.valid.length; i += BATCH_SIZE) {
      const batch = validation.valid.slice(i, i + BATCH_SIZE);

      const result = await ctx.runMutation(internal.feeds.opmlImport.batchInsertFeeds, {
        feeds: batch.map((f) => ({
          url: f.xmlUrl,
          name: f.title,
          category: f.category || defaultCategory || 'imported',
          syncFrequency: defaultSyncFrequency || 'daily',
        })),
      });

      feedsAdded += result.added;
      feedsSkipped += result.skipped;
      errors.push(...result.errors);

      for (const name of result.addedNames) {
        const feed = batch.find((f) => f.title === name);
        if (feed) addedFeeds.push({ name: feed.title, url: feed.xmlUrl });
      }
    }

    console.log(
      `[opmlImport] Imported ${feedsAdded} feeds, skipped ${feedsSkipped}, ` +
      `invalid ${feedsInvalid}, duplicates ${duplicatesInFile}`
    );

    return {
      success: feedsAdded > 0,
      totalParsed: parsed.feeds.length,
      feedsAdded,
      feedsSkipped,
      feedsInvalid,
      duplicatesInFile,
      errors,
      addedFeeds,
    };
  },
});

/**
 * Batch insert feeds (mutation for transactional safety)
 */
export const batchInsertFeeds = internalMutation({
  args: {
    feeds: v.array(
      v.object({
        url: v.string(),
        name: v.string(),
        category: v.string(),
        syncFrequency: v.union(
          v.literal('hourly'),
          v.literal('daily'),
          v.literal('weekly')
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];
    const addedNames: string[] = [];

    for (const feed of args.feeds) {
      try {
        const existing = await ctx.db
          .query('feeds')
          .withIndex('by_url', (q) => q.eq('url', feed.url))
          .first();

        if (existing) {
          skipped++;
          continue;
        }

        await ctx.db.insert('feeds', {
          feedId: crypto.randomUUID(),
          url: feed.url,
          name: feed.name,
          category: feed.category,
          status: 'active',
          syncFrequency: feed.syncFrequency,
          consecutiveErrors: 0,
          createdAt: now,
          updatedAt: now,
        });

        added++;
        addedNames.push(feed.name);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to add ${feed.url}: ${msg}`);
      }
    }

    return { added, skipped, errors, addedNames };
  },
});
```

### 3. Create sample OPML test file

Create `scripts/sample.opml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>AMD Test Feed Collection</title>
    <dateCreated>Thu, 01 Jan 2026 00:00:00 GMT</dateCreated>
  </head>
  <body>
    <outline text="Technology" title="Technology">
      <outline type="rss" text="TechCrunch" title="TechCrunch"
        xmlUrl="https://techcrunch.com/feed/"
        htmlUrl="https://techcrunch.com/" />
      <outline type="rss" text="Ars Technica" title="Ars Technica"
        xmlUrl="https://feeds.arstechnica.com/arstechnica/index"
        htmlUrl="https://arstechnica.com/" />
    </outline>
    <outline text="Marketing" title="Marketing">
      <outline type="rss" text="HubSpot Blog" title="HubSpot Blog"
        xmlUrl="https://blog.hubspot.com/rss.xml"
        htmlUrl="https://blog.hubspot.com/" />
      <outline type="rss" text="Content Marketing Institute" title="Content Marketing Institute"
        xmlUrl="https://contentmarketinginstitute.com/feed/"
        htmlUrl="https://contentmarketinginstitute.com/" />
    </outline>
    <outline type="rss" text="Uncategorized Feed" title="Uncategorized Feed"
      xmlUrl="https://example.com/feed.xml"
      htmlUrl="https://example.com/" />
  </body>
</opml>
```

### 4. Create test script

Create `scripts/test-opml-import.ts`:

```typescript
/**
 * Test OPML Import
 *
 * Usage: npx tsx scripts/test-opml-import.ts [path-to-opml]
 *
 * Tests parsing and validation locally (no Convex needed).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseOPML, validateOPMLFeeds } from '../convex/feeds/utils/opmlParser';

const opmlPath = process.argv[2] || join(__dirname, 'sample.opml');

console.log(`Parsing OPML file: ${opmlPath}\n`);

const opmlContent = readFileSync(opmlPath, 'utf-8');
const parsed = parseOPML(opmlContent);

console.log(`Document title: ${parsed.title}`);
console.log(`Feeds found: ${parsed.feeds.length}`);
console.log(`Parse errors: ${parsed.errors.length}`);

if (parsed.errors.length > 0) {
  console.log('\nParse errors:');
  for (const err of parsed.errors) {
    console.log(`  - ${err}`);
  }
}

console.log('\nFeeds:');
for (const feed of parsed.feeds) {
  console.log(`  [${feed.category || 'uncategorized'}] ${feed.title}`);
  console.log(`    URL: ${feed.xmlUrl}`);
}

const validation = validateOPMLFeeds(parsed.feeds);
console.log(`\nValidation:`);
console.log(`  Valid: ${validation.valid.length}`);
console.log(`  Invalid: ${validation.invalid.length}`);
console.log(`  Duplicate URLs: ${validation.duplicateUrls.length}`);

if (validation.invalid.length > 0) {
  console.log('\nInvalid feeds:');
  for (const inv of validation.invalid) {
    console.log(`  - ${inv.feed.xmlUrl}: ${inv.reason}`);
  }
}

console.log('\nDone. To import into Convex, call importFromOPML action.');
```

### 5. Add public action wrapper for dashboard access

Add to the same file `convex/feeds/opmlImport.ts`, after `batchInsertFeeds`:

```typescript
/**
 * Public wrapper for OPML import — callable from dashboard/UI.
 * Delegates to internalAction importFromOPML.
 */
export const importOPML = action({
  args: {
    opmlContent: v.string(),
    defaultCategory: v.optional(v.string()),
    defaultSyncFrequency: v.optional(
      v.union(v.literal('hourly'), v.literal('daily'), v.literal('weekly'))
    ),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    return await ctx.runAction(internal.feeds.opmlImport.importFromOPML, args);
  },
});
```

**Calling convention:**
- Dashboard/UI calls: `api.feeds.opmlImport.importOPML` (public `action`)
- Other Convex functions call: `internal.feeds.opmlImport.importFromOPML` (internalAction)
- `batchInsertFeeds` is never called externally (internalMutation, called only by importFromOPML)

## Regression Check

Before marking complete, run existing Phase 1-5 sync tests:
```bash
npx tsx scripts/test-feed-sync.ts
npx tsx scripts/test-multi-feed-sync.ts
```

## Verification

- [ ] `parseOPML` extracts feeds from nested and flat OPML structures
- [ ] `validateOPMLFeeds` rejects invalid URLs and detects duplicates within file
- [ ] `batchInsertFeeds` skips feeds already existing in DB (by URL)
- [ ] `importFromOPML` returns accurate counts (added, skipped, invalid, duplicates)
- [ ] Sample OPML file parses to 5 feeds across 3 categories
- [ ] `npx tsx scripts/test-opml-import.ts` runs without errors
- [ ] `npx convex dev` deploys without errors

## must_haves

- OPML parser handles standard OPML 2.0 format (nested folders, flat lists, mixed)
- Feed validation checks URL format and deduplicates within file
- Batch insert uses existing feed schema, checks for DB duplicates by URL
- Import returns structured result with counts and error details
- No external npm dependencies for parsing (Convex action compatibility)
- No breaking changes to existing feed mutations
