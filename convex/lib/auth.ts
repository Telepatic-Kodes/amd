import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Require authentication. Throws if not authenticated.
 * Returns the user identity from Clerk JWT.
 * Use in ALL user-facing queries and mutations.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
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
