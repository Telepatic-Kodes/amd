# Configuración de Cron para Enriquecimiento Automático

## Estado Actual

✅ **Cron configurado y activo**

El sistema ejecutará automáticamente el enriquecimiento cada hora a los **:35 minutos**.

## Detalles de la Configuración

### Cron Job

```bash
35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10
```

**¿Qué significa?**
- `35`: Minuto 35 de cada hora
- `*`: Todas las horas
- `*`: Todos los días
- `*`: Todos los meses
- `*`: Todos los días de la semana
- `10`: Procesar 10 items por ejecución

### Horario de Ejecución

El cron ejecuta cada hora:
```
00:35 → Procesa 10 items
01:35 → Procesa 10 items
02:35 → Procesa 10 items
...
23:35 → Procesa 10 items
```

**Total por día:** 24 ejecuciones × 10 items = **240 items/día máximo**

### ¿Por qué :35?

El cron está sincronizado con los crons de Convex:
- **:05** → Feed sync (Convex cron)
- **:35** → Enrichment (30 min después) ← Aquí ejecuta el cron local

Este offset de 30 minutos asegura que los items ya estén sincronizados antes de enriquecerlos.

## Archivos del Sistema

### Script Principal

**`scripts/enrich-with-claude-code.ts`**
- Query items sin procesar
- Ejecuta Claude Code localmente
- Guarda resultados en Convex

### Script Wrapper

**`scripts/cron-enrich.sh`**
- Configura ambiente (PATH, Node, NVM)
- Ejecuta el script de enrichment
- Guarda logs
- Limpia logs antiguos (>7 días)

### Logs

**Ubicación:** `/home/tomas/Escritorio/amd/logs/enrich-YYYYMMDD.log`

**Formato de nombre:**
- `enrich-20260128.log` → Logs del 28 de enero de 2026
- Se crea un archivo por día
- Logs antiguos (>7 días) se eliminan automáticamente

## Comandos Útiles

### Ver Cron Activo

```bash
crontab -l
```

### Ver Logs en Tiempo Real

```bash
# Última ejecución
tail -50 logs/enrich-$(date +%Y%m%d).log

# Seguir logs en vivo
tail -f logs/enrich-$(date +%Y%m%d).log
```

### Probar Manualmente

```bash
# Ejecutar el wrapper (simula cron)
./scripts/cron-enrich.sh 5

# Ejecutar directamente (sin logging de cron)
npm run enrich 5
```

### Deshabilitar Cron Temporalmente

```bash
# Ver cron actual
crontab -l

# Editar (comentar línea con #)
crontab -e

# O eliminar completamente
crontab -r
```

### Re-instalar Cron

```bash
(crontab -l 2>/dev/null; echo ""; echo "# AMD Feed Enrichment - Hourly at :35"; echo "35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10") | crontab -
```

## Modificar Frecuencia

### Cada 2 Horas

```bash
# Editar cron
crontab -e

# Cambiar a:
35 */2 * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10
```

### Solo Horario Laboral (9am-6pm)

```bash
35 9-18 * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10
```

### Solo Días Laborales (Lun-Vie)

```bash
35 * * * 1-5 /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 10
```

### Aumentar Batch Size

```bash
# Procesar 20 items en lugar de 10
35 * * * * /home/tomas/Escritorio/amd/scripts/cron-enrich.sh 20
```

## Monitoreo

### Ver Próxima Ejecución

El cron ejecutará en el próximo minuto :35 de la hora actual.

Ejemplo: Si ahora son las 14:20, la próxima ejecución será a las 14:35 (en 15 minutos).

### Verificar Estado del Cron

```bash
# Ver logs del sistema de cron
sudo grep CRON /var/log/syslog | tail -20

# Ver si el cron está corriendo
pgrep -a cron
```

### Verificar Última Ejecución

```bash
# Ver timestamp del último log
ls -lh logs/enrich-*.log | tail -1

# Ver resumen de última ejecución
tail -20 logs/enrich-$(date +%Y%m%d).log | grep "RESUMEN" -A 5
```

## Troubleshooting

### Cron no ejecuta

1. **Verificar que cron está activo:**
   ```bash
   sudo systemctl status cron
   ```

2. **Ver logs de errores:**
   ```bash
   tail -50 logs/enrich-$(date +%Y%m%d).log
   ```

3. **Probar manualmente:**
   ```bash
   ./scripts/cron-enrich.sh 1
   ```

### Error: "claude: command not found"

El cron no tiene el mismo PATH que tu terminal. El script wrapper maneja esto, pero si falla:

1. **Verificar que Claude está instalado:**
   ```bash
   which claude
   ```

2. **Instalar globalmente:**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. **O editar cron-enrich.sh y agregar PATH:**
   ```bash
   export PATH="/home/tomas/.local/bin:$PATH"
   ```

### Error: "Node no está en PATH"

1. **Si usas nvm**, el script ya lo detecta automáticamente
2. **Si usas Node global**, verifica:
   ```bash
   which node
   # Agregar ese path a cron-enrich.sh si es necesario
   ```

### Logs no se crean

1. **Verificar permisos:**
   ```bash
   ls -la logs/
   chmod 755 logs/
   ```

2. **Crear manualmente:**
   ```bash
   mkdir -p logs
   touch logs/enrich-$(date +%Y%m%d).log
   ```

## Desinstalar

Para eliminar completamente el cron:

```bash
# Ver cron actual
crontab -l

# Eliminar todo el crontab
crontab -r

# O editar y borrar solo la línea de AMD
crontab -e
```

## Costo y Rendimiento

| Métrica | Valor |
|---------|-------|
| **Frecuencia** | Cada hora |
| **Items/ejecución** | 10 (configurable) |
| **Items/día máx** | 240 |
| **Costo** | $0 (plan MAX) |
| **Logs retenidos** | 7 días |

## Notas

- El cron se mantiene activo incluso después de reiniciar
- Los logs se limpian automáticamente después de 7 días
- El cron continúa aunque cierres la terminal
- Usa tu plan de Claude Code MAX (sin consumir API tokens)
