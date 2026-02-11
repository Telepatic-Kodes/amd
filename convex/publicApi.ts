import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

/**
 * Public API authentication and management.
 * Handles key creation, validation, revocation, and usage tracking.
 * Keys are stored as SHA-256 hashes — the plaintext is only shown once at creation.
 */

// Generate a random token: amd_live_<40 random hex chars>
function generateToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `amd_live_${hex}`;
}

// SHA-256 hash (for secure storage)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a new API token. Returns the plaintext (shown once).
 */
export const createToken = mutation({
  args: {
    name: v.string(),
    permissions: v.array(v.string()),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { name, permissions, expiresInDays }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const userId = identity.subject;
    const plainToken = generateToken();
    const keyHash = await hashToken(plainToken);
    const keyPrefix = plainToken.slice(0, 17); // "amd_live_abc12345"

    const now = Date.now();
    const expiresAt = expiresInDays ? now + expiresInDays * 86400000 : undefined;

    await ctx.db.insert("apiKeys", {
      userId,
      name,
      keyHash,
      keyPrefix,
      permissions: permissions as any,
      status: "active",
      totalRequests: 0,
      createdAt: now,
      expiresAt,
    });

    return { token: plainToken, prefix: keyPrefix };
  },
});

/**
 * List all API tokens for the current user (metadata only, no secrets).
 */
export const listTokens = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      permissions: k.permissions,
      status: k.status,
      lastUsedAt: k.lastUsedAt,
      totalRequests: k.totalRequests || 0,
      createdAt: k.createdAt,
      expiresAt: k.expiresAt,
      revokedAt: k.revokedAt,
    }));
  },
});

/**
 * Revoke an API token.
 */
export const revokeToken = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const key = await ctx.db.get(id);
    if (!key || key.userId !== identity.subject) {
      throw new Error("Token no encontrado");
    }

    await ctx.db.patch(id, {
      status: "revoked",
      revokedAt: Date.now(),
    });
  },
});

/**
 * Validate a token from an HTTP request (internal use by API middleware).
 */
export const validateToken = internalMutation({
  args: {
    keyHash: v.string(),
    requiredPermission: v.string(),
  },
  handler: async (ctx, { keyHash, requiredPermission }) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();

    if (!key) return { valid: false, error: "Token inválido" };
    if (key.status === "revoked") return { valid: false, error: "Token revocado" };
    if (key.expiresAt && key.expiresAt < Date.now()) {
      return { valid: false, error: "Token expirado" };
    }

    const hasPermission =
      key.permissions.includes("admin") ||
      key.permissions.includes(requiredPermission as any);

    if (!hasPermission) {
      return { valid: false, error: "Permisos insuficientes" };
    }

    // Update usage stats
    await ctx.db.patch(key._id, {
      lastUsedAt: Date.now(),
      totalRequests: (key.totalRequests || 0) + 1,
    });

    return { valid: true, userId: key.userId, keyId: key._id };
  },
});

/**
 * Log an API request for usage tracking.
 */
export const logUsage = internalMutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    endpoint: v.string(),
    method: v.string(),
    statusCode: v.number(),
    responseTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiUsage", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get usage stats for a specific token.
 */
export const getTokenUsage = query({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const key = await ctx.db.get(keyId);
    if (!key || key.userId !== identity.subject) return null;

    const recentUsage = await ctx.db
      .query("apiUsage")
      .withIndex("by_apiKey", (q) => q.eq("apiKeyId", keyId))
      .order("desc")
      .take(100);

    const totalRecent = recentUsage.length;
    const avgResponseTime =
      totalRecent > 0
        ? Math.round(recentUsage.reduce((sum, u) => sum + u.responseTimeMs, 0) / totalRecent)
        : 0;
    const errorCount = recentUsage.filter((u) => u.statusCode >= 400).length;

    return {
      totalRequests: key.totalRequests || 0,
      recentRequests: totalRecent,
      avgResponseTime,
      errorRate: totalRecent > 0 ? Math.round((errorCount / totalRecent) * 100) : 0,
      lastUsedAt: key.lastUsedAt,
    };
  },
});

/**
 * Internal: count recent requests for rate limiting.
 */
export const getRecentRequestCount = internalQuery({
  args: {
    apiKeyId: v.id("apiKeys"),
    windowMs: v.number(),
  },
  handler: async (ctx, { apiKeyId, windowMs }) => {
    const cutoff = Date.now() - windowMs;
    const recent = await ctx.db
      .query("apiUsage")
      .withIndex("by_apiKey_timestamp", (q) =>
        q.eq("apiKeyId", apiKeyId).gt("timestamp", cutoff)
      )
      .collect();
    return recent.length;
  },
});
