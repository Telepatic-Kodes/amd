"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Sparkles,
  Loader2,
  MessageSquare,
  Users,
  Target,
  Swords,
  FileText,
  Lightbulb,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface Props {
  brandProfileId: Id<"brandProfiles">;
}

const categoryIcons: Record<string, React.ReactNode> = {
  voice: <MessageSquare className="w-4 h-4" />,
  audience: <Users className="w-4 h-4" />,
  strategy: <Target className="w-4 h-4" />,
  competitors: <Swords className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  general: <Lightbulb className="w-4 h-4" />,
};

const priorityConfig: Record<string, { variant: "error" | "warning" | "default"; label: string }> = {
  high: { variant: "error", label: "Alta" },
  medium: { variant: "warning", label: "Media" },
  low: { variant: "default", label: "Baja" },
};

export function BrandSuggestionsPanel({ brandProfileId }: Props) {
  const suggestions = useQuery(api.brandSuggestions.getSuggestions, { brandProfileId });
  const generateSuggestions = useAction(api.brandSuggestions.generateSuggestions);
  const dismissSuggestion = useMutation(api.brandSuggestions.dismissSuggestion);
  const applySuggestion = useMutation(api.brandSuggestions.applySuggestion);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateSuggestions({ brandProfileId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error generando sugerencias");
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (id: Id<"brandSuggestions">) => {
    await dismissSuggestion({ suggestionId: id });
  };

  const handleApply = async (id: Id<"brandSuggestions">) => {
    await applySuggestion({ suggestionId: id });
  };

  return (
    <div className="space-y-4">
      {/* Header + Generate button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Sugerencias IA
          {suggestions && suggestions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs">
              {suggestions.length}
            </span>
          )}
        </h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition",
            generating
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-purple-50 text-purple-600 hover:bg-purple-100"
          )}
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Generar
            </>
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Suggestions list */}
      {suggestions === undefined ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin sugerencias pendientes</p>
          <p className="text-xs mt-1">Genera sugerencias para mejorar tu perfil de marca</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion) => {
            const priority = priorityConfig[suggestion.priority] || priorityConfig.medium;
            return (
              <div
                key={suggestion._id}
                className="p-3 rounded-lg border border-stone-200 bg-white hover:border-stone-300 transition-colors shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="text-stone-400 mt-0.5">
                    {categoryIcons[suggestion.category] || categoryIcons.general}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-stone-900 truncate">
                        {suggestion.title}
                      </span>
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 ml-6">
                  <button
                    onClick={() => handleApply(suggestion._id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Check className="w-3 h-3" /> Aplicar
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion._id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-stone-500 hover:bg-stone-100 transition-colors"
                  >
                    <X className="w-3 h-3" /> Descartar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
