/**
 * Feed Item Validation and Normalization
 *
 * This module implements lenient validation (SYNC-03) and normalization (SYNC-07)
 * for RSS/Atom feed items. The philosophy is:
 * - Never reject items outright unless absolutely necessary
 * - Warn about issues but process anyway when possible
 * - Normalize data to consistent format for reliable storage
 *
 * @module convex/feeds/utils/validation
 * @see SYNC-03 requirement for lenient validation
 * @see SYNC-07 requirement for content normalization
 */

/**
 * Raw feed item as returned by Feedsmith parser
 * Supports RSS 2.0, Atom, and RSS 1.0 (RDF) field variations
 */
export interface RawFeedItem {
  title?: string;
  description?: string;
  link?: string;
  guid?: string;
  id?: string; // Atom format
  pubDate?: string;
  published?: string; // Atom format
  updated?: string; // Atom format
  author?: string | { name?: string };
  creator?: string; // Dublin Core
  categories?: string[] | Array<{ term?: string; label?: string }>;
  content?: string;
  'content:encoded'?: string; // Common RSS extension
  summary?: string; // Atom format
}

/**
 * Normalized feed item ready for storage
 * All fields have consistent types and formats
 */
export interface NormalizedFeedItem {
  title: string;
  link: string;
  guid: string | null;
  content: string | null;
  summary: string | null;
  author: string | null;
  publishedAt: number | null;
  categories: string[];
}

/**
 * Result of feed item validation
 */
export interface ValidationResult {
  /** Whether the item has minimum required fields */
  valid: boolean;
  /** Critical errors that prevent processing */
  errors: string[];
  /** Non-critical issues that were handled */
  warnings: string[];
  /** The original item (unmodified) */
  item: RawFeedItem;
}

/**
 * Common HTML entities to decode
 */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&nbsp;': ' ',
};

/**
 * Decodes common HTML entities in a string
 *
 * @param str - String possibly containing HTML entities
 * @returns String with entities decoded
 */
function decodeHtmlEntities(str: string): string {
  let result = str;
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }
  // Handle numeric entities like &#60;
  result = result.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );
  // Handle hex entities like &#x3C;
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return result;
}

/**
 * Parses various date formats to Unix timestamp
 *
 * Handles:
 * - ISO 8601 (2024-01-15T10:00:00Z)
 * - RFC 2822 (Mon, 15 Jan 2024 10:00:00 GMT)
 * - RFC 822 (15 Jan 2024 10:00:00 GMT)
 * - Common variations
 *
 * @param dateStr - Date string in various formats
 * @returns Unix timestamp in milliseconds, or null if unparseable
 */
function parseDate(dateStr: string | undefined): number | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  // Try native Date.parse first (handles ISO 8601 and RFC 2822)
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return parsed;
  }

  // Try some common alternative formats
  // Remove timezone abbreviations that Date.parse doesn't handle
  const withoutTz = trimmed
    .replace(/\s+(EST|EDT|CST|CDT|MST|MDT|PST|PDT|GMT|UTC)\s*$/i, '')
    .trim();

  const parsedWithoutTz = Date.parse(withoutTz);
  if (!isNaN(parsedWithoutTz)) {
    return parsedWithoutTz;
  }

  // Return null rather than guessing - better to have no date than wrong date
  return null;
}

/**
 * Truncates a string to a maximum length, preserving word boundaries
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  // Find last space before maxLength
  const lastSpace = str.lastIndexOf(' ', maxLength - 3);
  const cutPoint = lastSpace > maxLength / 2 ? lastSpace : maxLength - 3;
  return str.slice(0, cutPoint) + '...';
}

/**
 * Resolves a potentially relative URL against a base URL
 *
 * @param url - URL that may be relative
 * @param baseUrl - Base URL to resolve against
 * @returns Absolute URL string
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    // If URL construction fails, return original
    return url;
  }
}

/**
 * Extracts author name from various author field formats
 *
 * @param author - Author field (string or object)
 * @returns Normalized author name or null
 */
function extractAuthor(
  author: string | { name?: string } | undefined,
  creator?: string
): string | null {
  if (typeof author === 'string' && author.trim()) {
    return truncate(author.trim(), 200);
  }
  if (author && typeof author === 'object' && author.name) {
    return truncate(author.name.trim(), 200);
  }
  if (creator && typeof creator === 'string' && creator.trim()) {
    return truncate(creator.trim(), 200);
  }
  return null;
}

/**
 * Extracts categories from various category field formats
 *
 * @param categories - Categories field (array of strings or objects)
 * @returns Normalized array of category strings
 */
function extractCategories(
  categories:
    | string[]
    | Array<{ term?: string; label?: string }>
    | undefined
): string[] {
  if (!categories || !Array.isArray(categories)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const cat of categories) {
    let value: string | undefined;
    if (typeof cat === 'string') {
      value = cat;
    } else if (cat && typeof cat === 'object') {
      value = cat.label || cat.term;
    }

    if (value && typeof value === 'string') {
      const trimmed = value.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed && !seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
  }

  return result;
}

/**
 * Validates a raw feed item for minimum required fields
 *
 * Implements lenient validation (SYNC-03):
 * - Only rejects items that truly cannot be processed
 * - Warns about issues but allows processing to continue
 *
 * Required: must have (title OR description) AND (link OR guid)
 *
 * @param item - Raw feed item from parser
 * @returns Validation result with errors, warnings, and validity status
 */
export function validateFeedItem(item: RawFeedItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for content (title or description)
  const hasTitle = item.title && typeof item.title === 'string' && item.title.trim();
  const hasDescription =
    item.description && typeof item.description === 'string' && item.description.trim();
  const hasContent =
    item.content && typeof item.content === 'string' && item.content.trim();

  if (!hasTitle && !hasDescription && !hasContent) {
    errors.push('Missing content: no title, description, or content field');
  }

  // Check for identifier (link or guid)
  const hasLink = item.link && typeof item.link === 'string' && item.link.trim();
  const hasGuid =
    (item.guid && typeof item.guid === 'string' && item.guid.trim()) ||
    (item.id && typeof item.id === 'string' && item.id.trim());

  if (!hasLink && !hasGuid) {
    errors.push('Missing identifier: no link or guid field');
  }

  // Warnings for missing optional fields
  if (!hasTitle && (hasDescription || hasContent)) {
    warnings.push('Missing title, will use truncated description');
  }

  if (!item.pubDate && !item.published && !item.updated) {
    warnings.push('Missing publication date');
  }

  if (!item.author && !item.creator) {
    warnings.push('Missing author information');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    item,
  };
}

/**
 * Normalizes a raw feed item to consistent storage format
 *
 * Implements content normalization (SYNC-07):
 * - Decodes HTML entities
 * - Resolves relative URLs
 * - Parses dates to timestamps
 * - Truncates fields to reasonable limits
 * - Deduplicates categories
 *
 * @param item - Raw feed item from parser
 * @param feedUrl - The feed's URL for resolving relative links
 * @returns Normalized item ready for storage
 */
export function normalizeFeedItem(
  item: RawFeedItem,
  feedUrl: string
): NormalizedFeedItem {
  // Extract title - prefer title, fall back to truncated description
  let title = '';
  if (item.title && typeof item.title === 'string' && item.title.trim()) {
    title = item.title.trim();
  } else if (item.description && typeof item.description === 'string') {
    title = item.description.trim();
  } else if (item.content && typeof item.content === 'string') {
    title = item.content.trim();
  }
  title = truncate(decodeHtmlEntities(title), 500);

  // Extract link - resolve against feed URL
  let link = '';
  if (item.link && typeof item.link === 'string') {
    link = resolveUrl(item.link.trim(), feedUrl);
  } else if (item.guid && typeof item.guid === 'string' && item.guid.startsWith('http')) {
    link = item.guid.trim();
  } else if (item.id && typeof item.id === 'string' && item.id.startsWith('http')) {
    link = item.id.trim();
  }

  // Extract GUID
  let guid: string | null = null;
  if (item.guid && typeof item.guid === 'string' && item.guid.trim()) {
    guid = item.guid.trim();
  } else if (item.id && typeof item.id === 'string' && item.id.trim()) {
    guid = item.id.trim();
  }

  // Extract content - prefer content:encoded, then content, then description
  let content: string | null = null;
  const rawContent =
    item['content:encoded'] || item.content || item.description;
  if (rawContent && typeof rawContent === 'string' && rawContent.trim()) {
    // Keep HTML structure but decode entities in text nodes
    content = decodeHtmlEntities(rawContent.trim());
  }

  // Extract summary - use description if different from content, or Atom summary
  let summary: string | null = null;
  if (item.summary && typeof item.summary === 'string' && item.summary.trim()) {
    summary = truncate(decodeHtmlEntities(item.summary.trim()), 500);
  } else if (
    item.description &&
    typeof item.description === 'string' &&
    item.description !== rawContent
  ) {
    summary = truncate(decodeHtmlEntities(item.description.trim()), 500);
  }

  // Parse publication date
  const publishedAt = parseDate(item.pubDate || item.published || item.updated);

  // Extract author
  const author = extractAuthor(item.author, item.creator);

  // Extract categories
  const categories = extractCategories(item.categories);

  return {
    title,
    link,
    guid,
    content,
    summary,
    author,
    publishedAt,
    categories,
  };
}
