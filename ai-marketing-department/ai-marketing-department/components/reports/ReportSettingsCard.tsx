"use client";

import { Settings } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { ReportSettings } from "./ReportSettings";

export function ReportSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 font-semibold text-lg text-[var(--text-primary)]">
          <Settings className="h-5 w-5 text-[var(--accent)]" />
          Configuración de Reportes
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configura frecuencia, email y análisis IA para tus reportes automáticos.
        </p>
      </CardHeader>
      <CardContent>
        <ReportSettings />
      </CardContent>
    </Card>
  );
}
