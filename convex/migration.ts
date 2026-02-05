import { mutation } from "./_generated/server";
import { requireAuth, getUserId } from "./lib/auth";

/**
 * Migration: Assign all existing records without userId to the current user (system owner).
 * Run this ONCE after first login. Idempotent — skips records that already have userId.
 */
export const migrateExistingDataToOwner = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    // Verify caller is system owner
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
      .first();

    if (!user?.isSystemOwner) {
      throw new Error("Solo el propietario del sistema puede ejecutar la migración.");
    }

    let migrated = { content: 0, tasks: 0, campaigns: 0, onboarding: 0, guidance: 0, linkedin: 0 };

    // Migrate content
    const allContent = await ctx.db.query("content").collect();
    for (const item of allContent) {
      if (!item.userId) {
        await ctx.db.patch(item._id, { userId });
        migrated.content++;
      }
    }

    // Migrate tasks
    const allTasks = await ctx.db.query("tasks").collect();
    for (const task of allTasks) {
      if (!task.userId) {
        await ctx.db.patch(task._id, { userId });
        migrated.tasks++;
      }
    }

    // Migrate campaigns
    const allCampaigns = await ctx.db.query("campaigns").collect();
    for (const campaign of allCampaigns) {
      if (!campaign.userId) {
        await ctx.db.patch(campaign._id, { userId });
        migrated.campaigns++;
      }
    }

    // Migrate onboarding
    const allOnboarding = await ctx.db.query("onboarding").collect();
    for (const item of allOnboarding) {
      if (!item.userId) {
        await ctx.db.patch(item._id, { userId });
        migrated.onboarding++;
      }
    }

    // Migrate userGuidance
    const allGuidance = await ctx.db.query("userGuidance").collect();
    for (const item of allGuidance) {
      if (!item.userId) {
        await ctx.db.patch(item._id, { userId });
        migrated.guidance++;
      }
    }

    // Migrate linkedinConnections
    const allLinkedin = await ctx.db.query("linkedinConnections").collect();
    for (const item of allLinkedin) {
      if (!item.userId) {
        await ctx.db.patch(item._id, { userId });
        migrated.linkedin++;
      }
    }

    return migrated;
  },
});
