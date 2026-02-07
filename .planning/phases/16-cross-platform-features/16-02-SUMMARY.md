---
phase: 16-cross-platform-features
plan: 02
subsystem: publishing
tags: [cross-platform-ui, batch-publishing, previews, unified-timeline, spanish, mobile-responsive]
dependencies:
  requires: [16-01]
  provides: [cross-platform-frontend, unified-history-ui]
  affects: [content-page]
tech-stack:
  added: []
  patterns: [client-side-adaptation, multi-platform-preview, unified-timeline, toast-notifications]
key-files:
  created:
    - ai-marketing-department/ai-marketing-department/components/content/CrossPlatformPublishPanel.tsx
    - ai-marketing-department/ai-marketing-department/components/content/PlatformPreviewGrid.tsx
    - ai-marketing-department/ai-marketing-department/components/content/UnifiedPublishHistory.tsx
  modified:
    - ai-marketing-department/ai-marketing-department/lib/language.ts
    - ai-marketing-department/ai-marketing-department/app/(dashboard)/content/page.tsx
decisions:
  - id: direct-adapter-import
    context: Frontend needs to preview adapted content without backend calls
    decision: Import contentAdapters.ts directly into React components (pure TS module, no Convex dependencies)
    rationale: Enables instant client-side preview rendering without latency; shared single source of truth from 16-01
    alternatives: [backend-preview-endpoint, duplicate-adaptation-logic]
  - id: useAction-for-batch-publish
    context: Convex actions require different hook than mutations
    decision: Use useAction hook for publishToMultiplePlatforms (not useMutation)
    rationale: Convex actions use different API surface than mutations; useAction is correct hook
    alternatives: [useMutation-incorrect]
  - id: per-platform-toast
    context: Batch publish returns array of per-platform results
    decision: Show individual toast notification for each platform (success or error)
    rationale: Users see granular feedback; one platform failure doesn't hide others' success
    alternatives: [single-summary-toast, modal-results]
  - id: unified-history-below-grid
    context: Where to place unified publishing history component
    decision: Render below content grid when no content selected (not in sidebar)
    rationale: Timeline needs horizontal space for 3 platforms; sidebar too narrow
    alternatives: [sidebar-tab, separate-page]
metrics:
  duration: 7min
  completed: 2026-02-07
  tasks_completed: 2
  commits: 2
  files_created: 3
  files_modified: 2
---

# Phase 16 Plan 02: Cross-Platform Frontend UI Summary

**One-liner:** Multi-platform publish panel with checkboxes, side-by-side adapted content previews (Twitter thread/LinkedIn/Instagram hashtags), batch publish button, and unified cross-platform publishing history timeline

## Objective Completion

Created the cross-platform frontend UI: users can now select multiple platforms via checkboxes, see side-by-side previews of adapted content with character counts and platform-specific metadata (Twitter thread info, Instagram hashtags from targetKeywords), publish to all selected platforms with one click, and view a unified timeline of all publishing activity across LinkedIn/Twitter/Instagram.

**Result:** Complete multi-platform publishing workflow. Users go from content approval → platform selection → preview → batch publish → unified history, all in Spanish with mobile-responsive layouts.

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Cross-platform publish panel with previews | 5f633ac | CrossPlatformPublishPanel.tsx, PlatformPreviewGrid.tsx, language.ts, content/page.tsx |
| 2 | Unified publishing history timeline | 27f2425 | UnifiedPublishHistory.tsx, content/page.tsx |

## Key Deliverables

### 1. Cross-Platform Publish Panel (CrossPlatformPublishPanel.tsx)

**Component Structure:**

1. **Platform selection checkboxes** (LinkedIn, Twitter, Instagram)
   - Shows connection status via `useQuery(api.{platform}.queries.getConnection)`
   - Disabled if platform not connected
   - Platform brand colors: LinkedIn #0A66C2, Twitter #1DA1F2, Instagram #E4405F
   - Visual feedback: checkboxes, icons, "Conectado" / "No conectado" labels

2. **Side-by-side preview section** via `PlatformPreviewGrid`
   - Only shows for checked platforms
   - Passes `contentBody`, `selectedPlatforms`, `hashtags` (from `content.metadata.targetKeywords`)

3. **Instagram image URL input**
   - Conditionally shown when Instagram checked
   - HTTPS validation
   - Required for Instagram publishing

4. **Batch publish button**
   - "Publicar en {N} plataformas" (dynamic count)
   - Disabled when no platforms selected or publishing in progress
   - Uses `useAction(api.crossPlatform.actions.publishToMultiplePlatforms)`
   - Shows spinner during publish
   - Per-platform toast notifications on completion

5. **Publish status summary**
   - Colored dots per platform (same pattern as ContentDetailPlatformPublish)
   - Visual indicator of selected platforms

**Props:**
- `contentId: Id<"content">`
- `contentBody: string`
- `contentStatus: string`
- `contentHashtags?: string[]` (sourced from `content.metadata.targetKeywords`)
- `className?: string`

**Integration:**
Replaced `ContentDetailPlatformPublish` usage in `content/page.tsx` with `CrossPlatformPublishPanel`.

### 2. Platform Preview Grid (PlatformPreviewGrid.tsx)

**Adaptation Logic:**
- **Imports** `adaptForTwitter`, `adaptForLinkedIn`, `adaptForInstagram` directly from `@/lib/contentAdapters`
- Pure client-side rendering - no backend calls

**Per-Platform Previews:**

| Platform | Preview Content | Character Count | Special Display |
|----------|----------------|-----------------|-----------------|
| **Twitter** | First tweet of thread | {N}/280 | "Hilo de {N} tweets" if thread |
| **LinkedIn** | Truncated at 3000 chars | {N}/3000 | "Publicacion" label |
| **Instagram** | Caption with hashtags | {N}/2200 | "Hashtags sugeridos" section below preview |

**Instagram Hashtag Preview:**
- Shows which keywords from `targetKeywords` will be added as hashtags
- Format: `#marketing #ia #automatizacion` (lowercase, no spaces)
- Extracted from `hashtagsList` field returned by `adaptForInstagram`
- Displayed as small zinc-400 tags below preview
- Subtitle: "Extraidos de palabras clave del contenido"

**Color Coding:**
- Green: < 90% of limit
- Yellow: 90-100% of limit
- Red: > 100% of limit (over limit)

**Layout:**
- Grid: 1 column mobile, 2 columns md, 3 columns lg
- Each preview card has platform-specific border color and bg
- Empty state: "Selecciona plataformas para ver previsualizacion"

### 3. Unified Publishing History (UnifiedPublishHistory.tsx)

**Component Structure:**

1. **Summary stats bar**
   - Uses `useQuery(api.crossPlatform.queries.getPublishingSummary)`
   - Three stat badges: LinkedIn ({N} publicadas), Twitter ({N} publicadas), Instagram ({N} publicadas)
   - Platform brand colors as accents
   - Grid layout: 3 columns on desktop, stacked on mobile

2. **Timeline list**
   - Uses `useQuery(api.crossPlatform.queries.getUnifiedPublishHistory, { limit: 20 })`
   - Each entry:
     - Platform icon with brand color
     - Content title (truncated to 40 chars)
     - Status badge: Publicado (green), Fallido (red), Pendiente (yellow), Eliminado (zinc)
     - Relative timestamp: "hace X días/horas/minutos/ahora mismo" (Spanish)
     - External link icon if `platformUrl` exists
     - Error message in red-400 if status === "failed"
   - Left border colored by platform
   - Hover state with background transition

3. **Loading states**
   - Skeleton shimmer rows (5 placeholders)
   - Uses `animate-pulse` on zinc-800 backgrounds

4. **Empty state**
   - Large faded Share2 icon
   - "No hay publicaciones aun. Publica contenido desde la vista de detalle."

5. **Load more button**
   - Shows if `entries.length === limit`
   - Increases limit by 20 on click
   - Paginated loading pattern

**Props:**
- `className?: string`
- `limit?: number` (default 20)

**Integration:**
Added to `content/page.tsx` below content grid, only shown when no content selected (to avoid layout conflict with detail sidebar).

### 4. Spanish Translation Keys (lib/language.ts)

Added 25 new translation keys:

**Cross-Platform Publishing:**
- `crossPlatformPublish`: "Publicar en Multiples Plataformas"
- `selectPlatforms`: "Seleccionar Plataformas"
- `publishToSelected`: "Publicar en {N} plataformas"
- `publishingToMultiple`: "Publicando..."
- `platformPreview`: "Previsualizacion por Plataforma"
- `selectPlatformsPreview`: "Selecciona plataformas para ver previsualizacion"
- `notConnected`: "No conectado"
- `twitterThread`: "Hilo de {N} tweets"
- `instagramCaption`: "Subtitulo"
- `linkedinPost`: "Publicacion"
- `charactersUsed`: "{N}/{MAX} caracteres"
- `publishSuccess`: "Publicado correctamente en {platform}"
- `publishError`: "Error al publicar en {platform}"
- `publishResults`: "Resultados de Publicacion"
- `allPlatformsSuccess`: "Contenido publicado en todas las plataformas"
- `someFailures`: "{N} plataforma(s) fallaron"
- `imageUrlRequired`: "URL de imagen requerida para Instagram"
- `suggestedHashtags`: "Hashtags sugeridos"
- `hashtagsFromKeywords`: "Extraidos de palabras clave del contenido"

**Unified Publishing History:**
- `publishHistory`: "Historial de Publicaciones"
- `publishedCount`: "{N} publicadas"
- `failedCount`: "{N} fallidas"
- `pendingCount`: "{N} pendientes"
- `noPublicationsYet`: "No hay publicaciones aun"
- `publishFromDetail`: "Publica contenido desde la vista de detalle"
- `viewMore`: "Ver mas"
- `publishedStatus`: "Publicado"
- `failedStatus`: "Fallido"
- `pendingStatus`: "Pendiente"
- `deletedStatus`: "Eliminado"

## Technical Implementation

### Client-Side Content Adaptation

**Direct Import Pattern:**
```typescript
import {
  adaptForTwitter,
  adaptForLinkedIn,
  adaptForInstagram,
} from "@/lib/contentAdapters";
```

**Why this works:**
- `lib/contentAdapters.ts` is pure TypeScript (NO Convex imports)
- Created in 16-01 specifically to be importable by both backend and frontend
- No circular dependencies, no runtime errors

**Adaptation Flow:**
1. User selects platforms (checkboxes)
2. `PlatformPreviewGrid` calls adapter functions for each platform
3. Results rendered instantly in preview cards
4. User clicks "Publicar en {N} plataformas"
5. Backend action (`publishToMultiplePlatforms`) handles actual publishing

### Batch Publishing UX Flow

**User Journey:**
1. Content status: approved/scheduled/published → panel visible
2. Select platforms: LinkedIn ✅ Twitter ✅ Instagram ❌ (not connected)
3. See previews: LinkedIn 1200/3000 chars, Twitter "Hilo de 3 tweets"
4. (If Instagram) Enter image URL: `https://example.com/image.jpg`
5. Click "Publicar en 2 plataformas"
6. See loading spinner: "Publicando..."
7. Receive per-platform toasts:
   - ✅ "Publicado correctamente en LinkedIn" (green)
   - ✅ "Publicado correctamente en Twitter" (green)
   - (or) ❌ "Error al publicar en Instagram: Se requiere imagen" (red)
8. See summary toast: "Contenido publicado en todas las plataformas" or "{N} plataforma(s) fallaron"

### Unified Timeline Rendering

**Data Flow:**
1. `useQuery(api.crossPlatform.queries.getUnifiedPublishHistory, { limit: 20 })`
2. Backend merges LinkedIn/Twitter/Instagram logs, sorts by `createdAt` desc
3. Frontend receives normalized entries:
   ```typescript
   {
     _id: string,
     platform: "linkedin" | "twitter" | "instagram",
     contentId: Id<"content">,
     contentTitle: string,
     status: "pending" | "published" | "failed" | "deleted",
     publishedAt?: number,
     createdAt: number,
     error?: string,
     platformUrl?: string,
     metadata?: Record<string, unknown>
   }
   ```
4. Render timeline with platform icons, status badges, timestamps
5. User clicks "Ver mas" → increase limit by 20 → re-query

**Relative Time Logic (Spanish):**
```typescript
const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
  // ... hours, minutes, "ahora mismo"
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**From Phase 16-01 (consumed):**
- `lib/contentAdapters.ts` exports: `adaptForTwitter`, `adaptForLinkedIn`, `adaptForInstagram`
- `api.crossPlatform.actions.publishToMultiplePlatforms`: Batch publish action
- `api.crossPlatform.queries.getUnifiedPublishHistory`: Unified timeline query
- `api.crossPlatform.queries.getPublishingSummary`: Per-platform stats query
- `api.linkedin.queries.getConnection`, `api.twitter.queries.getConnection`, `api.instagram.queries.getConnection`: Connection status queries

**To Content Page (integrated):**
- `CrossPlatformPublishPanel` replaces `ContentDetailPlatformPublish` in content detail sidebar
- `UnifiedPublishHistory` added below content grid (only when no content selected)

## Success Criteria Verification

- ✅ **CP-01:** User can select multiple platforms via checkboxes and publish with one click (batch publish button)
- ✅ **CP-02:** Side-by-side platform-specific previews visible before publishing (PlatformPreviewGrid)
- ✅ **CP-03:** Content adapted per platform in previews using shared `lib/contentAdapters.ts`; Instagram shows hashtags from `targetKeywords`
- ✅ **CP-04:** Unified publishing history timeline shows all platforms (UnifiedPublishHistory)
- ✅ **UX-01:** All UI in Spanish (25 new translation keys, no English strings in user-facing components)
- ✅ **UX-02:** Mobile responsive (grid stacks 1 col on mobile, 2 on md, 3 on lg; timeline stacks vertically)
- ✅ **UX-03:** Toast notifications on actions (per-platform success/error, summary toast)
- ✅ **UX-04:** Loading states and skeletons (spinner on publish button, 5 shimmer rows for timeline)

**Additional Verifications:**
- ✅ CrossPlatformPublishPanel renders with 3 platform checkboxes showing connection status
- ✅ PlatformPreviewGrid shows adapted content with character counts per platform
- ✅ Instagram preview shows "Hashtags sugeridos" from targetKeywords
- ✅ Batch publish button invokes `publishToMultiplePlatforms` action and shows per-platform results
- ✅ UnifiedPublishHistory displays cross-platform timeline sorted by date (newest first)
- ✅ No TypeScript errors in new components (4 pre-existing errors in unrelated files)
- ✅ Convex backend compiles clean (46.69s)

## Next Phase Readiness

**Ready for future phases:**
- Cross-platform publishing UX complete
- Unified history provides single source of truth for all platform activity
- Instagram hashtag preview demonstrates targetKeywords usage
- Mobile-responsive patterns established for multi-platform UIs

**No blockers.** Phase 16 Plan 02 complete.

## Performance Notes

- **Client-side adaptation:** Instant preview rendering (no backend latency)
- **Batch publish:** Parallel execution via `Promise.allSettled` (from 16-01 backend)
- **Unified history:** 20 entries initial load, paginated "Ver mas" pattern
- **Mobile responsive:** Grid auto-adjusts columns, timeline stacks vertically
- **TypeScript compilation:** No errors in new components
- **Convex compilation:** Clean build (46.69s)

## Self-Check: PASSED

**Files created:**
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department/ai-marketing-department/components/content/CrossPlatformPublishPanel.tsx
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department/ai-marketing-department/components/content/PlatformPreviewGrid.tsx
- ✅ /home/tomas/Escritorio/AIAIAI_Consulting/projects/amd/ai-marketing-department/ai-marketing-department/components/content/UnifiedPublishHistory.tsx

**Commits verified:**
- ✅ 5f633ac feat(16-02): add cross-platform publish panel with side-by-side previews
- ✅ 27f2425 feat(16-02): add unified publishing history timeline

All files exist. All commits present in git log. Success criteria satisfied.
