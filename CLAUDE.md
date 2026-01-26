# AI Marketing Department

## Resumen del Proyecto
Sistema de **37 Agentes de IA** para automatizar un departamento de marketing completo.
- **Autor:** AIAIAI Consulting
- **Principio:** IA ejecuta, humanos definen estrategia

---

## Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Backend/DB | **Convex** | Estado real-time, funciones serverless, cron jobs |
| Orquestación | **n8n** | Workflows, triggers, coordinación entre agentes |
| LLM | **Claude API** | Razonamiento, generación de contenido |
| Comunicación | WhatsApp Business API | Canal de interacción |

---

## Estructura del Proyecto

```
d:\AMD\
├── convex/              # Backend Convex
│   ├── schema.ts        # Modelo de datos
│   ├── functions.ts     # Queries y mutations
│   ├── actions.ts       # Actions (llamadas externas)
│   ├── seed.ts          # Datos iniciales de agentes
│   └── crons.ts         # Tareas programadas
├── n8n-workflows/       # Workflows de n8n
│   ├── agents/          # Workflows por agente
│   └── orchestration/   # Task dispatcher, handoffs
├── docs/
│   └── BLUEPRINT.md     # Documentación completa
└── ai-marketing-department/
```

---

## Los 6 Departamentos (37 Agentes)

| Departamento | Agentes | Líder |
|--------------|---------|-------|
| Content | 5 | Content Director |
| Social Media & Community | 7 | Social Media Manager |
| Demand Gen & Paid Media | 6 | Demand Gen Director |
| SEO | 4 | SEO Manager |
| Brand & Creative | 3 | Brand Director |
| Marketing Ops | 4 | Marketing Ops Director |
| Leadership | 1 | CMO Agent |

---

## Modelo de Datos (Convex)

Entidades principales:
- `agents` - Definición de cada agente (id, department, config, triggers)
- `tasks` - Tareas asignadas (status: pending/running/completed/failed)
- `executions` - Log de ejecuciones (tokens, costo, duración)
- `handoffs` - Transferencias entre agentes
- `content` - Contenido generado (blog, social, email, ad, landing)

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia Convex en modo desarrollo

# Despliegue
npm run deploy       # Despliega a Convex

# Seed de datos
npm run seed         # Carga los 37 agentes iniciales

# Verificación
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

---

## Frontend Dashboard

**Ubicación:** `ai-marketing-department/ai-marketing-department/`

**Stack:**
- Next.js 16.1.4 (App Router)
- React 19.2.3
- Tailwind CSS 4 (dark mode)
- Convex React Client
- Framer Motion + Lucide Icons

**Comandos Frontend:**
```bash
cd ai-marketing-department/ai-marketing-department
npm install        # Instalar dependencias
npm run dev        # Inicia en localhost:3000
npm run build      # Build de producción
npm run start      # Servidor de producción
```

---

## Páginas de la Aplicación

| Página | Ruta | Para qué sirve |
|--------|------|----------------|
| **Dashboard** | `/` | Vista general: agentes activos, tareas completadas, métricas globales |
| **Agents** | `/agents` | Gestionar los 37 agentes, filtrar por departamento/estado, ver configuración |
| **Campaigns** | `/campaigns` | Crear y monitorear campañas multicanal, ver presupuesto y métricas |
| **Content** | `/content` | Ver contenido generado por agentes, aprobar, programar, publicar |
| **Analytics** | `/analytics` | Métricas de rendimiento, tokens usados, costos, top agentes |
| **Settings** | `/settings` | Configurar API keys, notificaciones, modelo default, temperatura |

---

## Cómo Usar la App

### 1. Iniciar el Sistema
```bash
# Terminal 1: Backend Convex
npm run dev

# Terminal 2: Frontend
cd ai-marketing-department/ai-marketing-department
npm run dev
```
Abrir http://localhost:3000

### 2. Gestionar Agentes (`/agents`)
- Ver lista de 37 agentes organizados por departamento
- Filtrar por: Content, Social, Demand Gen, SEO, Brand, Ops
- Cambiar estado: Active, Paused, Error, Maintenance
- Ver configuración: modelo, temperatura, tokens, triggers

### 3. Ejecutar Agentes
Los agentes se ejecutan mediante:
- **Manual:** Crear tarea desde el dashboard
- **Cron Jobs:** Automático según configuración
- **Webhooks:** Llamadas externas (n8n)

### 4. Ver Contenido Generado (`/content`)
- Filtrar por tipo: Blog, LinkedIn, Twitter, Email, etc.
- Estados: Draft → Review → Approved → Published
- Aprobar y programar publicación

### 5. Monitorear (`/analytics`)
- Ejecuciones totales y tasa de éxito
- Tokens consumidos y costo estimado
- Top agentes por rendimiento

---

## APIs de Convex

**Queries (Lectura):**
- `listAgents(filters)` - Listar agentes
- `listTasks(filters)` - Ver tareas
- `listContent(filters)` - Ver contenido
- `getDashboardStats()` - Estadísticas globales
- `getAnalyticsOverview()` - Métricas detalladas

**Mutations (Escritura):**
- `createTask(agentId, type, input)` - Crear tarea
- `updateAgentStatus(id, status)` - Cambiar estado
- `updateContentStatus(id, status)` - Aprobar/publicar

**Actions (Ejecución):**
- `executeAgent(agentId, taskType, input)` - Ejecutar agente
- `callClaude(prompt, config)` - Llamada directa a Claude
- `runScheduledAgents(trigger)` - Ejecutar por trigger

---

## Cron Jobs Automáticos

| Frecuencia | Hora (UTC) | Trigger | Agentes |
|------------|------------|---------|---------|
| Cada hora | :00 | `cron:hourly` | Budget Pacing, Social Scheduling |
| Diario | 6:00 AM | `cron:daily` | Paid Media, Engagement Analyst, Keyword Tracker |
| Semanal | Lunes 7:00 AM | `cron:weekly` | SEO Strategist, Backlink Analyst, List Hygiene |

---

## Variables de Entorno

Archivo `.env.local` (copiar de `.env.example`):

**Requeridas:**
- `CONVEX_DEPLOYMENT` - Nombre del deployment
- `NEXT_PUBLIC_CONVEX_URL` - URL de Convex
- `ANTHROPIC_API_KEY` - API key de Claude
- `N8N_WEBHOOK_BASE_URL` - URL de instancia n8n

**Opcionales:** Meta Ads, Google Ads, LinkedIn Ads, Sendgrid, etc.

---

## Convenciones de Código

- **Idioma:** Español en comentarios y documentación
- **TypeScript:** Strict mode habilitado
- **IDs de agentes:** Formato `{department}-{numero}` (ej: `content-001`)
- **Estados de tareas:** pending → running → completed/failed

---

## Flujo de Trabajo Típico

```
SEO identifica keyword → Content Manager asigna → Writer redacta
→ Publisher publica → Social repurposea → Demand Gen promociona
→ Ops nurture → Analyst trackea → Insights alimentan próximo ciclo
```

---

## Notas Importantes

- Los archivos sensibles (.env.local) están en .gitignore
- Convex maneja la sincronización en tiempo real automáticamente
- Cada agente tiene su propio systemPrompt configurable
- Los handoffs entre agentes se registran para trazabilidad
