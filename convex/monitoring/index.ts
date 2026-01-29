/**
 * Brand Monitoring Module
 *
 * Barrel export for monitoring configuration, queries, mutations, and utilities.
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

export {
  getAlertCandidates,
  getLatestDigest,
  listDigests,
  getDigest,
  getItemsWithBrandMentions,
  getItemsWithCompetitorMentions,
} from "./queries";

export {
  storeAlertDigest,
  markDigestSent,
  markDigestFailed,
} from "./mutations";
