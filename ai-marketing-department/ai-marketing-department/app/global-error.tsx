"use client";

import { AlertCircle } from "lucide-react";

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-[var(--card-bg)] text-[var(--text-primary)] antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm text-center space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-[var(--error)]" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Error inesperado
            </h2>
            <p className="text-sm text-[var(--text-tertiary)]">
              Ocurrió un problema al cargar la aplicación. Intenta recargar la
              página.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-base font-medium text-white hover:bg-[var(--accent-hover)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
