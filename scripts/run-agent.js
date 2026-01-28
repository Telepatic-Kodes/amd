#!/usr/bin/env node
/**
 * Ejecutar agentes AMD usando Claude Code CLI
 * ¡USA TU PLAN MAX - SIN COSTOS DE API!
 *
 * Uso:
 *   node scripts/run-agent.js --agent social-001 --task create_linkedin_post --input '{"topic":"IA"}'
 */

const { execFileSync } = require("child_process");
require("dotenv").config({ path: ".env.local" });

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL no configurada en .env.local");
  process.exit(1);
}

async function convexQuery(path, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function convexMutation(path, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function runClaude(prompt) {
  try {
    const output = execFileSync("claude", ["--print", "-p", prompt], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
    });
    console.log(output);
    return output;
  } catch (error) {
    throw new Error(error.stderr || error.message || "Claude execution failed");
  }
}

function buildPrompt(taskType, input) {
  switch (taskType) {
    case "write_blog":
      return `Escribe un artículo de blog profesional:
Título: ${input.title || "Sin título"}
Keyword: ${input.keyword || "N/A"}
Palabras: ${input.wordCount || 800}

Devuelve SOLO el artículo en Markdown.`;

    case "create_linkedin_post":
      return `Crea un post de LinkedIn viral sobre: ${input.topic || input.title || "marketing"}
Objetivo: ${input.objective || "engagement"}

Incluye:
- Hook potente al inicio
- Espaciado estratégico
- Emojis relevantes
- CTA al final
- 3-5 hashtags

Devuelve SOLO el post, listo para copiar.`;

    case "create_twitter_thread":
      return `Crea un thread de Twitter/X sobre: ${input.topic || input.title}
Tweets: ${input.tweetCount || 5}

Formato: 1/ [tweet] 2/ [tweet] etc.
Devuelve SOLO los tweets numerados.`;

    default:
      return `Tarea: ${taskType}\nInput: ${JSON.stringify(input)}\nProporciona resultado estructurado.`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let agentId = "content-002";
  let taskType = "write_blog";
  let input = { title: "Test" };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--agent" || args[i] === "-a") agentId = args[++i];
    else if (args[i] === "--task" || args[i] === "-t") taskType = args[++i];
    else if (args[i] === "--input" || args[i] === "-i") input = JSON.parse(args[++i]);
    else if (args[i] === "--help") {
      console.log(`
Uso: node scripts/run-agent.js [opciones]

  --agent, -a   ID del agente
  --task, -t    Tipo de tarea
  --input, -i   JSON con parámetros

Ejemplo:
  node scripts/run-agent.js --agent social-001 --task create_linkedin_post --input '{"topic":"IA"}'
      `);
      process.exit(0);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("   AMD - AI Marketing Department");
  console.log("   💎 Usando Claude Code CLI (Plan Max - GRATIS)");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`🤖 Agente: ${agentId}`);
  console.log(`📋 Tarea: ${taskType}`);
  console.log(`📥 Input:`, JSON.stringify(input, null, 2));

  // Obtener config del agente
  console.log("\n⏳ Conectando con Convex...");
  const agentConfig = await convexQuery("agentSdk:getAgentConfig", { agentId });

  if (!agentConfig) {
    throw new Error(`Agente no encontrado: ${agentId}`);
  }

  console.log(`✅ Agente: ${agentConfig.name} (${agentConfig.department})`);
  console.log("\n⚡ Ejecutando con Claude Code...\n");
  console.log("─".repeat(60));

  try {
    const prompt = buildPrompt(taskType, input);
    const output = await runClaude(prompt);

    console.log("\n" + "─".repeat(60));
    console.log("\n✅ Ejecución completada!");

    // Guardar en Convex
    const result = await convexMutation("agentSdk:saveResult", {
      agentId,
      taskType,
      input,
      output,
      success: true,
    });

    console.log(`\n📊 Guardado: ${result.taskId}`);
    console.log(`💰 Costo: $0.00 (Plan Max)`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);

    await convexMutation("agentSdk:saveResult", {
      agentId,
      taskType,
      input,
      output: "",
      success: false,
      errorMessage: error.message,
    });

    process.exit(1);
  }
}

main().catch((err) => {
  console.error("💀 Error fatal:", err.message);
  process.exit(1);
});
