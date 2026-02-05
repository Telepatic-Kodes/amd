"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";

import { Stepper } from "@/components/onboarding/Stepper";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { StepGoals } from "@/components/onboarding/StepGoals";
import { StepFeeds } from "@/components/onboarding/StepFeeds";
import { StepLaunch } from "@/components/onboarding/StepLaunch";

// REDUCED TO 3 STEPS:
// Step 0: StepWelcome - Company info (name, industry, description)
// Step 1: StepGoals - Goals & objectives (combines old channels selection)
// Step 2: StepFeeds - Feed templates (with industry-specific recommendations)
// Step 3: StepLaunch - Final confirmation

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useMutation(api.onboarding.complete);
  const incrementOnboarding = useMutation(api.guidance.incrementOnboardingCompletion);
  const initGuidance = useMutation(api.guidance.initGuidance);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  // Auto-select all departments (no need for user selection)
  const [data, setData] = useState({
    companyName: "",
    industry: "",
    description: "",
    goals: [] as string[],
    channels: [] as string[],
    feeds: [] as string[],
    // AUTO-CONFIGURED - All departments enabled by default
    departments: ["content", "social", "seo", "demandgen", "brand", "ops", "leadership"],
  });

  const canNext = () => {
    switch (step) {
      case 0:
        // Step 1: Need company name and industry
        return data.companyName.trim() !== "" && data.industry !== "";
      case 1:
        // Step 2: Need at least one goal
        return data.goals.length > 0;
      case 2:
        // Step 3: Can proceed with or without feeds (optional)
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
    }
  };

  const launch = async () => {
    setLoading(true);
    try {
      await completeOnboarding(data);
      // Track onboarding completion in guidance system
      await initGuidance();
      await incrementOnboarding();
      router.push("/");
    } catch {
      setLoading(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  const renderStep = () => {
    switch (step) {
      // STEP 1: Company Information
      case 0:
        return (
          <StepWelcome
            data={data}
            onChange={(partial) => setData((d) => ({ ...d, ...partial }))}
          />
        );

      // STEP 2: Goals & Objectives (combines channels selection)
      case 1:
        return (
          <StepGoals
            selected={data.goals}
            onChange={(goals) => setData((d) => ({ ...d, goals }))}
          />
        );

      // STEP 3: Feed Templates (industry-specific recommendations)
      case 2:
        return (
          <StepFeeds
            feeds={data.feeds}
            industry={data.industry}
            onChange={(feeds) => setData((d) => ({ ...d, feeds }))}
          />
        );

      default:
        return null;
    }
  };

  // Progress text for each step
  const stepLabels = [
    { title: "Cuéntanos de ti", subtitle: "Información básica de tu empresa" },
    { title: "¿Qué quieres lograr?", subtitle: "Tus objetivos de marketing" },
    { title: "¿De dónde sacamos ideas?", subtitle: "Selecciona fuentes de contenido" },
  ];

  const currentLabel = stepLabels[step];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 to-black">
      {/* Header with Progress */}
      <div className="pt-8 pb-8 px-4 border-b border-zinc-800">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentLabel.title}
            </h1>
            <p className="text-zinc-400 text-sm">
              {currentLabel.subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all duration-300",
                  i <= step
                    ? "bg-indigo-500"
                    : "bg-zinc-800"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Paso {step + 1} de {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
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
      {step < TOTAL_STEPS - 1 ? (
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/50 backdrop-blur">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition",
                step === 0
                  ? "text-zinc-700 cursor-not-allowed"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> {translate("back")}
            </button>
            <button
              onClick={next}
              disabled={!canNext()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                canNext()
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {translate("next")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Final Step: Launch Button in Footer
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/50 backdrop-blur">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> {translate("back")}
            </button>
            <button
              onClick={launch}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold transition",
                loading
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 text-white"
              )}
            >
              {loading ? "Iniciando..." : "¡Comenzar! 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* Step Launch - Only shown on final step */}
      {step === TOTAL_STEPS - 1 && (
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          <StepLaunch
            data={data}
            onLaunch={launch}
            loading={loading}
            simplified={true}
          />
        </div>
      )}
    </div>
  );
}
