"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Send, Loader2, Brain, Sparkles, Target, TrendingUp, Users, Megaphone } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const GOAL_SUGGESTIONS = [
  { icon: TrendingUp, text: "Aumentar engagement en LinkedIn un 30%", color: "text-blue-600 bg-blue-50" },
  { icon: Users, text: "Generar 50 leads cualificados este mes", color: "text-green-600 bg-green-50" },
  { icon: Target, text: "Posicionar marca como lider en mi industria", color: "text-purple-600 bg-purple-50" },
  { icon: Megaphone, text: "Lanzar campana de contenido para nuevo producto", color: "text-orange-600 bg-orange-50" },
];

interface StrategyGoalInputProps {
  brandProfileId: Id<"brandProfiles">;
}

export function StrategyGoalInput({ brandProfileId }: StrategyGoalInputProps) {
  const { success, error: toastError } = useToast();
  const [goal, setGoal] = useState("");
  const [launching, setLaunching] = useState(false);

  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);
  const launchFromGoal = useMutation(api.cmoEngine.launchStrategyFromGoal);
  const launchDefault = useMutation(api.cmoEngine.launchStrategy);

  const hasActiveStrategy = activeStrategy && !["failed", "completed"].includes(activeStrategy.status);

  async function handleSubmit() {
    if (hasActiveStrategy) {
      toastError("Estrategia activa", "Ya tienes una estrategia activa. Completa o archiva la actual primero.");
      return;
    }

    setLaunching(true);
    try {
      if (goal.trim()) {
        await launchFromGoal({ goal: goal.trim(), brandProfileId });
        success(
          "CMO activado",
          `Generando estrategia para: "${goal.trim().slice(0, 50)}..."`
        );
      } else {
        await launchDefault({ brandProfileId });
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
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-orange-100">
          <Brain className="h-4 w-4 text-orange-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Nueva Estrategia</h3>
          <p className="text-[10px] text-stone-500">Define tu objetivo y el CMO crea la estrategia completa</p>
        </div>
      </div>

      {/* Goal Input */}
      <div className="relative mb-3">
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <Sparkles className="h-4 w-4 text-orange-400 ml-3 shrink-0" />
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !launching && handleSubmit()}
            placeholder="Ej: Aumentar engagement en LinkedIn un 30% este trimestre..."
            disabled={launching || !!hasActiveStrategy}
            className="flex-1 py-3 pr-2 text-sm text-stone-900 placeholder:text-stone-400 bg-transparent outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={launching || !!hasActiveStrategy}
            className="inline-flex items-center gap-1.5 px-4 py-2 mr-1.5 text-xs font-medium rounded-md bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {launching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                {goal.trim() ? "Lanzar" : "Autopilot"}
              </>
            )}
          </button>
        </div>
        {hasActiveStrategy && (
          <p className="text-[10px] text-amber-600 mt-1.5">
            Ya tienes una estrategia activa. Ve a la{" "}
            <span className="font-medium">estrategia actual</span> o archivala para crear una nueva.
          </p>
        )}
      </div>

      {/* Quick Goal Suggestions */}
      {!hasActiveStrategy && (
        <div className="flex flex-wrap gap-2">
          {GOAL_SUGGESTIONS.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.text}
                onClick={() => setGoal(suggestion.text)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:border-orange-200 hover:shadow-sm transition-all text-left group"
              >
                <Icon className={`h-3 w-3 ${suggestion.color.split(" ")[0]}`} />
                <span className="text-[10px] text-stone-600 group-hover:text-stone-900 transition-colors">
                  {suggestion.text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
