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
