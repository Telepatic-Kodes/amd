#!/usr/bin/env node
/**
 * Workflow: Brand Campaign
 *
 * Flujo:
 * 1. Brand Director → Estrategia de marca
 * 2. Ad Creative Designer → Conceptos creativos
 * 3. Landing Page Builder → Estructura de landing
 *
 * Uso: node scripts/workflow-brand.js --brand "Nombre" --campaign "Tipo campaña"
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

async function runWorkflow(brand, campaign) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     WORKFLOW: Brand Campaign                              ║");
  console.log("║     💎 Plan Max - 3 agentes coordinados                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`🏷️ Marca: ${brand}`);
  console.log(`🎨 Campaña: ${campaign}\n`);

  // 1. Brand Director
  console.log("━".repeat(60));
  console.log("🎯 1/3: Brand Director - Estrategia de marca...\n");

  const strategy = claude(`Eres Brand Director. Estrategia para campaña "${campaign}" de "${brand}":

1. BRAND POSITIONING
   - Propuesta de valor única
   - Diferenciadores vs competencia
   - Personalidad de marca (5 adjetivos)

2. MESSAGING FRAMEWORK
   - Tagline de campaña
   - Key messages (3)
   - Tono de voz
   - Do's and Don'ts

3. VISUAL DIRECTION
   - Mood/estética
   - Colores protagonistas
   - Estilo fotográfico
   - Tipografía feeling

4. TOUCHPOINTS
   - Canales prioritarios
   - Formatos por canal

Sé específico y creativo.`);

  console.log(strategy);
  await saveToDB("brand-director", "brand_strategy", { brand, campaign }, strategy);
  console.log("✅ Estrategia de marca definida\n");

  // 2. Ad Creative Designer
  console.log("━".repeat(60));
  console.log("🎨 2/3: Ad Creative Designer - Conceptos creativos...\n");

  const creatives = claude(`Eres Ad Creative Designer. Crea 3 conceptos creativos para "${campaign}" de "${brand}":

CONCEPTO 1 - EMOCIONAL:
- Nombre del concepto
- Insight del consumidor
- Idea creativa
- Headline principal
- Visual key (descripción detallada)
- Adaptaciones (social, display, video)

CONCEPTO 2 - RACIONAL:
- Nombre del concepto
- Beneficio principal
- Idea creativa
- Headline principal
- Visual key
- Adaptaciones

CONCEPTO 3 - DISRUPTIVO:
- Nombre del concepto
- Tensión cultural que explota
- Idea creativa
- Headline principal
- Visual key
- Adaptaciones

Para cada concepto incluye copy alternativo.`);

  console.log(creatives);
  await saveToDB("brand-001", "creative_concepts", { brand, campaign }, creatives);
  console.log("✅ Conceptos creativos listos\n");

  // 3. Landing Page Builder
  console.log("━".repeat(60));
  console.log("🖥️ 3/3: Landing Page Builder - Estructura de landing...\n");

  const landing = claude(`Diseña estructura de landing page para "${campaign}" de "${brand}":

HERO SECTION:
- Headline (8 palabras máx)
- Subheadline
- CTA principal
- Visual hero (descripción)

SECCIÓN 2 - PROBLEMA/SOLUCIÓN:
- Título
- 3 pain points
- Cómo los resuelve

SECCIÓN 3 - BENEFICIOS:
- 3-4 beneficios con iconos
- Copy para cada uno

SECCIÓN 4 - SOCIAL PROOF:
- Tipo de prueba social
- Testimonios sugeridos
- Logos/números

SECCIÓN 5 - CTA FINAL:
- Headline de cierre
- CTA
- Garantía/reducción de riesgo

FOOTER:
- Links necesarios
- Trust badges

Incluye copy real para cada sección.`);

  console.log(landing);
  await saveToDB("brand-002", "landing_structure", { brand, campaign }, landing);
  console.log("✅ Estructura de landing lista\n");

  // Resumen
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║            BRAND CAMPAIGN COMPLETADA                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("   ✅ Brand Strategy    → Positioning + messaging + visual");
  console.log("   ✅ Creative Concepts → 3 conceptos (emocional/racional/disruptivo)");
  console.log("   ✅ Landing Page      → Estructura completa con copy");
  console.log("\n💰 Costo: $0.00 (Plan Max)\n");
}

const args = process.argv.slice(2);
let brand = "TechStartup";
let campaign = "Lanzamiento de producto";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--brand" || args[i] === "-b") brand = args[++i];
  if (args[i] === "--campaign" || args[i] === "-c") campaign = args[++i];
}
runWorkflow(brand, campaign).catch(console.error);
