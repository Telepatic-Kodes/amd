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
    description: "Campaña completa multi-formato para Meta: Reels, Carousel y Stories con hooks probados, UGC guidelines y variantes A/B",
    category: "ads" as const,
    industry: ["ecommerce", "saas", "beauty", "wellness", "general"],
    contentType: "ad_copy",
    channels: ["facebook", "instagram"],
    promptTemplate: `Create a complete Meta Ads campaign for "{{topic}}".

Target audience: {{audience}}
Tone: {{tone}}
Main CTA: {{cta}}
Ad format focus: {{format}}

---

## FORMAT 1: REEL AD (15-30 seconds)

Write a Reel ad script with this structure:
1. **HOOK (first 2-3 seconds)** — Must stop the scroll. Use one of these proven patterns:
   - Direct problem: "Si tu [pain point]..."
   - Curiosity gap: "Lo que nadie te dice sobre [topic]..."
   - Transformation teaser: "Mira lo que [time] puede hacer"
   - Bold question: "¿Cuándo fue la última vez que [desirable action]?"
2. **BODY (10-20 seconds)** — Show the process/product/transformation. Describe the visual flow step by step.
3. **RESULT + CTA (last 3-5 seconds)** — Realistic outcome statement + clear CTA with text overlay.
4. **Burned-in subtitle text** for each section (Reels with subtitles get +44% CTR).
5. **UGC direction** — Describe how a real customer or creator would film this (UGC video delivers +38% ROAS vs produced content).

## FORMAT 2: CAROUSEL AD (4-5 cards)

Design a carousel following this high-converting structure:
- **Card 1**: Eye-catching hook — pain point or bold statement that makes people swipe
- **Card 2**: Your solution — what you offer and why it works
- **Card 3**: Process/ingredients/details — build trust with specifics
- **Card 4**: Social proof — before/after, testimonial, or results data
- **Card 5**: Offer + CTA — limited-time incentive with clear next step

For each card provide:
- Visual description (what the image/graphic shows)
- Text overlay (short, benefit-first, max 15 words)
- Card-specific CTA or swipe prompt

Note: Carousels outperform single-image ads by 27% and deliver 30-50% lower CPA.

## FORMAT 3: STORY AD (interactive)

Create a Story ad concept:
1. **Visual hook** (full-screen, vertical 9:16)
2. **Interactive element**: Poll ("¿[Option A] o [Option B]?"), Quiz, or Slider
3. **Auto-DM follow-up**: Message to send after interaction with personalized offer
4. **Swipe-up/link CTA**

## AD COPY VARIANTS (for all formats)

Generate 3 copy variants for the Primary Text field:

- **Variant A (Benefit-led)**: Focus on the transformation/outcome. Open with the result.
- **Variant B (Problem-agitation)**: Start with the pain point in first 2 seconds, then present the solution.
- **Variant C (Social proof)**: Lead with numbers, testimonials, or crowd validation.

For each variant:
- Primary Text: Short version (125 chars for mobile) + Full version (up to 250 chars)
- Headline (max 40 chars)
- Description (max 30 chars)
- CTA button: Shop Now / Learn More / Book Now / Sign Up / Get Offer

## CAMPAIGN RECOMMENDATIONS

Provide:
- Suggested daily budget split across formats
- A/B testing priority (which variant to test first and why)
- Retargeting strategy: what to show people who engaged but didn't convert
- Best posting times for the target audience
- Comment response template (25% of purchases happen after brand replies to comments)`,
    variables: [
      { name: "topic", description: "Product or service to advertise", required: true },
      { name: "audience", description: "Target audience demographics and psychographics", required: false, default: "mujeres 25-45, interesadas en bienestar y autocuidado" },
      { name: "tone", description: "Ad tone and voice", required: false, default: "cercano, aspiracional y persuasivo" },
      { name: "cta", description: "Primary call to action", required: false, default: "Reserva tu cita" },
      { name: "format", description: "Focus format: all, reel, carousel, or story", required: false, default: "all" },
    ],
    exampleOutput: `## REEL AD (15 seg)\n\nHOOK [0-3s]: "¿Cuándo fue la última vez que te dedicaste 45 minutos solo a ti?"\nSubtítulo: "Tu piel lo necesita"\n\nBODY [3-12s]:\n- Toma 1: Clienta entrando al spa (POV cámara)\n- Toma 2: Close-up del tratamiento facial\n- Toma 3: Texturas y productos (ASMR visual)\nSubtítulo: "Tratamiento facial premium · 45 min"\n\nRESULTO [12-15s]: Clienta sonriendo, piel luminosa\nSubtítulo: "Agenda tu primera sesión → Link en bio"\nText overlay: "Primera vez: -25% off"\n\nUGC DIRECTION: Pedir a clienta real que filme su experiencia con iPhone. Tono casual, sin guión rígido.\n\n---\n\n## CAROUSEL AD (5 cards)\n\nCard 1: "Tu piel pide a gritos un descanso" — imagen de estrés/cansancio facial\nCard 2: "Nuestro facial premium en 3 pasos" — proceso del tratamiento\nCard 3: "Activos naturales: ácido hialurónico + vitamina C" — close-up productos\nCard 4: "Antes y después: 1 sesión" — resultado real de clienta\nCard 5: "Primera sesión con 25% off · Solo esta semana" → CTA: Book Now\n\n---\n\n## STORY AD (interactiva)\n\nVisual: Video vertical de tratamiento en curso\nPoll: "¿Qué necesitas más: ✨ Luminosidad o 💆 Relajación?"\nAuto-DM: "¡Gracias por participar! Tenemos el tratamiento perfecto para ti. Usa el código GLOW25 para un 25% en tu primera visita → [link]"\n\n---\n\n## VARIANTES DE COPY\n\nVariant A (Benefit-led):\nPrimary (short): Piel luminosa en 45 minutos. Sin filtros, sin retoques. Reserva hoy.\nPrimary (full): Piel luminosa en 45 minutos. Nuestro facial premium combina activos naturales con técnicas profesionales. +200 clientas ya lo comprueban. Reserva tu primera sesión con 25% off.\nHeadline: Tu Mejor Piel en 45 Min\nDescription: Primera sesión -25%\nCTA: Book Now\n\nVariant B (Problem-agitation):\nPrimary (short): Tu rutina de skincare no alcanza. Tu piel necesita un reset profesional.\nPrimary (full): Cremas, sérums, mascarillas... y tu piel sigue apagada. A veces no es el producto, es que necesitas manos expertas. Un facial profesional hace lo que 6 meses de rutina no logran.\nHeadline: Tu Piel Necesita Más\nDescription: Facial profesional hoy\nCTA: Book Now\n\nVariant C (Social proof):\nPrimary (short): +200 clientas eligen nuestro facial premium cada mes. ¿Ya lo probaste?\nPrimary (full): Valoración 4.9/5 · +200 faciales al mes · "Salí sintiéndome otra persona" — María G. Descubre por qué somos el spa favorito de Santiago.\nHeadline: El Facial Más Pedido\nDescription: 4.9★ · +200 clientas/mes\nCTA: Book Now\n\n---\n\n## RECOMENDACIONES\n\nBudget: $35/día — 50% Reel, 30% Carousel, 20% Story\nTest primero: Variant B vs C en Reels (problema vs social proof)\nRetargeting: Mostrar Carousel de before/after a quienes vieron >50% del Reel\nHorarios: Lu-Vi 12-14h y 20-22h · Sáb 10-13h\nRespuesta a comentarios: "¡Gracias [nombre]! 😊 Te escribimos por DM con toda la info para agendar."`,
    tags: ["social-ads", "conversion", "retargeting", "ugc", "carousel", "reels"],
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
