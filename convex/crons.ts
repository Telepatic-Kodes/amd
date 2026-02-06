import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Cron Jobs para AI Marketing Department
 * 
 * Estos crons ejecutan agentes automáticamente según su configuración de triggers.
 */

// Ejecutar agentes con trigger "cron:hourly"
// Útil para: Budget Pacing, Social Scheduling, etc.
crons.hourly(
  "run-hourly-agents",
  { minuteUTC: 0 }, // Al inicio de cada hora
  api.actions.runScheduledAgents,
  { trigger: "cron:hourly" }
);

// Ejecutar agentes con trigger "cron:daily"
// Útil para: Rank Tracking, Performance Analysis, Engagement Analysis, etc.
crons.daily(
  "run-daily-agents",
  { hourUTC: 6, minuteUTC: 0 }, // 6:00 AM UTC (3:00 AM Chile)
  api.actions.runScheduledAgents,
  { trigger: "cron:daily" }
);

// Ejecutar agentes con trigger "cron:weekly"
// Útil para: SEO Audits, Backlink Analysis, List Hygiene, Newsletter, etc.
crons.weekly(
  "run-weekly-agents",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 }, // Lunes 7:00 AM UTC
  api.actions.runScheduledAgents,
  { trigger: "cron:weekly" }
);

// Limpieza de logs antiguos (mensual)
// crons.monthly(
//   "cleanup-old-logs",
//   { day: 1, hourUTC: 2, minuteUTC: 0 },
//   api.maintenance.cleanupOldLogs,
//   { daysToKeep: 90 }
// );

// ===========================================
// FEED SYNC CRONS
// ===========================================

// Sync daily feeds at 6:00 AM UTC
// Uses fan-out pattern: schedules individual action per feed
crons.daily(
  "sync-daily-feeds",
  { hourUTC: 6, minuteUTC: 0 },
  api.feeds.syncAllFeeds.syncAllFeeds,
  { frequency: "daily" }
);

// Sync hourly feeds at the start of each hour
// 5 minutes after hour to avoid overlap with agent crons
crons.hourly(
  "sync-hourly-feeds",
  { minuteUTC: 5 },
  api.feeds.syncAllFeeds.syncAllFeeds,
  { frequency: "hourly" }
);

// Sync weekly feeds on Monday at 5:00 AM UTC
crons.weekly(
  "sync-weekly-feeds",
  { dayOfWeek: "monday", hourUTC: 5, minuteUTC: 0 },
  api.feeds.syncAllFeeds.syncAllFeeds,
  { frequency: "weekly" }
);

// ===========================================
// AI ENRICHMENT CRONS
// ===========================================

// Process unprocessed feed items through AI enrichment
// Runs 30 minutes after daily feed sync to allow items to populate
// Processes 10 items per run to control costs
crons.daily(
  "enrich-feed-items",
  { hourUTC: 6, minuteUTC: 30 }, // 30 min after daily sync at 6:00
  api.enrichment.orchestration.processBatch,
  { batchSize: 10 }
);

// Hourly enrichment catch-up for newly synced items
// Processes smaller batch (5) more frequently
crons.hourly(
  "enrich-feed-items-hourly",
  { minuteUTC: 35 }, // 30 min after hourly sync at :05
  api.enrichment.orchestration.processBatch,
  { batchSize: 5 }
);

// ===========================================
// BRAND MONITORING (Phase 5)
// ===========================================

// Generate daily alert digest at 8:00 AM UTC
// (30 minutes after enrichment completes at 7:30 AM)
crons.daily(
  "alert-digest-daily",
  { hourUTC: 8, minuteUTC: 0 },
  internal.monitoring.actions.generateAlertDigest,
  {}
);

// ===========================================
// LINKEDIN TOKEN CHECK (Phase 11)
// ===========================================

// Check LinkedIn token expiration daily at 7:00 AM UTC
// Marks expired connections so the UI can prompt reconnection
crons.daily(
  "check-linkedin-tokens",
  { hourUTC: 7, minuteUTC: 0 },
  internal.linkedin.mutations.checkTokenExpiration,
  {}
);

// ===========================================
// LINKEDIN ENGAGEMENT FETCHER (Phase 14)
// ===========================================

// Fetch LinkedIn post engagement hourly
// Uses dynamic TTL to prioritize recent posts (hot: 30min, warm: 4h, cold: 24h)
// Rate limit: max 10 posts per run to stay under LinkedIn's ~500 calls/day
crons.hourly(
  "fetch linkedin engagement",
  { minuteUTC: 15 }, // 15 minutes past each hour
  internal.linkedin.engagement.fetchAllRecentEngagement,
  {}
);

export default crons;
