import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

// Create a shareable link for the brand manual
export const createShare = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const token = crypto.randomUUID();

    const id = await ctx.db.insert("brandManualShares", {
      brandProfileId: args.brandProfileId,
      token,
      createdBy: userId,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    return { id, token };
  },
});

// Revoke a share
export const revokeShare = mutation({
  args: { id: v.id("brandManualShares") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get brand profile by share token (public — no auth required)
export const getBrandProfileByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("brandManualShares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!share) return null;

    // Check expiration
    if (share.expiresAt && share.expiresAt < Date.now()) return null;

    const profile = await ctx.db.get(share.brandProfileId);
    if (!profile) return null;

    // Also get active strategy for this brand
    const strategies = await ctx.db
      .query("marketingStrategies")
      .withIndex("by_brandProfile", (q) => q.eq("brandProfileId", share.brandProfileId))
      .order("desc")
      .collect();

    const strategy = strategies.find(
      (s) => s.status === "completed" || s.status === "executing" || s.status === "ready"
    ) ?? null;

    return { profile, strategy };
  },
});
