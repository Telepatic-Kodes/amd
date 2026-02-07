/**
 * Client-side permissions module
 * NO Convex imports - this is pure client-side logic
 * Mirrors convex/lib/permissions.ts for UI checks
 */

// Role labels in Spanish
export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  editor: "Editor",
  reviewer: "Revisor",
  publisher: "Publicador",
  viewer: "Lector",
};

// Role colors (Tailwind classes)
export const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  editor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  publisher: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  viewer: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

// Client-side permission matrix (must match server)
export const CLIENT_PERMISSIONS = {
  // Content lifecycle
  "content:create": ["owner", "admin", "editor"],
  "content:edit": ["owner", "admin", "editor"],
  "content:delete": ["owner", "admin"],
  "content:review": ["owner", "admin", "reviewer"],
  "content:publish": ["owner", "admin", "publisher"],
  "content:archive": ["owner", "admin"],

  // User/team management
  "users:manage": ["owner", "admin"],
  "users:view": ["owner", "admin"],

  // System settings
  "settings:manage": ["owner", "admin"],
  "settings:view": ["owner", "admin", "editor", "reviewer", "publisher", "viewer"],

  // Analytics
  "analytics:view": ["owner", "admin", "editor", "reviewer", "publisher"],
  "analytics:export": ["owner", "admin"],

  // Platform connections
  "platforms:manage": ["owner", "admin"],
  "platforms:view": ["owner", "admin", "editor", "publisher"],
} as const;

export type ClientPermission = keyof typeof CLIENT_PERMISSIONS;

/**
 * Check if a role has a specific permission (client-side)
 */
export function hasClientPermission(role: string, permission: ClientPermission): boolean {
  const allowedRoles = CLIENT_PERMISSIONS[permission] as readonly string[];
  return allowedRoles.includes(role);
}

/**
 * Roles that can be assigned (owner is system-only, can't be assigned)
 */
export const ASSIGNABLE_ROLES = ["admin", "editor", "reviewer", "publisher", "viewer"] as const;
