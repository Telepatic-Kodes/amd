"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCw,
  Loader2,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Mail,
  Video,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-sky-500" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "text-purple-500" },
  { id: "blog", label: "Blog", icon: BookOpen, color: "text-green-600" },
  { id: "email", label: "Email", icon: Mail, color: "text-amber-600" },
  { id: "youtube", label: "YouTube", icon: Video, color: "text-red-500" },
] as const;

// Map content types to channel IDs for auto-exclusion
const TYPE_TO_CHANNEL: Record<string, string> = {
  social_linkedin: "linkedin",
  social_twitter: "twitter",
  social_instagram: "instagram",
  social_tiktok: "tiktok",
  blog: "blog",
  email: "email",
  newsletter: "email",
  video_script: "youtube",
};

interface RepurposeContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Doc<"content">;
}

export function RepurposeContentModal({ isOpen, onClose, content }: RepurposeContentModalProps) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  const triggerRepurpose = useMutation(api.contentRepurpose.triggerRepurpose);
  const existingVersions = useQuery(api.contentRepurpose.getRepurposedVersions, {
    contentId: content._id,
  });

  const sourceChannel = TYPE_TO_CHANNEL[content.type] || "";
  const existingChannelTypes = new Set(
    (existingVersions || []).map((v) => TYPE_TO_CHANNEL[v.type] || "")
  );

  const wordCount = content.body?.split(/\s+/).length || 0;
  const typeLabel = content.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handleRepurpose = async () => {
    if (selectedChannels.length === 0) return;
    setStatus("generating");
    try {
      await triggerRepurpose({
        sourceContentId: content._id,
        targetChannels: selectedChannels,
        additionalInstructions: additionalInstructions || undefined,
      });
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  };

  const handleClose = () => {
    setSelectedChannels([]);
    setAdditionalInstructions("");
    setStatus("idle");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <RefreshCw className="h-5 w-5 text-[var(--accent)] shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Repurposar Contenido</h3>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{content.title}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {status === "idle" && (
                <>
                  {/* Source preview */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]">
                    <FileText className="h-5 w-5 text-[var(--text-tertiary)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {content.title}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {wordCount.toLocaleString()} palabras · {typeLabel}
                      </p>
                    </div>
                  </div>

                  {/* Channel selector */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                      Canales destino
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CHANNELS.map((ch) => {
                        const Icon = ch.icon;
                        const isSource = ch.id === sourceChannel;
                        const hasExisting = existingChannelTypes.has(ch.id);
                        const isSelected = selectedChannels.includes(ch.id);

                        return (
                          <button
                            key={ch.id}
                            disabled={isSource}
                            onClick={() => toggleChannel(ch.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left",
                              isSource
                                ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--surface-1)]"
                                : isSelected
                                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                                  : "border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-secondary)]"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-[var(--accent)]" : ch.color)} />
                            <span className="flex-1">{ch.label}</span>
                            {isSource && (
                              <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Fuente</span>
                            )}
                            {hasExisting && !isSource && (
                              <span className="text-[10px] text-amber-500 font-medium">Ya existe</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional instructions */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                      Instrucciones adicionales <span className="text-[var(--text-tertiary)] font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                      placeholder="Ej: Hazlo más casual, agrega CTA de venta..."
                    />
                  </div>

                  {selectedChannels.length > 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] text-center">
                      Se generarán <strong className="text-[var(--text-primary)]">{selectedChannels.length}</strong> piezas de contenido
                    </p>
                  )}
                </>
              )}

              {status === "generating" && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-[var(--accent)] mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Generando {selectedChannels.length} piezas...
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    La IA está adaptando tu contenido para cada canal
                  </p>
                </div>
              )}

              {status === "done" && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Repurposing iniciado
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Las piezas aparecerán como drafts en tu pipeline en unos momentos
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
              {status === "idle" && (
                <>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRepurpose}
                    disabled={selectedChannels.length === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Repurposar ({selectedChannels.length} canal{selectedChannels.length !== 1 ? "es" : ""})
                  </button>
                </>
              )}
              {(status === "generating" || status === "done") && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
                >
                  {status === "done" ? "Cerrar" : "En segundo plano"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
