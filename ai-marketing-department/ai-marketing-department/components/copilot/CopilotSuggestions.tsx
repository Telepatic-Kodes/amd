"use client";

import { Sparkles } from "lucide-react";

interface Suggestion {
  label: string;
  message: string;
}

interface CopilotSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function CopilotSuggestions({ suggestions, onSelect, disabled }: CopilotSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-2 flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        Sugerencias
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.message)}
            disabled={disabled}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium
              bg-[var(--surface-1)] text-[var(--text-secondary)] border border-[var(--border)]
              hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
