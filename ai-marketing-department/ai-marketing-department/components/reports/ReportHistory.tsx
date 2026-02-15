"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { LABELS } from "@/lib/language";
import { Badge } from "@/components/ui/Badge";

interface ReportHistoryProps {
  onViewReport: (reportId: Id<"reports">) => void;
}

export function ReportHistory({ onViewReport }: ReportHistoryProps) {
  const reports = useQuery(api.reports.getReportHistory, { limit: 20 });

  if (!reports) {
    // Loading skeleton
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{LABELS.reportHistory}</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--surface-2)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{LABELS.reportHistory}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-[var(--text-secondary)]" />
          </div>
          <p className="text-[var(--text-tertiary)] text-sm">{LABELS.noReports}</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1">
            Configura reportes en Ajustes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{LABELS.reportHistory}</h3>
      <div className="space-y-2">
        {reports.map((report) => {
          const typeLabel = report.type === "weekly" ? LABELS.weeklyReport : LABELS.monthlyReport;
          const periodStart = new Date(report.periodStart).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const periodEnd = new Date(report.periodEnd).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={report._id}
              onClick={() => onViewReport(report._id)}
              className="flex items-center gap-3 p-3 hover:bg-[var(--surface-2)]/50 rounded-lg cursor-pointer transition-colors group"
            >
              {/* Type Badge */}
              <Badge
                variant={report.type === "weekly" ? "info" : "default"}
                className={
                  report.type === "weekly"
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }
              >
                {typeLabel}
              </Badge>

              {/* Title and Period */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{report.title}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {periodStart} - {periodEnd}
                </p>
              </div>

              {/* Email Status */}
              <div className="flex items-center gap-2">
                {report.emailSent ? (
                  <div className="flex items-center gap-1 text-xs text-[var(--success)]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{LABELS.emailSent}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{LABELS.emailNotSent}</span>
                  </div>
                )}

                {/* View Button */}
                <button className="text-[var(--accent)] hover:text-orange-300 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {LABELS.viewReport}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
