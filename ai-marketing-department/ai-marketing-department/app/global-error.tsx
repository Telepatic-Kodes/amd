"use client";

import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900 antialiased">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-sm text-center space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Error inesperado
            </h2>
            <p className="text-sm text-gray-500">
              Ocurrió un problema al cargar la aplicación. Intenta recargar la
              página.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
