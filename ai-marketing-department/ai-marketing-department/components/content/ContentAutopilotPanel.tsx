"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronDown,
  Loader2,
  CheckCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { BriefCard } from "./BriefCard";
import { BriefEditModal } from "./BriefEditModal";

interface BriefData {
  _id: Id<"contentBriefs">;
  title: string;
  description: string;
  channel: string;
  contentType: string;
  pillarName?: string;
  contentTier?: "hero" | "hub" | "hygiene";
  funnelStage?: "reach" | "act" | "convert" | "engage";
  tayaCategory?: string;
  dayOfWeek?: string;
  successProbability?: number;
  status: string;
  generatedContentId?: Id<"content">;
  userFeedback?: string;
  promptInstructions?: string;
}

export function ContentAutopilotPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingBrief, setEditingBrief] = useState<BriefData | null>(null);
  const [feedbackBriefId, setFeedbackBriefId] = useState<Id<"contentBriefs"> | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const briefsData = useQuery(api.contentAutopilot.getActiveBriefs);
  const stats = useQuery(api.contentAutopilot.getAutopilotStats);

  const triggerGenerate = useMutation(api.contentAutopilot.triggerGenerateBriefs);
  const approveBrief = useMutation(api.contentAutopilot.approveBrief);
  const dismissBrief = useMutation(api.contentAutopilot.dismissBrief);
  const bulkApprove = useMutation(api.contentAutopilot.bulkApproveBriefs);
  const bulkDismiss = useMutation(api.contentAutopilot.bulkDismissBriefs);
  const requestChanges = useMutation(api.contentAutopilot.requestChanges);

  const { success, error: showError } = useToast();

  if (!briefsData) return null; // Loading

  const { suggested, inProgress, generated } = briefsData;
  const totalActive = suggested.length + inProgress.length + generated.length;

  // Don't show panel if nothing to show and not generating
  if (totalActive === 0 && !isGenerating) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-0)]/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Content Autopilot
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              No hay sugerencias activas
            </span>
          </div>
          <button
            onClick={async () => {
              setIsGenerating(true);
              try {
                await triggerGenerate({});
                success("Generando", "Se están generando sugerencias de contenido...");
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Error";
                showError("Error", msg);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generar Sugerencias
          </button>
        </div>
      </div>
    );
  }

  const handleApprove = async (id: Id<"contentBriefs">) => {
    try {
      await approveBrief({ briefId: id });
      success("Aprobado", "Brief aprobado, generando contenido...");
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Error");
    }
  };

  const handleDismiss = async (id: Id<"contentBriefs">) => {
    try {
      await dismissBrief({ briefId: id });
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Error");
    }
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApprove({ briefIds: suggested.map((b: BriefData) => b._id) });
      success("Aprobados", `${suggested.length} briefs aprobados`);
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Error");
    }
  };

  const handleBulkDismiss = async () => {
    try {
      await bulkDismiss({ briefIds: suggested.map((b: BriefData) => b._id) });
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Error");
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackBriefId || !feedbackText.trim()) return;
    setIsSendingFeedback(true);
    try {
      await requestChanges({ briefId: feedbackBriefId, feedback: feedbackText });
      success("Regenerando", "Se regenerará el contenido con tu feedback");
      setFeedbackBriefId(null);
      setFeedbackText("");
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Error");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsExpanded(!isExpanded); } }}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-0)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--accent-subtle)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Content Autopilot
            </span>
            {suggested.length > 0 && (
              <Badge variant="warning" className="text-[10px]">
                {suggested.length} sugerencias
              </Badge>
            )}
            {inProgress.length > 0 && (
              <Badge variant="default" className="text-[10px]">
                {inProgress.length} generando
              </Badge>
            )}
            {generated.length > 0 && (
              <Badge variant="success" className="text-[10px]">
                {generated.length} listos
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setIsGenerating(true);
                try {
                  await triggerGenerate({});
                  success("Generando", "Se están generando nuevas sugerencias...");
                } catch (err: unknown) {
                  showError("Error", err instanceof Error ? err.message : "Error");
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-orange-100 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Generar
            </button>
            <ChevronDown className={cn(
              "h-4 w-4 text-[var(--text-tertiary)] transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>

        {/* Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-5 border-t border-[var(--border)]">
                {/* Suggested briefs */}
                {suggested.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Sugerencias ({suggested.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkApprove}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20 text-[10px] font-medium transition-colors"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Aprobar Todo ({suggested.length})
                        </button>
                        <button
                          onClick={handleBulkDismiss}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500 text-[10px] font-medium transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                          Descartar Todo
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {suggested.map((brief: BriefData) => (
                        <BriefCard
                          key={brief._id}
                          brief={brief}
                          onApprove={handleApprove}
                          onEdit={setEditingBrief}
                          onDismiss={handleDismiss}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* In-progress briefs */}
                {inProgress.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Generando ({inProgress.length})
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {inProgress.map((brief: BriefData) => (
                        <BriefCard key={brief._id} brief={brief} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated briefs — ready for review */}
                {generated.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                      Listos para Revisar ({generated.length})
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {generated.map((brief: BriefData) => (
                        <BriefCard
                          key={brief._id}
                          brief={brief}
                          onViewContent={(contentId) => {
                            // Navigate to content detail by setting contentId in URL or opening
                            window.location.hash = `content-${contentId}`;
                          }}
                          onRequestChanges={(id) => {
                            setFeedbackBriefId(id);
                            setFeedbackText("");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats bar */}
                {stats && (
                  <div className="flex items-center gap-4 pt-3 border-t border-[var(--border)] text-[10px] text-[var(--text-tertiary)]">
                    <span>{stats.pending} pendientes</span>
                    <span>{stats.generating} generando</span>
                    <span>{stats.awaitingReview} por revisar</span>
                    <span>{stats.thisWeekGenerated} generados esta semana</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Brief Modal */}
      {editingBrief && (
        <BriefEditModal
          brief={editingBrief}
          isOpen={!!editingBrief}
          onClose={() => setEditingBrief(null)}
          onSuccess={() => {
            setEditingBrief(null);
            success("Brief editado", "Brief editado y aprobado, generando contenido...");
          }}
        />
      )}

      {/* Feedback Modal (inline) */}
      <AnimatePresence>
        {feedbackBriefId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setFeedbackBriefId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Pedir Cambios
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mb-4">
                Describe qué cambios quieres en el contenido generado. Se regenerará con tu feedback.
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="Ej: Hacerlo más conciso, agregar estadísticas, cambiar el tono a más casual..."
                className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none mb-4"
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setFeedbackBriefId(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedbackText.trim() || isSendingFeedback}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSendingFeedback ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
