"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportToCsv } from "@/lib/csv-export";

interface CsvExportButtonProps {
  startDate: number;
  endDate: number;
}

export function CsvExportButton({ startDate, endDate }: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Pre-fetch data for CSV export
  const exportData = useQuery(api.analytics.getAnalyticsExportData, {
    startDate,
    endDate,
  });

  const handleExport = async () => {
    if (!exportData) return;

    setIsExporting(true);
    try {
      await exportToCsv(exportData);

      // Show success toast (if toast system exists)
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast({
          title: "Exito",
          description: "Datos exportados correctamente",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      // Show error toast (if toast system exists)
      if (typeof window !== "undefined" && (window as any).showToast) {
        (window as any).showToast({
          title: "Error",
          description: "No se pudo exportar los datos",
          variant: "error",
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = !exportData || isExporting;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isDisabled}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Exportar CSV
        </>
      )}
    </Button>
  );
}
