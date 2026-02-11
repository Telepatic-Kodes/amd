"use client";

import { memo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countWords,
  countCharacters,
  calculateReadingTime,
  validateContent,
} from "@/lib/editor-utils";

/**
 * Props for EditorStatusBar component
 */
interface EditorStatusBarProps {
  /** HTML content to analyze */
  content: string;
  /** Minimum character count for validation (default: 50) */
  minChars?: number;
  /** Maximum character count for validation (default: 100000) */
  maxChars?: number;
  /** Additional CSS classes for the status bar */
  className?: string;
}

/**
 * EditorStatusBar - Display real-time metrics and validation status
 *
 * Features:
 * - Character count (visible text only, excluding HTML tags)
 * - Word count (formatted with thousands separators)
 * - Reading time estimate (words / 200 WPM)
 * - Validation status with visual indicators
 * - Warning when approaching character limit (90%+)
 * - Error when exceeding maximum characters
 * - Performance: Memoized to prevent unnecessary re-calculations
 *
 * Validation States:
 * - ✅ Ready: Content meets minimum, below 90% of maximum
 * - ⚠️ Warning: Approaching limit (90%+ of maximum)
 * - ❌ Error: Below minimum or exceeds maximum
 *
 * @example
 * ```tsx
 * <EditorStatusBar
 *   content={htmlContent}
 *   minChars={50}
 *   maxChars={100000}
 * />
 * ```
 */
const EditorStatusBarComponent = ({
  content,
  minChars = 50,
  maxChars = 100000,
  className,
}: EditorStatusBarProps) => {
  // Calculate metrics
  const charCount = countCharacters(content, false); // Exclude HTML tags
  const wordCount = countWords(content);
  const readingTime = calculateReadingTime(content, 200);
  const validation = validateContent(content, minChars, maxChars);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-white",
        className
      )}
    >
      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs text-stone-400">
        <span>
          <span className="font-medium text-stone-900">{charCount.toLocaleString()}</span> caracteres
        </span>
        <span className="text-stone-700">•</span>
        <span>
          <span className="font-medium text-stone-900">{wordCount.toLocaleString()}</span> palabras
        </span>
        <span className="text-stone-700">•</span>
        <span>
          <span className="font-medium text-stone-900">{readingTime}</span> min lectura
        </span>
      </div>

      {/* Validation Status */}
      <div className="flex items-center gap-2">
        {validation.isValid && !validation.warning ? (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Listo</span>
          </div>
        ) : validation.warning ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{validation.warning}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{validation.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoized export for performance optimization
export const EditorStatusBar = memo(EditorStatusBarComponent);
