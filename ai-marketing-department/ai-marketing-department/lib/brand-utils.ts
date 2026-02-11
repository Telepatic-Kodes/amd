/**
 * Shared brand data types and utilities.
 * Extracted from brand/page.tsx for reuse across unified onboarding and brand pages.
 */

export interface BrandData {
  companyName: string;
  industry: string;
  website: string;
  description: string;
  voice: {
    tone: string[];
    personality: string[];
    dos: string[];
    donts: string[];
  };
  audience: {
    segments: Array<{
      name: string;
      demographics: string;
      painPoints: string[];
    }>;
  };
  strategy: {
    topics: string[];
    channels: string[];
    postingFrequency: string;
  };
  competitors: Array<{
    name: string;
    url: string;
    notes: string;
  }>;
  references: string[];
  visual: {
    primaryColor: string;
    secondaryColor: string;
    logoDescription: string;
    styleNotes: string;
  };
}

export const DEFAULT_BRAND_DATA: BrandData = {
  companyName: "",
  industry: "",
  website: "",
  description: "",
  voice: { tone: [], personality: [], dos: [], donts: [] },
  audience: { segments: [] },
  strategy: { topics: [], channels: [], postingFrequency: "" },
  competitors: [],
  references: [],
  visual: { primaryColor: "", secondaryColor: "", logoDescription: "", styleNotes: "" },
};

// Known UI labels for fuzzy matching AI-extracted values
const TONE_LABELS = [
  "Profesional", "Cercano", "Autoridad", "Divertido", "Inspirador",
  "Educativo", "Provocador", "Empático", "Directo", "Sofisticado",
];
const PERSONALITY_LABELS = [
  "Innovador", "Confiable", "Audaz", "Accesible", "Experto",
  "Líder", "Colaborativo", "Disruptivo", "Emprendedor", "Humano",
];
const CHANNEL_LABELS = [
  "linkedin", "twitter", "instagram", "tiktok", "blog", "email", "youtube", "podcast",
];
const INDUSTRY_LABELS = [
  "SaaS / Software", "E-commerce", "Fintech", "Salud", "Educación",
  "Inmobiliario", "Agencia / Consultoría", "Medios / Editorial",
  "Viajes / Hospitalidad", "Alimentos y Bebidas", "Otro",
];

// English-to-Spanish alias maps (Claude may return English from English-language sites)
const ALIAS_MAP: Record<string, string> = {
  // Tone aliases
  professional: "Profesional", approachable: "Cercano", friendly: "Cercano",
  warm: "Cercano", authoritative: "Autoridad", authority: "Autoridad",
  fun: "Divertido", funny: "Divertido", playful: "Divertido",
  inspiring: "Inspirador", inspirational: "Inspirador",
  educational: "Educativo", informative: "Educativo",
  provocative: "Provocador", bold: "Provocador",
  empathetic: "Empático", empathic: "Empático", compassionate: "Empático",
  direct: "Directo", straightforward: "Directo",
  sophisticated: "Sofisticado", elegant: "Sofisticado", refined: "Sofisticado",
  // Personality aliases
  innovative: "Innovador",
  reliable: "Confiable", trustworthy: "Confiable", trusted: "Confiable",
  daring: "Audaz", audacious: "Audaz", courageous: "Audaz",
  accessible: "Accesible",
  expert: "Experto", knowledgeable: "Experto",
  leader: "Líder", leadership: "Líder",
  collaborative: "Colaborativo", teamwork: "Colaborativo",
  disruptive: "Disruptivo", disrupting: "Disruptivo",
  entrepreneurial: "Emprendedor", entrepreneur: "Emprendedor",
  human: "Humano", humane: "Humano", authentic: "Humano",
  // Industry aliases
  software: "SaaS / Software", saas: "SaaS / Software", tech: "SaaS / Software", technology: "SaaS / Software",
  ecommerce: "E-commerce", "e-commerce": "E-commerce", retail: "E-commerce",
  fintech: "Fintech", finance: "Fintech", financial: "Fintech",
  health: "Salud", healthcare: "Salud", medical: "Salud",
  education: "Educación", edtech: "Educación",
  "real estate": "Inmobiliario", realestate: "Inmobiliario", property: "Inmobiliario",
  agency: "Agencia / Consultoría", consulting: "Agencia / Consultoría", consultancy: "Agencia / Consultoría",
  media: "Medios / Editorial", editorial: "Medios / Editorial", publishing: "Medios / Editorial",
  travel: "Viajes / Hospitalidad", hospitality: "Viajes / Hospitalidad", tourism: "Viajes / Hospitalidad",
  "food": "Alimentos y Bebidas", "food and beverage": "Alimentos y Bebidas", restaurant: "Alimentos y Bebidas",
  other: "Otro",
  // Channel aliases
  "x": "twitter", "twitter/x": "twitter", "x.com": "twitter",
};

/** Normalize string for comparison: lowercase, remove accents */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/** Map extracted values to known UI labels via alias + fuzzy matching */
function matchToLabels(extracted: string[], labels: string[]): string[] {
  const matched: string[] = [];
  const normLabels = labels.map((l) => ({ label: l, norm: normalize(l) }));

  for (const raw of extracted) {
    const normRaw = normalize(raw);

    // 1. Check alias map first (handles English → Spanish)
    const aliased = ALIAS_MAP[normRaw];
    if (aliased && labels.includes(aliased) && !matched.includes(aliased)) {
      matched.push(aliased);
      continue;
    }

    // 2. Exact or substring match on normalized labels
    const found = normLabels.find(
      (nl) => nl.norm === normRaw || nl.norm.includes(normRaw) || normRaw.includes(nl.norm)
    );
    if (found && !matched.includes(found.label)) {
      matched.push(found.label);
    }
  }
  return matched;
}

/** Map extracted industry string to known UI label */
function matchIndustry(extracted: string): string {
  const normExtracted = normalize(extracted);

  // 1. Check alias map first
  const aliased = ALIAS_MAP[normExtracted];
  if (aliased && INDUSTRY_LABELS.includes(aliased)) {
    return aliased;
  }

  // 2. Fuzzy match against labels
  const found = INDUSTRY_LABELS.find((label) => {
    const normLabel = normalize(label);
    return normLabel === normExtracted || normLabel.includes(normExtracted) || normExtracted.includes(normLabel);
  });
  return found || extracted;
}

/**
 * Merge AI-extracted partial data into a BrandData shape.
 * Preserves existing values and only overwrites with non-empty extracted fields.
 * Performs fuzzy matching for tone, personality, channels, and industry.
 */
export function mergeBrandData(
  base: BrandData,
  partial: Record<string, unknown>
): BrandData {
  const result = { ...base };

  // Simple string fields
  const stringKeys = ["companyName", "website", "description"] as const;
  for (const key of stringKeys) {
    const val = partial[key];
    if (typeof val === "string" && val.trim()) {
      result[key] = val;
    }
  }

  // Industry — fuzzy match to UI labels
  if (typeof partial.industry === "string" && partial.industry.trim()) {
    result.industry = matchIndustry(partial.industry);
  }

  // Voice (nested object with string arrays + fuzzy matching for tone/personality)
  if (partial.voice && typeof partial.voice === "object") {
    const v = partial.voice as Record<string, unknown>;
    if (Array.isArray(v.tone) && v.tone.length > 0) {
      result.voice = { ...result.voice, tone: matchToLabels(v.tone as string[], TONE_LABELS) };
    }
    if (Array.isArray(v.personality) && v.personality.length > 0) {
      result.voice = { ...result.voice, personality: matchToLabels(v.personality as string[], PERSONALITY_LABELS) };
    }
    // dos/donts are free text — keep as-is
    if (Array.isArray(v.dos) && v.dos.length > 0) {
      result.voice = { ...result.voice, dos: v.dos as string[] };
    }
    if (Array.isArray(v.donts) && v.donts.length > 0) {
      result.voice = { ...result.voice, donts: v.donts as string[] };
    }
  }

  // Audience segments
  if (partial.audience && typeof partial.audience === "object") {
    const a = partial.audience as { segments?: unknown[] };
    if (Array.isArray(a.segments) && a.segments.length > 0) {
      result.audience = {
        segments: (a.segments as Record<string, unknown>[]).map((s) => ({
          name: String(s.name || ""),
          demographics: String(s.demographics || ""),
          painPoints: Array.isArray(s.painPoints) ? s.painPoints : [],
        })),
      };
    }
  }

  // Strategy (with fuzzy matching for channels)
  if (partial.strategy && typeof partial.strategy === "object") {
    const s = partial.strategy as Record<string, unknown>;
    if (Array.isArray(s.topics) && s.topics.length > 0)
      result.strategy.topics = s.topics as string[];
    if (Array.isArray(s.channels) && s.channels.length > 0)
      result.strategy.channels = matchToLabels(s.channels as string[], CHANNEL_LABELS);
    if (typeof s.postingFrequency === "string" && s.postingFrequency) {
      result.strategy = { ...result.strategy, postingFrequency: s.postingFrequency };
    }
  }

  // Competitors
  if (Array.isArray(partial.competitors) && partial.competitors.length > 0) {
    result.competitors = (partial.competitors as Record<string, unknown>[]).map(
      (c) => ({
        name: String(c.name || ""),
        url: String(c.url || ""),
        notes: String(c.notes || ""),
      })
    );
  }

  // References
  if (Array.isArray(partial.references) && partial.references.length > 0) {
    result.references = partial.references as string[];
  }

  // Visual
  if (partial.visual && typeof partial.visual === "object") {
    const vis = partial.visual as Record<string, unknown>;
    const visKeys = ["primaryColor", "secondaryColor", "logoDescription", "styleNotes"] as const;
    for (const k of visKeys) {
      if (typeof vis[k] === "string" && (vis[k] as string).trim()) {
        result.visual = { ...result.visual, [k]: vis[k] as string };
      }
    }
  }

  return result;
}

/**
 * Merge multiple extraction results, with later sources taking priority.
 */
export function mergeMultipleSources(
  ...sources: (Record<string, unknown> | null)[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  const validSources = sources.filter(Boolean) as Record<string, unknown>[];

  for (const source of validSources) {
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        merged[key] &&
        typeof merged[key] === "object"
      ) {
        merged[key] = { ...(merged[key] as Record<string, unknown>), ...value };
      } else {
        merged[key] = value;
      }
    }
  }

  return merged;
}
