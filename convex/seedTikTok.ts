import { mutation } from "./_generated/server";

export const seedTikTokPost = mutation({
  args: {},
  handler: async (ctx) => {
    // Find an existing content item to get the brandProfileId and userId
    const existing = await ctx.db.query("content").first();
    if (!existing) throw new Error("No existing content found");

    const body = `## Contenido Mejorado
Tipo: Reel/TikTok
Título: 5 Secretos de Skincare que nadie te cuenta

**Guión:**

**Escena 1:** Hook visual - Close-up de piel perfecta con texto overlay "¿Quieres esta piel? 👀"
**Escena 2:** Tip 1 - Nunca te saltes el protector solar, incluso en días nublados ☀️
**Escena 3:** Tip 2 - El retinol es tu mejor amigo después de los 25 🧴
**Escena 4:** Tip 3 - Hidratación desde adentro: 2 litros de agua mínimo 💧
**Escena 5:** Tip 4 - Doble limpieza facial cada noche, sin excusas 🫧
**Escena 6:** CTA - "Síguenos para más tips de skincare" con logo Berke Spa ✨

---

**Hashtags:** #Skincare #CuidadoDeLaPiel #BerkeSpa #TipsDeBelleza #RutinaFacial #GlowUp #PielPerfecta

**Música Sugerida:** Trending audio - "That Girl" aesthetic remix
**Duración:** 30-45 segundos`;

    const now = Date.now();
    const id = await ctx.db.insert("content", {
      type: "social_tiktok",
      title: "TikTok: 5 Secretos de Skincare",
      body,
      status: "draft",
      brandProfileId: existing.brandProfileId,
      userId: existing.userId,
      createdBy: "system",
      createdAt: now,
      updatedAt: now,
      contentId: `tiktok-skincare-${now}`,
      metadata: {
        wordCount: 120,
        readingTime: 1,
      },
    });

    return { id, message: "TikTok post seeded successfully" };
  },
});
