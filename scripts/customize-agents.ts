#!/usr/bin/env node
/**
 * Script para personalizar agentes según el cliente
 * Ejecutar: node scripts/customize-agents.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  console.log("\n🤖 AMD - Personalización de Agentes\n");
  console.log("=".repeat(50));

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL no configurado");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  // Obtener onboarding
  console.log("\n🔍 Cargando configuración del cliente...");
  const onboarding = await client.query(api.onboarding.get);

  if (!onboarding) {
    console.error("\n❌ No se encontró configuración de onboarding.");
    console.log("   Ejecuta primero: node scripts/onboard-client.ts");
    process.exit(1);
  }

  console.log(`✅ Cliente: ${onboarding.companyName}`);
  console.log(`✅ Industria: ${onboarding.industry}`);
  console.log(`✅ Departamentos activos: ${onboarding.departments.length}`);

  // Construir contexto del cliente para system prompts
  const clientContext = `
CONTEXTO DEL CLIENTE:
- Empresa: ${onboarding.companyName}
- Industria: ${onboarding.industry}
- Descripción: ${onboarding.description}
- Audiencia: ${onboarding.goals.join(", ")}
- Canales activos: ${onboarding.channels.join(", ")}

TONO DE MARCA:
- Profesional pero accesible
- Enfocado en resultados
- Usa datos y ejemplos concretos
- Evita jerga innecesaria
`;

  // Obtener todos los agentes
  console.log("\n⚙️  Personalizando agentes...\n");

  const agents = await client.query(api.functions.listAgents, {
    filters: { status: "active" },
  });

  let updated = 0;
  let skipped = 0;

  for (const agent of agents) {
    // Solo actualizar agentes de departamentos activos
    if (!onboarding.departments.includes(agent.department)) {
      // Pausar agentes no activos
      await client.mutation(api.functions.updateAgentStatus, {
        id: agent._id,
        status: "paused",
      });
      console.log(`⏸️  ${agent.name.padEnd(30)} | Pausado (departamento no activo)`);
      skipped++;
      continue;
    }

    // Agregar contexto del cliente al system prompt
    const updatedPrompt = agent.config.systemPrompt + "\n\n" + clientContext;

    await client.mutation(api.functions.updateAgent, {
      id: agent._id,
      config: {
        ...agent.config,
        systemPrompt: updatedPrompt,
      },
    });

    console.log(`✅ ${agent.name.padEnd(30)} | ${agent.department.padEnd(12)} | Actualizado`);
    updated++;
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Agentes actualizados: ${updated}`);
  console.log(`   ⏸️  Agentes pausados: ${skipped}`);
  console.log(`   📝 Total: ${agents.length}`);

  console.log("\n✅ Personalización completada!\n");
  console.log("🎯 Los agentes ahora conocen:");
  console.log(`   - La industria del cliente (${onboarding.industry})`);
  console.log(`   - Su audiencia objetivo`);
  console.log(`   - Los canales que usan`);
  console.log(`   - El tono de marca apropiado\n`);
}

main().catch(console.error);
