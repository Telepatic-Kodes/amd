/**
 * Rate Limiting Utilities
 *
 * Handles HTTP 429 responses with exponential backoff.
 * Respects Retry-After header when present.
 *
 * @module convex/feeds/utils/rateLimit
 * @see SYNC-05 requirement for rate limiting
 */

/**
 * Maximum retry attempts before giving up
 */
export const MAX_RETRY_ATTEMPTS = 4;

/**
 * Base delay for exponential backoff (1 second)
 */
export const BASE_DELAY_MS = 1000;

/**
 * Maximum delay cap (5 minutes)
 */
export const MAX_DELAY_MS = 5 * 60 * 1000;

/**
 * Result of rate limit detection
 */
export interface RateLimitResult {
  isRateLimited: boolean;
  retryAfterMs: number | null;
  retryAttempt: number;
}

/**
 * Calculates exponential backoff delay
 *
 * Formula: min(BASE_DELAY * 2^attempt, MAX_DELAY)
 * Results: 1s, 2s, 4s, 8s, then caps at 5min
 *
 * @param attempt - Current retry attempt (0-based)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  return Math.min(delay, MAX_DELAY_MS);
}

/**
 * Parses Retry-After header value
 *
 * Retry-After can be:
 * - Seconds (integer): "120" -> 120000ms
 * - HTTP date: "Wed, 21 Oct 2015 07:28:00 GMT" -> delta from now
 *
 * @param headerValue - Retry-After header value
 * @returns Delay in milliseconds, or null if unparseable
 */
export function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;

  // Try parsing as seconds (most common)
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  // Try parsing as HTTP date
  const date = Date.parse(headerValue);
  if (!isNaN(date)) {
    const delayMs = date - Date.now();
    return delayMs > 0 ? delayMs : null;
  }

  return null;
}

/**
 * Determines if response indicates rate limiting
 *
 * Checks for:
 * - HTTP 429 Too Many Requests
 * - HTTP 503 with Retry-After (some servers use this)
 *
 * @param status - HTTP status code
 * @param retryAfterHeader - Retry-After header value
 * @param currentAttempt - Current retry attempt number
 * @returns Rate limit result with retry timing
 */
export function handleRateLimit(
  status: number,
  retryAfterHeader: string | null,
  currentAttempt: number
): RateLimitResult {
  // Not rate limited
  if (status !== 429 && status !== 503) {
    return {
      isRateLimited: false,
      retryAfterMs: null,
      retryAttempt: currentAttempt,
    };
  }

  // 503 without Retry-After is not rate limiting (it's server error)
  if (status === 503 && !retryAfterHeader) {
    return {
      isRateLimited: false,
      retryAfterMs: null,
      retryAttempt: currentAttempt,
    };
  }

  // Parse Retry-After or use exponential backoff
  const retryAfterMs = parseRetryAfter(retryAfterHeader) ?? calculateBackoff(currentAttempt);

  return {
    isRateLimited: true,
    retryAfterMs: Math.min(retryAfterMs, MAX_DELAY_MS),
    retryAttempt: currentAttempt + 1,
  };
}
