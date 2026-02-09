"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="text-center space-y-4 py-8">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Error en el dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Ocurrió un problema al cargar esta sección. Puedes reintentar o
            volver al inicio.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Ir al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
