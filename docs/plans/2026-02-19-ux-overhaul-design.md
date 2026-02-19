# UX Overhaul: Dashboard, Content & Agents

**Fecha:** 2026-02-19
**Status:** Aprobado
**Enfoque:** Command Center (Dashboard) + Progressive Simplification (Content, Agents)
**Nivel de cambio:** Agresivo — rediseño de layouts completos

---

## Contexto

El frontend AMD tiene 250 componentes, 41 páginas y un design system maduro (score 7.8/10). Las principales áreas de fricción son:

- **Dashboard**: Informativo pero pasivo — métricas sin acciones directas
- **Content**: 7 modales, 16 `useState`, 3 vistas — complejidad excesiva
- **Agents**: Grid de 37 cards con panel de detalle que desaparece en mobile

---

## 1. Dashboard → Command Center

### Antes
SmartGreeting + HeroMetrics (4 cards) + QuickActions + DepartmentKanban + ActivitySummary + TodayBriefing

### Después

**Layout: 2 columnas (70/30)**

#### Columna izquierda — "Action Feed"

**"Necesita tu atención" (siempre arriba)**
- Items accionables con botones inline:
  - Contenido pendiente de aprobación → "Aprobar" / "Pedir cambios"
  - Agentes con errores → "Reintentar" / "Ver logs"
  - Tareas sin completar → "Ir a tarea"
- Cada item muestra: icono tipo, título, tiempo desde creación, acciones

**"Actividad reciente"**
- Timeline cronológico de eventos (contenido publicado, agentes ejecutados, campañas)
- Acciones contextuales al hover en cada item

#### Columna derecha — "Resumen rápido"
- 3 KPIs compactos con sparklines (publicado hoy, agentes activos, tasa éxito)
- Mini-calendario con contenido programado (próximos 7 días)
- Botón "Ejecutar agente rápido" (dropdown con agentes favoritos)

#### Se elimina
- HeroMetrics 4 columnas (redundante con KPIs compactos)
- DepartmentKanban (mejor en /agents)
- TodayBriefing colapsable (reemplazado por "Necesita tu atención")
- SmartGreeting largo (reemplazado por saludo de 1 línea)

---

## 2. Content → Modal Fullscreen + Pipeline

### Antes
3 vistas (Kanban/Calendar/List) + 7 modales dinámicos + 16 `useState` + panel detalle 3 columnas

### Después

**2 vistas**: Lista (default) + Kanban. Se elimina Calendar (existe en /publishing).

**Filtros inline**: tipo, status, fecha — todo visible, sin "advanced filters" ocultos.

**Click en item → Modal fullscreen** (estilo Notion):
- **Sidebar izquierda**:
  - Stepper visual de workflow: `Draft → Review → Approved → Published`
  - Tab Metadata (keywords, tone, audience)
  - Tab SEO (meta title, description, canonical, slug)
  - Tab Versiones (history, diff, rollback inline)
  - Tab Publicar (cross-platform publish)
  - Tab Repurpose (generar variantes)
- **Área principal**: Editor de contenido (título + body markdown)
- Cerrar con "X" o Escape

**Consolidación de modales (7 → 2)**:
- `ContentFullscreen` (nuevo) — unifica EditContentModal, VersionHistory, VersionDiff, RepurposeContentModal, RollbackDialog, CrossPlatformPublishPanel, TemplatePickerModal
- `GenerateContentModal` (se mantiene) — para generar con IA o desde templates

**State consolidado**: `useContentPageState` custom hook que maneja:
- `selectedContent`, `viewMode`, `filters`, `fullscreenOpen`, `activeTab`

---

## 3. Agents → Lista Agrupada + Drawer

### Antes
Grid de AgentCards + department tabs horizontales + panel detalle fijo (`hidden lg:block`)

### Después

**Lista agrupada por departamento** con accordion (secciones colapsables):
- Leadership (1)
- Content (6)
- Social Media (8)
- Demand Gen (7)
- SEO (5)
- Brand & Creative (4)
- Marketing Ops (5)

**Cada fila de agente muestra**:
- Nombre + descripción corta
- Status: dot de color + texto (active, paused, error)
- Último uso (tiempo relativo)
- Tasa de éxito (%)
- Acciones inline: Ejecutar, Pausar/Reanudar

**Click en agente → Drawer lateral** (~40% ancho):
- Configuración del agente
- Historial de ejecuciones recientes
- Logs en tiempo real
- Cadenas activas (handoffs)
- Botón ejecutar con parámetros

#### Se elimina
- Grid de AgentCards
- Department tabs horizontales
- Panel de detalle fijo

---

## 4. Mejoras Transversales

### Loading states
- Skeleton unificado para listas (`ListSkeleton`) y drawers (`DrawerSkeleton`)
- Consistente en todas las páginas

### Transiciones
- Framer Motion para drawer enter/exit (slide-in desde derecha)
- Framer Motion para modal fullscreen enter/exit (fade + scale)
- AnimatePresence para items de lista

### Mobile
- Drawer lateral funciona como slide-over fullscreen en mobile
- Modal fullscreen se adapta naturalmente
- Action Feed del dashboard en single column

---

## Componentes nuevos a crear

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `ActionFeed` | `components/dashboard/` | Feed de items accionables |
| `ActionFeedItem` | `components/dashboard/` | Item individual con acciones inline |
| `QuickSummary` | `components/dashboard/` | Sidebar derecha del dashboard |
| `ContentFullscreen` | `components/content/` | Modal fullscreen para editar contenido |
| `WorkflowStepper` | `components/content/` | Stepper visual del workflow de contenido |
| `AgentList` | `components/agents/` | Lista agrupada por departamento |
| `AgentListItem` | `components/agents/` | Fila de agente con acciones inline |
| `Drawer` | `components/ui/` | Drawer reutilizable (right slide-in) |
| `useContentPageState` | `hooks/` | State consolidado de la página Content |
| `ListSkeleton` | `components/ui/` | Skeleton para listas |
| `DrawerSkeleton` | `components/ui/` | Skeleton para drawers |

## Componentes a eliminar/deprecar

| Componente | Razón |
|-----------|-------|
| `HeroMetric` | Reemplazado por KPIs compactos en QuickSummary |
| `DepartmentKanban` | Movido a /agents como lista agrupada |
| `TodayBriefing` | Reemplazado por ActionFeed |
| `SmartGreeting` | Reemplazado por saludo de 1 línea inline |
| `AgentCard` | Reemplazado por AgentListItem |
| `AgentGrid` | Reemplazado por AgentList |
| `EditContentModal` | Absorbido por ContentFullscreen |
| `RepurposeContentModal` | Absorbido por ContentFullscreen tab |
| `VersionHistory` (modal) | Absorbido por ContentFullscreen tab |
| `VersionDiff` (modal) | Absorbido por ContentFullscreen tab |
| `RollbackDialog` | Inline en ContentFullscreen tab Versiones |
| `CrossPlatformPublishPanel` | Tab en ContentFullscreen |
| `TemplatePickerModal` | Integrado en GenerateContentModal |
