#!/usr/bin/env node
/**
 * WORKFLOW COMPLETO: Full Marketing Campaign
 *
 * Ejecuta TODOS los departamentos en secuencia:
 * 1. Brand → Estrategia de marca
 * 2. SEO → Keywords y técnico
 * 3. Content → Blog post
 * 4. Social → Posts para todas las redes
 * 5. Email → Secuencia completa
 * 6. Ads → Campañas paid
 *
 * Uso: node scripts/workflow-full.js --product "Tu producto" --brand "Tu marca"
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

async function runFullWorkflow(product, brand) {
  const startTime = Date.now();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🚀 FULL MARKETING CAMPAIGN                            ║");
  console.log("║     💎 Plan Max - Todos los departamentos                 ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`🏷️ Marca: ${brand}`);
  console.log(`📦 Producto: ${product}\n`);

  let agentCount = 0;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 1: BRAND
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 1: BRAND & CREATIVE");
  console.log("═".repeat(60) + "\n");

  const brandStrategy = claude(`Brand strategy rápido para "${brand}" vendiendo "${product}":
- Propuesta de valor (1 frase)
- Tagline
- Tono de voz (3 adjetivos)
- Key message principal`);
  console.log("✅ Brand Director:\n" + brandStrategy.substring(0, 300) + "...\n");
  await saveToDB("brand-director", "brand_strategy", { brand, product }, brandStrategy);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 2: SEO
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 2: SEO");
  console.log("═".repeat(60) + "\n");

  const keywords = claude(`Top 5 keywords para "${product}". Formato: keyword | intent | prioridad`);
  console.log("✅ SEO Strategist:\n" + keywords + "\n");
  await saveToDB("seo-001", "keyword_research", { product }, keywords);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 3: CONTENT
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 3: CONTENT");
  console.log("═".repeat(60) + "\n");

  const blog = claude(`Escribe intro de blog (200 palabras) sobre "${product}". SEO optimizado.`);
  console.log("✅ Blog Writer:\n" + blog.substring(0, 400) + "...\n");
  await saveToDB("content-002", "write_blog", { product }, blog);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 4: SOCIAL
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 4: SOCIAL MEDIA");
  console.log("═".repeat(60) + "\n");

  const linkedin = claude(`Post LinkedIn corto (100 palabras) sobre "${product}". Hook + valor + CTA.`);
  console.log("✅ LinkedIn Creator:\n" + linkedin + "\n");
  await saveToDB("social-001", "create_linkedin_post", { product }, linkedin);
  agentCount++;

  const twitter = claude(`Thread 3 tweets sobre "${product}". Formato: 1/ 2/ 3/`);
  console.log("✅ Twitter Creator:\n" + twitter + "\n");
  await saveToDB("social-002", "create_twitter_thread", { product }, twitter);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 5: EMAIL
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 5: EMAIL MARKETING");
  console.log("═".repeat(60) + "\n");

  const email = claude(`Email de lanzamiento para "${product}". Subject + cuerpo corto + CTA.`);
  console.log("✅ Newsletter Writer:\n" + email + "\n");
  await saveToDB("ops-002", "write_email", { product }, email);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // FASE 6: ADS
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("   FASE 6: PAID ADS");
  console.log("═".repeat(60) + "\n");

  const ads = claude(`1 anuncio para cada plataforma para "${product}":
- Facebook: Primary text + headline
- Google: 3 headlines + 2 descriptions
- LinkedIn: Intro text + headline`);
  console.log("✅ Ads Specialists:\n" + ads + "\n");
  await saveToDB("demandgen-002", "create_ads", { product }, ads);
  agentCount++;

  // ═══════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════════
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "═".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║         🎉 FULL CAMPAIGN COMPLETADA                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log("📊 RESUMEN:");
  console.log("─".repeat(40));
  console.log(`   🏷️  Brand Strategy     ✅`);
  console.log(`   🔍  SEO Keywords       ✅`);
  console.log(`   📝  Blog Content       ✅`);
  console.log(`   💼  LinkedIn Post      ✅`);
  console.log(`   🐦  Twitter Thread     ✅`);
  console.log(`   ✉️  Email Campaign     ✅`);
  console.log(`   📢  Paid Ads           ✅`);
  console.log("─".repeat(40));
  console.log(`   🤖  Agentes ejecutados: ${agentCount}`);
  console.log(`   ⏱️  Tiempo total: ${duration}s`);
  console.log(`   💰  Costo: $0.00 (Plan Max)`);
  console.log("\n📍  Ver resultados: http://localhost:3001/analytics\n");
}

const args = process.argv.slice(2);
let product = "Plataforma SaaS de IA";
let brand = "AIStartup";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--product" || args[i] === "-p") product = args[++i];
  if (args[i] === "--brand" || args[i] === "-b") brand = args[++i];
}
runFullWorkflow(product, brand).catch(console.error);
