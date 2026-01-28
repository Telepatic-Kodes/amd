#!/usr/bin/env node
/**
 * Workflow: Demand Gen / Paid Ads
 *
 * Flujo:
 * 1. Demand Gen Director → Estrategia de campaña
 * 2. Meta Ads Specialist → Ads Facebook/Instagram
 * 3. Google Ads Specialist → Search + Display ads
 * 4. LinkedIn Ads Specialist → Ads B2B
 * 5. Ad Performance Analyst → Framework de métricas
 *
 * Uso: node scripts/workflow-ads.js --product "Tu producto" --budget "5000" --goal "leads"
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

async function runWorkflow(product, budget, goal) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     WORKFLOW: Demand Gen / Paid Ads                       ║");
  console.log("║     💎 Plan Max - 5 agentes coordinados                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`🎯 Producto: ${product}`);
  console.log(`💵 Budget: $${budget}/mes`);
  console.log(`🎪 Goal: ${goal}\n`);

  // 1. Demand Gen Director
  console.log("━".repeat(60));
  console.log("📊 1/5: Demand Gen Director - Estrategia...\n");

  const strategy = claude(`Eres Demand Gen Director. Estrategia paid media para "${product}":
Budget: $${budget}/mes | Goal: ${goal}

1. DISTRIBUCIÓN DE BUDGET por canal (%)
2. AUDIENCIAS prioritarias (3)
3. FUNNEL: Awareness → Consideration → Conversion
4. CREATIVOS necesarios por etapa
5. MÉTRICAS objetivo por canal (CPL, ROAS, CPA)
6. TESTING PLAN primer mes

Sé específico con números.`);

  console.log(strategy);
  await saveToDB("demandgen-director", "paid_strategy", { product, budget, goal }, strategy);
  console.log("✅ Estrategia definida\n");

  // 2. Meta Ads
  console.log("━".repeat(60));
  console.log("📘 2/5: Meta Ads Specialist - Facebook/Instagram...\n");

  const metaAds = claude(`Crea 3 anuncios para Facebook/Instagram para "${product}":

Para cada anuncio:
FORMATO: (imagen/video/carrusel)
AUDIENCIA: (intereses, demografía)
COPY PRINCIPAL: (125 chars máx)
HEADLINE: (40 chars)
DESCRIPCIÓN: (30 chars)
CTA: (botón)

Incluye:
- 1 anuncio awareness (top funnel)
- 1 anuncio consideration (mid funnel)
- 1 anuncio conversión (bottom funnel)

Sé creativo y persuasivo.`);

  console.log(metaAds);
  await saveToDB("demandgen-002", "create_meta_ads", { product }, metaAds);
  console.log("✅ Meta Ads listos\n");

  // 3. Google Ads
  console.log("━".repeat(60));
  console.log("🔍 3/5: Google Ads Specialist - Search & Display...\n");

  const googleAds = claude(`Crea campañas Google Ads para "${product}":

SEARCH ADS (3 grupos):
Para cada grupo:
- Keywords (5-10)
- Headline 1 (30 chars)
- Headline 2 (30 chars)
- Headline 3 (30 chars)
- Description 1 (90 chars)
- Description 2 (90 chars)

RESPONSIVE DISPLAY:
- Headlines (5 variaciones)
- Descriptions (5 variaciones)
- Imágenes sugeridas

EXTENSIONES recomendadas:
- Sitelinks, callouts, snippets estructurados`);

  console.log(googleAds);
  await saveToDB("demandgen-003", "create_google_ads", { product }, googleAds);
  console.log("✅ Google Ads listos\n");

  // 4. LinkedIn Ads
  console.log("━".repeat(60));
  console.log("💼 4/5: LinkedIn Ads Specialist - B2B...\n");

  const linkedinAds = claude(`Crea campañas LinkedIn Ads B2B para "${product}":

SPONSORED CONTENT (2 variaciones):
- Intro text (150 chars)
- Imagen/Video recomendación
- Headline
- CTA

MESSAGE ADS (InMail):
- Subject line
- Cuerpo del mensaje
- CTA

TARGETING B2B:
- Job titles
- Industries
- Company size
- Seniority levels

LEAD GEN FORM:
- Campos recomendados
- Oferta de valor`);

  console.log(linkedinAds);
  await saveToDB("demandgen-004", "create_linkedin_ads", { product }, linkedinAds);
  console.log("✅ LinkedIn Ads listos\n");

  // 5. Performance Framework
  console.log("━".repeat(60));
  console.log("📈 5/5: Ad Performance Analyst - Framework métricas...\n");

  const metrics = claude(`Crea framework de métricas para campañas de "${product}" con budget $${budget}:

DASHBOARD KPIs:
| Métrica | Meta | Alerta |
(incluir: Spend, Impressions, Clicks, CTR, CPC, Conversions, CPL/CPA, ROAS)

BENCHMARKS por canal:
- Meta: CTR, CPC, CPL esperados
- Google: Quality Score, CTR, CPC
- LinkedIn: CTR, CPL

OPTIMIZACIÓN SEMANAL:
- Qué revisar cada semana
- Triggers para pausar/escalar
- Tests A/B prioritarios

REPORTING:
- Métricas para reporte ejecutivo
- Frecuencia de reporting`);

  console.log(metrics);
  await saveToDB("demandgen-005", "performance_framework", { product, budget }, metrics);
  console.log("✅ Framework de métricas listo\n");

  // Resumen
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║            PAID ADS CAMPAIGN COMPLETADA                    ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("   ✅ Strategy         → Budget allocation + audiencias");
  console.log("   ✅ Meta Ads         → 3 anuncios (awareness/consideration/conversion)");
  console.log("   ✅ Google Ads       → Search + Display");
  console.log("   ✅ LinkedIn Ads     → Sponsored + InMail + Lead Gen");
  console.log("   ✅ Metrics          → Dashboard + benchmarks + optimización");
  console.log("\n💰 Costo creación: $0.00 (Plan Max)");
  console.log(`💵 Budget campaña: $${budget}/mes\n`);
}

const args = process.argv.slice(2);
let product = "Software de automatización";
let budget = "5000";
let goal = "leads";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--product" || args[i] === "-p") product = args[++i];
  if (args[i] === "--budget" || args[i] === "-b") budget = args[++i];
  if (args[i] === "--goal" || args[i] === "-g") goal = args[++i];
}
runWorkflow(product, budget, goal).catch(console.error);
