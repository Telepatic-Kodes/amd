"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { classifyError } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  /** Compact mode for inline display (inside cards/panels) */
  compact?: boolean;
}

export function ErrorFallback({ error, reset, compact = false }: ErrorFallbackProps) {
  const classified = classifyError(error);

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--error)]" />
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{classified.title}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{classified.description}</p>
        </div>
        {classified.retryable && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-orange-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {classified.action ?? "Reintentar"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {classified.title}
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">{classified.description}</p>
        <div className={cn("flex flex-col gap-2 pt-2", classified.retryable && "gap-3")}>
          {classified.retryable && (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-medium text-white hover:bg-[var(--accent-hover)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              {classified.action ?? "Reintentar"}
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
