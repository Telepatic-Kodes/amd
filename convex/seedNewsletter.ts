import { mutation } from "./_generated/server";

export const seedNewsletterPost = mutation({
  args: {},
  handler: async (ctx) => {
    // Find an existing content item to get the brandProfileId and userId
    const existing = await ctx.db.query("content").first();
    if (!existing) throw new Error("No existing content found");

    const body = `## Contenido Mejorado
Tipo: Newsletter
Título: Newsletter Semanal — Tendencias de Belleza Febrero 2026

**Asunto:** 💆 Las 5 tendencias de skincare que dominarán 2026 — Berke Spa

**Preheader:** Descubre los tratamientos más innovadores y una oferta exclusiva para ti

---

**Bienvenida y Contexto**

¡Hola! Bienvenido/a a la edición de febrero de nuestro newsletter. Este mes hemos recopilado las tendencias más relevantes en el mundo del cuidado de la piel y los tratamientos estéticos no invasivos. Desde tecnologías de última generación hasta rituales ancestrales reinventados, te traemos todo lo que necesitas saber para mantener tu piel radiante.

---

**Tendencia 1: Skincare Personalizado con IA**

La inteligencia artificial está revolucionando la dermocosmética. Ahora es posible analizar tu tipo de piel en tiempo real y crear rutinas 100% personalizadas. En Berke Spa ya implementamos diagnóstico facial con IA para todos nuestros tratamientos, logrando resultados un 40% más efectivos que los protocolos genéricos.

---

**Tendencia 2: Crioterapia Facial de Precisión**

La crioterapia facial ha evolucionado con equipos de precisión milimétrica. Este tratamiento estimula la producción de colágeno, reduce poros y mejora la circulación. Los resultados son visibles desde la primera sesión, con una piel más firme y luminosa. Agenda tu sesión de prueba con 20% de descuento este febrero.

---

**Tendencia 3: Rituales de Bienestar Holístico**

La tendencia hacia el bienestar integral sigue creciendo. Nuestro nuevo programa combina tratamientos faciales con aromaterapia y meditación guiada, ofreciendo una experiencia completa de relajación y rejuvenecimiento que va más allá de lo estético.

---

**CTA:** Reserva tu consulta gratuita de diagnóstico facial
**URL:** https://berkespa.com/reservar

**Footer:** Berke Spa — Estética y Bienestar | Av. Providencia 1234, Santiago`;

    const now = Date.now();
    const id = await ctx.db.insert("content", {
      type: "newsletter",
      title: "Newsletter: Tendencias Skincare Febrero 2026",
      body,
      status: "draft",
      brandProfileId: existing.brandProfileId,
      userId: existing.userId,
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
      contentId: `newsletter-skincare-${now}`,
      metadata: {
        wordCount: 280,
        readingTime: 3,
      },
    });

    return { id, message: "Newsletter seeded successfully" };
  },
});
