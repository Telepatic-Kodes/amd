#!/usr/bin/env node
/**
 * Workflow: Content Marketing Completo
 *
 * Flujo automático:
 * 1. SEO Strategist → Identifica keywords
 * 2. Blog Writer → Escribe artículo
 * 3. LinkedIn Creator → Crea post
 * 4. Twitter Creator → Crea thread
 *
 * Uso:
 *   node scripts/workflow-content.js --topic "Tu tema aquí"
 */

const { execFileSync } = require("child_process");
require("dotenv").config({ path: ".env.local" });

const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

async function convexMutation(path, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function runClaude(prompt) {
  try {
    return execFileSync("claude", ["--print", "-p", prompt], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 180000,
    });
  } catch (error) {
    throw new Error(error.stderr || error.message);
  }
}

async function saveResult(agentId, taskType, input, output, success) {
  return convexMutation("agentSdk:saveResult", {
    agentId,
    taskType,
    input,
    output,
    success,
    errorMessage: success ? undefined : "Workflow error",
  });
}

async function runWorkflow(topic) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     AMD - WORKFLOW: Content Marketing Completo            ║");
  console.log("║     💎 Plan Max - Sin costos de API                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`📌 Tema: ${topic}\n`);

  const results = {
    keyword: null,
    blog: null,
    linkedin: null,
    twitter: null,
  };

  // ══════════════════════════════════════════════════════════════
  // PASO 1: SEO Strategist - Identificar keyword
  // ══════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("🔍 PASO 1/4: SEO Strategist identificando keyword...\n");

  const keywordPrompt = `Eres un experto SEO. Para el tema "${topic}", identifica:
1. LA keyword principal más importante (solo una)
2. El search intent
3. Volumen estimado (alto/medio/bajo)

Responde en este formato exacto:
KEYWORD: [tu keyword]
INTENT: [informacional/transaccional/navegacional]
VOLUMEN: [alto/medio/bajo]
TÍTULO SUGERIDO: [título optimizado para SEO]`;

  try {
    const keywordResult = runClaude(keywordPrompt);
    console.log(keywordResult);

    // Extraer keyword del resultado
    const keywordMatch = keywordResult.match(/KEYWORD:\s*(.+)/i);
    const titleMatch = keywordResult.match(/TÍTULO SUGERIDO:\s*(.+)/i);

    results.keyword = {
      keyword: keywordMatch ? keywordMatch[1].trim() : topic,
      title: titleMatch ? titleMatch[1].trim() : `Guía completa sobre ${topic}`,
      raw: keywordResult,
    };

    await saveResult("seo-001", "keyword_research", { topic }, keywordResult, true);
    console.log("✅ Keyword identificada\n");
  } catch (error) {
    console.error("❌ Error en SEO:", error.message);
    results.keyword = { keyword: topic, title: `Guía sobre ${topic}` };
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 2: Blog Writer - Escribir artículo
  // ══════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("📝 PASO 2/4: Blog Writer escribiendo artículo...\n");

  const blogPrompt = `Escribe un artículo de blog profesional:

Título: ${results.keyword.title}
Keyword principal: ${results.keyword.keyword}
Extensión: 800 palabras aproximadamente
Tono: Profesional pero accesible
Estructura: Introducción, 4-5 secciones con H2, conclusión

Incluye:
- La keyword naturalmente distribuida
- Datos o estadísticas cuando sea relevante
- Tips prácticos y accionables
- Un CTA al final

Devuelve SOLO el artículo en Markdown.`;

  try {
    const blogResult = runClaude(blogPrompt);
    console.log(blogResult.substring(0, 500) + "...\n[Artículo completo guardado]\n");

    results.blog = blogResult;
    await saveResult("content-002", "write_blog", {
      title: results.keyword.title,
      keyword: results.keyword.keyword
    }, blogResult, true);
    console.log("✅ Artículo escrito\n");
  } catch (error) {
    console.error("❌ Error en Blog:", error.message);
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 3: LinkedIn Creator - Crear post
  // ══════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("💼 PASO 3/4: LinkedIn Creator adaptando contenido...\n");

  const linkedinPrompt = `Crea un post de LinkedIn viral basado en este artículo:

${results.blog ? results.blog.substring(0, 1500) : `Tema: ${topic}`}

El post debe:
- Tener un hook potente en las primeras 2 líneas
- Usar espaciado estratégico (líneas cortas)
- Incluir 3-5 bullets con insights clave
- Terminar con CTA y pregunta
- 3-5 hashtags relevantes
- Emojis estratégicos (no excesivos)

Devuelve SOLO el post, listo para copiar.`;

  try {
    const linkedinResult = runClaude(linkedinPrompt);
    console.log(linkedinResult);

    results.linkedin = linkedinResult;
    await saveResult("social-001", "create_linkedin_post", {
      topic,
      sourceContent: results.blog?.substring(0, 500)
    }, linkedinResult, true);
    console.log("\n✅ Post LinkedIn creado\n");
  } catch (error) {
    console.error("❌ Error en LinkedIn:", error.message);
  }

  // ══════════════════════════════════════════════════════════════
  // PASO 4: Twitter Creator - Crear thread
  // ══════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("🐦 PASO 4/4: Twitter Creator creando thread...\n");

  const twitterPrompt = `Crea un thread de Twitter/X de 5 tweets basado en:

${results.blog ? results.blog.substring(0, 1500) : `Tema: ${topic}`}

Formato:
1/ [Hook potente - debe generar curiosidad]
2/ [Insight principal]
3/ [Dato o ejemplo]
4/ [Tip práctico]
5/ [Resumen + CTA para seguir]

Reglas:
- Máximo 280 caracteres por tweet
- Cada tweet debe tener valor independiente
- Usa números y bullets cuando ayude
- El primer tweet DEBE generar curiosidad

Devuelve SOLO los tweets numerados.`;

  try {
    const twitterResult = runClaude(twitterPrompt);
    console.log(twitterResult);

    results.twitter = twitterResult;
    await saveResult("social-002", "create_twitter_thread", {
      topic,
      tweetCount: 5
    }, twitterResult, true);
    console.log("\n✅ Thread Twitter creado\n");
  } catch (error) {
    console.error("❌ Error en Twitter:", error.message);
  }

  // ══════════════════════════════════════════════════════════════
  // RESUMEN
  // ══════════════════════════════════════════════════════════════
  console.log("━".repeat(60));
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                    WORKFLOW COMPLETADO                     ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log("📊 Resumen de ejecución:\n");
  console.log(`   ✅ SEO Strategist    → Keyword: "${results.keyword?.keyword}"`);
  console.log(`   ✅ Blog Writer       → Artículo: ${results.blog ? "Generado" : "Error"}`);
  console.log(`   ✅ LinkedIn Creator  → Post: ${results.linkedin ? "Generado" : "Error"}`);
  console.log(`   ✅ Twitter Creator   → Thread: ${results.twitter ? "Generado" : "Error"}`);
  console.log("\n💰 Costo total: $0.00 (Plan Max)");
  console.log("\n📍 Ver resultados en: http://localhost:3001/analytics\n");

  return results;
}

// CLI
const args = process.argv.slice(2);
let topic = "Marketing Digital con IA";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--topic" || args[i] === "-t") {
    topic = args[++i];
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Uso: node scripts/workflow-content.js --topic "Tu tema"

Opciones:
  --topic, -t   Tema para el contenido

Ejemplo:
  node scripts/workflow-content.js --topic "Automatización de ventas B2B"
    `);
    process.exit(0);
  }
}

runWorkflow(topic).catch(console.error);
