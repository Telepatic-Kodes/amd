# 🤖 AI Marketing Department (AMD)

Sistema automatizado de **37 Agentes de IA** que gestionan un departamento de marketing completo, con sincronización de feeds RSS y enriquecimiento automático mediante IA.

---

## 🚀 Inicio Rápido

### Para Nuevos Usuarios

**Onboarding completo (20 min):**
```bash
cat ONBOARDING.md
```

**Quick start (5 min):**
```bash
cat QUICK-START.md
```

### Para Usuarios Existentes

```bash
# 1. Backend (mantener corriendo)
npx convex dev

# 2. Ver estado del sistema
tail -f logs/enrich-$(date +%Y%m%d).log

# 3. Ejecutar agente
npm run agent:linkedin
```

---

## 📚 Documentación

| Documento | Propósito | Audiencia |
|-----------|-----------|-----------|
| **ONBOARDING.md** | Manual completo con explicaciones | Nuevos usuarios |
| **QUICK-START.md** | Guía de 5 minutos | Referencia rápida |
| **CLAUDE.md** | Especificaciones técnicas | Desarrolladores |
| **scripts/CRON-SETUP.md** | Configuración de automatización | Administradores |
| **scripts/README.md** | Uso de scripts locales | DevOps |

---

## ⚡ Qué Hace el Sistema

```
┌──────────────────────────────────────────────────┐
│  1. Sincroniza feeds RSS cada hora (:05)         │
│     ↓ TechCrunch, HubSpot, Moz, etc.            │
│  2. Enriquece con IA cada hora (:35)             │
│     ↓ Topics, sentiment, relevancia              │
│  3. 37 Agentes crean contenido                   │
│     ↓ Blogs, social media, ads, SEO              │
│  4. Todo automático 24/7                         │
│     ✅ Costo: $0 (Claude Code MAX)              │
└──────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitectura

```
Feeds RSS → Convex (serverless) → Cron Local (enrichment) → 37 Agentes
              ↓                           ↓
         feedItems                 Claude Code CLI
         (artículos)                 ($0 costo)
```

**Tecnologías:**
- **Backend:** Convex (base de datos + serverless)
- **Enrichment:** Claude Code CLI (local)
- **Agentes:** Claude API (Anthropic)
- **Frontend:** Next.js 16 + React 19 (opcional)

---

## 🎯 Características Principales

### ✅ Feed Sync
- Sincronización automática cada hora
- Soporte para RSS/Atom
- Deduplicación inteligente
- Rate limiting y retry automático

### ✅ AI Enrichment
- Topics (2-5 temas principales)
- Sentiment (positive/neutral/negative)
- AI Summary (resumen ejecutivo en español)
- Relevance Score (0-10)
- **Costo:** $0 (usa plan Claude Code MAX)

### ✅ 37 Agentes Especializados
- 👔 Leadership (1): CMO
- ✍️ Content (6): Writers, editores
- 📱 Social Media (8): LinkedIn, Twitter, YouTube
- 📈 Demand Gen (7): Paid ads, performance
- 🔍 SEO (5): Keywords, backlinks, technical
- 🎨 Brand & Creative (4): Diseño, assets
- ⚙️ Marketing Ops (5): Email, automation

### ✅ Automatización Completa
- Crons de Convex (feed sync)
- Cron local (enrichment)
- Handoffs entre agentes
- Logs y monitoreo

---

## 📦 Instalación

### Requisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Claude Code CLI instalado (`npm install -g @anthropic-ai/claude-code`)
- Cuenta en Convex (gratis)

### Setup (5 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Convex
npx convex dev
# Deja este terminal abierto

# 3. Verificar cron local
crontab -l
# Debe mostrar: 35 * * * * .../cron-enrich.sh 10

# 4. (Opcional) Cargar agentes
npx convex run seed:seedAgents

# 5. (Opcional) Levantar dashboard
cd ai-marketing-department/ai-marketing-department
npm install && npm run dev
# http://localhost:3000
```

**Listo!** El sistema está funcionando automáticamente.

---

## 🔄 Flujo de Trabajo Típico

### Ejemplo: Crear Post de LinkedIn

```bash
# 1. Sistema ya sincronizó feeds (automático)
# 2. Sistema ya enriqueció artículos (automático)

# 3. Ejecutar agente de LinkedIn
npm run agent:linkedin

# 4. Revisar contenido generado
# Dashboard → Content → Últimos posts

# 5. Publicar (manual o automático)
```

### Ejemplo: Blog Post Basado en Tendencias

```bash
# 1. Ver artículos más relevantes
# Dashboard → Feed Items → Sort by relevanceScore

# 2. Ejecutar workflow de contenido
npm run workflow:content

# 3. Revisar y publicar
```

---

## 📊 Monitoreo

### Dashboard de Convex
```
https://dashboard.convex.dev
├── Data → feeds (feeds configurados)
├── Data → feedItems (artículos enriquecidos)
├── Data → agents (37 agentes)
└── Logs (ejecuciones en tiempo real)
```

### Logs Locales
```bash
# Ver última ejecución
tail -50 logs/enrich-$(date +%Y%m%d).log

# Seguir en vivo
tail -f logs/enrich-$(date +%Y%m%d).log

# Buscar errores
grep "❌" logs/*.log
```

---

## 🛠️ Comandos Útiles

### Backend
```bash
npx convex dev              # Modo desarrollo (watch)
npx convex deploy           # Deploy a producción
npx convex logs             # Ver logs en tiempo real
npx convex dashboard        # Abrir dashboard
```

### Enrichment
```bash
npm run enrich              # Procesar 10 items
npm run enrich 5            # Procesar 5 items
./scripts/cron-enrich.sh 1  # Simular cron (1 item)
```

### Agentes
```bash
npm run agent:blog          # Blog writer
npm run agent:linkedin      # LinkedIn creator
npm run agent:twitter       # Twitter creator
npm run workflow:content    # Flujo completo de contenido
npm run workflow:social     # Flujo completo de social media
```

### Monitoreo
```bash
crontab -l                  # Ver cron configurado
tail -f logs/enrich-*.log   # Ver logs en vivo
grep "RESUMEN" logs/*.log   # Ver resúmenes
```

---

## 🔧 Configuración

### Agregar Feed RSS

```bash
# Desde Convex Dashboard:
# Data → feeds → Insert Document

{
  "name": "TechCrunch",
  "url": "https://techcrunch.com/feed/",
  "category": "Technology",
  "status": "active"
}
```

### Modificar Frecuencia del Cron

```bash
# Editar cron
crontab -e

# Ejemplos:
35 */2 * * *    # Cada 2 horas
35 9-18 * * *   # Solo horario laboral
35 * * * 1-5    # Solo días laborales
```

### Cambiar Batch Size

```bash
# Editar cron (cambiar el último número)
35 * * * * .../cron-enrich.sh 20  # Procesar 20 items
```

---

## 📈 Rendimiento y Costos

| Métrica | Valor |
|---------|-------|
| **Feeds soportados** | Ilimitados (recomendado: 5-10) |
| **Items/día** | 50-100 típico, 240 máximo |
| **Costo de enrichment** | $0 (plan Claude Code MAX) |
| **Costo de Convex** | Free tier suficiente |
| **Costo de agentes** | Variable (Claude API) |
| **Uptime** | 24/7 automático |

---

## 🐛 Troubleshooting

### Problema Común #1: Cron no ejecuta

```bash
# Verificar instalación
crontab -l

# Reinstalar
(crontab -l 2>/dev/null; echo "35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10") | crontab -

# Probar manualmente
./scripts/cron-enrich.sh 1
```

### Problema Común #2: Items no se enriquecen

```bash
# Verificar Claude Code
claude --version

# Ejecutar manualmente
npm run enrich 1

# Ver logs
cat logs/enrich-$(date +%Y%m%d).log
```

### Problema Común #3: Feeds no sincronizan

```bash
# Forzar sincronización
npx convex run feeds:syncAllFeeds:syncAllFeeds

# Verificar logs de Convex
npx convex logs
```

**Ver más:** `ONBOARDING.md` → Sección Troubleshooting

---

## 📁 Estructura del Proyecto

```
amd/
├── convex/                 # Backend Convex
│   ├── schema.ts           # Modelo de datos
│   ├── feeds/              # Módulo de feeds RSS
│   ├── enrichment/         # Módulo de enrichment
│   ├── actions.ts          # Agentes
│   ├── seed.ts             # 37 agentes pre-configurados
│   └── crons.ts            # Crons automáticos
├── scripts/                # Scripts locales
│   ├── enrich-with-claude-code.ts  # Enrichment con Claude Code
│   ├── cron-enrich.sh      # Wrapper del cron
│   ├── README.md           # Docs de scripts
│   └── CRON-SETUP.md       # Docs de cron
├── logs/                   # Logs del cron (auto-generado)
│   └── enrich-*.log        # Logs diarios
├── .planning/              # Documentación del proyecto
│   ├── PROJECT.md          # Descripción
│   ├── ROADMAP.md          # Roadmap de fases
│   └── STATE.md            # Estado actual
├── ai-marketing-department/  # Frontend Next.js (opcional)
├── ONBOARDING.md           # Manual completo (EMPIEZA AQUÍ)
├── QUICK-START.md          # Guía de 5 minutos
├── CLAUDE.md               # Guía técnica
└── README.md               # Este archivo
```

---

## 🎓 Aprendizaje

### Para Nuevos Usuarios
1. Lee `ONBOARDING.md` (20 min)
2. Sigue `QUICK-START.md` (5 min)
3. Ejecuta tu primer agente: `npm run agent:linkedin`

### Para Desarrolladores
1. Lee `CLAUDE.md` → Arquitectura técnica
2. Revisa `convex/schema.ts` → Modelo de datos
3. Explora `convex/enrichment/` → Implementación

### Para DevOps
1. Lee `scripts/CRON-SETUP.md` → Automatización
2. Revisa `scripts/cron-enrich.sh` → Script del cron
3. Configura monitoreo de logs

---

## 🤝 Contribuir

Este es un proyecto privado de AIAIAI Consulting.

Para reportar bugs o sugerir mejoras, contacta al equipo.

---

## 📄 Licencia

UNLICENSED - Uso privado únicamente.

---

## 🎉 Próximos Pasos

1. **Lee el onboarding:** `cat ONBOARDING.md`
2. **Verifica el sistema:** `npx convex dev` + `crontab -l`
3. **Agrega feeds:** Dashboard → feeds → Insert
4. **Ejecuta tu primer agente:** `npm run agent:linkedin`

---

**¿Preguntas?** Consulta `ONBOARDING.md` para guía completa.

**Sistema activo:** Feed sync cada hora (:05), enrichment cada hora (:35) 🚀
