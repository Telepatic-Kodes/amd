/**
 * Feed Templates for different industries
 * Used by onboarding to pre-populate common RSS feeds
 */

export interface FeedTemplate {
  url: string;
  name: string;
  description: string;
  category: string;
}

export const FEED_TEMPLATES: FeedTemplate[] = [
  // Marketing & Advertising
  {
    url: "https://blog.hubspot.com/marketing/rss.xml",
    name: "HubSpot Marketing Blog",
    description: "Marketing insights and best practices",
    category: "marketing",
  },
  {
    url: "https://contentmarketinginstitute.com/feed/",
    name: "Content Marketing Institute",
    description: "Content marketing strategies",
    category: "marketing",
  },
  {
    url: "https://neilpatel.com/feed/",
    name: "Neil Patel Blog",
    description: "Digital marketing and SEO",
    category: "marketing",
  },
  {
    url: "https://www.socialmediaexaminer.com/feed/",
    name: "Social Media Examiner",
    description: "Social media marketing tips",
    category: "marketing",
  },

  // Technology
  {
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch",
    description: "Technology news and startups",
    category: "technology",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    name: "The Verge",
    description: "Technology and culture",
    category: "technology",
  },

  // Business
  {
    url: "https://hbr.org/feed",
    name: "Harvard Business Review",
    description: "Business strategy and management",
    category: "business",
  },
  {
    url: "https://www.entrepreneur.com/feeds/latest.rss",
    name: "Entrepreneur",
    description: "Entrepreneurship and business growth",
    category: "business",
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
