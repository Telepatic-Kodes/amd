#!/usr/bin/env node
/**
 * Workflow: Social Media Campaign
 *
 * Flujo:
 * 1. Social Manager → Define estrategia
 * 2. LinkedIn Creator → Post profesional
 * 3. Twitter Creator → Thread viral
 * 4. YouTube Scriptwriter → Script corto
 * 5. Short-Form Creator → Ideas TikTok/Reels
 *
 * Uso: node scripts/workflow-social.js --topic "Tu tema"
 */

const { execFileSync } = require("child_process");
require("dotenv").config({ path: ".env.local" });

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

async function saveToDB(agentId, taskType, input, output) {
  await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "agentSdk:saveResult",
      args: { agentId, taskType, input, output, success: true }
    }),
  });
}

function claude(prompt) {
  return execFileSync("claude", ["--print", "-p", prompt], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 180000,
  });
}

async function runWorkflow(topic) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     WORKFLOW: Social Media Campaign                       ║");
  console.log("║     💎 Plan Max - 5 agentes coordinados                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`📌 Tema: ${topic}\n`);

  // 1. Social Manager - Estrategia
  console.log("━".repeat(60));
  console.log("📊 1/5: Social Manager definiendo estrategia...\n");

  const strategy = claude(`Eres Social Media Manager. Define una estrategia para campaña sobre "${topic}":

1. OBJETIVO principal (awareness/engagement/conversión)
2. AUDIENCIA target (perfil demográfico)
3. TONO de comunicación
4. MENSAJES CLAVE (3 bullets)
5. HASHTAGS principales (5)

Sé conciso y directo.`);

  console.log(strategy);
  await saveToDB("social-manager", "define_strategy", { topic }, strategy);
  console.log("✅ Estrategia definida\n");

  // 2. LinkedIn
  console.log("━".repeat(60));
  console.log("💼 2/5: LinkedIn Creator...\n");

  const linkedin = claude(`Crea post LinkedIn viral sobre "${topic}".
Estrategia: ${strategy.substring(0, 500)}

Hook potente + espaciado + CTA + 5 hashtags. Solo el post.`);

  console.log(linkedin);
  await saveToDB("social-001", "create_linkedin_post", { topic }, linkedin);
  console.log("\n✅ LinkedIn listo\n");

  // 3. Twitter
  console.log("━".repeat(60));
  console.log("🐦 3/5: Twitter Creator...\n");

  const twitter = claude(`Crea thread Twitter 5 tweets sobre "${topic}".
Estrategia: ${strategy.substring(0, 500)}

Formato: 1/ [tweet] etc. Máx 280 chars cada uno.`);

  console.log(twitter);
  await saveToDB("social-002", "create_twitter_thread", { topic }, twitter);
  console.log("\n✅ Twitter listo\n");

  // 4. YouTube Script
  console.log("━".repeat(60));
  console.log("🎬 4/5: YouTube Scriptwriter...\n");

  const youtube = claude(`Escribe script para video YouTube de 60 segundos sobre "${topic}".

Estructura:
- HOOK (5 seg): Frase impactante
- PROBLEMA (10 seg): Qué dolor resuelve
- SOLUCIÓN (30 seg): 3 puntos clave
- CTA (15 seg): Qué debe hacer el viewer

Incluye indicaciones de tono [ENTUSIASTA], [SERIO], etc.`);

  console.log(youtube);
  await saveToDB("social-003", "write_youtube_script", { topic }, youtube);
  console.log("\n✅ Script YouTube listo\n");

  // 5. Short-Form
  console.log("━".repeat(60));
  console.log("📱 5/5: Short-Form Creator (TikTok/Reels)...\n");

  const shortform = claude(`Crea 3 ideas de videos cortos (15-30 seg) para TikTok/Reels sobre "${topic}".

Para cada idea incluye:
- HOOK visual (primeros 2 seg)
- CONCEPTO (qué muestra el video)
- TEXTO EN PANTALLA
- AUDIO sugerido (trending sound o voz)
- CTA final`);

  console.log(shortform);
  await saveToDB("social-004", "create_shortform", { topic }, shortform);
  console.log("\n✅ Ideas Short-Form listas\n");

  // Resumen
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║              SOCIAL CAMPAIGN COMPLETADA                    ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("   ✅ Social Manager    → Estrategia definida");
  console.log("   ✅ LinkedIn Creator  → Post profesional");
  console.log("   ✅ Twitter Creator   → Thread 5 tweets");
  console.log("   ✅ YouTube Script    → Video 60 seg");
  console.log("   ✅ Short-Form        → 3 ideas TikTok/Reels");
  console.log("\n💰 Costo: $0.00 (Plan Max)\n");
}

const args = process.argv.slice(2);
let topic = "Productividad con IA";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--topic" || args[i] === "-t") topic = args[++i];
}
runWorkflow(topic).catch(console.error);
