"use client";

import { useState, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Linkedin,
  Twitter,
  Instagram,
  Video,
  BookOpen,
  Mail,
  Youtube,
  FileText,
  ArrowLeft,
  Hash,
  Lightbulb,
  PenLine,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "blog", label: "Blog", icon: BookOpen, color: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30" },
  { id: "email", label: "Newsletter", icon: Mail, color: "bg-green-500/10 text-[var(--success)] border-green-500/30" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-500/10 text-[var(--error)] border-red-500/30" },
];

interface ChannelResult {
  channel: string;
  contentId: string | null;
  success: boolean;
  error?: string;
}

interface GenerateResponse {
  results: ChannelResult[];
  successful: number;
  failed: number;
  totalChannels: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultChannels?: string[];
}

// Category display names and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  social: { label: "Social", color: "bg-sky-100 text-sky-700" },
  blog: { label: "Blog", color: "bg-orange-100 text-[var(--accent)]" },
  email: { label: "Email", color: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]" },
  ads: { label: "Ads", color: "bg-purple-100 text-[var(--badge-purple-text)]" },
  misc: { label: "Otro", color: "bg-[var(--surface-1)] text-[var(--text-secondary)]" },
};

// Build smart suggestions from strategy pillars
interface ContentSuggestion {
  id: string;
  topic: string;
  description: string;
  channels: string[];
  pillarName: string;
  icon: "lightbulb" | "target" | "zap";
  color: string;
}

const SUGGESTION_COLORS = [
  "border-orange-300 bg-[var(--accent-subtle)]/40 hover:bg-[var(--accent-subtle)]/70",
  "border-sky-300 bg-sky-500/5 hover:bg-sky-500/10",
  "border-purple-300 bg-purple-500/5 hover:bg-purple-500/10",
  "border-pink-300 bg-pink-500/5 hover:bg-pink-500/10",
  "border-green-300 bg-green-500/5 hover:bg-green-500/10",
  "border-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10",
];

const SUGGESTION_ICONS: ("lightbulb" | "target" | "zap")[] = ["lightbulb", "target", "zap"];

function SuggestionIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case "target": return <Target className={className} />;
    case "zap": return <Zap className={className} />;
    default: return <Lightbulb className={className} />;
  }
}

export function GenerateContentModal({ isOpen, onClose, defaultChannels = [] }: Props) {
  const generateContent = useAction(api.multiChannelGenerate.generateMultiChannelContent);
  const templates = useQuery(api.contentTemplates.getActiveTemplates);
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const strategy = useQuery(api.cmoEngine.getActiveStrategy);
  const pillars = useQuery(api.contentPillars.getActivePillars);
  const { success: showSuccess, error: showError } = useToast();

  // Build suggestions from brand profile topics, strategy pillars, and content pillars
  const suggestions = useMemo<ContentSuggestion[]>(() => {
    const items: ContentSuggestion[] = [];

    // Source 1: Brand profile strategy topics (most commonly populated)
    if (brandProfile?.strategy) {
      const bpStrategy = brandProfile.strategy as { topics?: string[]; channels?: string[] };
      const bpChannels = (bpStrategy.channels || [])
        .map((ch: string) => {
          const lower = ch.toLowerCase();
          if (lower.includes("linkedin")) return "linkedin";
          if (lower.includes("twitter") || lower.includes("x")) return "twitter";
          if (lower.includes("instagram")) return "instagram";
          if (lower.includes("tiktok")) return "tiktok";
          if (lower.includes("blog")) return "blog";
          if (lower.includes("email") || lower.includes("newsletter")) return "email";
          if (lower.includes("youtube")) return "youtube";
          return null;
        })
        .filter((ch): ch is string => ch !== null);

      // Default to top 3 channels for suggestions
      const topChannels = bpChannels.slice(0, 3).length > 0 ? bpChannels.slice(0, 3) : ["instagram", "linkedin", "blog"];

      (bpStrategy.topics || []).forEach((topic, idx) => {
        items.push({
          id: `brand-${idx}`,
          topic,
          description: brandProfile.companyName || "Tu marca",
          channels: topChannels,
          pillarName: brandProfile.companyName || "Estrategia",
          icon: SUGGESTION_ICONS[idx % SUGGESTION_ICONS.length],
          color: SUGGESTION_COLORS[idx % SUGGESTION_COLORS.length],
        });
      });
    }

    // Source 2: CMO Strategy content pillars (richest data, if available)
    if (strategy?.strategy?.contentPillars) {
      strategy.strategy.contentPillars.forEach((pillar, pIdx) => {
        pillar.topics.forEach((topic, tIdx) => {
          // Skip if already covered by brand profile topics
          if (items.some((i) => i.topic.toLowerCase() === topic.toLowerCase())) return;

          const mappedChannels = pillar.channels
            .map((ch: string) => {
              const lower = ch.toLowerCase();
              if (lower.includes("linkedin")) return "linkedin";
              if (lower.includes("twitter") || lower.includes("x")) return "twitter";
              if (lower.includes("instagram")) return "instagram";
              if (lower.includes("tiktok")) return "tiktok";
              if (lower.includes("blog")) return "blog";
              if (lower.includes("email") || lower.includes("newsletter")) return "email";
              if (lower.includes("youtube")) return "youtube";
              return null;
            })
            .filter((ch): ch is string => ch !== null);

          items.push({
            id: `strategy-${pIdx}-${tIdx}`,
            topic,
            description: pillar.description,
            channels: mappedChannels.length > 0 ? mappedChannels : ["instagram", "linkedin", "blog"],
            pillarName: pillar.name,
            icon: SUGGESTION_ICONS[(pIdx + items.length) % SUGGESTION_ICONS.length],
            color: SUGGESTION_COLORS[(pIdx + items.length) % SUGGESTION_COLORS.length],
          });
        });
      });
    }

    // Source 3: Content pillars table (fallback)
    if (items.length < 3 && pillars && pillars.length > 0) {
      pillars.forEach((pillar, idx) => {
        if (pillar.keywords && pillar.keywords.length > 0) {
          items.push({
            id: `pillar-${idx}`,
            topic: `${pillar.name}: ${pillar.keywords.slice(0, 2).join(" y ")}`,
            description: pillar.description,
            channels: ["instagram", "linkedin", "blog"],
            pillarName: pillar.name,
            icon: SUGGESTION_ICONS[idx % SUGGESTION_ICONS.length],
            color: SUGGESTION_COLORS[(idx + 2) % SUGGESTION_COLORS.length],
          });
        }
      });
    }

    return items;
  }, [brandProfile, strategy, pillars]);

  const [mode, setMode] = useState<"select" | "free" | "template">("select");
  const [selectedTemplate, setSelectedTemplate] = useState<{
    templateId: string;
    name: string;
    promptTemplate: string;
    channels: string[];
    category: string;
    description: string;
  } | null>(null);
  const [topic, setTopic] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(defaultChannels);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ChannelResult[] | null>(null);
  const [channelStatus, setChannelStatus] = useState<Record<string, "pending" | "running" | "done" | "error">>({});

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedChannels.length === 0) return;

    setIsGenerating(true);
    setResults(null);

    // Set all channels to running
    const initialStatus: Record<string, "pending" | "running" | "done" | "error"> = {};
    selectedChannels.forEach((ch) => (initialStatus[ch] = "running"));
    setChannelStatus(initialStatus);

    try {
      const response = await generateContent({
        topic: topic.trim(),
        channels: selectedChannels,
        customInstructions: customInstructions.trim() || undefined,
        templateId: selectedTemplate?.templateId || undefined,
        templatePrompt: selectedTemplate?.promptTemplate || undefined,
      }) as GenerateResponse;

      // Update status based on results
      const finalStatus: Record<string, "pending" | "running" | "done" | "error"> = {};
      response.results.forEach((r) => {
        finalStatus[r.channel] = r.success ? "done" : "error";
      });
      setChannelStatus(finalStatus);
      setResults(response.results);

      if (response.successful > 0) {
        showSuccess(
          "Contenido generado",
          `${response.successful} de ${response.totalChannels} piezas creadas exitosamente.`
        );
      }
      if (response.failed > 0) {
        showError(
          "Algunos fallaron",
          `${response.failed} canal(es) tuvieron errores.`
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message || "No se pudo generar el contenido.");
      selectedChannels.forEach((ch) => {
        setChannelStatus((prev) => ({ ...prev, [ch]: "error" }));
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setMode("select");
      setSelectedTemplate(null);
      setTopic("");
      setSelectedChannels(defaultChannels);
      setCustomInstructions("");
      setResults(null);
      setChannelStatus({});
      onClose();
    }
  };

  const handleSelectTemplate = (template: NonNullable<typeof templates>[number]) => {
    setSelectedTemplate({
      templateId: template.templateId,
      name: template.name,
      promptTemplate: template.promptTemplate,
      channels: template.channels,
      category: template.category,
      description: template.description,
    });
    // Pre-fill form from template
    setTopic(template.name);
    setSelectedChannels(
      template.channels.filter((ch: string) => CHANNELS.some((c) => c.id === ch))
    );
    setCustomInstructions("");
    // Switch to free mode with template data pre-filled
    setMode("free");
  };

  const handleBackToSelect = () => {
    setMode("select");
    setSelectedTemplate(null);
    setTopic("");
    setSelectedChannels(defaultChannels);
    setCustomInstructions("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg mx-4 bg-[var(--surface-0)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Generar Contenido</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Step 0: Suggestions + Fallback Options */}
          {mode === "select" && !isGenerating && !results && (
            <div className="space-y-4">
              {/* Smart Suggestions from Strategy */}
              {suggestions.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[var(--accent)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Sugerencias de tu estrategia</p>
                  </div>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => {
                          setTopic(suggestion.topic);
                          setSelectedChannels(suggestion.channels);
                          // Build contextual instructions from brand voice
                          const voice = brandProfile?.voice as { tone?: string[]; dos?: string[] } | undefined;
                          const toneStr = voice?.tone?.slice(0, 3).join(", ") || "";
                          const instructions = toneStr
                            ? `Tono: ${toneStr}. Tema enfocado en: ${suggestion.topic}`
                            : `Tema enfocado en: ${suggestion.topic}`;
                          setCustomInstructions(instructions);
                          setMode("free");
                        }}
                        className={cn(
                          "w-full p-3 rounded-xl border transition-all text-left group",
                          suggestion.color
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <SuggestionIcon icon={suggestion.icon} className="w-4 h-4 mt-0.5 text-[var(--text-secondary)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                              {suggestion.topic}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
                              {suggestion.pillarName}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {suggestion.channels.slice(0, 3).map((ch) => {
                              const channelDef = CHANNELS.find((c) => c.id === ch);
                              if (!channelDef) return null;
                              const Icon = channelDef.icon;
                              return <Icon key={ch} className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />;
                            })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Sparkles className="w-6 h-6 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">Genera una estrategia para ver sugerencias inteligentes</p>
                </div>
              )}

              {/* Fallback options */}
              <div className="border-t border-[var(--border)] pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("free")}
                    className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:border-orange-300 hover:bg-[var(--accent-subtle)]/50 transition-all text-left"
                  >
                    <PenLine className="h-4 w-4 text-[var(--accent)] shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">Tema personalizado</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode("template")}
                    className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] hover:border-purple-300 hover:bg-[var(--badge-purple-bg)]/50 transition-all text-left"
                  >
                    <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">Usar template</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 0b: Template Picker */}
          {mode === "template" && !isGenerating && !results && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToSelect}
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-sm font-medium text-[var(--text-secondary)]">Elige un template</p>
              </div>
              {!templates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">No hay templates disponibles</p>
                  <button
                    onClick={() => setMode("free")}
                    className="mt-3 text-sm text-orange-500 hover:text-[var(--accent)] font-medium"
                  >
                    Usar tema libre
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {templates.map((template) => {
                    const catConfig = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.misc;
                    return (
                      <button
                        key={template._id}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full p-3 rounded-xl border border-[var(--border)] hover:border-purple-300 hover:bg-[var(--badge-purple-bg)]/30 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-purple-900 truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", catConfig.color)}>
                            {catConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {template.channels.slice(0, 3).map((ch: string) => {
                            const channelDef = CHANNELS.find((c) => c.id === ch);
                            return channelDef ? (
                              <span key={ch} className="text-[10px] text-[var(--text-tertiary)] bg-[var(--surface-1)] px-1.5 py-0.5 rounded">
                                {channelDef.label}
                              </span>
                            ) : null;
                          })}
                          {template.channels.length > 3 && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              +{template.channels.length - 3} mas
                            </span>
                          )}
                          {template.usageCount ? (
                            <span className="text-[10px] text-[var(--text-tertiary)] ml-auto flex items-center gap-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              {template.usageCount} usos
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Free mode form (topic + channels + instructions) */}
          {mode === "free" && (
            <>
              {/* Back button + template badge */}
              {!isGenerating && !results && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackToSelect}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {selectedTemplate ? (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)] px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      Template: {selectedTemplate.name}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Tema libre</p>
                  )}
                </div>
              )}

              {/* Topic */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Tema</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: 5 tendencias de IA para marketing en 2026"
                  disabled={isGenerating}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition disabled:opacity-50"
                />
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Canales</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const isSelected = selectedChannels.includes(channel.id);
                    const status = channelStatus[channel.id];

                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => !isGenerating && toggleChannel(channel.id)}
                        disabled={isGenerating}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                          isSelected ? channel.color : "bg-[var(--surface-1)] text-[var(--text-tertiary)] border-[var(--border)] hover:border-[var(--border-hover)]",
                          isGenerating && "cursor-default"
                        )}
                      >
                        {status === "running" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : status === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                        ) : status === "error" ? (
                          <AlertCircle className="w-4 h-4 text-[var(--error)]" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        {channel.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Instrucciones adicionales <span className="text-[var(--text-tertiary)]">(opcional)</span>
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Enfócate en el mercado latinoamericano, usa ejemplos de Chile..."
                  rows={3}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition resize-none disabled:opacity-50 text-sm"
                />
              </div>
            </>
          )}

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <p className="text-sm font-medium text-[var(--text-secondary)]">Resultados</p>
                {results.map((result) => (
                  <div
                    key={result.channel}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm",
                      result.success
                        ? "bg-green-500/5 border-green-500/20 text-[var(--success)]"
                        : "bg-red-500/5 border-red-500/20 text-[var(--error)]"
                    )}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="flex-1 capitalize">{result.channel}</span>
                    {result.success ? (
                      <span className="text-xs text-[var(--text-tertiary)]">Creado como borrador</span>
                    ) : (
                      <span className="text-xs text-[var(--error)] truncate max-w-48">{result.error}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          {results ? (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-1)] text-[var(--text-primary)] text-sm font-medium transition"
            >
              Cerrar
            </button>
          ) : mode === "select" || mode === "template" ? (
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition"
            >
              Cancelar
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || selectedChannels.length === 0 || isGenerating}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !topic.trim() || selectedChannels.length === 0 || isGenerating
                    ? "bg-[var(--surface-2)] text-[var(--text-secondary)] cursor-not-allowed"
                    : "bg-[var(--accent)] hover:bg-[var(--accent)] text-white"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar ({selectedChannels.length} {selectedChannels.length === 1 ? "canal" : "canales"})
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
