# Requirements: AMD RSS Feed Integration

**Defined:** 2026-01-27
**Core Value:** Los agentes de contenido tienen acceso a información fresca y relevante del mercado para crear contenido más actual y competitivo.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Feed Management (FEED)

- [ ] **FEED-01**: Usuario puede agregar feed RSS manualmente desde dashboard
- [ ] **FEED-02**: Sistema valida feed antes de agregarlo (parsea correctamente)
- [ ] **FEED-03**: Usuario puede pausar/activar feeds individuales
- [ ] **FEED-04**: Usuario puede eliminar feeds
- [ ] **FEED-05**: Usuario puede ver lista de feeds con estado de sync
- [ ] **FEED-06**: Sistema soporta RSS 2.0, Atom, y RSS 1.0 (RDF)

### Sync Engine (SYNC)

- [ ] **SYNC-01**: Sistema sincroniza feeds diariamente via cron job
- [ ] **SYNC-02**: Sistema usa composite key para deduplicación (no confía en GUID solo)
- [ ] **SYNC-03**: Sistema maneja XML malformado sin crashear (lenient parsing)
- [ ] **SYNC-04**: Sistema implementa fan-out (un action por feed) para evitar timeouts
- [ ] **SYNC-05**: Sistema respeta HTTP 429 con exponential backoff
- [ ] **SYNC-06**: Sistema trackea health de cada feed (last sync, error count)
- [ ] **SYNC-07**: Sistema normaliza contenido a schema consistente

### Storage (STOR)

- [ ] **STOR-01**: Feed items se almacenan en tabla `feedItems` en Convex
- [ ] **STOR-02**: Feeds se almacenan en tabla `feeds` en Convex
- [ ] **STOR-03**: Sync logs se almacenan en tabla `feedSyncLog`
- [ ] **STOR-04**: Items incluyen: title, link, content, publishedAt, contentHash
- [ ] **STOR-05**: Sistema previene duplicados via contentHash index

### Agent Integration (AGNT)

- [ ] **AGNT-01**: Agentes pueden consultar feed items relevantes durante ejecución
- [ ] **AGNT-02**: Feed items se inyectan en contexto del agente (systemPrompt)
- [ ] **AGNT-03**: Agentes pueden filtrar por keywords/temas
- [ ] **AGNT-04**: Sistema trackea qué items usó cada agente
- [ ] **AGNT-05**: Agentes de Content usan feeds como inspiración
- [ ] **AGNT-06**: Agentes de Social usan feeds para curación
- [ ] **AGNT-07**: Agentes de SEO usan feeds para monitoreo de mercado

### Dashboard UI (DASH)

- [ ] **DASH-01**: Dashboard muestra feeds configurados
- [ ] **DASH-02**: Dashboard muestra estado de sincronización por feed
- [ ] **DASH-03**: Dashboard muestra últimos items sincronizados
- [ ] **DASH-04**: Dashboard permite trigger manual de sync

### AI Enrichment (ENRCH)

- [ ] **ENRCH-01**: Sistema categoriza items automáticamente (topic extraction)
- [ ] **ENRCH-02**: Sistema genera resumen de items (reduce tokens)
- [ ] **ENRCH-03**: Sistema detecta sentimiento (positive/neutral/negative)
- [ ] **ENRCH-04**: Enrichment corre en background (no bloquea sync)

### Monitoring (MNTR)

- [ ] **MNTR-01**: Sistema alerta sobre menciones de marca (keywords prioritarios)
- [ ] **MNTR-02**: Sistema detecta tendencias across feeds
- [ ] **MNTR-03**: Sistema asigna trust score a feeds según calidad

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Full-text extraction para feeds truncados (web scraping)
- **ADV-02**: Deduplicación semántica (embeddings para near-duplicates)
- **ADV-03**: HTTP conditional GET (ETag/Last-Modified caching)
- **ADV-04**: OPML import para bulk onboarding de feeds
- **ADV-05**: OPML export para backup/portabilidad
- **ADV-06**: Sugerencia automática de feeds por keywords

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bypass de paywalls | Ilegal, viola ToS |
| Scraping de sitios sin RSS | Complejidad legal y técnica |
| Análisis de sentimiento real-time | Batch diario es suficiente |
| Integración con APIs de pago (NewsAPI) | Puede agregarse después |
| Reader UI para humanos | Los agentes son los consumidores |
| Podcast/video handling | Pipeline separado, diferente media type |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FEED-01 | Phase 2 | Pending |
| FEED-02 | Phase 1 | Pending |
| FEED-03 | Phase 2 | Pending |
| FEED-04 | Phase 2 | Pending |
| FEED-05 | Phase 2 | Pending |
| FEED-06 | Phase 1 | Pending |
| SYNC-01 | Phase 2 | Pending |
| SYNC-02 | Phase 1 | Pending |
| SYNC-03 | Phase 1 | Pending |
| SYNC-04 | Phase 2 | Pending |
| SYNC-05 | Phase 2 | Pending |
| SYNC-06 | Phase 1 | Pending |
| SYNC-07 | Phase 1 | Pending |
| STOR-01 | Phase 1 | Pending |
| STOR-02 | Phase 1 | Pending |
| STOR-03 | Phase 1 | Pending |
| STOR-04 | Phase 1 | Pending |
| STOR-05 | Phase 1 | Pending |
| AGNT-01 | Phase 3 | Pending |
| AGNT-02 | Phase 3 | Pending |
| AGNT-03 | Phase 3 | Pending |
| AGNT-04 | Phase 3 | Pending |
| AGNT-05 | Phase 3 | Pending |
| AGNT-06 | Phase 3 | Pending |
| AGNT-07 | Phase 3 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| ENRCH-01 | Phase 4 | Pending |
| ENRCH-02 | Phase 4 | Pending |
| ENRCH-03 | Phase 4 | Pending |
| ENRCH-04 | Phase 4 | Pending |
| MNTR-01 | Phase 5 | Pending |
| MNTR-02 | Phase 5 | Pending |
| MNTR-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after research synthesis*
