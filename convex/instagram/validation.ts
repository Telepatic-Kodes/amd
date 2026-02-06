/**
 * Instagram content validation utilities
 * Pure utility functions (no Convex dependencies)
 */

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings?: string[];
};

/**
 * Validate Instagram caption
 * - Max 2200 characters
 * - Max 30 hashtags
 *
 * @param caption - Caption text to validate
 * @returns Validation result with Spanish error messages
 */
export function validateCaption(caption: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check character limit
  if (caption.length > 2200) {
    errors.push(`El caption excede 2200 caracteres (actual: ${caption.length})`);
  }

  // Count hashtags
  const hashtagMatches = caption.match(/#\w+/g);
  const hashtagCount = hashtagMatches ? hashtagMatches.length : 0;
  if (hashtagCount > 30) {
    errors.push(`Maximo 30 hashtags permitidos (actual: ${hashtagCount})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Instagram image URL
 *
 * Instagram Requirements (documented in JSDoc):
 * - Aspect ratio: 4:5 to 1.91:1
 * - Min width: 320px
 * - Max width: 1440px
 * - Format: JPEG preferred
 * - Max size: 8MB
 *
 * Note: Server-side validation cannot check dimensions without fetching the image.
 * This function validates URL format and provides warnings for common issues.
 *
 * @param imageUrl - Image URL to validate
 * @returns Validation result with warnings
 */
export function validateInstagramImage(imageUrl: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check URL is valid HTTPS
  if (!imageUrl.startsWith("https://")) {
    errors.push("La URL de la imagen debe usar HTTPS");
  }

  // Warn if URL doesn't end with common image extension
  const hasImageExtension = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(imageUrl);
  if (!hasImageExtension) {
    warnings.push("La URL no parece ser una imagen (esperado: .jpg, .jpeg, .png)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate carousel images
 * - Min 2 images
 * - Max 10 images
 * - All URLs must be valid HTTPS
 *
 * @param imageUrls - Array of image URLs
 * @returns Validation result with Spanish error messages
 */
export function validateCarouselImages(imageUrls: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check count
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    errors.push("Se requieren entre 2 y 10 imagenes para un carrusel");
  }

  // Check all URLs are HTTPS
  const invalidUrls = imageUrls.filter(url => !url.startsWith("https://"));
  if (invalidUrls.length > 0) {
    errors.push(`${invalidUrls.length} imagen(es) no usan HTTPS`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
