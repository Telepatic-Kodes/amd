"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Palette, Loader2, Database, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

import { BrandStepBasics } from "@/components/brand/BrandStepBasics";
import { BrandStepVoice } from "@/components/brand/BrandStepVoice";
import { BrandStepAudience } from "@/components/brand/BrandStepAudience";
import { BrandStepStrategy } from "@/components/brand/BrandStepStrategy";
import { BrandStepCompetitors } from "@/components/brand/BrandStepCompetitors";
import { BrandStepVisual } from "@/components/brand/BrandStepVisual";
import { BrandMaturityBar } from "@/components/brand/BrandMaturityBar";
import { BrandProfileSummary } from "@/components/brand/BrandProfileSummary";
import { BrandSuggestionsPanel } from "@/components/brand/BrandSuggestionsPanel";
import { BrandSourcesList } from "@/components/brand/BrandSourcesList";
import { AddSourceDialog } from "@/components/brand/AddSourceDialog";
import dynamic from "next/dynamic";

const GenerateContentModal = dynamic(
  () => import("@/components/content/GenerateContentModal").then((m) => m.GenerateContentModal),
  { ssr: false }
);
import { BrandOnboardingChoice } from "@/components/brand/BrandOnboardingChoice";
import { BrandUploadFlow } from "@/components/brand/BrandUploadFlow";

const TOTAL_STEPS = 6;

const stepLabels = [
  { title: "Información básica", subtitle: "Nombre, industria y descripción" },
  { title: "Voz de marca", subtitle: "Tono, personalidad y reglas de comunicación" },
  { title: "Audiencia", subtitle: "Segmentos y pain points de tu público" },
  { title: "Estrategia", subtitle: "Temas, canales y frecuencia" },
  { title: "Competencia", subtitle: "Competidores y referencias" },
  { title: "Identidad visual", subtitle: "Colores, logo y estilo" },
];

interface BrandData {
  companyName: string;
  industry: string;
  website: string;
  description: string;
  voice: {
    tone: string[];
    personality: string[];
    dos: string[];
    donts: string[];
  };
  audience: {
    segments: Array<{
      name: string;
      demographics: string;
      painPoints: string[];
    }>;
  };
  strategy: {
    topics: string[];
    channels: string[];
    postingFrequency: string;
  };
  competitors: Array<{
    name: string;
    url: string;
    notes: string;
  }>;
  references: string[];
  visual: {
    primaryColor: string;
    secondaryColor: string;
    logoDescription: string;
    styleNotes: string;
  };
}

const DEFAULT_DATA: BrandData = {
  companyName: "",
  industry: "",
  website: "",
  description: "",
  voice: { tone: [], personality: [], dos: [], donts: [] },
  audience: { segments: [] },
  strategy: { topics: [], channels: [], postingFrequency: "" },
  competitors: [],
  references: [],
  visual: { primaryColor: "", secondaryColor: "", logoDescription: "", styleNotes: "" },
};

export default function BrandPage() {
  const profile = useQuery(api.brandProfile.getBrandProfile);
  const saveBrandProfile = useMutation(api.brandProfile.saveBrandProfile);
  const syncBrandToKB = useAction(api.brandProfile.syncBrandToKB);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [kbSyncing, setKbSyncing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [data, setData] = useState<BrandData>(DEFAULT_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<"choice" | "upload" | "manual" | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const maturity = useQuery(api.brandMaturity.computeBrandMaturity);

  const { success, error: showError } = useToast();

  // Populate form from existing profile
  useEffect(() => {
    if (profile && !isEditing) {
      setData({
        companyName: profile.companyName,
        industry: profile.industry,
        website: profile.website || "",
        description: profile.description,
        voice: profile.voice,
        audience: {
          segments: profile.audience.segments.map((s: { name: string; demographics?: string; painPoints: string[] }) => ({
            name: s.name,
            demographics: s.demographics || "",
            painPoints: s.painPoints,
          })),
        },
        strategy: {
          topics: profile.strategy.topics,
          channels: profile.strategy.channels,
          postingFrequency: profile.strategy.postingFrequency || "",
        },
        competitors: profile.competitors.map((c: { name: string; url?: string; notes?: string }) => ({
          name: c.name,
          url: c.url || "",
          notes: c.notes || "",
        })),
        references: profile.references || [],
        visual: {
          primaryColor: profile.visual?.primaryColor || "",
          secondaryColor: profile.visual?.secondaryColor || "",
          logoDescription: profile.visual?.logoDescription || "",
          styleNotes: profile.visual?.styleNotes || "",
        },
      });
    }
  }, [profile, isEditing]);

  // A. Load draft from localStorage on mount (only when no existing profile)
  useEffect(() => {
    if (profile === undefined) return; // query still loading
    if (profile) return; // existing profile takes precedence
    try {
      const saved = localStorage.getItem("amd-brand-draft");
      if (saved) {
        setData(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, [profile]);

  // B. Auto-save draft to localStorage with 500ms debounce
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isEditing && profile) return; // only save in wizard/edit mode
    draftTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("amd-brand-draft", JSON.stringify(data));
      } catch {
        // ignore quota errors
      }
    }, 500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [data, isEditing, profile]);

  const hasCompletedProfile = profile && profile.status === "complete" && !isEditing;

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
        return true; // Competitors are optional
      case 5:
        return true; // Visual identity is optional
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileId = await saveBrandProfile({
        companyName: data.companyName,
        industry: data.industry,
        website: data.website || undefined,
        description: data.description,
        voice: data.voice,
        audience: data.audience,
        strategy: data.strategy,
        competitors: data.competitors.filter((c) => c.name.trim() !== ""),
        references: data.references.length > 0 ? data.references : undefined,
        visual: {
          primaryColor: data.visual.primaryColor || undefined,
          secondaryColor: data.visual.secondaryColor || undefined,
          logoDescription: data.visual.logoDescription || undefined,
          styleNotes: data.visual.styleNotes || undefined,
        },
      });

      // Sync to KB
      setKbSyncing(true);
      await syncBrandToKB({ brandProfileId: profileId });
      setKbSyncing(false);

      // C. Clear draft on successful save
      localStorage.removeItem("amd-brand-draft");

      setIsEditing(false);
      success("Marca guardada", "Tu perfil de marca se ha sincronizado con la Knowledge Base.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message || "No se pudo guardar el perfil de marca.");
    } finally {
      setSaving(false);
      setKbSyncing(false);
    }
  };

  const handleResync = async () => {
    if (!profile) return;
    setKbSyncing(true);
    try {
      await syncBrandToKB({ brandProfileId: profile._id });
      success("KB sincronizada", "La Knowledge Base de marca se ha actualizado.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message || "No se pudo sincronizar la KB.");
    } finally {
      setKbSyncing(false);
    }
  };

  // Merge AI-extracted partial data into the default BrandData shape
  const mergeBrandData = (base: BrandData, partial: Record<string, unknown>): BrandData => {
    const result = { ...base };

    // Simple string fields
    const stringKeys = ["companyName", "industry", "website", "description"] as const;
    for (const key of stringKeys) {
      const val = partial[key];
      if (typeof val === "string" && val.trim()) {
        result[key] = val;
      }
    }

    // Voice (nested object with string arrays)
    if (partial.voice && typeof partial.voice === "object") {
      const v = partial.voice as Record<string, unknown>;
      const voiceKeys = ["tone", "personality", "dos", "donts"] as const;
      for (const k of voiceKeys) {
        if (Array.isArray(v[k]) && v[k].length > 0) {
          result.voice = { ...result.voice, [k]: v[k] };
        }
      }
    }

    // Audience segments
    if (partial.audience && typeof partial.audience === "object") {
      const a = partial.audience as { segments?: unknown[] };
      if (Array.isArray(a.segments) && a.segments.length > 0) {
        result.audience = {
          segments: a.segments.map((s: Record<string, unknown>) => ({
            name: String(s.name || ""),
            demographics: String(s.demographics || ""),
            painPoints: Array.isArray(s.painPoints) ? s.painPoints : [],
          })),
        };
      }
    }

    // Strategy
    if (partial.strategy && typeof partial.strategy === "object") {
      const s = partial.strategy as Record<string, unknown>;
      if (Array.isArray(s.topics) && s.topics.length > 0) result.strategy.topics = s.topics;
      if (Array.isArray(s.channels) && s.channels.length > 0) result.strategy.channels = s.channels;
      if (typeof s.postingFrequency === "string" && s.postingFrequency) {
        result.strategy = { ...result.strategy, postingFrequency: s.postingFrequency };
      }
    }

    // Competitors
    if (Array.isArray(partial.competitors) && partial.competitors.length > 0) {
      result.competitors = (partial.competitors as Record<string, unknown>[]).map((c) => ({
        name: String(c.name || ""),
        url: String(c.url || ""),
        notes: String(c.notes || ""),
      }));
    }

    // References
    if (Array.isArray(partial.references) && partial.references.length > 0) {
      result.references = partial.references as string[];
    }

    // Visual
    if (partial.visual && typeof partial.visual === "object") {
      const vis = partial.visual as Record<string, unknown>;
      const visKeys = ["primaryColor", "secondaryColor", "logoDescription", "styleNotes"] as const;
      for (const k of visKeys) {
        if (typeof vis[k] === "string" && (vis[k] as string).trim()) {
          result.visual = { ...result.visual, [k]: vis[k] as string };
        }
      }
    }

    return result;
  };

  const handleExtracted = (partial: Record<string, unknown>) => {
    setData((d) => mergeBrandData(d, partial));
    setPrefilled(true);
    setOnboardingMode("manual");
    success("Información extraída", "Revisa y ajusta cada paso antes de guardar");
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
            onChange={(partial) => setData((d) => ({ ...d, ...partial }))}
          />
        );
      case 1:
        return (
          <BrandStepVoice
            data={data.voice}
            onChange={(partial) => setData((d) => ({ ...d, voice: { ...d.voice, ...partial } }))}
          />
        );
      case 2:
        return (
          <BrandStepAudience
            data={data.audience}
            onChange={(partial) => setData((d) => ({ ...d, audience: { ...d.audience, ...partial } }))}
          />
        );
      case 3:
        return (
          <BrandStepStrategy
            data={data.strategy}
            onChange={(partial) => setData((d) => ({ ...d, strategy: { ...d.strategy, ...partial } }))}
          />
        );
      case 4:
        return (
          <BrandStepCompetitors
            data={{ competitors: data.competitors, references: data.references }}
            onChange={(partial) =>
              setData((d) => ({
                ...d,
                competitors: partial.competitors ?? d.competitors,
                references: partial.references ?? d.references,
              }))
            }
          />
        );
      case 5:
        return (
          <BrandStepVisual
            data={data.visual}
            onChange={(partial) => setData((d) => ({ ...d, visual: { ...d.visual, ...partial } }))}
          />
        );
      default:
        return null;
    }
  };

  const currentLabel = stepLabels[step];

  // If profile is complete and not editing, show intelligence hub
  if (hasCompletedProfile) {
    return (
      <div className="space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50">
              <Palette className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-stone-900">
                  {profile.companyName}
                </h1>
                {maturity && (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      maturity.level === "empty" && "bg-red-50 border-red-200 text-red-700",
                      maturity.level === "partial" && "bg-amber-50 border-amber-200 text-amber-700",
                      maturity.level === "complete" && "bg-green-50 border-green-200 text-green-700",
                      maturity.level === "enriched" && "bg-orange-50 border-orange-200 text-orange-700"
                    )}
                  >
                    {maturity.level === "empty" && "Vacía"}
                    {maturity.level === "partial" && "Parcial"}
                    {maturity.level === "complete" && "Completa"}
                    {maturity.level === "enriched" && "Enriquecida"}
                  </span>
                )}
              </div>
              <p className="text-stone-500 mt-0.5 text-sm">
                Centro de Inteligencia de Marca
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEditing(true);
              setStep(0);
            }}
            className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition"
          >
            Editar perfil
          </button>
        </div>

        {/* Maturity bar */}
        {maturity && (
          <div className="p-4 rounded-xl border border-stone-200 bg-white">
            <BrandMaturityBar
              score={maturity.score}
              level={maturity.level}
              breakdown={maturity.breakdown}
            />
          </div>
        )}

        {/* Three-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              Perfil de Marca
            </h3>
            <BrandProfileSummary
              data={{
                companyName: profile.companyName,
                industry: profile.industry,
                website: profile.website,
                description: profile.description,
                voice: profile.voice,
                audience: {
                  segments: profile.audience.segments.map((s: { name: string; demographics?: string; painPoints: string[] }) => ({
                    name: s.name,
                    demographics: s.demographics,
                    painPoints: s.painPoints,
                  })),
                },
                strategy: profile.strategy,
                competitors: profile.competitors,
                visual: profile.visual,
              }}
              onEditSection={(step) => {
                setIsEditing(true);
                setStep(step);
              }}
            />
          </div>

          {/* Center: AI Suggestions */}
          <div>
            <BrandSuggestionsPanel brandProfileId={profile._id} />
          </div>

          {/* Right: Sources */}
          <div>
            <BrandSourcesList
              brandProfileId={profile._id}
              onAddSource={() => setShowAddSource(true)}
            />
          </div>
        </div>

        {/* Footer row: KB Status + CTA */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", profile.kbId ? "bg-green-50" : "bg-yellow-50")}>
              <Database className={cn("w-5 h-5", profile.kbId ? "text-green-600" : "text-yellow-600")} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Knowledge Base</p>
              <p className="text-xs text-stone-500">
                {profile.kbId ? "Activa — Todos los agentes tienen acceso" : "No sincronizada"}
              </p>
            </div>
            <button
              onClick={handleResync}
              disabled={kbSyncing}
              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 ml-2"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", kbSyncing && "animate-spin")} />
              {kbSyncing ? "Sincronizando..." : "Re-sincronizar"}
            </button>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generar Contenido
          </button>
        </div>

        {/* Modals */}
        {showGenerateModal && (
          <GenerateContentModal
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            defaultChannels={profile.strategy.channels}
          />
        )}
        <AddSourceDialog
          brandProfileId={profile._id}
          isOpen={showAddSource}
          onClose={() => setShowAddSource(false)}
        />
      </div>
    );
  }

  // Smart Onboarding: show choice screen when no profile and not in manual mode
  if (profile === null && onboardingMode !== "manual") {
    if (onboardingMode === "upload") {
      return (
        <BrandUploadFlow
          onExtracted={handleExtracted}
          onBack={() => setOnboardingMode("choice")}
          onSkip={() => setOnboardingMode("manual")}
        />
      );
    }
    // Default: choice screen
    return (
      <BrandOnboardingChoice
        onUpload={() => setOnboardingMode("upload")}
        onManual={() => setOnboardingMode("manual")}
      />
    );
  }

  // Wizard mode
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Prefilled banner */}
      {prefilled && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-800">
            Hemos pre-llenado el formulario con la información extraída. Revisa y ajusta cada paso.
          </p>
        </div>
      )}

      {/* Header with Progress */}
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-purple-50">
            <Palette className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              {currentLabel.title}
            </h1>
            <p className="text-stone-500 text-sm">
              {currentLabel.subtitle}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
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
        <p className="text-xs text-stone-400 mt-3">
          Paso {step + 1} de {TOTAL_STEPS}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-4">
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
      <div className="border-t border-stone-200 py-4 mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={
              step === 0 && isEditing
                ? () => setIsEditing(false)
                : step === 0 && !profile
                  ? () => { setOnboardingMode("choice"); setPrefilled(false); }
                  : back
            }
            disabled={step === 0 && !isEditing && !!profile}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition",
              step === 0 && !isEditing && !!profile
                ? "text-stone-300 cursor-not-allowed"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Atrás
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
              onClick={handleSave}
              disabled={saving || kbSyncing}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-semibold transition",
                saving || kbSyncing
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 text-white"
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {kbSyncing ? "Sincronizando KB..." : "Guardando..."}
                </>
              ) : (
                "Guardar y Activar"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
