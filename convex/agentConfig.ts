import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Agent configuration management with version history.
 * Every config change creates a versioned snapshot for rollback.
 */

/**
 * Update agent config and save a version snapshot.
 */
export const updateConfigWithHistory = mutation({
  args: {
    agentId: v.id("agents"),
    config: v.object({
      systemPrompt: v.string(),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
    }),
    triggers: v.optional(v.array(v.string())),
    changeDescription: v.optional(v.string()),
  },
  handler: async (ctx, { agentId, config, triggers, changeDescription }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const agent = await ctx.db.get(agentId);
    if (!agent) throw new Error("Agente no encontrado");

    // Get latest version number
    const latestVersion = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
      .order("desc")
      .first();

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    // Save version snapshot
    await ctx.db.insert("agentConfigVersions", {
      agentId,
      version: nextVersion,
      config: {
        systemPrompt: config.systemPrompt,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: agent.config.tools,
      },
      triggers: triggers || agent.triggers.map(String),
      changedBy: identity.subject,
      changeDescription: changeDescription || buildChangeDescription(agent.config, config),
      createdAt: Date.now(),
    });

    // Apply the config update
    const updatedConfig = {
      ...agent.config,
      systemPrompt: config.systemPrompt,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };

    const patch: Record<string, unknown> = {
      config: updatedConfig,
      updatedAt: Date.now(),
    };

    // Update triggers if provided
    if (triggers) {
      patch.triggers = triggers;
    }

    await ctx.db.patch(agentId, patch);

    return { version: nextVersion };
  },
});

/**
 * Get config version history for an agent.
 */
export const getConfigHistory = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const versions = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
      .order("desc")
      .take(20);

    return versions;
  },
});

/**
 * Restore agent config to a specific version.
 */
export const restoreVersion = mutation({
  args: {
    agentId: v.id("agents"),
    version: v.number(),
  },
  handler: async (ctx, { agentId, version }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const snapshot = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId_version", (q) =>
        q.eq("agentId", agentId).eq("version", version)
      )
      .first();

    if (!snapshot) throw new Error("Versión no encontrada");

    const agent = await ctx.db.get(agentId);
    if (!agent) throw new Error("Agente no encontrado");

    // Save the restoration as a new version
    const latestVersion = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
      .order("desc")
      .first();

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    await ctx.db.insert("agentConfigVersions", {
      agentId,
      version: nextVersion,
      config: snapshot.config,
      triggers: snapshot.triggers,
      changedBy: identity.subject,
      changeDescription: `Restaurado a versión ${version}`,
      createdAt: Date.now(),
    });

    // Apply the restoration
    const patch: Record<string, unknown> = {
      config: {
        ...agent.config,
        systemPrompt: snapshot.config.systemPrompt,
        model: snapshot.config.model,
        temperature: snapshot.config.temperature,
        maxTokens: snapshot.config.maxTokens,
      },
      updatedAt: Date.now(),
    };

    if (snapshot.triggers) {
      patch.triggers = snapshot.triggers;
    }

    await ctx.db.patch(agentId, patch);

    return { version: nextVersion };
  },
});

/**
 * Reset agent to its default/seed config.
 */
export const resetToDefaults = mutation({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No autenticado");

    const agent = await ctx.db.get(agentId);
    if (!agent) throw new Error("Agente no encontrado");

    // Find version 1 (the original seed config)
    const original = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId_version", (q) =>
        q.eq("agentId", agentId).eq("version", 1)
      )
      .first();

    if (!original) {
      throw new Error("No se encontró la configuración original. El agente puede no tener historial.");
    }

    // Save reset as new version
    const latestVersion = await ctx.db
      .query("agentConfigVersions")
      .withIndex("by_agentId", (q) => q.eq("agentId", agentId))
      .order("desc")
      .first();

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    await ctx.db.insert("agentConfigVersions", {
      agentId,
      version: nextVersion,
      config: original.config,
      triggers: original.triggers,
      changedBy: identity.subject,
      changeDescription: "Restaurado a configuración por defecto",
      createdAt: Date.now(),
    });

    const patch: Record<string, unknown> = {
      config: {
        ...agent.config,
        systemPrompt: original.config.systemPrompt,
        model: original.config.model,
        temperature: original.config.temperature,
        maxTokens: original.config.maxTokens,
      },
      updatedAt: Date.now(),
    };

    if (original.triggers) {
      patch.triggers = original.triggers;
    }

    await ctx.db.patch(agentId, patch);

    return { version: nextVersion };
  },
});

// Helper: auto-generate change description from diff
function buildChangeDescription(
  oldConfig: { systemPrompt: string; model: string; temperature: number; maxTokens: number },
  newConfig: { systemPrompt: string; model: string; temperature: number; maxTokens: number }
): string {
  const changes: string[] = [];
  if (oldConfig.model !== newConfig.model) changes.push(`Modelo → ${newConfig.model.split("-").slice(0, 2).join(" ")}`);
  if (oldConfig.temperature !== newConfig.temperature) changes.push(`Temperatura → ${newConfig.temperature}`);
  if (oldConfig.maxTokens !== newConfig.maxTokens) changes.push(`Max tokens → ${newConfig.maxTokens}`);
  if (oldConfig.systemPrompt !== newConfig.systemPrompt) changes.push("System prompt actualizado");
  return changes.length > 0 ? changes.join(", ") : "Configuración actualizada";
}
