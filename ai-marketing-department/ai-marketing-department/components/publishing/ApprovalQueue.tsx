"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ApprovalQueue() {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-xl bg-[var(--surface-1)] mb-4">
          <ClipboardCheck className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Cola de Aprobaciones
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
          Las aprobaciones se gestionan por contenido individual desde la pagina de Contenido.
          Selecciona un contenido para ver y gestionar sus aprobaciones por plataforma.
        </p>
        <Link
          href="/content"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Ir a Contenido
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
