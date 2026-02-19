import { query } from "../_generated/server";
import { v } from "convex/values";

export const getConnection = query({
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    if (!connection) return null;

    const now = Date.now();
    const isExpired = connection.accessTokenExpiresAt < now;
    const expiresInDays = Math.floor(
      (connection.accessTokenExpiresAt - now) / (1000 * 60 * 60 * 24)
    );

    // NEVER expose tokens to frontend
    return {
      _id: connection._id,
      googleAccountId: connection.googleAccountId,
      email: connection.email,
      displayName: connection.displayName,
      profilePicture: connection.profilePicture,
      status: isExpired ? ("expired" as const) : connection.status,
      expiresInDays,
      isExpiringSoon: expiresInDays <= 7 && expiresInDays > 0,
      connectedAt: connection.connectedAt,
    };
  },
});

export const getImportHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("googleDriveImportLog")
      .order("desc")
      .take(args.limit ?? 20);
  },
});
