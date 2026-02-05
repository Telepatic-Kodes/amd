# Research: Phase 11 - LinkedIn Publishing Integration

## Resumen / Overview

This document contains research findings for integrating LinkedIn publishing into AMD v2.0. The goal is to allow users to publish approved content (type `social_linkedin`) directly to LinkedIn from the app, as a proof-of-concept for multi-platform publishing.

**Architecture:** Next.js 16 (App Router) + Convex (serverless backend)
**Existing content schema:** Content table with `type: "social_linkedin"` and `status: "approved"` already available.

---

## 1. LinkedIn API Landscape

### Productos / Products Available

There are two relevant LinkedIn products for our use case:

| Product | Purpose | Scopes Granted | Entity Requirement |
|---------|---------|----------------|-------------------|
| **Share on LinkedIn** | Post to personal profiles | `w_member_social` | None (any developer) |
| **Sign In with LinkedIn using OpenID Connect** | Authentication + profile info | `openid`, `profile`, `email` | None (any developer) |
| **Community Management API** | Manage organization pages, analytics, comments | `w_organization_social`, `r_organization_social`, `rw_organization_admin` | Legal registered entity (LLC, Corp, etc.) |

**Recommendation for MVP:** Use "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect" products. These are self-serve, require no LinkedIn review, and provide what we need for personal profile posting. Community Management API can be added later for organization page posting.

### API Versioning

LinkedIn uses versioned APIs with the `Linkedin-Version` header in `YYYYMM` format. Each version is supported for a minimum of 1 year. As of February 2026, use version `202601` or later.

Required headers for all requests:
```
Authorization: Bearer {ACCESS_TOKEN}
Linkedin-Version: 202601
X-Restli-Protocol-Version: 2.0.0
Content-Type: application/json
```

---

## 2. OAuth 2.0 Flow / Flujo de Autenticacion

### 3-Legged OAuth Flow (Authorization Code)

LinkedIn uses standard OAuth 2.0 Authorization Code flow. PKCE is available but requires LinkedIn to enable it on your app (not self-serve). For server-side apps (our case), standard Authorization Code flow is sufficient and secure.

**Deprecated scopes (do NOT use):** `r_liteprofile`, `r_emailaddress` - replaced by OpenID Connect scopes since August 2023.

### Flow Diagram

```
User clicks "Connect LinkedIn"
        |
        v
[Next.js Frontend] -----> Redirect to LinkedIn Authorization URL
        |                  https://www.linkedin.com/oauth/v2/authorization
        |                  ?response_type=code
        |                  &client_id={CLIENT_ID}
        |                  &redirect_uri={CALLBACK_URL}
        |                  &scope=openid%20profile%20email%20w_member_social
        |                  &state={CSRF_TOKEN}
        v
[LinkedIn] -----> User grants permissions
        |
        v
[LinkedIn] -----> Redirect to callback with ?code={AUTH_CODE}&state={STATE}
        |
        v
[Convex HTTP Action] -----> Exchange code for tokens
        |                    POST https://www.linkedin.com/oauth/v2/accessToken
        |                    grant_type=authorization_code
        |                    &code={AUTH_CODE}
        |                    &client_id={CLIENT_ID}
        |                    &client_secret={CLIENT_SECRET}
        |                    &redirect_uri={CALLBACK_URL}
        v
[Convex Mutation] -----> Store encrypted tokens in DB
        |
        v
[Redirect] -----> Back to app with success status
```

### Required Scopes

| Scope | Product | Purpose |
|-------|---------|---------|
| `openid` | Sign In with LinkedIn | OpenID Connect ID token |
| `profile` | Sign In with LinkedIn | Basic profile (name, picture) |
| `email` | Sign In with LinkedIn | Email address |
| `w_member_social` | Share on LinkedIn | Create/delete posts, comments, reactions |

### Token Lifecycle

| Token | Lifetime | Renewal |
|-------|----------|---------|
| Access Token | **60 days** | Use refresh token |
| Refresh Token | **365 days** | User must re-authorize |

**Critical implementation detail:** The refresh token TTL does NOT reset when used. It always expires 365 days from initial authorization. When a refresh token expires, the user must go through the full OAuth flow again.

### Refresh Token Exchange

```
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={REFRESH_TOKEN}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

Response:
```json
{
  "access_token": "new_access_token",
  "expires_in": 5184000,
  "refresh_token": "same_or_new_refresh_token",
  "refresh_token_expires_in": 31536000
}
```

---

## 3. API Endpoints / Endpoints Necesarios

### 3.1 Create Text Post (Primary Use Case)

```
POST https://api.linkedin.com/rest/posts
```

**Payload:**
```json
{
  "author": "urn:li:person:{MEMBER_ID}",
  "commentary": "Post text content here. Supports up to 3,000 characters.\n\nLine breaks are supported.\n\n#hashtag1 #hashtag2",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

**Response:** `201 Created` with `x-restli-id` header containing the Post URN (e.g., `urn:li:share:1234567890`).

### 3.2 Create Post with Link/Article

```json
{
  "author": "urn:li:person:{MEMBER_ID}",
  "commentary": "Check out this article!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "article": {
      "source": "https://example.com/article",
      "title": "Article Title",
      "description": "Article description"
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### 3.3 Create Post with Image (2-Step Process)

**Step 1: Initialize image upload**
```
POST https://api.linkedin.com/rest/images?action=initializeUpload
```
```json
{
  "initializeUploadRequest": {
    "owner": "urn:li:person:{MEMBER_ID}"
  }
}
```

Response provides `uploadUrl` and `image` URN (e.g., `urn:li:image:C4D...`).

**Step 2: Upload binary image to uploadUrl**
```
PUT {uploadUrl}
Content-Type: application/octet-stream

{binary image data}
```

**Step 3: Create post referencing image URN**
```json
{
  "author": "urn:li:person:{MEMBER_ID}",
  "commentary": "Post with image",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "media": {
      "id": "urn:li:image:C4D..."
    }
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

### 3.4 Get Member Profile (for author URN)

```
GET https://api.linkedin.com/v2/userinfo
```

Response includes `sub` field which is the member ID used in `urn:li:person:{sub}`.

### 3.5 Delete Post

```
DELETE https://api.linkedin.com/rest/posts/{encoded_post_urn}
```

### 3.6 Document Post (PDF/Carousel)

```
POST https://api.linkedin.com/rest/documents?action=initializeUpload
```

**Note:** Organic carousel posts (multi-page document) are supported via the Documents API. The API flow is similar to image upload: initialize, upload binary, create post referencing document URN.

**Limitation:** Only sponsored carousel ads are supported through the Ads API. Organic document posts use the Documents API.

---

## 4. Rate Limits / Limites de Velocidad

### General API Limits

| Category | Limit | Window |
|----------|-------|--------|
| Application daily calls | ~100,000 per day (varies by tier) | 24h rolling |
| Member API calls | Application-specific | Per member per day |
| Post creation (member) | ~25 posts/day (undocumented soft limit) | 24h |
| Post creation (organization) | ~100 posts/day (varies by page size) | 24h |
| Connection requests | 100/week (platform limit, not API) | 7 days |

### Error Response

When rate limited, LinkedIn returns:
```
HTTP 429 Too Many Requests
```

With headers indicating when the limit resets. LinkedIn documentation does not publicly specify exact numbers for all endpoints - they vary by partner level and are visible in the Developer Portal under "Usage and Limits".

### Handling Strategy

1. **Exponential backoff** on 429 responses (1s, 2s, 4s, 8s, max 60s)
2. **Queue posts** rather than sending immediately
3. **Track daily post count** per connected account in Convex
4. **Respect a conservative limit** of 10 posts/day per account to stay safe
5. **Cache profile data** to avoid unnecessary API calls

---

## 5. Content Format Constraints / Restricciones de Formato

### Text Post Constraints

| Property | Limit |
|----------|-------|
| Post text (commentary) | **3,000 characters** max |
| Characters before "See more" (desktop) | ~140 characters |
| Characters before "See more" (mobile) | ~110 characters |
| Hashtags | Recommended 3-5 max for engagement |
| Mentions | Format: mention URN syntax |
| Emojis | Supported, rendered natively |
| Line breaks | Supported via newline characters |
| URLs in text | Auto-detected and converted to link previews |

### Image Post Constraints

| Property | Specification |
|----------|--------------|
| Feed image (landscape) | 1200 x 627 px (1.91:1) |
| Feed image (square) | 1200 x 1200 px (1:1) |
| Feed image (portrait, best mobile) | 1080 x 1350 px (4:5) |
| Minimum dimensions | 360 x 360 px |
| Maximum file size | 5 MB recommended, 36 MP max |
| Supported formats | JPG, PNG, GIF (static) |
| Link preview thumbnail | 1200 x 627 px |

### Document Post Constraints

| Property | Specification |
|----------|--------------|
| File types | PDF (recommended), PPTX, DOCX |
| Maximum file size | 100 MB |
| Maximum pages | 300 |
| Optimal slide dimensions | 1080 x 1350 px (4:5 portrait) |

---

## 6. Architecture Recommendation / Arquitectura Recomendada

### Overview

```
+--------------------------------------------------------------+
|                    NEXT.JS 16 FRONTEND                       |
|                                                              |
|  +----------------+  +----------------+  +----------------+  |
|  | Connect        |  | Post Preview   |  | Publish Button |  |
|  | LinkedIn Btn   |  | Component      |  | (on approved   |  |
|  |                |  |                |  |  content)      |  |
|  +-------+--------+  +----------------+  +-------+--------+  |
|          |                                       |           |
+----------+---------------------------------------+-----------+
           |                                       |
           v                                       v
+--------------------------------------------------------------+
|                    CONVEX BACKEND                            |
|                                                              |
|  +--------------------------------------------------------+ |
|  |  HTTP Actions (convex/http.ts)                         | |
|  |  - GET /linkedin/auth       -> Start OAuth             | |
|  |  - GET /linkedin/callback   -> Handle OAuth callback   | |
|  +--------------------------------------------------------+ |
|                                                              |
|  +--------------------------------------------------------+ |
|  |  Actions (convex/linkedin/actions.ts)                  | |
|  |  - publishToLinkedIn(contentId)                        | |
|  |  - refreshLinkedInToken(connectionId)                  | |
|  |  - uploadImageToLinkedIn(imageUrl)                     | |
|  +--------------------------------------------------------+ |
|                                                              |
|  +--------------------------------------------------------+ |
|  |  Mutations (convex/linkedin/mutations.ts)              | |
|  |  - storeLinkedInConnection(tokens, profile)            | |
|  |  - updateConnectionStatus(id, status)                  | |
|  |  - logPublishAttempt(contentId, result)                | |
|  |  - disconnectLinkedIn(connectionId)                    | |
|  +--------------------------------------------------------+ |
|                                                              |
|  +--------------------------------------------------------+ |
|  |  Queries (convex/linkedin/queries.ts)                  | |
|  |  - getLinkedInConnection()                             | |
|  |  - getConnectionStatus()                               | |
|  |  - getPublishHistory(contentId)                        | |
|  +--------------------------------------------------------+ |
|                                                              |
|  +--------------------------------------------------------+ |
|  |  Cron (added to convex/crons.ts)                       | |
|  |  - daily: checkTokenExpiration() -> warn user          | |
|  +--------------------------------------------------------+ |
|                                                              |
+--------------------------------------------------------------+
```

### Schema Additions (to convex/schema.ts)

Two new tables needed:

**linkedinConnections** - stores OAuth tokens and profile info:
- linkedinMemberId (string) - "sub" from userinfo
- displayName (string) - full name
- email (optional string)
- profilePicture (optional string) - avatar URL
- profileUrl (optional string)
- accessToken (string) - encrypted at rest by Convex
- refreshToken (optional string)
- accessTokenExpiresAt (number) - timestamp
- refreshTokenExpiresAt (optional number) - timestamp
- scopes (array of strings) - granted scopes
- status: "connected" | "expired" | "disconnected" | "revoked"
- dailyPostCount (number) - rate limit tracking
- lastPostAt (optional number)
- lastPostCountResetAt (number)
- Indexes: by_memberId, by_status

**linkedinPublishLog** - tracks every publish attempt:
- contentId (id to content table)
- connectionId (id to linkedinConnections)
- linkedinPostUrn (optional string) - urn:li:share:xxx
- status: "pending" | "published" | "failed" | "deleted"
- errorMessage (optional string)
- publishedAt (optional number)
- metadata (optional object with postType, characterCount, hasImage, visibility)
- Indexes: by_contentId, by_connectionId, by_status

### Convex HTTP Actions for OAuth

This project does not yet have a `convex/http.ts` file. We need to create one using `httpRouter` from `convex/server`. The HTTP actions handle:

1. **GET /linkedin/auth** - Generates OAuth authorization URL with CSRF state, redirects user to LinkedIn
2. **GET /linkedin/callback** - Receives authorization code, exchanges for tokens via Convex action, stores connection, redirects back to app

The callback URL for Convex HTTP Actions uses the `.site` domain (not `.cloud`). For example: `https://your-deployment.convex.site/linkedin/callback`

### Environment Variables Required

```
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:3000
```

---

## 7. Content Preview / Vista Previa

### How LinkedIn Renders Posts

The preview component should simulate:

1. **Author line:** Profile picture + Name + Headline + Time ago
2. **Text body:** First ~140 chars visible, rest behind "...see more"
3. **Link preview card:** If URL detected, show title + description + thumbnail (1200x627)
4. **Image:** If image attached, show at 1.91:1 or 4:5 depending on original
5. **Engagement bar:** Like/Comment/Repost/Send icons (static, non-functional)
6. **Hashtags:** Rendered as blue links at end of post

### Implementation Approach

Build a `LinkedInPostPreview` React component that:
- Takes `commentary` (text), optional `imageUrl`, optional `articleUrl` as props
- Renders a mock LinkedIn card with proper typography and spacing
- Truncates text at 140 chars with "...see more" link
- Shows character count indicator (0/3000)
- Shows image preview at correct aspect ratio
- Uses Tailwind CSS, no external dependencies

This is purely a frontend component. No LinkedIn API call needed for preview.

---

## 8. LinkedIn App Registration / Registro de App

### Steps to Register

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app (requires a LinkedIn Company Page)
3. Add products:
   - "Share on LinkedIn" (instant access, grants `w_member_social`)
   - "Sign In with LinkedIn using OpenID Connect" (instant access, grants `openid`, `profile`, `email`)
4. Configure OAuth 2.0 settings:
   - Add redirect URL: `{CONVEX_SITE_URL}/linkedin/callback`
   - Copy Client ID and Client Secret
5. Set environment variables in Convex

### No Review Required for MVP

The "Share on LinkedIn" and "Sign In with LinkedIn" products are self-serve and do not require LinkedIn review. Access is granted immediately upon adding the products.

The "Community Management API" (for organization pages) requires a review process that takes weeks to months. This is NOT needed for the MVP.

---

## 9. NPM Packages to Consider / Paquetes NPM

| Package | Status | Purpose | Recommendation |
|---------|--------|---------|---------------|
| `linkedin-api-client` (official) | Beta (v0.3.0, 3 years old) | Official JS client | **Do NOT use** - stale, beta, unnecessary abstraction |
| `node-linkedin` | Deprecated | Old LinkedIn API | **Do NOT use** |
| `next-auth` / `auth.js` | Active | OAuth provider | **Consider** for OAuth flow only, but adds complexity |
| `convex-auth` | Active | Convex-native auth | **Consider** if using Convex Auth already |

**Recommendation:** Use raw `fetch()` calls in Convex Actions. The LinkedIn API is straightforward REST. Adding a client library for 3-4 endpoints is unnecessary overhead. This matches the existing pattern in `convex/actions.ts` where Claude API is called via raw `fetch()`.

---

## 10. Risk Assessment / Evaluacion de Riesgos

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Token storage security** | Leaked tokens = unauthorized posting | Convex encrypts data at rest; never expose tokens to frontend; use environment variables for client secrets |
| **LinkedIn API changes** | Breaking changes could disable publishing | Pin API version in `Linkedin-Version` header; monitor LinkedIn developer changelog |
| **Rate limit violations** | Account suspension | Track post count per account; enforce daily limit of 10 posts |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Token expiration UX** | User confusion when tokens expire | Cron job to check expiration; proactive UI warnings 7 days before expiry; clear reconnect flow |
| **Content length mismatch** | Post fails if over 3000 chars | Validate before publish; show character counter in preview |
| **Image upload failures** | Post published without intended image | 2-step upload with validation; show clear error if image fails |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OAuth state mismatch** | Failed connection (CSRF) | Use crypto.randomUUID(); validate state on callback |
| **LinkedIn API downtime** | Temporary publishing failure | Queue and retry with exponential backoff |
| **Multiple accounts** | Complexity in account management | MVP: single account only. Multi-account in future phase |

---

## 11. Key Decisions to Make / Decisiones Clave

### Decision 1: Personal Profile vs Organization Page

**Options:**
- A) Personal profile only (via "Share on LinkedIn" - instant access)
- B) Organization page only (via "Community Management API" - requires review)
- C) Both

**Recommendation:** **Option A** for MVP. Personal profile posting is immediately available, no review needed, simpler to implement. Add organization page support in a future phase.

### Decision 2: OAuth Token Storage Location

**Options:**
- A) Store in Convex `linkedinConnections` table (new dedicated table)
- B) Store in Convex `settings` table (existing)
- C) Use Convex Auth / Auth.js integration

**Recommendation:** **Option A**. Dedicated table provides clear separation, indexing, and room for multi-account support later. The `settings` table is for system config, not user credentials.

### Decision 3: Publish Trigger

**Options:**
- A) Manual "Publish to LinkedIn" button on approved content
- B) Automatic on status change to "published"
- C) Scheduled publishing (pick date/time)

**Recommendation:** **Option A** for MVP. Manual trigger gives user full control and avoids accidental publishing. Scheduled publishing can be added in a follow-up.

### Decision 4: Image Handling

**Options:**
- A) Text-only posts for MVP
- B) Support images from Convex storage (content.assets)
- C) Support image URL references

**Recommendation:** **Option A** with **Option B** as fast follow. Most LinkedIn social content is text-only. Image upload adds complexity (3-step flow). Ship text posts first, add image support in a sub-task.

### Decision 5: Auth.js vs Custom OAuth

**Options:**
- A) Use Auth.js (NextAuth) LinkedIn provider
- B) Custom OAuth flow via Convex HTTP Actions
- C) Use Convex Auth library

**Recommendation:** **Option B**. The project does not currently use Auth.js or Convex Auth. Adding an auth library just for LinkedIn OAuth is overkill. A custom implementation via Convex HTTP Actions is ~100 lines of code, matches the existing project patterns (raw fetch in actions.ts), and gives full control. If the project later adopts Convex Auth for user authentication, LinkedIn can be migrated to use it.

### Decision 6: Single vs Multi-Account

**Options:**
- A) Single LinkedIn account per AMD instance
- B) Multiple accounts (team members)

**Recommendation:** **Option A** for MVP. Multi-account adds schema complexity and UX for account selection. Single account is sufficient for proof-of-concept.

---

## 12. Implementation Estimate / Estimacion

### Wave 1: OAuth + Connection (LI-01, LI-04) - ~8 hours
- Create `convex/http.ts` with httpRouter
- Create `convex/linkedin/` module (actions, mutations, queries)
- Add `linkedinConnections` table to schema
- Implement OAuth flow (auth redirect, callback, token exchange)
- Token storage and refresh logic
- Connection status component in Settings page
- Cron job for token expiration check

### Wave 2: Preview Component (LI-03) - ~4 hours
- Build `LinkedInPostPreview` component
- Character count + truncation simulation
- Link preview card mock
- Integration with content detail page

### Wave 3: Publishing (LI-02, LI-05) - ~6 hours
- `publishToLinkedIn` Convex action
- Add `linkedinPublishLog` table to schema
- "Publish to LinkedIn" button on approved content
- Rate limit tracking
- Error handling and user feedback
- Update content status to "published" with `publishedUrl`

### Wave 4: Polish + Testing - ~4 hours
- Disconnect flow
- Token refresh on 401 responses
- Edge case handling (expired tokens, rate limits)
- Manual testing with real LinkedIn account

**Total estimate: ~22 hours**

---

## 13. References / Referencias

### Official LinkedIn Documentation
- Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- Images API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
- Documents API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/documents-api
- OAuth 2.0 Overview: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- 3-Legged OAuth Flow: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
- Refresh Tokens: https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
- Rate Limits: https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits
- API Versioning: https://learn.microsoft.com/en-us/linkedin/marketing/versioning
- Community Management Overview: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview
- App Review: https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review
- Share on LinkedIn: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
- LinkedIn Developer Portal: https://developer.linkedin.com/product-catalog

### Convex Documentation
- HTTP Actions: https://docs.convex.dev/functions/http-actions
- Convex Auth: https://labs.convex.dev/auth/config/oauth

### Community Resources
- Posting to LinkedIn via the API (Marcus Noble, 2025): https://marcusnoble.co.uk/2025-02-02-posting-to-linkedin-via-the-api/
- LinkedIn OAuth Notes 2025 (Edwin Savarimuthu): https://medium.com/@ed.sav/setting-up-linkedin-oauth-few-notes-2025-0097ac858157
- LinkedIn API JS Client (Official GitHub): https://github.com/linkedin-developers/linkedin-api-js-client
- LinkedIn Post Size Guide 2026: https://www.sendible.com/insights/linkedin-post-size

---

## RESEARCH COMPLETE

All requirements understood. Architecture decided. No blockers identified for MVP scope.

**Next step:** Create implementation PLANs based on the waves defined in section 12.
