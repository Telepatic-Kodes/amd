/**
 * Shared OAuth helper functions for Convex HTTP routes.
 * Centralizes frontend URL resolution and callback URL building.
 */

/**
 * Get the frontend URL from environment, with fallback to localhost for dev.
 * In production, FRONTEND_URL must be set in Convex Dashboard.
 */
export function getFrontendUrl(): string {
  const url = process.env.FRONTEND_URL;
  if (!url) {
    console.warn("FRONTEND_URL not set, defaulting to http://localhost:3000");
    return "http://localhost:3000";
  }
  return url.replace(/\/$/, ""); // Remove trailing slash
}

/**
 * Build a Convex HTTP callback URL from the request origin.
 * Uses the Convex .site domain as the callback target.
 */
export function getOAuthCallbackUrl(requestUrl: string, path: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}${path}`;
}
