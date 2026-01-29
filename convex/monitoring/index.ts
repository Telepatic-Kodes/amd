/**
 * Brand Monitoring Module
 *
 * Barrel export for monitoring configuration and utilities.
 */

export {
  MONITORED_COMPETITORS,
  MONITORED_BRAND_TERMS,
  ALERT_THRESHOLDS,
  getCompetitorNames,
  getAllCompetitorTerms,
  findCompetitorByTerm,
  extractBrandMentions,
  extractCompetitorMentions,
  type Competitor,
  type AlertThresholds,
} from "./config";
