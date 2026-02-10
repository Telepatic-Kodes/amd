import { QueryCtx, MutationCtx } from "../_generated/server";

// DEV BYPASS: Set to true to skip Clerk auth in development
// Hardcoded because Convex cloud doesn't have process.env.NODE_ENV
// TODO: Set back to false before production
const DEV_AUTH_BYPASS = true;

const DEV_IDENTITY = {
  subject: "dev-user-001",
  issuer: "dev-bypass",
  email: "dev@amd.local",
  name: "Dev User",
  pictureUrl: undefined,
  tokenIdentifier: "dev-bypass|dev-user-001",
};

/**
 * Require authentication. Throws if not authenticated.
 * Returns the user identity from Clerk JWT.
 * In dev mode with bypass enabled, returns a mock identity.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    if (DEV_AUTH_BYPASS) {
      return DEV_IDENTITY;
    }
    throw new Error("No autenticado. Inicia sesión para continuar.");
  }
  return identity;
}

/**
 * Get the current user's Clerk subject ID.
 * This is the userId stored on records for data isolation.
 */
export async function getUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await requireAuth(ctx);
  return identity.subject;
}

/**
 * Optional auth — returns identity or null.
 * Use for queries that work differently when authenticated vs not.
 */
export async function optionalAuth(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}
