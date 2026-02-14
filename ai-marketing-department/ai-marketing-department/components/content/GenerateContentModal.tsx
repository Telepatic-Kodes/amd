"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "blog", label: "Blog", icon: BookOpen, color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  { id: "email", label: "Newsletter", icon: Mail, color: "bg-green-500/10 text-green-400 border-green-500/30" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-500/10 text-red-400 border-red-500/30" },
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
  blog: { label: "Blog", color: "bg-orange-100 text-orange-700" },
  email: { label: "Email", color: "bg-green-100 text-green-700" },
  ads: { label: "Ads", color: "bg-purple-100 text-purple-700" },
  misc: { label: "Otro", color: "bg-stone-100 text-stone-600" },
};

export function GenerateContentModal({ isOpen, onClose, defaultChannels = [] }: Props) {
  const generateContent = useAction(api.multiChannelGenerate.generateMultiChannelContent);
  const templates = useQuery(api.contentTemplates.getActiveTemplates);
  const { success: showSuccess, error: showError } = useToast();

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
        className="relative w-full max-w-lg mx-4 bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-stone-900">Generar Contenido</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Step 0: Mode Selection */}
          {mode === "select" && !isGenerating && !results && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">Como quieres generar contenido?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("free")}
                  className="p-4 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all text-left"
                >
                  <Sparkles className="h-5 w-5 text-orange-400 mb-2" />
                  <p className="text-sm font-medium text-stone-900">Tema libre</p>
                  <p className="text-xs text-stone-400 mt-1">Escribe tu tema y elige canales</p>
                </button>
                <button
                  onClick={() => setMode("template")}
                  className="p-4 rounded-xl border border-stone-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left"
                >
                  <FileText className="h-5 w-5 text-purple-400 mb-2" />
                  <p className="text-sm font-medium text-stone-900">Usar template</p>
                  <p className="text-xs text-stone-400 mt-1">Pre-configurado por tipo de contenido</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 0b: Template Picker */}
          {mode === "template" && !isGenerating && !results && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToSelect}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-sm font-medium text-stone-600">Elige un template</p>
              </div>
              {!templates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm text-stone-400">No hay templates disponibles</p>
                  <button
                    onClick={() => setMode("free")}
                    className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium"
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
                        className="w-full p-3 rounded-xl border border-stone-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 group-hover:text-purple-900 truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
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
                              <span key={ch} className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                {channelDef.label}
                              </span>
                            ) : null;
                          })}
                          {template.channels.length > 3 && (
                            <span className="text-[10px] text-stone-400">
                              +{template.channels.length - 3} mas
                            </span>
                          )}
                          {template.usageCount ? (
                            <span className="text-[10px] text-stone-300 ml-auto flex items-center gap-0.5">
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
                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {selectedTemplate ? (
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      Template: {selectedTemplate.name}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-stone-600">Tema libre</p>
                  )}
                </div>
              )}

              {/* Topic */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">Tema</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: 5 tendencias de IA para marketing en 2026"
                  disabled={isGenerating}
                  className="w-full px-4 py-3 rounded-lg bg-stone-100 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition disabled:opacity-50"
                />
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-600">Canales</label>
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
                          isSelected ? channel.color : "bg-stone-100 text-stone-500 border-stone-200 hover:border-stone-300",
                          isGenerating && "cursor-default"
                        )}
                      >
                        {status === "running" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : status === "done" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : status === "error" ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
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
                <label className="text-sm font-medium text-stone-600">
                  Instrucciones adicionales <span className="text-stone-400">(opcional)</span>
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Enfócate en el mercado latinoamericano, usa ejemplos de Chile..."
                  rows={3}
                  disabled={isGenerating}
                  className="w-full px-4 py-3 rounded-lg bg-stone-100 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition resize-none disabled:opacity-50 text-sm"
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
                <p className="text-sm font-medium text-stone-600">Resultados</p>
                {results.map((result) => (
                  <div
                    key={result.channel}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm",
                      result.success
                        ? "bg-green-500/5 border-green-500/20 text-green-400"
                        : "bg-red-500/5 border-red-500/20 text-red-400"
                    )}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="flex-1 capitalize">{result.channel}</span>
                    {result.success ? (
                      <span className="text-xs text-stone-500">Creado como borrador</span>
                    ) : (
                      <span className="text-xs text-red-500 truncate max-w-48">{result.error}</span>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
          {results ? (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-stone-200 hover:bg-stone-100 text-stone-900 text-sm font-medium transition"
            >
              Cerrar
            </button>
          ) : mode === "select" || mode === "template" ? (
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-stone-400 hover:text-stone-900 text-sm font-medium transition"
            >
              Cancelar
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-lg text-stone-400 hover:text-stone-900 text-sm font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || selectedChannels.length === 0 || isGenerating}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !topic.trim() || selectedChannels.length === 0 || isGenerating
                    ? "bg-stone-200 text-stone-600 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-500 text-white"
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
