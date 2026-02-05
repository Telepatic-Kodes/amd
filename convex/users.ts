import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

// Called after login to sync Clerk user to Convex
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const clerkId = identity.subject;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      // Update name/email/image if changed
      const updates: Record<string, unknown> = { updatedAt: Date.now() };
      if (identity.name && identity.name !== existing.name) updates.name = identity.name;
      if (identity.email && identity.email !== existing.email) updates.email = identity.email;
      if (identity.pictureUrl && identity.pictureUrl !== existing.imageUrl) updates.imageUrl = identity.pictureUrl;

      if (Object.keys(updates).length > 1) {
        await ctx.db.patch(existing._id, updates);
      }
      return existing._id;
    }

    // Check if this is the first user (becomes system owner)
    const userCount = (await ctx.db.query("users").collect()).length;
    const isFirstUser = userCount === 0;

    const userId = await ctx.db.insert("users", {
      clerkId,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      role: isFirstUser ? "owner" : "editor",
      isSystemOwner: isFirstUser ? true : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// List all users (admin only, for future team management)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || (currentUser.role !== "owner" && currentUser.role !== "admin")) {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});
