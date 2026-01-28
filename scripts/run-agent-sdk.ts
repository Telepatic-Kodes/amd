#!/usr/bin/env ts-node
/**
 * Ejecutar agentes AMD usando Claude Code CLI
 * ¡USA TU PLAN MAX - SIN COSTOS DE API!
 *
 * Uso:
 *   npm run agent -- --agent content-002 --task write_blog --input '{"title":"Mi Blog"}'
 */

import { spawn } from "child_process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { config } from "dotenv";

config({ path: ".env.local" });

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: CONVEX_URL no configurada");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

interface AgentTask {
  agentId: string;
  taskType: string;
  input: Record<string, any>;
}

async function runAgentWithClaude(task: AgentTask): Promise<string> {
  return new Promise((resolve, reject) => {
    const prompt = buildPrompt(task.taskType, task.input);

    // Usar claude CLI con --print para output directo
    const claude = spawn("claude", ["--print", "-p", prompt], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let error = "";

    claude.stdout.on("data", (data) => {
      const text = data.toString();
      process.stdout.write(text);
      output += text;
    });

    claude.stderr.on("data", (data) => {
      error += data.toString();
    });

    claude.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Claude exited with code ${code}`));
      }
    });

    claude.on("error", (err) => {
      reject(err);
    });
  });
}

async function runAgent(task: AgentTask) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("   AMD - AI Marketing Department");
  console.log("   💎 Usando Claude Code CLI (Plan Max - GRATIS)");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`🤖 Agente: ${task.agentId}`);
  console.log(`📋 Tarea: ${task.taskType}`);
  console.log(`📥 Input:`, JSON.stringify(task.input, null, 2));

  // Obtener configuración del agente desde Convex
  console.log("\n⏳ Obteniendo configuración del agente...");

  const agentConfig = await convex.query(api.agentSdk.getAgentConfig, {
    agentId: task.agentId,
  });

  if (!agentConfig) {
    throw new Error(`Agente no encontrado: ${task.agentId}`);
  }

  console.log(`✅ Agente: ${agentConfig.name} (${agentConfig.department})`);
  console.log("\n⚡ Ejecutando con Claude Code...\n");
  console.log("─".repeat(60));

  try {
    const output = await runAgentWithClaude(task);

    console.log("\n" + "─".repeat(60));
    console.log("\n✅ Ejecución completada!");

    // Guardar resultado en Convex
    const result = await convex.mutation(api.agentSdk.saveResult, {
      agentId: task.agentId,
      taskType: task.taskType,
      input: task.input,
      output,
      success: true,
    });

    console.log(`\n📊 Guardado: ${result.taskId}`);
    console.log(`💰 Costo: $0.00 (Plan Max)`);

    return result;
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);

    await convex.mutation(api.agentSdk.saveResult, {
      agentId: task.agentId,
      taskType: task.taskType,
      input: task.input,
      output: "",
      success: false,
      errorMessage: error.message,
    });

    throw error;
  }
}

function buildPrompt(taskType: string, input: Record<string, any>): string {
  switch (taskType) {
    case "write_blog":
      return `Escribe un artículo de blog profesional:
Título: ${input.title || "Sin título"}
Keyword: ${input.keyword || "N/A"}
Palabras: ${input.wordCount || 800}
Tono: ${input.tone || "profesional"}

Devuelve SOLO el artículo en Markdown, sin explicaciones adicionales.`;

    case "create_linkedin_post":
      return `Crea un post de LinkedIn viral sobre: ${input.topic || input.title || "marketing"}
Objetivo: ${input.objective || "engagement"}

Incluye:
- Hook potente en las primeras líneas
- Espaciado estratégico
- Emojis relevantes (no excesivos)
- CTA al final
- 3-5 hashtags

Devuelve SOLO el post, listo para copiar y pegar.`;

    case "create_twitter_thread":
      return `Crea un thread de Twitter/X sobre: ${input.topic || input.title}
Tweets: ${input.tweetCount || 5}

Formato:
1/ [primer tweet - hook]
2/ [desarrollo]
...
Último/ [CTA]

Devuelve SOLO los tweets numerados.`;

    default:
      return `Tarea de marketing: ${taskType}
Input: ${JSON.stringify(input)}
Proporciona un resultado estructurado.`;
  }
}

function parseArgs(): AgentTask {
  const args = process.argv.slice(2);
  let agentId = "content-002";
  let taskType = "write_blog";
  let input: Record<string, any> = { title: "Artículo de Prueba" };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--agent" || args[i] === "-a") agentId = args[++i];
    else if (args[i] === "--task" || args[i] === "-t") taskType = args[++i];
    else if (args[i] === "--input" || args[i] === "-i") input = JSON.parse(args[++i]);
    else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Uso: npm run agent -- [opciones]

Opciones:
  --agent, -a   ID del agente (content-002, social-001, etc.)
  --task, -t    Tipo de tarea
  --input, -i   JSON con parámetros

Ejemplos:
  npm run agent -- --agent social-001 --task create_linkedin_post --input '{"topic":"IA"}'
      `);
      process.exit(0);
    }
  }
  return { agentId, taskType, input };
}

const task = parseArgs();
runAgent(task).catch((err) => {
  console.error("\n💀 Error:", err.message);
  process.exit(1);
});
