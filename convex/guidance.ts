import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth, getUserId } from "./lib/auth";

/**
 * Get or create the singleton guidance record
 */
export const getGuidance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    const userGuidance = allGuidance.find(g => g.userId === userId);
    if (userGuidance) return userGuidance;
    return null;
  },
});

/**
 * Get setup progress with computed fields
 */
export const getSetupProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    const guidance = allGuidance.find(g => g.userId === userId);

    // Compute from actual data if no guidance record
    const allOnboarding = await ctx.db.query("onboarding").collect();
    const onboarding = allOnboarding.find(o => o.userId === userId);

    const allContent = await ctx.db.query("content").collect();
    const content = allContent.filter(c => c.userId === userId || c.userId === undefined);

    const allCampaigns = await ctx.db.query("campaigns").collect();
    const campaigns = allCampaigns.filter(c => c.userId === userId || c.userId === undefined);

    const feeds = await ctx.db.query("feeds").collect();

    const steps = {
      companyConfigured: guidance?.setupSteps.companyConfigured ?? !!onboarding,
      goalsSet: guidance?.setupSteps.goalsSet ?? (onboarding?.goals?.length ?? 0) > 0,
      feedsConfigured: guidance?.setupSteps.feedsConfigured ?? feeds.length > 0,
      firstContentCreated: guidance?.setupSteps.firstContentCreated ?? content.length > 0,
      firstCampaignCreated: guidance?.setupSteps.firstCampaignCreated ?? campaigns.length > 0,
      analyticsViewed: guidance?.setupSteps.analyticsViewed ?? false,
      settingsReviewed: guidance?.setupSteps.settingsReviewed ?? false,
    };

    const weights: Record<string, number> = {
      companyConfigured: 15,
      goalsSet: 15,
      feedsConfigured: 15,
      firstContentCreated: 15,
      firstCampaignCreated: 15,
      analyticsViewed: 10,
      settingsReviewed: 15,
    };

    let progress = 0;
    for (const [key, completed] of Object.entries(steps)) {
      if (completed) progress += weights[key] || 0;
    }

    const completedCount = Object.values(steps).filter(Boolean).length;
    const totalCount = Object.keys(steps).length;

    return {
      steps,
      progress,
      completedCount,
      totalCount,
      quickModeEnabled: guidance?.quickModeEnabled ?? false,
      onboardingCompletions: guidance?.onboardingCompletions ?? (onboarding ? 1 : 0),
    };
  },
});

/**
 * Initialize or update guidance record
 */
export const initGuidance = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    const existing = allGuidance.find(g => g.userId === userId);
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("userGuidance", {
      userId,
      onboardingCompletions: 0,
      quickModeEnabled: false,
      setupProgress: 0,
      setupSteps: {
        companyConfigured: false,
        goalsSet: false,
        feedsConfigured: false,
        firstContentCreated: false,
        firstCampaignCreated: false,
        analyticsViewed: false,
        settingsReviewed: false,
      },
      featuresDiscovered: [],
      tourCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mark a setup step as completed
 */
export const completeSetupStep = mutation({
  args: {
    step: v.union(
      v.literal("companyConfigured"),
      v.literal("goalsSet"),
      v.literal("feedsConfigured"),
      v.literal("firstContentCreated"),
      v.literal("firstCampaignCreated"),
      v.literal("analyticsViewed"),
      v.literal("settingsReviewed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    let guidance = allGuidance.find(g => g.userId === userId);

    if (!guidance) {
      const now = Date.now();
      const id = await ctx.db.insert("userGuidance", {
        userId,
        onboardingCompletions: 0,
        quickModeEnabled: false,
        setupProgress: 0,
        setupSteps: {
          companyConfigured: false,
          goalsSet: false,
          feedsConfigured: false,
          firstContentCreated: false,
          firstCampaignCreated: false,
          analyticsViewed: false,
          settingsReviewed: false,
        },
        featuresDiscovered: [],
        tourCompleted: false,
        createdAt: now,
        updatedAt: now,
      });
      guidance = await ctx.db.get(id);
      if (!guidance) return;
    }

    const updatedSteps = { ...guidance.setupSteps, [args.step]: true };

    // Recalculate progress
    const weights: Record<string, number> = {
      companyConfigured: 15,
      goalsSet: 15,
      feedsConfigured: 15,
      firstContentCreated: 15,
      firstCampaignCreated: 15,
      analyticsViewed: 10,
      settingsReviewed: 15,
    };
    let progress = 0;
    for (const [key, completed] of Object.entries(updatedSteps)) {
      if (completed) progress += weights[key] || 0;
    }

    await ctx.db.patch(guidance._id, {
      setupSteps: updatedSteps,
      setupProgress: progress,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Track feature discovery
 */
export const trackFeatureDiscovery = mutation({
  args: { featureId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    let guidance = allGuidance.find(g => g.userId === userId);
    if (!guidance) return;

    const existing = guidance.featuresDiscovered.find(
      (f) => f.featureId === args.featureId
    );

    if (existing) {
      const updated = guidance.featuresDiscovered.map((f) =>
        f.featureId === args.featureId
          ? { ...f, interactionCount: f.interactionCount + 1 }
          : f
      );
      await ctx.db.patch(guidance._id, {
        featuresDiscovered: updated,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(guidance._id, {
        featuresDiscovered: [
          ...guidance.featuresDiscovered,
          { featureId: args.featureId, firstSeen: Date.now(), interactionCount: 1 },
        ],
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Toggle quick mode
 */
export const toggleQuickMode = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    const guidance = allGuidance.find(g => g.userId === userId);
    if (!guidance) return;

    await ctx.db.patch(guidance._id, {
      quickModeEnabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Increment onboarding completion count
 */
export const incrementOnboardingCompletion = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const allGuidance = await ctx.db.query("userGuidance").collect();
    const guidance = allGuidance.find(g => g.userId === userId);
    if (!guidance) return;

    await ctx.db.patch(guidance._id, {
      onboardingCompletions: guidance.onboardingCompletions + 1,
      setupSteps: {
        ...guidance.setupSteps,
        companyConfigured: true,
        goalsSet: true,
      },
      updatedAt: Date.now(),
    });
  },
});
