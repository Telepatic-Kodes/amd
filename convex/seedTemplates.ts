import { mutation } from "./_generated/server";

const TEMPLATES = [
  // ── SOCIAL (3) ──────────────────────────────
  {
    templateId: "tpl_linkedin_authority",
    name: "LinkedIn Thought Leadership",
    description: "Post profesional que posiciona tu expertise y genera conversación",
    category: "social" as const,
    industry: ["saas", "consulting", "general"],
    contentType: "social_linkedin",
    channels: ["linkedin"],
    promptTemplate: `Write a LinkedIn thought leadership post about "{{topic}}".

Structure:
1. Hook (1 line, bold statement or question that stops the scroll)
2. Personal insight or contrarian take (2-3 short paragraphs)
3. 3 actionable takeaways (numbered list)
4. Engagement question to spark discussion
5. 3-5 relevant hashtags

Target audience: {{audience}}
Tone: {{tone}}
{{cta}}`,
    variables: [
      { name: "topic", description: "Main topic or thesis", required: true },
      { name: "audience", description: "Who you're writing for", required: false, default: "profesionales de marketing" },
      { name: "tone", description: "Voice tone", required: false, default: "profesional pero cercano" },
      { name: "cta", description: "Call to action", required: false },
    ],
    exampleOutput: `¿Sabías que el 73% de los equipos de marketing aún crean contenido sin un sistema de templates?\n\nDespués de automatizar la producción de contenido para 12 empresas, descubrí algo contraintuitivo: la creatividad no muere con los templates. Florece.\n\nCuando eliminas la parálisis del lienzo en blanco, tu equipo dedica su energía a lo que realmente importa: la estrategia y el mensaje.\n\n3 lecciones clave:\n1. Los templates reducen el tiempo de producción un 80%\n2. La consistencia de marca mejora un 60%\n3. El engagement sube porque la calidad es más predecible\n\n¿Tu equipo ya usa templates de contenido? ¿Qué resultado han visto?\n\n#MarketingDigital #ContentMarketing #Productividad`,
    tags: ["authority", "engagement", "thought-leadership"],
  },
  {
    templateId: "tpl_twitter_thread",
    name: "Twitter/X Thread Educativo",
    description: "Hilo de 5-7 tweets que explica un concepto y genera retweets",
    category: "social" as const,
    industry: ["saas", "consulting", "ecommerce", "general"],
    contentType: "social_twitter",
    channels: ["twitter"],
    promptTemplate: `Write a Twitter/X thread (5-7 tweets) about "{{topic}}".

Structure:
- Tweet 1: Hook that promises value (use numbers or bold claim)
- Tweets 2-5: One key insight per tweet, each with a concrete example
- Tweet 6: Summary or framework
- Tweet 7: CTA + "Follow for more" or engagement ask

Rules:
- Each tweet max 280 characters
- Use line breaks for readability
- Include 1-2 emojis per tweet (strategic, not excessive)
- Number each tweet as 1/, 2/, etc.

Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "Thread topic", required: true },
      { name: "audience", description: "Target audience", required: false, default: "emprendedores y marketers" },
      { name: "tone", description: "Voice tone", required: false, default: "directo y educativo" },
    ],
    exampleOutput: `1/ El 90% de las empresas hacen marketing de contenido.\n\nPero solo el 10% tiene un sistema que funciona.\n\nAquí van 5 errores que matan tu estrategia de contenido 🧵\n\n2/ Error #1: Publicar sin calendario\n\nSin un plan, publicas cuando "te acuerdas".\n\nSolución: Define 3 pilares de contenido y asigna días fijos a cada uno.\n\n3/ Error #2: Copiar lo que hace tu competencia\n\nSi dices lo mismo que todos, nadie te recuerda.\n\nEncuentra tu ángulo único y repítelo hasta que sea tu marca.`,
    tags: ["engagement", "education", "viral"],
  },
  {
    templateId: "tpl_instagram_carousel",
    name: "Instagram Carousel Caption",
    description: "Caption para carrusel educativo que genera saves y shares",
    category: "social" as const,
    industry: ["ecommerce", "consulting", "general"],
    contentType: "social_instagram",
    channels: ["instagram"],
    promptTemplate: `Write an Instagram carousel caption for a post about "{{topic}}".

The carousel has 7-10 slides. Write:
1. Caption (max 2200 chars): Hook in first line, story or insight, CTA
2. Suggested slide titles (one per line, 7-10 titles)
3. 15-20 relevant hashtags (mix of high and low volume)

Target audience: {{audience}}
Tone: {{tone}}
{{cta}}`,
    variables: [
      { name: "topic", description: "Carousel topic", required: true },
      { name: "audience", description: "Target audience", required: false, default: "emprendedores digitales" },
      { name: "tone", description: "Voice tone", required: false, default: "inspirador y educativo" },
      { name: "cta", description: "Call to action", required: false, default: "Guarda este post para cuando lo necesites" },
    ],
    exampleOutput: `PARA de crear contenido sin estrategia. 🛑\n\nHace 6 meses publicaba 5 veces por semana sin ver resultados.\n\nHoy publico 3 veces y genero 4x más leads.\n\n¿La diferencia? Un sistema de templates que me ahorra 10 horas semanales.\n\nDesliza para ver los 7 templates que cambiaron todo ➡️\n\nGuarda este post para cuando lo necesites 📌\n\n.\n.\n.\n#MarketingDigital #ContentMarketing #Templates`,
    tags: ["saves", "education", "carousel"],
  },

  // ── BLOG (3) ────────────────────────────────
  {
    templateId: "tpl_blog_seo",
    name: "Artículo SEO Optimizado",
    description: "Artículo de blog de 1200-1500 palabras optimizado para posicionar en Google",
    category: "blog" as const,
    industry: ["saas", "consulting", "ecommerce", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Write an SEO-optimized blog article about "{{topic}}".

Structure:
1. Title (H1): Include primary keyword, max 60 chars
2. Meta description: 150-160 chars, include keyword and CTA
3. Introduction (150 words): Hook, problem statement, what reader will learn
4. 3-5 H2 sections (200-300 words each): Main content with examples
5. Conclusion: Summary + CTA
6. Suggested internal links section

Target length: 1200-1500 words
Primary keyword: derived from the topic
Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "Article topic / primary keyword", required: true },
      { name: "audience", description: "Target reader", required: false, default: "profesionales buscando soluciones" },
      { name: "tone", description: "Writing tone", required: false, default: "experto pero accesible" },
    ],
    exampleOutput: `# Cómo Crear Templates de Contenido que Ahorran 10 Horas Semanales\n\n**Meta:** Descubre cómo crear templates de contenido efectivos que reducen tu tiempo de producción un 80% sin sacrificar calidad.\n\n## Introducción\n\nSi estás leyendo esto, probablemente pasas demasiado tiempo creando contenido desde cero...`,
    tags: ["seo", "organic", "long-form"],
  },
  {
    templateId: "tpl_blog_howto",
    name: "Guía Paso a Paso (How-To)",
    description: "Tutorial práctico con pasos numerados, ideal para capturar tráfico de búsqueda",
    category: "blog" as const,
    industry: ["saas", "consulting", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Write a step-by-step how-to guide about "{{topic}}".

Structure:
1. Title: "Cómo [result] en [number] pasos" format
2. Introduction: Why this matters, what they'll achieve
3. Prerequisites or "Before you start" section
4. 5-8 numbered steps, each with:
   - Clear action title
   - 2-3 paragraphs of explanation
   - Pro tip or common mistake
5. Expected results / what success looks like
6. FAQ section (3 questions)

Target length: 1500-2000 words
Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "What readers will learn to do", required: true },
      { name: "audience", description: "Who the guide is for", required: false, default: "principiantes y nivel intermedio" },
      { name: "tone", description: "Writing tone", required: false, default: "práctico y motivador" },
    ],
    exampleOutput: `# Cómo Automatizar tu Marketing de Contenido en 6 Pasos\n\n## ¿Por qué automatizar?\nEl 67% de los marketers reportan que la automatización les ahorra más de 6 horas semanales...\n\n## Antes de empezar\nNecesitarás:\n- Una cuenta en tu CMS preferido\n- Acceso a una herramienta de IA\n- 30 minutos de tiempo dedicado\n\n## Paso 1: Define tus pilares de contenido\n...`,
    tags: ["tutorial", "seo", "how-to"],
  },
  {
    templateId: "tpl_blog_listicle",
    name: "Listicle (Top N)",
    description: "Artículo tipo lista que genera clics y es fácil de compartir",
    category: "blog" as const,
    industry: ["ecommerce", "saas", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Write a listicle article about "{{topic}}".

Structure:
1. Title: "N [category] para [result] en [year]" format
2. Introduction: Quick context + promise of value
3. 7-10 items, each with:
   - Numbered subtitle
   - 2-3 paragraph description
   - Why it matters / pro tip
4. Conclusion with "best overall" pick
5. Brief FAQ (2-3 questions)

Target length: 1200-1500 words
Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "List topic", required: true },
      { name: "audience", description: "Target reader", required: false, default: "profesionales y decisores" },
      { name: "tone", description: "Writing tone", required: false, default: "informativo y comparativo" },
    ],
    exampleOutput: `# 8 Herramientas de Content Marketing que Todo Equipo Necesita en 2026\n\n## Introducción\nEl ecosistema de herramientas de marketing cambia rápido. Estas son las que realmente valen la inversión...\n\n## 1. Plataforma de Templates Inteligentes\nPor qué: Reduce el tiempo de creación un 80%...`,
    tags: ["listicle", "seo", "shareable"],
  },

  // ── EMAIL (2) ───────────────────────────────
  {
    templateId: "tpl_email_welcome",
    name: "Secuencia de Bienvenida",
    description: "Email de bienvenida que establece expectativas y genera primera acción",
    category: "email" as const,
    industry: ["saas", "ecommerce", "consulting", "general"],
    contentType: "email",
    channels: ["email"],
    promptTemplate: `Write a welcome email for new subscribers/users about "{{topic}}".

Structure:
1. Subject line (max 50 chars, curiosity-driven)
2. Preview text (max 90 chars)
3. Email body:
   - Warm greeting
   - What they can expect (3 bullet points)
   - One quick win / immediate value
   - CTA button text
   - PS line with personality
4. Suggested follow-up email subject (for day 3)

Target audience: {{audience}}
Tone: {{tone}}
{{cta}}`,
    variables: [
      { name: "topic", description: "Product/service or community theme", required: true },
      { name: "audience", description: "New subscriber profile", required: false, default: "nuevos suscriptores" },
      { name: "tone", description: "Email tone", required: false, default: "cálido y entusiasta" },
      { name: "cta", description: "Primary call to action", required: false, default: "Explorar la plataforma" },
    ],
    exampleOutput: `Subject: Bienvenido — tu primer paso hacia marketing automatizado 🚀\nPreview: Esto es lo que te espera (y un regalo)\n\nHola {{nombre}},\n\n¡Gracias por unirte! Estás en el lugar correcto.\n\nEsto es lo que recibirás:\n• Tips semanales de content marketing\n• Templates exclusivos cada mes\n• Acceso a nuestra comunidad\n\nTu primera acción: Descarga el template de calendario editorial que usan +500 marketers.\n\n[Descargar Template Gratis]\n\nPD: Responde este email con tu mayor desafío de contenido. Leo todos. 📬`,
    tags: ["onboarding", "nurture", "conversion"],
  },
  {
    templateId: "tpl_email_launch",
    name: "Email de Lanzamiento de Producto",
    description: "Anuncio de producto/feature que genera urgencia y conversiones",
    category: "email" as const,
    industry: ["saas", "ecommerce", "general"],
    contentType: "email",
    channels: ["email"],
    promptTemplate: `Write a product launch announcement email about "{{topic}}".

Structure:
1. Subject line (max 50 chars, create urgency or curiosity)
2. Preview text (max 90 chars)
3. Email body:
   - Opening: What's new (1 sentence, impactful)
   - The problem it solves (2-3 sentences)
   - Key features (3-4 bullet points with benefits)
   - Social proof or early results (1 line)
   - Primary CTA button
   - Secondary CTA (learn more / see demo)
4. Urgency element (limited time, early bird, etc.)

Target audience: {{audience}}
Tone: {{tone}}
{{cta}}`,
    variables: [
      { name: "topic", description: "Product or feature being launched", required: true },
      { name: "audience", description: "Who receives this email", required: false, default: "usuarios activos" },
      { name: "tone", description: "Email tone", required: false, default: "emocionado pero profesional" },
      { name: "cta", description: "Primary CTA", required: false, default: "Probar ahora" },
    ],
    exampleOutput: `Subject: Nuevo: Templates de contenido con IA 🎯\nPreview: Crea contenido publish-ready en 3 minutos\n\nHola {{nombre}},\n\nHoy lanzamos Content Templates — tu nuevo superpoder de marketing.\n\nEl problema: Crear contenido de calidad toma demasiado tiempo.\n\nLa solución:\n✅ 12 templates pre-construidos por expertos\n✅ Generación con IA en tu tono de marca\n✅ De idea a borrador en 3 minutos\n\nLos beta testers ya reportan un 80% menos de tiempo por pieza.\n\n[Probar Templates →]\n\nPrimeros 100 usuarios: acceso premium gratis por 30 días.`,
    tags: ["launch", "conversion", "urgency"],
  },

  // ── ADS (2) ─────────────────────────────────
  {
    templateId: "tpl_ads_google",
    name: "Google Ads Copy",
    description: "Set de anuncios responsive para Google Search con múltiples headlines y descriptions",
    category: "ads" as const,
    industry: ["saas", "ecommerce", "consulting", "general"],
    contentType: "ad_copy",
    channels: ["google_ads"],
    promptTemplate: `Create Google Responsive Search Ad copy for "{{topic}}".

Generate:
1. 10 Headlines (max 30 chars each):
   - 3 with primary keyword
   - 2 with benefits
   - 2 with numbers/stats
   - 2 with CTA
   - 1 with brand name placeholder
2. 4 Descriptions (max 90 chars each):
   - 1 benefit-focused
   - 1 feature-focused
   - 1 social proof
   - 1 urgency/CTA
3. Suggested sitelink extensions (4)
4. Suggested callout extensions (6)

Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "Product/service to advertise", required: true },
      { name: "audience", description: "Target searcher intent", required: false, default: "personas buscando soluciones" },
      { name: "tone", description: "Ad tone", required: false, default: "directo y orientado a acción" },
    ],
    exampleOutput: `HEADLINES:\n1. Templates de Marketing con IA\n2. Crea Contenido en 3 Minutos\n3. Ahorra 10 Horas Semanales\n4. +500 Marketers Ya lo Usan\n5. Prueba Gratis Hoy\n...\n\nDESCRIPTIONS:\n1. Genera contenido publish-ready con templates inteligentes. Ahorra 80% del tiempo.\n2. 12 templates para blog, redes sociales, email y ads. Usa tu tono de marca.\n...`,
    tags: ["ppc", "conversion", "search"],
  },
  {
    templateId: "tpl_ads_meta",
    name: "Meta Ads (Facebook/Instagram)",
    description: "Set de anuncios para Facebook e Instagram con variantes de copy",
    category: "ads" as const,
    industry: ["ecommerce", "saas", "general"],
    contentType: "ad_copy",
    channels: ["facebook", "instagram"],
    promptTemplate: `Create Meta (Facebook/Instagram) ad copy variants for "{{topic}}".

Generate 3 ad variants:

For each variant:
1. Primary Text (125 chars for mobile, full version for desktop)
2. Headline (max 40 chars)
3. Description (max 30 chars)
4. CTA button suggestion (Shop Now, Learn More, Sign Up, etc.)

Variant types:
- Variant A: Benefit-led (focus on outcome)
- Variant B: Problem-led (agitate pain point)
- Variant C: Social proof-led (numbers, testimonials)

Target audience: {{audience}}
Tone: {{tone}}
{{cta}}`,
    variables: [
      { name: "topic", description: "Product/service to advertise", required: true },
      { name: "audience", description: "Target audience", required: false, default: "decisores de marketing 25-45" },
      { name: "tone", description: "Ad tone", required: false, default: "conversacional y persuasivo" },
      { name: "cta", description: "Call to action", required: false, default: "Probar gratis" },
    ],
    exampleOutput: `VARIANT A (Benefit-led):\nPrimary: ¿10 horas creando contenido? Con nuestros templates, lo haces en 1. Probado por +500 marketers.\nHeadline: Contenido Pro en Minutos\nDescription: Prueba gratis 14 días\nCTA: Sign Up\n\nVARIANT B (Problem-led):\nPrimary: Tu equipo pasa más tiempo creando que vendiendo. Eso tiene solución.\n...`,
    tags: ["social-ads", "conversion", "retargeting"],
  },

  // ── MISC (2) ────────────────────────────────
  {
    templateId: "tpl_case_study",
    name: "Caso de Éxito (Case Study)",
    description: "Historia de cliente con estructura problema-solución-resultado",
    category: "misc" as const,
    industry: ["saas", "consulting", "general"],
    contentType: "case_study",
    channels: ["blog", "linkedin", "email"],
    promptTemplate: `Write a case study outline about "{{topic}}".

Structure:
1. Title: "[Client type] logra [result] con [solution]"
2. Executive Summary (3-4 sentences)
3. The Challenge:
   - Context and background
   - Specific pain points (3)
   - What they tried before
4. The Solution:
   - Why they chose this approach
   - Implementation process (3-4 steps)
   - Key features used
5. The Results:
   - 3 quantified metrics (before/after)
   - Qualitative benefits
   - Quote from client (fictional but realistic)
6. Key Takeaways (3 bullet points)

Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "Client story or solution showcased", required: true },
      { name: "audience", description: "Target reader", required: false, default: "prospectos evaluando soluciones similares" },
      { name: "tone", description: "Writing tone", required: false, default: "profesional y basado en datos" },
    ],
    exampleOutput: `# Agencia Digital Reduce Tiempo de Producción un 80% con Content Templates\n\n## Resumen\nUna agencia de marketing digital con 15 clientes activos logró reducir su tiempo de producción de contenido de 30 horas a 6 horas semanales...\n\n## El Desafío\nCon un equipo de solo 3 personas y 15 clientes exigiendo contenido semanal...`,
    tags: ["social-proof", "bottom-funnel", "conversion"],
  },
  {
    templateId: "tpl_newsletter",
    name: "Newsletter Semanal",
    description: "Newsletter curada con insights, noticias del sector y contenido propio",
    category: "misc" as const,
    industry: ["saas", "consulting", "ecommerce", "general"],
    contentType: "newsletter",
    channels: ["email"],
    promptTemplate: `Write a weekly newsletter issue about "{{topic}}".

Structure:
1. Subject line (curiosity or number-driven, max 50 chars)
2. Preview text (max 90 chars)
3. Greeting + 1-line intro
4. Main Story (200-300 words):
   - Key insight or trend
   - Why it matters for the reader
   - Actionable takeaway
5. Quick Hits (3 bullet items):
   - Industry news, tools, or tips (2-3 sentences each)
6. Resource of the Week:
   - One link/tool recommendation with brief review
7. CTA / engagement question
8. Sign-off with personality

Target audience: {{audience}}
Tone: {{tone}}`,
    variables: [
      { name: "topic", description: "Newsletter theme this week", required: true },
      { name: "audience", description: "Subscriber profile", required: false, default: "profesionales de marketing" },
      { name: "tone", description: "Newsletter tone", required: false, default: "cercano, como hablar con un colega" },
    ],
    exampleOutput: `Subject: 3 tendencias de contenido que deberías conocer esta semana\nPreview: Plus: una herramienta gratuita que te va a encantar\n\nHola 👋\n\nEsta semana vi algo interesante: las marcas que usan templates de contenido publican 3x más que las que no.\n\n## 📰 La Historia Principal\nEl content marketing está cambiando...\n\n## ⚡ Quick Hits\n• Google actualizó su algoritmo...\n• Nueva herramienta de IA para...\n• Estudio: el 67% de los marketers...\n\n## 🔧 Recurso de la Semana\n...`,
    tags: ["nurture", "engagement", "recurring"],
  },
];

export const seed = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Check if templates already exist to avoid duplicates
    const existing = await ctx.db.query("contentTemplates").first();
    if (existing) {
      // Clear existing templates for a clean re-seed
      const all = await ctx.db.query("contentTemplates").collect();
      for (const t of all) {
        await ctx.db.delete(t._id);
      }
    }

    let count = 0;
    for (const template of TEMPLATES) {
      await ctx.db.insert("contentTemplates", {
        ...template,
        isActive: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return { seeded: count, templates: TEMPLATES.map((t) => t.templateId) };
  },
});
