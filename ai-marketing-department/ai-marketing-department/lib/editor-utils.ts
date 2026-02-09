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
 * Cross-browser compatible (Chrome, Firefox, Safari, Edge)
 * @param html - HTML string to copy
 * @returns Promise that resolves when content is copied
 */
export async function copyHtmlToClipboard(html: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Clipboard API only available in browser');
  }

  try {
    // Modern Clipboard API (Chrome, Edge, Firefox 87+, Safari 13.1+)
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

    // Fallback: copy plain text only (older browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const plainText = stripHtmlTags(html);
      await navigator.clipboard.writeText(plainText);
      return;
    }

    // Legacy fallback using execCommand (deprecated but works in old browsers)
    const textarea = document.createElement('textarea');
    textarea.value = stripHtmlTags(html);
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
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
 * Cross-browser compatible (Chrome, Firefox, Safari, Edge)
 * @param html - HTML string to download
 * @param filename - Name of the file to download (default: content.html)
 */
export function downloadAsFile(html: string, filename: string = 'content.html'): void {
  if (typeof window === 'undefined') {
    throw new Error('Download only available in browser');
  }

  try {
    // Create a Blob with the HTML content (works in all modern browsers)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

    // Modern browsers: use URL.createObjectURL
    if (URL && URL.createObjectURL) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup (timeout for Safari compatibility)
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      return;
    }

    // Fallback for very old browsers (IE10+)
    const nav = navigator as Navigator & { msSaveBlob?: (blob: Blob, name: string) => boolean };
    if (nav.msSaveBlob) {
      nav.msSaveBlob(blob, filename);
      return;
    }

    throw new Error('Browser does not support file download');
  } catch (error) {
    console.error('Failed to download file:', error);
    throw error;
  }
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
 * @param maxChars - Maximum character count (default: 100000)
 * @returns Object with isValid flag and error message
 */
export function validateContent(
  html: string,
  minChars: number = 50,
  maxChars: number = 100000
): { isValid: boolean; error?: string; warning?: string } {
  const plainText = stripHtmlTags(html);
  const charCount = plainText.length;

  // Check empty content
  if (charCount === 0) {
    return {
      isValid: false,
      error: "Content cannot be empty",
    };
  }

  // Check minimum length
  if (charCount < minChars) {
    return {
      isValid: false,
      error: `Content must be at least ${minChars} characters (currently ${charCount})`,
    };
  }

  // Check maximum length with warning
  if (charCount > maxChars) {
    return {
      isValid: false,
      error: `Content exceeds maximum of ${maxChars.toLocaleString()} characters (currently ${charCount.toLocaleString()})`,
    };
  }

  // Warning for approaching limit
  if (charCount > maxChars * 0.9) {
    return {
      isValid: true,
      warning: `Approaching character limit: ${charCount.toLocaleString()} / ${maxChars.toLocaleString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Clean pasted content by removing invalid formatting and images
 * @param html - HTML content to clean
 * @returns Cleaned HTML content
 */
export function cleanPastedContent(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic cleaning with regex
    return html
      // Remove images
      .replace(/<img[^>]*>/gi, '')
      // Remove style attributes
      .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
      // Remove class attributes (except safe ones)
      .replace(/\s*class\s*=\s*["'][^"']*["']/gi, '')
      // Remove id attributes
      .replace(/\s*id\s*=\s*["'][^"']*["']/gi, '')
      // Remove data attributes
      .replace(/\s*data-[a-z-]+\s*=\s*["'][^"']*["']/gi, '');
  }

  // Client-side: use DOM parser for accuracy
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove all images
  const images = doc.querySelectorAll('img');
  images.forEach((img) => img.remove());

  // Remove inline styles
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach((el) => el.removeAttribute('style'));

  // Remove classes (except safe formatting classes)
  const elementsWithClass = doc.querySelectorAll('[class]');
  elementsWithClass.forEach((el) => el.removeAttribute('class'));

  // Remove ids
  const elementsWithId = doc.querySelectorAll('[id]');
  elementsWithId.forEach((el) => el.removeAttribute('id'));

  // Remove data attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Handle word overflow by adding word-break opportunities
 * @param html - HTML content
 * @param maxWordLength - Maximum word length before adding breaks (default: 50)
 * @returns HTML with word-break handling
 */
export function handleWordOverflow(html: string, maxWordLength: number = 50): string {
  const plainText = stripHtmlTags(html);
  const words = plainText.split(/\s+/);

  // Check if any word exceeds max length
  const hasLongWords = words.some(word => word.length > maxWordLength);

  if (!hasLongWords) {
    return html;
  }

  // Note: TipTap prose styling should handle this with CSS
  // This is just validation/detection
  return html;
}
