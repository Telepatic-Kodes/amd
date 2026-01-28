# 🚀 Onboarding: AI Marketing Department (AMD)

Bienvenido al sistema de **37 Agentes de IA** que automatizan completamente un departamento de marketing.

Este manual te guiará paso a paso para entender y usar el sistema.

---

## 📋 Índice

1. [¿Qué es AMD?](#qué-es-amd)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Configuración Inicial](#configuración-inicial)
5. [Uso Diario](#uso-diario)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Monitoreo y Logs](#monitoreo-y-logs)
8. [Troubleshooting](#troubleshooting)
9. [Referencia Rápida](#referencia-rápida)

---

## 🎯 ¿Qué es AMD?

**AMD (AI Marketing Department)** es un sistema automatizado que:

- ✅ **Sincroniza** feeds RSS de noticias de tecnología/marketing
- ✅ **Enriquece** cada artículo con IA (topics, sentiment, relevancia)
- ✅ **Proporciona** información actualizada a 37 agentes de IA
- ✅ **Automatiza** la creación de contenido, social media, SEO, ads, etc.

### ¿Por qué usar AMD?

| Problema | Solución AMD |
|----------|--------------|
| Los agentes de IA necesitan contexto actualizado | Feed sync automático cada hora |
| La información se vuelve obsoleta rápidamente | Enriquecimiento con IA identifica lo relevante |
| Procesar manualmente feeds consume tiempo | Todo automatizado con crons |
| Costos de API pueden ser altos | Usa Claude Code MAX ($0 costo) |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (TÚ)                             │
│   Dashboard → Crear campañas, ver contenido, analytics      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONVEX (Backend)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Base de Datos:                                       │  │
│  │ • agents (37 agentes)                                │  │
│  │ • feeds (URLs RSS configurados)                      │  │
│  │ • feedItems (artículos enriquecidos)                 │  │
│  │ • tasks (tareas ejecutadas)                          │  │
│  │ • content (contenido generado)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Crons Automáticos:                                   │  │
│  │ • Feed sync: Cada hora a las :05                     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SISTEMA LOCAL (Tu Máquina)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Cron Local:                                          │  │
│  │ • Enrichment: Cada hora a las :35                    │  │
│  │ • Ejecuta: Claude Code CLI (plan MAX - $0)          │  │
│  │ • Guarda: Resultados en Convex                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo Completo (Cada Hora)

```
:05 → Convex sincroniza feeds RSS
       ↓ Nuevos artículos guardados en feedItems

:35 → Tu cron local ejecuta (30 min después)
       ↓ Claude Code analiza artículos
       ↓ Extrae: topics, sentiment, summary, relevanceScore
       ↓ Guarda resultados en Convex

:XX → Agentes usan información enriquecida
       ↓ Crean contenido actualizado y relevante
```

---

## 🧩 Componentes Principales

### 1. Feeds RSS (Fuentes de Información)

**¿Qué son?**
URLs de sitios de noticias que publican actualizaciones en formato RSS/Atom.

**¿Dónde se configuran?**
En la tabla `feeds` de Convex (puedes agregar desde el dashboard).

**Ejemplo de feeds populares:**
- TechCrunch: `https://techcrunch.com/feed/`
- HubSpot Marketing: `https://blog.hubspot.com/marketing/rss.xml`
- Moz Blog: `https://moz.com/blog/feed`

**¿Cómo se sincronizan?**
Automáticamente cada hora a las :05 mediante un cron de Convex.

### 2. Feed Items (Artículos)

**¿Qué son?**
Artículos individuales extraídos de los feeds RSS.

**Campos principales:**
```typescript
{
  title: "Latest AI Trends in Marketing",
  link: "https://...",
  summary: "Original RSS summary",
  content: "Full article content",
  publishedAt: 1738065600000,

  // Campos de enriquecimiento (agregados por IA):
  topics: ["AI", "Marketing", "Automation"],
  sentiment: "positive",
  aiSummary: "Resumen ejecutivo...",
  relevanceScore: 8,
  processed: true
}
```

### 3. Enrichment (Enriquecimiento con IA)

**¿Qué hace?**
Analiza cada artículo con Claude Code para extraer:
- **Topics**: 2-5 temas principales
- **Sentiment**: positive/neutral/negative
- **AI Summary**: Resumen ejecutivo en español
- **Relevance Score**: 0-10 (relevancia para marketing B2B tech)

**¿Cuándo se ejecuta?**
Automáticamente cada hora a las :35 mediante tu cron local.

**¿Cuánto cuesta?**
$0 (usa tu plan Claude Code MAX).

### 4. Agentes de IA

**¿Qué son?**
37 agentes especializados organizados en 6 departamentos.

**Departamentos:**
- 👔 **Leadership** (1): CMO
- ✍️ **Content** (6): Writers, editores
- 📱 **Social Media** (8): LinkedIn, Twitter, YouTube, etc.
- 📈 **Demand Gen** (7): Paid ads, performance
- 🔍 **SEO** (5): Keywords, backlinks, technical
- 🎨 **Brand & Creative** (4): Diseño, assets
- ⚙️ **Marketing Ops** (5): Email, automation

**¿Cómo usan los feeds?**
Los agentes pueden acceder a feeds enriquecidos para crear contenido actualizado y relevante.

---

## ⚙️ Configuración Inicial

### Paso 1: Verificar Requisitos

```bash
# Verificar Node.js
node --version
# Debe ser >= 18.0.0

# Verificar npm
npm --version

# Verificar Claude Code CLI
claude --version
# Si no está instalado: npm install -g @anthropic-ai/claude-code
```

### Paso 2: Instalar Dependencias

```bash
cd /home/tomas/Escritorio/amd
npm install
```

### Paso 3: Configurar Convex

```bash
# Iniciar Convex en modo desarrollo
npx convex dev

# Esto abre el navegador para autenticación
# Deja este terminal abierto (Convex sincroniza en tiempo real)
```

### Paso 4: Verificar Cron Local

```bash
# Ver cron configurado
crontab -l

# Deberías ver:
# 35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10
```

### Paso 5: Cargar Agentes (Opcional)

Si es tu primera vez:

```bash
npx convex run seed:seedAgents
```

Esto carga los 37 agentes pre-configurados.

### Paso 6: Levantar Dashboard (Opcional)

```bash
cd ai-marketing-department/ai-marketing-department
npm install
npm run dev

# Abrir: http://localhost:3000
```

---

## 📖 Uso Diario

### Ver Feeds Configurados

```bash
# Desde Convex dashboard
# https://dashboard.convex.dev → Tu proyecto → Data → feeds
```

O mediante código:

```typescript
// Listar feeds activos
await ctx.db.query("feeds")
  .withIndex("by_status", (q) => q.eq("status", "active"))
  .collect();
```

### Agregar un Nuevo Feed

```bash
# Desde Convex dashboard → Data → feeds → Insert Document

# O mediante código:
npx convex run feeds:mutations:addFeed \
  --url "https://blog.hubspot.com/marketing/rss.xml" \
  --name "HubSpot Marketing Blog" \
  --category "Marketing"
```

### Ver Artículos Enriquecidos

```bash
# Desde Convex dashboard → Data → feedItems
# Filtrar por: processed = true
```

Los campos enriquecidos son:
- `topics`: Array de strings
- `sentiment`: "positive" | "neutral" | "negative"
- `aiSummary`: String (resumen en español)
- `relevanceScore`: Number (0-10)

### Ejecutar Enrichment Manualmente

```bash
# Procesar 5 artículos inmediatamente
npm run enrich 5

# Ver resultado
cat logs/enrich-$(date +%Y%m%d).log
```

### Ver Logs del Cron

```bash
# Última ejecución automática
tail -50 logs/enrich-$(date +%Y%m%d).log

# Seguir en tiempo real
tail -f logs/enrich-$(date +%Y%m%d).log
```

### Ejecutar un Agente

```bash
# Ejemplo: Crear post de LinkedIn
npm run agent:linkedin

# Ejemplo: Escribir artículo de blog
npm run agent:blog
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Contenido de Blog Basado en Tendencias

```
1. Feed sync trae artículo sobre "AI in Marketing"
   ↓ publishedAt: Hoy

2. Enrichment lo analiza
   ↓ topics: ["AI", "Marketing", "Automation"]
   ↓ sentiment: "positive"
   ↓ relevanceScore: 9

3. SEO Strategist consulta feeds
   ↓ Identifica oportunidad de keyword
   ↓ Crea brief para Content Writer

4. Content Writer genera artículo
   ↓ Usa información del feed
   ↓ Optimiza para SEO

5. Content Publisher formatea y publica
   ↓ Artículo en tu blog
```

**Comando para iniciar:**

```bash
# El flujo es automático, pero puedes forzarlo:
npm run workflow:content
```

### Flujo 2: Posts de Social Media Diarios

```
1. Feeds sincronizados con noticias del día
   ↓ 10 artículos nuevos

2. Enrichment identifica los 3 más relevantes
   ↓ relevanceScore: 8, 9, 7

3. Social Media Manager crea calendario
   ↓ Distribuye entre plataformas

4. LinkedIn Creator escribe post profesional
   ↓ Twitter Creator crea thread
   ↓ YouTube Scriptwriter genera script

5. Posts publicados en plataformas
   ↓ Con información fresca y relevante
```

**Comando para iniciar:**

```bash
npm run workflow:social
```

### Flujo 3: Monitoreo de Competencia

```
1. Feeds incluyen blogs de competidores
   ↓ Ejemplo: competitor.com/blog/feed

2. Enrichment detecta temas que cubren
   ↓ topics: ["Product Launch", "Feature X"]
   ↓ relevanceScore: 10

3. CMO recibe alerta (relevanceScore >= 8)
   ↓ Revisa el contenido

4. Content Director asigna respuesta
   ↓ "Crear nuestro artículo sobre Feature X"

5. Contenido de respuesta publicado
   ↓ Posicionamiento competitivo
```

---

## 📊 Monitoreo y Logs

### Dashboard de Convex

**URL:** https://dashboard.convex.dev

**Qué ver:**
- **Data → feeds**: Feeds configurados y estado
- **Data → feedItems**: Artículos sincronizados
- **Data → agents**: 37 agentes y su estado
- **Data → tasks**: Tareas ejecutadas por agentes
- **Logs**: Ejecuciones en tiempo real

### Logs Locales

**Ubicación:** `/home/tomas/Escritorio/amd/logs/`

**Archivos:**
```
logs/
├── enrich-20260128.log  # Logs del 28 de enero
├── enrich-20260127.log  # Logs del 27 de enero
└── ...                  # Últimos 7 días (auto-limpieza)
```

**Ver última ejecución:**

```bash
tail -50 logs/enrich-$(date +%Y%m%d).log
```

**Buscar errores:**

```bash
grep "❌" logs/enrich-$(date +%Y%m%d).log
```

**Ver resumen del día:**

```bash
grep "RESUMEN" logs/enrich-$(date +%Y%m%d).log -A 5
```

### Métricas Clave

| Métrica | Dónde Ver | Valor Esperado |
|---------|-----------|----------------|
| Feeds activos | Convex → feeds | 5-10 feeds |
| Items/día | Convex → feedItems | 50-100 items |
| Items enriquecidos | feedItems (processed: true) | 90%+ |
| Ejecuciones del cron | logs/ | 24/día (cada hora) |
| Errores | logs/ (grep "❌") | <5% |

---

## 🔧 Troubleshooting

### Problema: Cron no ejecuta

**Síntomas:**
- No hay logs nuevos en `logs/enrich-YYYYMMDD.log`
- Items con `processed: undefined` se acumulan

**Solución:**

```bash
# 1. Verificar que cron está instalado
crontab -l

# 2. Si no está, reinstalar
(crontab -l 2>/dev/null; echo "35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10") | crontab -

# 3. Probar manualmente
./scripts/cron-enrich.sh 1

# 4. Ver logs de errores
tail -50 logs/enrich-$(date +%Y%m%d).log
```

### Problema: "claude: command not found"

**Síntomas:**
- Logs muestran error al ejecutar Claude
- Enrichment falla

**Solución:**

```bash
# 1. Verificar instalación
which claude

# 2. Si no está, instalar
npm install -g @anthropic-ai/claude-code

# 3. Verificar versión
claude --version
```

### Problema: Items no se enriquecen

**Síntomas:**
- `processed` permanece `undefined`
- No aparecen `topics`, `sentiment`, etc.

**Diagnóstico:**

```bash
# 1. Verificar que hay items sin procesar
# Convex dashboard → feedItems → filter: processed = undefined

# 2. Ejecutar enrichment manualmente
npm run enrich 1

# 3. Ver logs en detalle
cat logs/enrich-$(date +%Y%m%d).log

# 4. Si falla, revisar prompt o conexión
```

**Posibles causas:**
- Claude CLI no configurado
- Prompt devuelve JSON inválido
- Items no tienen contenido (title vacío)

### Problema: Feeds no sincronizan

**Síntomas:**
- `feedItems` no crece
- Última sincronización antigua

**Solución:**

```bash
# 1. Verificar feeds activos
# Convex dashboard → feeds → status = "active"

# 2. Verificar URL del feed es válida
curl -I https://techcrunch.com/feed/

# 3. Forzar sincronización manual
npx convex run feeds:syncAllFeeds:syncAllFeeds

# 4. Ver logs de Convex
# Dashboard → Logs → filtrar "feeds"
```

### Problema: Logs crecen demasiado

**Síntomas:**
- Directorio `logs/` ocupa mucho espacio

**Solución:**

Los logs se auto-limpian después de 7 días, pero puedes limpiar manualmente:

```bash
# Eliminar logs de más de 3 días
find logs/ -name "enrich-*.log" -mtime +3 -delete

# Ver espacio usado
du -sh logs/
```

### Problema: Cron ejecuta pero no procesa nada

**Síntomas:**
- Logs muestran "0 items encontrados"
- `feedItems` tiene items con `processed: undefined`

**Diagnóstico:**

```bash
# 1. Verificar query en Convex
# Dashboard → Data → feedItems
# Buscar: processed = undefined

# 2. Si hay items, verificar index
# Dashboard → Data → feedItems → Indexes
# Debe existir: by_processed

# 3. Si no existe, regenerar schema
npx convex dev
```

---

## 📚 Referencia Rápida

### Comandos Más Usados

```bash
# Backend Convex
npx convex dev              # Iniciar backend (dejar corriendo)
npx convex deploy           # Deploy a producción
npx convex logs             # Ver logs en tiempo real

# Enrichment
npm run enrich              # Procesar 10 items
npm run enrich 5            # Procesar 5 items
./scripts/cron-enrich.sh 1  # Simular ejecución de cron

# Monitoreo
tail -f logs/enrich-$(date +%Y%m%d).log  # Ver logs en vivo
crontab -l                  # Ver cron configurado
grep "❌" logs/*.log        # Buscar errores

# Agentes
npm run agent:blog          # Escribir blog
npm run agent:linkedin      # Crear post LinkedIn
npm run workflow:content    # Flujo completo de contenido
npm run workflow:social     # Flujo completo de social media

# Frontend (opcional)
cd ai-marketing-department/ai-marketing-department
npm run dev                 # Dashboard en localhost:3000
```

### Estructura de Directorios

```
/home/tomas/Escritorio/amd/
├── convex/                     # Backend Convex
│   ├── schema.ts               # Modelo de datos
│   ├── feeds/                  # Módulo de feeds
│   ├── enrichment/             # Módulo de enrichment
│   ├── actions.ts              # Actions de agentes
│   ├── seed.ts                 # 37 agentes
│   └── crons.ts                # Crons de Convex
├── scripts/                    # Scripts locales
│   ├── enrich-with-claude-code.ts  # Enrichment local
│   ├── cron-enrich.sh          # Wrapper para cron
│   ├── README.md               # Docs de scripts
│   └── CRON-SETUP.md           # Docs de cron
├── logs/                       # Logs del cron (auto-generado)
│   └── enrich-YYYYMMDD.log     # Logs diarios
├── .planning/                  # Docs del proyecto (GSD)
│   ├── PROJECT.md              # Descripción del proyecto
│   ├── ROADMAP.md              # Roadmap de fases
│   └── STATE.md                # Estado actual
├── ai-marketing-department/    # Frontend (opcional)
│   └── ai-marketing-department/
│       ├── app/                # Next.js App Router
│       └── components/         # Componentes React
├── CLAUDE.md                   # Guía técnica
├── ONBOARDING.md               # Este documento
└── package.json                # Dependencias
```

### Tablas de Convex

| Tabla | Descripción | Registros Típicos |
|-------|-------------|-------------------|
| `feeds` | URLs RSS configurados | 5-10 |
| `feedItems` | Artículos sincronizados | 100-500 |
| `agents` | 37 agentes de IA | 37 |
| `tasks` | Tareas ejecutadas | 100-1000 |
| `executions` | Log de ejecuciones | 100-1000 |
| `content` | Contenido generado | 50-200 |
| `campaigns` | Campañas multicanal | 10-50 |

### Campos Importantes

**feedItems:**
```typescript
{
  // De RSS:
  title: string
  link: string
  summary?: string
  content?: string
  publishedAt: number

  // De enrichment:
  topics?: string[]
  sentiment?: "positive" | "neutral" | "negative"
  aiSummary?: string
  relevanceScore?: number  // 0-10
  processed?: boolean      // undefined | true | false
  processedAt?: number
  processingError?: string
}
```

**agents:**
```typescript
{
  agentId: string           // Ej: "content-001"
  name: string              // Ej: "Blog Content Writer"
  department: string        // Ej: "content"
  status: string            // active | paused | error
  config: {
    systemPrompt: string
    model: string
    temperature: number
    tools: string[]         // Ej: ["feeds", "search"]
  }
}
```

---

## 🎓 Mejores Prácticas

### 1. Mantén los Feeds Relevantes

✅ **Hacer:**
- Agregar feeds de fuentes confiables
- Revisar regularmente la calidad de los artículos
- Usar categorías para organizar feeds

❌ **Evitar:**
- Agregar feeds de baja calidad o spam
- Tener demasiados feeds (>20 puede saturar)
- Feeds que no publican frecuentemente

### 2. Monitorea el Enrichment

✅ **Hacer:**
- Revisar logs semanalmente: `grep "RESUMEN" logs/*.log`
- Verificar que `relevanceScore` es preciso
- Ajustar batch size según necesidad

❌ **Evitar:**
- Ignorar errores acumulados
- Procesar más items de los necesarios (costo)
- Dejar items sin procesar por días

### 3. Usa los Agentes Estratégicamente

✅ **Hacer:**
- Dar a los agentes acceso a feeds (`tools: ["feeds"]`)
- Usar handoffs para coordinar entre agentes
- Revisar contenido generado antes de publicar

❌ **Evitar:**
- Ejecutar agentes sin contexto actualizado
- Publicar sin revisión humana
- Sobrecargar con tareas simultáneas

### 4. Mantén el Sistema Actualizado

✅ **Hacer:**
```bash
# Actualizar dependencias mensualmente
npm update

# Regenerar tipos de Convex
npx convex codegen

# Verificar logs de errores
grep "❌" logs/*.log
```

❌ **Evitar:**
- Ignorar errores en logs
- No actualizar dependencias
- Desactivar el cron sin motivo

---

## 🚀 Próximos Pasos

Ahora que entiendes cómo funciona AMD:

1. ✅ **Verifica que todo está corriendo:**
   ```bash
   # Backend
   npx convex dev

   # Ver próxima ejecución del cron
   crontab -l
   ```

2. ✅ **Agrega tus feeds favoritos:**
   - Convex Dashboard → Data → feeds → Insert
   - O usa: `npx convex run feeds:mutations:addFeed`

3. ✅ **Espera la primera sincronización:**
   - Próxima ejecución: a las :05 de la próxima hora
   - Enrichment: a las :35

4. ✅ **Revisa los resultados:**
   ```bash
   tail -f logs/enrich-$(date +%Y%m%d).log
   ```

5. ✅ **Ejecuta tu primer agente:**
   ```bash
   npm run agent:linkedin
   ```

---

## 📞 Soporte

- **Documentación técnica:** `CLAUDE.md`
- **Configuración de cron:** `scripts/CRON-SETUP.md`
- **Scripts locales:** `scripts/README.md`
- **Estado del proyecto:** `.planning/STATE.md`
- **Roadmap:** `.planning/ROADMAP.md`

---

## ✨ Resumen

**AMD automatiza completamente tu departamento de marketing:**

1. 🔄 **Feeds sincronizados** cada hora con información fresca
2. 🤖 **Enrichment automático** con IA (topics, sentiment, relevancia)
3. 💰 **Costo $0** usando Claude Code MAX
4. 👥 **37 agentes** listos para crear contenido actualizado
5. 📊 **Monitoreo completo** con logs y dashboard

**Todo funciona automáticamente 24/7. No necesitas intervenir.**

¡Bienvenido a tu departamento de marketing automatizado! 🎉
