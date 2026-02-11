"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  X,
  Save,
  Bot,
  Thermometer,
  Hash,
  Cpu,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface AgentConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools?: string[];
}

interface AgentData {
  _id: Id<"agents">;
  name: string;
  agentId: string;
  department: string;
  role: string;
  description: string;
  config: AgentConfig;
}

const MODELS = [
  { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5", tier: "Max" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", tier: "Equilibrado" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4", tier: "Potente" },
  { value: "claude-haiku-3-20250514", label: "Claude Haiku 3", tier: "Rapido" },
];

export function AgentConfigModal({
  agent,
  onClose,
}: {
  agent: AgentData;
  onClose: () => void;
}) {
  const updateConfig = useMutation(api.functions.updateAgentConfig);
  const { success, error: showError } = useToast();

  const [prompt, setPrompt] = useState(agent.config.systemPrompt);
  const [model, setModel] = useState(agent.config.model);
  const [temperature, setTemperature] = useState(agent.config.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.config.maxTokens);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      prompt !== agent.config.systemPrompt ||
      model !== agent.config.model ||
      temperature !== agent.config.temperature ||
      maxTokens !== agent.config.maxTokens;
    setHasChanges(changed);
  }, [prompt, model, temperature, maxTokens, agent.config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({
        id: agent._id,
        config: {
          systemPrompt: prompt,
          model,
          temperature,
          maxTokens,
        },
      });
      success("Configuracion actualizada", `${agent.name} ha sido reconfigurado.`);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error al guardar", message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(agent.config.systemPrompt);
    setModel(agent.config.model);
    setTemperature(agent.config.temperature);
    setMaxTokens(agent.config.maxTokens);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-xl border border-[var(--border)] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Bot className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Configurar {agent.name}
              </h2>
              <p className="text-xs text-stone-500">
                {agent.agentId} &middot; {agent.department} &middot; {agent.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <Cpu className="h-4 w-4 text-stone-400" />
              Modelo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModel(m.value)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all",
                    model === m.value
                      ? "border-orange-500 bg-orange-50 text-stone-900"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  )}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    model === m.value
                      ? "bg-orange-100 text-orange-700"
                      : "bg-stone-100 text-stone-500"
                  )}>
                    {m.tier}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature + Max Tokens row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Thermometer className="h-4 w-4 text-stone-400" />
                Temperatura: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>Preciso</span>
                <span>Creativo</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <Hash className="h-4 w-4 text-stone-400" />
                Max Tokens
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="256"
                max="100000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                className="w-full rounded-lg border border-stone-300 bg-white py-2 px-3 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <p className="text-xs text-stone-400 mt-1">
                256 — 100,000
              </p>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
              <FileText className="h-4 w-4 text-stone-400" />
              System Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-stone-300 bg-white py-3 px-4 text-sm text-stone-900 font-mono leading-relaxed focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-y"
              placeholder="Define el comportamiento y personalidad de este agente..."
            />
            <p className="text-xs text-stone-400 mt-1">
              {prompt.length} caracteres
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-white rounded-b-xl">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Deshacer cambios
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all",
                hasChanges && !saving
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
