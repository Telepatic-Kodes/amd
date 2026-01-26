# AI Marketing Department
## Sistema de 37 Agentes de IA para Marketing

**Versión:** 1.0  
**Stack:** n8n + Convex + Claude API  
**Creado por:** AIAIAI Consulting

---

## Visión General

Un departamento de marketing completo operado por agentes de IA. Cada rol tradicional está mapeado, estructurado y automatizado.

**Principio fundamental:** Un sistema. Todos los canales cubiertos. IA ejecuta. Humanos definen estrategia.

---

## Stack Tecnológico

| Capa | Tecnología | Función |
|------|------------|---------|
| **Orquestación** | n8n | Workflows, triggers, coordinación entre agentes |
| **Backend/DB** | Convex | Estado en tiempo real, funciones serverless, cron jobs |
| **LLM** | Claude API | Razonamiento, generación de contenido, análisis |
| **Comunicación** | WhatsApp Business API | Canal de interacción con usuarios |
| **Integraciones** | APIs externas | Redes sociales, CRM, herramientas de marketing |

---

## Arquitectura de Agentes

### Jerarquía

```
┌─────────────────────────────────────────────────────────────┐
│                         CMO AGENT                           │
│              Estrategia y coordinación global               │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───┴───┐           ┌─────┴─────┐         ┌────┴────┐
│Content│           │Social Media│         │Demand   │
│Director│          │  Manager   │         │Gen Dir  │
└───┬───┘           └─────┬─────┘         └────┬────┘
    │                     │                    │
┌───┴───┐           ┌─────┴─────┐         ┌────┴────┐
│  5    │           │     7     │         │    6    │
│agents │           │  agents   │         │ agents  │
└───────┘           └───────────┘         └─────────┘

    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───┴───┐           ┌─────┴─────┐         ┌────┴────┐
│  SEO  │           │  Brand &  │         │Marketing│
│Manager│           │ Creative  │         │Ops Dir  │
└───┬───┘           └─────┬─────┘         └────┬────┘
    │                     │                    │
┌───┴───┐           ┌─────┴─────┐         ┌────┴────┐
│  4    │           │     3     │         │    4    │
│agents │           │  agents   │         │ agents  │
└───────┘           └───────────┘         └─────────┘
```

---

## Los 6 Departamentos

### I. Content Department (5 agentes)

**Líder:** Content Director

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `content-001` | Long-Form Content Manager | Gestiona producción de artículos, guías, posts SEO | Manual / Scheduled |
| `content-002` | Blog Content Writer | Escribe artículos optimizados para tráfico orgánico | Webhook from Manager |
| `content-003` | Whitepaper Author | Investiga y escribe guías técnicas profundas | Manual |
| `content-004` | Case Study Writer | Crea historias de éxito de clientes | Manual |
| `content-005` | Content Publisher | Formatea, optimiza y publica en CMS | Webhook |

**Flujo típico:**
```
SEO Brief → Content Manager → Asigna a Writer → Draft → Review → Publisher → Live
```

---

### II. Social Media & Community (7 agentes)

**Líder:** Social Media Manager

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `social-001` | LinkedIn Content Creator | Crea contenido profesional optimizado para viralidad | Scheduled |
| `social-002` | Twitter/X Content Creator | Threads y actualizaciones de thought leadership | Scheduled |
| `social-003` | YouTube Scriptwriter | Scripts para contenido educativo long-form | Manual |
| `social-004` | Short-Form Video Creator | Produce contenido vertical (TikTok, Reels, Shorts) | Scheduled |
| `social-005` | Podcast Producer | Coordina booking, grabación y producción | Manual |
| `social-006` | Social Engagement Analyst | Trackea métricas de engagement y sentimiento | Cron (daily) |
| `social-007` | Social Scheduling Coordinator | Optimiza horarios y gestiona cola de publicación | Cron (hourly) |

---

### III. Demand Generation & Paid Media (6 agentes)

**Líder:** Demand Gen Director

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `demandgen-001` | Paid Media Manager | Optimiza gasto publicitario en search y social | Cron (daily) |
| `demandgen-002` | Meta Ads Specialist | Gestiona campañas de Facebook e Instagram | Webhook / Cron |
| `demandgen-003` | Google Ads Specialist | Maximiza captura de tráfico high-intent | Webhook / Cron |
| `demandgen-004` | LinkedIn Ads Specialist | Targeting de decision-makers B2B | Webhook / Cron |
| `demandgen-005` | Ad Performance Analyst | Agrega datos para calcular ROAS y eficiencia | Cron (daily) |
| `demandgen-006` | Budget Pacing Analyst | Monitorea gasto diario para compliance | Cron (hourly) |

---

### IV. SEO (4 agentes)

**Líder:** SEO Manager

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `seo-001` | SEO Content Strategist | Identifica oportunidades de keywords y crea briefs | Cron (weekly) |
| `seo-002` | Backlink Analyst | Monitorea calidad de links y construye autoridad | Cron (weekly) |
| `seo-003` | Technical SEO Specialist | Audita salud del sitio y core web vitals | Cron (weekly) |
| `seo-004` | Keyword Rank Tracker | Trackea posiciones diarias y movimiento de competidores | Cron (daily) |

---

### V. Brand & Creative (3 agentes)

**Líderes:** Brand Director + Creative Manager

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `brand-001` | Ad Creative Designer | Diseña visuales de alta conversión para ads | Webhook |
| `brand-002` | Landing Page Builder | Diseña páginas de conversión de alto rendimiento | Webhook |
| `brand-003` | Asset Librarian | Etiqueta y organiza assets digitales | Webhook / Cron |

---

### VI. Marketing Operations (4 agentes)

**Líder:** Marketing Ops Director

| ID | Agente | Función | Trigger |
|----|--------|---------|---------|
| `ops-001` | Email Operations Manager | Supervisa infraestructura y deliverability | Cron (daily) |
| `ops-002` | Newsletter Writer | Cura y escribe newsletters de nurturing semanales | Cron (weekly) |
| `ops-003` | Nurture Campaign Specialist | Construye flujos automatizados a través del funnel | Webhook |
| `ops-004` | List Hygiene Specialist | Limpia listas de email para proteger reputación | Cron (weekly) |

---

## Conteo Total de Agentes

| Departamento | Agentes |
|--------------|---------|
| Leadership | 1 (CMO) |
| Content | 5 |
| Social Media & Community | 7 |
| Demand Gen & Paid Media | 6 |
| SEO | 4 |
| Brand & Creative | 3 |
| Marketing Ops | 4 |
| **Directors/Managers** | 7 |
| **Total** | **37** |

---

## Flujo de Trabajo Integrado

### Ejemplo: De Keyword a Campaña Multicanal

```
1. SEO Content Strategist identifica oportunidad de keyword
         ↓
2. Long-Form Content Manager asigna a Blog Content Writer
         ↓
3. Blog Content Writer redacta artículo
         ↓
4. Content Publisher formatea y publica
         ↓
5. Social Media team repurposea:
   - LinkedIn Content Creator → Post profesional
   - Twitter/X Creator → Thread
   - Short-Form Video Creator → Reel/TikTok
         ↓
6. Demand Gen corre promoción pagada
         ↓
7. Marketing Ops añade a secuencia de email nurture
         ↓
8. Social Engagement Analyst trackea performance
         ↓
9. Insights alimentan el próximo ciclo de contenido
```

**Un contenido → Múltiples canales → Completamente coordinado**

---

## Modelo de Datos (Convex)

### Entidades Principales

```typescript
// agents - Definición de cada agente
{
  _id: Id<"agents">,
  agentId: string,           // "content-001"
  name: string,              // "Blog Content Writer"
  department: string,        // "content"
  role: "director" | "specialist",
  status: "active" | "paused" | "error",
  config: {
    systemPrompt: string,
    model: string,           // "claude-sonnet-4-20250514"
    temperature: number,
    maxTokens: number,
  },
  triggers: string[],        // ["webhook", "cron:daily"]
  reportsTo: Id<"agents"> | null,
  createdAt: number,
  updatedAt: number,
}

// tasks - Tareas asignadas a agentes
{
  _id: Id<"tasks">,
  taskId: string,
  agentId: Id<"agents">,
  type: string,              // "write_blog", "analyze_keywords"
  status: "pending" | "running" | "completed" | "failed",
  input: any,
  output: any,
  startedAt: number | null,
  completedAt: number | null,
  error: string | null,
  parentTaskId: Id<"tasks"> | null,  // Para tareas encadenadas
}

// executions - Log de ejecuciones
{
  _id: Id<"executions">,
  taskId: Id<"tasks">,
  agentId: Id<"agents">,
  llmCalls: number,
  tokensUsed: { input: number, output: number },
  duration: number,          // ms
  cost: number,              // USD
  timestamp: number,
}

// handoffs - Transferencias entre agentes
{
  _id: Id<"handoffs">,
  fromAgent: Id<"agents">,
  toAgent: Id<"agents">,
  taskId: Id<"tasks">,
  payload: any,
  timestamp: number,
}

// content - Contenido generado
{
  _id: Id<"content">,
  type: "blog" | "social" | "email" | "ad" | "landing",
  title: string,
  body: string,
  metadata: any,
  status: "draft" | "review" | "approved" | "published",
  createdBy: Id<"agents">,
  createdAt: number,
  publishedAt: number | null,
}
```

---

## Integración n8n

### Estructura de Workflows

```
/n8n-workflows
├── /triggers
│   ├── webhook-receiver.json       # Recibe webhooks externos
│   ├── cron-daily.json             # Ejecuta agentes diarios
│   ├── cron-weekly.json            # Ejecuta agentes semanales
│   └── cron-hourly.json            # Ejecuta agentes por hora
│
├── /agents
│   ├── /content
│   │   ├── content-director.json
│   │   ├── blog-writer.json
│   │   └── content-publisher.json
│   ├── /social
│   │   ├── linkedin-creator.json
│   │   └── engagement-analyst.json
│   ├── /demandgen
│   │   └── ...
│   ├── /seo
│   │   └── ...
│   ├── /brand
│   │   └── ...
│   └── /ops
│       └── ...
│
├── /orchestration
│   ├── task-dispatcher.json        # Distribuye tareas a agentes
│   ├── handoff-handler.json        # Maneja transferencias
│   └── error-handler.json          # Gestiona errores
│
└── /integrations
    ├── convex-sync.json            # Sincroniza con Convex
    ├── claude-api.json             # Llamadas a Claude
    └── external-apis.json          # APIs de terceros
```

---

## Roadmap de Implementación

### Fase 1: Infraestructura (Semana 1-2)
- [ ] Setup proyecto Convex
- [ ] Definir schema completo
- [ ] Crear funciones base (mutations, queries)
- [ ] Setup n8n con workflows de orquestación

### Fase 2: Agentes Core (Semana 3-4)
- [ ] CMO Agent
- [ ] Content Director + Blog Writer
- [ ] Social Media Manager + LinkedIn Creator
- [ ] Task dispatcher y handoff handler

### Fase 3: Departamentos Completos (Semana 5-8)
- [ ] Content Department completo
- [ ] Social Media Department completo
- [ ] SEO Department
- [ ] Marketing Ops

### Fase 4: Integraciones (Semana 9-10)
- [ ] Integración con plataformas de ads
- [ ] CMS connections
- [ ] Analytics y reporting

### Fase 5: Dashboard (Semana 11-12)
- [ ] Frontend de monitoreo
- [ ] Métricas en tiempo real
- [ ] Control manual de agentes

---

## Licencia y Uso

Este blueprint es propiedad de **AIAIAI Consulting**.

Para implementación personalizada, contactar a través de los canales oficiales.

---

*Documento generado el {{DATE}}*
