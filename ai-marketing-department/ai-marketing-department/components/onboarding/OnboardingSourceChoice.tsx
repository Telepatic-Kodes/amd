"use client";

import { motion } from "framer-motion";
import { Sparkles, PenTool, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSourceChoiceProps {
  onImport: () => void;
  onManual: () => void;
}

const choices = [
  {
    id: "import" as const,
    icon: Sparkles,
    title: "Importar con IA",
    description:
      "Pega tu sitio web, Instagram o sube documentos. Extraemos toda la información automáticamente.",
    tag: "Recomendado",
    accent: "orange" as const,
  },
  {
    id: "manual" as const,
    icon: PenTool,
    title: "Configurar manualmente",
    description:
      "Llena paso a paso la información de tu marca. Ideal si no tienes presencia online aún.",
    tag: null,
    accent: "stone" as const,
  },
];

export function OnboardingSourceChoice({
  onImport,
  onManual,
}: OnboardingSourceChoiceProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 to-stone-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">
              Onboarding
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Activa tu Departamento de Marketing
          </h1>
          <p className="text-stone-400 text-lg max-w-lg mx-auto">
            37 agentes de IA listos para trabajar. Solo necesitamos conocer tu
            marca.
          </p>
        </div>

        {/* Choice cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {choices.map((choice, i) => {
            const Icon = choice.icon;
            const isImport = choice.id === "import";

            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={isImport ? onImport : onManual}
                className={cn(
                  "group relative flex flex-col items-start gap-4 p-6 rounded-2xl border text-left transition-all duration-200",
                  isImport
                    ? "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/50"
                    : "border-stone-700 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-600"
                )}
              >
                {choice.tag && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-semibold uppercase tracking-wider">
                    {choice.tag}
                  </span>
                )}

                <div
                  className={cn(
                    "p-3 rounded-xl",
                    isImport ? "bg-orange-500/20" : "bg-stone-700"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isImport ? "text-orange-400" : "text-stone-300"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-white">
                    {choice.title}
                  </h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    {choice.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium mt-auto",
                    isImport ? "text-orange-400" : "text-stone-400"
                  )}
                >
                  Comenzar{" "}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
