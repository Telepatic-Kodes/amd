"use client";

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
 */
export function EditorStatusBar({
  content,
  minChars = 50,
  className,
}: EditorStatusBarProps) {
  // Calculate metrics
  const charCount = countCharacters(content, false); // Exclude HTML tags
  const wordCount = countWords(content);
  const readingTime = calculateReadingTime(content, 200);
  const validation = validateContent(content, minChars);

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
          <span className="font-medium text-white">{charCount}</span> characters
        </span>
        <span className="text-zinc-700">•</span>
        <span>
          <span className="font-medium text-white">{wordCount}</span> words
        </span>
        <span className="text-zinc-700">•</span>
        <span>
          <span className="font-medium text-white">{readingTime}</span> min read
        </span>
      </div>

      {/* Validation Status */}
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Below minimum ({minChars} chars)</span>
          </div>
        )}
      </div>
    </div>
  );
}
