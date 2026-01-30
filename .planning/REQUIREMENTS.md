# Requirements: AMD UX Simplification

**Defined:** 2026-01-30
**Core Value:** Non-technical users can manage complete marketing department in minutes

## v1 Requirements

### Phase 1-4: Foundation (Completed ✓)

- ✓ **NAV-01**: Sidebar navigation reduced to 4 main items (Inicio, Contenido, Resultados, Configuración)
- ✓ **NAV-02**: All navigation labels in Spanish, with descriptive tooltips
- ✓ **ONBOARD-01**: Onboarding flow reduced from 6 to 3 steps
- ✓ **ONBOARD-02**: Setup time reduced to <2 minutes with auto-configured departments
- ✓ **FEEDS-01**: Feed templates system with 10 industry bundles available
- ✓ **FEEDS-02**: 1-click feed setup from pre-configured templates
- ✓ **LANG-01**: 100% Spanish translation of all UI labels
- ✓ **HOME-01**: Home page displays personalized greeting
- ✓ **HOME-02**: Home page shows 3 metric cards (more spacious than before)
- ✓ **HOME-03**: Feed Health Summary widget visible on home page
- ✓ **RESULT-01**: Results page shows 3 KPIs (Views, Clicks, Engagement)
- ✓ **RESULT-02**: Results page includes 7-day trend chart
- ✓ **RESULT-03**: Top 5 performing content visible on results page
- ✓ **HEALTH-01**: Feed health report page (/feeds/health) shows detailed metrics

### Phase 5: Design Polish (Pending)

- [ ] **DESIGN-01**: Increase global spacing (gaps 32px → 48px)
- [ ] **DESIGN-02**: Larger typography throughout (headers, body text)
- [ ] **DESIGN-03**: Padding increased on cards (16px → 24px)
- [ ] **DESIGN-04**: Buttons more prominent with gradients
- [ ] **DESIGN-05**: Progressive disclosure (filters, advanced options collapsed by default)
- [ ] **MOBILE-01**: Responsive design for mobile screens (375px width)
- [ ] **MOBILE-02**: Touch targets minimum 44x44px (WCAG standard)
- [ ] **MOBILE-03**: Bottom navigation bar visible on mobile (tab-style)
- [ ] **MOBILE-04**: Single-column card layout on mobile
- [ ] **MOBILE-05**: Readable fonts on small screens (min 16px for body)

### Phase 6: Product Tour (Pending)

- [ ] **TOUR-01**: Interactive 7-step product tour for new users
- [ ] **TOUR-02**: Tour shows key features with contextual tooltips
- [ ] **TOUR-03**: Users can skip tour and return later
- [ ] **TOUR-04**: Tour only displays for first-time users
- [ ] **TOUR-05**: Tour accessible from help/onboarding section

## v2 Requirements (Future)

### Internationalization & Localization

- **I18N-01**: Multi-language support (English, Portuguese, French)
- **I18N-02**: Dynamic language switching in settings
- **I18N-03**: Date/time formatting per locale

### Advanced Features

- **ADV-01**: Dark mode toggle
- **ADV-02**: Keyboard shortcuts reference
- **ADV-03**: Accessibility audit (WCAG AA compliance)
- **ADV-04**: Performance optimization (Lighthouse score >90)

### Analytics & Monitoring

- **ANALYT-01**: User behavior tracking (non-invasive)
- **ANALYT-02**: Crash reporting and error logging
- **ANALYT-03**: Feature usage analytics

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time collaboration | High complexity, not core to simplicity value |
| Advanced data export | Feature creep; basic export sufficient |
| Custom theme builder | Violates simplicity principle |
| Plugin/extension system | Out of scope for v1 |
| A/B testing framework | Not needed for MVP |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | 1 | Complete |
| NAV-02 | 1 | Complete |
| ONBOARD-01 | 3 | Complete |
| ONBOARD-02 | 3 | Complete |
| FEEDS-01 | 2 | Complete |
| FEEDS-02 | 2 | Complete |
| LANG-01 | 4 | Complete |
| HOME-01 | 1 | Complete |
| HOME-02 | 1 | Complete |
| HOME-03 | 1 | Complete |
| RESULT-01 | 1 | Complete |
| RESULT-02 | 1 | Complete |
| RESULT-03 | 1 | Complete |
| HEALTH-01 | 1 | Complete |
| DESIGN-01 | 5 | Pending |
| DESIGN-02 | 5 | Pending |
| DESIGN-03 | 5 | Pending |
| DESIGN-04 | 5 | Pending |
| DESIGN-05 | 5 | Pending |
| MOBILE-01 | 5 | Pending |
| MOBILE-02 | 5 | Pending |
| MOBILE-03 | 5 | Pending |
| MOBILE-04 | 5 | Pending |
| MOBILE-05 | 5 | Pending |
| TOUR-01 | 6 | Pending |
| TOUR-02 | 6 | Pending |
| TOUR-03 | 6 | Pending |
| TOUR-04 | 6 | Pending |
| TOUR-05 | 6 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29 ✓
- Unmapped: 0 ✓

---

*Requirements defined: 2026-01-30*
