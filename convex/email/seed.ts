import { mutation } from "../_generated/server";

// Chilean first names for realistic mock data
const FIRST_NAMES = [
  "Sofía", "Valentina", "Isidora", "Martina", "Florencia",
  "Catalina", "Fernanda", "Javiera", "Antonia", "Camila",
  "Matías", "Sebastián", "Benjamín", "Vicente", "Tomás",
  "Agustín", "Maximiliano", "Joaquín", "Nicolás", "Diego",
  "Francisca", "Amanda", "Renata", "Emilia", "Josefa",
  "Lucas", "Gabriel", "Felipe", "Ignacio", "Cristóbal",
  "Daniela", "María José", "Constanza", "Gabriela", "Carolina",
  "Andrés", "Pablo", "Rodrigo", "Alejandro", "Marcelo",
  "Isabella", "Victoria", "Macarena", "Paulina", "Andrea",
  "Esteban", "Francisco", "Carlos", "Manuel", "Pedro",
  "Bárbara", "Trinidad", "Paz", "Rocío", "Natalia",
  "Rafael", "Eduardo", "Álvaro", "Hernán", "Jorge",
  "Claudia", "Lorena", "Patricia", "Loreto", "Ximena",
  "Fernando", "Ricardo", "Gonzalo", "Sergio", "Oscar",
  "Elena", "Rosa", "Ana", "Luz", "Pilar",
];

const LAST_NAMES = [
  "González", "Muñoz", "Rojas", "Díaz", "Pérez",
  "Soto", "Contreras", "Silva", "Martínez", "Sepúlveda",
  "Morales", "Rodríguez", "López", "Fuentes", "Hernández",
  "García", "Garrido", "Bravo", "Reyes", "Núñez",
  "Araya", "Espinoza", "Aravena", "Valenzuela", "Tapia",
  "Figueroa", "Cortés", "Castillo", "Jiménez", "Torres",
  "Vera", "Salazar", "Pizarro", "Flores", "Vega",
  "Campos", "Sandoval", "Vargas", "Fernández", "Carrasco",
];

const DOMAINS = ["gmail.com", "hotmail.com", "outlook.cl", "yahoo.com", "empresa.cl"];
const TAGS = ["newsletter", "ofertas", "tips-belleza", "wellness", "eventos", "nuevos-servicios"];
const SEGMENTS = ["leads", "clientes", "vip", "referidos"];
const SOURCES = ["website", "instagram", "referral", "manual", "import"];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Clear all email subscribers (for re-seeding)
 */
export const clearSubscribers = mutation({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("emailSubscribers").collect();
    for (const sub of subs) {
      await ctx.db.delete(sub._id);
    }
    return { deleted: subs.length };
  },
});

/**
 * Seed mock email data: 1 provider connection, 75 subscribers, 5 send logs
 */
export const seedEmailData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Create mock provider connection
    const existingConnection = await ctx.db
      .query("emailProviderConnections")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();

    let connectionId;
    if (existingConnection) {
      connectionId = existingConnection._id;
    } else {
      connectionId = await ctx.db.insert("emailProviderConnections", {
        provider: "mock",
        apiKey: "mock_key_berkespa_2026",
        senderEmail: "marketing@berkespa.com",
        senderName: "Berke Spa & Wellness",
        status: "connected",
        dailySendCount: 0,
        dailySendLimit: 10000,
        lastSendCountResetAt: now,
        connectedAt: now - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        updatedAt: now,
      });
    }

    // 2. Create 75 mock subscribers
    const existingSubscribers = await ctx.db
      .query("emailSubscribers")
      .take(1);

    if (existingSubscribers.length === 0) {
      for (let i = 0; i < 75; i++) {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = randomElement(LAST_NAMES);
        const domain = randomElement(DOMAINS);
        const emailPrefix = `${firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}.${lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;

        // 85% active, 8% unsubscribed, 5% bounced, 2% complained
        const statusRoll = Math.random();
        const status: "active" | "unsubscribed" | "bounced" | "complained" =
          statusRoll < 0.85 ? "active" :
          statusRoll < 0.93 ? "unsubscribed" :
          statusRoll < 0.98 ? "bounced" : "complained";

        const subscribedDaysAgo = Math.floor(Math.random() * 180) + 1;
        const totalSent = Math.floor(Math.random() * 20);
        const totalOpened = Math.floor(Math.random() * (totalSent + 1));
        const totalClicked = Math.floor(Math.random() * (totalOpened + 1));

        await ctx.db.insert("emailSubscribers", {
          email: `${emailPrefix}@${domain}`,
          firstName,
          lastName,
          status,
          tags: randomSubset(TAGS, 1, 3),
          segments: randomSubset(SEGMENTS, 1, 2),
          source: randomElement(SOURCES),
          totalSent,
          totalOpened,
          totalClicked,
          lastSentAt: status === "active"
            ? now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
            : undefined,
          subscribedAt: now - subscribedDaysAgo * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
      }
    }

    // 3. Create 5 mock send logs with engagement data
    // Find newsletter content to link to
    const newsletterContent = await ctx.db
      .query("content")
      .withIndex("by_type", (q) => q.eq("type", "newsletter"))
      .take(5);

    const emailContent = await ctx.db
      .query("content")
      .withIndex("by_type", (q) => q.eq("type", "email"))
      .take(5);

    const contentForSendLogs = [...newsletterContent, ...emailContent].slice(0, 5);

    const mockSendData = [
      { recipientCount: 72, openRate: 42.1, clickRate: 5.3, bounceRate: 2.8, unsub: 0.1, daysAgo: 2 },
      { recipientCount: 68, openRate: 38.5, clickRate: 4.1, bounceRate: 4.4, unsub: 0.3, daysAgo: 9 },
      { recipientCount: 65, openRate: 35.2, clickRate: 3.8, bounceRate: 3.1, unsub: 0.2, daysAgo: 16 },
      { recipientCount: 60, openRate: 41.7, clickRate: 6.2, bounceRate: 1.7, unsub: 0.0, daysAgo: 23 },
      { recipientCount: 55, openRate: 33.9, clickRate: 3.5, bounceRate: 5.5, unsub: 0.4, daysAgo: 30 },
    ];

    for (let i = 0; i < Math.min(contentForSendLogs.length, mockSendData.length); i++) {
      const content = contentForSendLogs[i];
      const data = mockSendData[i];
      const sentAt = now - data.daysAgo * 24 * 60 * 60 * 1000;

      const sendLogId = await ctx.db.insert("emailSendLog", {
        contentId: content._id,
        connectionId: connectionId,
        subject: content.title,
        recipientCount: data.recipientCount,
        status: "sent",
        sentAt,
        metadata: {
          openRate: data.openRate,
          clickRate: data.clickRate,
          bounceRate: data.bounceRate,
          unsubscribeRate: data.unsub,
        },
        createdAt: sentAt,
      });

      // Create engagement record
      const sent = data.recipientCount;
      const delivered = Math.floor(sent * (1 - data.bounceRate / 100));
      const opened = Math.floor(delivered * (data.openRate / 100));
      const clicked = Math.floor(delivered * (data.clickRate / 100));
      const bounced = sent - delivered;
      const unsubscribed = Math.floor(delivered * (data.unsub / 100));

      await ctx.db.insert("emailEngagement", {
        contentId: content._id,
        sendLogId,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        deliveryRate: (delivered / sent) * 100,
        openRate: data.openRate,
        clickRate: data.clickRate,
        bounceRate: data.bounceRate,
        fetchedAt: sentAt + 24 * 60 * 60 * 1000,
      });
    }

    return {
      connectionId,
      subscribersCreated: 75,
      sendLogsCreated: Math.min(contentForSendLogs.length, 5),
    };
  },
});
