# Scripts de Enriquecimiento Local

## Enriquecimiento con Claude Code

El script `enrich-with-claude-code.ts` permite ejecutar el enriquecimiento de feed items usando **tu plan de Claude Code MAX**, sin consumir tokens de tu API key de Anthropic.

### Requisitos

1. **Claude Code CLI instalado**: Verifica con `claude --version`
2. **Convex configurado**: Archivo `.env.local` con `CONVEX_URL`
3. **tsx instalado**: Se instala automáticamente con `npm install`

### Instalación

```bash
# Instalar dependencias (incluye tsx)
npm install
```

### Uso

```bash
# Procesar 10 items (default)
npm run enrich

# Procesar cantidad personalizada
npm run enrich 5     # Procesa 5 items
npm run enrich 20    # Procesa 20 items
```

### ¿Cómo funciona?

1. **Query a Convex**: Obtiene items sin procesar (`processed: undefined`)
2. **Enriquecimiento local**: Ejecuta `claude` CLI para cada item
3. **Parse JSON**: Extrae topics, sentiment, summary, relevanceScore
4. **Guarda en Convex**: Almacena resultados con `tokensUsed: 0`

### Ventajas

| Aspecto | API de Anthropic | Claude Code Local |
|---------|------------------|-------------------|
| **Costo** | $2/mes (100 items/día) | $0 (usa plan MAX) |
| **Tokens** | Consume de tu API key | Incluido en plan |
| **Ejecución** | Serverless (Convex crons) | Local (manual/cron) |
| **Velocidad** | Paralelo (potencial) | Secuencial |

### Automatización

#### Opción 1: Cron local (Linux/Mac)

```bash
# Ejecutar cada hora
crontab -e

# Agregar línea:
0 * * * * cd /home/tomas/Escritorio/amd && npm run enrich 10
```

#### Opción 2: Watch mode

```bash
# Ejecuta automáticamente cuando cambie Convex
npm run enrich:watch
```

#### Opción 3: Systemd timer (Linux)

```bash
# Crear servicio
sudo nano /etc/systemd/system/amd-enrich.service

[Unit]
Description=AMD Feed Enrichment

[Service]
Type=oneshot
User=tomas
WorkingDirectory=/home/tomas/Escritorio/amd
ExecStart=/usr/bin/npm run enrich 10

# Crear timer
sudo nano /etc/systemd/system/amd-enrich.timer

[Unit]
Description=AMD Enrichment Timer

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target

# Activar
sudo systemctl enable amd-enrich.timer
sudo systemctl start amd-enrich.timer
```

### Troubleshooting

#### Error: "claude: command not found"

```bash
# Verificar instalación de Claude Code
which claude

# Si no está instalado:
# https://docs.anthropic.com/claude-code/getting-started
```

#### Error: "CONVEX_URL no configurado"

```bash
# Verificar .env.local
cat .env.local | grep CONVEX_URL

# Si falta, agregar:
echo "CONVEX_URL=https://tu-deployment.convex.cloud" >> .env.local
```

#### Error: "No JSON found in response"

Claude Code puede devolver texto adicional. El script intenta extraer el JSON automáticamente, pero si falla:

1. Verifica que el prompt sea claro (incluye "Responde SOLO con JSON")
2. Revisa la salida de Claude manualmente: `echo "test prompt" | claude`

### Comparación con Crons de Convex

| Característica | Convex Crons | Script Local |
|----------------|--------------|--------------|
| **Configuración** | Ya configurado | Requiere cron/timer |
| **Costo** | $2/mes (Haiku 3.5) | $0 (plan MAX) |
| **Mantenimiento** | Automático | Manual |
| **Dependencias** | Solo API key | Claude Code CLI |
| **Escalabilidad** | Automática | Limitada por máquina |

### Recomendación

**Si tienes plan Claude Code MAX**: Usa este script local para $0 de costo.

**Si prefieres automatización total**: Usa los crons de Convex (requiere API key).

### Deshabilitar Crons de Convex (Opcional)

Si usas el script local, puedes deshabilitar los crons en `convex/crons.ts`:

```typescript
// Comentar estas líneas:
// crons.daily("enrich-feed-items", ...);
// crons.hourly("enrich-feed-items-hourly", ...);
```

Redeploy Convex: `npx convex deploy`
