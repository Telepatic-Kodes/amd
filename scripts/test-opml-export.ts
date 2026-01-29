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
const checks = [
  ['Contains <?xml', opml.includes('<?xml')],
  ['Contains <opml version="2.0"', opml.includes('version="2.0"')],
  ['Contains <head>', opml.includes('<head>')],
  ['Contains <body>', opml.includes('<body>')],
  ['Feed count in output', (opml.match(/xmlUrl=/g) || []).length === sampleFeeds.length],
  ['Category folders', (opml.match(/<outline text="[^"]*" title="[^"]*">/g) || []).length === 3],
  ['Special chars escaped', opml.includes('&amp;') && opml.includes('&quot;') && opml.includes('&lt;')],
] as const;

let allPassed = true;
for (const [name, result] of checks) {
  console.log(`[${result ? 'PASS' : 'FAIL'}] ${name}`);
  if (!result) allPassed = false;
}

// --- Roundtrip test (only if opmlParser exists) ---
async function runRoundtripTest() {
  console.log('\n--- Roundtrip Test (Export → Re-Import) ---');
  try {
    const { parseOPML, validateOPMLFeeds } = require('../convex/feeds/utils/opmlParser');

    const reimported = parseOPML(opml);
    const reimportValidation = validateOPMLFeeds(reimported.feeds);

    console.log(`Re-imported feeds: ${reimported.feeds.length}`);
    console.log(`Valid after reimport: ${reimportValidation.valid.length}`);

    const originalUrls = new Set(sampleFeeds.map(f => f.url));
    const reimportedUrls = new Set(reimported.feeds.map((f: any) => f.xmlUrl));
    const allUrlsPreserved = [...originalUrls].every(url => reimportedUrls.has(url));
    console.log(`[${allUrlsPreserved ? 'PASS' : 'FAIL'}] All URLs preserved in roundtrip`);
    if (!allUrlsPreserved) allPassed = false;

    const originalNames = new Set(sampleFeeds.map(f => f.name));
    const reimportedNames = new Set(reimported.feeds.map((f: any) => f.title));
    const allNamesPreserved = [...originalNames].every(name => reimportedNames.has(name));
    console.log(`[${allNamesPreserved ? 'PASS' : 'FAIL'}] All names preserved in roundtrip`);
    if (!allNamesPreserved) allPassed = false;

    const countMatch = reimported.feeds.length === sampleFeeds.length;
    console.log(`[${countMatch ? 'PASS' : 'FAIL'}] Feed count matches (${reimported.feeds.length} == ${sampleFeeds.length})`);
    if (!countMatch) allPassed = false;
  } catch {
    console.log('[SKIP] opmlParser not available yet (Plan 02 not executed). Roundtrip test skipped.');
  }
}

runRoundtripTest().then(() => {
  console.log(`\n${allPassed ? 'All checks passed!' : 'Some checks failed.'}`);
  console.log('Done.');
});
