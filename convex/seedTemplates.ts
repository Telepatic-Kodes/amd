import { mutation } from "./_generated/server";

const TEMPLATES = [
  // ── SOCIAL (3) ──────────────────────────────
  {
    templateId: "tpl_linkedin_authority",
    name: "LinkedIn Thought Leadership",
    description: "Post de alto impacto optimizado para el algoritmo 2025: hook psicológico, storytelling, framework accionable y engagement triggers con formato adaptado (texto, carrusel o documento)",
    category: "social" as const,
    industry: ["saas", "consulting", "ecommerce", "beauty", "wellness", "general"],
    contentType: "social_linkedin",
    channels: ["linkedin"],
    promptTemplate: `Write a LinkedIn thought leadership post about "{{topic}}".

Post format: {{format}}
Goal: {{goal}}
Target audience: {{audience}}
Tone: {{tone}}
{{cta}}

─── SECTION 1: HOOK (first 3 lines before "see more") ───

Choose the best hook type for this topic:
- Bold statement: "Most [professionals] get [topic] completely wrong."
- Contrarian take: "Unpopular opinion: [common belief] is killing your [result]."
- Numbers/data: "[Stat]% of [audience] do X. Here's what the other [100-stat]% know."
- Personal story: "I [failed/succeeded] at [thing]. Here's what nobody told me."
- Question: "What if everything you know about [topic] is outdated?"

Rules:
- First line = pattern interrupt (max 10 words, stops the scroll)
- Line 2-3 = curiosity gap (incomplete info that demands resolution)
- Must compel "see more" click

─── SECTION 2: BODY (adapted to format) ───

IF format = "text post":
  - Opening context (2-3 short paragraphs, max 3 lines each)
  - Personal insight or experience that builds credibility
  - Framework/methodology with 3-5 numbered takeaways
  - Each takeaway: bold title + 1-line explanation
  - Use line breaks liberally (1 idea per line = higher readability)
  - Total length: 1,200-1,500 characters (sweet spot for engagement)

IF format = "carousel/document":
  - Slide 1: Hook title + subtitle (same as hook)
  - Slide 2: Problem/context (why this matters now)
  - Slides 3-7: One key insight per slide with visual hierarchy
  - Slide 8: Summary framework or checklist
  - Slide 9: CTA slide (follow, comment, save)
  - Each slide: headline (max 8 words) + supporting text (max 30 words)
  - Optimal: 8-10 slides

IF format = "story post":
  - Situation: Set the scene (when, where, what happened)
  - Struggle: The challenge or failure faced
  - Solution: What changed and the breakthrough moment
  - System: The framework/method that emerged
  - Takeaway: What the reader can apply today

─── SECTION 3: ENGAGEMENT TRIGGERS ───

End the post with ONE of these engagement patterns:
- Debate starter: "Agree or disagree? I want to hear your take."
- Experience ask: "What's your experience with [topic]? Drop it below."
- Tag prompt: "Tag someone who needs to hear this."
- Poll suggestion: "[Option A] vs [Option B] — which works better for you?"
- Save trigger: "Bookmark this for your next [situation]."

─── SECTION 4: HASHTAGS & OPTIMIZATION ───

- 3-5 hashtags max (algorithm penalizes 6+)
- Mix: 1 broad (#Marketing), 1 niche (#B2BContentStrategy), 1 branded or trending
- Place hashtags in first comment OR at the very end
- Suggest optimal posting time for the target audience
- Suggest a 1-line comment to post immediately after publishing (algorithm boost)`,
    variables: [
      { name: "topic", description: "Main topic, thesis or contrarian take", required: true },
      { name: "audience", description: "Who you're writing for", required: false, default: "profesionales de marketing y founders" },
      { name: "tone", description: "Voice tone", required: false, default: "profesional pero cercano, con autoridad ganada" },
      { name: "format", description: "Post format: text, carousel, or story", required: false, default: "text" },
      { name: "goal", description: "Post goal: authority, leads, engagement, or awareness", required: false, default: "authority" },
      { name: "cta", description: "Specific call to action (optional)", required: false },
    ],
    exampleOutput: `La mayoría de los spas invierten en Instagram y olvidan LinkedIn.\n\nError costoso.\n\n→ Sigue leyendo\n\nEn los últimos 8 meses trabajando con Berke Spa, descubrimos que LinkedIn generaba 3x más reservas de tratamientos premium que Instagram.\n\n¿La razón? Las clientas que buscan tratamientos de $150.000+ CLP investigan. Comparan. Y confían en contenido profesional.\n\nAquí el framework que usamos:\n\n𝟏. 𝗖𝗼𝗻𝘁𝗲𝗻𝗶𝗱𝗼 𝗲𝗱𝘂𝗰𝗮𝘁𝗶𝘃𝗼 > 𝗽𝗿𝗼𝗺𝗼𝗰𝗶𝗼𝗻𝗮𝗹\nEl 80% de posts explican skincare science. Solo el 20% vende.\n\n𝟐. 𝗦𝘁𝗼𝗿𝘆𝘁𝗲𝗹𝗹𝗶𝗻𝗴 𝗱𝗲 𝗿𝗲𝘀𝘂𝗹𝘁𝗮𝗱𝗼𝘀\nAntes/después con contexto: qué tratamiento, cuántas sesiones, qué cambió.\n\n𝟑. 𝗔𝘂𝘁𝗼𝗿𝗶𝗱𝗮𝗱 𝘁é𝗰𝗻𝗶𝗰𝗮\nLa directora comparte papers y tendencias de dermocosmética.\n\n𝟒. 𝗣𝗿𝘂𝗲𝗯𝗮 𝘀𝗼𝗰𝗶𝗮𝗹\nReseñas reales de clientas (con permiso) integradas en el storytelling.\n\nResultado: engagement rate del 8.2% (vs 2.1% promedio del sector).\n\n¿Tu negocio de belleza/bienestar usa LinkedIn como canal de adquisición? Cuéntame tu experiencia 👇\n\n#WellnessMarketing #SpaMarketing #LinkedInStrategy\n\n💡 Primer comentario sugerido:\n"Si quieres el template completo del calendario editorial que usamos, comenta 'TEMPLATE' y te lo envío por DM."\n\n⏰ Mejor hora para publicar: Martes o Miércoles, 8:00-10:00 AM hora local`,
    tags: ["authority", "engagement", "thought-leadership", "personal-branding", "hooks", "algorithm"],
  },
  {
    templateId: "tpl_twitter_thread",
    name: "Twitter/X Thread Educativo",
    description: "Hilo viral de 7-10 tweets optimizado para el algoritmo de X: hook irresistible, visual breaks, engagement loops y CTA estratégico con estructura probada para máximas impresiones",
    category: "social" as const,
    industry: ["saas", "consulting", "ecommerce", "beauty", "wellness", "general"],
    contentType: "social_twitter",
    channels: ["twitter"],
    promptTemplate: `Write a Twitter/X educational thread about "{{topic}}".

Thread format: {{format}}
Goal: {{goal}}
Target audience: {{audience}}
Tone: {{tone}}

─── TWEET 1: HOOK (most critical tweet) ───

The first tweet gets standard distribution. All subsequent tweets only reach users who engaged with tweet 1. Make it count.

Choose the best hook pattern:
- Listicle promise: "[Number] [things] that will [result]. A thread 🧵"
- Story hook: "[Time] ago, I [struggled with X]. Today, [amazing result]. Here's what changed:"
- Mistake hook: "Most [audience] get [topic] completely wrong. Here are [N] mistakes (and fixes):"
- Question hook: "Why do some [people] [achieve X] while most [fail]? After [research/experience], here's what I found:"
- Contrarian hook: "Unpopular opinion: [common belief] is wrong. Here's proof 🧵"

Rules for tweet 1:
- Must be self-contained (valuable even without the thread)
- Include 🧵 emoji to signal thread
- Max 200 characters (shorter = more retweets)
- Create a curiosity gap that demands clicking "Show this thread"

─── TWEETS 2-6: CORE CONTENT ───

Each tweet = ONE idea. No exceptions.

Structure per tweet:
- Bold claim or insight (line 1)
- Supporting evidence, example, or data (lines 2-3)
- Transition to next tweet (optional connector)

IF format = "framework":
  - Tweet 2: Context/problem definition
  - Tweet 3-5: Steps/pillars of the framework (one per tweet)
  - Tweet 6: Summary visual (text-based diagram or checklist)

IF format = "mistakes":
  - Tweet 2-6: One mistake per tweet with format:
    "Mistake #N: [what people do wrong]

    Why it fails: [reason]

    Instead: [correct approach]"

IF format = "story":
  - Tweet 2: The struggle/starting point
  - Tweet 3: The turning point
  - Tweet 4-5: The method/system discovered
  - Tweet 6: The results with specific numbers

Rules:
- Each tweet max 280 characters
- 1 emoji per tweet (strategic, not decorative)
- Use line breaks aggressively (1 idea per line)
- Number tweets: 1/, 2/, etc.
- Add a visual break every 3-4 tweets (screenshot, chart, or diagram suggestion)

─── TWEET 7: ENGAGEMENT AMPLIFIER ───

Mid-thread engagement tweet to boost algorithmic distribution:

Options:
- Poll: "Quick question: [A] or [B]? Reply below"
- Bookmark trigger: "🔖 Bookmark this thread — you'll need it"
- Reply bait: "Which of these resonated most? Reply with the number"
- Quote retweet bait: "QRT this with your own [experience/tip]"

─── TWEETS 8-9: VALUE CLOSE ───

- Tweet 8: Summary/recap of key takeaways (use ✅ bullet format)
- Tweet 9: "The bottom line" — one powerful sentence that encapsulates the entire thread

─── TWEET 10: CTA + GROWTH ───

Final tweet structure:
"If you found this valuable:

1. Follow @[handle] for daily [topic] insights
2. Retweet tweet 1/ to help others find this
3. [Specific CTA: DM for resource, link, etc.]

[2-3 hashtags only in this final tweet]"

─── OPTIMIZATION NOTES ───

- Suggest optimal posting time for the audience
- Suggest a reply to tweet 1 to post immediately (self-reply boost)
- Suggest 1-2 accounts to tag or reference for amplification
- Thread completion rate target: >60%`,
    variables: [
      { name: "topic", description: "Thread topic or thesis", required: true },
      { name: "audience", description: "Target audience", required: false, default: "emprendedores, marketers y founders" },
      { name: "tone", description: "Voice tone", required: false, default: "directo, educativo y con autoridad" },
      { name: "format", description: "Thread format: framework, mistakes, or story", required: false, default: "framework" },
      { name: "goal", description: "Thread goal: authority, growth, engagement, or leads", required: false, default: "authority" },
    ],
    exampleOutput: `1/ El 85% de los spas gasta en ads pero ignora el contenido orgánico.\n\nResultado: pagan por cada cliente, una y otra vez.\n\nEn Berke Spa cambiamos eso con un sistema de 5 pilares.\n\nAquí está el framework completo 🧵\n\n2/ Pilar 1: Contenido educativo (no promocional)\n\nEl error más común: "¡50% OFF en faciales!"\n\nLo que funciona: "3 señales de que tu piel necesita exfoliación profesional"\n\nRegla 80/20 → 80% valor, 20% venta.\n\n3/ Pilar 2: Storytelling de resultados\n\nNo digas "somos los mejores".\n\nMuestra:\n→ Antes/después (con permiso)\n→ El proceso completo\n→ Cuántas sesiones tomó\n→ Qué dice la clienta\n\nResultados reales > promesas vacías.\n\n4/ Pilar 3: Autoridad técnica\n\n¿Por qué elegir TU spa?\n\nPublica sobre:\n• Ingredientes activos y cómo funcionan\n• Papers científicos simplificados\n• Tendencias de dermocosmética\n\nLa directora de Berke comparte ciencia → las clientas confían.\n\n📊 [Sugerencia visual: infografía de ingredientes activos top 5]\n\n5/ Pilar 4: Comunidad y social proof\n\nReseñas de clientas reales en formato storytelling:\n\n"Llegué con acné severo después de 2 años sin tratamiento.\n3 meses después, mi piel cambió por completo."\n— Carolina M. ★★★★★\n\nEso convierte más que cualquier ad.\n\n6/ Pilar 5: Contenido detrás de escenas\n\nMuestra:\n→ El equipo preparando tratamientos\n→ Nuevos productos llegando\n→ Capacitaciones del equipo\n→ El espacio (ambientación, música)\n\nHumaniza tu marca. La gente compra a personas.\n\n7/ 🔖 Bookmark este hilo.\n\nVas a querer volver cuando planifiques tu próximo mes de contenido.\n\n¿Cuál de los 5 pilares te falta implementar? Responde con el número 👇\n\n8/ Resumen del framework:\n\n✅ 80% contenido educativo, 20% venta\n✅ Storytelling de antes/después\n✅ Autoridad con ciencia real\n✅ Social proof en formato historia\n✅ Behind-the-scenes para humanizar\n\n= Clientes que llegan solos, sin pagar ads.\n\n9/ El bottom line:\n\nEl mejor marketing para un spa no parece marketing.\n\nParece educación + confianza + comunidad.\n\n10/ Si te sirvió este hilo:\n\n1. Sígueme para más estrategias de marketing wellness\n2. RT el tweet 1/ para que más spas lo vean\n3. DM "FRAMEWORK" y te mando el template del calendario editorial\n\n#SpaMarketing #ContentStrategy #WellnessMarketing\n\n⏰ Mejor hora: Martes-Jueves, 9:00-11:00 AM hora local\n💬 Auto-reply sugerido en tweet 1: "Hilo completo con el framework de contenido que usamos en @BerkeSpa. Si tienes un spa o negocio wellness, esto te va a servir 👆"`,
    tags: ["engagement", "education", "viral", "threads", "algorithm", "growth"],
  },
  {
    templateId: "tpl_instagram_carousel",
    name: "Instagram Carousel Caption",
    description: "Carrusel de 8-10 slides optimizado para saves y shares (3x peso algorítmico): caption con hook + storytelling, slide titles con open loops, CTAs duales y hashtag strategy para máximo alcance orgánico",
    category: "social" as const,
    industry: ["ecommerce", "consulting", "beauty", "wellness", "general"],
    contentType: "social_instagram",
    channels: ["instagram"],
    promptTemplate: `Write an Instagram carousel caption and slide structure for a post about "{{topic}}".

Carousel type: {{format}}
Goal: {{goal}}
Target audience: {{audience}}
Tone: {{tone}}

─── SECTION 1: SLIDE STRUCTURE (8-10 slides) ───

Slide 1 (COVER — carries 80% of the weight):
- Bold headline: max 8-10 words that answer "Is this for me?" and "What do I get?"
- Subheadline: 1-line value promise
- Include "Desliza →" or swipe prompt (only 5% of carousels do this = competitive advantage)
- Design note: brand colors, clean typography, no clutter

Slide 2 (CONTEXT):
- Set the problem or "why this matters now"
- Use a surprising stat or relatable pain point
- Create an open loop: "Here's what most people get wrong..."

Slides 3-7 (CORE CONTENT — adapted to format):

IF format = "educational":
  - One key lesson per slide
  - Format: Bold title (max 6 words) + 2-3 supporting lines
  - Include a mini visual suggestion per slide (icon, chart, before/after)
  - Use "open loops" between slides: tease what's coming next

IF format = "tips/listicle":
  - One tip per slide with number
  - Format: "Tip #N: [actionable title]" + 1-2 lines explanation
  - Alternate between text-heavy and visual slides

IF format = "before/after":
  - Slide 3: "Before" state (the problem)
  - Slide 4: The turning point
  - Slides 5-6: "After" state with specific results
  - Slide 7: The method/system

IF format = "myth-busting":
  - One myth per slide: "MITO: [common belief]" → "REALIDAD: [truth]"
  - Use red/green visual contrast suggestion

Slide 8 (SUMMARY):
- Recap the key takeaways in bullet or checklist format
- Use ✅ or → for visual structure

Slide 9 (SOCIAL PROOF — optional):
- Testimonial, stat, or result that validates the content
- "Carolina M.: 'Esto cambió mi rutina completamente'"

Slide 10 (CTA SLIDE):
- Primary CTA: save, share, or DM trigger
- Secondary CTA: follow for more / link in bio
- Include a question to drive comments

─── SECTION 2: CAPTION (max 2,200 chars) ───

Structure:
1. HOOK (first line — visible before "...más"):
   - Pattern interrupt: bold statement, question, or contrarian take
   - Must compel tapping "...más" to read the full caption
   - Max 125 characters (Instagram truncates here)

2. BODY (2-3 short paragraphs):
   - Expand the hook with personal story or data
   - Connect emotionally with the audience
   - Reference specific slides: "En la slide 4 te cuento..."
   - Use line breaks liberally (1 idea per line)

3. DUAL CTA:
   - Mid-caption soft CTA: "📌 Guarda este post para tu próxima [situación]"
   - End caption strong CTA: Choose one:
     • DM trigger: "Comenta 'GUÍA' y te mando el recurso completo por DM"
     • Share trigger: "Envíale esto a tu [amiga/colega] que necesita verlo"
     • Save trigger: "Guárdalo, lo vas a necesitar"
     • Engagement trigger: "¿Cuál de estos te sorprendió más? Dímelo en comentarios 👇"

4. HASHTAG STRATEGY (in first comment, NOT in caption):
   - 5 high-volume hashtags (100K-1M posts)
   - 5 medium-volume hashtags (10K-100K posts)
   - 5 niche hashtags (<10K posts, highly targeted)
   - 3-5 branded or location hashtags
   - Total: 18-20 hashtags

─── SECTION 3: OPTIMIZATION NOTES ───

- Suggest adding audio/music track (pushes carousel into Reels feed for 2x reach)
- Suggest optimal posting time for target audience
- Suggest alt text for accessibility (also helps SEO)
- Suggest a pin comment to post immediately after publishing
- Recommend cross-posting to Stories with "New post" sticker`,
    variables: [
      { name: "topic", description: "Carousel topic or educational theme", required: true },
      { name: "audience", description: "Target audience", required: false, default: "mujeres 25-45 interesadas en bienestar y autocuidado" },
      { name: "tone", description: "Voice tone", required: false, default: "cercano, educativo y empoderador" },
      { name: "format", description: "Carousel format: educational, tips, before/after, or myth-busting", required: false, default: "educational" },
      { name: "goal", description: "Post goal: saves, shares, followers, or traffic", required: false, default: "saves" },
      { name: "cta", description: "Specific call to action (optional)", required: false },
    ],
    exampleOutput: `─── SLIDE TITLES ───\n\nSlide 1: "5 Errores de Skincare que Envejecen tu Piel" + Desliza para verlos →\nSlide 2: El 73% de las mujeres usa productos en el orden incorrecto. ¿Eres una de ellas?\nSlide 3: Error #1 — Exfoliar todos los días (destruye tu barrera cutánea)\nSlide 4: Error #2 — Saltarse el SPF en invierno (80% de rayos UV atraviesan nubes)\nSlide 5: Error #3 — Mismo sérum mañana y noche (tu piel necesita cosas distintas)\nSlide 6: Error #4 — No hidratar piel grasa (produce MÁS grasa por compensación)\nSlide 7: Error #5 — Exprimir granitos (cicatrices + más inflamación)\nSlide 8: ✅ Rutina correcta: Limpieza → Tónico → Sérum → Crema → SPF (solo AM)\nSlide 9: "Después de 2 sesiones mi piel cambió completamente" — Carolina M. ★★★★★\nSlide 10: ¿Quieres un diagnóstico personalizado? → Comenta "PIEL" y te lo mando por DM\n\n─── CAPTION ───\n\nPARÁ de envejecer tu piel sin saberlo. 🛑\n\nDespués de 8 años atendiendo pieles en Berke Spa, estos son los 5 errores que vemos TODOS los días.\n\nY el peor parte? La mayoría piensa que está haciendo lo correcto.\n\nEn la slide 3 está el error más común (y el más fácil de corregir).\n\nDesliza para ver los 5 → y al final te dejo la rutina correcta paso a paso.\n\n📌 Guarda este post para cuando vayas a comprar productos.\n\nDato que nadie te dice: el orden de aplicación importa MÁS que los productos que usas. Un sérum de $50.000 CLP no sirve si lo aplicas después de la crema.\n\nEn Berke Spa vemos la diferencia: las clientas que corrigieron solo el ORDEN de su rutina notaron cambios en 2 semanas.\n\n¿Cuál de estos errores cometías sin saber? Dímelo en los comentarios 👇\n\n💌 Comenta "PIEL" y te mando gratis un diagnóstico personalizado para tu tipo de piel.\n\n─── HASHTAGS (primer comentario) ───\n\nAlto volumen: #Skincare #CuidadoDeLaPiel #RutinaFacial #TipsDeBelleza #AntiAging\nMedio volumen: #ErroresSkincare #PielSaludable #CuidadoPersonal #DermatologíaEstética #SPFDiario\nNicho: #SkincareSantiago #EsteticaChile #TratamientoFacial #PielGrasa #BarreraCutánea\nBranded: #BerkeSpa #BerkeGlow #BienestarBerke\n\n─── OPTIMIZACIÓN ───\n\n🎵 Audio sugerido: trending calm/wellness track (empuja al feed de Reels)\n⏰ Mejor hora: Martes o Jueves, 12:00-14:00 o 19:00-21:00 hora local\n📝 Alt text: "Infografía con 5 errores comunes de skincare y rutina correcta paso a paso"\n📌 Pin comment: "¿Quieres saber qué productos específicos usar para TU tipo de piel? Comenta tu tipo (grasa, seca, mixta, sensible) y te respondo 💬"\n📱 Cross-post: Compartir en Stories con sticker "Nuevo post" + encuesta "¿Cuántos errores cometías?"`,
    tags: ["saves", "education", "carousel", "algorithm", "shares", "reels-feed"],
  },

  // ── BLOG (3) ────────────────────────────────
  {
    templateId: "tpl_blog_seo",
    name: "Artículo SEO Optimizado",
    description: "Artículo E-E-A-T compliant de 1500-2000 palabras: title tag + meta optimizados, estructura para featured snippets, schema markup sugerido, keyword clustering, internal linking strategy y CTA de conversión",
    category: "blog" as const,
    industry: ["saas", "consulting", "ecommerce", "beauty", "wellness", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Write an SEO-optimized blog article about "{{topic}}".

Article intent: {{intent}}
Target length: {{length}}
Target audience: {{audience}}
Tone: {{tone}}

─── SECTION 1: SEO METADATA ───

1. Title Tag (H1):
   - Include primary keyword within first 3 words
   - Max 60 characters (Google truncates at 60)
   - Use power words: "Guía", "Cómo", "[Año]", "[Número]"
   - Pattern: "[Primary keyword]: [Benefit/Promise] ([Year])"

2. Meta Description:
   - 150-160 characters exactly
   - Include primary keyword + secondary keyword
   - Include a micro-CTA ("Descubre", "Aprende", "Lee la guía")
   - Must answer: "Why should I click THIS result?"

3. URL Slug:
   - 3-5 words, hyphenated, primary keyword only
   - Example: /tratamientos-faciales-guia-completa

4. Featured Snippet Target:
   - Identify the snippet type for this topic (paragraph, list, table)
   - Write a 40-60 word answer block right after the first H2
   - This block should directly answer the primary search query

─── SECTION 2: ARTICLE STRUCTURE ───

Introduction (150-200 words):
- Hook: Start with a surprising stat, question, or pain point
- Context: Why this topic matters NOW (current year relevance)
- Promise: What the reader will learn/achieve by the end
- E-E-A-T signal: Brief mention of author expertise or experience
- Include primary keyword within first 100 words

Body (4-6 H2 sections, 250-350 words each):
- Each H2 should target a secondary keyword or related question
- Format H2s as questions when possible (maps to "People Also Ask")
- Each section structure:
  a) Direct answer (2-3 sentences — snippet-optimized)
  b) Detailed explanation with examples
  c) Data, stat, or expert quote to support claims
  d) Actionable takeaway or pro tip
- Use H3 subsections for detailed breakdowns
- Include 1 bulleted or numbered list per 2 sections (list snippet targets)
- Add image/visual suggestions with alt text descriptions

Conclusion (100-150 words):
- Summarize 3 key takeaways in bullet format
- Restate the primary value proposition
- Strong CTA (next action the reader should take)
- Include primary keyword naturally

─── SECTION 3: E-E-A-T OPTIMIZATION ───

Experience signals:
- Include at least 1 first-hand example or case study
- Reference specific numbers, dates, or results from real experience
- Use phrases like "In our experience...", "After working with X clients..."

Expertise signals:
- Cite 2-3 authoritative sources (studies, industry reports)
- Reference industry-specific terminology correctly
- Include a "Key Takeaway" or "Expert Tip" callout box per section

Authority signals:
- Suggest author bio format (name, credentials, years of experience)
- Suggest 1-2 external links to high-authority sources (.edu, .gov, industry leaders)

Trust signals:
- Include publication date and "Last updated" date
- Suggest transparent disclaimers if applicable
- Use specific data over vague claims

─── SECTION 4: TECHNICAL SEO ───

Keyword Strategy:
- Primary keyword: derived from topic (use in title, H1, first 100 words, conclusion)
- Secondary keywords: 3-5 related terms (distribute across H2s)
- LSI keywords: 5-8 semantically related terms (sprinkle naturally)
- Provide the full keyword cluster

Internal Linking:
- Suggest 3-5 internal link anchors with target page topics
- Place at least 1 internal link in the introduction
- Place 1-2 in the body sections
- Place 1 in the conclusion (CTA-linked)

Schema Markup Suggestion:
- Article schema: headline, author, datePublished, dateModified
- FAQ schema: if article has Q&A sections
- HowTo schema: if article has step-by-step content
- Provide the JSON-LD structure suggestion

Readability:
- Paragraphs max 3-4 sentences
- Average sentence length: 15-20 words
- Use transition words between sections
- Flesch reading score target: 60-70 (professional but accessible)`,
    variables: [
      { name: "topic", description: "Article topic / primary keyword", required: true },
      { name: "audience", description: "Target reader persona", required: false, default: "profesionales buscando soluciones prácticas" },
      { name: "tone", description: "Writing tone", required: false, default: "experto pero accesible, con datos y ejemplos reales" },
      { name: "intent", description: "Search intent: informational, commercial, or transactional", required: false, default: "informational" },
      { name: "length", description: "Target word count", required: false, default: "1500-2000 palabras" },
    ],
    exampleOutput: `─── SEO METADATA ───\n\nTitle Tag: Tratamientos Faciales: Guía Completa de Tipos, Beneficios y Precios (2026)\nMeta Description: Descubre los 8 tipos de tratamientos faciales, sus beneficios según tipo de piel y rangos de precios. Guía de expertos con +2.000 faciales realizados.\nSlug: /tratamientos-faciales-guia-completa\nFeatured Snippet Target: Paragraph — "¿Qué son los tratamientos faciales?"\n\n─── ARTÍCULO ───\n\n# Tratamientos Faciales: Guía Completa de Tipos, Beneficios y Precios (2026)\n\n## Introducción\n\nEl 67% de las mujeres entre 25-45 años busca tratamientos faciales al menos una vez al año, pero solo el 23% sabe cuál es el indicado para su tipo de piel.\n\nDespués de realizar más de 2.000 tratamientos faciales en Berke Spa, hemos visto de primera mano cómo elegir el tratamiento correcto marca la diferencia entre resultados visibles y dinero desperdiciado.\n\nEn esta guía te explicamos los 8 tipos principales de tratamientos faciales, para quién es cada uno, qué resultados esperar y cuánto cuestan en Chile en 2026.\n\n## ¿Qué son los tratamientos faciales y por qué los necesitas?\n\nLos tratamientos faciales son procedimientos profesionales de cuidado de la piel que combinan limpieza profunda, exfoliación, hidratación y técnicas especializadas para mejorar la salud y apariencia del rostro. A diferencia de las rutinas caseras, un facial profesional trabaja a nivel más profundo de la dermis.\n\n**Key Takeaway:** Un facial profesional cada 4-6 semanas mantiene la piel en óptimas condiciones y previene problemas como acné, manchas y envejecimiento prematuro.\n\n### Beneficios comprobados\n- Limpieza profunda de poros (reduce brotes en un 60%)\n- Estimulación de colágeno (piel más firme desde la 2ª sesión)\n- Mejora de textura y luminosidad\n- Detección temprana de problemas cutáneos\n\n## ¿Cuáles son los tipos de tratamientos faciales más efectivos?\n\n### 1. Limpieza Facial Profunda\n**Ideal para:** Pieles mixtas a grasas con puntos negros\n**Duración:** 60-90 minutos\n**Precio en Chile:** $35.000 - $55.000 CLP\n**Frecuencia recomendada:** Cada 4 semanas\n\n### 2. HydraFacial\n**Ideal para:** Todos los tipos de piel, especialmente deshidratada\n**Duración:** 45-60 minutos\n**Precio en Chile:** $65.000 - $95.000 CLP\n**Frecuencia recomendada:** Cada 2-4 semanas\n\n[... continúa con 6 tipos más ...]\n\n## ¿Cómo elegir el tratamiento facial correcto para tu piel?\n\nLa elección depende de 3 factores: tu tipo de piel, tu principal preocupación y tu presupuesto.\n\n| Tipo de Piel | Tratamiento Recomendado | Precio Promedio |\n|---|---|---|\n| Grasa/Mixta | Limpieza profunda + peeling | $45.000 CLP |\n| Seca/Sensible | HydraFacial + mascarilla | $75.000 CLP |\n| Madura | Radiofrecuencia + vitamina C | $90.000 CLP |\n| Con acné | LED therapy + limpieza | $60.000 CLP |\n\n**Tip de experta:** "Siempre recomiendo empezar con un diagnóstico de piel antes de elegir tratamiento. Lo que funciona para tu amiga puede no ser lo mejor para ti." — Directora de Berke Spa\n\n## Conclusión\n\nElegir el tratamiento facial correcto no tiene por qué ser complicado:\n\n- ✅ Identifica tu tipo de piel y preocupación principal\n- ✅ Consulta con un profesional antes de invertir\n- ✅ Mantén una frecuencia regular (cada 4-6 semanas)\n\n¿Quieres saber qué tratamiento es ideal para tu piel? En Berke Spa ofrecemos diagnóstico personalizado gratuito con tu primera sesión.\n\n[Reserva tu diagnóstico gratuito →]\n\n─── KEYWORD CLUSTER ───\n\nPrimary: "tratamientos faciales"\nSecondary: "tipos de tratamientos faciales", "facial profesional precio", "mejor tratamiento para mi piel", "hydrafacial beneficios"\nLSI: "cuidado de la piel", "limpieza facial", "rejuvenecimiento", "dermocosmética", "antiaging", "skincare profesional", "spa facial", "piel luminosa"\n\n─── INTERNAL LINKS SUGERIDOS ───\n\n1. [rutina de skincare] → /blog/rutina-skincare-paso-a-paso\n2. [tipos de piel] → /blog/como-identificar-tu-tipo-de-piel\n3. [Berke Spa] → /servicios/tratamientos-faciales\n4. [diagnóstico gratuito] → /reservar\n\n─── SCHEMA MARKUP (JSON-LD) ───\n\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Tratamientos Faciales: Guía Completa de Tipos, Beneficios y Precios (2026)",\n  "author": { "@type": "Organization", "name": "Berke Spa" },\n  "datePublished": "2026-02-17",\n  "dateModified": "2026-02-17"\n}\n\nFAQ Schema sugerido para las preguntas H2.`,
    tags: ["seo", "organic", "long-form", "e-e-a-t", "featured-snippets", "schema"],
  },
  {
    templateId: "tpl_blog_howto",
    name: "Guía Paso a Paso (How-To)",
    description: "Tutorial completo con HowTo schema, pasos accionables con tiempo estimado y dificultad, prerequisites checklist, troubleshooting section, FAQ para People Also Ask y visual suggestions por paso",
    category: "blog" as const,
    industry: ["saas", "consulting", "ecommerce", "beauty", "wellness", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Write a comprehensive step-by-step how-to guide about "{{topic}}".

Difficulty level: {{difficulty}}
Target length: {{length}}
Target audience: {{audience}}
Tone: {{tone}}

─── SECTION 1: SEO METADATA ───

Title: "Cómo [Result] en [Number] Pasos ([Year])" format
- Include primary keyword in first 3 words
- Max 60 characters
- Use a specific number (odd numbers perform 20% better in CTR)

Meta Description:
- 150-160 chars
- Pattern: "Aprende cómo [result] paso a paso. Guía práctica con [N] pasos, tips de experto y [bonus]. [Tiempo estimado: X min]."

URL Slug: /como-[keyword]-paso-a-paso

─── SECTION 2: GUIDE HEADER ───

Quick Reference Box (above the fold):
- ⏱ Tiempo estimado: [X minutos/horas]
- 📊 Dificultad: [Principiante / Intermedio / Avanzado]
- 🛠 Herramientas necesarias: [list]
- ✅ Resultado esperado: [1-line outcome]
- 📅 Última actualización: [date]

─── SECTION 3: INTRODUCTION (150-200 words) ───

- Hook: Start with the transformation or end result
- Pain point: What happens if they DON'T follow this guide
- Credibility: Why this guide is different (experience, data, results)
- Promise: "Al terminar esta guía, vas a poder [specific outcome]"
- Include primary keyword in first 100 words
- Add a table of contents (links to each step)

─── SECTION 4: PREREQUISITES / "Antes de Empezar" ───

Checklist format:
- [ ] Required tools/accounts/materials
- [ ] Estimated time commitment
- [ ] Knowledge level assumed
- [ ] Any costs involved
- 💡 "If you don't have X, here's a free alternative: [suggestion]"

─── SECTION 5: STEP-BY-STEP GUIDE (5-8 steps) ───

Each step follows this structure:

## Paso N: [Action Verb] + [Specific Outcome]

**⏱ Tiempo:** [X minutos]
**📊 Dificultad:** [Fácil/Medio/Difícil]

[2-3 paragraphs of detailed explanation]
- What to do (specific actions)
- Why this step matters
- How to know you did it right

**📸 Visual suggestion:** [Screenshot, diagram, or photo description]

**💡 Pro Tip:** [Expert insight that saves time or improves results]

**⚠️ Error común:** [What most people get wrong and how to avoid it]

[Optional: Before/after comparison for this step]

─── SECTION 6: RESULTS / "Qué Esperar" ───

- What success looks like after completing all steps
- Timeline: when to expect visible results
- Metrics to track progress
- Before/after comparison (if applicable)

─── SECTION 7: TROUBLESHOOTING ───

Common problems and solutions (captures long-tail queries):
- "¿Qué hago si [problem A]?" → Solution
- "¿Por qué no funciona [step X]?" → Solution
- "¿Cómo sé si [thing] está bien?" → Verification method

─── SECTION 8: FAQ (5 questions) ───

Format each as H3 question (maps to People Also Ask):
- Q1: "¿Cuánto tiempo toma [result]?"
- Q2: "¿Se puede [do this] sin [requirement]?"
- Q3: "¿Cuál es el error más común al [topic]?"
- Q4: "¿Cuánto cuesta [topic]?"
- Q5: "¿Con qué frecuencia debo [action]?"

Each answer: 40-60 words (featured snippet optimized)

─── SECTION 9: CONCLUSION + CTA ───

- 3-bullet summary of key steps
- Encouragement message
- Primary CTA (next action)
- Secondary CTA (related guide or service)

─── SECTION 10: SCHEMA MARKUP ───

Suggest HowTo JSON-LD schema:
- name, description, totalTime, estimatedCost
- Each step: name, text, image suggestion, url
- Also suggest FAQ schema for the FAQ section`,
    variables: [
      { name: "topic", description: "What readers will learn to do", required: true },
      { name: "audience", description: "Who the guide is for", required: false, default: "principiantes y nivel intermedio que buscan resultados prácticos" },
      { name: "tone", description: "Writing tone", required: false, default: "práctico, motivador y paso a paso" },
      { name: "difficulty", description: "Guide difficulty: beginner, intermediate, or advanced", required: false, default: "beginner" },
      { name: "length", description: "Target word count", required: false, default: "1800-2500 palabras" },
    ],
    exampleOutput: `─── SEO METADATA ───\n\nTitle: Cómo Armar tu Rutina de Skincare en 7 Pasos (2026)\nMeta: Aprende cómo crear una rutina de skincare personalizada paso a paso. 7 pasos con tips de esteticistas profesionales. Tiempo: 15 min de lectura.\nSlug: /como-armar-rutina-skincare-paso-a-paso\n\n─── QUICK REFERENCE ───\n\n⏱ Tiempo de lectura: 15 minutos\n📊 Dificultad: Principiante\n🛠 Necesitas: Espejo con buena luz, tu piel limpia, los productos que ya tienes\n✅ Resultado: Una rutina AM/PM personalizada para tu tipo de piel\n📅 Actualizado: Febrero 2026\n\n─── GUÍA ───\n\n# Cómo Armar tu Rutina de Skincare en 7 Pasos (2026)\n\n## Introducción\n\nEl 78% de las mujeres usa productos de skincare, pero solo el 15% los aplica en el orden correcto.\n\nResultado: gastan dinero en sérums de $50.000 CLP que no penetran porque la crema ya selló la piel.\n\nDespués de asesorar a más de 500 clientas en Berke Spa, creamos esta guía paso a paso para que armes tu rutina perfecta en 15 minutos — sin importar tu presupuesto.\n\nAl terminar, vas a tener una rutina AM y PM personalizada para tu tipo de piel.\n\n📋 **Contenido:**\n1. Identifica tu tipo de piel\n2. Elige tu limpiador\n3. Aplica el tónico\n4. Sérum (el paso que más importa)\n5. Contorno de ojos\n6. Hidratante\n7. Protector solar (solo AM)\n\n## Antes de Empezar\n\n- [ ] Lava tu cara y sécala suavemente\n- [ ] Ten tus productos actuales a mano\n- [ ] Espejo con buena iluminación\n- [ ] 15 minutos sin interrupciones\n- 💡 ¿No tienes productos? Al final de cada paso sugerimos opciones desde $5.000 CLP\n\n## Paso 1: Identifica tu Tipo de Piel\n\n**⏱ Tiempo:** 2 minutos\n**📊 Dificultad:** Fácil\n\nLava tu cara solo con agua y espera 30 minutos sin aplicar nada.\n\nObserva:\n- **Brilla en zona T (frente, nariz, mentón):** Piel mixta\n- **Brilla en toda la cara:** Piel grasa\n- **Se siente tirante o descama:** Piel seca\n- **Se enrojece fácilmente:** Piel sensible\n- **No presenta ningún síntoma:** Piel normal\n\n**📸 Visual:** Infografía comparativa de los 5 tipos de piel con fotos de ejemplo.\n\n**💡 Pro Tip:** "El tipo de piel cambia con las estaciones. Reevalúa cada 3 meses." — Esteticista Berke Spa\n\n**⚠️ Error común:** Asumir que tienes piel grasa cuando en realidad es deshidratada (produce grasa para compensar la falta de agua).\n\n## Paso 2: Elige tu Limpiador\n\n**⏱ Tiempo:** 1 minuto\n**📊 Dificultad:** Fácil\n\n[... continúa pasos 2-7 con misma estructura ...]\n\n## Qué Esperar\n\n- **Semana 1:** Piel se adapta, posible purga leve si usas ácidos\n- **Semana 2-3:** Textura más suave, menos brotes\n- **Mes 1:** Luminosidad visible, piel más hidratada\n- **Mes 3:** Resultados significativos en manchas y líneas finas\n\n## Troubleshooting\n\n### ¿Qué hago si mi piel se irrita con el sérum?\nReduce la frecuencia a día por medio. Si persiste 5+ días, cambia a una concentración menor (del 20% al 10% en vitamina C, por ejemplo).\n\n### ¿Por qué me salen más granitos después de empezar la rutina?\nEs probable que sea "purga" — tu piel está eliminando impurezas. Dura 2-4 semanas. Si dura más, consulta un dermatólogo.\n\n### ¿Cómo sé si estoy aplicando en el orden correcto?\nRegla general: de más líquido a más espeso. Tónico → Sérum → Crema → SPF.\n\n## Preguntas Frecuentes\n\n### ¿Cuánto tiempo toma ver resultados con una rutina de skincare?\nLos primeros resultados visibles aparecen entre las 2-4 semanas con uso consistente. Para cambios significativos en textura, manchas o líneas finas, espera al menos 3 meses de rutina constante.\n\n### ¿Se puede tener una buena rutina de skincare con bajo presupuesto?\nSí. Una rutina básica efectiva (limpiador + hidratante + SPF) puede costar desde $15.000 CLP mensuales. Los sérums son opcionales al inicio.\n\n### ¿Cuál es el error más común al armar una rutina?\nAplicar los productos en el orden incorrecto. Un sérum de $50.000 CLP no funciona si lo aplicas después de la crema, porque la crema sella la piel.\n\n### ¿Cuánto cuesta mantener una rutina completa?\nRango en Chile: $25.000-$120.000 CLP/mes dependiendo de los productos. Una rutina intermedia cuesta aprox $45.000 CLP/mes.\n\n### ¿Con qué frecuencia debo cambiar mi rutina?\nReevalúa cada cambio de estación (cada 3 meses). Tu piel tiene necesidades distintas en verano vs. invierno.\n\n## Conclusión\n\nArmar tu rutina de skincare es más simple de lo que parece:\n\n✅ Identifica tu tipo de piel (Paso 1)\n✅ Sigue el orden: limpieza → tratamiento → hidratación → protección\n✅ Sé consistente por al menos 4 semanas antes de evaluar\n\nTu piel te va a agradecer este regalo.\n\n¿Quieres que una profesional revise tu rutina? En Berke Spa hacemos diagnósticos de piel gratuitos.\n\n[Reserva tu diagnóstico gratuito →]\n\n📖 Guía relacionada: [Tratamientos Faciales: Guía Completa →]\n\n─── SCHEMA (HowTo JSON-LD) ───\n\n{\n  "@context": "https://schema.org",\n  "@type": "HowTo",\n  "name": "Cómo Armar tu Rutina de Skincare en 7 Pasos",\n  "description": "Guía paso a paso para crear una rutina de skincare personalizada",\n  "totalTime": "PT15M",\n  "estimatedCost": { "@type": "MonetaryAmount", "currency": "CLP", "value": "25000-120000" },\n  "step": [\n    { "@type": "HowToStep", "name": "Identifica tu tipo de piel", "text": "Lava tu cara con agua y espera 30 min..." },\n    { "@type": "HowToStep", "name": "Elige tu limpiador", "text": "..." }\n  ]\n}`,
    tags: ["tutorial", "seo", "how-to", "schema", "featured-snippets", "faq"],
  },
  {
    templateId: "tpl_blog_listicle",
    name: "Listicle (Top N)",
    description: "Artículo lista optimizado para featured snippets (2x más tráfico que how-to): título con número impar, items con mini-review + datos concretos, tabla comparativa para table snippet, FAQ para People Also Ask y schema ItemList",
    category: "blog" as const,
    industry: ["ecommerce", "saas", "consulting", "beauty", "wellness", "general"],
    contentType: "blog",
    channels: ["blog"],
    promptTemplate: `Crea un artículo listicle sobre "{{topic}}" optimizado para featured snippets y máximo CTR.

─── SEO METADATA ───

1. Title tag (55-60 chars): "[Número impar] [Categoría] para [Resultado] en [Año]"
   → Usar número impar (7, 9, 11) — mejor rendimiento psicológico
   → Incluir keyword principal + año
2. Meta description (150-160 chars): Resumen con número + beneficio principal + qualifier temporal
3. Slug: /mejores-[keyword]-[año] o /top-[N]-[keyword]
4. Featured snippet target: Lista de 6 items con máx 44 palabras por item (promedio que gana Position Zero)

─── INTRODUCCIÓN ───

1. Hook con dato/estadística impactante (1-2 líneas)
2. Problema que resuelve esta lista (por qué importa filtrar opciones)
3. Credenciales: por qué esta selección es confiable (probamos X, analizamos Y, consultamos Z)
4. Promise: qué va a obtener el lector al terminar
5. Tabla de contenido con anclas a cada item

─── ITEMS ({{count}} items) ───

Para CADA item del listado:

### N. [Nombre del Item] — [Subtítulo con beneficio clave]

**Veredicto rápido:** 1 línea con calificación (⭐ rating o "Mejor para X")

**Descripción** (2-3 párrafos):
- Qué es y qué lo hace destacar
- Datos concretos: precio, métricas, resultados medibles
- Para quién es ideal vs. para quién NO es ideal

**Pros y Contras:**
✅ Pro 1
✅ Pro 2
❌ Contra 1

**💡 Pro Tip:** Consejo práctico de uso que solo alguien con experiencia sabría

**📸 Visual sugerido:** Captura, foto de producto, o infografía comparativa

─── TABLA COMPARATIVA ───

Crear tabla de comparación (5 filas × 2-4 columnas) optimizada para table snippet:
| Item | Mejor Para | Precio | Rating |
→ Las tablas representan 6.3% de featured snippets
→ Formato: máx 5 filas, 2-4 columnas, 40-45 palabras totales

─── VEREDICTO FINAL ───

1. "Mejor opción general": [Item] — por qué
2. "Mejor calidad-precio": [Item] — por qué
3. "Mejor para principiantes": [Item] — por qué
4. Resumen en 1 párrafo con recomendación según perfil del lector

─── FAQ (5 preguntas) ───

5 preguntas tipo "People Also Ask" con respuestas de 40-60 palabras:
→ ¿Cuál es el/la mejor [keyword] en [año]?
→ ¿Cuánto cuesta [keyword]?
→ ¿[Keyword] vale la pena?
→ ¿Cómo elegir [keyword]?
→ ¿Cuál es la diferencia entre [item A] y [item B]?

─── SCHEMA MARKUP (ItemList) ───

Incluir JSON-LD con:
- @type: ItemList
- itemListElement: array con ListItem (position, name, url)
- También incluir FAQPage schema para la sección FAQ

─── NOTAS DE OPTIMIZACIÓN ───

- Usar números impares en título (7, 9, 11 convierten mejor que pares)
- Primer item = tu recomendación principal (mayoría de lectores solo ven top 3)
- Internal links: mínimo 3 hacia artículos relacionados
- Actualizar título cada 6 meses con nuevo año para mantener CTR
- Agregar "Actualizado: [Mes Año]" visible en la intro
- Alt text descriptivo en todas las imágenes
- Dato clave: listicles generan 2x más tráfico que artículos how-to

Target: {{length}}
Audiencia: {{audience}}
Tono: {{tone}}
Intent: {{intent}}`,
    variables: [
      { name: "topic", description: "List topic", required: true },
      { name: "audience", description: "Target reader", required: false, default: "profesionales y decisores" },
      { name: "tone", description: "Writing tone", required: false, default: "informativo y comparativo" },
      { name: "count", description: "Number of items (odd numbers recommended: 7, 9, 11)", required: false, default: "7-9" },
      { name: "intent", description: "Search intent: comparison, recommendation, educational", required: false, default: "comparison" },
      { name: "length", description: "Target word count", required: false, default: "1500-2000 palabras" },
    ],
    exampleOutput: `─── SEO METADATA ───

Title: 9 Tratamientos Faciales Más Efectivos en Santiago (2026)
Meta: Comparamos los 9 tratamientos faciales con mejores resultados en Santiago. Precios desde $35.000 CLP, ratings reales y para quién es cada uno.
Slug: /mejores-tratamientos-faciales-santiago-2026
Snippet target: Lista de 9 tratamientos faciales efectivos con precios y resultados.

─── ARTÍCULO ───

# 9 Tratamientos Faciales Más Efectivos en Santiago (2026)

📅 Actualizado: Febrero 2026

## Introducción

El mercado de tratamientos faciales en Chile creció un 34% en 2025, pero el 60% de las clientas no sabe cuál elegir para su tipo de piel.

Después de analizar más de 200 reseñas, consultar con 5 esteticistas certificadas y probar 15 tratamientos en Berke Spa, seleccionamos los 9 que realmente entregan resultados medibles.

Al terminar, vas a saber exactamente cuál es el mejor para tu piel, presupuesto y objetivo.

📖 **En este artículo:**
1. Hydrafacial
2. Limpieza Profunda con Extracción
3. Peeling Químico
4. Dermapen (Microneedling)
5. Radiofrecuencia Facial
6. LED Therapy
7. Facial Coreano (K-Beauty)
8. Vitamina C Concentrada
9. Crioterapia Facial

---

### 1. Hydrafacial — El Más Completo sin Downtime

**⭐ Mejor opción general**

El Hydrafacial combina limpieza, exfoliación, extracción e hidratación en 30 minutos. Es el único tratamiento que muestra resultados visibles desde la primera sesión sin enrojecimiento.

En Berke Spa, el 89% de las clientas reportan piel más luminosa en las primeras 24 horas. Precio: $65.000 CLP por sesión, con packs de 3 sesiones a $170.000 CLP.

Ideal para pieles mixtas a secas que buscan glow inmediato. No recomendado para pieles con acné activo severo.

✅ Resultados inmediatos (mismo día)
✅ Sin tiempo de recuperación
✅ Apto para piel sensible
❌ Precio premium vs. limpieza tradicional
❌ Resultados no permanentes (repetir cada 4-6 semanas)

💡 **Pro Tip:** Agenda tu Hydrafacial 3-5 días antes de un evento importante, no el mismo día — la piel absorbe mejor el maquillaje después de 48h.

📸 **Visual:** Foto antes/después de clienta real (con consentimiento) + comparativa de textura de piel.

### 2. Limpieza Profunda con Extracción — La Mejor Calidad-Precio

**⭐ Mejor para presupuesto limitado**

[... continúa items 2-9 con misma estructura ...]

---

## Tabla Comparativa

| Tratamiento | Mejor Para | Precio (CLP) | Sesiones |
|---|---|---|---|
| Hydrafacial | Glow inmediato | $65.000 | Mensual |
| Limpieza Profunda | Presupuesto | $25.000 | Mensual |
| Peeling Químico | Manchas | $45.000 | 4-6 sesiones |
| Dermapen | Anti-edad | $80.000 | 3-4 sesiones |
| Radiofrecuencia | Flacidez | $55.000 | 6-8 sesiones |

---

## Veredicto Final

🏆 **Mejor opción general:** Hydrafacial — resultados inmediatos, cero downtime, apto para el 80% de los tipos de piel.

💰 **Mejor calidad-precio:** Limpieza Profunda con Extracción — desde $25.000 CLP con resultados visibles en piel grasa/mixta.

🌱 **Mejor para principiantes:** Facial Coreano — suave, relajante, y excelente introducción al cuidado profesional de la piel.

Si nunca te has hecho un tratamiento facial, empieza por la Limpieza Profunda. Si buscas el mejor resultado por sesión, el Hydrafacial es imbatible.

---

## Preguntas Frecuentes

### ¿Cuál es el mejor tratamiento facial en Santiago en 2026?
El Hydrafacial es el tratamiento más completo disponible en Santiago. Combina 4 pasos en 30 minutos con resultados visibles desde la primera sesión. Precio promedio: $65.000 CLP en centros especializados como Berke Spa.

### ¿Cuánto cuesta un tratamiento facial profesional en Chile?
Los precios varían entre $25.000 CLP (limpieza básica) y $120.000 CLP (tratamientos avanzados como Dermapen). El promedio para un tratamiento de calidad es $50.000-$70.000 CLP por sesión.

### ¿Con qué frecuencia debo hacerme tratamientos faciales?
La frecuencia óptima depende del tratamiento: limpiezas faciales cada 4-6 semanas, peelings cada 2-3 meses, y tratamientos intensivos como Dermapen 3-4 veces al año.

### ¿Los tratamientos faciales valen la pena o puedo hacer skincare en casa?
Ambos se complementan. El skincare diario mantiene los resultados, pero los tratamientos profesionales logran exfoliación y penetración de activos que los productos domésticos no alcanzan.

### ¿Cuál es la diferencia entre Hydrafacial y Limpieza Profunda?
El Hydrafacial usa tecnología de succión con serums para limpiar, exfoliar e hidratar simultáneamente. La Limpieza Profunda es manual con extracción. Hydrafacial es más suave y sin downtime; la Limpieza es más económica pero puede dejar enrojecimiento temporal.

---

─── SCHEMA (ItemList + FAQPage JSON-LD) ───

{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "9 Tratamientos Faciales Más Efectivos en Santiago",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Hydrafacial", "url": "#hydrafacial" },
    { "@type": "ListItem", "position": 2, "name": "Limpieza Profunda", "url": "#limpieza-profunda" }
  ]
}

{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuál es el mejor tratamiento facial en Santiago en 2026?",
      "acceptedAnswer": { "@type": "Answer", "text": "El Hydrafacial es el tratamiento más completo..." }
    }
  ]
}`,
    tags: ["listicle", "seo", "shareable", "featured-snippets", "comparison", "schema", "faq"],
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
    description: "Campaña completa de Google Ads: RSA optimizado con 15 headlines + 4 descriptions, Performance Max assets, extensiones y estrategia de keywords con benchmarks por industria",
    category: "ads" as const,
    industry: ["saas", "ecommerce", "consulting", "beauty", "wellness", "general"],
    contentType: "ad_copy",
    channels: ["google_ads"],
    promptTemplate: `Create a complete Google Ads campaign for "{{topic}}".

Target audience: {{audience}}
Tone: {{tone}}
Monthly budget: {{budget}}
Campaign type focus: {{campaign_type}}

---

## 1. RESPONSIVE SEARCH ADS (RSA)

Generate a fully optimized RSA following Google's 2025-2026 best practices.

### 15 Headlines (max 30 chars each)

Organize headlines into these categories — each must communicate something DIFFERENT:

- **3 Keyword headlines**: Include the primary search keyword naturally. These will be pinned to Position 1.
- **3 Benefit headlines**: Focus on the transformation/outcome the customer gets.
- **2 Numbers/Stats headlines**: Use specific data points (%, quantities, time saved, ratings).
- **2 Social proof headlines**: Reviews, client count, awards, ratings.
- **2 CTA headlines**: Direct action verbs (Reserva, Agenda, Prueba, Descubre).
- **2 Urgency/Offer headlines**: Limited time, seasonal, first-visit discount.
- **1 Brand headline**: Include brand name + positioning.

IMPORTANT: Don't keyword-stuff. Each headline should feel authentic and click-worthy on its own. Google reports that RSAs with 15 diverse headlines get up to 10% more conversions at similar CPA.

### 4 Descriptions (max 90 chars each)

- **Description 1 (Benefit + CTA)**: Lead with the main benefit, end with clear action.
- **Description 2 (Features + Differentiator)**: What makes this unique vs competitors.
- **Description 3 (Social proof + Trust)**: Numbers, reviews, certifications, awards.
- **Description 4 (Urgency + Offer)**: Time-limited promotion or first-visit incentive.

### Pinning Recommendations

Suggest which headlines to pin to Position 1, 2, and 3 for maximum relevance. Pin sparingly — over-pinning hurts performance. Only pin when legally required or for brand consistency.

## 2. AD EXTENSIONS / ASSETS

### Sitelink Extensions (4-6)

For each sitelink provide:
- Link text (max 25 chars)
- Description line 1 (max 35 chars)
- Description line 2 (max 35 chars)
- Suggested landing page path

### Callout Extensions (6-8)
Short benefit phrases (max 25 chars each). Mix: trust signals, differentiators, offers.

### Structured Snippets
- Header type (Services, Types, Brands, etc.)
- 4-6 values

### Call Extension
- Suggested business hours for call scheduling

### Price Extension (if applicable)
- 3-5 service/product cards with price ranges

## 3. KEYWORD STRATEGY

### Keyword Groups (4 tiers)

For each group provide 5-8 keywords with match type recommendation:

- **Tier 1 — Brand terms**: Brand name + variations (Exact match)
- **Tier 2 — Service-specific**: Core services with modifiers (Phrase match)
- **Tier 3 — Geo-targeted**: "[service] en [city]", "[service] cerca de mí" (Phrase match)
- **Tier 4 — Long-tail / Intent**: Problem-aware searches, questions, comparisons (Broad match with smart bidding)

### Negative Keywords (10-15)
Common irrelevant searches to exclude from day one.

## 4. PERFORMANCE MAX ASSETS (if campaign_type includes pmax)

Generate creative assets for Performance Max:
- **5 Short headlines** (max 30 chars) — benefit-focused, action-oriented
- **5 Long headlines** (max 90 chars) — storytelling, emotional appeal
- **5 Descriptions** (max 90 chars) — mix of benefits, features, social proof
- **Business name + logo placement guidance**
- **Image direction**: Describe 5 image concepts (lifestyle, product, before/after, team, testimonial)
- **Video direction**: 15-second script concept for YouTube/Display

## 5. CAMPAIGN RECOMMENDATIONS

Provide:
- **Bidding strategy**: Which smart bidding to use (Target CPA vs Target ROAS vs Maximize Conversions) and why
- **Budget allocation**: How to split budget across Search vs Performance Max
- **A/B testing plan**: What to test first (headlines, landing pages, audiences)
- **Quality Score tips**: 3 specific recommendations to improve ad relevance and landing page experience
- **Competitor strategy**: How to bid on competitor terms effectively
- **Benchmarks to expect**: Estimated CTR, CPC, and conversion rate for this industry`,
    variables: [
      { name: "topic", description: "Product or service to advertise", required: true },
      { name: "audience", description: "Target searcher intent and demographics", required: false, default: "mujeres 25-45 buscando servicios de bienestar y belleza" },
      { name: "tone", description: "Ad tone and voice", required: false, default: "directo, profesional y orientado a acción" },
      { name: "budget", description: "Monthly ad budget", required: false, default: "$1,500 USD/mes" },
      { name: "campaign_type", description: "Campaign type: search, pmax, or both", required: false, default: "both" },
    ],
    exampleOutput: `## 1. RESPONSIVE SEARCH ADS\n\n### Headlines (15)\n\n**Keyword:**\n1. Facial Premium en Santiago\n2. Tratamiento Facial Profesional\n3. Spa Facial Berke Santiago\n\n**Benefit:**\n4. Piel Luminosa en 45 Min\n5. Rejuvenece Sin Cirugía\n6. Adiós Estrés, Hola Glow\n\n**Numbers/Stats:**\n7. +200 Clientas al Mes\n8. 4.9★ en Google Reviews\n\n**Social proof:**\n9. El Spa Mejor Valorado\n10. Recomendado por Dermatólogas\n\n**CTA:**\n11. Reserva Tu Cita Hoy\n12. Agenda Online Fácil\n\n**Urgency/Offer:**\n13. -25% Primera Sesión\n14. Oferta Solo Esta Semana\n\n**Brand:**\n15. Berke Spa · Experts en Piel\n\n### Pinning\n- Posición 1: Headlines 1-3 (keyword, rotación)\n- Posición 2: Headlines 4-6 (benefit, rotación)\n- Posición 3: No pinear — dejar que Google optimice\n\n### Descriptions (4)\n1. Tratamiento facial profesional con activos naturales. Piel luminosa desde la primera sesión. Reserva hoy.\n2. Ácido hialurónico + vitamina C + técnicas exclusivas. Lo que tu rutina de skincare no puede lograr.\n3. Valoración 4.9/5 · +200 faciales al mes · 8 años de experiencia en Santiago.\n4. Primera sesión con 25% off — Solo esta semana. Cupos limitados. Agenda ahora.\n\n---\n\n## 2. EXTENSIONES\n\n### Sitelinks\n1. "Facial Premium" → /servicios/facial-premium — Nuestro tratamiento estrella · Resultados desde sesión 1\n2. "Ver Precios" → /precios — Planes desde $45.000 · Sin compromiso\n3. "Testimonios" → /testimonios — Lee lo que dicen nuestras clientas\n4. "Ubicación" → /contacto — Providencia, Santiago · Estacionamiento\n\n### Callouts\n1. Productos Naturales\n2. Horario Flexible\n3. Resultados Garantizados\n4. 8 Años de Experiencia\n5. Estacionamiento Gratis\n6. Agenda Online 24/7\n\n### Structured Snippets\nHeader: Servicios\nValores: Facial Premium, Masaje Relajante, Limpieza Profunda, Anti-Aging, Peeling\n\n### Price Extension\n- Facial Premium: desde $55.000\n- Masaje Relajante: desde $40.000\n- Limpieza Profunda: desde $35.000\n\n---\n\n## 3. KEYWORDS\n\n**Tier 1 — Brand:**\n[berke spa] · [berke spa santiago] · [spa berke providencia]\n\n**Tier 2 — Service:**\n"tratamiento facial santiago" · "facial profesional" · "limpieza facial profunda" · "spa facial premium"\n\n**Tier 3 — Geo:**\n"spa en providencia" · "spa cerca de mí" · "mejor spa santiago" · "facial santiago centro"\n\n**Tier 4 — Long-tail:**\nfacial para piel seca santiago · tratamiento anti-aging sin cirugía · spa recomendado para primera vez\n\n**Negativas:**\ncursos, empleo, trabajo, gratis, casero, tutorial, DIY, recetas, como hacer, escuela\n\n---\n\n## 4. PERFORMANCE MAX\n\n**Short Headlines:**\n1. Piel Perfecta en 45 Min\n2. Reserva Tu Facial Hoy\n3. Spa Premium Santiago\n4. -25% Primera Visita\n5. Glow Natural Garantizado\n\n**Long Headlines:**\n1. Descubre por qué +200 mujeres eligen nuestro facial premium cada mes\n2. Tu piel merece más que cremas — prueba un tratamiento profesional\n3. 4.9 estrellas en Google · El facial más pedido de Providencia\n\n**Image Direction:**\n1. Lifestyle: clienta relajada durante tratamiento (luz cálida)\n2. Before/After: resultado real de facial (split screen)\n3. Product: close-up de sérums y activos naturales\n4. Space: interior del spa, ambiente premium\n5. Team: esteticista profesional con clienta sonriendo\n\n---\n\n## 5. RECOMENDACIONES\n\n**Bidding:** Target CPA ($3.500 CLP/lead). Comenzar con Maximize Conversions las primeras 2 semanas para recopilar datos.\n**Budget split:** 60% Search · 40% Performance Max\n**A/B Test:** Probar Headlines urgencia vs social proof en posición 2\n**Quality Score:** (1) Landing page con contenido que coincida con keywords, (2) Agregar FAQ schema, (3) Velocidad de carga <3s\n**Benchmarks esperados:** CTR 4-6% · CPC $1.500-$3.000 CLP · Conversión 3-5% · ROAS 3:1+`,
    tags: ["ppc", "conversion", "search", "performance-max", "keywords", "extensions"],
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
    description: "Newsletter profesional con subject lines A/B, contenido educativo + promocional, social proof y CTA segmentado para máximo engagement y conversión",
    category: "misc" as const,
    industry: ["saas", "consulting", "ecommerce", "beauty", "wellness", "general"],
    contentType: "newsletter",
    channels: ["email"],
    promptTemplate: `Write a weekly newsletter issue about "{{topic}}".

Target audience: {{audience}}
Tone: {{tone}}
Newsletter style: {{style}}
Primary goal this week: {{goal}}

---

## 1. SUBJECT LINES (A/B Test)

Write 3 subject line variants for A/B testing (max 40 chars each, including spaces):

- **Variant A (Curiosity gap)**: Create intrigue — make the reader need to know more. Use patterns like "Lo que nadie te dice sobre...", "Por qué [common belief] está mal", or "[Number] [things] que cambian todo".
- **Variant B (Benefit-first)**: Lead with what the reader gains. Use patterns like "[Number] tips para [desired outcome]", "Cómo [achieve result] en [timeframe]".
- **Variant C (Urgency/Exclusivity)**: Create FOMO or VIP feeling. Use patterns like "Solo para suscriptores:", "Esta semana descubrimos...", "No compartas esto con nadie".

For each variant include:
- Subject line text (max 40 chars)
- Preview text / preheader (max 90 chars) — must complement, NOT repeat the subject
- Estimated open rate category (high/medium based on pattern)

IMPORTANT: Personalized subject lines get +27% more opens. Emojis in subjects increase open rates by up to 45%. A/B testing subjects can improve ROI by 83%.

## 2. NEWSLETTER BODY

### Opening Hook (2-3 lines)
Start with a personal, conversational greeting. Then immediately deliver ONE surprising stat, counterintuitive insight, or relatable observation that hooks the reader into the main story. No generic intros — start with value.

### Main Story (250-400 words)
The centerpiece of the newsletter. Structure it as:

1. **The Insight**: What's happening right now in the industry that matters
2. **Why It Matters**: Connect it directly to the reader's daily life/business
3. **The Data**: Include 1-2 specific stats or examples that prove the point
4. **Actionable Takeaway**: ONE specific thing the reader can do THIS WEEK
5. **Bridge to CTA**: Natural transition to your product/service as the solution (soft sell, not pushy)

### Quick Hits / Curated Section (3-4 items)
Short, scannable items (2-3 sentences each). Mix of:
- Industry news or trend worth knowing
- Practical tip or hack the reader can use immediately
- Tool or resource recommendation with a one-line review
- Interesting stat or study finding

Format each with an emoji bullet and bold title for easy scanning.

### Social Proof Block
Include ONE of these each week (rotate):
- **Client Spotlight**: Brief success story or testimonial (name + result + quote)
- **By the Numbers**: 2-3 metrics showing your impact
- **User-Generated Content**: Highlight something a customer shared

### Featured Offer / CTA
One clear, compelling call-to-action:
- What's the offer (specific, time-bound if possible)
- Why now (urgency driver)
- How to act (single button/link with action-oriented text)
- Fallback CTA for those not ready to buy (e.g., "Responde este email con tu pregunta")

### Closing / P.S.
- Warm, personality-driven sign-off (not corporate)
- **P.S. line**: The most-read part of any email. Use it for a secondary CTA, a teaser for next week, or a personal note that builds connection.

## 3. ENGAGEMENT BOOSTERS

Include at least ONE interactive element:
- **Poll/Question**: "Qué prefieres: [A] o [B]? Responde este email"
- **Quick Survey**: "En una palabra, qué tema quieres la próxima semana?"
- **Challenge**: "Esta semana intenta [specific action] y cuéntame cómo te fue"

## 4. TECHNICAL OPTIMIZATION

Provide:
- **Recommended send time**: Best day/time for this audience
- **Mobile preview check**: Confirm subject + preview text work in 40-char mobile preview
- **Resend strategy**: Subject line variant for non-openers (resend after 48-72h adds +30% opens)
- **Segment suggestion**: Which subscriber segment should receive this first`,
    variables: [
      { name: "topic", description: "Newsletter theme this week", required: true },
      { name: "audience", description: "Subscriber profile and segment", required: false, default: "clientas y suscriptoras interesadas en bienestar, skincare y autocuidado" },
      { name: "tone", description: "Newsletter voice and personality", required: false, default: "cercano y cálido, como una amiga experta que comparte tips" },
      { name: "style", description: "Newsletter style: educational, promotional, hybrid, or storytelling", required: false, default: "hybrid" },
      { name: "goal", description: "Primary goal: engagement, bookings, awareness, or retention", required: false, default: "engagement" },
    ],
    exampleOutput: `## 1. SUBJECT LINES (A/B Test)\n\nVariant A (Curiosity): Lo que tu esteticista nunca te dice\nPreview: 3 errores de skincare que cometes sin saber\nEstimación: HIGH — curiosity gap\n\nVariant B (Benefit): 3 tips para piel luminosa esta semana\nPreview: El #2 es el que más ignoran (y el más efectivo)\nEstimación: HIGH — number + benefit\n\nVariant C (Exclusivity): Solo para ti: rutina secreta anti-aging\nPreview: La misma que usan nuestras esteticistas en casa\nEstimación: MEDIUM-HIGH — exclusivity + insider knowledge\n\n---\n\n## 2. NEWSLETTER BODY\n\n### Opening Hook\n\nHola {{nombre}},\n\nSabías que el 73% de las mujeres usa productos de skincare en el orden incorrecto? (Sí, el sérum va ANTES de la crema. Siempre.)\n\nEsta semana quiero compartirte algo que cambia todo...\n\n### Main Story: Los 3 Errores de Skincare Más Comunes\n\nDespués de 8 años atendiendo pieles de todo tipo en Berke Spa, hay un patrón que vemos una y otra vez.\n\n**Error #1: Exfoliar todos los días**\nParece lógico — más exfoliación, más limpieza. Pero la realidad es que la sobre-exfoliación destruye la barrera cutánea. Resultado: piel más sensible, más grasa y más propensa a brotes.\n\n**Error #2: Saltarse el protector solar en invierno**\nEl 80% de los rayos UV atraviesan las nubes. Un estudio demostró que la exposición UV en Santiago en julio es suficiente para causar daño acumulativo.\n\n**Error #3: Usar el mismo sérum mañana y noche**\nTu piel tiene necesidades diferentes: de día necesita protección (vitamina C + SPF), de noche necesita reparación (retinol + ácido hialurónico).\n\nTu acción de esta semana: Revisa tu rutina y ajusta el orden: limpieza → tónico → sérum → crema → SPF (solo AM).\n\nQuieres que revisemos tu rutina en persona? Tenemos algo especial para ti más abajo.\n\n### Quick Hits\n\n✨ **Tendencia: Skin cycling** — La técnica de alternar activos (exfoliante → retinol → recovery → recovery) sigue ganando terreno. Ideal para pieles sensibles.\n\n🧴 **Producto del mes: Sérum vitamina C** — Si solo pudieras usar un producto anti-aging, este sería. Busca concentración 15-20% con vitamina E.\n\n📊 **Dato curioso:** Las mujeres que se hacen un facial cada 4 semanas tienen 40% menos signos visibles de envejecimiento después de un año.\n\n💡 **Tip express:** Ojeras? Pon tu contorno de ojos en el refrigerador. El frío reduce la inflamación al instante.\n\n### Social Proof\n\n\"Llegué con la piel súper apagada después del verano y después de 2 sesiones se nota una diferencia increíble. Las chicas son un amor.\" — Carolina M. ★★★★★\n\n+200 faciales realizados este mes · 4.9/5 en Google Reviews\n\n### Featured Offer\n\nESTA SEMANA: Diagnóstico de piel GRATIS\n\nReserva cualquier tratamiento facial y te incluimos un diagnóstico personalizado con recomendaciones de rutina para la casa.\n\nSolo 10 cupos esta semana.\n\n[RESERVAR MI DIAGNÓSTICO →]\n\nNo estás segura de qué tratamiento necesitas? Responde este email con \"AYUDA\" y te orientamos personalmente.\n\n### Closing\n\nQue tengas una semana hermosa,\nEl equipo de Berke Spa\n\nP.S. La próxima semana te cuento sobre un ingrediente que está revolucionando los tratamientos anti-aging (pista: NO es retinol). Stay tuned.\n\n---\n\n## 3. ENGAGEMENT BOOSTER\n\nPoll: \"Cuál es tu mayor preocupación de piel ahora?\"\nA) Manchas / hiperpigmentación\nB) Líneas finas / arrugas\nC) Piel grasa / brotes\nD) Deshidratación / piel apagada\n→ Responde con la letra y te mandamos tips personalizados\n\n---\n\n## 4. OPTIMIZACIÓN\n\nSend time: Martes 10:00 AM o Jueves 8:00 PM (peak engagement mujeres 25-45)\nMobile check: ✓ Subject A = 38 chars · Preview = 45 chars → OK\nResend (48h): Subject: \"Te lo perdiste: el error #1 de skincare\" → Preview: \"(spoiler: lo cometes cada mañana)\"\nSegment: Enviar primero a \"engaged last 30 days\" → resend a \"inactive 30-90 days\"`,
    tags: ["nurture", "engagement", "recurring", "email-marketing", "segmentation"],
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
