/**
 * Brand Monitoring Configuration
 *
 * Defines competitors, brand terms, and alert thresholds for the monitoring system.
 */

// ===========================================
// COMPETITOR DEFINITIONS
// ===========================================

export interface Competitor {
  name: string; // Display name
  aliases: string[]; // Alternative names, abbreviations, domains
}

export const MONITORED_COMPETITORS: Competitor[] = [
  {
    name: "HubSpot",
    aliases: ["hubspot", "hub spot", "hubspot.com", "hubspot crm"],
  },
  {
    name: "Marketo",
    aliases: ["marketo", "adobe marketo", "marketo.com", "marketo engage"],
  },
  {
    name: "Salesforce Marketing Cloud",
    aliases: [
      "salesforce marketing",
      "sfmc",
      "marketing cloud",
      "pardot",
      "salesforce.com",
    ],
  },
  {
    name: "ActiveCampaign",
    aliases: ["activecampaign", "active campaign", "activecampaign.com"],
  },
  {
    name: "Mailchimp",
    aliases: ["mailchimp", "mail chimp", "mailchimp.com", "intuit mailchimp"],
  },
  {
    name: "Brevo (Sendinblue)",
    aliases: ["brevo", "sendinblue", "brevo.com", "sendinblue.com"],
  },
  {
    name: "Klaviyo",
    aliases: ["klaviyo", "klaviyo.com"],
  },
];

// ===========================================
// BRAND TERMS
// ===========================================

export const MONITORED_BRAND_TERMS: string[] = [
  "aiaiai consulting",
  "aiaiai",
  "ai marketing department",
  "amd marketing",
  "autonomous marketing",
];

// ===========================================
// ALERT THRESHOLDS
// ===========================================

export interface AlertThresholds {
  minRelevanceScore: number; // Minimum relevance to include in digest
  highRelevanceThreshold: number; // Threshold for "high relevance" classification
  maxDigestItems: number; // Maximum items per digest
}

export const ALERT_THRESHOLDS: AlertThresholds = {
  minRelevanceScore: 60, // Only include items scored 60+
  highRelevanceThreshold: 70, // Items 70+ are "high relevance"
  maxDigestItems: 50, // Cap at 50 items per digest
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get all competitor names (for display)
 */
export function getCompetitorNames(): string[] {
  return MONITORED_COMPETITORS.map((c) => c.name);
}

/**
 * Get all competitor terms (names + aliases) for matching
 */
export function getAllCompetitorTerms(): string[] {
  const terms: string[] = [];
  for (const competitor of MONITORED_COMPETITORS) {
    terms.push(competitor.name.toLowerCase());
    terms.push(...competitor.aliases.map((a) => a.toLowerCase()));
  }
  return terms;
}

/**
 * Find which competitor a term matches
 * @returns Competitor name if found, null otherwise
 */
export function findCompetitorByTerm(term: string): string | null {
  const lowerTerm = term.toLowerCase();
  for (const competitor of MONITORED_COMPETITORS) {
    if (
      competitor.name.toLowerCase() === lowerTerm ||
      competitor.aliases.some((alias) => alias.toLowerCase() === lowerTerm)
    ) {
      return competitor.name;
    }
  }
  return null;
}

/**
 * Check if a text contains any brand mentions
 * @returns Array of matched brand terms
 */
export function extractBrandMentions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const mentions: string[] = [];

  for (const term of MONITORED_BRAND_TERMS) {
    if (lowerText.includes(term.toLowerCase())) {
      mentions.push(term);
    }
  }

  return mentions;
}

/**
 * Check if a text contains any competitor mentions
 * @returns Array of matched competitor names (normalized)
 */
export function extractCompetitorMentions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const mentionedCompetitors = new Set<string>();

  for (const competitor of MONITORED_COMPETITORS) {
    // Check competitor name
    if (lowerText.includes(competitor.name.toLowerCase())) {
      mentionedCompetitors.add(competitor.name);
    }

    // Check aliases
    for (const alias of competitor.aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        mentionedCompetitors.add(competitor.name);
        break; // Only add once per competitor
      }
    }
  }

  return Array.from(mentionedCompetitors);
}
