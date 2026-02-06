---
phase: 15-multi-platform-publishing
plan: 03
subsystem: publishing
tags: [instagram, facebook-graph-api, oauth, carousel, image-validation, instagram-business]

# Dependency graph
requires:
  - phase: 15-01
    provides: Schema tables (instagramConnections, instagramPublishLog) and OAuth HTTP routes
provides:
  - Instagram Business API backend via Facebook OAuth
  - Image and carousel publishing with container status polling
  - Caption validation (2200 chars, 30 hashtags)
  - Connection queries with Facebook Page info
  - Content validation utilities
affects: [15-04, 15-05]

# Tech tracking
tech-stack:
  added: [facebook-graph-api-v19]
  patterns: [container-async-polling, facebook-page-linking, long-lived-tokens-60d]

key-files:
  created:
    - convex/instagram/validation.ts
    - convex/instagram/internalQueries.ts
    - convex/instagram/mutations.ts
    - convex/instagram/queries.ts
    - convex/instagram/actions.ts

key-decisions:
  - "Instagram Business API accessed via Facebook OAuth with Page linking requirement"
  - "Container status polling: 5 attempts, 2s delay for FINISHED status before publishing"
  - "Long-lived tokens expire in 60 days (vs LinkedIn 365 days)"
  - "Caption validation: 2200 chars max, 30 hashtags max with Spanish error messages"

patterns-established:
  - "Carousel publishing: item containers → carousel container → publish (async flow)"
  - "Token exchange: Facebook code → short token → long-lived token → pages → IG Business account"
  - "Connection UI explains Facebook Business account requirement"

# Metrics
duration: 7min
completed: 2026-02-06
---

# Phase 15 Plan 03: Instagram Backend Summary

**Instagram Business API backend with OAuth via Facebook, single image and carousel publishing, caption validation, and 60-day token management**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-06T02:42:35Z
- **Completed:** 2026-02-06T02:49:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Instagram Business API integration via Facebook OAuth with Page linking
- Single image and carousel publishing (2-10 images) with container status polling
- Caption and image validation with Spanish error messages
- Connection management with Facebook Page info display

## Task Commits

Each task was committed atomically:

1. **Task 1: Instagram validation utility and internal queries** - `cd3f023` (feat)
   - validateCaption, validateInstagramImage, validateCarouselImages
   - getConnectionWithToken, getContentById, getActiveConnections

2. **Task 2: Instagram actions, queries, and mutations** - `296ccf5` (feat)
   - exchangeCodeForTokens, publishToInstagram with carousel support
   - storeConnection, disconnect, logPublishAttempt, updatePublishLog
   - getConnection, getConnectionStatus, getPublishHistory

## Files Created/Modified

- `convex/instagram/validation.ts` - Pure utility functions for caption/image/carousel validation
- `convex/instagram/internalQueries.ts` - Internal queries for token access and content retrieval
- `convex/instagram/mutations.ts` - Connection storage, disconnect, publish logging, daily count
- `convex/instagram/queries.ts` - Public connection queries with FB Page info, expiresInDays
- `convex/instagram/actions.ts` - Facebook OAuth flow and Instagram publishing (single/carousel)

## Decisions Made

1. **Instagram via Facebook OAuth**: Instagram Business API requires Facebook OAuth with Page linking. exchangeCodeForTokens flow: code → short token → long-lived token → pages → IG Business account → profile.

2. **Container status polling**: Instagram Container API is async. Poll GET status_code until FINISHED (5 attempts, 2s delay) before publishing to avoid errors.

3. **60-day token expiry**: Instagram long-lived tokens expire in 60 days (vs LinkedIn 365 days). Connection query calculates expiresInDays and isExpiringSoon (<7 days).

4. **Spanish validation errors**: User-facing errors in Spanish: "El caption excede 2200 caracteres", "Maximo 30 hashtags permitidos", "Se requieren entre 2 y 10 imagenes para un carrusel".

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**External services require manual configuration:**

Environment variables needed:
```env
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

Instagram Business account requirements:
1. Facebook Page with admin access
2. Instagram Business account linked to Facebook Page (not personal account)
3. Facebook App with Instagram Basic Display and Instagram Content Publishing permissions
4. App Review approval for instagram_content_publish permission (60-90 day process)

Verification:
```bash
# Test Facebook OAuth flow
curl "https://your-domain/instagram/oauth/callback?code=TEST_CODE"

# Verify Instagram connection in dashboard
```

## Next Phase Readiness

**Ready for Phase 15-04 (Frontend Connection Management UI):**
- Instagram backend complete with queries and actions
- Connection status includes Facebook Page info for UI display
- Publish history available for monitoring

**Ready for Phase 15-05 (Multi-Platform Publishing Queue):**
- publishToInstagram action ready for queue integration
- Single image and carousel support implemented
- Rate limit handling and error messages in place

**Blockers/Concerns:**
- Instagram App Review required for production (60-90 day timeline) - must start submission Week 1
- Facebook Business account requirement must be clearly communicated in connection UI

---
*Phase: 15-multi-platform-publishing*
*Completed: 2026-02-06*
