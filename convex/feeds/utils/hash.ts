/**
 * Composite Key Hash Generation for Feed Item Deduplication
 *
 * This module implements SHA-256 hashing for creating unique content identifiers.
 * The composite key strategy addresses common RSS feed issues:
 *
 * - Many feeds have unreliable/duplicate GUIDs
 * - Some feeds don't include GUID at all
 * - Different feeds may reuse the same GUID
 * - Article updates can change GUID while content remains similar
 *
 * Composite Key Formula:
 * SHA-256(feedUrl + "|" + (guid || link) + "|" + pubDate + "|" + title)
 *
 * This combination ensures:
 * - Same article from same feed = same hash (deduplication works)
 * - Same article from different feeds = different hash (cross-feed tracking possible)
 * - Modified article (title change) = different hash (updates detected)
 *
 * @module convex/feeds/utils/hash
 * @see SYNC-02 requirement for composite key deduplication
 */

/**
 * Parameters for generating a content hash
 */
export interface ContentHashParams {
  /** The URL of the feed this item belongs to */
  feedUrl: string;
  /** The GUID/ID of the item (optional - will fall back to link) */
  guid?: string;
  /** The link/URL to the item */
  link: string;
  /** Publication date string (optional) */
  pubDate?: string;
  /** The title of the item */
  title: string;
}

/**
 * Computes SHA-256 hash of a string using Web Crypto API
 *
 * Uses the Web Crypto API which is available in Convex runtime
 * (NOT Node.js crypto module which is unavailable in edge runtime)
 *
 * @param message - The string to hash
 * @returns Lowercase hex string (64 characters)
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes a URL for consistent hashing
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes trailing slashes
 *
 * @param url - The URL to normalize
 * @returns Normalized URL string
 */
function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '');
}

/**
 * Normalizes a string for consistent hashing
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 *
 * @param str - The string to normalize
 * @returns Normalized string
 */
function normalizeString(str: string | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Generates a unique content hash for a feed item using composite key strategy
 *
 * The composite key formula:
 * SHA-256(feedUrl + "|" + (guid || link) + "|" + pubDate + "|" + title)
 *
 * This provides reliable deduplication even when:
 * - GUID is missing or unreliable
 * - Same content appears in multiple feeds
 * - Article titles or dates change slightly
 *
 * @param params - The feed item parameters
 * @param params.feedUrl - The URL of the feed
 * @param params.guid - Optional GUID (falls back to link if not provided)
 * @param params.link - The item's link URL
 * @param params.pubDate - Optional publication date string
 * @param params.title - The item's title
 *
 * @returns Promise resolving to lowercase 64-character hex string
 *
 * @example
 * ```typescript
 * const hash = await generateContentHash({
 *   feedUrl: 'https://example.com/feed.xml',
 *   guid: 'article-123',
 *   link: 'https://example.com/article',
 *   pubDate: '2024-01-15T10:00:00Z',
 *   title: 'My Article Title'
 * });
 * // Returns: "a3f2b8c1d4e5f6..."  (64 chars)
 * ```
 */
export async function generateContentHash(
  params: ContentHashParams
): Promise<string> {
  const { feedUrl, guid, link, pubDate, title } = params;

  // Normalize inputs for consistent hashing
  const normalizedFeedUrl = normalizeUrl(feedUrl);
  const normalizedIdentifier = normalizeUrl(guid || link); // Use GUID if available, otherwise link
  const normalizedPubDate = normalizeString(pubDate);
  const normalizedTitle = normalizeString(title);

  // Build composite key with pipe separators
  const compositeKey = [
    normalizedFeedUrl,
    normalizedIdentifier,
    normalizedPubDate,
    normalizedTitle,
  ].join('|');

  // Generate SHA-256 hash
  return sha256(compositeKey);
}
