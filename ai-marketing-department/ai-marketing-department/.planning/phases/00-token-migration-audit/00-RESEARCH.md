# Phase 0: Token Migration & Audit - Research

**Researched:** 2026-02-15
**Domain:** Design token architecture, CSS variables, Tailwind v4 theming
**Confidence:** HIGH

## Summary

Phase 0 focuses on migrating 271 React components (233 in `/components`, 38 in `/app`) from hardcoded Tailwind color utilities to a semantic CSS variable system. The codebase currently has 3,810 instances of hardcoded colors (`bg-white`, `text-stone-*`, `border-gray-*`, etc.) across 225 files.

The project already has a partial token system in `globals.css` with ~50 CSS variables and 11 themed strategy page components serving as a reference standard. The existing system demonstrates CSS variable usage but lacks a formal three-tier token architecture and comprehensive documentation.

**Primary recommendation:** Implement a three-tier token system (primitive → semantic → component) using Tailwind v4's native `@theme` directive, which exposes all design tokens as CSS variables automatically. This approach enables instant theme switching, multi-brand support, and eliminates the need for extensive dark mode override rules.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4.0 | Utility-first CSS framework with native CSS variable theming | Industry standard with native `@theme` directive for design tokens |
| CSS Custom Properties | Native | Runtime-accessible design tokens | Browser-native, zero overhead, instant theme switching |
| Next.js | 16 | React framework (already in stack) | Required for SSR/routing, already integrated |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| OKLch color space | Native | Perceptually uniform colors | For defining primitive color tokens (Tailwind v4 default) |
| `color-mix()` | Native CSS | Dynamic color variations | For generating hover states from semantic tokens |
| PostCSS | 8+ | CSS processing (Tailwind dependency) | Automatically included with Tailwind v4 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 `@theme` | Style Dictionary | More tooling overhead, build-time only, better for cross-platform token export |
| CSS Custom Properties | Sass/Less variables | Static preprocessing vs runtime theming, no dark mode switching |
| Manual token management | Design token management tools (Figma Tokens, Tokens Studio) | Better designer handoff but adds complexity for this project's needs |

**Installation:**
```bash
# Tailwind v4 already installed
npm install tailwindcss@next
# No additional dependencies needed - uses native CSS features
```

## Architecture Patterns

### Recommended Three-Tier Token Structure

```
app/
└── globals.css          # Single source of truth for all tokens

Token Hierarchy:
├── Primitive Tokens     # Raw values (--color-orange-600: oklch(...))
├── Semantic Tokens      # Context-aware (--accent: var(--color-orange-600))
└── Component Tokens     # Component-specific (--button-bg: var(--accent))
```

### Pattern 1: Three-Tier Token Architecture

**What:** Layered token system where component tokens reference semantic tokens, which reference primitive tokens.

**When to use:** For any design system requiring theming, dark mode, or multi-brand support.

**Example:**
```css
/* Source: https://feature-sliced.design/blog/design-tokens-architecture */
@theme {
  /* ── PRIMITIVE (Tier 1): Context-agnostic raw values ── */
  --color-orange-50: oklch(0.97 0.02 40);
  --color-orange-600: oklch(0.66 0.19 35);
  --color-stone-100: oklch(0.95 0.00 106);
  --color-stone-900: oklch(0.26 0.01 106);

  /* ── SEMANTIC (Tier 2): Meaningful aliases for UI concepts ── */
  --accent: var(--color-orange-600);
  --accent-hover: var(--color-orange-700);
  --surface-0: var(--color-stone-50);
  --text-primary: var(--color-stone-900);
  --border: var(--color-stone-200);

  /* ── COMPONENT (Tier 3): Component-specific overrides ── */
  --button-bg: var(--accent);
  --button-text: white;
  --card-bg: var(--surface-0);
  --card-border: var(--border);
}
```

**Benefits:**
1. Change primitive token → affects all semantic → affects all components
2. Theme switching only rewrites semantic tier
3. Component tokens provide override flexibility without breaking semantic contracts

### Pattern 2: Tailwind v4 @theme Directive

**What:** CSS-first configuration that automatically generates utility classes and exposes design tokens as CSS variables.

**When to use:** For all Tailwind v4 projects requiring design token management.

**Example:**
```css
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
@import "tailwindcss";

@theme {
  /* Colors automatically generate bg-*, text-*, border-* utilities */
  --color-brand-primary: oklch(0.66 0.19 35);
  --color-brand-secondary: oklch(0.53 0.12 118);

  /* Spacing multiplier (--spacing * N for any N) */
  --spacing: 0.25rem;

  /* Custom breakpoints */
  --breakpoint-3xl: 1920px;

  /* Typography */
  --font-display: "Playfair Display", serif;
  --text-hero: 3rem;

  /* Timing (for animations) */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
}

/* Dark mode: override semantic tokens */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-brand-primary: oklch(0.76 0.15 45);
    --surface-0: oklch(0.15 0.01 106);
    --text-primary: oklch(0.95 0.00 106);
  }
}
```

**Key advantages:**
- All tokens available as CSS variables (e.g., `var(--color-brand-primary)`)
- Utility classes auto-generated (e.g., `bg-brand-primary`)
- Single source of truth
- Runtime access for animations and JavaScript

### Pattern 3: Dark Mode via Token Swapping

**What:** Dark mode implemented by redefining semantic tokens under `.dark` class or `@media (prefers-color-scheme: dark)`.

**When to use:** For consistent dark mode across all components without per-component overrides.

**Example:**
```css
/* Source: https://design.dev/guides/dark-mode-css/ */
@theme {
  /* Light mode (default) */
  --surface-0: oklch(0.98 0.00 106);
  --surface-1: oklch(0.95 0.00 106);
  --text-primary: oklch(0.20 0.01 106);
  --accent: oklch(0.66 0.19 35);
}

.dark {
  /* Dark mode: only redefine semantic tokens */
  --surface-0: oklch(0.15 0.01 106);
  --surface-1: oklch(0.20 0.01 106);
  --text-primary: oklch(0.95 0.00 106);
  --accent: oklch(0.76 0.15 45);
}

/* Components use semantic tokens */
.card {
  background: var(--surface-0);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
```

**Benefits:**
- Zero component changes for dark mode
- Instant theme switching (CSS variables are live)
- No dark mode override rules needed

### Pattern 4: Transition Timing Tokens

**What:** Standardized duration and easing tokens for consistent motion design.

**When to use:** For all UI animations and transitions.

**Example:**
```css
/* Source: https://www.ruixen.com/blog/motion-design-tokens */
@theme {
  /* Duration tokens: semantic naming */
  --transition-instant: 100ms;
  --transition-fast: 200ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;

  /* Easing tokens */
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Usage in components */
.button {
  transition: background-color var(--transition-fast) var(--easing-standard);
}

.modal {
  transition:
    opacity var(--transition-base) var(--easing-decelerate),
    transform var(--transition-base) var(--easing-decelerate);
}
```

**Guidelines:**
- Keep routine UI at 160-240ms
- Entrance/exit at 240-360ms
- Never exceed 500ms
- Respect `prefers-reduced-motion`

### Anti-Patterns to Avoid

- **Hardcoded colors in components:** `bg-white` instead of `bg-[var(--surface-0)]` breaks theming
- **Numeric token names:** `--duration-200` instead of `--transition-fast` lacks semantic meaning
- **Deep nesting of var():** `var(--a, var(--b, var(--c)))` creates fallback chains that are hard to debug
- **Component-specific primitives:** Defining `--button-orange-600` violates token hierarchy
- **Theme-specific component logic:** `{theme === 'dark' ? 'bg-black' : 'bg-white'}` duplicates theming logic

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode overrides | 100+ `.dark .bg-white { background: #000 }` rules | Semantic token swapping | Current globals.css has 140+ override rules; token swapping eliminates this entirely |
| Color variations | Manually calculating hover states | `color-mix()` or Tailwind opacity modifiers | Native CSS function, perceptually accurate |
| Token documentation | Custom docs site | JSDoc comments + Storybook | Already in stack, zero additional tooling |
| Multi-brand theming | Separate stylesheets per brand | CSS variable scoping with brand classes | Dynamic switching, smaller bundle size |

**Key insight:** CSS variables + Tailwind v4's `@theme` provide native token management without build tools or custom generators. The existing 140+ dark mode override rules in `globals.css` signal a token architecture gap.

## Common Pitfalls

### Pitfall 1: Incomplete Token Migration

**What goes wrong:** Mixing hardcoded Tailwind utilities (`bg-white`) with CSS variables (`bg-[var(--surface-0)]`) creates inconsistent theming where some elements don't respond to theme changes.

**Why it happens:** Developers add new components or features without checking token standards, especially when copying code from examples or other projects.

**How to avoid:**
1. Audit all components before starting (use grep for `bg-white|text-stone-*|border-gray-*`)
2. Create component-by-component migration checklist
3. Lint rule to catch hardcoded colors (ESLint plugin)
4. Document token usage in component style guide

**Warning signs:**
- Dark mode toggle shows white cards on dark backgrounds
- Some text remains light in dark mode
- Hover states don't match theme colors

### Pitfall 2: Token Hierarchy Violations

**What goes wrong:** Component tokens directly reference primitive tokens (`--button-bg: var(--color-orange-600)`) instead of semantic tokens, making brand changes require editing every component.

**Why it happens:** Developers don't understand the three-tier architecture or skip semantic layer for "simplicity."

**How to avoid:**
1. Document token hierarchy in globals.css with clear comments
2. Create token naming conventions (primitives: `--color-*`, semantic: `--accent`, component: `--button-*`)
3. Code review checklist item: "Does this token reference the correct tier?"

**Warning signs:**
- Changing brand color requires editing 50+ component tokens
- Same primitive referenced in 20+ places
- Token names don't indicate their tier (`--orange-500` vs `--color-orange-500`)

### Pitfall 3: Missing Transition Tokens

**What goes wrong:** Inconsistent animation timings across the app (some buttons animate at 100ms, others at 500ms) creating jarring UX.

**Why it happens:** Developers hardcode duration values or copy-paste different timings from examples.

**How to avoid:**
1. Define transition tokens in @theme before starting component migration
2. Document motion guidelines (fast/base/slow) with examples
3. Grep for hardcoded `transition:` and `duration-` after migration

**Warning signs:**
- Some interactions feel snappy, others sluggish
- Animations don't respect `prefers-reduced-motion`
- Transition durations vary wildly (50ms to 800ms)

### Pitfall 4: Over-Abstracting Tokens

**What goes wrong:** Creating too many token tiers or overly specific tokens (`--button-primary-hover-shadow-left`) that are used once, bloating the token system.

**Why it happens:** Attempting to tokenize every single CSS value instead of identifying reusable patterns.

**How to avoid:**
1. Start with semantic tokens only, add component tokens when pattern emerges 3+ times
2. Review token usage before adding new ones (is this truly reusable?)
3. Limit component tokens to 10-15 per component type

**Warning signs:**
- Token file exceeds 500 lines
- Tokens used only once
- Developers unsure which token to use

### Pitfall 5: Forgetting CSS Variable Scoping

**What goes wrong:** Defining tokens inside nested selectors instead of `:root` or `@theme`, causing tokens to be undefined in other contexts.

**Why it happens:** Confusion between CSS variable scoping and CSS cascade.

**How to avoid:**
1. All tokens defined in `@theme` block (automatically scoped to `:root`)
2. Theme overrides use `.dark` or `[data-theme="brand"]` selectors at root level
3. Never define tokens inside component selectors

**Warning signs:**
- Tokens work in some components but not others
- `var(--token)` shows as invalid in DevTools
- Theme switching affects some but not all elements

## Code Examples

Verified patterns from official sources:

### Audit Current State
```bash
# Count total component files
find components app -name "*.tsx" -type f | wc -l
# Output: 271 files

# Find all hardcoded colors
grep -r "bg-white\|text-stone-\|border-gray-" components app --include="*.tsx" | wc -l
# Output: 3,810 instances

# List files with most violations
grep -r "bg-white\|text-stone-\|border-gray-" components app --include="*.tsx" -c | sort -t: -k2 -rn | head -20
```

### Migration Pattern (Before → After)
```tsx
// BEFORE: Hardcoded Tailwind utilities
export function Card({ children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm hover:shadow-md">
      <h3 className="text-stone-900 font-semibold">{children}</h3>
      <p className="text-stone-600 text-sm">Description</p>
    </div>
  );
}

// AFTER: CSS variable tokens
export function Card({ children }) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-[var(--transition-fast)]">
      <h3 className="text-[var(--text-primary)] font-semibold">{children}</h3>
      <p className="text-[var(--text-secondary)] text-sm">Description</p>
    </div>
  );
}
```

### Define Three-Tier Token System
```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* ═══════════════════════════════════════════════════════════
     TIER 1: PRIMITIVE TOKENS (Context-agnostic raw values)
     ═══════════════════════════════════════════════════════════ */

  /* Colors: OKLch color space for perceptual uniformity */
  --color-white: #ffffff;
  --color-black: #000000;

  /* Stone (neutral) scale */
  --color-stone-50: oklch(0.985 0.001 106);
  --color-stone-100: oklch(0.968 0.001 106);
  --color-stone-200: oklch(0.933 0.002 106);
  --color-stone-900: oklch(0.260 0.010 106);

  /* Orange (brand) scale */
  --color-orange-50: oklch(0.970 0.020 40);
  --color-orange-600: oklch(0.663 0.193 35);
  --color-orange-700: oklch(0.573 0.183 35);

  /* Semantic colors */
  --color-green-500: oklch(0.645 0.154 145);
  --color-red-500: oklch(0.628 0.225 27);
  --color-amber-500: oklch(0.759 0.150 75);

  /* ═══════════════════════════════════════════════════════════
     TIER 2: SEMANTIC TOKENS (Meaningful UI concepts)
     ═══════════════════════════════════════════════════════════ */

  /* Surface system (4-tier depth) */
  --surface-0: var(--color-stone-50);    /* Base background */
  --surface-1: var(--color-stone-100);   /* Elevated cards */
  --surface-2: var(--color-stone-200);   /* Hover states */
  --surface-3: var(--color-stone-300);   /* Pressed states */

  /* Text hierarchy */
  --text-primary: var(--color-stone-900);
  --text-secondary: var(--color-stone-600);
  --text-tertiary: var(--color-stone-500);

  /* Accent colors */
  --accent: var(--color-orange-600);
  --accent-hover: var(--color-orange-700);
  --accent-muted: oklch(from var(--accent) l c h / 0.1);

  /* Semantic states */
  --success: var(--color-green-500);
  --warning: var(--color-amber-500);
  --error: var(--color-red-500);

  /* Borders */
  --border: var(--color-stone-200);
  --border-hover: var(--color-stone-300);

  /* ═══════════════════════════════════════════════════════════
     TIER 3: COMPONENT TOKENS (Component-specific overrides)
     ═══════════════════════════════════════════════════════════ */

  /* Card component */
  --card-bg: var(--color-white);
  --card-border: var(--border);
  --card-hover: var(--surface-2);

  /* Button component */
  --button-primary-bg: var(--accent);
  --button-primary-hover: var(--accent-hover);
  --button-secondary-bg: var(--surface-2);

  /* Input component */
  --input-bg: var(--color-white);
  --input-border: var(--border);
  --input-focus: var(--accent);

  /* ═══════════════════════════════════════════════════════════
     MOTION TOKENS (Transition timing)
     ═══════════════════════════════════════════════════════════ */

  /* Duration (semantic naming) */
  --transition-instant: 100ms;
  --transition-fast: 200ms;
  --transition-base: 300ms;
  --transition-slow: 500ms;

  /* Easing functions */
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
}

/* ═══════════════════════════════════════════════════════════
   DARK MODE: Override semantic tokens only
   ═══════════════════════════════════════════════════════════ */
.dark {
  /* Tier 2: Semantic tokens (primitives stay the same) */
  --surface-0: oklch(0.150 0.010 106);
  --surface-1: oklch(0.200 0.010 106);
  --surface-2: oklch(0.250 0.010 106);
  --surface-3: oklch(0.300 0.010 106);

  --text-primary: oklch(0.980 0.001 106);
  --text-secondary: oklch(0.700 0.002 106);
  --text-tertiary: oklch(0.600 0.002 106);

  --accent: oklch(0.760 0.150 45);
  --accent-hover: oklch(0.680 0.170 40);

  --border: oklch(0.250 0.010 106);
  --border-hover: oklch(0.300 0.010 106);

  /* Tier 3: Component tokens (inherit from semantic) */
  --card-bg: var(--surface-1);
  --input-bg: var(--surface-1);
}
```

### Multi-Brand Theme Support
```css
/* Source: https://medium.com/@dimiganin/preparing-for-the-design-tokens-era-multi-brand-systems */
/* Base theme (default brand) */
@theme {
  --brand-primary: var(--color-orange-600);
  --brand-secondary: var(--color-stone-900);
}

/* Brand override: Only change primitive → semantic mappings */
[data-theme="brand-blue"] {
  --brand-primary: oklch(0.550 0.190 250);  /* Blue instead of orange */
  --accent: var(--brand-primary);           /* Semantic token follows */
}

[data-theme="brand-purple"] {
  --brand-primary: oklch(0.600 0.210 300);  /* Purple */
  --accent: var(--brand-primary);
}

/* All components automatically adapt - no component changes needed */
```

### Respect Reduced Motion
```css
/* Source: https://www.ruixen.com/blog/motion-design-tokens */
@media (prefers-reduced-motion: reduce) {
  @theme {
    --transition-instant: 0ms;
    --transition-fast: 0ms;
    --transition-base: 0ms;
    --transition-slow: 0ms;
  }

  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.js` | Tailwind v4 `@theme` directive in CSS | Dec 2024 (v4.0 release) | Single source of truth, CSS variables auto-exposed, faster rebuilds (3.5x full, 8x incremental) |
| Manual dark mode overrides (140+ rules) | Semantic token swapping | Industry standard 2024+ | Zero override rules needed, instant theme switching |
| Sass/Less variables | CSS Custom Properties | Browser native since 2016 | Runtime theming, JavaScript access, dynamic values |
| RGB/HSL color space | OKLch color space | Tailwind v4 default (2024) | Perceptually uniform, better interpolation, wider gamut |
| Hardcoded transition timings | Motion design tokens | Design system trend 2024-2025 | Consistent UX, respects accessibility preferences |

**Deprecated/outdated:**
- **Tailwind v3 JavaScript config:** v4 recommends `@theme` in CSS (backwards compatible but not optimal)
- **Component-level dark mode logic:** `{theme === 'dark' ? ... : ...}` replaced by CSS variable theming
- **`@apply` for component styles:** Still works but Tailwind team recommends CSS variables for design tokens
- **Separate CSS files per theme:** CSS variable scoping eliminates need for multiple stylesheets

## Open Questions

1. **Should we use Tailwind's arbitrary value syntax `bg-[var(--surface-0)]` or custom utility classes `bg-surface-0`?**
   - What we know: Arbitrary values work but verbose; custom utilities require plugin configuration
   - What's unclear: Performance implications of 1000+ arbitrary value classes
   - Recommendation: Use arbitrary values initially (zero config), consider custom utilities if performance issues arise

2. **How to handle component-specific tokens that aren't truly reusable?**
   - What we know: Over-abstracting creates token bloat; under-abstracting misses reuse opportunities
   - What's unclear: Which components need dedicated tokens vs inline styles
   - Recommendation: Add component tokens when pattern emerges 3+ times, document in token file

3. **Should transition tokens include `transition-property` or just duration/easing?**
   - What we know: Most transitions use `all` or specific properties (`color`, `opacity`, `transform`)
   - What's unclear: Whether to create tokens like `--transition-color: color 200ms ease` or separate duration/easing
   - Recommendation: Separate duration/easing tokens for flexibility, document common property combinations

4. **How to audit component migrations to ensure 100% coverage?**
   - What we know: Grep finds hardcoded colors; visual testing required for verification
   - What's unclear: Automated way to verify all components respond to theme changes
   - Recommendation: Combination of grep, dark mode toggle testing, and component-by-component checklist

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) - @theme directive, CSS-first configuration
- [Tailwind CSS Theme Variables Documentation](https://tailwindcss.com/docs/theme) - Official v4 theme variables guide
- [Context7: Tailwind CSS V3](https://v3.tailwindcss.com/docs/adding-custom-styles) - Design token configuration patterns
- [Feature-Sliced Design: Design Tokens Architecture](https://feature-sliced.design/blog/design-tokens-architecture) - Three-tier token system
- [design.dev: Dark Mode CSS Guide](https://design.dev/guides/dark-mode-css/) - Semantic token approach to dark mode

### Secondary (MEDIUM confidence)
- [Contentful: Design Token System](https://www.contentful.com/blog/design-token-system/) - Token types and hierarchy
- [Rangle: Developing Your Token Structure](https://rangle.io/blog/developing-your-token-structure) - Token organization patterns
- [Ruixen: Motion Design Tokens](https://www.ruixen.com/blog/motion-design-tokens) - Transition timing token standards
- [Penpot: Design Tokens and CSS Variables Guide](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/) - Practical implementation
- [Medium: Multi-Brand Theming with Design Tokens](https://medium.com/@dimiganin/preparing-for-the-design-tokens-era-multi-brand-systems) - Multi-brand architecture

### Tertiary (LOW confidence)
- [DevToolbox: CSS Variables Complete Guide](https://devtoolbox.dedyn.io/blog/css-variables-complete-guide) - CSS custom properties best practices
- [Always Twisted: Style Dictionary Multi-Brand](https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9) - Alternative tooling approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tailwind v4 native features, official documentation, zero additional dependencies
- Architecture: HIGH - Three-tier pattern industry standard, verified in production systems, multiple authoritative sources
- Pitfalls: MEDIUM - Based on common issues documented in community resources and official guidance, but project-specific challenges may arise

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable domain, but Tailwind v4 still evolving with alpha releases)

**Codebase current state:**
- 271 TSX files (233 components, 38 app pages)
- 3,810 hardcoded color instances across 225 files
- 11 strategy page components already migrated (reference standard)
- Existing globals.css has ~50 CSS variables + 140 dark mode override rules
- Tech stack: Next.js 16, React 19, Tailwind 4, Convex, Clerk, shadcn/ui
