"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Building2,
  Target,
  Rss,
  FileText,
  Megaphone,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { translate } from "@/lib/language";

interface SetupStep {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  weight: number;
}

const SETUP_STEPS: SetupStep[] = [
  {
    key: "companyConfigured",
    label: "Configurar empresa",
    description: "Nombre, industria y descripción",
    href: "/onboarding",
    icon: Building2,
    weight: 15,
  },
  {
    key: "goalsSet",
    label: "Definir objetivos",
    description: "Objetivos de marketing",
    href: "/onboarding",
    icon: Target,
    weight: 15,
  },
  {
    key: "feedsConfigured",
    label: "Agregar fuentes",
    description: "Al menos una fuente de contenido",
    href: "/feeds",
    icon: Rss,
    weight: 15,
  },
  {
    key: "firstContentCreated",
    label: "Crear contenido",
    description: "Tu primera pieza de contenido",
    href: "/content",
    icon: FileText,
    weight: 15,
  },
  {
    key: "firstCampaignCreated",
    label: "Lanzar campaña",
    description: "Tu primera campaña de marketing",
    href: "/campaigns",
    icon: Megaphone,
    weight: 15,
  },
  {
    key: "analyticsViewed",
    label: "Ver resultados",
    description: "Revisa tus métricas",
    href: "/analytics",
    icon: BarChart3,
    weight: 10,
  },
  {
    key: "settingsReviewed",
    label: "Revisar configuración",
    description: "API keys y preferencias",
    href: "/settings",
    icon: Settings,
    weight: 15,
  },
];

export function SetupProgress() {
  const setupProgress = useQuery(api.guidance.getSetupProgress);
  const [expanded, setExpanded] = useState(false);

  if (!setupProgress) return null;

  const { steps, progress, completedCount, totalCount } = setupProgress;

  // Don't show if 100% complete
  if (progress >= 100) return null;

  // Find next incomplete step
  const nextStep = SETUP_STEPS.find(
    (s) => !steps[s.key as keyof typeof steps]
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      {/* Progress Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              Progreso de Configuración
            </p>
            <p className="text-xs text-zinc-500">
              {completedCount}/{totalCount} pasos completados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-indigo-400">
            {progress}%
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Expanded Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {SETUP_STEPS.map((step) => {
                const completed = steps[step.key as keyof typeof steps];
                const isNext = nextStep?.key === step.key;
                const StepIcon = step.icon;

                return (
                  <Link
                    key={step.key}
                    href={completed ? "#" : step.href}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                      completed
                        ? "opacity-60"
                        : isNext
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-zinc-900/50"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className={`w-4 h-4 flex-shrink-0 ${isNext ? "text-indigo-400" : "text-zinc-600"}`} />
                    )}
                    <StepIcon className={`w-4 h-4 flex-shrink-0 ${completed ? "text-zinc-500" : isNext ? "text-indigo-400" : "text-zinc-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${completed ? "line-through text-zinc-500" : "text-white"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {step.description}
                      </p>
                    </div>
                    {isNext && (
                      <span className="text-xs text-indigo-400 font-medium flex-shrink-0">
                        Siguiente
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed: Show next step hint */}
      {!expanded && nextStep && (
        <div className="px-4 pb-3">
          <Link
            href={nextStep.href}
            className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
          >
            Siguiente: {nextStep.label} →
          </Link>
        </div>
      )}
    </div>
  );
}
