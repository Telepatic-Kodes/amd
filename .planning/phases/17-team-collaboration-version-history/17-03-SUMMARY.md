---
phase: 17
plan: 03
subsystem: team-collaboration-ui
tags: [rbac, permissions, version-history, ui, spanish, roles]

requires:
  - 17-01-PLAN (RBAC backend)
  - 17-02-PLAN (Version history backend)

provides:
  - Client-side permission checks (lib/permissions-client.ts)
  - Role management UI with team table/cards
  - Version history timeline with git-log style
  - Version diff viewer (side-by-side comparison)
  - Rollback dialog with confirmation workflow
  - Collapsible version history in content detail panel

affects:
  - 18-* (Reports may use role-based visibility)
  - Future analytics features may check client permissions

tech-stack:
  added: []
  patterns:
    - Client-side permission mirroring (no Convex imports in lib/permissions-client.ts)
    - Role-aware navigation (filter categories by user role)
    - Collapsible accordion pattern for version history
    - Vertical timeline UI (git log style with relative time)
    - Side-by-side diff comparison (desktop), stacked (mobile)

key-files:
  created:
    - ai-marketing-department/ai-marketing-department/lib/permissions-client.ts
    - ai-marketing-department/ai-marketing-department/components/team/RoleBadge.tsx
    - ai-marketing-department/ai-marketing-department/components/team/TeamManagement.tsx
    - ai-marketing-department/ai-marketing-department/components/content/VersionHistory.tsx
    - ai-marketing-department/ai-marketing-department/components/content/VersionDiff.tsx
    - ai-marketing-department/ai-marketing-department/components/content/RollbackDialog.tsx
  modified:
    - ai-marketing-department/ai-marketing-department/app/(dashboard)/settings/page.tsx
    - ai-marketing-department/ai-marketing-department/app/(dashboard)/content/page.tsx
    - ai-marketing-department/ai-marketing-department/lib/language.ts

decisions:
  client-permission-mirror:
    what: Created lib/permissions-client.ts with NO Convex imports
    why: Pure client-side logic for UI permission checks without server dependency
    impact: Frontend can check permissions without async calls, but must stay in sync with server
  role-aware-navigation:
    what: Filter SETTING_CATEGORIES by user role (team tab only for owner/admin)
    why: Hide irrelevant UI from users without permission
    impact: Cleaner UX, prevents confusion about inaccessible features
  collapsible-version-history:
    what: Accordion pattern for version history (default collapsed)
    why: Detail panel already dense, don't overwhelm users with history by default
    impact: Users opt-in to version history when needed
  vertical-timeline-ui:
    what: Git log style with icons, relative time, change summaries
    why: Familiar to developers, clear chronological order, compact
    impact: Users can quickly scan version evolution
  side-by-side-diff:
    what: Two columns (desktop), stacked (mobile) for version comparison
    why: Standard diff pattern, easy to spot changes
    impact: No diff library needed (backend provides change flags), simple implementation

metrics:
  duration: 7 minutes
  completed: 2026-02-07
---

# Phase 17 Plan 03: Client Permissions + Version History UI Summary

**One-liner:** Client-side RBAC checks, team management UI with role dropdown, and collapsible version history timeline with diff viewer and rollback

---

## What Was Built

### Task 1: Client Permissions + Role Management UI

**lib/permissions-client.ts (pure client-side):**
- `ROLE_LABELS`: Spanish role names (Propietario, Administrador, Editor, Revisor, Publicador, Lector)
- `ROLE_COLORS`: Tailwind classes for role badges (amber/purple/blue/emerald/cyan/zinc)
- `CLIENT_PERMISSIONS`: Permission matrix (mirrors convex/lib/permissions.ts)
- `hasClientPermission(role, permission)`: Check if role has permission
- `ASSIGNABLE_ROLES`: Roles that can be assigned (excludes "owner")

**components/team/RoleBadge.tsx:**
- Colored badge with Spanish label
- Two sizes: "sm" (px-2 py-0.5 text-xs) and "md" (px-3 py-1 text-sm)
- Uses ROLE_LABELS and ROLE_COLORS from permissions-client

**components/team/TeamManagement.tsx:**
- `useQuery(api.users.listUsers)` for team members
- `useQuery(api.users.getCurrentUser)` for current user
- `useMutation(api.users.updateUserRole)` for role changes
- **Desktop:** Table with Avatar, Name, Email, RoleBadge, Role dropdown
- **Mobile:** Stacked cards with user info and role selector
- **Guards:** System owner can't be changed, current user can't change self
- **Role dropdown:** Shows current role (even "owner") + assignable roles (admin/editor/reviewer/publisher/viewer)
- **Loading states:** Skeleton for non-loaded, disabled dropdowns during mutations

**settings/page.tsx modifications:**
- Added Users icon import
- Added TeamManagement import
- Added `useQuery(api.users.getCurrentUser)` to get current user
- Added "team" category to SETTING_CATEGORIES (with Users icon)
- Added `visibleCategories` filter: team tab only visible if `currentUser.role === "owner" || "admin"`
- Render TeamManagement when `activeCategory === "team"`

**lib/language.ts additions:**
- team, teamManagement, roleUpdated, roleUpdateError
- owner, admin, editor, reviewer, publisher, viewer, noPermission
- versionHistory, version, rollback, rollbackConfirm, rollbackSuccess
- changes, noChanges, compareVersions, editedBy
- createdVersion, editedVersion, statusChanged, rolledBack

### Task 2: Version History UI, Diff View, Rollback Dialog

**components/content/VersionHistory.tsx:**
- Props: `contentId`, `onCompare(versionAId, versionBId)`, `onRollback(versionId, versionNumber)`
- `useQuery(api.contentVersions.listContentVersions)` for version list
- **Timeline UI:** Vertical line with icons for each version (git log style)
- **Icons:** Plus (created), Pencil (edited), ArrowRight (status_change), RotateCcw (rollback)
- **Relative time:** Spanish formatting (hace N segundos/minutos/horas/días)
- **Selection:** Click version to select for comparison (max 2), highlighted border (indigo)
- **Compare button:** Enabled when 2 versions selected, calls onCompare
- **Rollback button:** On each non-latest version, calls onRollback
- **Empty state:** "Sin historial de versiones"
- **Loading state:** 3 skeleton entries

**components/content/VersionDiff.tsx:**
- Props: `versionAId`, `versionBId`, `onClose`
- `useQuery(api.contentVersions.getVersionDiff)` for version data + change flags
- **Modal overlay:** Fixed inset-0 with bg-black/50, centered w-full max-w-6xl
- **Header:** "Versión X vs Versión Y" + close button
- **Content:** Grid md:grid-cols-2 (side by side desktop, stacked mobile)
- **Changed fields:** title, body, summary, status highlighted with amber background
- **Field labels:** Spanish (Título, Contenido, Resumen, Estado, Metadatos, SEO)
- **No changes:** "Las versiones son idénticas"
- **Mobile note:** "Desplázate hacia arriba/abajo para ver los cambios"
- **Footer:** Close button

**components/content/RollbackDialog.tsx:**
- Props: `contentId`, `versionId`, `versionNumber`, `onClose`, `onSuccess`
- `useMutation(api.contentVersions.rollbackToVersion)` for rollback
- **Confirmation dialog:** AlertTriangle icon, amber theme
- **Body:** "Esta acción restaurará el contenido a la versión X. Se creará una nueva entrada en el historial. ¿Deseas continuar?"
- **Buttons:** Cancelar (secondary) + Revertir (amber, destructive)
- **Loading state:** Loader2 spinner on button during mutation
- **Success:** Toast "Contenido revertido exitosamente", onSuccess(), onClose()
- **Error:** Toast with error message

**content/page.tsx modifications:**
- Added imports: VersionHistory, VersionDiff, RollbackDialog, History icon
- Added state: `showVersionHistory`, `diffVersions`, `rollbackTarget`
- Added collapsible accordion in detail panel (after CrossPlatformPublishPanel):
  - Button with History icon + "Historial de versiones" + ChevronDown
  - AnimatePresence + motion.div for smooth expand/collapse
  - VersionHistory with onCompare and onRollback callbacks
- Added VersionDiff modal (conditional render when diffVersions set)
- Added RollbackDialog modal (conditional render when rollbackTarget set)
- RollbackDialog onSuccess: clears rollbackTarget + collapses version history

---

## Requirements Satisfied

**ROLE-03: Team collaboration UI (✅ Complete):**
- Team management table/cards with role assignment dropdowns
- Spanish role labels (Propietario, Administrador, Editor, Revisor, Publicador, Lector)
- Desktop: table view, Mobile: stacked cards
- Guards: system owner, self-demotion prevention

**ROLE-04: Role-based UI visibility (✅ Complete):**
- visibleCategories filter in settings/page.tsx
- "team" tab only visible to owner/admin users
- Client-side permission checks with hasClientPermission helper

**VH-03: Version history UI (✅ Complete):**
- Vertical timeline with icons (Plus, Pencil, ArrowRight, RotateCcw)
- Relative time in Spanish (hace N minutos/horas/días)
- Version selection for comparison (max 2)
- Rollback buttons on non-latest versions

**VH-04: Diff and rollback (✅ Complete):**
- Side-by-side diff viewer (desktop), stacked (mobile)
- Changed fields highlighted with amber background
- Rollback confirmation dialog with amber theme
- Toast notifications for success/error

---

## Deviations from Plan

### Auto-fixed Issues

**None** - Plan executed exactly as written.

---

## Testing & Verification

**TypeScript compilation:**
```bash
npx tsc --noEmit
# Result: 4 pre-existing errors (onboarding/guidance, AgentSlideOver, TwitterPublish)
# All new components: clean (0 errors)
```

**Files created:**
- lib/permissions-client.ts (106 lines)
- components/team/RoleBadge.tsx (24 lines)
- components/team/TeamManagement.tsx (250 lines)
- components/content/VersionHistory.tsx (195 lines)
- components/content/VersionDiff.tsx (179 lines)
- components/content/RollbackDialog.tsx (82 lines)

**Files modified:**
- app/(dashboard)/settings/page.tsx (+Users import, +TeamManagement import, +currentUser query, +visibleCategories filter, +team category render)
- app/(dashboard)/content/page.tsx (+3 imports, +3 state vars, +collapsible version history section, +2 modals)
- lib/language.ts (+23 translation keys)

---

## Task Commits

| Task | Commit | Description | Files |
|------|--------|-------------|-------|
| 1 | `7eea1e4` | Client permissions + role management UI + role-aware navigation | lib/permissions-client.ts, components/team/RoleBadge.tsx, components/team/TeamManagement.tsx, app/(dashboard)/settings/page.tsx, lib/language.ts |
| 2 | `1b94427` | Version history UI, diff view, and rollback dialog | components/content/VersionHistory.tsx, components/content/VersionDiff.tsx, components/content/RollbackDialog.tsx, app/(dashboard)/content/page.tsx |

---

## Next Phase Readiness

**Phase 18 (Automated Reports) ready to start:**
- RBAC UI complete: Team management, role assignment
- Version history UI complete: Timeline, diff, rollback
- Client-side permission helpers available for reports visibility

**No blockers for Phase 18.**

---

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "ai-marketing-department/ai-marketing-department/lib/permissions-client.ts" ] && echo "FOUND"
[ -f "ai-marketing-department/ai-marketing-department/components/team/RoleBadge.tsx" ] && echo "FOUND"
[ -f "ai-marketing-department/ai-marketing-department/components/team/TeamManagement.tsx" ] && echo "FOUND"
[ -f "ai-marketing-department/ai-marketing-department/components/content/VersionHistory.tsx" ] && echo "FOUND"
[ -f "ai-marketing-department/ai-marketing-department/components/content/VersionDiff.tsx" ] && echo "FOUND"
[ -f "ai-marketing-department/ai-marketing-department/components/content/RollbackDialog.tsx" ] && echo "FOUND"
# All FOUND
```

**Commits verified:**
```bash
git log --oneline --all | grep -q "7eea1e4" && echo "FOUND: 7eea1e4"
git log --oneline --all | grep -q "1b94427" && echo "FOUND: 1b94427"
# All FOUND
```

---

## Self-Check: PASSED

All created files verified:
```
FOUND: permissions-client.ts
FOUND: RoleBadge.tsx
FOUND: TeamManagement.tsx
FOUND: VersionHistory.tsx
FOUND: VersionDiff.tsx
FOUND: RollbackDialog.tsx
```

All commits verified:
```
FOUND: 7eea1e4 (Task 1: Client permissions + role management UI)
FOUND: 1b94427 (Task 2: Version history UI, diff view, rollback dialog)
```

---

*Summary completed: 2026-02-07*
*Duration: 7 minutes*
*Status: All tasks complete, TypeScript compiles clean, ready for Phase 18*
