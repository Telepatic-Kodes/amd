#!/usr/bin/env node
/**
 * Script de onboarding para nuevos clientes de AMD
 * Ejecutar: node scripts/onboard-client.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("\n🚀 AMD - Onboarding de Nuevo Cliente\n");
  console.log("=" .repeat(50));
  console.log("\n");

  // 1. Información básica
  const companyName = await ask("1. Nombre de la empresa: ");
  const industry = await ask("2. Industria (ej: SaaS, eCommerce, Fintech): ");
  const description = await ask(
    "3. Descripción breve (qué hace la empresa): "
  );

  // 2. Objetivos
  console.log("\n4. Objetivos de marketing (uno por línea, escribe 'done' para terminar):");
  const goals: string[] = [];
  while (true) {
    const goal = await ask("   - ");
    if (goal.toLowerCase() === "done") break;
    if (goal) goals.push(goal);
  }

  // 3. Canales
  console.log("\n5. Canales activos (marca con x):");
  const channels: string[] = [];

  const askChannel = async (channel: string) => {
    const answer = await ask(`   ${channel}? (s/n): `);
    if (answer.toLowerCase() === "s") channels.push(channel);
  };

  await askChannel("LinkedIn");
  await askChannel("Twitter/X");
  await askChannel("Instagram");
  await askChannel("Facebook");
  await askChannel("TikTok");
  await askChannel("YouTube");
  await askChannel("Blog");
  await askChannel("Email Marketing");

  // 4. Feeds sugeridos
  console.log("\n6. URLs de feeds RSS (uno por línea, escribe 'done' para terminar):");
  console.log("   Sugerencias para " + industry + ":");

  const feedSuggestions: Record<string, string[]> = {
    SaaS: [
      "https://techcrunch.com/feed/",
      "https://www.saastr.com/feed/",
      "https://www.producthunt.com/feed",
    ],
    eCommerce: [
      "https://www.shopify.com/blog.atom",
      "https://www.practicalecommerce.com/feed",
      "https://www.digitalcommerce360.com/feed/",
    ],
    Fintech: [
      "https://www.finextra.com/rss/headlines.aspx",
      "https://www.fintechnews.org/feed/",
      "https://www.americanbanker.com/feed",
    ],
    default: [
      "https://techcrunch.com/feed/",
      "https://blog.hubspot.com/marketing/rss.xml",
      "https://moz.com/blog/feed",
    ],
  };

  const suggestions = feedSuggestions[industry] || feedSuggestions.default;
  suggestions.forEach((url) => console.log(`   📰 ${url}`));

  const feeds: string[] = [];
  while (true) {
    const feed = await ask("\n   URL feed: ");
    if (feed.toLowerCase() === "done") break;
    if (feed) feeds.push(feed);
  }

  // Si no agregó feeds, usar las sugerencias
  if (feeds.length === 0) {
    console.log("\n⚠️  No agregaste feeds. Usando sugerencias por defecto...");
    feeds.push(...suggestions);
  }

  // 5. Departamentos activos
  console.log("\n7. ¿Qué departamentos activar?");
  const departments: string[] = [];

  const askDept = async (dept: string, description: string) => {
    const answer = await ask(`   ${dept} (${description})? (s/n): `);
    if (answer.toLowerCase() === "s") departments.push(dept);
  };

  await askDept("leadership", "CMO y estrategia");
  await askDept("content", "Blogs, whitepapers, casos de estudio");
  await askDept("social", "Social media (LinkedIn, Twitter, etc.)");
  await askDept("demandgen", "Paid ads, performance marketing");
  await askDept("seo", "SEO, keywords, backlinks");
  await askDept("brand", "Diseño, creativos, assets");
  await askDept("ops", "Email marketing, automation");

  // Resumen
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 RESUMEN DEL CLIENTE:\n");
  console.log(`Empresa: ${companyName}`);
  console.log(`Industria: ${industry}`);
  console.log(`Descripción: ${description}`);
  console.log(`\nObjetivos (${goals.length}):`);
  goals.forEach((g) => console.log(`  - ${g}`));
  console.log(`\nCanales (${channels.length}):`);
  channels.forEach((c) => console.log(`  - ${c}`));
  console.log(`\nFeeds (${feeds.length}):`);
  feeds.forEach((f) => console.log(`  - ${f}`));
  console.log(`\nDepartamentos (${departments.length}):`);
  departments.forEach((d) => console.log(`  - ${d}`));
  console.log("\n" + "=".repeat(50));

  const confirm = await ask("\n¿Guardar esta configuración? (s/n): ");

  if (confirm.toLowerCase() !== "s") {
    console.log("\n❌ Onboarding cancelado.");
    rl.close();
    process.exit(0);
  }

  // Guardar en Convex
  console.log("\n💾 Guardando configuración en Convex...");

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL no está configurado en .env.local");
    rl.close();
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  try {
    await client.mutation(api.onboarding.complete, {
      companyName,
      industry,
      description,
      goals,
      channels,
      feeds,
      departments,
    });

    console.log("\n✅ Configuración guardada exitosamente!");
    console.log("\n🎯 PRÓXIMOS PASOS:\n");
    console.log("1. Cargar agentes:");
    console.log("   npx convex run seed:seedAgents\n");
    console.log("2. Configurar feeds:");
    console.log("   node scripts/setup-feeds.ts\n");
    console.log("3. Iniciar sistema:");
    console.log("   npx convex dev\n");
    console.log("4. Verificar cron local:");
    console.log("   crontab -l\n");

  } catch (error) {
    console.error("\n❌ Error al guardar:", error);
  }

  rl.close();
}

main().catch(console.error);
