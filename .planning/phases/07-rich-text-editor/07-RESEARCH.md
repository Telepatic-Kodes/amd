# Research: Phase 7 - Rich Text Editor Integration

## Overview

This document contains research findings on how to implement Phase 7: replacing the textarea in EditContentModal with a TipTap WYSIWYG editor.

## Key Research Findings

### 1. TipTap as the Solution
- **What:** Modern, headless rich text editor built on ProseMirror with excellent React support
- **Why:** Better than alternatives (Quill, Draft.js, Slate) for our use case - it's performant, actively maintained, and has great keyboard shortcut support
- **React 19 Compatibility:** Core editor works; requires testing (optimized for React 18)
- **Bundle Impact:** ~245KB minified (~70KB gzipped) - acceptable for CMS

### 2. Technical Architecture

**Storage:** HTML in existing Convex `content.body` field
- No database schema changes needed
- Backward compatible with existing plain text
- TipTap handles HTML serialization/deserialization

**State Management:** Isolated `RichTextEditor` component
- Use TipTap's `useEditor` hook
- Callback-based updates to parent
- Debounced onChange (150ms) for performance

**Toolbar Strategy:** Hybrid approach
- Fixed toolbar with formatting buttons at top
- BubbleMenu (floating) for inline selection
- Mobile-optimized with reduced toolbar options

**Preview:** Tab-toggle (Write/Preview)
- Not side-by-side split (saves space, better mobile UX)
- Read-only TipTap instance for preview
- Safe HTML rendering (TipTap schema prevents XSS)

### 3. Requirements Mapping

| Requirement | Implementation |
|------------|----------------|
| EDITOR-01: WYSIWYG formatting | StarterKit extensions (bold, italic, headings, lists, code, links) |
| EDITOR-02: Real-time preview | Write/Preview tab toggle + EditorPreview component |
| EDITOR-03: Keyboard shortcuts | StarterKit includes all standard shortcuts (Ctrl+B, Ctrl+I, etc.) |
| EDITOR-04: Validation & character count | CharacterCount extension + EditorStatusBar + min 50 chars rule |
| EDITOR-05: Export to plain text and HTML | copyHtmlToClipboard, downloadAsFile utilities |

### 4. Implementation Complexity

**Total Effort:** ~20 hours
- Wave 1 (Core): 6-8 hours
- Wave 2 (UI): 6-8 hours (can run parallel)
- Wave 3 (Preview & Validation): 4-6 hours
- Wave 4 (Polish): 3-4 hours

**Risk Level:** Low-Medium
- React 19 peer dependency handling
- Performance with large content (10k+ words)
- XSS prevention (TipTap handles this well)

### 5. Key Decisions

1. **HTML Storage:** Store as HTML, not Markdown
   - Better for re-editing (preserves exact formatting)
   - Easier export to multiple formats
   - Works with existing schema

2. **Preview as Tab:** Not side-by-side split
   - Saves space in modal
   - Better on mobile (no need for complex responsive layout)
   - Simpler implementation

3. **Toolbar Extraction:** Separate EditorToolbar component
   - Reusable for future editors
   - Easier to test and maintain
   - Can be positioned flexibly

4. **Debounced Updates:** 150ms debounce on onChange
   - Prevents excessive Convex updates
   - Smooth typing experience
   - Configurable for future auto-save

### 6. Security & Performance

**Security:**
- TipTap sanitizes HTML by default
- Schema-based validation prevents invalid content
- No XSS risk with TipTap's architecture

**Performance:**
- Tested with documents 200,000+ words
- Use `shouldRerenderOnTransaction: false` to prevent excessive re-renders
- Memoization for toolbar and status bar components
- Debounced onChange reduces state updates

### 7. Migration Strategy

**Backward Compatibility:**
- Existing plain text auto-converts to HTML (just stored as-is)
- No data migration needed
- Old content loads correctly in read-only preview

**Rollback Plan:**
- Feature flag for safe deployment
- Can toggle back to textarea if needed
- No breaking changes to existing APIs

### 8. Open Questions Answered

1. **Mobile toolbar:** Hide advanced options, show essential formatting only
2. **Link dialog:** Custom modal with URL validation
3. **Preview styling:** Match published site styling using Tailwind prose classes
4. **Auto-save:** Defer to Phase 8 (optional enhancement)
5. **Rollout:** Feature flag for gradual rollout

## RESEARCH COMPLETE

Ready to proceed to planning.

All requirements understood. Architecture decided. No blockers identified.
