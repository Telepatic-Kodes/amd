import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getUserId } from "./lib/auth";

function shortId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const PHASE_ORDER = ["foundation", "strategy", "planning", "execution", "optimization"] as const;

// ===========================================
// QUERIES
// ===========================================

export const getPhasesByBrand = query({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("marketingPhases")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    // Sort by phase order
    return phases.sort(
      (a, b) => PHASE_ORDER.indexOf(a.phase as typeof PHASE_ORDER[number]) - PHASE_ORDER.indexOf(b.phase as typeof PHASE_ORDER[number])
    );
  },
});

export const getPhaseProgress = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    const phases = await ctx.db
      .query("marketingPhases")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", profile._id))
      .collect();

    if (phases.length === 0) return null;

    const sorted = phases.sort(
      (a, b) => PHASE_ORDER.indexOf(a.phase as typeof PHASE_ORDER[number]) - PHASE_ORDER.indexOf(b.phase as typeof PHASE_ORDER[number])
    );

    const completed = sorted.filter((p) => p.status === "completed").length;
    const current = sorted.find((p) => p.status === "in_progress") || sorted.find((p) => p.status === "pending");

    return {
      brandProfileId: profile._id,
      phases: sorted.map((p) => ({
        phase: p.phase,
        status: p.status,
        completedAt: p.completedAt,
      })),
      currentPhase: current?.phase || null,
      completedCount: completed,
      totalPhases: PHASE_ORDER.length,
      progressPercent: Math.round((completed / PHASE_ORDER.length) * 100),
    };
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const initializePhases = mutation({
  args: { brandProfileId: v.id("brandProfiles") },
  handler: async (ctx, args) => {
    // Check if phases already exist
    const existing = await ctx.db
      .query("marketingPhases")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .first();

    if (existing) return; // Already initialized

    const now = Date.now();
    for (const phase of PHASE_ORDER) {
      await ctx.db.insert("marketingPhases", {
        phaseId: `phase_${shortId()}`,
        brandProfileId: args.brandProfileId,
        phase,
        status: phase === "foundation" ? "in_progress" : "pending",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updatePhaseStatus = mutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    phase: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("marketingPhases")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    const target = phases.find((p) => p.phase === args.phase);
    if (!target) throw new Error(`Fase ${args.phase} no encontrada`);

    const now = Date.now();
    await ctx.db.patch(target._id, {
      status: args.status,
      ...(args.status === "completed" ? { completedAt: now } : {}),
      ...(args.data ? { data: args.data } : {}),
      updatedAt: now,
    });

    // Auto-advance: if completing a phase, set next phase to in_progress
    if (args.status === "completed") {
      const currentIdx = PHASE_ORDER.indexOf(args.phase as typeof PHASE_ORDER[number]);
      if (currentIdx < PHASE_ORDER.length - 1) {
        const nextPhase = phases.find((p) => p.phase === PHASE_ORDER[currentIdx + 1]);
        if (nextPhase && nextPhase.status === "pending") {
          await ctx.db.patch(nextPhase._id, {
            status: "in_progress",
            updatedAt: now,
          });
        }
      }
    }
  },
});

// Internal mutation for auto-advancing phases from backend actions
export const advancePhase = internalMutation({
  args: {
    brandProfileId: v.id("brandProfiles"),
    completedPhase: v.string(),
  },
  handler: async (ctx, args) => {
    const phases = await ctx.db
      .query("marketingPhases")
      .withIndex("by_brandProfileId", (q) => q.eq("brandProfileId", args.brandProfileId))
      .collect();

    const target = phases.find((p) => p.phase === args.completedPhase);
    if (!target) return;

    const now = Date.now();
    await ctx.db.patch(target._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    const currentIdx = PHASE_ORDER.indexOf(args.completedPhase as typeof PHASE_ORDER[number]);
    if (currentIdx < PHASE_ORDER.length - 1) {
      const nextPhase = phases.find((p) => p.phase === PHASE_ORDER[currentIdx + 1]);
      if (nextPhase && nextPhase.status === "pending") {
        await ctx.db.patch(nextPhase._id, {
          status: "in_progress",
          updatedAt: now,
        });
      }
    }
  },
});
