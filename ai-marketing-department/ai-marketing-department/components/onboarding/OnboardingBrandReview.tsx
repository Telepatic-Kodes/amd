"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BrandData } from "@/lib/brand-utils";

import { BrandStepBasics } from "@/components/brand/BrandStepBasics";
import { BrandStepVoice } from "@/components/brand/BrandStepVoice";
import { BrandStepAudience } from "@/components/brand/BrandStepAudience";
import { BrandStepStrategy } from "@/components/brand/BrandStepStrategy";
import { BrandStepCompetitors } from "@/components/brand/BrandStepCompetitors";
import { BrandStepVisual } from "@/components/brand/BrandStepVisual";

const TOTAL_STEPS = 6;

const stepLabels = [
  { title: "Información básica", subtitle: "Nombre, industria y descripción" },
  { title: "Voz de marca", subtitle: "Tono, personalidad y reglas" },
  { title: "Audiencia", subtitle: "Segmentos y pain points" },
  { title: "Estrategia", subtitle: "Temas, canales y frecuencia" },
  { title: "Competencia", subtitle: "Competidores y referencias" },
  { title: "Identidad visual", subtitle: "Colores, logo y estilo" },
];

interface OnboardingBrandReviewProps {
  data: BrandData;
  onChange: (data: BrandData) => void;
  prefilled: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingBrandReview({
  data,
  onChange,
  prefilled,
  onComplete,
  onBack,
}: OnboardingBrandReviewProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-save draft to localStorage
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    draftTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("amd-unified-brand-draft", JSON.stringify(data));
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [data]);

  const canNext = () => {
    switch (step) {
      case 0:
        return data.companyName.trim() !== "" && data.industry !== "" && data.description.trim() !== "";
      case 1:
        return data.voice.tone.length > 0;
      case 2:
        return data.audience.segments.length > 0 && data.audience.segments.every((s) => s.name.trim() !== "");
      case 3:
        return data.strategy.topics.length > 0 && data.strategy.channels.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1 && canNext()) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    } else {
      onBack();
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <BrandStepBasics
            data={data}
            onChange={(partial) => onChange({ ...data, ...partial })}
          />
        );
      case 1:
        return (
          <BrandStepVoice
            data={data.voice}
            onChange={(partial) =>
              onChange({ ...data, voice: { ...data.voice, ...partial } })
            }
          />
        );
      case 2:
        return (
          <BrandStepAudience
            data={data.audience}
            onChange={(partial) =>
              onChange({ ...data, audience: { ...data.audience, ...partial } })
            }
          />
        );
      case 3:
        return (
          <BrandStepStrategy
            data={data.strategy}
            onChange={(partial) =>
              onChange({ ...data, strategy: { ...data.strategy, ...partial } })
            }
          />
        );
      case 4:
        return (
          <BrandStepCompetitors
            data={{ competitors: data.competitors, references: data.references }}
            onChange={(partial) =>
              onChange({
                ...data,
                competitors: partial.competitors ?? data.competitors,
                references: partial.references ?? data.references,
              })
            }
          />
        );
      case 5:
        return (
          <BrandStepVisual
            data={data.visual}
            companyName={data.companyName}
            onChange={(partial) =>
              onChange({ ...data, visual: { ...data.visual, ...partial } })
            }
          />
        );
      default:
        return null;
    }
  };

  const currentLabel = stepLabels[step];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-100 to-white">
      {/* Prefilled banner */}
      {prefilled && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            Pre-llenado con IA. Revisa y ajusta cada paso antes de continuar.
          </p>
        </div>
      )}

      {/* Header with Progress */}
      <div className="pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">
              {currentLabel.title}
            </h1>
            <p className="text-stone-500 text-sm">{currentLabel.subtitle}</p>
          </div>

          {/* Progress Bar - 6 segments */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all duration-300",
                  i <= step ? "bg-orange-600" : "bg-stone-200"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Paso {step + 1} de {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full max-w-2xl"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-stone-200 p-4 bg-white/80 backdrop-blur mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={back}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Atras
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={next}
              disabled={!canNext()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                canNext()
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              )}
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem("amd-unified-brand-draft");
                onComplete();
              }}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
