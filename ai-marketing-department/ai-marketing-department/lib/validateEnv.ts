/**
 * Environment validation — runs at server startup (build time + server-side only).
 * Prevents production from running with test/dev keys.
 */
export function validateEnvironment() {
  // Only run server-side
  if (typeof window !== "undefined") return;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isProduction =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production";

  // Critical: Convex URL is required in ALL environments
  if (!convexUrl) {
    throw new Error(
      "[AMD] NEXT_PUBLIC_CONVEX_URL is not set. The app cannot connect to the backend."
    );
  }

  if (isProduction) {
    // Block test Clerk keys in production
    if (clerkKey?.startsWith("pk_test_")) {
      throw new Error(
        "[AMD] Production is using Clerk test keys (pk_test_*). " +
          "Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to a pk_live_* key in Vercel."
      );
    }

    // Block localhost Convex URL in production
    if (convexUrl.includes("localhost")) {
      throw new Error(
        "[AMD] Production NEXT_PUBLIC_CONVEX_URL points to localhost. " +
          "Set it to your production Convex deployment URL."
      );
    }

    // Warn if Clerk key is missing entirely
    if (!clerkKey) {
      console.warn(
        "[AMD] Warning: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in production. " +
          "Authentication will not work."
      );
    }
  }

  console.log(
    `[AMD] Environment validation passed (${isProduction ? "production" : process.env.NODE_ENV})`
  );
}
