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
