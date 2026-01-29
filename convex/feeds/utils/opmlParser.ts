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

  // Track open/close folder depth to determine if feed is inside a folder
  // Folders are <outline> tags WITHOUT xmlUrl that contain children
  const folderStack: string[] = [];
  const tagRegex = /<outline\s[^>]*text\s*=\s*"([^"]*)"[^>]*>|<\/outline>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = tagRegex.exec(before)) !== null) {
    const tag = tagMatch[0];
    if (tag.startsWith('</')) {
      // Closing tag - pop folder stack
      folderStack.pop();
    } else if (!tag.includes('xmlUrl') && !tag.endsWith('/>')) {
      // Opening folder tag (not a feed, not self-closing)
      folderStack.push(tagMatch[1]);
    }
    // Self-closing feed outlines don't affect the stack
  }

  return folderStack.length > 0
    ? decodeXMLEntities(folderStack[folderStack.length - 1])
    : undefined;
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
