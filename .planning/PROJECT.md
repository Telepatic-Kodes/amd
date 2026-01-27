# AI Marketing Department (AMD) - RSS Feed Integration

## What This Is

Sistema de integración de RSS feeds para AMD que permite a los 37 agentes de IA acceder a contenido externo actualizado (noticias de industria, blogs de competidores, fuentes técnicas) para mejorar la calidad y relevancia del contenido que generan.

## Core Value

Los agentes de contenido tienen acceso a información fresca y relevante del mercado para crear contenido más actual y competitivo.

## Requirements

### Validated

<!-- Capacidades existentes del sistema AMD -->

- ✓ 37 agentes de IA organizados en 6 departamentos — existing
- ✓ Dashboard de gestión en Next.js 16 — existing
- ✓ Backend Convex con 11 tablas — existing
- ✓ Integración con Claude API para ejecución de agentes — existing
- ✓ Sistema de handoffs entre agentes — existing
- ✓ Cron jobs para ejecución programada — existing

### Active

<!-- Scope del nuevo feature: RSS Feed Integration -->

- [ ] Usuario puede agregar feeds RSS manualmente desde el dashboard
- [ ] Sistema sugiere feeds automáticamente basado en keywords/temas
- [ ] Feeds se sincronizan diariamente via cron job
- [ ] Contenido de feeds se almacena en nueva tabla `feedItems` en Convex
- [ ] Agentes pueden consultar items de feeds relevantes durante ejecución
- [ ] Dashboard muestra feeds configurados y estado de sincronización
- [ ] Agentes de Content usan feeds como inspiración para contenido original
- [ ] Agentes de Social usan feeds para curación de tendencias
- [ ] Agentes de SEO usan feeds para monitoreo de mercado/competencia

### Out of Scope

- Bypass de paywalls — ilegal y viola ToS
- Scraping de sitios sin RSS — complejidad y legalidad
- Análisis de sentimiento en tiempo real — demasiado complejo para v1
- Integración con APIs de pago (NewsAPI, etc.) — puede agregarse después

## Context

**Codebase existente:**
- Stack: Next.js 16 + Convex + Claude API + Tailwind CSS 4
- Frontend funcional en localhost:3000 con páginas: Dashboard, Agents, Campaigns, Content, Analytics, Settings, Org
- Backend Convex con schema definido, queries, mutations, actions
- 37 agentes ya definidos en seed.ts con system prompts configurados
- Ver `.planning/codebase/` para documentación completa del estado actual

**Motivación:**
Los agentes actualmente generan contenido sin acceso a información externa actualizada. Integrar RSS feeds les dará contexto del mercado para crear contenido más relevante y oportuno.

**Usuarios afectados:**
- Agentes de Content (content-001 a content-005) — inspiración para blogs y whitepapers
- Agentes de Social (social-001 a social-007) — curación para posts
- Agentes de SEO (seo-001 a seo-004) — análisis de tendencias
- Todos los demás agentes — acceso opcional según necesidad

## Constraints

- **Stack**: Mantener Next.js 16 + Convex — consistencia con codebase existente
- **Parsing RSS**: Usar biblioteca estándar (rss-parser o similar) — no reinventar
- **Almacenamiento**: Convex table con índices apropiados — rendimiento de queries
- **Rate limiting**: Respetar robots.txt y límites de feeds — no abuse

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sync diario en vez de real-time | Balance entre frescura y costo de API/computo | — Pending |
| Almacenar en Convex vs solo memoria | Permite histórico, búsqueda, y no re-fetch | — Pending |
| Sugerencias automáticas de feeds | Reduce fricción de setup para usuarios | — Pending |

---
*Last updated: 2026-01-27 after initialization*
