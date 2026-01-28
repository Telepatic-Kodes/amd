#!/usr/bin/env node
/**
 * Workflow: Email Marketing Campaign
 *
 * Flujo:
 * 1. Email Ops Manager → Estrategia de campaña
 * 2. Newsletter Writer → Email principal
 * 3. Nurture Specialist → Secuencia de 3 emails
 *
 * Uso: node scripts/workflow-email.js --campaign "Lanzamiento producto" --audience "leads B2B"
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

async function runWorkflow(campaign, audience) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     WORKFLOW: Email Marketing Campaign                    ║");
  console.log("║     💎 Plan Max - 3 agentes coordinados                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log(`📧 Campaña: ${campaign}`);
  console.log(`👥 Audiencia: ${audience}\n`);

  // 1. Email Ops Manager
  console.log("━".repeat(60));
  console.log("📊 1/3: Email Ops Manager - Estrategia...\n");

  const strategy = claude(`Eres Email Ops Manager. Estrategia para campaña "${campaign}" dirigida a "${audience}":

1. OBJETIVO de la campaña
2. SEGMENTACIÓN recomendada
3. TIMING óptimo (día/hora)
4. SECUENCIA de emails (cuántos, espaciado)
5. MÉTRICAS objetivo (open rate, CTR, conversión)
6. A/B TESTS sugeridos

Sé específico y basado en best practices.`);

  console.log(strategy);
  await saveToDB("ops-001", "email_strategy", { campaign, audience }, strategy);
  console.log("✅ Estrategia definida\n");

  // 2. Newsletter Writer - Email principal
  console.log("━".repeat(60));
  console.log("✉️ 2/3: Newsletter Writer - Email principal...\n");

  const mainEmail = claude(`Escribe el email principal para campaña "${campaign}" a "${audience}".

SUBJECT LINE: (incluye 3 opciones para A/B test)

PREVIEW TEXT: (40-90 caracteres)

CUERPO DEL EMAIL:
- Saludo personalizado
- Hook en primera línea
- Propuesta de valor clara
- 2-3 beneficios con bullets
- Prueba social o dato
- CTA principal (botón)
- CTA secundario (link)
- P.S. con urgencia/escasez

Usa formato HTML básico (headers, bullets, bold).`);

  console.log(mainEmail);
  await saveToDB("ops-002", "write_email", { campaign, type: "main" }, mainEmail);
  console.log("✅ Email principal listo\n");

  // 3. Nurture Specialist - Secuencia
  console.log("━".repeat(60));
  console.log("🔄 3/3: Nurture Specialist - Secuencia de follow-up...\n");

  const sequence = claude(`Crea secuencia de 3 emails de follow-up para "${campaign}":

EMAIL 2 (Día +2) - RECORDATORIO:
- Subject line
- Enfoque: Resolver objeciones
- CTA

EMAIL 3 (Día +4) - VALOR ADICIONAL:
- Subject line
- Enfoque: Contenido educativo relacionado
- CTA suave

EMAIL 4 (Día +7) - ÚLTIMA OPORTUNIDAD:
- Subject line
- Enfoque: Urgencia/escasez
- CTA fuerte

Para cada email incluye:
- Subject (2 opciones)
- Preview text
- Cuerpo completo
- CTA`);

  console.log(sequence);
  await saveToDB("ops-003", "nurture_sequence", { campaign }, sequence);
  console.log("✅ Secuencia de nurture lista\n");

  // Resumen
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║            EMAIL CAMPAIGN COMPLETADA                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  console.log("   ✅ Email Strategy   → Timing, segmentación, métricas");
  console.log("   ✅ Email Principal  → 3 subjects + cuerpo completo");
  console.log("   ✅ Nurture Sequence → 3 emails de follow-up");
  console.log("\n📧 Total: 4 emails listos para enviar");
  console.log("💰 Costo: $0.00 (Plan Max)\n");
}

const args = process.argv.slice(2);
let campaign = "Lanzamiento de producto";
let audience = "Leads calificados";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--campaign" || args[i] === "-c") campaign = args[++i];
  if (args[i] === "--audience" || args[i] === "-a") audience = args[++i];
}
runWorkflow(campaign, audience).catch(console.error);
