# ⚡ Quick Start Guide - AMD

Guía de 5 minutos para empezar a usar el sistema.

---

## 🎯 Lo Que Hace AMD (en 30 segundos)

```
Feeds RSS → Convex (cada hora :05)
    ↓
Enriquecimiento con IA (cada hora :35)
    ↓
37 Agentes crean contenido actualizado
```

**Costo:** $0 (usa Claude Code MAX)
**Automatización:** 100% (no requiere intervención)

---

## ✅ Checklist de Configuración

```bash
# 1. Backend corriendo
npx convex dev
# ✅ Mantener abierto en un terminal

# 2. Cron configurado
crontab -l
# ✅ Debe mostrar: 35 * * * * .../cron-enrich.sh 10

# 3. Claude Code instalado
claude --version
# ✅ Debe mostrar versión

# 4. Logs funcionando
ls -la logs/
# ✅ Debe existir el directorio
```

---

## 📊 Verificar que Todo Funciona

### Dashboard de Convex

1. Ir a: https://dashboard.convex.dev
2. Seleccionar tu proyecto
3. Verificar:
   - **Data → feeds**: 5-10 feeds activos
   - **Data → feedItems**: Items con `processed: true`
   - **Data → agents**: 37 agentes activos

### Logs Locales

```bash
# Ver última ejecución
tail -50 logs/enrich-$(date +%Y%m%d).log

# Buscar errores
grep "❌" logs/*.log
```

---

## 🚀 Comandos Más Usados

### Monitoreo Diario

```bash
# Ver logs en vivo
tail -f logs/enrich-$(date +%Y%m%d).log

# Ver resumen del día
grep "RESUMEN" logs/enrich-$(date +%Y%m%d).log -A 5

# Ver feeds activos
# Dashboard Convex → Data → feeds
```

### Ejecución Manual

```bash
# Procesar 5 items ahora (no esperar al cron)
npm run enrich 5

# Simular ejecución del cron
./scripts/cron-enrich.sh 1
```

### Ejecutar Agentes

```bash
# Crear post de LinkedIn
npm run agent:linkedin

# Escribir artículo de blog
npm run agent:blog

# Flujo completo de contenido
npm run workflow:content
```

---

## 🕐 Horarios Automáticos

| Hora | Acción | Sistema |
|------|--------|---------|
| :05 | Feed sync | Convex cron |
| :35 | Enrichment | Tu cron local |

**Ejemplo de un día típico:**
```
00:05 → Sincroniza feeds (Convex)
00:35 → Enriquece 10 items (Local)
01:05 → Sincroniza feeds (Convex)
01:35 → Enriquece 10 items (Local)
...
23:35 → Enriquece 10 items (Local)
```

**Total:** 240 items/día procesados con $0 costo

---

## 🔍 Flujo Básico de Uso

### 1. Agregar Feed (Una Vez)

```bash
# Desde Convex Dashboard:
# Data → feeds → Insert Document

# Ejemplo:
{
  "name": "TechCrunch",
  "url": "https://techcrunch.com/feed/",
  "category": "Technology",
  "status": "active"
}
```

### 2. Esperar Sincronización (Automático)

El sistema sincronizará en la próxima hora (:05).

### 3. Ver Artículos Enriquecidos

```bash
# Dashboard → Data → feedItems
# Filtrar: processed = true

# Verás:
{
  "title": "Latest AI Trends",
  "topics": ["AI", "Marketing"],
  "sentiment": "positive",
  "aiSummary": "Resumen...",
  "relevanceScore": 8
}
```

### 4. Usar en Agentes

Los agentes con `tools: ["feeds"]` pueden acceder automáticamente a esta información.

```bash
# Ejecutar agente con contexto actualizado
npm run agent:blog
```

---

## 📁 Estructura Simplificada

```
amd/
├── convex/              # Backend (Convex)
│   ├── feeds/           # Sincronización RSS
│   └── enrichment/      # Análisis con IA
├── scripts/             # Scripts locales
│   ├── enrich-with-claude-code.ts  # Enrichment
│   └── cron-enrich.sh   # Wrapper del cron
├── logs/                # Logs diarios
│   └── enrich-*.log     # Auto-generados
└── ONBOARDING.md        # Manual completo
```

---

## 🔧 Troubleshooting Rápido

### No hay items enriquecidos

```bash
# 1. Verificar cron
crontab -l

# 2. Ejecutar manualmente
npm run enrich 1

# 3. Ver logs
cat logs/enrich-$(date +%Y%m%d).log
```

### Feeds no sincronizan

```bash
# 1. Verificar feeds activos
# Dashboard → Data → feeds → status = "active"

# 2. Forzar sync
npx convex run feeds:syncAllFeeds:syncAllFeeds
```

### Claude no funciona

```bash
# Reinstalar Claude Code
npm install -g @anthropic-ai/claude-code

# Verificar
claude --version
```

---

## 📚 Documentación Completa

- **Manual completo:** `ONBOARDING.md` (este documento detallado)
- **Guía técnica:** `CLAUDE.md`
- **Configuración cron:** `scripts/CRON-SETUP.md`
- **Scripts:** `scripts/README.md`

---

## 💡 Tips Rápidos

✅ **Mantén Convex corriendo**: `npx convex dev` siempre activo en un terminal

✅ **Revisa logs diariamente**: `tail logs/enrich-$(date +%Y%m%d).log`

✅ **No modifiques el cron** a menos que sepas lo que haces

✅ **Agrega feeds de calidad**: Fuentes confiables = mejor contenido

❌ **No ejecutes enrichment manual constantemente**: El cron lo hace automático

❌ **No desactives el cron**: Perderás automatización

---

## 🎯 Checklist Diario

```bash
# Mañana (1 min):
tail -20 logs/enrich-$(date +%Y%m%d).log | grep "RESUMEN"
# ✅ Ver cuántos items se procesaron

# Convex Dashboard (2 min):
# ✅ feedItems → verificar nuevos artículos
# ✅ agents → verificar todos están activos

# Ejecutar agente (5 min):
npm run agent:linkedin
# ✅ Crear contenido con información actualizada
```

---

## 🚀 ¡Listo!

El sistema funciona automáticamente. Solo necesitas:

1. ✅ Mantener `npx convex dev` corriendo
2. ✅ Revisar logs ocasionalmente
3. ✅ Ejecutar agentes cuando necesites contenido

**Todo lo demás es automático 24/7.** 🎉

---

**¿Dudas?** Lee `ONBOARDING.md` para guía completa.
