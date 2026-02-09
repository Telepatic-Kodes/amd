/**
 * Feed Templates for different industries
 * Used by onboarding to pre-populate common RSS feeds
 */

export interface FeedTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  feeds: string[];
}

export const FEED_TEMPLATES: FeedTemplate[] = [
  // Marketing & Advertising
  {
    id: "marketing",
    name: "Marketing & Publicidad",
    description: "HubSpot, Content Marketing Institute, Neil Patel, Social Media Examiner",
    icon: "📢",
    category: "marketing",
    feeds: [
      "https://blog.hubspot.com/marketing/rss.xml",
      "https://contentmarketinginstitute.com/feed/",
      "https://neilpatel.com/feed/",
      "https://www.socialmediaexaminer.com/feed/",
    ],
  },

  // Technology
  {
    id: "technology",
    name: "Tecnologia",
    description: "TechCrunch, The Verge",
    icon: "💻",
    category: "technology",
    feeds: [
      "https://techcrunch.com/feed/",
      "https://www.theverge.com/rss/index.xml",
    ],
  },

  // Business
  {
    id: "business",
    name: "Negocios",
    description: "Harvard Business Review, Entrepreneur",
    icon: "💼",
    category: "business",
    feeds: [
      "https://hbr.org/feed",
      "https://www.entrepreneur.com/feeds/latest.rss",
    ],
  },
];

export function getTemplatesByIndustry(industry: string): FeedTemplate[] {
  if (!industry || industry === "all") {
    return FEED_TEMPLATES;
  }
  return FEED_TEMPLATES.filter((template) => template.category === industry);
}

export function getAvailableCategories(): string[] {
  const categories = new Set(FEED_TEMPLATES.map((t) => t.category));
  return Array.from(categories);
}
