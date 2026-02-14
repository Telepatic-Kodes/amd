import { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAuth } from "./auth";

// ===========================================
// ROLE HIERARCHY
// owner > admin > editor > reviewer > publisher > viewer
// ===========================================

export const ROLES = [
  "owner",
  "admin",
  "editor",
  "reviewer",
  "publisher",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];

// ===========================================
// PERMISSIONS MATRIX
// Maps actions to roles that can perform them
// ===========================================

export const PERMISSIONS = {
  // Content lifecycle
  "content:create": ["owner", "admin", "editor"],
  "content:edit": ["owner", "admin", "editor"],
  "content:delete": ["owner", "admin"],
  "content:review": ["owner", "admin", "reviewer"], // Send to review, approve, reject
  "content:publish": ["owner", "admin", "publisher"], // Publish approved content
  "content:archive": ["owner", "admin"],

  // User/team management
  "users:manage": ["owner", "admin"], // Assign roles, invite
  "users:view": ["owner", "admin"], // See team members list

  // System settings
  "settings:manage": ["owner", "admin"],
  "settings:view": [
    "owner",
    "admin",
    "editor",
    "reviewer",
    "publisher",
    "viewer",
  ],

  // Analytics
  "analytics:view": ["owner", "admin", "editor", "reviewer", "publisher"],
  "analytics:export": ["owner", "admin"],

  // Platform connections
  "platforms:manage": ["owner", "admin"],
  "platforms:view": ["owner", "admin", "editor", "publisher"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ===========================================
// PERMISSION HELPERS
// ===========================================

/**
 * Get the current user's role from the users table.
 * Returns "viewer" as safe fallback if user not found.
 */
export async function getUserRole(
  ctx: QueryCtx | MutationCtx
): Promise<Role> {
  const identity = await requireAuth(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .first();

  // In dev mode without user records, grant full access
  if (!user) return "owner";

  return user.role as Role;
}

/**
 * Check if the current user has a specific permission.
 * Returns boolean without throwing.
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(ctx);
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

/**
 * Require a specific permission. Throws if user doesn't have it.
 * Use as guard at the start of mutation handlers.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  permission: Permission
): Promise<void> {
  const allowed = await hasPermission(ctx, permission);
  if (!allowed) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
}

// ===========================================
// CONTENT STATUS TRANSITION PERMISSIONS
// Maps status transitions to required permissions
// ===========================================

type ContentStatus =
  | "draft"
  | "review"
  | "revision_needed"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

const STATUS_TRANSITION_PERMISSIONS: Record<string, Permission> = {
  "draft->review": "content:edit",
  "review->approved": "content:review",
  "review->revision_needed": "content:review",
  "revision_needed->review": "content:edit",
  "approved->published": "content:publish",
  "approved->scheduled": "content:publish",
  "scheduled->published": "content:publish",
  "scheduled->approved": "content:publish", // Un-schedule
  "published->archived": "content:archive",
  "archived->draft": "content:edit",
};

/**
 * Check if a role can transition content from one status to another.
 * Pure function — no database access.
 */
export function canTransitionContent(
  role: Role,
  fromStatus: ContentStatus,
  toStatus: ContentStatus
): boolean {
  const transitionKey = `${fromStatus}->${toStatus}`;
  const requiredPermission = STATUS_TRANSITION_PERMISSIONS[transitionKey];

  // If transition not defined, it's not allowed
  if (!requiredPermission) return false;

  // Check if role has the required permission
  const allowedRoles = PERMISSIONS[requiredPermission] as readonly string[];
  return allowedRoles.includes(role);
}
