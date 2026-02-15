"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { MessageSquare, HelpCircle, Sparkles, Loader2 } from "lucide-react";

interface MessagingData {
  guide: string;
  problem: string;
  solution: string;
  successVision: string;
  failureVision: string;
  callToAction: string;
}

interface BrandStepMessagingProps {
  data: MessagingData;
  onChange: (partial: Partial<MessagingData>) => void;
  brandProfileId?: Id<"brandProfiles">;
}

const FIELDS = [
  {
    key: "guide" as const,
    label: "Tu marca como guia",
    placeholder: "Ej: Somos el aliado tecnologico que simplifica la gestion de marketing...",
    hint: "Como se posiciona tu marca como guia experta para el cliente?",
  },
  {
    key: "problem" as const,
    label: "El problema del cliente",
    placeholder: "Ej: Las empresas pierden tiempo y dinero en marketing manual sin resultados medibles...",
    hint: "Cual es el problema principal que enfrenta tu cliente ideal?",
  },
  {
    key: "solution" as const,
    label: "La solucion",
    placeholder: "Ej: Automatizamos tu departamento de marketing con IA para generar contenido estrategico...",
    hint: "Como tu producto/servicio resuelve ese problema?",
  },
  {
    key: "successVision" as const,
    label: "Vision de exito",
    placeholder: "Ej: Triplicar tu presencia digital, ahorrar 40 horas/mes, y convertir mas leads...",
    hint: "Que logra el cliente cuando usa tu solucion?",
  },
  {
    key: "failureVision" as const,
    label: "Vision de fracaso",
    placeholder: "Ej: Sin estrategia clara, tu competencia captura el mercado mientras pierdes relevancia...",
    hint: "Que pasa si el cliente NO actua?",
  },
  {
    key: "callToAction" as const,
    label: "Call to Action principal",
    placeholder: "Ej: Agenda una demo gratuita / Empieza tu prueba de 14 dias",
    hint: "Cual es la accion concreta que quieres que tomen?",
  },
];

export function BrandStepMessaging({ data, onChange, brandProfileId }: BrandStepMessagingProps) {
  const generateMessaging = useAction(api.brandProfile.generateMessagingDraft);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandProfileId) return;
    setGenerating(true);
    setError(null);
    try {
      const draft = await generateMessaging({ brandProfileId });
      onChange({
        guide: draft.guide || "",
        problem: draft.problem || "",
        solution: draft.solution || "",
        successVision: draft.successVision || "",
        failureVision: draft.failureVision || "",
        callToAction: draft.callToAction || "",
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error generando messaging");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <p className="text-sm text-stone-500">
            Define tu narrativa de marca usando el framework StoryBrand. Posiciona al cliente como el heroe
            y tu marca como el guia.
          </p>
        </div>
        {brandProfileId && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium transition disabled:opacity-50 shrink-0 ml-3"
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
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            {field.label}
          </label>
          <div className="relative">
            <textarea
              value={data[field.key]}
              onChange={(e) => onChange({ [field.key]: e.target.value })}
              placeholder={field.placeholder}
              rows={2}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition resize-none"
            />
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-stone-400">
            <HelpCircle className="w-3 h-3" />
            {field.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
