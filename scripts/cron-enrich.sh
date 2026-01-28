#!/bin/bash
#
# Cron Wrapper para Enrichment Local
# Este script asegura que el ambiente esté configurado correctamente
# cuando se ejecuta desde cron (que tiene PATH limitado)
#

# Variables
PROJECT_DIR="/home/tomas/Escritorio/amd"
LOG_DIR="${PROJECT_DIR}/logs"
LOG_FILE="${LOG_DIR}/enrich-$(date +%Y%m%d).log"
BATCH_SIZE="${1:-10}"

# Crear directorio de logs si no existe
mkdir -p "${LOG_DIR}"

# Timestamp
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${LOG_FILE}"
echo "🕐 $(date '+%Y-%m-%d %H:%M:%S') - Iniciando enrichment" >> "${LOG_FILE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${LOG_FILE}"

# Cambiar al directorio del proyecto
cd "${PROJECT_DIR}" || {
  echo "❌ Error: No se puede acceder a ${PROJECT_DIR}" >> "${LOG_FILE}"
  exit 1
}

# Cargar ambiente de Node (si usas nvm)
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  echo "✅ NVM cargado" >> "${LOG_FILE}"
fi

# Verificar que Node está disponible
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node no está en PATH" >> "${LOG_FILE}"
  echo "PATH actual: $PATH" >> "${LOG_FILE}"
  exit 1
fi

echo "✅ Node version: $(node --version)" >> "${LOG_FILE}"
echo "✅ NPM version: $(npm --version)" >> "${LOG_FILE}"

# Verificar que Claude Code está disponible
if ! command -v claude &> /dev/null; then
  echo "❌ Error: Claude CLI no está instalado o no está en PATH" >> "${LOG_FILE}"
  echo "Instalar con: npm install -g @anthropic-ai/claude-code" >> "${LOG_FILE}"
  exit 1
fi

echo "✅ Claude Code disponible" >> "${LOG_FILE}"

# Ejecutar el script de enrichment
echo "" >> "${LOG_FILE}"
echo "🚀 Ejecutando enrichment (batch: ${BATCH_SIZE})..." >> "${LOG_FILE}"
echo "" >> "${LOG_FILE}"

npm run enrich ${BATCH_SIZE} >> "${LOG_FILE}" 2>&1
EXIT_CODE=$?

# Log de resultado
echo "" >> "${LOG_FILE}"
if [ ${EXIT_CODE} -eq 0 ]; then
  echo "✅ Enrichment completado exitosamente" >> "${LOG_FILE}"
else
  echo "❌ Enrichment falló con código: ${EXIT_CODE}" >> "${LOG_FILE}"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "${LOG_FILE}"
echo "" >> "${LOG_FILE}"

# Limpiar logs antiguos (mantener últimos 7 días)
find "${LOG_DIR}" -name "enrich-*.log" -type f -mtime +7 -delete

exit ${EXIT_CODE}
