"use client";

import { useState } from "react";
import { useAction } from "convex/react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "blog", label: "Blog", icon: BookOpen, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
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

export function GenerateContentModal({ isOpen, onClose, defaultChannels = [] }: Props) {
  const generateContent = useAction(api.multiChannelGenerate.generateMultiChannelContent);
  const { success: showSuccess, error: showError } = useToast();

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
      setTopic("");
      setCustomInstructions("");
      setResults(null);
      setChannelStatus({});
      onClose();
    }
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
        className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Generar Contenido</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Tema</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: 5 tendencias de IA para marketing en 2026"
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
            />
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Canales</label>
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
                      isSelected ? channel.color : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700",
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
            <label className="text-sm font-medium text-zinc-300">
              Instrucciones adicionales <span className="text-zinc-600">(opcional)</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ej: Enfócate en el mercado latinoamericano, usa ejemplos de Chile..."
              rows={3}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none disabled:opacity-50 text-sm"
            />
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <p className="text-sm font-medium text-zinc-300">Resultados</p>
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
                      <span className="text-xs text-zinc-500">Creado como borrador</span>
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
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          {results ? (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white text-sm font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || selectedChannels.length === 0 || isGenerating}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !topic.trim() || selectedChannels.length === 0 || isGenerating
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
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
