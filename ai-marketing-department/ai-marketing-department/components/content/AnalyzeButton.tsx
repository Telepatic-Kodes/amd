"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Sparkles, Loader2 } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";
import { useToast } from "@/components/ui/Toast";

interface Props {
  contentId: Id<"content">;
  onAnalysisComplete?: () => void;
  variant?: "icon" | "button";
}

export function AnalyzeButton({ contentId, onAnalysisComplete, variant = "icon" }: Props) {
  const analyzeContent = useAction(api.contentAnalysis.analyzeContent);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { success, error: showError } = useToast();

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzing(true);
    try {
      await analyzeContent({ contentId });
      success("Análisis completo", "El contenido ha sido analizado exitosamente.");
      onAnalysisComplete?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message || "No se pudo analizar el contenido.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="p-1.5 rounded-lg bg-zinc-900/90 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 transition-colors disabled:opacity-50"
        title="Analizar contenido"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      className="w-full px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-purple-500/20"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Analizar
        </>
      )}
    </button>
  );
}
