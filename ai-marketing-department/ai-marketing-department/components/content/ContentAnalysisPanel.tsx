"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { ScoreCircle } from "./ScoreCircle";
import { AnalyzeButton } from "./AnalyzeButton";

interface Suggestion {
  type: string;
  description: string;
  priority: string;
  suggestedText?: string;
}

interface Analysis {
  _id: Id<"contentAnalyses">;
  overallScore: number;
  brandAlignment: number;
  engagementPrediction: number;
  channelOptimization: number;
  details: {
    brandNotes: string[];
    engagementNotes: string[];
    channelNotes: string[];
  };
  suggestions: Suggestion[];
  analyzedAt: number;
  tokensUsed?: number;
}

interface Props {
  contentId: Id<"content">;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  rewrite_hook: "Reescribir hook",
  add_cta: "Agregar CTA",
  adjust_tone: "Ajustar tono",
  add_data: "Agregar datos",
  improve_structure: "Mejorar estructura",
  optimize_length: "Optimizar largo",
  add_hashtags: "Agregar hashtags",
  improve_seo: "Mejorar SEO",
  general: "General",
};

export function ContentAnalysisPanel({ contentId, isOpen, onClose }: Props) {
  const analysis = useQuery(api.contentAnalysis.getContentAnalysis, { contentId }) as Analysis | null | undefined;
  const applyContentSuggestions = useAction(api.contentAnalysis.applyContentSuggestions);
  const { success: showSuccess, error: showError } = useToast();

  const [expandedSection, setExpandedSection] = useState<string | null>("scores");
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const [applying, setApplying] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleApply = async () => {
    if (!analysis || selectedSuggestions.length === 0) return;

    setApplying(true);
    try {
      await applyContentSuggestions({
        contentId,
        analysisId: analysis._id,
        suggestionIndices: selectedSuggestions,
      });
      showSuccess("Sugerencias aplicadas", "El contenido ha sido mejorado.");
      setSelectedSuggestions([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message || "No se pudieron aplicar las sugerencias.");
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed right-0 top-0 h-full w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Análisis</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {!analysis ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10">
              <Sparkles className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-300 font-medium">Sin análisis aún</p>
              <p className="text-zinc-500 text-sm mt-1">
                Analiza este contenido para ver scores y sugerencias de mejora.
              </p>
            </div>
            <AnalyzeButton contentId={contentId} variant="button" />
          </div>
        ) : (
          <>
            {/* Scores Section */}
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <button
                onClick={() => toggleSection("scores")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900/50 transition"
              >
                <span>Puntuaciones</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSection === "scores" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "scores" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      {/* Overall Score */}
                      <div className="flex justify-center mb-4">
                        <ScoreCircle
                          score={analysis.overallScore}
                          label="Score general"
                          size={100}
                        />
                      </div>
                      {/* Individual Scores */}
                      <div className="flex justify-around">
                        <ScoreCircle
                          score={analysis.brandAlignment}
                          label="Marca"
                          size={70}
                        />
                        <ScoreCircle
                          score={analysis.engagementPrediction}
                          label="Engagement"
                          size={70}
                        />
                        <ScoreCircle
                          score={analysis.channelOptimization}
                          label="Canal"
                          size={70}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Details Section */}
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <button
                onClick={() => toggleSection("details")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900/50 transition"
              >
                <span>Detalles</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSection === "details" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "details" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {analysis.details.brandNotes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-indigo-400 mb-1">Alineación de marca</p>
                          {analysis.details.brandNotes.map((note: string, i: number) => (
                            <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 mb-1">
                              <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-zinc-600" />
                              {note}
                            </p>
                          ))}
                        </div>
                      )}
                      {analysis.details.engagementNotes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-400 mb-1">Engagement</p>
                          {analysis.details.engagementNotes.map((note: string, i: number) => (
                            <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 mb-1">
                              <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-zinc-600" />
                              {note}
                            </p>
                          ))}
                        </div>
                      )}
                      {analysis.details.channelNotes.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-yellow-400 mb-1">Optimización de canal</p>
                          {analysis.details.channelNotes.map((note: string, i: number) => (
                            <p key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 mb-1">
                              <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-zinc-600" />
                              {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggestions Section */}
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <button
                onClick={() => toggleSection("suggestions")}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900/50 transition"
              >
                <span>Sugerencias ({analysis.suggestions.length})</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSection === "suggestions" && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {expandedSection === "suggestions" && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {analysis.suggestions.map((suggestion: Suggestion, index: number) => (
                        <button
                          key={index}
                          onClick={() => toggleSuggestion(index)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            selectedSuggestions.includes(index)
                              ? "border-purple-500/40 bg-purple-500/5"
                              : "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all",
                                selectedSuggestions.includes(index)
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-zinc-700"
                              )}
                            >
                              {selectedSuggestions.includes(index) && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-zinc-300">
                                  {SUGGESTION_TYPE_LABELS[suggestion.type] || suggestion.type}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full border",
                                    PRIORITY_COLORS[suggestion.priority] || PRIORITY_COLORS.medium
                                  )}
                                >
                                  {suggestion.priority}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 leading-relaxed">
                                {suggestion.description}
                              </p>
                              {suggestion.suggestedText && (
                                <div className="mt-2 p-2 rounded bg-zinc-900/50 border border-zinc-800/50">
                                  <p className="text-xs text-zinc-400 italic">
                                    &ldquo;{suggestion.suggestedText}&rdquo;
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Re-analyze Button */}
            <AnalyzeButton
              contentId={contentId}
              variant="button"
            />

            {/* Timestamp */}
            <p className="text-xs text-zinc-600 text-center">
              Analizado: {new Date(analysis.analyzedAt).toLocaleString("es-CL")}
              {analysis.tokensUsed && ` · ${analysis.tokensUsed} tokens`}
            </p>
          </>
        )}
      </div>

      {/* Footer with Apply Button */}
      {analysis && selectedSuggestions.length > 0 && (
        <div className="border-t border-zinc-800 px-5 py-4">
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Aplicar {selectedSuggestions.length}{" "}
                {selectedSuggestions.length === 1 ? "sugerencia" : "sugerencias"}
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
