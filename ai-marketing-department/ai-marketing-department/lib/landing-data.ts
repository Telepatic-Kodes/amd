// ============================================================================
// LANDING PAGE DATA
// Datos centralizados para el landing page de AMD
// ============================================================================

// ----------------------------------------------------------------------------
// CASOS DE ÉXITO
// ----------------------------------------------------------------------------

export interface CaseStudy {
  name: string;
  industry: string;
  size: string;
  challenge: string;
  solution: string;
  timeline: string;
  results: {
    [key: string]: string;
  };
  quote: string;
  author: string;
}

export const caseStudies: CaseStudy[] = [
  {
    name: "TechFlow",
    industry: "SaaS / Fintech",
    size: "50-100 empleados",
    challenge: "Contenido SEO inconsistente, tráfico estancado",
    solution: "12 agentes (Content + SEO)",
    timeline: "6 meses",
    results: {
      trafficGrowth: "+150%",
      articlesPerMonth: "45",
      articlesPerMonthBefore: "8",
      costSaving: "$120k/año",
      keywordRankings: "23 keywords en top 10",
    },
    quote: "AMD nos permitió escalar contenido sin contratar. El SEO mejoró dramáticamente.",
    author: "Juan Pérez, CMO at TechFlow",
  },
  {
    name: "StyleHub",
    industry: "E-commerce / Fashion",
    size: "20-50 empleados",
    challenge: "ROAS bajo, ads inconsistentes",
    solution: "10 agentes (Demand Gen + Social)",
    timeline: "4 meses",
    results: {
      roasBefore: "1.8x",
      roasAfter: "4.2x",
      cpaReduction: "60%",
      cpaBefore: "$45",
      cpaAfter: "$18",
      socialContent: "300 posts/mes",
      socialContentIncrease: "5x más",
      revenue: "$2.4M",
    },
    quote: "El ROI es absurdo. Contenido mejor, más barato, más consistente.",
    author: "María González, Growth Lead at StyleHub",
  },
  {
    name: "GrowthPartners",
    industry: "Agency / Consulting",
    size: "10-20 empleados",
    challenge: "No podían escalar sin contratar",
    solution: "37 agentes (departamento completo)",
    timeline: "3 meses",
    results: {
      additionalClients: "10 clientes adicionales",
      costSaving: "$180k/año",
      marginIncrease: "+35%",
      deliveryTimeReduction: "-70%",
    },
    quote: "AMD nos dio superpoderes. Ahora ofrecemos servicios premium sin aumentar headcount.",
    author: "Carlos Ramírez, Founder at GrowthPartners",
  },
];

// ----------------------------------------------------------------------------
// PRICING TIERS
// ----------------------------------------------------------------------------

export interface PricingTier {
  name: string;
  price: string;
  priceMonthly?: number;
  popular?: boolean;
  features: string[];
  limits: {
    agents: string;
    tasks: string;
    content: string;
    support: string;
  };
  cta: string;
  idealFor: string;
}

export const pricingTiers: PricingTier[] = [
  {
    name: "Básico",
    price: "$1,000",
    priceMonthly: 1000,
    features: [
      "15 agentes activos",
      "100 tareas/mes",
      "50 contenidos/mes",
      "Soporte por email",
      "Integraciones básicas",
    ],
    limits: {
      agents: "15 agentes",
      tasks: "100 tareas/mes",
      content: "50 contenidos/mes",
      support: "Email support",
    },
    cta: "Empezar Gratis",
    idealFor: "Startups, small businesses",
  },
  {
    name: "Professional",
    price: "$2,500",
    priceMonthly: 2500,
    popular: true,
    features: [
      "37 agentes activos (todos)",
      "Tareas ilimitadas",
      "Contenidos ilimitados",
      "Soporte prioritario",
      "Integraciones avanzadas",
      "Analytics avanzados",
    ],
    limits: {
      agents: "37 agentes",
      tasks: "Ilimitadas",
      content: "Ilimitado",
      support: "Soporte prioritario",
    },
    cta: "Agendar Demo",
    idealFor: "Scale-ups, SMBs",
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Agentes personalizados",
      "Volumen enterprise",
      "Dedicated support",
      "SLAs personalizados",
      "Onboarding white-glove",
      "Integraciones a medida",
    ],
    limits: {
      agents: "Personalizado",
      tasks: "Ilimitadas",
      content: "Ilimitado",
      support: "Dedicated account manager",
    },
    cta: "Contactar Ventas",
    idealFor: "Corporaciones, agencias",
  },
];

// ----------------------------------------------------------------------------
// FAQ
// ----------------------------------------------------------------------------

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "¿Necesito conocimientos técnicos?",
    answer:
      "No, el setup toma 5 minutos sin escribir código. La interfaz es intuitiva y diseñada para marketers, no para desarrolladores.",
  },
  {
    id: "faq-2",
    question: "¿Qué pasa si no me gusta el contenido?",
    answer:
      "Siempre revisas y apruebas antes de publicar. Tienes control total sobre qué se publica, cuándo y dónde. Los agentes generan borradores, tú decides qué sale a producción.",
  },
  {
    id: "faq-3",
    question: "¿Puedo integrar con mis herramientas?",
    answer:
      "Sí, tenemos integraciones nativas con los CMS, CRM y plataformas de analytics más populares: WordPress, HubSpot, Salesforce, Google Analytics, Meta Ads, Google Ads, LinkedIn, y más.",
  },
  {
    id: "faq-4",
    question: "¿Qué tan rápido veo resultados?",
    answer:
      "Los primeros contenidos se generan en 24 horas. Resultados medibles en SEO y engagement empiezan a verse en 4-6 semanas. ROAS de paid media mejora en 2-4 semanas.",
  },
  {
    id: "faq-5",
    question: "¿Cómo se compara con ChatGPT?",
    answer:
      "ChatGPT es un generador de texto genérico. AMD son 37 agentes especializados coordinándose entre sí: SEO, contenido, social media, ads, cada uno experto en su área. No es solo generación de texto, es ejecución completa de marketing.",
  },
  {
    id: "faq-6",
    question: "¿Hay límite de contenido?",
    answer:
      "Depende del plan: 50 contenidos/mes en Básico, ilimitado en Professional y Enterprise. Un 'contenido' puede ser un blog post, tweet, email, ad copy, etc.",
  },
];

// ----------------------------------------------------------------------------
// TESTIMONIOS
// ----------------------------------------------------------------------------

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    quote:
      "AMD nos permitió escalar nuestro marketing 10x sin contratar. Pasamos de 5 posts al mes a 50.",
    author: "Juan Pérez",
    role: "CMO",
    company: "TechFlow",
  },
  {
    id: "testimonial-2",
    quote:
      "El ROI es absurdo. Pagamos $2.5k/mes y ahorramos $15k en agencia. Contenido mejor y más consistente.",
    author: "María González",
    role: "Growth Lead",
    company: "StyleHub",
  },
  {
    id: "testimonial-3",
    quote:
      "Como agencia, AMD nos dio superpoderes. Ahora ofrecemos servicios premium sin aumentar headcount.",
    author: "Carlos Ramírez",
    role: "Founder",
    company: "GrowthPartners",
  },
];

// ----------------------------------------------------------------------------
// TABLA COMPARATIVA
// ----------------------------------------------------------------------------

export interface ComparisonFeature {
  feature: string;
  traditional: string;
  agency: string;
  freelancers: string;
  amd: string;
  amdHighlight?: boolean;
}

export const comparisonFeatures: ComparisonFeature[] = [
  {
    feature: "Costo mensual",
    traditional: "$16k-40k",
    agency: "$5k-15k",
    freelancers: "$3k-8k",
    amd: "$1k-2.5k",
    amdHighlight: true,
  },
  {
    feature: "Setup time",
    traditional: "3-6 meses",
    agency: "2-4 semanas",
    freelancers: "1-2 semanas",
    amd: "5 minutos",
    amdHighlight: true,
  },
  {
    feature: "Disponibilidad",
    traditional: "9-5 Mon-Fri",
    agency: "9-5 Mon-Fri",
    freelancers: "Variable",
    amd: "24/7",
    amdHighlight: true,
  },
  {
    feature: "Escalabilidad",
    traditional: "Contratar más",
    agency: "Limitada",
    freelancers: "Difícil",
    amd: "Infinita",
    amdHighlight: true,
  },
  {
    feature: "Consistencia",
    traditional: "Media",
    agency: "Media",
    freelancers: "Baja",
    amd: "Alta",
    amdHighlight: true,
  },
  {
    feature: "Especialistas",
    traditional: "5-7",
    agency: "2-3",
    freelancers: "1-2",
    amd: "37",
    amdHighlight: true,
  },
];

// ----------------------------------------------------------------------------
// DEPARTAMENTOS (para Solution section)
// ----------------------------------------------------------------------------

export interface Department {
  name: string;
  agentCount: number;
  description: string;
  capabilities: string[];
  color: string;
}

export const departments: Department[] = [
  {
    name: "Content",
    agentCount: 6,
    description: "Blogs, whitepapers, case studies",
    capabilities: [
      "Long-form articles",
      "SEO optimization",
      "Technical writing",
      "Case studies",
      "Publishing workflow",
    ],
    color: "text-blue-500",
  },
  {
    name: "Social Media",
    agentCount: 8,
    description: "LinkedIn, Twitter, YouTube, TikTok",
    capabilities: [
      "LinkedIn thought leadership",
      "Twitter/X threads",
      "YouTube scripts",
      "Short-form video",
      "Podcast production",
      "Engagement analysis",
      "Content scheduling",
    ],
    color: "text-purple-500",
  },
  {
    name: "Demand Gen",
    agentCount: 7,
    description: "Google Ads, Meta Ads, LinkedIn Ads",
    capabilities: [
      "Campaign management",
      "Meta Ads optimization",
      "Google Ads strategy",
      "LinkedIn B2B targeting",
      "Performance analysis",
      "Budget pacing",
    ],
    color: "text-green-500",
  },
  {
    name: "SEO",
    agentCount: 5,
    description: "Keywords, backlinks, technical SEO",
    capabilities: [
      "Keyword research",
      "Content strategy",
      "Backlink analysis",
      "Technical audits",
      "Rank tracking",
    ],
    color: "text-yellow-500",
  },
  {
    name: "Brand & Creative",
    agentCount: 4,
    description: "Diseño, assets, landing pages",
    capabilities: [
      "Ad creative design",
      "Landing page builder",
      "Asset management",
      "Brand consistency",
    ],
    color: "text-pink-500",
  },
  {
    name: "Marketing Ops",
    agentCount: 5,
    description: "Email, automation, analytics",
    capabilities: [
      "Email infrastructure",
      "Newsletter writing",
      "Nurture campaigns",
      "List hygiene",
      "Marketing automation",
    ],
    color: "text-cyan-500",
  },
];
