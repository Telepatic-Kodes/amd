# Requirements: AMD v2.0 UX/UI Excellence

**Defined:** 2026-02-05
**Core Value:** Non-technical users can manage a complete marketing department in minutes, not hours.

## v2.0 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### Control Center

- [ ] **CC-01**: Dashboard muestra estado real-time de los 37 agentes (activo/idle/error)
- [ ] **CC-02**: Activity feed con timeline de acciones de cada agente (qué hizo, cuándo, resultado)
- [ ] **CC-03**: Métricas operativas (tokens usados, tareas completadas, tasa de éxito)
- [ ] **CC-04**: Sistema de alertas inteligentes (errores, agentes caídos, límites alcanzados)
- [ ] **CC-05**: Vista por departamento (filtrar agentes por sus 6 departamentos)

### Content Pipeline

- [ ] **CP-01**: Vista visual tipo Kanban del pipeline (Draft → Review → Approved → Published)
- [ ] **CP-02**: Drag & drop para mover contenido entre estados
- [ ] **CP-03**: Acciones de workflow (enviar a review, aprobar, rechazar, publicar)
- [ ] **CP-04**: Scheduling de publicación (programar fecha/hora)
- [ ] **CP-05**: Vista de contenido programado (calendario o lista temporal)

### LinkedIn Integration

- [ ] **LI-01**: Flujo OAuth 2.0 para conectar cuenta LinkedIn (server-side, seguro)
- [ ] **LI-02**: Publicar contenido aprobado directamente a LinkedIn desde la app
- [ ] **LI-03**: Preview del post antes de publicar (cómo se verá en LinkedIn)
- [ ] **LI-04**: Estado de conexión visible (conectado/desconectado/token expirado)
- [ ] **LI-05**: Rate limit handling (respetar límites de LinkedIn API)

### Guided UX

- [ ] **GX-01**: Wizard de onboarding para usuarios nuevos (3-5 pasos guiados)
- [ ] **GX-02**: "Siguiente acción recomendada" en dashboard principal
- [ ] **GX-03**: Tooltips contextuales en toda la app (explicaciones inline)
- [ ] **GX-04**: Wizard adaptativo (ofrece "modo rápido" después de 3 completaciones)
- [ ] **GX-05**: Progreso visible del setup inicial (barra de completamiento)

### UX General

- [ ] **UX-01**: Todas las interfaces en español 100%
- [ ] **UX-02**: Mobile responsive para todas las nuevas features
- [ ] **UX-03**: Toast notifications (Sonner) para feedback de acciones
- [ ] **UX-04**: Loading states y skeleton screens en todas las vistas

## Future Requirements (v3.0+)

Deferred to future milestones. Tracked but not in current roadmap.

### Multi-Platform Publishing

- **MP-01**: Publicar a Twitter/X desde la app
- **MP-02**: Publicar a Instagram desde la app
- **MP-03**: Multi-platform preview (ver cómo se ve en cada red)
- **MP-04**: Cross-platform scheduling (una publicación, múltiples redes)

### Advanced Analytics

- **AA-01**: Métricas de LinkedIn posts (engagement, reach, clicks)
- **AA-02**: A/B testing de contenido
- **AA-03**: Reportes automatizados de rendimiento

### Collaboration

- **CO-01**: Comentarios en contenido (feedback de equipo)
- **CO-02**: Roles y permisos (editor, reviewer, publisher)
- **CO-03**: Version history de contenido

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode / theming | No resuelve el problema de UX clarity |
| Full social media integrations | Solo LinkedIn como PoC en v2.0; expandir en v3.0 |
| Multilingual (i18n framework) | Spanish-only por ahora; i18n deferred to v3.0 |
| Agent customization UI | Backend concern, no frontend |
| Real-time chat/messaging | Complexity vs value too high |
| Video upload/publishing | LinkedIn video API tiene restricciones adicionales |
| Collaborative editing | Requires conflict resolution; defer to v3.0 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CC-01 | Phase 9 | Pending |
| CC-02 | Phase 9 | Pending |
| CC-03 | Phase 9 | Pending |
| CC-04 | Phase 9 | Pending |
| CC-05 | Phase 9 | Pending |
| CP-01 | Phase 10 | Pending |
| CP-02 | Phase 10 | Pending |
| CP-03 | Phase 10 | Pending |
| CP-04 | Phase 10 | Pending |
| CP-05 | Phase 10 | Pending |
| LI-01 | Phase 11 | Pending |
| LI-02 | Phase 11 | Pending |
| LI-03 | Phase 11 | Pending |
| LI-04 | Phase 11 | Pending |
| LI-05 | Phase 11 | Pending |
| GX-01 | Phase 12 | Pending |
| GX-02 | Phase 12 | Pending |
| GX-03 | Phase 12 | Pending |
| GX-04 | Phase 12 | Pending |
| GX-05 | Phase 12 | Pending |
| UX-01 | Phases 9, 10, 11, 12 | Pending |
| UX-02 | Phases 9, 10, 11, 12 | Pending |
| UX-03 | Phases 9, 10, 11, 12 | Pending |
| UX-04 | Phases 9, 10, 11, 12 | Pending |

**Coverage:**
- v2.0 requirements: 24 total
- Mapped to phases: 24/24 (100% coverage ✓)
- Unmapped: 0

**Cross-Cutting Requirements Note:**
UX-01 through UX-04 (Spanish UI, mobile responsive, toast notifications, loading states) are mapped to ALL phases (9, 10, 11, 12) because they are cross-cutting concerns that apply to every feature, not isolated to one phase.

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-05 after roadmap creation*
