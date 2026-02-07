import { v } from "convex/values";
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, getUserId } from "./lib/auth";

// ===========================================
// INTERNAL HELPER: CREATE VERSION SNAPSHOT
// Called from content mutations, not exposed as API
// ===========================================

/**
 * createVersionSnapshot - Create a version snapshot of content.
 * @internal - Called from createContent, updateContent, updateContentStatus
 */
export async function createVersionSnapshot(
  ctx: MutationCtx,
  contentId: Id<"content">,
  changeType: "created" | "edited" | "status_change" | "rollback",
  changeSummary?: string
): Promise<Id<"contentVersions">> {
  // Get the current content doc
  const content = await ctx.db.get(contentId);
  if (!content) {
    throw new Error("Contenido no encontrado para crear snapshot de versión");
  }

  // Get the userId and user name from auth context
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject ?? "system";

  // Query users table for display name
  let userName = "Usuario";
  if (identity) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    userName = user?.name ?? user?.email ?? "Usuario";
  }

  // Count existing versions for this contentId to determine next version number
  const existingVersions = await ctx.db
    .query("contentVersions")
    .withIndex("by_contentId", (q) => q.eq("contentId", contentId))
    .collect();

  const version = existingVersions.length + 1;

  // Insert version snapshot
  const versionId = await ctx.db.insert("contentVersions", {
    contentId,
    version,
    title: content.title,
    body: content.body,
    summary: content.summary,
    metadata: content.metadata,
    seo: content.seo,
    status: content.status,
    editedBy: userId,
    editedByName: userName,
    changeType,
    changeSummary,
    createdAt: Date.now(),
  });

  return versionId;
}

// ===========================================
// INTERNAL HELPER: LOG CONTENT ACTION TO AUDIT LOG
// ===========================================

/**
 * logContentAction - Log a content lifecycle event to auditLog table.
 * @internal - Called from content mutations
 */
export async function logContentAction(
  ctx: MutationCtx,
  contentId: Id<"content">,
  action: string,
  details?: any
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.subject;

  const content = await ctx.db.get(contentId);
  if (!content) return;

  await ctx.db.insert("auditLog", {
    action: `content.${action}`,
    entityType: "content",
    entityId: content.contentId,
    performedBy: "user",
    performerId: userId,
    changes: details,
    timestamp: Date.now(),
  });
}

// ===========================================
// QUERY: LIST CONTENT VERSIONS
// ===========================================

/**
 * listContentVersions - Get chronological version history for a content item.
 * Returns up to 50 most recent versions (newest first).
 */
export const listContentVersions = query({
  args: { contentId: v.id("content") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const versions = await ctx.db
      .query("contentVersions")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    // Sort by version descending (newest first)
    versions.sort((a, b) => b.version - a.version);

    // Limit to 50 versions for performance
    const limitedVersions = versions.slice(0, 50);

    // Return version summaries
    return limitedVersions.map((v) => ({
      _id: v._id,
      version: v.version,
      changeType: v.changeType,
      changeSummary: v.changeSummary,
      editedBy: v.editedBy,
      editedByName: v.editedByName,
      status: v.status,
      createdAt: v.createdAt,
    }));
  },
});

// ===========================================
// QUERY: GET VERSION DIFF
// ===========================================

/**
 * getVersionDiff - Get two version snapshots with change flags.
 * The actual text diffing happens client-side using a diff library.
 */
export const getVersionDiff = query({
  args: {
    versionAId: v.id("contentVersions"),
    versionBId: v.id("contentVersions"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const versionA = await ctx.db.get(args.versionAId);
    const versionB = await ctx.db.get(args.versionBId);

    if (!versionA || !versionB) {
      throw new Error("Una o ambas versiones no encontradas");
    }

    // Compute diff flags
    const changes = {
      titleChanged: versionA.title !== versionB.title,
      bodyChanged: versionA.body !== versionB.body,
      summaryChanged: versionA.summary !== versionB.summary,
      statusChanged: versionA.status !== versionB.status,
      metadataChanged: JSON.stringify(versionA.metadata) !== JSON.stringify(versionB.metadata),
      seoChanged: JSON.stringify(versionA.seo) !== JSON.stringify(versionB.seo),
    };

    return {
      versionA: {
        version: versionA.version,
        title: versionA.title,
        body: versionA.body,
        summary: versionA.summary,
        status: versionA.status,
        editedBy: versionA.editedBy,
        editedByName: versionA.editedByName,
        createdAt: versionA.createdAt,
      },
      versionB: {
        version: versionB.version,
        title: versionB.title,
        body: versionB.body,
        summary: versionB.summary,
        status: versionB.status,
        editedBy: versionB.editedBy,
        editedByName: versionB.editedByName,
        createdAt: versionB.createdAt,
      },
      changes,
    };
  },
});

// ===========================================
// MUTATION: ROLLBACK TO VERSION
// ===========================================

/**
 * rollbackToVersion - Restore content from a previous version.
 * Creates a new version snapshot FIRST (type "rollback"), then restores the content.
 */
export const rollbackToVersion = mutation({
  args: {
    contentId: v.id("content"),
    versionId: v.id("contentVersions"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Contenido no encontrado");
    }

    const targetVersion = await ctx.db.get(args.versionId);
    if (!targetVersion) {
      throw new Error("Versión objetivo no encontrada");
    }

    // Verify contentId matches version's contentId
    if (targetVersion.contentId !== args.contentId) {
      throw new Error("La versión no pertenece a este contenido");
    }

    // Ownership check
    const userId = await getUserId(ctx);
    if (content.userId && content.userId !== userId) {
      throw new Error("No tienes permiso para modificar este contenido.");
    }

    // Create a NEW version snapshot FIRST (rollback type)
    const changeSummary = `Revertido a versión ${targetVersion.version}`;
    await createVersionSnapshot(ctx, args.contentId, "rollback", changeSummary);

    // Then patch the content doc with data from target version
    await ctx.db.patch(args.contentId, {
      title: targetVersion.title,
      body: targetVersion.body,
      summary: targetVersion.summary,
      metadata: targetVersion.metadata,
      seo: targetVersion.seo,
      updatedAt: Date.now(),
    });

    // Log audit trail
    await logContentAction(ctx, args.contentId, "rollback", {
      targetVersion: targetVersion.version,
    });

    // Get the new version number
    const allVersions = await ctx.db
      .query("contentVersions")
      .withIndex("by_contentId", (q) => q.eq("contentId", args.contentId))
      .collect();

    return { newVersion: allVersions.length };
  },
});
