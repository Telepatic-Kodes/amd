"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  PenTool,
  Users,
  Search,
  Megaphone,
  Zap,
  Play,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepFeeds } from "@/components/onboarding/StepFeeds";

const GOALS = [
  { id: "lead-gen", label: "Generar Leads", icon: Target, desc: "Atraer leads calificados y conversiones" },
  { id: "brand", label: "Visibilidad de Marca", icon: Eye, desc: "Aumentar el conocimiento de tu marca" },
  { id: "content", label: "Marketing de Contenido", icon: PenTool, desc: "Crear y distribuir contenido valioso" },
  { id: "social", label: "Crecimiento Social", icon: Users, desc: "Crecer y enganchar a tu audiencia" },
  { id: "seo", label: "SEO / Posicionamiento", icon: Search, desc: "Mejorar trafico organico y rankings" },
  { id: "paid", label: "Publicidad Pagada", icon: Megaphone, desc: "Optimizar campañas publicitarias" },
];

interface OnboardingGoalsModeProps {
  goals: string[];
  feeds: string[];
  industry: string;
  activationMode: "demo" | "real";
  onChangeGoals: (goals: string[]) => void;
  onChangeFeeds: (feeds: string[]) => void;
  onChangeMode: (mode: "demo" | "real") => void;
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingGoalsMode({
  goals,
  feeds,
  industry,
  activationMode,
  onChangeGoals,
  onChangeFeeds,
  onChangeMode,
  onComplete,
  onBack,
}: OnboardingGoalsModeProps) {
  const [showFeeds, setShowFeeds] = useState(false);

  const toggleGoal = (id: string) => {
    onChangeGoals(
      goals.includes(id)
        ? goals.filter((g) => g !== id)
        : [...goals, id]
    );
  };

  const canProceed = goals.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-100 to-white">
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 space-y-10">
        {/* Section 1: Goals */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-stone-900">
              Mision del departamento
            </h1>
            <p className="text-stone-500 text-sm">
              Selecciona tus objetivos. Los agentes los priorizaran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOALS.map(({ id, label, icon: Icon, desc }) => {
              const active = goals.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleGoal(id)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                    active
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/30"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      active ? "bg-orange-600" : "bg-stone-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        active ? "text-white" : "text-stone-500"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-stone-900">{label}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Section 2: Activation Mode */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-stone-900 mb-3">
            Modo de activacion
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Demo mode */}
            <button
              onClick={() => onChangeMode("demo")}
              className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                activationMode === "demo"
                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/30"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    activationMode === "demo" ? "bg-orange-600" : "bg-stone-100"
                  )}
                >
                  <Play
                    className={cn(
                      "w-4 h-4",
                      activationMode === "demo" ? "text-white" : "text-stone-500"
                    )}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-stone-900">Demo</p>
                  <p className="text-xs text-green-600 font-medium">Gratis</p>
                </div>
              </div>
              <p className="text-xs text-stone-500">
                Animacion visual de los departamentos activandose. Contenido de ejemplo pre-generado.
              </p>
            </button>

            {/* Real mode */}
            <button
              onClick={() => onChangeMode("real")}
              className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                activationMode === "real"
                  ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500/30"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    activationMode === "real" ? "bg-orange-600" : "bg-stone-100"
                  )}
                >
                  <Zap
                    className={cn(
                      "w-4 h-4",
                      activationMode === "real" ? "text-white" : "text-stone-500"
                    )}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm text-stone-900">Real</p>
                  <p className="text-xs text-orange-600 font-medium">~$0.50-2.00</p>
                </div>
              </div>
              <p className="text-xs text-stone-500">
                Ejecuta al CMO Agent con tu información real. Genera un análisis personalizado en vivo.
              </p>
            </button>
          </div>
        </motion.section>

        {/* Section 3: Feeds (collapsible) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setShowFeeds(!showFeeds)}
            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition mb-3"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                showFeeds && "rotate-180"
              )}
            />
            Fuentes de contenido (opcional)
          </button>
          {showFeeds && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <StepFeeds
                feeds={feeds}
                industry={industry}
                onChange={onChangeFeeds}
              />
            </motion.div>
          )}
        </motion.section>
      </div>

      {/* Footer */}
      <div className="border-t border-stone-200 p-4 bg-white/80 backdrop-blur mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Atras
          </button>
          <button
            onClick={onComplete}
            disabled={!canProceed}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold transition",
              canProceed
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            Activar departamento <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
