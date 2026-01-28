#!/usr/bin/env tsx
/**
 * Enrichment Script - Ejecuta con Claude Code local
 *
 * Este script reemplaza las actions de Convex que llaman a Anthropic API.
 * Usa tu plan de Claude Code MAX sin consumir tokens de API.
 *
 * Uso:
 *   npm run enrich        # Procesa 10 items (default)
 *   npm run enrich 5      # Procesa 5 items
 *
 * Puedes agregar este script a un cron local o ejecutarlo manualmente.
 *
 * @requires Claude Code CLI instalado globalmente
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { spawn } from "child_process";

// Configuración
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const BATCH_SIZE = parseInt(process.argv[2] || "10", 10);

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL no configurado en .env.local");
  process.exit(1);
}

// Cliente Convex
const client = new ConvexHttpClient(CONVEX_URL);

/**
 * Prompt para Claude Code (compatible con structured outputs)
 */
function buildEnrichmentPrompt(title: string, content: string): string {
  const truncated = content.slice(0, 2000);

  return `Analiza el siguiente artículo de marketing/tecnología y extrae:

**Título:** ${title}

**Contenido:**
${truncated}

Responde SOLO con un JSON válido en este formato:
{
  "topics": ["tema1", "tema2", "tema3"],
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "Resumen conciso en 1-2 oraciones",
  "relevanceScore": 0-10
}

Criterios:
- topics: 2-5 temas principales (ej: "AI", "Cloud Computing", "Marketing")
- sentiment: positive (oportunidad/éxito), neutral (informativo), negative (riesgo/problema)
- summary: Resumen ejecutivo en español, máx 200 caracteres
- relevanceScore: 0-10, donde 10 = muy relevante para marketing B2B tecnológico

Responde SOLO con el JSON, sin markdown ni explicaciones.`;
}

/**
 * Ejecuta Claude Code CLI con un prompt
 */
async function callClaudeCode(prompt: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";

    // Ejecuta: echo "prompt" | claude
    const claude = spawn("claude", ["--no-stream"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Enviar prompt a stdin
    claude.stdin.write(prompt);
    claude.stdin.end();

    // Capturar stdout
    claude.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Capturar stderr
    claude.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Manejar cierre
    claude.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Claude Code failed: ${errorOutput}`));
        return;
      }

      try {
        // Extraer JSON de la respuesta (puede tener texto antes/después)
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          reject(new Error(`No JSON found in response: ${output}`));
          return;
        }

        const result = JSON.parse(jsonMatch[0]);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse JSON: ${output}`));
      }
    });
  });
}

/**
 * Enriquece un solo feed item
 */
async function enrichItem(item: any): Promise<void> {
  try {
    console.log(`  ⚙️  Procesando: ${item.title.slice(0, 60)}...`);

    // Construir prompt
    const content = item.content || item.summary || item.title;
    const prompt = buildEnrichmentPrompt(item.title, content);

    // Llamar a Claude Code localmente (usa tu plan MAX)
    const enrichment = await callClaudeCode(prompt);

    // Validar respuesta
    if (!enrichment.topics || !enrichment.sentiment || !enrichment.summary) {
      throw new Error("Respuesta incompleta de Claude");
    }

    // Guardar en Convex
    await client.mutation(api.enrichment.mutations.storeEnrichment, {
      itemId: item._id,
      topics: enrichment.topics,
      sentiment: enrichment.sentiment,
      aiSummary: enrichment.summary,
      relevanceScore: enrichment.relevanceScore,
      tokensUsed: 0, // No consumimos tokens de API
    });

    console.log(`  ✅ Completado: score=${enrichment.relevanceScore}, topics=${enrichment.topics.join(",")}`);
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);

    // Marcar como fallido
    await client.mutation(api.enrichment.mutations.markFailed, {
      itemId: item._id,
      error: error.message,
    });
  }
}

/**
 * Proceso principal
 */
async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 ENRICHMENT LOCAL CON CLAUDE CODE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  console.log(`💰 Costo: $0 (usa plan Claude Code MAX)\n`);

  // 1. Obtener items sin procesar
  console.log("🔍 Buscando items sin procesar...");
  const items = await client.query(api.enrichment.queries.getUnprocessedItems, {
    limit: BATCH_SIZE,
  });

  if (items.length === 0) {
    console.log("✨ No hay items pendientes de enriquecer\n");
    return;
  }

  console.log(`📋 Encontrados ${items.length} items\n`);

  // 2. Procesar items secuencialmente
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await enrichItem(item);
      processed++;
    } catch (error) {
      failed++;
    }
  }

  // 3. Resumen
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 RESUMEN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`  ✅ Procesados: ${processed}`);
  console.log(`  ❌ Fallidos: ${failed}`);
  console.log(`  💰 Costo total: $0.00 (plan MAX)\n`);
}

// Ejecutar
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error fatal:", error.message);
    process.exit(1);
  });
