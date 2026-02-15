"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Shield,
  Send,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function StrategyLauncher() {
  const { success, error: toastError } = useToast();
  const [launching, setLaunching] = useState(false);
  const [goal, setGoal] = useState("");

  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const brandMaturity = useQuery(api.brandMaturity.computeBrandMaturity);
  const launchStrategy = useMutation(api.cmoEngine.launchStrategy);
  const launchFromGoal = useMutation(api.cmoEngine.launchStrategyFromGoal);

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
      if (goal.trim()) {
        await launchFromGoal({ goal: goal.trim(), brandProfileId: brandProfile._id });
        success(
          "CMO activado",
          `Generando estrategia para: "${goal.trim().slice(0, 50)}..."`
        );
      } else {
        await launchStrategy({ brandProfileId: brandProfile._id });
        success(
          "Marketing Autopilot activado",
          "El CMO está analizando tu marca y generando la estrategia..."
        );
      }
      setGoal("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toastError("Error al activar", msg);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-orange-50/80 via-white to-amber-50/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Marketing Autopilot
            </h2>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mb-4 max-w-md">
            Define un objetivo o deja que el CMO analice tu marca y genere
            automaticamente una estrategia completa.
          </p>

          {/* Goal Input */}
          {allRequiredPassed && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all mb-4">
              <Sparkles className="h-4 w-4 text-[var(--accent)] ml-3 shrink-0" />
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !launching && handleLaunch()}
                placeholder="Ej: Aumentar engagement en LinkedIn 30%..."
                disabled={launching}
                className="flex-1 py-2.5 pr-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] bg-transparent outline-none disabled:opacity-50"
              />
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                {launching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {goal.trim() ? "Lanzar" : "Autopilot"}
              </button>
            </div>
          )}

          {/* Pre-launch checklist */}
          {!allRequiredPassed && (
            <div className="space-y-1.5 mb-4">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center gap-2">
                  {check.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  )}
                  <span
                    className={`text-xs ${
                      check.passed ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                    }`}
                  >
                    {check.label}
                    {check.required && !check.passed && (
                      <span className="text-[var(--error)] ml-1">(requerido)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Shield className="h-16 w-16 text-orange-200" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!allRequiredPassed && (
          <button
            onClick={handleLaunch}
            disabled={launching || !allRequiredPassed}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Activar
              </>
            )}
          </button>
        )}
        <Link
          href="/strategy"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--accent)] hover:text-orange-800 transition-colors"
        >
          Ver todas las estrategias
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!allRequiredPassed && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
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
