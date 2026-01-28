# 📊 Sistema AMD - Flujos Visuales

Diagramas visuales de cómo funciona el sistema completo.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │TechCrunch│  │ HubSpot  │  │   Moz    │  │  Otros   │      │
│  │   RSS    │  │   RSS    │  │   RSS    │  │   RSS    │      │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘      │
│        │             │              │             │            │
└────────┼─────────────┼──────────────┼─────────────┼────────────┘
         │             │              │             │
         └─────────────┴──────────────┴─────────────┘
                            │
                            ▼
         ╔═════════════════════════════════════════╗
         ║       CONVEX (Backend Serverless)       ║
         ╠═════════════════════════════════════════╣
         ║                                         ║
         ║  📦 Base de Datos:                      ║
         ║    ├─ feeds (URLs RSS)                  ║
         ║    ├─ feedItems (artículos)             ║
         ║    ├─ agents (37 agentes)               ║
         ║    ├─ tasks (tareas)                    ║
         ║    └─ content (contenido generado)      ║
         ║                                         ║
         ║  ⏰ Cron Jobs:                           ║
         ║    └─ Feed Sync: Cada hora :05          ║
         ║                                         ║
         ╚═════════════════════════════════════════╝
                            │
                            ▼
         ╔═════════════════════════════════════════╗
         ║      TU MÁQUINA (Cron Local)            ║
         ╠═════════════════════════════════════════╣
         ║                                         ║
         ║  ⏰ Cron Local: Cada hora :35            ║
         ║    ├─ Query feedItems sin procesar      ║
         ║    ├─ Ejecuta: claude CLI (plan MAX)    ║
         ║    ├─ Extrae: topics, sentiment, etc.   ║
         ║    └─ Guarda: resultados en Convex      ║
         ║                                         ║
         ║  📝 Logs: logs/enrich-YYYYMMDD.log      ║
         ║                                         ║
         ╚═════════════════════════════════════════╝
                            │
                            ▼
         ╔═════════════════════════════════════════╗
         ║          37 AGENTES DE IA               ║
         ╠═════════════════════════════════════════╣
         ║                                         ║
         ║  Usan feedItems enriquecidos para:      ║
         ║    ├─ Crear blogs                       ║
         ║    ├─ Posts de social media             ║
         ║    ├─ Estrategia SEO                    ║
         ║    ├─ Campañas de ads                   ║
         ║    └─ Email marketing                   ║
         ║                                         ║
         ╚═════════════════════════════════════════╝
```

---

## ⏰ Timeline de un Día Típico

```
00:00 ┐
      │
00:05 ├─► Convex Cron: Feed Sync
      │   └─ Sincroniza 10 feeds RSS
      │   └─ Guarda ~20 nuevos feedItems
      │
00:35 ├─► Tu Cron Local: Enrichment
      │   └─ Procesa 10 items con Claude Code
      │   └─ Guarda: topics, sentiment, summary
      │
01:00 ┤
      │
01:05 ├─► Convex Cron: Feed Sync
      │   └─ Sincroniza feeds nuevamente
      │
01:35 ├─► Tu Cron Local: Enrichment
      │   └─ Procesa otros 10 items
      │
02:00 ┤
 ...  │ (Se repite cada hora)
      │
23:05 ├─► Última sincronización del día
      │
23:35 ├─► Último enrichment del día
      │
24:00 ┘

TOTAL DEL DÍA:
├─ Sincronizaciones: 24 (cada hora)
├─ Enrichments: 24 (cada hora)
└─ Items procesados: 240 máximo
```

---

## 🔄 Flujo Completo de un Artículo

```
HORA :05 - FEED SYNC (Convex)
┌────────────────────────────────────────────────────────┐
│ 1. Convex fetch RSS feed                               │
│    GET https://techcrunch.com/feed/                    │
│         ↓                                              │
│ 2. Parse XML/RSS                                       │
│    <item>                                              │
│      <title>AI in Marketing 2026</title>              │
│      <link>https://...</link>                         │
│      <description>...</description>                   │
│    </item>                                            │
│         ↓                                              │
│ 3. Deduplicación (hash de title+link)                 │
│    ¿Ya existe? → Skip                                  │
│    ¿Nuevo? → Continuar                                │
│         ↓                                              │
│ 4. Guardar en feedItems                               │
│    {                                                   │
│      title: "AI in Marketing 2026",                   │
│      link: "https://...",                             │
│      summary: "...",                                  │
│      publishedAt: 1738065600000,                      │
│      processed: undefined  ← Sin enriquecer aún       │
│    }                                                   │
└────────────────────────────────────────────────────────┘

... 30 minutos después ...

HORA :35 - ENRICHMENT (Tu Máquina)
┌────────────────────────────────────────────────────────┐
│ 1. Query items sin procesar                            │
│    SELECT * FROM feedItems                             │
│    WHERE processed IS undefined                        │
│    LIMIT 10                                            │
│         ↓                                              │
│ 2. Para cada item:                                     │
│    ┌──────────────────────────────────────────┐       │
│    │ a) Construir prompt:                     │       │
│    │    "Analiza: [title + content]"          │       │
│    │         ↓                                 │       │
│    │ b) Ejecutar Claude Code CLI:             │       │
│    │    echo "prompt" | claude                │       │
│    │         ↓                                 │       │
│    │ c) Parse JSON response:                  │       │
│    │    {                                      │       │
│    │      "topics": ["AI", "Marketing"],      │       │
│    │      "sentiment": "positive",            │       │
│    │      "summary": "...",                   │       │
│    │      "relevanceScore": 8                 │       │
│    │    }                                      │       │
│    │         ↓                                 │       │
│    │ d) Guardar en Convex:                    │       │
│    │    UPDATE feedItems SET                  │       │
│    │      topics = ["AI", "Marketing"],       │       │
│    │      sentiment = "positive",             │       │
│    │      aiSummary = "...",                  │       │
│    │      relevanceScore = 8,                 │       │
│    │      processed = true,                   │       │
│    │      processedAt = NOW()                 │       │
│    └──────────────────────────────────────────┘       │
│         ↓                                              │
│ 3. Log resultado:                                      │
│    ✅ Procesados: 10                                   │
│    ❌ Fallidos: 0                                      │
│    💰 Costo: $0.00 (plan MAX)                         │
└────────────────────────────────────────────────────────┘

RESULTADO FINAL
┌────────────────────────────────────────────────────────┐
│ feedItem enriquecido:                                  │
│ {                                                      │
│   // Campos originales del RSS:                       │
│   title: "AI in Marketing 2026",                      │
│   link: "https://...",                                │
│   summary: "Original RSS description",                │
│   publishedAt: 1738065600000,                         │
│                                                        │
│   // Campos agregados por IA:                         │
│   topics: ["AI", "Marketing", "Automation"],          │
│   sentiment: "positive",                              │
│   aiSummary: "Resumen ejecutivo en español",          │
│   relevanceScore: 8,                                  │
│   processed: true,                                    │
│   processedAt: 1738069200000                          │
│ }                                                      │
│                                                        │
│ ✅ Listo para usar por agentes                        │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 Flujo de Uso de Agentes

```
AGENTE EJECUTANDO (ej: LinkedIn Content Creator)
┌────────────────────────────────────────────────────────┐
│ 1. Usuario ejecuta:                                    │
│    npm run agent:linkedin                              │
│         ↓                                              │
│ 2. Agente consulta feeds (si tiene tool: "feeds"):    │
│    Query: feedItems                                    │
│    WHERE processed = true                              │
│    AND publishedAt > (NOW - 7 days)                    │
│    ORDER BY relevanceScore DESC                        │
│    LIMIT 10                                            │
│         ↓                                              │
│ 3. Recibe información contextual:                      │
│    [                                                   │
│      {                                                 │
│        title: "AI in Marketing 2026",                 │
│        topics: ["AI", "Marketing"],                   │
│        sentiment: "positive",                         │
│        aiSummary: "...",                              │
│        relevanceScore: 8                              │
│      },                                                │
│      { ... } // 9 más                                 │
│    ]                                                   │
│         ↓                                              │
│ 4. Agente genera contenido:                           │
│    - Usa topics para identificar tendencias           │
│    - Usa aiSummary para contexto                      │
│    - Usa relevanceScore para priorizar                │
│    - Crea post optimizado de LinkedIn                 │
│         ↓                                              │
│ 5. Guarda resultado:                                   │
│    INSERT INTO content {                              │
│      agentId: "social-001",                           │
│      type: "linkedin_post",                           │
│      content: "Post generado...",                     │
│      feedItemsUsed: [id1, id2, ...],                  │
│      status: "draft"                                  │
│    }                                                   │
│         ↓                                              │
│ 6. Usuario revisa y publica                           │
│    Dashboard → Content → Aprobar                      │
└────────────────────────────────────────────────────────┘

BENEFICIO
┌────────────────────────────────────────────────────────┐
│ ✅ Contenido actualizado (feeds del día)               │
│ ✅ Información relevante (relevanceScore alto)         │
│ ✅ Contexto profundo (aiSummary + topics)             │
│ ✅ Sin búsqueda manual (todo automatizado)            │
└────────────────────────────────────────────────────────┘
```

---

## 🔀 Flujo de Handoff (Transferencia entre Agentes)

```
EJEMPLO: Blog Post con SEO y Social Media
┌────────────────────────────────────────────────────────┐
│                                                        │
│  [SEO Strategist]                                      │
│         │                                              │
│         │ 1. Analiza feedItems                         │
│         │    relevanceScore >= 8                       │
│         ↓                                              │
│    Identifica oportunidad:                            │
│    "AI in Marketing" está trending                    │
│         │                                              │
│         │ 2. Crea brief de contenido                  │
│         ↓                                              │
│    Handoff: {                                         │
│      from: "seo-001",                                 │
│      to: "content-002",                               │
│      reason: "Keyword opportunity",                   │
│      context: { keyword, volume, difficulty }         │
│    }                                                   │
│         │                                              │
│         ▼                                              │
│                                                        │
│  [Content Writer]                                      │
│         │                                              │
│         │ 3. Recibe handoff                           │
│         │    Lee brief + feedItems relacionados       │
│         ↓                                              │
│    Escribe artículo de 1500 palabras                  │
│    Optimizado para "AI in Marketing"                  │
│         │                                              │
│         │ 4. Completa y transfiere                    │
│         ↓                                              │
│    Handoff: {                                         │
│      from: "content-002",                             │
│      to: "content-005",                               │
│      reason: "Article ready for publishing"           │
│    }                                                   │
│         │                                              │
│         ▼                                              │
│                                                        │
│  [Content Publisher]                                   │
│         │                                              │
│         │ 5. Recibe handoff                           │
│         ↓                                              │
│    - Formatea HTML                                    │
│    - Optimiza imágenes                                │
│    - Publica en CMS                                   │
│         │                                              │
│         │ 6. Notifica a Social Media                  │
│         ↓                                              │
│    Handoff: {                                         │
│      from: "content-005",                             │
│      to: "social-manager",                            │
│      reason: "New blog post published",               │
│      context: { url, title, topics }                  │
│    }                                                   │
│         │                                              │
│         ▼                                              │
│                                                        │
│  [Social Media Manager]                                │
│         │                                              │
│         │ 7. Distribuye a plataformas                 │
│         ├─────────┬─────────┬─────────┐              │
│         ▼         ▼         ▼         ▼               │
│    LinkedIn   Twitter   Facebook   Email              │
│                                                        │
└────────────────────────────────────────────────────────┘

RESULTADO
┌────────────────────────────────────────────────────────┐
│ Blog post publicado + 4 posts en social media          │
│ Todo coordinado automáticamente                        │
│ Basado en información actualizada de feeds             │
└────────────────────────────────────────────────────────┘
```

---

## 💾 Modelo de Datos Simplificado

```
┌─────────────────┐
│     feeds       │
├─────────────────┤
│ _id             │◄─────┐
│ name            │      │
│ url             │      │
│ category        │      │
│ status          │      │
│ lastSyncedAt    │      │
└─────────────────┘      │
                         │
                    (belongs to)
                         │
┌─────────────────────────┼───────────────────┐
│          feedItems      │                   │
├─────────────────────────┼───────────────────┤
│ _id                     │                   │
│ feedId ─────────────────┘                   │
│ title                                       │
│ link                                        │
│ summary                                     │
│ content                                     │
│ publishedAt                                 │
│                                             │
│ // Campos de enrichment:                   │
│ topics: ["AI", "Marketing"]                 │
│ sentiment: "positive"                       │
│ aiSummary: "Resumen..."                     │
│ relevanceScore: 8                           │
│ processed: true                             │
│ processedAt: 1738069200000                  │
└─────────────────────────────────────────────┘
          │
          │ (used by)
          │
          ▼
┌─────────────────┐         ┌─────────────────┐
│     agents      │         │     tasks       │
├─────────────────┤         ├─────────────────┤
│ _id             │         │ _id             │
│ agentId         │         │ agentId ────────┤◄───┐
│ name            │         │ title           │    │
│ department      │         │ type            │    │
│ status          │         │ status          │    │
│ config: {       │         │ input           │    │
│   systemPrompt  │         │ output          │    │
│   model         │         │ createdAt       │    │
│   temperature   │         │ completedAt     │    │
│   tools: []     │◄────────│ feedItemsUsed   │    │
│ }               │         └─────────────────┘    │
└─────────────────┘                                │
          │                                        │
          │ (creates)                              │
          │                                        │
          ▼                                        │
┌─────────────────┐                                │
│    content      │                                │
├─────────────────┤                                │
│ _id             │                                │
│ agentId ────────┤────────────────────────────────┘
│ type            │
│ title           │
│ content         │
│ status          │
│ feedItemsUsed   │─┐
│ createdAt       │ │
└─────────────────┘ │
                    │
                    └──► Referencias a feedItems
                         que fueron usados para
                         generar este contenido
```

---

## 🔍 Flujo de Monitoreo

```
MONITOREO DIARIO
┌────────────────────────────────────────────────────────┐
│                                                        │
│  CONVEX DASHBOARD                                      │
│  https://dashboard.convex.dev                          │
│         │                                              │
│         ├─► Data → feeds                              │
│         │   ├─ ¿Cuántos feeds activos?                │
│         │   ├─ ¿Cuándo fue la última sincronización?  │
│         │   └─ ¿Hay errores? (status: error)          │
│         │                                              │
│         ├─► Data → feedItems                          │
│         │   ├─ ¿Cuántos items hoy?                    │
│         │   ├─ ¿Cuántos procesados? (processed: true) │
│         │   └─ ¿Cuál es el relevanceScore promedio?   │
│         │                                              │
│         ├─► Data → agents                             │
│         │   ├─ ¿Todos activos? (status: active)       │
│         │   └─ ¿Hay errores?                          │
│         │                                              │
│         └─► Logs                                       │
│             ├─ Filtrar por: "feeds"                   │
│             ├─ Ver sincronizaciones recientes         │
│             └─ Identificar errores                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  LOGS LOCALES                                          │
│  logs/enrich-YYYYMMDD.log                             │
│         │                                              │
│         ├─► tail -50 logs/enrich-$(date +%Y%m%d).log  │
│         │   └─ Ver última ejecución                   │
│         │                                              │
│         ├─► grep "RESUMEN" logs/*.log                 │
│         │   └─ Ver estadísticas de cada run           │
│         │                                              │
│         ├─► grep "❌" logs/*.log                      │
│         │   └─ Identificar errores                    │
│         │                                              │
│         └─► tail -f logs/enrich-$(date +%Y%m%d).log   │
│             └─ Seguir en tiempo real                  │
│                                                        │
└────────────────────────────────────────────────────────┘

MÉTRICAS CLAVE A MONITOREAR
┌────────────────────────────────────────────────────────┐
│ Métrica              │ Dónde Ver          │ Esperado   │
├──────────────────────┼────────────────────┼────────────┤
│ Feeds activos        │ Convex → feeds     │ 5-10       │
│ Items/día            │ Convex → feedItems │ 50-100     │
│ % Procesados         │ Convex → feedItems │ >90%       │
│ Ejecuciones cron     │ logs/              │ 24/día     │
│ Errores              │ logs/ + Convex     │ <5%        │
│ relevanceScore medio │ Convex → feedItems │ 5-7        │
└────────────────────────────────────────────────────────┘
```

---

## 🚨 Flujo de Error Handling

```
ERROR EN FEED SYNC
┌────────────────────────────────────────────────────────┐
│ Convex intenta fetch de feed                          │
│         ↓                                              │
│ ❌ Error 404 / Timeout / Invalid XML                   │
│         ↓                                              │
│ Retry con exponential backoff:                        │
│   - Intento 1: Inmediato                              │
│   - Intento 2: 1 min después                          │
│   - Intento 3: 2 min después                          │
│   - Intento 4: 5 min después                          │
│         ↓                                              │
│ Si todos fallan:                                       │
│   - Actualizar feed.status = "error"                  │
│   - Incrementar consecutiveErrors                     │
│   - Log error en syncLogs                             │
│         ↓                                              │
│ Si consecutiveErrors >= 3:                            │
│   - Marcar feed.status = "paused"                     │
│   - Enviar notificación (si configurado)              │
└────────────────────────────────────────────────────────┘

ERROR EN ENRICHMENT
┌────────────────────────────────────────────────────────┐
│ Cron local ejecuta enrichment                         │
│         ↓                                              │
│ Para item X:                                           │
│   echo "prompt" | claude                               │
│         ↓                                              │
│ ❌ Error: Invalid JSON / Claude timeout                │
│         ↓                                              │
│ Marcar item como fallido:                             │
│   UPDATE feedItems SET                                 │
│     processed = false,                                 │
│     processingError = "Error message"                  │
│         ↓                                              │
│ Continuar con siguiente item                          │
│ (no bloquear batch completo)                          │
│         ↓                                              │
│ Al final del batch:                                    │
│   Log resumen:                                         │
│   ✅ Procesados: 8                                     │
│   ❌ Fallidos: 2                                       │
│         ↓                                              │
│ Items fallidos (processed: false)                     │
│ NO se intentan en próximas ejecuciones                │
│ (evita loops infinitos)                               │
└────────────────────────────────────────────────────────┘

RECUPERACIÓN MANUAL
┌────────────────────────────────────────────────────────┐
│ Para re-intentar items fallidos:                      │
│                                                        │
│ 1. Identificar items:                                  │
│    Convex Dashboard → feedItems                       │
│    WHERE processed = false                            │
│                                                        │
│ 2. Resetear estado:                                    │
│    UPDATE feedItems SET                               │
│      processed = undefined,                           │
│      processingError = undefined                      │
│    WHERE _id IN (...)                                 │
│                                                        │
│ 3. Re-ejecutar enrichment:                            │
│    npm run enrich 1                                   │
│                                                        │
│ 4. Verificar logs:                                     │
│    tail logs/enrich-$(date +%Y%m%d).log               │
└────────────────────────────────────────────────────────┘
```

---

## 📈 Flujo de Escalamiento

```
ESCENARIO: Aumentar Volumen de Processing
┌────────────────────────────────────────────────────────┐
│                                                        │
│ Opción 1: Aumentar batch size del cron                │
│ ─────────────────────────────────────────             │
│ crontab -e                                             │
│ 35 * * * * .../cron-enrich.sh 20  ← de 10 a 20       │
│                                                        │
│ Impacto:                                               │
│ ✅ Más items/hora (20 vs 10)                          │
│ ✅ Total/día: 480 items                               │
│ ⚠️  Ejecución más lenta por batch                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Opción 2: Aumentar frecuencia del cron                │
│ ─────────────────────────────────────────             │
│ crontab -e                                             │
│ */30 * * * * .../cron-enrich.sh 10  ← cada 30 min    │
│                                                        │
│ Impacto:                                               │
│ ✅ Más ejecuciones/día (48 vs 24)                     │
│ ✅ Total/día: 480 items                               │
│ ✅ Batches más pequeños = más rápido                  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Opción 3: Múltiples crons en paralelo                 │
│ ─────────────────────────────────────                 │
│ crontab -e                                             │
│ 35 * * * * .../cron-enrich.sh 10  # Cron 1           │
│ 50 * * * * .../cron-enrich.sh 10  # Cron 2 (15 min)  │
│                                                        │
│ Impacto:                                               │
│ ✅ Procesamiento paralelo                             │
│ ✅ Total/día: 480 items                               │
│ ⚠️  Requiere más recursos de máquina                  │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Opción 4: Migrar a API de Anthropic (con costo)       │
│ ─────────────────────────────────────────             │
│ - Deshabilitar cron local                             │
│ - Habilitar crons de Convex (ya configurados)         │
│ - Configurar ANTHROPIC_API_KEY                        │
│                                                        │
│ Impacto:                                               │
│ ✅ Escalable ilimitadamente                           │
│ ✅ No depende de tu máquina                           │
│ ❌ Costo: ~$2/mes (Haiku 3.5) por 100 items/día      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumen de Componentes

```
┌─────────────────────────────────────────────────────┐
│ COMPONENTE        │ RESPONSABILIDAD   │ FRECUENCIA │
├───────────────────┼───────────────────┼────────────┤
│ Convex Feed Sync  │ Sincronizar RSS   │ Cada hora  │
│ Cron Local        │ Enriquecer items  │ Cada hora  │
│ Claude Code CLI   │ Análisis con IA   │ On-demand  │
│ 37 Agentes        │ Crear contenido   │ Manual     │
│ Convex DB         │ Almacenar datos   │ 24/7       │
│ Logs              │ Monitoreo         │ Continuo   │
└─────────────────────────────────────────────────────┘

COSTO TOTAL: $0/mes
(usando Claude Code MAX plan)
```

---

**Para guía completa:** Ver `ONBOARDING.md`
**Para inicio rápido:** Ver `QUICK-START.md`
