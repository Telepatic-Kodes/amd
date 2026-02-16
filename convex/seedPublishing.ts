import { mutation } from "./_generated/server";

/**
 * Seeds platform connections and publishing history so the /publishing page
 * shows connected channels and a realistic publish timeline.
 */
export const seed = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const HOUR = 60 * 60 * 1000;

    // ── Clear existing publishing data ─────────────────────────
    const tables = [
      "linkedinConnections",
      "linkedinPublishLog",
      "linkedinEngagement",
      "twitterConnections",
      "twitterPublishLog",
      "instagramConnections",
      "instagramPublishLog",
      "emailProviderConnections",
      "emailSendLog",
      "emailEngagement",
      "emailSubscribers",
    ] as const;

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    // ── Get existing content to reference ──────────────────────
    const content = await ctx.db.query("content").order("desc").take(20);
    if (content.length === 0) {
      return { message: "No content found — run seedDemoData first" };
    }

    // ── 1. Platform Connections ────────────────────────────────

    const linkedinId = await ctx.db.insert("linkedinConnections", {
      userId: "dev-user-001",
      linkedinMemberId: "LI-NovaTech-001",
      displayName: "NovaTech Solutions",
      email: "marketing@novatech.io",
      profilePicture: undefined,
      profileUrl: "https://linkedin.com/company/novatech-solutions",
      accessToken: "mock_li_token_demo",
      accessTokenExpiresAt: now + 55 * DAY,
      scopes: ["w_member_social", "r_basicprofile", "r_organization_social"],
      status: "connected",
      dailyPostCount: 3,
      lastPostAt: now - 4 * HOUR,
      lastPostCountResetAt: now - 8 * HOUR,
      connectedAt: now - 45 * DAY,
      updatedAt: now - 1 * HOUR,
    });

    const twitterId = await ctx.db.insert("twitterConnections", {
      userId: "dev-user-001",
      twitterUserId: "TW-9182736450",
      username: "novatech_io",
      displayName: "NovaTech Solutions",
      profileImageUrl: undefined,
      accessToken: "mock_tw_token_demo",
      accessTokenExpiresAt: now + 170 * DAY,
      scopes: ["tweet.read", "tweet.write", "users.read"],
      status: "connected",
      dailyTweetCount: 2,
      lastTweetAt: now - 6 * HOUR,
      lastTweetCountResetAt: now - 10 * HOUR,
      connectedAt: now - 38 * DAY,
      updatedAt: now - 2 * HOUR,
    });

    const instagramId = await ctx.db.insert("instagramConnections", {
      userId: "dev-user-001",
      instagramUserId: "IG-17841455",
      username: "novatech.io",
      displayName: "NovaTech Solutions",
      facebookPageId: "FB-108234567",
      facebookPageName: "NovaTech Solutions",
      accessToken: "mock_ig_token_demo",
      accessTokenExpiresAt: now + 50 * DAY,
      scopes: ["instagram_basic", "instagram_content_publish"],
      status: "connected",
      dailyPostCount: 1,
      lastPostAt: now - 12 * HOUR,
      lastPostCountResetAt: now - 14 * HOUR,
      connectedAt: now - 30 * DAY,
      updatedAt: now - 3 * HOUR,
    });

    const emailId = await ctx.db.insert("emailProviderConnections", {
      userId: "dev-user-001",
      provider: "resend",
      apiKey: "re_mock_demo_key_novatech",
      senderEmail: "marketing@novatech.io",
      senderName: "NovaTech Marketing",
      status: "connected",
      dailySendCount: 45,
      dailySendLimit: 1000,
      lastSendAt: now - 5 * HOUR,
      lastSendCountResetAt: now - 12 * HOUR,
      connectedAt: now - 60 * DAY,
      updatedAt: now - 2 * HOUR,
    });

    // ── 2. Publishing Logs ─────────────────────────────────────
    let logCount = 0;

    // LinkedIn published posts (use first 5 content items)
    for (let i = 0; i < Math.min(5, content.length); i++) {
      await ctx.db.insert("linkedinPublishLog", {
        contentId: content[i]._id,
        connectionId: linkedinId,
        linkedinPostUrn: `urn:li:share:70${10000000 + i}`,
        status: "published",
        publishedAt: now - (i * 3 + 1) * DAY,
        metadata: {
          postType: i % 2 === 0 ? "TEXT" : "IMAGE",
          characterCount: 200 + i * 50,
          hasImage: i % 2 !== 0,
          visibility: "PUBLIC",
        },
        createdAt: now - (i * 3 + 1) * DAY,
      });
      logCount++;

      // Add engagement for published LinkedIn posts
      await ctx.db.insert("linkedinEngagement", {
        contentId: content[i]._id,
        linkedinPostUrn: `urn:li:share:70${10000000 + i}`,
        likes: Math.floor(45 + Math.random() * 150),
        comments: Math.floor(5 + Math.random() * 30),
        shares: Math.floor(3 + Math.random() * 20),
        impressions: Math.floor(800 + Math.random() * 4000),
        clicks: Math.floor(20 + Math.random() * 100),
        engagement_rate: parseFloat((2 + Math.random() * 6).toFixed(2)),
        fetchedAt: now - i * DAY,
        userId: "dev-user-001",
      });
    }

    // 1 LinkedIn failed
    if (content.length > 5) {
      await ctx.db.insert("linkedinPublishLog", {
        contentId: content[5]._id,
        connectionId: linkedinId,
        status: "failed",
        errorMessage: "Rate limit exceeded. Daily post limit reached (25/25).",
        createdAt: now - 2 * DAY,
      });
      logCount++;
    }

    // Twitter published threads (use content items 2-6)
    for (let i = 2; i < Math.min(7, content.length); i++) {
      const isThread = i % 2 === 0;
      await ctx.db.insert("twitterPublishLog", {
        contentId: content[i]._id,
        connectionId: twitterId,
        tweetIds: isThread
          ? [`18${30000000 + i}0`, `18${30000000 + i}1`, `18${30000000 + i}2`]
          : [`18${30000000 + i}0`],
        status: "published",
        publishedAt: now - (i * 2 + 1) * DAY,
        metadata: {
          tweetCount: isThread ? 3 : 1,
          characterCount: isThread ? 840 : 270,
          isThread,
          threadUrl: isThread
            ? `https://twitter.com/novatech_io/status/18${30000000 + i}0`
            : undefined,
        },
        createdAt: now - (i * 2 + 1) * DAY,
      });
      logCount++;
    }

    // 1 Twitter pending
    if (content.length > 7) {
      await ctx.db.insert("twitterPublishLog", {
        contentId: content[7]._id,
        connectionId: twitterId,
        status: "pending",
        createdAt: now - 1 * HOUR,
      });
      logCount++;
    }

    // Instagram published posts (use content items 3-6)
    for (let i = 3; i < Math.min(7, content.length); i++) {
      const mediaType = i % 3 === 0 ? "carousel" : i % 3 === 1 ? "video" : "image";
      await ctx.db.insert("instagramPublishLog", {
        contentId: content[i]._id,
        connectionId: instagramId,
        instagramMediaId: `IG-${17800000 + i}`,
        mediaType: mediaType as "image" | "carousel" | "video",
        status: "published",
        publishedAt: now - (i * 4) * DAY,
        metadata: {
          captionLength: 150 + i * 30,
          imageCount: mediaType === "carousel" ? 5 : 1,
          permalink: `https://instagram.com/p/mock_${i}`,
        },
        createdAt: now - (i * 4) * DAY,
      });
      logCount++;
    }

    // Email sends (use content items 0-3)
    for (let i = 0; i < Math.min(4, content.length); i++) {
      const sendLogId = await ctx.db.insert("emailSendLog", {
        contentId: content[i]._id,
        connectionId: emailId,
        subject: content[i].title || `Newsletter #${i + 1}`,
        recipientCount: 150 + i * 80,
        status: "sent",
        sentAt: now - (i * 7 + 2) * DAY,
        metadata: {
          openRate: parseFloat((25 + Math.random() * 20).toFixed(1)),
          clickRate: parseFloat((3 + Math.random() * 8).toFixed(1)),
          bounceRate: parseFloat((0.5 + Math.random() * 2).toFixed(1)),
          unsubscribeRate: parseFloat((0.1 + Math.random() * 0.5).toFixed(2)),
        },
        createdAt: now - (i * 7 + 2) * DAY,
      });

      // Add email engagement
      const recipientCount = 150 + i * 80;
      const sent = recipientCount;
      const delivered = Math.floor(sent * 0.97);
      const opened = Math.floor(delivered * (0.25 + Math.random() * 0.2));
      const clicked = Math.floor(opened * (0.15 + Math.random() * 0.2));
      const bounced = sent - delivered;

      await ctx.db.insert("emailEngagement", {
        contentId: content[i]._id,
        sendLogId,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed: Math.floor(Math.random() * 3),
        deliveryRate: parseFloat(((delivered / sent) * 100).toFixed(1)),
        openRate: parseFloat(((opened / delivered) * 100).toFixed(1)),
        clickRate: parseFloat(((clicked / opened) * 100).toFixed(1)),
        bounceRate: parseFloat(((bounced / sent) * 100).toFixed(1)),
        fetchedAt: now - i * DAY,
      });
      logCount++;
    }

    // ── 3. Email Subscribers ───────────────────────────────────
    const subscribers = [
      { email: "carlos.mendez@techcorp.cl", firstName: "Carlos", lastName: "Mendez", tags: ["vip", "newsletter"], segments: ["b2b", "decision-maker"] },
      { email: "ana.fuentes@growthlab.io", firstName: "Ana", lastName: "Fuentes", tags: ["newsletter", "webinar"], segments: ["b2b", "engaged"] },
      { email: "pedro.silva@startupx.com", firstName: "Pedro", lastName: "Silva", tags: ["newsletter"], segments: ["startup", "trial"] },
      { email: "maria.gonzalez@empresa.cl", firstName: "Maria", lastName: "Gonzalez", tags: ["vip", "newsletter", "case-study"], segments: ["enterprise", "champion"] },
      { email: "jorge.ramirez@agencia.co", firstName: "Jorge", lastName: "Ramirez", tags: ["partner", "newsletter"], segments: ["agency", "partner-program"] },
      { email: "laura.torres@ecommerce.cl", firstName: "Laura", lastName: "Torres", tags: ["newsletter", "product-updates"], segments: ["b2b", "mid-market"] },
      { email: "diego.vargas@fintech.io", firstName: "Diego", lastName: "Vargas", tags: ["newsletter"], segments: ["fintech", "trial"] },
      { email: "camila.rojas@saas.com", firstName: "Camila", lastName: "Rojas", tags: ["vip", "early-adopter"], segments: ["saas", "power-user"] },
    ];

    for (let i = 0; i < subscribers.length; i++) {
      const s = subscribers[i];
      const daysAgo = 90 - i * 10;
      await ctx.db.insert("emailSubscribers", {
        userId: "dev-user-001",
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        status: i < 7 ? "active" : "active",
        tags: s.tags,
        segments: s.segments,
        source: i % 3 === 0 ? "landing_page" : i % 3 === 1 ? "webinar" : "blog",
        totalSent: Math.floor(8 + Math.random() * 20),
        totalOpened: Math.floor(4 + Math.random() * 12),
        totalClicked: Math.floor(1 + Math.random() * 6),
        lastSentAt: now - (i + 1) * 3 * DAY,
        subscribedAt: now - daysAgo * DAY,
        updatedAt: now - (i + 1) * DAY,
      });
    }

    // ── 4. Update some content as "published" ──────────────────
    let publishedCount = 0;
    for (let i = 0; i < Math.min(6, content.length); i++) {
      const c = content[i];
      if (c.status !== "published") {
        await ctx.db.patch(c._id, {
          status: "published",
          publishedUrl: `https://novatech.io/blog/${c.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50) || "post-" + i}`,
          publishedAt: now - (i * 3 + 2) * DAY,
        });
        publishedCount++;
      }
    }

    return {
      message: `Publishing seeded: 4 connections (LinkedIn, Twitter, Instagram, Email), ${logCount} publish logs, ${subscribers.length} subscribers, ${publishedCount} content items updated to published`,
    };
  },
});
