---
phase: 17
plan: 02
status: complete
started: 2026-02-07T19:35:08Z
completed: 2026-02-07T19:40:24Z
duration: 5min 16s
---

# Phase 17 Plan 02: Content Version History Backend — SUMMARY

**One-liner:** Automatic version snapshots on every edit, diff between versions, rollback capability, and full audit trail for collaborative content workflows.

## What Was Built

**Backend infrastructure for content version history:**
- contentVersions table in schema with 4 indexes (by_contentId, by_contentId_version, by_editedBy, by_createdAt)
- Version management module (convex/contentVersions.ts) with internal helpers and API endpoints
- Automatic version snapshots wired into ALL content mutations (createContent, updateContent, updateContentStatus, and all contentPipeline mutations)
- Audit trail logging for all content lifecycle events

**Core capabilities:**
1. **Automatic snapshots:** Every content creation, edit, or status change creates a version snapshot
2. **Version history:** listContentVersions query returns chronological history (up to 50 versions, newest first)
3. **Diff between versions:** getVersionDiff query returns two version snapshots with field-level change flags
4. **Rollback:** rollbackToVersion mutation restores content from any previous version
5. **Audit trail:** logContentAction writes to auditLog table for every content action

## Files Modified

**convex/schema.ts:**
- Added contentVersions table definition (18 fields)
- Indexes: by_contentId, by_contentId_version, by_editedBy, by_createdAt
- Inserted BEFORE users table (after content table)

**convex/functions.ts:**
- Imported createVersionSnapshot and logContentAction from contentVersions
- createContent: snapshot with type "created" + audit log entry
- updateContent: snapshot with type "edited" + audit log with changed fields
- updateContentStatus: snapshot with type "status_change" + Spanish summary + audit log

**convex/contentPipeline.ts:**
- Imported createVersionSnapshot from contentVersions
- moveContent: snapshot on every status transition with Spanish summary
- moveContentToReview: snapshot added
- approveContent: snapshot added
- rejectContent: snapshot added
- scheduleContent: snapshot added
- publishContent: snapshot added

## Files Created

**convex/contentVersions.ts (291 lines):**
- createVersionSnapshot (internal helper) — creates snapshot with auto-incrementing version number
- logContentAction (internal helper) — writes to auditLog table
- listContentVersions (query) — returns up to 50 versions sorted by version desc
- getVersionDiff (query) — computes field-level change flags between two versions
- rollbackToVersion (mutation) — creates rollback snapshot, then restores content from target version

## Key Decisions

1. **Internal helpers pattern:** createVersionSnapshot and logContentAction are NOT exported as Convex API endpoints — they're plain async functions imported directly by mutation handlers. This avoids unnecessary API surface area.

2. **Version numbering:** Sequential version numbers (1, 2, 3...) computed by counting existing versions. Simple, predictable, and human-readable.

3. **Spanish summaries:** All changeSummary fields use Spanish to match UX-01 requirement (e.g., "Estado cambiado de draft a review").

4. **Client-side text diffing:** Backend only provides two version snapshots + field-level change flags. Actual text diffing (word-by-word, line-by-line) happens client-side using a lightweight diff library for better performance.

5. **Rollback creates new version:** Rollback doesn't delete the rollback snapshot — it creates a NEW version of type "rollback" first, then restores. This preserves audit trail integrity.

6. **50 version limit:** listContentVersions returns max 50 versions for performance. Content with >50 versions will only show the 50 most recent.

7. **Audit log integration:** All content actions write to BOTH contentVersions (snapshot) and auditLog (action record) for dual-layer traceability.

## Architecture Notes

**Version snapshot flow:**
```
User edits content
  ↓
updateContent mutation
  ↓
ctx.db.patch(contentId, updates)  ← Content modified FIRST
  ↓
createVersionSnapshot(ctx, contentId, "edited", "Contenido editado")
  ↓
Counts existing versions → Inserts new version doc (version N+1)
  ↓
logContentAction(ctx, contentId, "edited", { fields: [...] })
  ↓
Inserts auditLog entry with action "content.edited"
```

**Data isolation:**
- Version snapshots use editedBy field with Clerk userId (from identity.subject)
- contentVersions table does NOT have userId field — versions are tied to content via contentId
- Filtering by user happens at content level (via content.userId), not version level

**Performance considerations:**
- Version snapshots add 1 write per edit — acceptable for low-frequency human actions
- Indexes support fast queries: by_contentId for history, by_contentId_version for specific version lookup
- 50 version limit prevents unbounded query costs

## Verification Results

✅ **1. npx convex typecheck passes** — Zero TypeScript errors
✅ **2. contentVersions table in schema** — Defined with 4 indexes
✅ **3. contentVersions.ts exports 3 API functions** — listContentVersions, getVersionDiff, rollbackToVersion
✅ **4. createContent calls createVersionSnapshot** — Type "created", summary "Contenido creado"
✅ **5. updateContent calls createVersionSnapshot** — Type "edited", logs changed fields
✅ **6. updateContentStatus calls createVersionSnapshot** — Type "status_change", Spanish summary
✅ **7. Audit trail entries written** — All content actions call logContentAction

**Additional verification:**
✅ All 6 contentPipeline mutations call createVersionSnapshot (moveContent, moveContentToReview, approveContent, rejectContent, scheduleContent, publishContent)
✅ Import statements added to functions.ts and contentPipeline.ts
✅ Version snapshots include full content data (title, body, summary, metadata, seo, status)
✅ editedByName field populated from users table for UI display

## Success Criteria

✅ contentVersions table exists in schema with proper indexes
✅ Every content mutation creates a version snapshot automatically
✅ listContentVersions returns chronological history for a content item
✅ getVersionDiff returns two version snapshots with change flags
✅ rollbackToVersion restores content from a previous version and creates a rollback snapshot
✅ Audit log entries record all content lifecycle events
✅ TypeScript compiles clean

## Commits

- **4950a3f:** feat(17-02): add contentVersions schema and version management module
- **7c30ca7:** feat(17-02): wire version snapshots into all content mutations

## Next Steps

**Phase 17 Plan 03 (Version History Frontend UI):**
- Version history panel component with timeline view
- Side-by-side diff view with highlighting
- Rollback confirmation modal
- Integration with content detail page

**Phase 17 Plan 04 (Comments & Feedback):**
- Comments table schema
- Comment threads on content
- Mention system (@user notifications)
- Feedback status tracking (resolved/unresolved)

## Performance Impact

**Estimated overhead per content edit:**
- 1 additional write to contentVersions table (~5ms)
- 1 additional write to auditLog table (~5ms)
- Version counting query (~10ms for <50 versions)
- User lookup query (~5ms, cached by Convex)
- **Total: ~25ms per edit** — negligible for human-driven actions

**Storage impact:**
- Each version snapshot stores full content body + metadata
- Average version size: ~5-10KB (for typical blog post)
- 50 versions per content item = ~250-500KB
- Acceptable for collaborative workflows with high data integrity requirements

---

**Phase 17 Progress:** 2/4 plans complete (RBAC backend ✅, Version history backend ✅)
