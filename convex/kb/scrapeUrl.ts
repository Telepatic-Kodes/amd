"use node";

import * as cheerio from "cheerio";

/**
 * Semantic text chunking
 */
export function chunkTextSemantic(
  text: string,
  maxChunkSize: number = 2000
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if ((currentChunk + paragraph).length <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Scrape URL and extract main content
 */
export async function extractContentFromURL(url: string): Promise<{
  title: string;
  content: string;
}> {
  // Fetch HTML
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  const html = await response.text();

  // Parse with cheerio
  const $ = cheerio.load(html);

  // Remove scripts, styles, navigation, footer
  $("script, style, nav, footer, iframe, noscript").remove();

  // Extract title
  const title = $("h1").first().text() || $("title").text() || url;

  // Extract main content - try multiple selectors
  let content = "";

  // Try common content containers
  const contentSelectors = [
    "article",
    "main",
    "[role='main']",
    ".content",
    ".post-content",
    ".entry-content",
    "#content",
  ];

  for (const selector of contentSelectors) {
    const found = $(selector).first().text();
    if (found && found.length > 100) {
      content = found;
      break;
    }
  }

  // Fallback to body if nothing found
  if (!content || content.length < 100) {
    content = $("body").text();
  }

  // Clean up whitespace
  content = content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n");

  if (!content || content.length < 50) {
    throw new Error(`No meaningful content extracted from ${url}`);
  }

  return { title, content };
}
