#!/usr/bin/env node
/**
 * Script para verificar que el setup está completo
 * Ejecutar: node scripts/verify-setup.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  console.log("\n✅ AMD - Verificación de Setup\n");
  console.log("=".repeat(50));

  const checks: Array<{ name: string; status: boolean; message: string }> = [];

  // 1. Check .env.local
  console.log("\n🔍 1. Verificando variables de entorno...");
  try {
    const hasConvexUrl = !!process.env.NEXT_PUBLIC_CONVEX_URL;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    if (hasConvexUrl && hasOpenAIKey) {
      checks.push({
        name: "Variables de entorno",
        status: true,
        message: "CONVEX_URL y OPENAI_API_KEY configurados",
      });
      console.log("   ✅ Variables configuradas correctamente");
    } else {
      checks.push({
        name: "Variables de entorno",
        status: false,
        message: "Faltan variables en .env.local",
      });
      console.log("   ❌ Faltan variables en .env.local");
    }
  } catch (error) {
    checks.push({
      name: "Variables de entorno",
      status: false,
      message: "Error al leer .env.local",
    });
  }

  // 2. Check Convex connection
  console.log("\n🔍 2. Verificando conexión a Convex...");
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) throw new Error("No CONVEX_URL");

    const client = new ConvexHttpClient(convexUrl);

    // 3. Check onboarding
    console.log("\n🔍 3. Verificando configuración del cliente...");
    const onboarding = await client.query(api.onboarding.get);

    if (onboarding) {
      checks.push({
        name: "Configuración del cliente",
        status: true,
        message: `Cliente: ${onboarding.companyName}`,
      });
      console.log(`   ✅ Cliente configurado: ${onboarding.companyName}`);
    } else {
      checks.push({
        name: "Configuración del cliente",
        status: false,
        message: "Onboarding no completado",
      });
      console.log("   ❌ Onboarding no completado");
    }

    // 4. Check agents
    console.log("\n🔍 4. Verificando agentes...");
    const agents = await client.query(api.functions.listAgents, {
      filters: {},
    });

    if (agents.length > 0) {
      const active = agents.filter((a) => a.status === "active").length;
      checks.push({
        name: "Agentes",
        status: true,
        message: `${agents.length} agentes cargados (${active} activos)`,
      });
      console.log(`   ✅ ${agents.length} agentes (${active} activos)`);
    } else {
      checks.push({
        name: "Agentes",
        status: false,
        message: "No hay agentes cargados",
      });
      console.log("   ❌ No hay agentes cargados");
    }

    // 5. Check feeds
    console.log("\n🔍 5. Verificando feeds RSS...");
    const feeds = await client.query(api.feeds.queries.listFeeds, {});

    if (feeds.length > 0) {
      const active = feeds.filter((f) => f.status === "active").length;
      checks.push({
        name: "Feeds RSS",
        status: true,
        message: `${feeds.length} feeds configurados (${active} activos)`,
      });
      console.log(`   ✅ ${feeds.length} feeds (${active} activos)`);
    } else {
      checks.push({
        name: "Feeds RSS",
        status: false,
        message: "No hay feeds configurados",
      });
      console.log("   ⚠️  No hay feeds configurados");
    }

    // 6. Check feed items
    console.log("\n🔍 6. Verificando artículos sincronizados...");
    const feedItems = await client.query(api.feeds.queries.listFeedItems, {
      limit: 100,
    });

    if (feedItems.length > 0) {
      const processed = feedItems.filter((i) => i.processed).length;
      checks.push({
        name: "Feed items",
        status: true,
        message: `${feedItems.length} artículos (${processed} enriquecidos)`,
      });
      console.log(`   ✅ ${feedItems.length} artículos (${processed} enriquecidos)`);
    } else {
      checks.push({
        name: "Feed items",
        status: false,
        message: "No hay artículos sincronizados",
      });
      console.log("   ⚠️  No hay artículos sincronizados aún");
    }

    checks.push({
      name: "Conexión a Convex",
      status: true,
      message: "Conectado exitosamente",
    });
  } catch (error: any) {
    checks.push({
      name: "Conexión a Convex",
      status: false,
      message: error.message,
    });
    console.log("   ❌ Error al conectar a Convex");
  }

  // 7. Check cron local
  console.log("\n🔍 7. Verificando cron local...");
  try {
    const { stdout } = await execAsync("crontab -l 2>/dev/null || echo ''");
    const hasCron = stdout.includes("cron-enrich.sh");

    if (hasCron) {
      checks.push({
        name: "Cron local",
        status: true,
        message: "Enrichment configurado",
      });
      console.log("   ✅ Cron de enrichment configurado");
    } else {
      checks.push({
        name: "Cron local",
        status: false,
        message: "Cron no configurado",
      });
      console.log("   ❌ Cron de enrichment no configurado");
    }
  } catch (error) {
    checks.push({
      name: "Cron local",
      status: false,
      message: "Error al verificar cron",
    });
  }

  // 8. Check logs directory
  console.log("\n🔍 8. Verificando directorio de logs...");
  try {
    const { stdout } = await execAsync("ls logs/*.log 2>/dev/null | wc -l");
    const logCount = parseInt(stdout.trim());

    if (logCount > 0) {
      checks.push({
        name: "Logs",
        status: true,
        message: `${logCount} archivos de log encontrados`,
      });
      console.log(`   ✅ ${logCount} archivos de log encontrados`);
    } else {
      checks.push({
        name: "Logs",
        status: false,
        message: "No hay logs aún (normal en primera ejecución)",
      });
      console.log("   ⚠️  No hay logs aún (esperando primera ejecución)");
    }
  } catch (error) {
    checks.push({
      name: "Logs",
      status: false,
      message: "Directorio logs no existe",
    });
  }

  // Resumen final
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 RESUMEN DE VERIFICACIÓN:\n");

  const passed = checks.filter((c) => c.status).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);

  checks.forEach((check) => {
    const icon = check.status ? "✅" : "❌";
    console.log(`${icon} ${check.name.padEnd(30)} | ${check.message}`);
  });

  console.log("\n" + "=".repeat(50));
  console.log(`\n${percentage}% completado (${passed}/${total} checks pasados)\n`);

  if (percentage === 100) {
    console.log("🎉 ¡Todo configurado correctamente!");
    console.log("\n🚀 LISTO PARA USAR:");
    console.log("   1. npx convex dev (mantener corriendo)");
    console.log("   2. Esperar sync de feeds (cada hora :05)");
    console.log("   3. Esperar enrichment (cada hora :35)");
    console.log("   4. Ejecutar primer agente:");
    console.log("      npm run agent:linkedin");
  } else if (percentage >= 70) {
    console.log("⚠️  Setup casi completo. Revisar items faltantes arriba.");
  } else {
    console.log("❌ Setup incompleto. Seguir los pasos de onboarding.");
    console.log("\n📚 GUÍA:");
    console.log("   1. node scripts/onboard-client.ts");
    console.log("   2. npx convex run seed:seedAgents");
    console.log("   3. node scripts/setup-feeds.ts");
    console.log("   4. node scripts/customize-agents.ts");
  }

  console.log("\n");
}

main().catch(console.error);
