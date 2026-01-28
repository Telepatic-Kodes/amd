import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

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

export default crons;
