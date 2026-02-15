"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Target, Plus, X, HelpCircle, Sparkles, Loader2 } from "lucide-react";

interface PositioningData {
  uniqueValue: string;
  category: string;
  differentiators: string[];
  proofPoints: string[];
}

interface BrandStepPositioningProps {
  data: PositioningData;
  onChange: (partial: Partial<PositioningData>) => void;
  brandProfileId?: Id<"brandProfiles">;
}

export function BrandStepPositioning({ data, onChange, brandProfileId }: BrandStepPositioningProps) {
  const generatePositioning = useAction(api.brandProfile.generatePositioningDraft);
  const [newDiff, setNewDiff] = useState("");
  const [newProof, setNewProof] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandProfileId) return;
    setGenerating(true);
    setError(null);
    try {
      const draft = await generatePositioning({ brandProfileId });
      onChange({
        uniqueValue: draft.uniqueValue || "",
        category: draft.category || "",
        differentiators: draft.differentiators || [],
        proofPoints: draft.proofPoints || [],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error generando posicionamiento");
    } finally {
      setGenerating(false);
    }
  };

  const addDifferentiator = () => {
    if (newDiff.trim()) {
      onChange({ differentiators: [...data.differentiators, newDiff.trim()] });
      setNewDiff("");
    }
  };

  const removeDifferentiator = (idx: number) => {
    onChange({ differentiators: data.differentiators.filter((_, i) => i !== idx) });
  };

  const addProofPoint = () => {
    if (newProof.trim()) {
      onChange({ proofPoints: [...data.proofPoints, newProof.trim()] });
      setNewProof("");
    }
  };

  const removeProofPoint = (idx: number) => {
    onChange({ proofPoints: data.proofPoints.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--accent)]" />
          <p className="text-sm text-[var(--text-tertiary)]">
            Define como te posicionas en el mercado frente a tu competencia. Esto guiara todo el contenido comparativo y diferencial.
          </p>
        </div>
        {brandProfileId && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-muted)] text-orange-700 hover:bg-[var(--accent-muted)] text-xs font-medium transition disabled:opacity-50 shrink-0 ml-3"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generar con IA
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-[var(--badge-red-bg)] border border-[var(--badge-red-bg)] text-sm text-[var(--badge-red-text)]">
          {error}
        </div>
      )}

      {/* Unique Value Proposition */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Propuesta de valor unica
        </label>
        <textarea
          value={data.uniqueValue}
          onChange={(e) => onChange({ uniqueValue: e.target.value })}
          placeholder="Ej: El unico sistema de marketing con IA que integra 37 agentes especializados en un flujo de trabajo automatizado..."
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-orange-400 transition resize-none"
        />
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          <HelpCircle className="w-3 h-3" />
          Que te hace unico? Por que elegirte a ti y no a la competencia?
        </p>
      </div>

      {/* Market Category */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Categoria de mercado
        </label>
        <input
          type="text"
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="Ej: Marketing Automation con IA, SaaS de contenido, Agencia digital..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-orange-400 transition"
        />
      </div>

      {/* Differentiators */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Diferenciadores clave
        </label>
        <div className="space-y-2">
          {data.differentiators.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)] flex-1">{d}</span>
              <button onClick={() => removeDifferentiator(idx)} className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newDiff}
              onChange={(e) => setNewDiff(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDifferentiator())}
              placeholder="Ej: 37 agentes especializados vs. 1 herramienta generica"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-orange-400 transition"
            />
            <button
              onClick={addDifferentiator}
              disabled={!newDiff.trim()}
              className="px-3 py-2 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Proof Points */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Puntos de prueba
        </label>
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          Evidencia concreta: metricas, testimonios, certificaciones, casos de exito.
        </p>
        <div className="space-y-2">
          {data.proofPoints.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
              <span className="text-sm text-[var(--text-secondary)] flex-1">{p}</span>
              <button onClick={() => removeProofPoint(idx)} className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newProof}
              onChange={(e) => setNewProof(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProofPoint())}
              placeholder="Ej: +200% engagement en 3 meses para cliente X"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-orange-400 transition"
            />
            <button
              onClick={addProofPoint}
              disabled={!newProof.trim()}
              className="px-3 py-2 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
