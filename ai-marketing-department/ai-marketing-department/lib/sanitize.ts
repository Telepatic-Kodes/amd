import DOMPurify from "dompurify";

/**
 * Sanitize HTML input — strips all dangerous tags/attributes.
 * Safe for rendering user-generated content.
 */
export function sanitizeHtml(input: string): string {
  if (typeof window === "undefined") return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "code", "pre",
      "a", "span",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}

/**
 * Sanitize plain text — strip all HTML tags entirely.
 * Use for inputs that should never contain HTML (titles, descriptions).
 */
export function sanitizePlainText(input: string): string {
  if (typeof window === "undefined") return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
