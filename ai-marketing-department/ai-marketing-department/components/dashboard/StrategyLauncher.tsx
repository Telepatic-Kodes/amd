"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function StrategyLauncher() {
  const { success, error: toastError } = useToast();
  const [launching, setLaunching] = useState(false);

  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const brandMaturity = useQuery(api.brandMaturity.computeBrandMaturity);
  const launchStrategy = useMutation(api.cmoEngine.launchStrategy);

  const isProfileComplete = brandProfile?.status === "complete";
  const maturityScore = brandMaturity?.score ?? 0;
  const hasMinimumData = maturityScore >= 40;

  const checks = [
    {
      label: "Perfil de marca creado",
      passed: !!brandProfile,
      required: true,
    },
    {
      label: "Perfil completo",
      passed: isProfileComplete,
      required: true,
    },
    {
      label: `Madurez de marca (${maturityScore}%)`,
      passed: hasMinimumData,
      required: false,
    },
    {
      label: "Canales configurados",
      passed: (brandProfile?.strategy?.channels?.length ?? 0) > 0,
      required: true,
    },
    {
      label: "Audiencia definida",
      passed: (brandProfile?.audience?.segments?.length ?? 0) > 0,
      required: true,
    },
  ];

  const allRequiredPassed = checks.filter((c) => c.required).every((c) => c.passed);

  async function handleLaunch() {
    if (!brandProfile || !allRequiredPassed) return;
    setLaunching(true);
    try {
      await launchStrategy({ brandProfileId: brandProfile._id });
      success(
        "Marketing Autopilot activado",
        "El CMO esta analizando tu marca y generando la estrategia..."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toastError("Error al activar", msg);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-orange-600" />
            <h2 className="text-sm font-semibold text-stone-900">
              Marketing Autopilot
            </h2>
          </div>
          <p className="text-xs text-stone-500 mb-4 max-w-md">
            El CMO Agent analiza tu perfil de marca y genera automaticamente una
            estrategia completa: pilares de contenido, calendario semanal,
            campanas de ads, SEO y email marketing.
          </p>

          {/* Pre-launch checklist */}
          <div className="space-y-1.5 mb-4">
            {checks.map((check) => (
              <div key={check.label} className="flex items-center gap-2">
                {check.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-stone-300" />
                )}
                <span
                  className={`text-xs ${
                    check.passed ? "text-stone-700" : "text-stone-400"
                  }`}
                >
                  {check.label}
                  {check.required && !check.passed && (
                    <span className="text-red-400 ml-1">(requerido)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          <Shield className="h-16 w-16 text-orange-200" />
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={launching || !allRequiredPassed}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {launching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generando estrategia...
          </>
        ) : (
          <>
            <Rocket className="h-4 w-4" />
            Activar Marketing Autopilot
          </>
        )}
      </button>

      {!allRequiredPassed && (
        <p className="text-[10px] text-stone-400 mt-2">
          Completa todos los requisitos en{" "}
          <a href="/brand" className="text-orange-500 hover:underline">
            Perfil de Marca
          </a>{" "}
          para activar el autopilot.
        </p>
      )}
    </div>
  );
}
