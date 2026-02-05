#!/usr/bin/env node
/**
 * Script para configurar feeds RSS basado en el onboarding
 * Ejecutar: node scripts/setup-feeds.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { v4 as uuidv4 } from "uuid";

async function main() {
  console.log("\n📰 AMD - Configuración de Feeds RSS\n");
  console.log("=".repeat(50));

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL no configurado");
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  // Obtener onboarding data
  console.log("\n🔍 Buscando configuración de onboarding...");

  const onboarding = await client.query(api.onboarding.get);

  if (!onboarding) {
    console.error("\n❌ No se encontró configuración de onboarding.");
    console.log("   Ejecuta primero: node scripts/onboard-client.ts");
    process.exit(1);
  }

  console.log(`✅ Cliente: ${onboarding.companyName}`);
  console.log(`✅ Feeds a configurar: ${onboarding.feeds.length}`);

  // Categorizar feeds automáticamente
  const categorizeUrl = (url: string): string => {
    const categories: Record<string, string[]> = {
      Technology: ["techcrunch", "theverge", "wired", "arstechnica"],
      Marketing: ["hubspot", "moz", "searchenginejournal", "marketingland"],
      Business: ["forbes", "entrepreneur", "inc", "fastcompany"],
      SaaS: ["saastr", "producthunt", "saas"],
      eCommerce: ["shopify", "ecommerce", "practical"],
      Finance: ["finextra", "fintech", "banker"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => url.toLowerCase().includes(kw))) {
        return category;
      }
    }

    return "General";
  };

  const getFeedName = (url: string): string => {
    // Extraer nombre del dominio
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      const parts = hostname.split(".");
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return "Feed";
    }
  };

  console.log("\n⚙️  Configurando feeds...\n");

  for (const feedUrl of onboarding.feeds) {
    try {
      const feedId = `feed-${uuidv4().substring(0, 8)}`;
      const name = getFeedName(feedUrl);
      const category = categorizeUrl(feedUrl);

      await client.mutation(api.feeds.mutations.createFeed, {
        feedId,
        url: feedUrl,
        name,
        category,
        status: "active",
        syncFrequency: "hourly",
      });

      console.log(`✅ ${name.padEnd(20)} | ${category.padEnd(15)} | ${feedUrl}`);
    } catch (error: any) {
      console.log(`❌ Error: ${feedUrl} - ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Feeds configurados exitosamente!\n");
  console.log("🎯 PRÓXIMOS PASOS:\n");
  console.log("1. Forzar primera sincronización:");
  console.log("   npx convex run feeds:syncAllFeeds:syncAllFeeds\n");
  console.log("2. Ver feeds en dashboard:");
  console.log("   https://dashboard.convex.dev\n");
  console.log("3. Esperar 30 min para enrichment automático");
  console.log("   o ejecutar manualmente:");
  console.log("   npm run enrich 5\n");
}

main().catch(console.error);
