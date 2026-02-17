"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { History, RotateCcw, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandVersionHistoryProps {
  brandProfileId: Id<"brandProfiles">;
}

export function BrandVersionHistory({ brandProfileId }: BrandVersionHistoryProps) {
  const versions = useQuery(api.brandProfile.getBrandProfileVersions, { brandProfileId });
  const rollback = useMutation(api.brandProfile.rollbackBrandProfile);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Sin historial de versiones aun</p>
        <p className="text-xs mt-1">Los cambios se guardaran automaticamente</p>
      </div>
    );
  }

  const handleRollback = async (version: number) => {
    if (!confirm(`Restaurar el perfil a la version ${version}? Se creara un snapshot del estado actual.`)) return;
    setRolling(true);
    try {
      await rollback({ brandProfileId, targetVersion: version });
    } finally {
      setRolling(false);
    }
  };

  const changeTypeLabels: Record<string, { label: string; color: string }> = {
    created: { label: "Creado", color: "text-[var(--success)]" },
    edited: { label: "Editado", color: "text-[var(--badge-blue-text)]" },
    rollback: { label: "Rollback", color: "text-[var(--badge-amber-text)]" },
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-[var(--text-tertiary)]" />
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
          Historial de Versiones
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">({versions.length})</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--surface-2)]" />

        {versions.map((version, i) => {
          const isExpanded = expandedVersion === version.version;
          const typeInfo = changeTypeLabels[version.changeType] || changeTypeLabels.edited;
          const snapshot = version.snapshot as Record<string, unknown>;

          return (
            <div key={version._id} className="relative pl-8 pb-3">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2",
                i === 0
                  ? "bg-[var(--accent-muted)] border-[var(--accent)]"
                  : "bg-[var(--card-bg)] border-[var(--border-hover)]"
              )} />

              <div className="bg-[var(--surface-0)] rounded-lg p-3 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedVersion(isExpanded ? null : version.version)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      v{version.version}
                    </span>
                    <span className={cn("text-[10px] font-medium", typeInfo.color)}>
                      {typeInfo.label}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true, locale: es })}
                    </span>
                    {i > 0 && (
                      <button
                        onClick={() => handleRollback(version.version)}
                        disabled={rolling}
                        className="text-[10px] text-[var(--badge-amber-text)] hover:text-amber-500 flex items-center gap-1 disabled:opacity-50"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Restaurar
                      </button>
                    )}
                  </div>
                </div>

                {version.changeSummary && (
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1 ml-5">
                    {version.changeSummary}
                  </p>
                )}

                {isExpanded && snapshot && (
                  <div className="mt-2 ml-5 text-[11px] space-y-1 border-t border-[var(--border)] pt-2">
                    <p><span className="text-[var(--text-tertiary)]">Empresa:</span> <span className="text-[var(--text-secondary)]">{snapshot.companyName as string}</span></p>
                    <p><span className="text-[var(--text-tertiary)]">Industria:</span> <span className="text-[var(--text-secondary)]">{snapshot.industry as string}</span></p>
                    {!!snapshot.website && (
                      <p><span className="text-[var(--text-tertiary)]">Website:</span> <span className="text-[var(--text-secondary)]">{snapshot.website as string}</span></p>
                    )}
                    {!!snapshot.visual && (
                      <p><span className="text-[var(--text-tertiary)]">Visual:</span> <span className="text-[var(--text-secondary)]">Configurado</span></p>
                    )}
                    {!!snapshot.messaging && (
                      <p><span className="text-[var(--text-tertiary)]">Messaging:</span> <span className="text-[var(--text-secondary)]">Configurado</span></p>
                    )}
                    {!!snapshot.positioning && (
                      <p><span className="text-[var(--text-tertiary)]">Positioning:</span> <span className="text-[var(--text-secondary)]">Configurado</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
