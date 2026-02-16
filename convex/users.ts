import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { requireRole } from "./lib/permissions";

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
    let subject: string;
    try {
      const identity = await requireAuth(ctx);
      subject = identity.subject;
    } catch {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", subject))
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

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("reviewer"),
      v.literal("publisher"),
      v.literal("viewer")
    ), // Cannot assign "owner" role
  },
  handler: async (ctx, args) => {
    // Guard: Only owners and admins can change roles
    await requireRole(ctx, "users:manage");

    // Get the target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Usuario no encontrado.");
    }

    // Prevent changing the system owner's role
    if (targetUser.isSystemOwner) {
      throw new Error("No se puede cambiar el rol del propietario del sistema.");
    }

    // Get current user to prevent self-demotion of last admin
    const identity = await requireAuth(ctx);
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    // If trying to demote an admin/owner, check if they're the last one
    if (
      (targetUser.role === "admin" || targetUser.role === "owner") &&
      args.role !== "admin"
    ) {
      const allAdmins = await ctx.db
        .query("users")
        .filter((q) =>
          q.or(
            q.eq(q.field("role"), "admin"),
            q.eq(q.field("role"), "owner")
          )
        )
        .collect();

      if (allAdmins.length <= 1) {
        throw new Error(
          "No se puede degradar el último administrador. Asigna otro administrador primero."
        );
      }
    }

    // Update the role
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});

// DEV ONLY: Promote dev user to owner
export const promoteDevUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "dev-user-001"))
      .first();

    if (!user) return { error: "Dev user not found" };

    await ctx.db.patch(user._id, {
      role: "owner",
      updatedAt: Date.now(),
    });

    return { promoted: user._id, from: user.role, to: "owner" };
  },
});
