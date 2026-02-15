"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandContext } from "@/hooks/useBrandContext";

interface Violation {
  text: string;
  rule: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
}

interface ComplianceResult {
  score: number;
  violations: Violation[];
  suggestions: string[];
  status: "success" | "error";
}

interface BrandCompliancePanelProps {
  content: string;
  contentId?: Id<"content">;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: typeof AlertTriangle }> = {
  high: { bg: "bg-[var(--badge-red-bg)] border-[var(--badge-red-bg)]", text: "text-[var(--badge-red-text)]", icon: XCircle },
  medium: { bg: "bg-[var(--badge-amber-bg)] border-amber-200", text: "text-[var(--badge-amber-text)]", icon: AlertTriangle },
  low: { bg: "bg-[var(--badge-blue-bg)] border-blue-200", text: "text-[var(--badge-blue-text)]", icon: AlertTriangle },
};

export function BrandCompliancePanel({ content }: BrandCompliancePanelProps) {
  const { activeBrandId } = useBrandContext();
  const checkCompliance = useAction(api.brandCompliance.checkBrandCompliance);

  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleCheck = async () => {
    if (!activeBrandId || !content.trim() || isChecking) return;

    setIsChecking(true);
    try {
      const res = await checkCompliance({
        brandProfileId: activeBrandId,
        content,
      });
      setResult(res as ComplianceResult);
    } catch {
      setResult({
        score: 0,
        violations: [],
        suggestions: ["Error al verificar compliance."],
        status: "error",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const scoreColor =
    result && result.score >= 80
      ? "text-[var(--badge-green-text)]"
      : result && result.score >= 50
        ? "text-[var(--badge-amber-text)]"
        : "text-[var(--badge-red-text)]";

  const scoreTrackColor =
    result && result.score >= 80
      ? "stroke-green-500"
      : result && result.score >= 50
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--brand-accent)" }} />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Brand Compliance
          </h3>
        </div>
        <button
          onClick={handleCheck}
          disabled={isChecking || !content.trim() || !activeBrandId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--brand-accent)",
            color: "white",
          }}
        >
          {isChecking ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              Verificar Marca
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="p-4 space-y-4">
          {/* Score gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="var(--surface-2)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  className={scoreTrackColor}
                  strokeWidth="3"
                  strokeDasharray={`${result.score} ${100 - result.score}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", scoreColor)}>
                {result.score}
              </span>
            </div>
            <div>
              <p className={cn("text-lg font-bold", scoreColor)}>
                {result.score >= 80 ? "Cumple" : result.score >= 50 ? "Parcial" : "No cumple"}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {result.violations.length} violaciones encontradas
              </p>
            </div>
          </div>

          {/* Violations */}
          {result.violations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Violaciones
              </p>
              {result.violations.map((violation, i) => {
                const style = SEVERITY_STYLES[violation.severity] || SEVERITY_STYLES.medium;
                const SeverityIcon = style.icon;
                return (
                  <div key={i} className={cn("rounded-lg border p-3", style.bg)}>
                    <div className="flex items-start gap-2">
                      <SeverityIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", style.text)} />
                      <div className="min-w-0">
                        <p className={cn("text-xs font-medium", style.text)}>
                          {violation.rule}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 italic">
                          &ldquo;{violation.text}&rdquo;
                        </p>
                        <p className="text-xs text-[var(--text-primary)] mt-1">
                          <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />
                          {violation.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Sugerencias
              </p>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--brand-accent)] mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Brand rules reference */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", showRules && "rotate-180")} />
            Reglas de marca
          </button>
          {showRules && (
            <div className="text-[11px] text-[var(--text-tertiary)] bg-[var(--surface-1)] rounded-lg p-3 space-y-1">
              <p>Las reglas de marca se extraen de tu perfil de marca (tono, personalidad, vocabulario).</p>
              <p>Configura reglas mas detalladas en la seccion de Marca.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !isChecking && (
        <div className="p-6 text-center">
          <ShieldCheck className="h-8 w-8 mx-auto text-[var(--text-tertiary)] mb-2" />
          <p className="text-xs text-[var(--text-tertiary)]">
            Haz clic en &ldquo;Verificar Marca&rdquo; para analizar el contenido contra las reglas de tu marca.
          </p>
        </div>
      )}
    </div>
  );
}
