"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { X, Archive, CheckCircle2, Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface KBDetailPanelProps {
  kbId: Id<"knowledgeBases">;
  onClose: () => void;
}

export function KBDetailPanel({ kbId, onClose }: KBDetailPanelProps) {
  const sections = useQuery(api.kb.queries.getSectionsByKB, { kbId });
  const stats = useQuery(api.kb.agentQueries.getKBAccessStats, { kbId });
  const activate = useMutation(api.kb.mutations.activateKB);
  const archive = useMutation(api.kb.mutations.archiveKB);
  const toast = useToast();

  const isLoading = sections === undefined;

  const handleActivate = async () => {
    try {
      await activate({ kbId });
      toast.success("Base de conocimiento activada");
    } catch {
      toast.error("Error al activar");
    }
  };

  const handleArchive = async () => {
    try {
      await archive({ kbId });
      toast.success("Base de conocimiento archivada");
    } catch {
      toast.error("Error al archivar");
    }
  };

  return (
    <div className="sticky top-6 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Detalle</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleActivate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--badge-green-bg)] text-green-700 hover:bg-[var(--badge-green-bg)] transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Activar
            </button>
            <button
              onClick={handleArchive}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archivar
            </button>
          </div>

          {/* Access Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-[var(--surface-1)]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Accesos</span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats.totalAccesses}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--surface-1)]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Agentes</span>
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats.uniqueAgents}</p>
              </div>
            </div>
          )}

          {/* Sections List */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
              Secciones
            </h4>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-[var(--surface-1)] animate-pulse" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] py-3 text-center">
                Sin secciones
              </p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {sections.map((section: { _id: string; title: string; content?: string }) => (
                  <div
                    key={section._id}
                    className="p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-1)] transition-colors"
                  >
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {section.title}
                    </p>
                    {section.content && (
                      <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-1 mt-0.5">
                        {section.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
