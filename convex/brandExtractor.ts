"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { extractContentFromURL } from "./kb/scrapeUrl";

const BRAND_EXTRACTION_PROMPT = `You are a brand analyst. Extract brand information from the provided content.
Return a JSON object with ONLY the fields where you have reasonable confidence from the content.
Do NOT include fields where you're guessing or have no evidence.

The JSON must match this structure (all fields optional):
{
  "companyName": "string",
  "industry": "string",
  "website": "string",
  "description": "string (1-2 sentences about the company)",
  "voice": {
    "tone": ["string array of tone descriptors, e.g. profesional, cercano, innovador"],
    "personality": ["string array of personality traits"],
    "dos": ["string array of communication guidelines"],
    "donts": ["string array of things to avoid"]
  },
  "audience": {
    "segments": [
      {
        "name": "segment name",
        "demographics": "demographic description",
        "painPoints": ["pain point 1", "pain point 2"]
      }
    ]
  },
  "strategy": {
    "topics": ["content topics the brand focuses on"],
    "channels": ["marketing channels used"],
    "postingFrequency": "string"
  },
  "competitors": [
    { "name": "competitor name", "url": "url if found", "notes": "brief note" }
  ],
  "visual": {
    "primaryColor": "hex color if identifiable",
    "secondaryColor": "hex color if identifiable",
    "logoDescription": "brief logo description",
    "styleNotes": "visual style observations"
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
