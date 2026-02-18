# Google Drive Brand Content Integration — Design

**Date:** 2026-02-18
**Status:** Approved
**Author:** AIAIAI Consulting

## Summary

Integrate Google Drive as an external content source for AMD, allowing users to manually import brand assets (images, logos, videos) and brand documents (guidelines, manuals, tone-of-voice docs) into the existing Media Library, Knowledge Base, and Brand Profile.

## Architecture

```
Settings > Conexiones > Google Drive
    └─ OAuth 2.0 flow → saves tokens to googleDriveConnections table

Brand wizard / Media Library / Knowledge Base
    └─ "Importar desde Drive" button
        └─ Opens DriveFilePicker modal
            └─ Navigates folders, selects files
                └─ Downloads via Drive API → Convex Storage
                    └─ Creates mediaAsset or kbDocument records
```

## Data Model

### New table: `googleDriveConnections`

```typescript
googleDriveConnections: defineTable({
  userId: v.string(),
  accessToken: v.string(),
  refreshToken: v.string(),
  email: v.string(),
  displayName: v.string(),
  status: v.union(
    v.literal("connected"),
    v.literal("expired"),
    v.literal("error")
  ),
  connectedAt: v.number(),
  expiresAt: v.number(),
}).index("by_userId", ["userId"])
```

## OAuth Flow

Follows existing LinkedIn/Twitter/Instagram pattern:
1. `GoogleDriveConnectionCard` in Settings → Platforms tab
2. Click "Connect" → redirects to `convex.site/google-drive/auth`
3. Convex HTTP action initiates OAuth 2.0 with scope `drive.readonly`
4. Google callback → Convex saves tokens → redirects to Settings with `?google_drive=connected`
5. Token refresh handled by Convex action on API calls

## DriveFilePicker Component

Reusable modal component with:
- Breadcrumb folder navigation
- File/folder list with icons, names, types, dates
- Multi-select with checkboxes
- Filter bar (Images, Documents, All)
- Selected files counter
- "Import X files" action button

### Props

```typescript
interface DriveFilePickerProps {
  onFilesSelected: (files: DriveFile[]) => void;
  acceptTypes?: string[];  // MIME type filter
  maxFiles?: number;
}
```

## Integration Points

| Location | Button | Behavior |
|----------|--------|----------|
| Media Library | "Importar desde Drive" | Opens picker → imports to `mediaAssets` + Convex Storage |
| Knowledge Base | "Importar desde Drive" | Opens picker (docs only) → imports to `kbDocuments`, parses content |
| Brand Wizard (Step Visual) | "Importar desde Drive" | Opens picker (images only) → imports logo/visual assets |

## Import Flow

1. User selects files in DriveFilePicker
2. Frontend calls `importFromDrive({ fileIds, destination })`
3. Convex action:
   - Downloads file via Google Drive API
   - Uploads to Convex Storage
   - Creates record in destination table (mediaAssets or kbDocuments)
   - If document (PDF/DOCX), parses content into kbSections
4. Frontend shows success toast

## MVP Scope

### Included
- OAuth 2.0 with Google Drive (read-only)
- GoogleDriveConnectionCard in Settings
- DriveFilePicker reusable modal
- Import to Media Library
- Import to Knowledge Base (with existing PDF/DOCX parsing)
- Import in Brand Wizard step visual

### Excluded (future)
- Automatic sync / Drive webhooks
- Two-way sync (upload from AMD to Drive)
- Native Google Workspace docs (Docs, Sheets, Slides)
- Shared drives / Team drives

## Environment Variables

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Security Considerations

- `drive.readonly` scope only — minimal permissions
- Tokens stored in Convex (server-side only)
- Token refresh on expiry
- User can disconnect at any time
