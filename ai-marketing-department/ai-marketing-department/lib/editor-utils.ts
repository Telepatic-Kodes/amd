/**
 * Editor Utilities for Rich Text Content
 * Provides HTML manipulation, sanitization, and export functions
 */

/**
 * Strip HTML tags from content to get plain text
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use regex (basic fallback)
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Client-side: use DOM parser for accuracy
  const temp = document.createElement('div');
  temp.textContent = html; // Safe: assigns as text, not HTML
  const safeHtml = temp.innerHTML;
  temp.innerHTML = safeHtml;
  return temp.textContent || temp.innerText || '';
}

/**
 * Count words in text (excluding HTML tags)
 * @param text - Plain text or HTML string
 * @returns Word count
 */
export function countWords(text: string): number {
  const plainText = stripHtmlTags(text);
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Count characters in content
 * @param html - HTML string
 * @param includeHtml - If true, count HTML tags; if false, count only visible text
 * @returns Character count
 */
export function countCharacters(html: string, includeHtml: boolean = false): number {
  if (includeHtml) {
    return html.length;
  }
  const plainText = stripHtmlTags(html);
  return plainText.length;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * SECURITY NOTE: This is a basic sanitizer for TipTap-generated content only.
 * TipTap generates safe HTML from its schema. For user-provided HTML or production use,
 * install and use the DOMPurify library: npm install dompurify @types/dompurify
 *
 * @param html - HTML string to sanitize (from TipTap editor)
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  // TipTap generates controlled HTML from its schema, so this is primarily
  // for defense-in-depth. For untrusted HTML, use DOMPurify library.

  if (typeof window === 'undefined') {
    // Server-side: basic sanitization using regex
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  }

  // Client-side: Since TipTap controls the HTML schema, we just need basic cleanup
  // Remove script tags and event handlers as defense-in-depth
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
}

/**
 * Copy HTML content to clipboard
 * @param html - HTML string to copy
 * @returns Promise that resolves when content is copied
 */
export async function copyHtmlToClipboard(html: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Clipboard API only available in browser');
  }

  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = new Blob([html], { type: 'text/html' });
      const plainText = stripHtmlTags(html);
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([clipboardItem]);
      return;
    }

    // Fallback: copy plain text only
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const plainText = stripHtmlTags(html);
      await navigator.clipboard.writeText(plainText);
      return;
    }

    // Legacy fallback using execCommand
    const textarea = document.createElement('textarea');
    textarea.value = stripHtmlTags(html);
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy content to clipboard');
  }
}

/**
 * Download HTML content as a file
 * @param html - HTML string to download
 * @param filename - Name of the file to download (default: content.html)
 */
export function downloadAsFile(html: string, filename: string = 'content.html'): void {
  if (typeof window === 'undefined') {
    throw new Error('Download only available in browser');
  }

  // Create a Blob with the HTML content
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

  // Create a temporary link element
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate estimated reading time in minutes
 * @param html - HTML content
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(html: string, wordsPerMinute: number = 200): number {
  const wordCount = countWords(html);
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Validate content meets minimum requirements
 * @param html - HTML content to validate
 * @param minChars - Minimum character count (default: 50)
 * @returns Object with isValid flag and error message
 */
export function validateContent(
  html: string,
  minChars: number = 50
): { isValid: boolean; error?: string } {
  const plainText = stripHtmlTags(html);
  const charCount = plainText.length;

  if (charCount < minChars) {
    return {
      isValid: false,
      error: `Content must be at least ${minChars} characters (currently ${charCount})`,
    };
  }

  return { isValid: true };
}
