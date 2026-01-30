"use client";

import { memo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  stripHtmlTags,
  countWords,
  countCharacters,
  calculateReadingTime,
  validateContent,
} from "@/lib/editor-utils";

interface EditorStatusBarProps {
  content: string;
  minChars?: number;
  maxChars?: number;
  className?: string;
}

/**
 * EditorStatusBar - Display real-time metrics and validation status
 *
 * Shows:
 * - Character count (visible text only, excluding HTML tags)
 * - Word count
 * - Reading time estimate (words / 200)
 * - Validation status ("Ready" or "Below minimum")
 *
 * Displays warning if content is below minimum character count.
 * Memoized for performance optimization with large documents.
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
        "flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-950/50",
        className
      )}
    >
      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span>
          <span className="font-medium text-white">{charCount.toLocaleString()}</span> characters
        </span>
        <span className="text-zinc-700">•</span>
        <span>
          <span className="font-medium text-white">{wordCount.toLocaleString()}</span> words
        </span>
        <span className="text-zinc-700">•</span>
        <span>
          <span className="font-medium text-white">{readingTime}</span> min read
        </span>
      </div>

      {/* Validation Status */}
      <div className="flex items-center gap-2">
        {validation.isValid && !validation.warning ? (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready</span>
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
