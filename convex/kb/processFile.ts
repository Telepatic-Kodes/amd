"use node";

import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

/**
 * Semantic text chunking: splits text into ~2000 char chunks
 * while respecting sentence boundaries
 */
export function chunkTextSemantic(
  text: string,
  maxChunkSize: number = 2000
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    // If paragraph fits in current chunk, add it
    if ((currentChunk + paragraph).length <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      // Paragraph doesn't fit - save current chunk and start new one
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Generate SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate UUID
 */
export function generateSectionId(): string {
  return uuidv4();
}

/**
 * Parse PDF using pdf-parse
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = require("pdf-parse");
  const pdfData = await pdfParse(buffer);
  return pdfData.text;
}

/**
 * Parse DOCX using mammoth
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Parse PPTX using jszip
 */
export async function parsePPTX(buffer: Buffer): Promise<string> {
  const JSZip = require("jszip");
  const zip = new JSZip();
  await zip.loadAsync(buffer);

  const textParts: string[] = [];

  // Extract text from slide XMLs
  const slidesDir = zip.folder("ppt/slides");
  if (slidesDir) {
    const files = Object.keys(slidesDir.files).filter(
      (f) => f.endsWith(".xml") && f.includes("slide")
    );

    for (const file of files) {
      const content = await zip.file(file).async("string");
      // Extract text between <a:t> tags
      const matches = content.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches) {
        matches.forEach((match: string) => {
          const t = match.replace(/<a:t>|<\/a:t>/g, "");
          textParts.push(t);
        });
      }
    }
  }

  return textParts.join("\n");
}

/**
 * Parse text file
 */
export function parseText(buffer: Buffer): string {
  return buffer.toString("utf-8");
}
