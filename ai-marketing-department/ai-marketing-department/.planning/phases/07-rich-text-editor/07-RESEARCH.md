# Phase 7: Rich Text Editor Integration - RESEARCH

**Date:** January 30, 2026
**Researcher:** Domain Research Agent for GSD
**Project:** AI Marketing Department (AMD)
**Phase:** 7 - Rich Text Editor Integration

---

## Executive Summary

This research investigates the integration of **TipTap WYSIWYG editor** into the EditContentModal component to replace the current plain textarea. TipTap is a modern, headless, framework-agnostic rich text editor built on ProseMirror, offering excellent React integration, extensive formatting capabilities, and strong performance characteristics.

**Key Findings:**
- TipTap provides out-of-the-box keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- Character counting and validation are built into TipTap extensions
- Performance is excellent even with 200,000+ words
- HTML export and sanitization are natively supported
- React 19 compatibility requires attention (currently optimized for React 18)
- Package installation required: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-character-count`

**Estimated Complexity:** **Medium**
**Risk Level:** **Low-Medium**

---

## 1. TipTap Integration & Setup

### 1.1 Installation

**Required Packages:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-character-count
```

**Package Purposes:**
- `@tiptap/react` - React bindings and hooks
- `@tiptap/pm` - ProseMirror core dependencies
- `@tiptap/starter-kit` - Bundle of essential extensions (Bold, Italic, Heading, BulletList, OrderedList, Code, CodeBlock, Paragraph, etc.)
- `@tiptap/extension-link` - Link formatting with URL validation
- `@tiptap/extension-character-count` - Character/word counting with limits

### 1.2 Basic Setup Pattern

**Recommended Approach (from official docs):**

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-indigo-400 underline',
      },
    }),
    CharacterCount.configure({
      limit: 10000,
    }),
  ],
  content: initialContent,
  editable: true,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    onChange(html)
  },
})

return <EditorContent editor={editor} />
```

### 1.3 React 19 Compatibility Warning

**Important:** TipTap UI Components currently work best with React 18 (and Next.js 15). The core editor works with React 19, but there may be minor compatibility issues with advanced features. The TipTap team is actively working on upgrading support for React 19.

**Mitigation:** Use core TipTap components (not UI Components) and test thoroughly. Our current stack (Next.js 16, React 19) is cutting-edge, so we should expect minor friction.

**Sources:**
- [React | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Get started | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/overview)

---

## 2. Extension Recommendations & Configuration

### 2.1 Starter Kit Extensions

The `StarterKit` bundle includes:
- **Bold** (`Ctrl+B` / `Cmd+B`)
- **Italic** (`Ctrl+I` / `Cmd+I`)
- **Heading** (H1-H6, `Ctrl+Alt+1` through `Ctrl+Alt+6`)
- **BulletList** (`Ctrl+Shift+8`)
- **OrderedList** (`Ctrl+Shift+7`)
- **Code** (inline code, `Ctrl+E`)
- **CodeBlock** (code block with syntax highlighting)
- **Paragraph** (default text node)
- **HardBreak** (`Shift+Enter`)
- **History** (Undo/Redo, `Ctrl+Z`, `Ctrl+Shift+Z`)

### 2.2 Additional Extensions Needed

**Link Extension:**
```tsx
import Link from '@tiptap/extension-link'

Link.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: 'text-indigo-400 underline hover:text-indigo-300',
  },
  validate: href => /^https?:\/\//.test(href),
})
```

**CharacterCount Extension:**
```tsx
import CharacterCount from '@tiptap/extension-character-count'

CharacterCount.configure({
  limit: null,
})
```

### 2.3 Keyboard Shortcuts

TipTap comes with sensible defaults:
- `Mod+B` - Bold (Cmd on Mac, Ctrl on Windows/Linux)
- `Mod+I` - Italic
- `Mod+K` - Add link (requires custom implementation)
- `Mod+Z` - Undo
- `Mod+Shift+Z` - Redo
- `Mod+Shift+8` - Toggle bullet list
- `Mod+Shift+7` - Toggle ordered list

**Custom Shortcuts:**
You can add custom shortcuts by extending extensions:
```tsx
import { Extension } from '@tiptap/core'

const CustomKeymap = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        return this.editor.commands.toggleLink()
      },
    }
  },
})
```

**Sources:**
- [Keyboard shortcuts | Tiptap Editor Docs](https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts)
- [GitHub - shoghdev/react-tiptap-editor](https://github.com/shoghdev/react-tiptap-editor)

---

## 3. State Management Pattern

### 3.1 Integration with Existing Form State

**Current EditContentModal State:**
```tsx
const [formData, setFormData] = useState({
  title: "",
  body: "",
  summary: "",
})
```

**Recommended Pattern:**

```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function EditContentModal({ content }) {
  const [formData, setFormData] = useState({ ... })

  const editor = useEditor({
    extensions: [StarterKit, Link, CharacterCount],
    content: formData.body,
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setFormData(prev => ({ ...prev, body: html }))
    },
  })

  useEffect(() => {
    if (editor && content?.body !== editor.getHTML()) {
      editor.commands.setContent(content.body || '')
    }
  }, [content?.body, editor])

  return <EditorContent editor={editor} />
}
```

### 3.2 Performance Optimization

**Issue:** `useEditor` re-renders on every change, which can cause performance issues.

**Solution:** Isolate the editor in a separate component:

```tsx
const RichTextEditor = ({ initialContent, onChange }) => {
  const editor = useEditor({
    extensions: [...],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  }, [])

  return <EditorContent editor={editor} />
}
```

### 3.3 Serialization & Deserialization

**HTML to Plain Text (for backward compatibility):**
```tsx
const plainText = editor.getText()
const html = editor.getHTML()
const json = editor.getJSON()
```

**Sources:**
- [Export to JSON and HTML | Tiptap Editor Docs](https://tiptap.dev/docs/guides/output-json-html)
- [Integration performance | Tiptap Editor Docs](https://tiptap.dev/docs/guides/performance)

---

## 4. Preview Implementation Strategy

### 4.1 Preview Options Analysis

**Option A: Split-Pane (50-50)**
- **Pros:** See editor and preview side-by-side, great for long content
- **Cons:** Reduces editing space, complex on mobile
- **Use Case:** Desktop-first, technical content

**Option B: Toggle Tab/Modal**
- **Pros:** Full editing space, simple implementation, mobile-friendly
- **Cons:** Can't see both at once
- **Use Case:** Mobile-responsive, simple UX

**Option C: Bottom Preview (Read-Only)**
- **Pros:** See context below, simple scroll, no tab switching
- **Cons:** Takes vertical space, redundant with editor rendering
- **Use Case:** Short-form content

**Recommendation:** **Option B - Toggle Tab/Modal**
- Fits existing modal architecture
- Mobile-friendly (EditContentModal already full-screen)
- Simpler to implement
- Can be enhanced to Option A later if needed

### 4.2 Safe HTML Rendering

**Security Concern:** TipTap allows custom HTML, which could introduce XSS vulnerabilities.

**TipTap's Built-in Protection:**
TipTap only allows tags and attributes specified in the extensions added to the editor instance. This provides schema-based sanitization.

**Additional Sanitization:**
For preview rendering, use DOMPurify library to ensure safe HTML rendering. Install with:
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

Use DOMPurify to sanitize HTML before rendering:
```tsx
import DOMPurify from 'dompurify'

const sanitizedHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'class'],
})
```

**Database Storage Best Practice:**
- Store HTML in `body` field (current schema supports this)
- Sanitize on write (server-side in Convex mutation)
- No changes needed to schema

**Sources:**
- [Does TipTap sanitize HTML or do I have to use a dedicated package? · ueberdosis/tiptap · Discussion #2845](https://github.com/ueberdosis/tiptap/discussions/2845)
- [Best Practices for Saving Tiptap JSON vs. HTML in MongoDB/MySQL | by Faisal Mujtaba | Medium](https://medium.com/@faisalmujtaba/best-practices-for-saving-tiptap-json-vs-html-in-mongodb-mysql-a5192bd68abc)

### 4.3 Preview UI Design

```tsx
const [previewMode, setPreviewMode] = useState(false)

return (
  <div>
    <div className="flex border-b border-zinc-800">
      <button
        onClick={() => setPreviewMode(false)}
        className={cn("px-4 py-2", !previewMode && "border-b-2 border-indigo-500")}
      >
        Edit
      </button>
      <button
        onClick={() => setPreviewMode(true)}
        className={cn("px-4 py-2", previewMode && "border-b-2 border-indigo-500")}
      >
        Preview
      </button>
    </div>

    {previewMode ? (
      <PreviewContent html={formData.body} />
    ) : (
      <EditorContent editor={editor} />
    )}
  </div>
)
```

---

## 5. Toolbar Design Decisions

### 5.1 Toolbar Placement Options

**Option A: Floating Toolbar (BubbleMenu)**
- Appears above selected text
- Space-efficient
- Contextual to selection
- **Best for:** Text formatting (bold, italic, link)

**Option B: Fixed Toolbar (Top of Editor)**
- Always visible
- Predictable location
- Shows all options
- **Best for:** Block formatting (headings, lists)

**Recommendation:** **Hybrid Approach**
- **BubbleMenu** for inline formatting (bold, italic, link) - appears on text selection
- **Fixed Toolbar** for block formatting (headings, lists, code) - always visible above editor

### 5.2 Essential Formatting Options

**Tier 1 (Must-Have):**
- Bold (`Ctrl+B`)
- Italic (`Ctrl+I`)
- Link (`Ctrl+K`)
- Heading 2, 3 (H1 reserved for title)
- Bullet List
- Ordered List

**Tier 2 (Nice-to-Have):**
- Code (inline)
- Code Block
- Undo/Redo (keyboard only, no buttons needed)

**Tier 3 (Future):**
- Blockquote
- Horizontal Rule
- Image Upload (Phase 8+)

### 5.3 Mobile Toolbar Considerations

**Challenge:** Limited screen space on mobile

**Solution:**
- Use icon-only buttons (no labels)
- Show only Tier 1 options on mobile
- Consider collapsible toolbar or "More" menu
- BubbleMenu may need different positioning on mobile

**Sources:**
- [BubbleMenu extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu)
- [Custom menu | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus)

---

## 6. Validation Approach for Rich Text

### 6.1 Character Count with HTML

**Challenge:** Current validation requires `body.length >= 50`, but HTML tags inflate character count.

**TipTap CharacterCount Extension:**
```tsx
import CharacterCount from '@tiptap/extension-character-count'

const editor = useEditor({
  extensions: [CharacterCount],
})

const charCount = editor.storage.characterCount.characters()
const wordCount = editor.storage.characterCount.words()
```

**Validation Logic:**
```tsx
const textContent = editor.getText()
const isValid = textContent.length >= 50

<p className="text-xs text-zinc-500 mt-1">
  {textContent.length} characters • {wordCount} words
  {textContent.length < 50 && (
    <span className="text-red-400 ml-2">
      (Minimum 50 characters required)
    </span>
  )}
</p>
```

### 6.2 Paste Cleanup (From Word/Google Docs)

**Issue:** Pasting from Word adds tons of junk HTML.

**TipTap Solution:**
TipTap automatically cleans pasted content based on your schema. Only allowed tags/attributes are preserved.

**Additional Cleanup:**
```tsx
const editor = useEditor({
  editorProps: {
    transformPastedHTML(html) {
      return html
        .replace(/<meta[^>]*>/g, '')
        .replace(/class="Mso[^"]*"/g, '')
        .replace(/style="[^"]*"/g, '')
    },
  },
})
```

**Sources:**
- [CharacterCount extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/character-count)
- [React tiptap custom extension for word count](https://dawid.app/blog/tiptap-word-count-extension)

---

## 7. Performance Considerations

### 7.1 Large Document Performance

**Official Testing:** TipTap has a demo with 200,000+ words to showcase performance. The editor can handle very large documents efficiently.

**Performance Bottlenecks:**

1. **React Re-renders** (Most Common Issue)
   - **Problem:** Editor re-renders on every change
   - **Solution:** Isolate editor in separate component, use `useTiptapState` for specific state

2. **React Node Views** (If Used)
   - **Problem:** Custom React components for nodes are expensive
   - **Solution:** Use plain HTML elements instead of React components where possible

3. **Transaction Processing**
   - **Problem:** Every keystroke creates a transaction
   - **Solution:** Use `shouldRerenderOnTransaction` option (TipTap 2.5+)

### 7.2 Optimization Strategies

```tsx
const editor = useEditor({
  extensions: [...],
  content: initialContent,
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none',
    },
  },
  shouldRerenderOnTransaction: false,
}, [])

const wordCount = useTiptapState((state) => {
  return state.editor.storage.characterCount.words()
})
```

### 7.3 Bundle Size Impact

**Estimated Bundle Size:**
- `@tiptap/react` + `@tiptap/pm`: ~150KB (minified)
- `@tiptap/starter-kit`: ~80KB
- `@tiptap/extension-link`: ~10KB
- `@tiptap/extension-character-count`: ~5KB
- **Total:** ~245KB minified (~70KB gzipped)

**Impact:** Moderate. This is acceptable for a content management system. The rich editing experience justifies the bundle size.

**Sources:**
- [Integration performance | Tiptap Editor Docs](https://tiptap.dev/docs/guides/performance)
- [Long texts example | Tiptap Editor Docs](https://tiptap.dev/docs/examples/basics/long-texts)
- [React rendering performance demo | Tiptap Editor Docs](https://tiptap.dev/docs/examples/advanced/react-performance)
- [Say hello to Tiptap 2.5, our most performant editor yet – Tiptap Release Notes](https://tiptap.dev/blog/release-notes/say-hello-to-tiptap-2-5-our-most-performant-editor-yet)

---

## 8. Migration & Compatibility Strategy

### 8.1 Backward Compatibility

**Current State:**
- Existing content stored as plain text in `content.body` field
- No HTML formatting in database

**Migration Approach:**

**Option A: Progressive Enhancement (Recommended)**
```tsx
const isPlainText = !formData.body.includes('<')

const editor = useEditor({
  content: isPlainText
    ? `<p>${formData.body.replace(/\n/g, '</p><p>')}</p>`
    : formData.body,
})
```

**Option B: Dual Storage**
```tsx
content: {
  body: v.string(),
  bodyText: v.string(),
}
```

**Recommendation:** **Option A** - No schema changes needed, automatic conversion, graceful degradation.

### 8.2 Database Schema Impact

**Current Schema (No Changes Needed):**
```typescript
content: defineTable({
  body: v.string(),
})
```

The existing `body` field is a string, which can store both plain text and HTML. No migration required.

### 8.3 Export Formats

**Requirement EDITOR-05:** Export to plain text and HTML

**Implementation:**
```tsx
const html = editor.getHTML()
const plainText = editor.getText()
const json = editor.getJSON()
```

### 8.4 Rollback Strategy

**If TipTap integration fails:**

1. **Feature Flag:** Implement behind a feature flag
   ```tsx
   const USE_RICH_EDITOR = process.env.NEXT_PUBLIC_ENABLE_RICH_EDITOR === 'true'
   return USE_RICH_EDITOR ? <RichTextEditor /> : <textarea />
   ```

2. **A/B Testing:** Roll out to 10% of users first

3. **Data Safety:** HTML content degrades gracefully to plain text

4. **Monitoring:** Track error rates, user feedback, performance metrics

---

## 9. Implementation Complexity Assessment

### 9.1 Complexity Breakdown

| Component | Complexity | Effort | Risk |
|-----------|-----------|--------|------|
| Package Installation | Low | 30 min | Low |
| Basic Editor Setup | Low | 2 hours | Low |
| Toolbar UI | Medium | 4 hours | Low |
| Preview Toggle | Low | 2 hours | Low |
| State Integration | Medium | 3 hours | Medium |
| Validation Logic | Low | 2 hours | Low |
| Styling (Tailwind) | Medium | 3 hours | Low |
| Testing & Polish | Medium | 4 hours | Low |
| **Total** | **Medium** | **~20 hours** | **Low-Medium** |

### 9.2 Development Phases

**Phase 1: Core Integration (8 hours)**
- Install packages
- Replace textarea with basic TipTap editor
- Setup extensions (StarterKit, Link, CharacterCount)
- Sync with formData state

**Phase 2: UI & Toolbar (8 hours)**
- Design and implement fixed toolbar
- Add BubbleMenu for inline formatting
- Style with Tailwind (prose, dark mode)
- Mobile responsive design

**Phase 3: Preview & Validation (4 hours)**
- Implement preview toggle
- Character/word count validation
- HTML sanitization for preview
- Export functionality

**Phase 4: Polish & Testing (4 hours)**
- Edge case testing (large documents, paste cleanup)
- Performance optimization
- Cross-browser testing
- Documentation

---

## 10. Risk Assessment & Mitigation

### 10.1 Identified Risks

| Risk | Probability | Impact | Severity | Mitigation |
|------|------------|--------|----------|------------|
| React 19 compatibility issues | Medium | Medium | Medium | Test thoroughly, use core TipTap (not UI Components) |
| Performance degradation with large content | Low | High | Medium | Implement optimization patterns, isolate editor component |
| XSS vulnerabilities from HTML content | Low | High | Medium | Use TipTap schema-based sanitization + DOMPurify |
| User confusion with new UI | Medium | Low | Low | Add tooltips, keep familiar shortcuts |
| Bundle size increase | Low | Low | Low | Acceptable tradeoff, lazy load if needed |
| Breaking existing content | Low | High | Medium | Test with existing content, implement backward compatibility |

### 10.2 Mitigation Strategies

**React 19 Compatibility:**
- Test editor immediately after installation
- Monitor TipTap GitHub for React 19 updates
- Prepare rollback to React 18 if critical

**Performance:**
- Follow TipTap performance guide
- Implement `shouldRerenderOnTransaction: false`
- Use `useTiptapState` selectors
- Monitor with React DevTools Profiler

**Security:**
- Schema-based sanitization via TipTap extensions
- Server-side sanitization in Convex mutation
- DOMPurify for preview rendering
- Validate URLs in Link extension

**UX:**
- User testing with stakeholders
- Tooltips on toolbar buttons
- Keyboard shortcut hints
- "What's new" announcement

### 10.3 Rollback Plan

**Trigger Conditions:**
- Critical bugs affecting content saving
- Severe performance issues (>3s editor load)
- React 19 incompatibility blocking deployment

**Rollback Steps:**
1. Revert to textarea via feature flag
2. Existing HTML content will display as raw HTML (readable)
3. New content continues as plain text
4. No data loss - HTML is valid plain text

---

## 11. Recommended Tech Decisions

### 11.1 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Editor Library** | TipTap | Modern, headless, excellent React support, active development |
| **Extensions** | StarterKit + Link + CharacterCount | Covers all requirements, well-maintained |
| **State Management** | Isolated component with `useEditor` | Performance optimization, clean separation |
| **Preview Strategy** | Toggle tabs (Edit/Preview) | Simple, mobile-friendly, fits existing modal |
| **Toolbar Design** | Hybrid (BubbleMenu + Fixed) | Contextual + discoverable |
| **Storage Format** | HTML in existing `body` field | No schema changes, backward compatible |
| **Validation** | `editor.getText().length >= 50` | Accurate character count excluding HTML |
| **Sanitization** | TipTap schema + DOMPurify | Defense in depth |

### 11.2 Implementation Order

1. **Install packages** → Test basic setup in isolation
2. **Replace textarea** → Minimal TipTap integration
3. **Add toolbar** → Fixed toolbar first, BubbleMenu second
4. **Implement preview** → Tab toggle with sanitized HTML
5. **Validation** → Character count, word count, min length
6. **Polish** → Styling, mobile, keyboard shortcuts
7. **Testing** → Large documents, paste cleanup, edge cases

### 11.3 Success Criteria

- ✅ All EDITOR requirements met (EDITOR-01 through EDITOR-05)
- ✅ Character count validation works (min 50 chars)
- ✅ Keyboard shortcuts functional (Ctrl+B, Ctrl+I, etc.)
- ✅ Preview renders HTML safely
- ✅ No performance degradation with 10k+ word content
- ✅ Existing plain text content loads correctly
- ✅ Mobile toolbar usable on small screens
- ✅ Export to plain text and HTML works

---

## 12. Key Takeaways for Planning

### 12.1 What You Need to Know

**Technical:**
- TipTap requires 5 npm packages (~245KB total)
- React 19 compatibility requires testing (optimized for React 18)
- Editor must be isolated in separate component for performance
- HTML storage requires no schema changes
- Character count excludes HTML tags via `editor.getText()`

**UX:**
- Hybrid toolbar (BubbleMenu + Fixed) provides best experience
- Preview as tab toggle is simplest and mobile-friendly
- Keyboard shortcuts work out-of-the-box
- Paste cleanup is automatic via TipTap schema

**Security:**
- TipTap provides schema-based sanitization
- Additional DOMPurify for preview rendering
- Server-side sanitization recommended in Convex mutation

**Migration:**
- Existing plain text converts to HTML automatically
- No data migration needed
- Rollback via feature flag if needed

### 12.2 Open Questions for Planning

1. **Mobile Toolbar:** Should we hide advanced options (code, headings) on mobile or use a "More" menu?
2. **Link Dialog:** Simple `window.prompt()` or custom modal with URL validation?
3. **Preview Styling:** Should preview match published site styles or use generic prose?
4. **Auto-save:** Should we auto-save drafts while editing (Phase 7+ scope)?
5. **Feature Flag:** Do we want gradual rollout or all-at-once deployment?

### 12.3 Recommended Next Steps

1. **Install TipTap packages** and test basic editor in isolation
2. **Create spike** - 2-hour prototype to validate React 19 compatibility
3. **Design toolbar** - Sketch/wireframe the toolbar UI
4. **Plan component structure** - RichTextEditor, Toolbar, Preview components
5. **Write tests** - Plan testing strategy for validation and performance

---

## RESEARCH COMPLETE

**Summary:** TipTap is an excellent choice for rich text editing in the AMD content management system. Integration is straightforward, performance is strong, and the library provides all required features out-of-the-box. The main considerations are React 19 compatibility testing and performance optimization via component isolation.

**Estimated Complexity:** Medium (20 hours development)
**Risk Level:** Low-Medium (manageable with proper testing)
**Recommended Approach:** Incremental implementation with feature flag for safe rollout

**Ready to proceed to planning.**

---

## Sources

### Official TipTap Documentation
- [React | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/install/react)
- [Get started | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/overview)
- [Keyboard shortcuts | Tiptap Editor Docs](https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts)
- [BubbleMenu extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu)
- [Custom menu | Tiptap Editor Docs](https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus)
- [CharacterCount extension | Tiptap Editor Docs](https://tiptap.dev/docs/editor/extensions/functionality/character-count)
- [Export to JSON and HTML | Tiptap Editor Docs](https://tiptap.dev/docs/guides/output-json-html)
- [Integration performance | Tiptap Editor Docs](https://tiptap.dev/docs/guides/performance)
- [Long texts example | Tiptap Editor Docs](https://tiptap.dev/docs/examples/basics/long-texts)
- [React rendering performance demo | Tiptap Editor Docs](https://tiptap.dev/docs/examples/advanced/react-performance)

### Community Resources
- [GitHub - shoghdev/react-tiptap-editor](https://github.com/shoghdev/react-tiptap-editor)
- [React tiptap custom extension for word count](https://dawid.app/blog/tiptap-word-count-extension)
- [Does TipTap sanitize HTML or do I have to use a dedicated package? · ueberdosis/tiptap · Discussion #2845](https://github.com/ueberdosis/tiptap/discussions/2845)
- [Best Practices for Saving Tiptap JSON vs. HTML in MongoDB/MySQL | by Faisal Mujtaba | Medium](https://medium.com/@faisalmujtaba/best-practices-for-saving-tiptap-json-vs-html-in-mongodb-mysql-a5192bd68abc)

### Release Notes
- [Say hello to Tiptap 2.5, our most performant editor yet – Tiptap Release Notes](https://tiptap.dev/blog/release-notes/say-hello-to-tiptap-2-5-our-most-performant-editor-yet)

---

**Document Version:** 1.0
**Last Updated:** January 30, 2026
**Next Document:** `07-PLAN.md` (Planning Phase)
