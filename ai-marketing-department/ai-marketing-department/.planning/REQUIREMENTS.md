# Requirements: AMD UX Redesign

**Defined:** 2026-02-15
**Core Value:** Every page has a clear purpose and every action is reachable in 2 clicks or less — agencies can manage multiple brands without getting lost.

## v1 Requirements

### Design Tokens (TOKEN)

- [ ] **TOKEN-01**: All 204+ components use semantic CSS variables instead of hardcoded Tailwind colors
- [ ] **TOKEN-02**: Three-tier token system established (primitive → semantic → component)
- [ ] **TOKEN-03**: Dark mode works consistently across all pages via token swapping
- [ ] **TOKEN-04**: Multi-brand theming supported by overriding semantic token tier
- [ ] **TOKEN-05**: Transition timing tokens defined (--transition-fast/base/slow, --easing-standard/decelerate)

### Navigation (NAV)

- [ ] **NAV-01**: Sidebar reorganized from flat list into 4 logical groups (Overview, Content, Operations, Settings)
- [ ] **NAV-02**: Sidebar collapses to icon-only mode with persisted user preference
- [ ] **NAV-03**: Breadcrumb navigation shows current path (Brand > Page > Subpage)
- [ ] **NAV-04**: Mobile responsive sidebar (hamburger menu < 1024px, bottom nav on mobile)
- [ ] **NAV-05**: Brand context switcher accessible from sidebar header
- [ ] **NAV-06**: Active page highlighted in sidebar with visual indicator

### App Shell (SHELL)

- [ ] **SHELL-01**: Persistent layout shell wraps all dashboard pages (sidebar + header do not re-render on navigation)
- [ ] **SHELL-02**: Nested Next.js layouts preserve state across page transitions
- [ ] **SHELL-03**: Responsive breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- [ ] **SHELL-04**: Page transitions feel smooth (no full-page flash on navigation)

### Command Palette (CMD)

- [ ] **CMD-01**: Cmd+K opens global command palette overlay
- [ ] **CMD-02**: Command palette supports navigation to all pages
- [ ] **CMD-03**: Command palette supports fuzzy search across brands, agents, content
- [ ] **CMD-04**: Command palette supports quick actions (create content, switch brand, run agent)
- [ ] **CMD-05**: Command palette shows keyboard shortcut hints next to actions
- [ ] **CMD-06**: Contextual results adapt based on current page context

### Keyboard (KBD)

- [ ] **KBD-01**: 5-10 core keyboard shortcuts registered (Cmd+K, /, N, ?, Esc)
- [ ] **KBD-02**: Keyboard shortcuts help modal accessible via ? key
- [ ] **KBD-03**: Shortcuts do not fire when user is typing in an input/textarea
- [ ] **KBD-04**: Shortcuts are discoverable via tooltips and command palette hints

### Page Redesign (PAGE)

- [ ] **PAGE-01**: Dashboard home page simplified with clear visual hierarchy (5-second rule)
- [ ] **PAGE-02**: Agents page redesigned with department grouping and status indicators
- [ ] **PAGE-03**: Content page redesigned with improved filters, bulk actions, and workflow clarity
- [ ] **PAGE-04**: Strategy page uses consistent design system (already in progress)
- [ ] **PAGE-05**: Analytics page redesigned with progressive loading and clear data hierarchy
- [ ] **PAGE-06**: Settings page reorganized with logical tab grouping
- [ ] **PAGE-07**: Brand profile page redesigned with clear identity sections
- [ ] **PAGE-08**: All pages have context-specific empty states with CTAs
- [ ] **PAGE-09**: All pages have skeleton loading states (not spinners)
- [ ] **PAGE-10**: All pages follow consistent component patterns (card sizes, spacing, typography)

### Interaction Polish (UX)

- [ ] **UX-01**: Toast notifications for success/error feedback on all user actions
- [ ] **UX-02**: Inline editing for simple text fields (agent names, content titles)
- [ ] **UX-03**: Hover states with contextual actions on table/card rows (edit, delete, duplicate)
- [ ] **UX-04**: Smart defaults pre-fill forms based on navigation context
- [ ] **UX-05**: Micro-interactions at 5-10 strategic points (status changes, navigation, destructive actions)
- [ ] **UX-06**: Live activity indicators showing agent running/idle/error status with animation
- [ ] **UX-07**: Bulk actions toolbar on Content page (multi-select + publish/archive/delete)
- [ ] **UX-08**: Recent items (last 5 brands, agents, content) accessible in command palette
- [ ] **UX-09**: Progressive loading for data-heavy pages (analytics, content lists)

## v2 Requirements

### Advanced Interactions

- **ADV-01**: AI-driven page layouts adapting to user role/usage patterns
- **ADV-02**: Complete keyboard-first workflows (create task, switch brand, navigate pages without mouse)
- **ADV-03**: Undo/redo stack for destructive actions
- **ADV-04**: Custom keyboard shortcut rebinding
- **ADV-05**: Adaptive information density toggle (compact vs comfortable)
- **ADV-06**: Contextual help tooltips with rich examples

### Analytics

- **ANLT-01**: Usage analytics instrumentation for navigation decisions
- **ANLT-02**: Core Web Vitals baseline and monitoring
- **ANLT-03**: Component usage heatmap for optimization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaborative editing | Complex infrastructure, not needed for agency workflow (one user per brand) |
| Drag-and-drop dashboard widgets | Maintenance nightmare, breaks responsive design |
| Custom color themes beyond dark/light | Accessibility issues, design system becomes meaningless |
| Gamification (points/badges) | Childish in B2B context, distracts from work |
| Mobile native app | Web responsive only for this redesign |
| Backend/Convex schema changes | Frontend-only redesign |
| New pages | All existing pages stay, just reorganized |
| Infinite scroll | Breaks back button, memory leaks. Use pagination with keyboard nav |
| AI chat interface for navigation | Slow for power users, not keyboard-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 | Phase 0 | In Progress |
| TOKEN-02 | Phase 0 | Pending |
| TOKEN-03 | Phase 0 | Pending |
| TOKEN-04 | Phase 0 | Pending |
| TOKEN-05 | Phase 0 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| NAV-05 | Phase 1 | Pending |
| NAV-06 | Phase 1 | Pending |
| SHELL-01 | Phase 1 | Pending |
| SHELL-02 | Phase 1 | Pending |
| SHELL-03 | Phase 1 | Pending |
| SHELL-04 | Phase 1 | Pending |
| CMD-01 | Phase 2 | Pending |
| CMD-02 | Phase 2 | Pending |
| CMD-03 | Phase 2 | Pending |
| CMD-04 | Phase 2 | Pending |
| CMD-05 | Phase 2 | Pending |
| CMD-06 | Phase 2 | Pending |
| KBD-01 | Phase 2 | Pending |
| KBD-02 | Phase 2 | Pending |
| KBD-03 | Phase 2 | Pending |
| KBD-04 | Phase 2 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |
| PAGE-05 | Phase 3 | Pending |
| PAGE-06 | Phase 3 | Pending |
| PAGE-07 | Phase 3 | Pending |
| PAGE-08 | Phase 3 | Pending |
| PAGE-09 | Phase 3 | Pending |
| PAGE-10 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 3 | Pending |
| UX-05 | Phase 4 | Pending |
| UX-06 | Phase 4 | Pending |
| UX-07 | Phase 3 | Pending |
| UX-08 | Phase 4 | Pending |
| UX-09 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after initial definition*
