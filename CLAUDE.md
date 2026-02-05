# AI Marketing Department (AMD)

## Resumen del Proyecto
Sistema de **37 Agentes de IA** organizados en **6 departamentos** para automatizar completamente un departamento de marketing.

- **Autor:** AIAIAI Consulting
- **Principio:** IA ejecuta, humanos definen estrategia
- **Ubicación:** `/home/tomas/Escritorio/amd/`

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO / CLIENTE                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Next.js 16)                       │
│         http://localhost:3000 │ Puerto: 3000                    │
│   ┌─────────┬─────────┬─────────┬─────────┬─────────┐          │
│   │Dashboard│ Agents  │Campaigns│ Content │Analytics│          │
│   └─────────┴─────────┴─────────┴─────────┴─────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONVEX (Backend)                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Queries │ Mutations │ Actions │ Cron Jobs            │      │
│  └──────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ agents │ tasks │ executions │ content │ handoffs     │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────┐       ┌───────────────────────────────┐
│    CLAUDE API         │       │         n8n                   │
│    (LLM Engine)       │       │    (Orquestación)             │
│  claude-sonnet-4      │       │  Webhooks, Workflows          │
└───────────────────────┘       └───────────────────────────────┘
```

---

## Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Backend/DB | **Convex** | Estado real-time, funciones serverless, cron jobs |
| Orquestación | **n8n** | Workflows, triggers, coordinación entre agentes |
| LLM | **Claude API** | Razonamiento, generación de contenido |
| Frontend | **Next.js 16** | Dashboard de gestión |
| UI | **React 19 + Tailwind 4** | Componentes + estilos |

---

## Estructura del Proyecto

```
./
├── convex/                   # Backend Convex
│   ├── schema.ts             # Modelo de datos (11 tablas)
│   ├── functions.ts          # Queries y mutations
│   ├── actions.ts            # Actions (llamadas a Claude API)
│   ├── seed.ts               # 37 agentes pre-configurados
│   └── crons.ts              # Tareas programadas
├── n8n-workflows/            # Workflows de n8n
│   ├── agents/               # Workflows por agente
│   └── orchestration/        # Task dispatcher, handoffs
├── ai-marketing-department/
│   └── ai-marketing-department/  # Frontend Next.js
│       ├── app/              # Pages (App Router)
│       ├── components/       # Componentes React
│       └── lib/              # Utilidades
├── docs/
│   └── BLUEPRINT.md          # Documentación técnica completa
├── .env.example              # Variables de entorno (template)
└── package.json              # Dependencias del backend
```

---

## Guía de Configuración Inicial (Desde Cero)

### Paso 1: Instalar Dependencias del Backend

```bash
cd /home/tomas/Escritorio/amd
npm install
```

### Paso 2: Configurar Convex

```bash
# 2.1 Crear cuenta en Convex (si no tienes)
# Ir a https://dashboard.convex.dev y registrarse

# 2.2 Login en Convex
npx convex login

# 2.3 Inicializar proyecto (esto crea el deployment y .env.local)
npx convex dev
# NOTA: Mantén este terminal abierto, Convex sincroniza en tiempo real
```

### Paso 3: Configurar API de Claude

```bash
# 3.1 Obtener API key en https://console.anthropic.com

# 3.2 Agregar al archivo .env.local (creado por Convex)
echo "ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui" >> .env.local
```

### Paso 4: Instalar Frontend

```bash
# En otro terminal
cd /home/tomas/Escritorio/amd/ai-marketing-department/ai-marketing-department
npm install
```

### Paso 5: Cargar los 37 Agentes

```bash
# Desde la raíz del proyecto (con Convex dev corriendo)
cd /home/tomas/Escritorio/amd
npx convex run seed:seedAgents
```

### Paso 6: Levantar el Sistema Completo

```bash
# Terminal 1: Backend Convex (si no está corriendo)
cd /home/tomas/Escritorio/amd
npx convex dev

# Terminal 2: Frontend Next.js
cd /home/tomas/Escritorio/amd/ai-marketing-department/ai-marketing-department
npm run dev
```

**Abrir:** http://localhost:3000

### Paso 7: Verificar Instalación

1. Ir a `/agents` - Deben aparecer 37 agentes
2. Ir a `/analytics` - Verificar métricas
3. Crear tarea de prueba desde el dashboard

---

## Los 37 Agentes por Departamento

### LEADERSHIP (1 agente)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `cmo-001` | CMO Agent | Chief Marketing Officer - Coordina estrategia global y supervisa todos los departamentos | `manual`, `webhook` |

### CONTENT (6 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `content-director` | Content Director | Dirige el departamento de contenido y gestiona la producción editorial | `manual`, `webhook`, `on:task_completed` |
| `content-001` | Long-Form Content Manager | Gestiona la producción de artículos, guías y posts SEO | `webhook`, `on:handoff` |
| `content-002` | Blog Content Writer | Escribe artículos optimizados para tráfico orgánico | `webhook`, `on:handoff` |
| `content-003` | Whitepaper Author | Investiga y escribe guías técnicas profundas | `webhook`, `on:handoff` |
| `content-004` | Case Study Writer | Crea historias de éxito de clientes | `webhook`, `on:handoff` |
| `content-005` | Content Publisher | Formatea, optimiza y publica en CMS | `webhook`, `on:handoff` |

### SOCIAL MEDIA (8 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `social-manager` | Social Media Manager | Gestiona la presencia en redes sociales y comunidad | `manual`, `webhook`, `cron:daily` |
| `social-001` | LinkedIn Content Creator | Crea contenido profesional optimizado para viralidad en LinkedIn | `webhook`, `cron:daily`, `on:handoff` |
| `social-002` | Twitter/X Content Creator | Threads y actualizaciones de thought leadership | `webhook`, `cron:daily`, `on:handoff` |
| `social-003` | YouTube Scriptwriter | Scripts para contenido educativo long-form | `webhook`, `cron:daily`, `on:handoff` |
| `social-004` | Short-Form Video Creator | Produce contenido vertical para TikTok, Reels, Shorts | `webhook`, `cron:daily`, `on:handoff` |
| `social-005` | Podcast Producer | Coordina booking, grabación y producción de podcast | `webhook`, `cron:daily`, `on:handoff` |
| `social-006` | Social Engagement Analyst | Trackea métricas de engagement y sentimiento | `webhook`, `cron:daily`, `on:handoff` |
| `social-007` | Social Scheduling Coordinator | Optimiza horarios y gestiona cola de publicación | `webhook`, `cron:daily`, `on:handoff` |

### DEMAND GEN (7 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `demandgen-director` | Demand Gen Director | Dirige estrategia de generación de demanda y paid media | `manual`, `webhook`, `cron:daily` |
| `demandgen-001` | Paid Media Manager | Optimiza gasto publicitario en search y social | `webhook`, `cron:daily`, `cron:hourly` |
| `demandgen-002` | Meta Ads Specialist | Gestiona campañas de Facebook e Instagram | `webhook`, `cron:daily`, `cron:hourly` |
| `demandgen-003` | Google Ads Specialist | Maximiza captura de tráfico high-intent en Google | `webhook`, `cron:daily`, `cron:hourly` |
| `demandgen-004` | LinkedIn Ads Specialist | Targeting de decision-makers B2B | `webhook`, `cron:daily`, `cron:hourly` |
| `demandgen-005` | Ad Performance Analyst | Agrega datos para calcular ROAS y eficiencia | `webhook`, `cron:daily`, `cron:hourly` |
| `demandgen-006` | Budget Pacing Analyst | Monitorea gasto diario para compliance | `webhook`, `cron:daily`, `cron:hourly` |

### SEO (5 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `seo-manager` | SEO Manager | Dirige estrategia SEO y optimización orgánica | `manual`, `webhook`, `cron:weekly` |
| `seo-001` | SEO Content Strategist | Identifica oportunidades de keywords y crea briefs | `webhook`, `cron:daily`, `cron:weekly` |
| `seo-002` | Backlink Analyst | Monitorea calidad de links y construye autoridad | `webhook`, `cron:daily`, `cron:weekly` |
| `seo-003` | Technical SEO Specialist | Audita salud del sitio y core web vitals | `webhook`, `cron:daily`, `cron:weekly` |
| `seo-004` | Keyword Rank Tracker | Trackea posiciones diarias y movimiento de competidores | `webhook`, `cron:daily`, `cron:weekly` |

### BRAND & CREATIVE (4 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `brand-director` | Brand Director | Dirige identidad de marca y dirección creativa | `manual`, `webhook` |
| `brand-001` | Ad Creative Designer | Diseña visuales de alta conversión para ads | `webhook`, `on:handoff` |
| `brand-002` | Landing Page Builder | Diseña páginas de conversión de alto rendimiento | `webhook`, `on:handoff` |
| `brand-003` | Asset Librarian | Etiqueta y organiza assets digitales | `webhook`, `on:handoff` |

### MARKETING OPS (5 agentes)

| agentId | Nombre | Descripción | Triggers |
|---------|--------|-------------|----------|
| `ops-director` | Marketing Ops Director | Dirige operaciones de marketing y automatización | `manual`, `webhook`, `cron:daily` |
| `ops-001` | Email Operations Manager | Supervisa infraestructura y deliverability de email | `webhook`, `cron:daily`, `cron:weekly` |
| `ops-002` | Newsletter Writer | Cura y escribe newsletters de nurturing semanales | `webhook`, `cron:daily`, `cron:weekly` |
| `ops-003` | Nurture Campaign Specialist | Construye flujos automatizados a través del funnel | `webhook`, `cron:daily`, `cron:weekly` |
| `ops-004` | List Hygiene Specialist | Limpia listas de email para proteger reputación | `webhook`, `cron:daily`, `cron:weekly` |

---

## Flujo de Handoffs (Transferencias entre Agentes)

Los handoffs permiten que los agentes deleguen tareas entre sí de forma coordinada.

### Tipos de Handoffs

```
┌─────────────────────────────────────────────────────────────────┐
│  TIPO          │ CONDICIÓN       │ DESCRIPCIÓN                 │
├─────────────────────────────────────────────────────────────────┤
│  always        │ Siempre         │ Transfiere al completar     │
│  if_condition  │ Condicional     │ Transfiere si se cumple X   │
│  on_error      │ En error        │ Escala al director/CMO      │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Trabajo Típico

```
SEO Strategist                 Content Director              Blog Writer
    │                               │                            │
    │  1. Identifica keyword        │                            │
    │  ─────────────────────────►   │                            │
    │                               │  2. Asigna brief           │
    │                               │  ──────────────────────►   │
    │                               │                            │
    │                               │  3. Entrega borrador       │
    │                               │  ◄──────────────────────   │
    │                               │                            │
    │  4. Revisa SEO                │                            │
    │  ◄─────────────────────────   │                            │
    │                               │                            │
    │  5. Aprueba                   │                            │
    │  ─────────────────────────►   │                            │
    │                               │                            │
                                    ▼
                            Content Publisher
                                    │
                                    │  6. Publica
                                    ▼
                            Social Media Manager
                                    │
                                    │  7. Repurposea
                                    ▼
                            LinkedIn Creator + Twitter Creator
```

### Ejemplo de Handoff en Código

```typescript
// Un agente completa y transfiere al siguiente
await ctx.runMutation(internal.functions.createHandoff, {
  fromAgentId: "seo-001",
  toAgentId: "content-002",
  taskId: task._id,
  reason: "Keyword brief listo para redacción",
  condition: "always",
});
```

---

## Cron Jobs Automáticos

| Frecuencia | Hora (UTC) | Trigger | Agentes Activados |
|------------|------------|---------|-------------------|
| Cada hora | :00 | `cron:hourly` | Budget Pacing, Ad Performance |
| Diario | 6:00 AM | `cron:daily` | Paid Media, Engagement, Rank Tracker |
| Semanal | Lunes 7:00 | `cron:weekly` | SEO Strategist, Backlink, List Hygiene |

---

## Páginas del Dashboard

| Ruta | Página | Funcionalidad |
|------|--------|---------------|
| `/` | Dashboard | Vista general: agentes activos, tareas, métricas |
| `/agents` | Agents | Gestionar 37 agentes, filtrar por departamento/estado |
| `/campaigns` | Campaigns | Crear y monitorear campañas multicanal |
| `/content` | Content | Crear, editar, aprobar y publicar contenido multicanal |
| `/analytics` | Analytics | Métricas de rendimiento, tokens, costos |
| `/settings` | Settings | API keys, configuración, modelo default |
| `/org` | Org Chart | Visualización del organigrama de agentes |

---

## APIs de Convex

### Queries (Lectura)
- `listAgents(filters)` - Listar agentes con filtros
- `listTasks(filters)` - Ver tareas
- `listContent(filters)` - Ver contenido generado
- `getDashboardStats()` - Estadísticas globales
- `getAnalyticsOverview()` - Métricas detalladas

### Mutations (Escritura)
- `createTask(agentId, type, input)` - Crear tarea
- `updateAgentStatus(id, status)` - Cambiar estado de agente
- `createContent(type, title, body, summary?, metadata, seo, createdBy)` - Crear contenido manualmente
- `updateContent(id, title?, body?, summary?, seo?, metadata?)` - Editar contenido generado
- `updateContentStatus(id, status)` - Cambiar estado (draft → review → approved → published)

### Actions (Ejecución Externa)
- `executeAgent(agentId, taskType, input)` - Ejecutar agente con Claude
- `callClaude(prompt, config)` - Llamada directa a Claude API
- `runScheduledAgents(trigger)` - Ejecutar agentes por trigger

---

## Workflow de Gestión de Contenido

El sistema de contenido soporta un flujo completo de **crear → editar → aprobar → publicar**.

### Componentes UI

| Componente | Ubicación | Función |
|-----------|-----------|---------|
| `UploadContentForm` | Header `/content` | Formulario inline para crear contenido manualmente |
| `EditContentModal` | Modal `/content` | Editor full-screen con campos SEO y metadata |
| `StatusActions` | Panel derecho | Botones contextuales para workflow de aprobación |

### Estados de Contenido

```
draft → review → revision_needed → approved → scheduled → published → archived
  ↓        ↓            ↓              ↓          ↓           ↓
 [1]      [2]          [2]           [3]        [4]         [5]
```

**[1]** Usuario crea contenido manualmente con `UploadContentForm`
**[2]** Se envía a revisión, puede solicitar cambios o aprobar
**[3]** Una vez aprobado, puede programarse o publicar inmediatamente
**[4]** Opción de programar publicación para fecha futura
**[5]** Una vez publicado, puede archivarse

### Tipos de Contenido Soportados

- `blog` - Artículos y posts
- `social_linkedin` - Contenido profesional
- `social_twitter` - Tweets y threads
- `social_instagram` - Posts visuales
- `social_tiktok` - Videos cortos
- `email` - Campañas de email
- `newsletter` - Newsletters semanales
- `ad_copy` - Copy para publicidad
- `landing_page` - Páginas de conversión
- `whitepaper` - Guías técnicas
- `case_study` - Historias de éxito
- `video_script` - Scripts para videos

### Campos Editables

**Básicos:**
- Title (requerido)
- Body (requerido, mín 50 chars)
- Summary (opcional)

**SEO (accordion):**
- Meta Title (55-60 chars recomendado)
- Meta Description (150-160 chars recomendado)
- Canonical URL (opcional)
- Slug (url-friendly)

**Metadata (accordion):**
- Target Keywords (comma-separated)
- Tone (professional, casual, friendly, technical)
- Target Audience (descripción de público)

### Ejemplo de Uso

```typescript
// 1. Crear contenido
const contentId = await createContent({
  type: "blog",
  title: "AI Marketing Trends 2024",
  body: "Long form content here...",
  metadata: { wordCount: 1200, readingTime: 6 },
  createdBy: "user-id",
});

// 2. Editar contenido
await updateContent({
  id: contentId,
  title: "Updated: AI Marketing Trends 2024",
  body: "Updated content with more details...",
});

// 3. Enviar a revisión
await updateContentStatus({
  id: contentId,
  status: "review",
});

// 4. Aprobar
await updateContentStatus({
  id: contentId,
  status: "approved",
  approvedBy: "manager-id",
});

// 5. Publicar
await updateContentStatus({
  id: contentId,
  status: "published",
  publishedUrl: "https://blog.example.com/article-slug",
});
```

---

## Variables de Entorno

Archivo `.env.local` (copiar de `.env.example`):

### Requeridas
```env
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Opcionales (para integraciones)
```env
N8N_WEBHOOK_BASE_URL=https://your-n8n.com
META_ACCESS_TOKEN=...
GOOGLE_ADS_CLIENT_ID=...
LINKEDIN_ACCESS_TOKEN=...
SENDGRID_API_KEY=...
```

---

## Troubleshooting

### Error: "Convex deployment not found"
```bash
# Verificar login
npx convex login

# Re-inicializar proyecto
npx convex dev
```

### Error: "ANTHROPIC_API_KEY not set"
```bash
# Verificar que .env.local existe y tiene la key
cat .env.local | grep ANTHROPIC

# Si no está, agregar
echo "ANTHROPIC_API_KEY=sk-ant-tu-key" >> .env.local
```

### Error: "Cannot connect to Convex"
```bash
# Verificar que Convex dev está corriendo
npx convex dev

# Verificar URL en .env.local
cat .env.local | grep CONVEX_URL
```

### Agentes no aparecen en `/agents`
```bash
# Ejecutar seed manualmente
npx convex run seed:seedAgents

# Verificar en Convex Dashboard que la tabla agents tiene datos
```

### Frontend no carga
```bash
# Verificar dependencias
cd ai-marketing-department/ai-marketing-department
npm install

# Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Error de TypeScript en Convex
```bash
# Regenerar tipos
npx convex codegen
```

---

## Comandos Útiles

```bash
# Backend Convex
npm run dev              # Modo desarrollo (watch)
npx convex deploy        # Deploy a producción
npx convex run seed:seedAgents  # Cargar agentes

# Frontend
cd ai-marketing-department/ai-marketing-department
npm run dev              # Desarrollo (localhost:3000)
npm run build            # Build producción
npm run lint             # Verificar código

# Verificación
npx convex logs          # Ver logs del backend
npx convex dashboard     # Abrir dashboard de Convex
```

---

## Convenciones de Código

- **Idioma:** Español en comentarios y documentación
- **TypeScript:** Strict mode habilitado
- **IDs de agentes:** Formato `{department}-{numero}` (ej: `content-001`)
- **Estados de tareas:** `pending` → `running` → `completed` / `failed`
- **Estados de agentes:** `active`, `paused`, `error`, `maintenance`

---

## Notas Importantes

- Los archivos sensibles (`.env.local`) están en `.gitignore`
- Convex maneja la sincronización en tiempo real automáticamente
- Cada agente tiene su propio `systemPrompt` configurable
- Los handoffs se registran para trazabilidad completa
- El modelo default es `claude-sonnet-4-20250514` con temperatura `0.7`

---

## Historial de Cambios (v2.1 - Enero 2026)

### ✨ Nueva Funcionalidad: Content Management System

#### **Implementado (29 de Enero)**

**Backend - Nuevas Mutations:**
- `createContent(type, title, body, metadata, seo, createdBy)` - Crear contenido manualmente
- `updateContent(id, title?, body?, summary?, seo?, metadata?)` - Editar todos los campos
- `updateContentStatus(id, status)` - Workflow de aprobación (draft → review → approved → published)

**Frontend - Nuevos Componentes:**
1. **`UploadContentForm.tsx`** (components/content/)
   - Formulario inline colapsable
   - Validación client-side (title: min 5, body: min 50)
   - Auto-cálculo de wordCount y readingTime
   - Integración con createContent mutation

2. **`EditContentModal.tsx`** (components/content/)
   - Modal full-screen con editor
   - Secciones acordeón: Básico, SEO, Metadata
   - Indicadores de caracteres (55-60 / 150-160)
   - Integración con updateContent mutation

3. **`StatusActions` Component** (inline en content/page.tsx)
   - Botones contextuales según estado
   - Transiciones de workflow: Draft → Review → Approved → Published
   - Loading states y error handling

**Integración:**
- ✅ `/content` página completamente funcional
- ✅ Botón "Add Content" en header
- ✅ Botón "Edit" en tarjetas (hover)
- ✅ Panel de workflow en detalles (derecha)
- ✅ Convex reactivity (auto-updates sin refresh)

**Documentación:**
- ✅ `CLAUDE.md` actualizado con APIs nuevas
- ✅ Tipos de contenido (12 tipos soportados)
- ✅ Ejemplos de uso en TypeScript

---

### 🐛 Bug Fixes & Mejoras

#### **LineChart Component - Corrección de Type Safety (29 de Enero)**

**Problema:**
- `LineChartComponent` requería `lines` array obligatorio
- Results page pasaba props incompatibles (`dataKey`, `name`)
- Error en runtime: "Cannot read properties of undefined (reading 'map')"

**Solución:**
- Hicimos `lines` prop opcional con backwards compatibility
- Agregamos lógica para construir `lines` desde `dataKey` + `name`
- Agregamos validación de datos vacíos
- Agregamos prop `showTooltip` para controlar tooltip

**Cambios en `components/charts/LineChart.tsx`:**
```typescript
// Antes: lines requerido
lines: { dataKey: string; ... }[]

// Ahora: opcional + backwards compatible
lines?: { dataKey: string; ... }[]
dataKey?: string      // para single line charts
name?: string         // nombre de la línea
showTooltip?: boolean // mostrar tooltip
```

**Impacto:**
- ✅ LineChart ahora soporta ambos modos de uso
- ✅ Type safety mejorada
- ✅ Compatibilidad con código existente
- ✅ Error en results page resuelto

---

### 📊 Estado Actual

| Componente | Status | Últimas Actualizaciones |
|-----------|--------|------------------------|
| **Content Management** | ✅ MVP Completo | Create, Edit, Publish Workflow |
| **LineChart** | ✅ Corregido | Type safety & backwards compatibility |
| **Dashboard** | ✅ Funcional | 5 páginas + Analytics |
| **Convex Backend** | ✅ Activo | Real-time sync, 37 agentes |
| **TypeScript** | ✅ Strict | No errors en producción |

---

### 🚀 Stack Actual (Jan 2026)

- **Backend:** Convex (serverless, real-time)
- **Frontend:** Next.js 16 (Turbopack), React 19
- **UI:** Tailwind 4, Lucide Icons, Framer Motion
- **LLM:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Orquestación:** n8n workflows + Manual API
- **Database:** Convex managed (11 tablas)

---

### 📝 Próximas Iteraciones

**Corto plazo (Semana 1):**
- [ ] Rich text editor (TipTap)
- [ ] File upload (PDF, DOCX)
- [ ] Scheduling UI (date picker)

**Medio plazo (Semana 2-3):**
- [ ] Version history
- [ ] Comments/feedback en content
- [ ] Multi-platform formatting

**Largo plazo (Mes 2):**
- [ ] Templates para contenido
- [ ] Bulk operations
- [ ] Analytics integration
- [ ] Collaborative editing
