"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "error" | "warning" | "default" | "info"> = {
  published: "success",
  failed: "error",
  pending: "warning",
  scheduled: "info",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Publicado",
  failed: "Fallido",
  pending: "Pendiente",
  scheduled: "Programado",
  deleted: "Eliminado",
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "Twitter/X",
  instagram: "Instagram",
  email: "Email",
};

export function PublishHistoryTable() {
  const history = useQuery(api.crossPlatform.queries.getUnifiedPublishHistory, { limit: 50 });
  const isLoading = history === undefined;

  if (isLoading) {
    return (
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-[var(--card-bg)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-[var(--border)] rounded-xl bg-[var(--card-bg)]">
        <p className="text-sm font-medium text-[var(--text-secondary)]">Sin publicaciones</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          El historial aparecera cuando se publique contenido
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-1)]">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Contenido</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Plataforma</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Estado</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Fecha</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">URL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {history.map((item: {
            contentTitle: string;
            platform: string;
            status: string;
            publishedAt?: number;
            createdAt: number;
            error?: string;
            platformUrl?: string;
          }, idx: number) => (
            <tr key={idx} className="hover:bg-[var(--surface-1)] transition-colors">
              <td className="px-4 py-3 text-[var(--text-primary)] font-medium truncate max-w-[200px]">
                {item.contentTitle}
              </td>
              <td className="px-4 py-3">
                <Badge variant="info">{PLATFORM_LABELS[item.platform] ?? item.platform}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_VARIANT[item.status] ?? "default"}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                {new Date(item.publishedAt ?? item.createdAt).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                {item.platformUrl ? (
                  <a
                    href={item.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-orange-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
