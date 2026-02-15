"use client";

import { AlertCircle } from "lucide-react";

export default function RootError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Algo salió mal
        </h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al
          inicio.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-medium text-white hover:bg-[var(--accent-hover)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          >
            Reintentar
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error boundary needs full page reload */}
          <a
            href="/"
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
