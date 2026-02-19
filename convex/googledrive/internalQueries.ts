import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getConnectionWithToken = internalQuery({
  args: { connectionId: v.id("googleDriveConnections") },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Google Drive connection not found");
    return connection;
  },
});

export const getActiveConnection = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("googleDriveConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();
  },
});
