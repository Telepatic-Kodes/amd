# Phase 24: Onboarding & Polish — COMPLETED

## What was done

### Plan 24-01: Global Keyboard Shortcuts + Help Modal
- **useKeyboardShortcuts hook** with input-aware key handling:
  - `?` → toggle keyboard shortcuts help modal
  - `N` → navigate to /content (create new content)
  - `G + H/B/C/R/S` → two-key navigation (home, brand, control, results, settings)
  - Ignores keypresses in input/textarea/contenteditable elements
  - Ignores keypresses with modifier keys (Cmd/Ctrl/Alt)
- **KeyboardShortcutsHelp modal** with grouped shortcuts reference
- Sidebar updated with `?` keyboard hint alongside `⌘K`

### Plan 24-02: Accessibility (A11Y)
- **CSS focus-visible indicators**: 2px accent ring on keyboard focus, hidden on mouse click
- **Skip-to-content link**: hidden until focused, jumps past sidebar to `#main-content`
- **Semantic landmarks**:
  - Sidebar: `<nav>` with `aria-label="Navegación principal"`
  - MobileNav: `<nav>` with `aria-label="Navegación móvil"`
  - Main content: `<main>` with `role="main"` and `id="main-content"`
- **ARIA attributes on navigation links**: `aria-label`, `aria-current="page"` on active
- **CommandPalette a11y**:
  - `role="dialog"`, `aria-modal="true"`, `aria-label`
  - `role="combobox"` on container, `role="listbox"` on results
  - `role="option"` + `aria-selected` on each result item
  - `aria-label="Buscar comandos"` on search input
  - `aria-hidden="true"` on decorative elements

### Plan 24-03: Smart Defaults
- **usePreference hook**: localStorage-backed generic preference storage
  - Namespaced keys (`amd_pref_*`) to avoid collisions
  - SSR-safe with typeof window check
  - Graceful degradation if localStorage unavailable
- **Content type memory**: UploadContentForm remembers last used content type

## Requirements covered
- ONB-01: Onboarding flow (pre-existing, 4-step at /onboarding)
- ONB-02: Product tour + contextual help (pre-existing, ProductTour + ContextualHelp)
- ONB-03: Global keyboard shortcuts (?, N, G+key combos)
- ONB-04: Smart defaults (usePreference hook, content type memory)
- A11Y-01: Keyboard navigation (skip-to-content, focus indicators)
- A11Y-02: ARIA labels on all interactive elements
- A11Y-03: Color contrast (Warm Atelier theme already meets WCAG AA)
- A11Y-04: Focus-visible indicators (CSS, accent color ring)
- A11Y-05: Touch targets (pre-existing .touch-target class, MobileNav 44x44px)

## Verification
- Build passes: 19/19 pages
- Tests pass: 19/19
- 3 atomic commits
