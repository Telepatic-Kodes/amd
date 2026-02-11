"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { extractContentFromURL } from "./kb/scrapeUrl";

const BRAND_EXTRACTION_PROMPT = `You are a brand analyst. Extract brand information from the provided content.
Return a JSON object with ONLY the fields where you have reasonable confidence from the content.
Do NOT include fields where you're guessing or have no evidence.

IMPORTANT: For tone, personality, channels, and industry fields, you MUST use values from the predefined lists below.

Valid "industry" values: "SaaS / Software", "E-commerce", "Fintech", "Salud", "Educación", "Inmobiliario", "Agencia / Consultoría", "Medios / Editorial", "Viajes / Hospitalidad", "Alimentos y Bebidas", "Otro"

Valid "tone" values: "Profesional", "Cercano", "Autoridad", "Divertido", "Inspirador", "Educativo", "Provocador", "Empático", "Directo", "Sofisticado"

Valid "personality" values: "Innovador", "Confiable", "Audaz", "Accesible", "Experto", "Líder", "Colaborativo", "Disruptivo", "Emprendedor", "Humano"

Valid "channels" values: "linkedin", "twitter", "instagram", "tiktok", "blog", "email", "youtube", "podcast"

The JSON must match this structure (all fields optional):
{
  "companyName": "string",
  "industry": "one of the valid industry values above",
  "website": "string",
  "description": "string (1-2 sentences about the company)",
  "voice": {
    "tone": ["select from valid tone values above"],
    "personality": ["select from valid personality values above"],
    "dos": ["string array of communication guidelines in Spanish"],
    "donts": ["string array of things to avoid in Spanish"]
  },
  "audience": {
    "segments": [
      {
        "name": "segment name in Spanish",
        "demographics": "demographic description in Spanish",
        "painPoints": ["pain point in Spanish"]
      }
    ]
  },
  "strategy": {
    "topics": ["content topics the brand focuses on, in Spanish"],
    "channels": ["select from valid channel values above"],
    "postingFrequency": "string"
  },
  "competitors": [
    { "name": "competitor name", "url": "url if found", "notes": "brief note in Spanish" }
  ],
  "visual": {
    "primaryColor": "hex color if identifiable",
    "secondaryColor": "hex color if identifiable",
    "logoDescription": "brief logo description in Spanish",
    "styleNotes": "visual style observations in Spanish"
  }
}

Respond ONLY with valid JSON, no markdown fences, no explanation.`;

async function callClaudeForExtraction(
  text: string,
  source: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.3,
      system: BRAND_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract brand information from this ${source}:\n\n${text.substring(0, 12000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const raw = data.content[0].text;

  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from the response if it has extra text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Could not parse brand data from AI response");
  }
}

export const extractBrandFromUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (_ctx, args) => {
    // Scrape the URL using existing infrastructure
    const { title, content } = await extractContentFromURL(args.url);

    const sourceText = `Website: ${args.url}\nTitle: ${title}\n\nContent:\n${content}`;

    const extracted = await callClaudeForExtraction(sourceText, "website content");

    // Ensure website field is populated
    if (!extracted.website) {
      extracted.website = args.url;
    }

    return extracted;
  },
});

export const extractBrandFromText = action({
  args: {
    text: v.string(),
    fileName: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    if (!args.text || args.text.trim().length < 50) {
      throw new Error("Not enough text content to extract brand information");
    }

    const source = args.fileName
      ? `document "${args.fileName}"`
      : "document text";

    return await callClaudeForExtraction(args.text, source);
  },
});

export const extractBrandFromInstagram = action({
  args: {
    handle: v.string(),
  },
  handler: async (_ctx, args) => {
    // Normalize: accept @handle or full URL
    let username = args.handle.trim();
    if (username.startsWith("@")) {
      username = username.slice(1);
    }
    // Extract username from URL if full URL provided
    const urlMatch = username.match(
      /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/
    );
    if (urlMatch) {
      username = urlMatch[1];
    }

    if (!username || username.length < 2) {
      throw new Error("Instagram handle inválido");
    }

    // Scrape the public Instagram profile page
    const profileUrl = `https://www.instagram.com/${username}/`;
    let profileContent: string;
    try {
      const { title, content } = await extractContentFromURL(profileUrl);
      profileContent = `Instagram Profile: @${username}\nPage Title: ${title}\n\nContent:\n${content}`;
    } catch {
      // If scraping fails, use just the username for AI inference
      profileContent = `Instagram Profile: @${username}\nURL: ${profileUrl}\n\nNote: Could not scrape the profile directly. Extract what brand information you can infer from the username and public Instagram presence of @${username}.`;
    }

    const extracted = await callClaudeForExtraction(
      profileContent,
      `Instagram profile @${username}`
    );

    // Ensure strategy includes instagram as a channel
    if (extracted.strategy && typeof extracted.strategy === "object") {
      const strategy = extracted.strategy as Record<string, unknown>;
      if (Array.isArray(strategy.channels)) {
        if (!strategy.channels.includes("instagram")) {
          strategy.channels.push("instagram");
        }
      } else {
        strategy.channels = ["instagram"];
      }
    }

    return extracted;
  },
});
