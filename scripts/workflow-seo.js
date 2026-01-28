#!/usr/bin/env node
/**
 * Workflow: SEO Audit & Strategy
 *
 * Flujo:
 * 1. SEO Manager → Análisis general
 * 2. Keyword Strategist → Research de keywords
 * 3. Technical SEO → Checklist técnico
 * 4. Backlink Analyst → Estrategia de links
 *
 * Uso: node scripts/workflow-seo.js --domain "ejemplo.com" --industry "tu industria"
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

async function runWorkflow(domain, industry) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     WORKFLOW: SEO Audit & Strategy                        ║");
  console.log("║     💎 Plan Max - 4 agentes coordinados                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`🌐 Dominio: ${domain}`);
  console.log(`🏭 Industria: ${industry}\n`);

  // 1. SEO Manager
  console.log("━".repeat(60));
  console.log("📊 1/4: SEO Manager - Análisis estratégico...\n");

  const analysis = claude(`Eres SEO Manager. Crea un análisis estratégico para "${domain}" en la industria "${industry}".

Incluye:
1. OPORTUNIDADES principales (3)
2. QUICK WINS (acciones inmediatas de alto impacto)
3. COMPETIDORES probables a analizar
4. MÉTRICAS objetivo (KPIs)
5. PRIORIDADES Q1

Sé específico y accionable.`);

  console.log(analysis);
  await saveToDB("seo-manager", "strategic_analysis", { domain, industry }, analysis);
  console.log("✅ Análisis completado\n");

  // 2. Keyword Strategist
  console.log("━".repeat(60));
  console.log("🔍 2/4: Keyword Strategist - Research...\n");

  const keywords = claude(`Eres SEO Keyword Strategist. Para "${domain}" en "${industry}":

1. KEYWORDS PRINCIPALES (10):
   - Keyword | Intent | Dificultad estimada | Prioridad

2. LONG-TAIL (15):
   - Keywords de cola larga con menor competencia

3. CLUSTERS DE CONTENIDO (3):
   - Pillar page + subtemas relacionados

4. PREGUNTAS FRECUENTES (10):
   - Para featured snippets

Formato tabla cuando aplique.`);

  console.log(keywords);
  await saveToDB("seo-001", "keyword_research", { domain, industry }, keywords);
  console.log("✅ Keywords identificadas\n");

  // 3. Technical SEO
  console.log("━".repeat(60));
  console.log("⚙️ 3/4: Technical SEO - Checklist...\n");

  const technical = claude(`Eres Technical SEO Specialist. Crea checklist técnico para "${domain}":

CORE WEB VITALS:
□ LCP (Largest Contentful Paint) - objetivo < 2.5s
□ FID (First Input Delay) - objetivo < 100ms
□ CLS (Cumulative Layout Shift) - objetivo < 0.1

INDEXACIÓN:
□ Sitemap XML
□ Robots.txt
□ Canonical tags
□ Hreflang (si aplica)

ESTRUCTURA:
□ Schema markup recomendado
□ Arquitectura URL
□ Internal linking

SEGURIDAD:
□ HTTPS
□ Mixed content

Para cada ítem indica: Prioridad (Alta/Media/Baja) y cómo verificar.`);

  console.log(technical);
  await saveToDB("seo-003", "technical_audit", { domain }, technical);
  console.log("✅ Checklist técnico listo\n");

  // 4. Backlink Analyst
  console.log("━".repeat(60));
  console.log("🔗 4/4: Backlink Analyst - Estrategia de links...\n");

  const backlinks = claude(`Eres Backlink Analyst. Estrategia de link building para "${domain}" en "${industry}":

1. TIPOS DE LINKS A CONSEGUIR:
   - Guest posts
   - Menciones de marca
   - Links de recursos
   - Digital PR

2. OUTREACH TARGETS (10 tipos de sitios):
   - Tipo de sitio | Por qué | Cómo abordar

3. CONTENIDO LINKABLE:
   - 5 ideas de contenido que naturalmente atraen links

4. TÁCTICAS RÁPIDAS:
   - Links fáciles de conseguir esta semana

5. MÉTRICAS A MONITOREAR:
   - DA, DR, referring domains, etc.`);

  console.log(backlinks);
  await saveToDB("seo-002", "backlink_strategy", { domain, industry }, backlinks);
  console.log("✅ Estrategia de backlinks lista\n");

  // Resumen
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                SEO AUDIT COMPLETADO                        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("   ✅ SEO Manager       → Análisis estratégico");
  console.log("   ✅ Keyword Research  → 10 principales + 15 long-tail");
  console.log("   ✅ Technical SEO     → Checklist completo");
  console.log("   ✅ Backlink Strategy → Plan de link building");
  console.log("\n💰 Costo: $0.00 (Plan Max)\n");
}

const args = process.argv.slice(2);
let domain = "miempresa.com";
let industry = "SaaS B2B";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--domain" || args[i] === "-d") domain = args[++i];
  if (args[i] === "--industry" || args[i] === "-i") industry = args[++i];
}
runWorkflow(domain, industry).catch(console.error);
