/**
 * Feed Templates - Pre-configured bundles of RSS feeds by industry
 * Allows users to add multiple feeds with a single click during onboarding
 */

export interface FeedTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  industry: string;
  feeds: Array<{
    name: string;
    url: string;
    category: "industry" | "competitor" | "technical" | "news" | "blog";
    syncFrequency: "hourly" | "daily" | "weekly";
  }>;
  estimatedItemsPerDay: number;
}

export const FEED_TEMPLATES: FeedTemplate[] = [
  {
    id: "marketing-industry",
    name: "Marketing Industry Bundle",
    description: "Industry insights, trends, and thought leadership for marketers",
    icon: "🎯",
    industry: "Marketing & Advertising",
    feeds: [
      {
        name: "HubSpot Blog",
        url: "https://blog.hubspot.com/feed.xml",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Content Marketing Institute",
        url: "https://contentmarketinginstitute.com/feed/",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Marketing Dive",
        url: "https://www.marketingdive.com/feeds/news/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Neil Patel",
        url: "https://neilpatel.com/blog/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "Copyblogger",
        url: "https://www.copyblogger.com/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
    ],
    estimatedItemsPerDay: 25,
  },

  {
    id: "saas-competition",
    name: "SaaS Competition Bundle",
    description: "Monitor competitors and SaaS industry trends",
    icon: "📊",
    industry: "SaaS & Technology",
    feeds: [
      {
        name: "Product Hunt",
        url: "https://www.producthunt.com/feed",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "SaaS Weekly",
        url: "https://www.saasweekly.com/feed/",
        category: "industry",
        syncFrequency: "weekly",
      },
      {
        name: "The SaaS Magazine",
        url: "https://www.saasmag.com/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "Indie Hackers",
        url: "https://www.indiehackers.com/feed.xml",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "TechCrunch",
        url: "http://feeds.techcrunch.com/TechCrunch/",
        category: "technical",
        syncFrequency: "daily",
      },
    ],
    estimatedItemsPerDay: 20,
  },

  {
    id: "tech-ai",
    name: "Tech & AI Bundle",
    description: "Latest developments in AI, machine learning, and technology",
    icon: "🤖",
    industry: "Technology & AI",
    feeds: [
      {
        name: "OpenAI Blog",
        url: "https://openai.com/feed.xml",
        category: "industry",
        syncFrequency: "weekly",
      },
      {
        name: "Anthropic Blog",
        url: "https://www.anthropic.com/feed.xml",
        category: "industry",
        syncFrequency: "weekly",
      },
      {
        name: "The Verge Tech",
        url: "https://www.theverge.com/tech/rss/index.xml",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "MIT Technology Review",
        url: "https://www.technologyreview.com/feed.xml",
        category: "technical",
        syncFrequency: "daily",
      },
      {
        name: "Hacker News",
        url: "https://news.ycombinator.com/rss",
        category: "technical",
        syncFrequency: "daily",
      },
    ],
    estimatedItemsPerDay: 30,
  },

  {
    id: "ecommerce-retail",
    name: "E-Commerce & Retail Bundle",
    description: "E-commerce trends, conversion strategies, and retail insights",
    icon: "🛍️",
    industry: "E-Commerce & Retail",
    feeds: [
      {
        name: "Shopify Blog",
        url: "https://www.shopify.com/blog/feed.xml",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Baymard Institute",
        url: "https://baymard.com/feed",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "E-Commerce Times",
        url: "https://www.ecommercetimes.com/perl/syndication/headlines.xml",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Big Commerce Blog",
        url: "https://www.bigcommerce.com/blog/feed.xml",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "Conversion Rate Experts",
        url: "https://conversion-rate-experts.com/feed.xml",
        category: "blog",
        syncFrequency: "weekly",
      },
    ],
    estimatedItemsPerDay: 22,
  },

  {
    id: "healthcare-pharma",
    name: "Healthcare & Pharma Bundle",
    description: "Healthcare industry news, regulations, and pharma trends",
    icon: "⚕️",
    industry: "Healthcare & Pharmaceutical",
    feeds: [
      {
        name: "Healthcare IT News",
        url: "https://www.healthcareitnews.com/feeds/news",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "STAT News",
        url: "https://www.statnews.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Fierce Healthcare",
        url: "https://www.fiercehealthcare.com/feed.xml",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Pharma Times",
        url: "https://www.pharmatimes.com/rss.xml",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "BioDeCode",
        url: "https://www.biodecode.com/feed/",
        category: "blog",
        syncFrequency: "weekly",
      },
    ],
    estimatedItemsPerDay: 18,
  },

  {
    id: "finance-fintech",
    name: "Finance & FinTech Bundle",
    description: "Financial industry trends, fintech innovation, and market news",
    icon: "💰",
    industry: "Finance & FinTech",
    feeds: [
      {
        name: "TechCrunch Finance",
        url: "http://feeds.techcrunch.com/TechCrunch/finance",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "FinTech Magazine",
        url: "https://www.fintechmagazine.com/feed",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "The Block",
        url: "https://www.theblock.co/feed",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Cointelegraph",
        url: "https://cointelegraph.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Digging the Digital",
        url: "https://www.diggingthedigital.com/feed/",
        category: "blog",
        syncFrequency: "weekly",
      },
    ],
    estimatedItemsPerDay: 28,
  },

  {
    id: "education-learning",
    name: "Education & Learning Bundle",
    description: "EdTech trends, online learning, and educational innovation",
    icon: "🎓",
    industry: "Education & EdTech",
    feeds: [
      {
        name: "EdSurge",
        url: "https://www.edsurge.com/feeds/news",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Learning Hub",
        url: "https://www.learninghub.com/feed/",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Inside Higher Ed",
        url: "https://www.insidehighered.com/news.rss",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "The Chronicle",
        url: "https://www.chronicle.com/feed/news",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Course Report",
        url: "https://www.coursereport.com/feed.xml",
        category: "blog",
        syncFrequency: "weekly",
      },
    ],
    estimatedItemsPerDay: 20,
  },

  {
    id: "real-estate",
    name: "Real Estate Bundle",
    description: "Real estate market trends, property tech, and industry insights",
    icon: "🏠",
    industry: "Real Estate",
    feeds: [
      {
        name: "Real Estate News Exchange",
        url: "https://www.realestatenewsexchange.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "RE/MAX Blog",
        url: "https://blog.remax.com/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "Zillow Research",
        url: "https://www.zillow.com/research/feed/",
        category: "industry",
        syncFrequency: "weekly",
      },
      {
        name: "CoStar Blog",
        url: "https://www.costar.com/feed/",
        category: "blog",
        syncFrequency: "weekly",
      },
      {
        name: "PropTech Today",
        url: "https://www.proptech.today/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
    ],
    estimatedItemsPerDay: 16,
  },

  {
    id: "travel-hospitality",
    name: "Travel & Hospitality Bundle",
    description: "Travel industry trends, hospitality insights, and tourism news",
    icon: "✈️",
    industry: "Travel & Hospitality",
    feeds: [
      {
        name: "Travel Industry Wire",
        url: "https://www.travelindustrywire.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Hospitality Upgrade",
        url: "https://www.hospitalityupgrade.com/feed/",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Hotel Management",
        url: "https://www.hotelmanagement.net/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Skift",
        url: "https://skift.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Travel Weekly",
        url: "https://www.travelweekly.com/rss/feed.xml",
        category: "news",
        syncFrequency: "daily",
      },
    ],
    estimatedItemsPerDay: 24,
  },

  {
    id: "fashion-lifestyle",
    name: "Fashion & Lifestyle Bundle",
    description: "Fashion trends, luxury brands, and lifestyle insights",
    icon: "👗",
    industry: "Fashion & Lifestyle",
    feeds: [
      {
        name: "Business of Fashion",
        url: "https://www.businessoffashion.com/feed/",
        category: "industry",
        syncFrequency: "daily",
      },
      {
        name: "Fashion United",
        url: "https://www.fashionunited.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Vogue Business",
        url: "https://www.voguebusiness.com/feed/",
        category: "news",
        syncFrequency: "daily",
      },
      {
        name: "Luxury Society",
        url: "https://www.luxurysociety.com/feed/",
        category: "blog",
        syncFrequency: "daily",
      },
      {
        name: "FashionLab",
        url: "https://www.fashionlab.org/feed/",
        category: "blog",
        syncFrequency: "weekly",
      },
    ],
    estimatedItemsPerDay: 19,
  },
];

/**
 * Get a template by ID
 */
export function getTemplateById(templateId: string): FeedTemplate | undefined {
  return FEED_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get all templates (for selection UI)
 */
export function getAllTemplates(): FeedTemplate[] {
  return FEED_TEMPLATES;
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): FeedTemplate[] {
  return FEED_TEMPLATES.filter((t) => t.industry.toLowerCase().includes(industry.toLowerCase()));
}

/**
 * Get all industries (for industry filter)
 */
export function getAllIndustries(): string[] {
  const industries = new Set(FEED_TEMPLATES.map((t) => t.industry));
  return Array.from(industries).sort();
}
