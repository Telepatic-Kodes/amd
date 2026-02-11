"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
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
  History,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
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
  triggers?: string[];
}

const MODELS = [
  { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5", tier: "Max" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", tier: "Equilibrado" },
  { value: "claude-opus-4-20250514", label: "Claude Opus 4", tier: "Potente" },
  { value: "claude-haiku-3-20250514", label: "Claude Haiku 3", tier: "Rápido" },
];

const TRIGGER_OPTIONS = [
  { value: "manual", label: "Manual", description: "Ejecutar desde el dashboard" },
  { value: "webhook", label: "Webhook", description: "Activar via HTTP" },
  { value: "cron:hourly", label: "Cada hora", description: "Ejecución programada horaria" },
  { value: "cron:daily", label: "Diario", description: "Una vez al día" },
  { value: "cron:weekly", label: "Semanal", description: "Una vez a la semana" },
  { value: "on:task_completed", label: "Al completar tarea", description: "Cuando otra tarea termina" },
  { value: "on:handoff", label: "Al recibir handoff", description: "Cuando otro agente delega" },
];

export function AgentConfigModal({
  agent,
  onClose,
}: {
  agent: AgentData;
  onClose: () => void;
}) {
  const updateConfig = useMutation(api.agentConfig.updateConfigWithHistory);
  const resetDefaults = useMutation(api.agentConfig.resetToDefaults);
  const restoreVersion = useMutation(api.agentConfig.restoreVersion);
  const configHistory = useQuery(api.agentConfig.getConfigHistory, { agentId: agent._id });
  const { success, error: showError } = useToast();

  const [prompt, setPrompt] = useState(agent.config.systemPrompt);
  const [model, setModel] = useState(agent.config.model);
  const [temperature, setTemperature] = useState(agent.config.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.config.maxTokens);
  const [triggers, setTriggers] = useState<string[]>(agent.triggers || []);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "triggers" | "history">("config");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const configChanged =
      prompt !== agent.config.systemPrompt ||
      model !== agent.config.model ||
      temperature !== agent.config.temperature ||
      maxTokens !== agent.config.maxTokens;
    const triggersChanged =
      JSON.stringify(triggers.sort()) !== JSON.stringify((agent.triggers || []).sort());
    setHasChanges(configChanged || triggersChanged);
  }, [prompt, model, temperature, maxTokens, triggers, agent.config, agent.triggers]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({
        agentId: agent._id,
        config: { systemPrompt: prompt, model, temperature, maxTokens },
        triggers,
      });
      success("Configuración actualizada", `${agent.name} ha sido reconfigurado.`);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error al guardar", message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      await resetDefaults({ agentId: agent._id });
      success("Restaurado", `${agent.name} restaurado a su configuración por defecto.`);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    setSaving(true);
    try {
      await restoreVersion({ agentId: agent._id, version });
      success("Versión restaurada", `Configuración restaurada a versión ${version}.`);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleUndoChanges = () => {
    setPrompt(agent.config.systemPrompt);
    setModel(agent.config.model);
    setTemperature(agent.config.temperature);
    setMaxTokens(agent.config.maxTokens);
    setTriggers(agent.triggers || []);
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

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

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-6">
          {[
            { id: "config" as const, label: "Modelo & Prompt", icon: Cpu },
            { id: "triggers" as const, label: "Triggers", icon: Zap },
            { id: "history" as const, label: "Historial", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === "config" && (
            <>
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

              {/* Temperature + Max Tokens */}
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
                  <p className="text-xs text-stone-400 mt-1">256 — 100,000</p>
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
                <p className="text-xs text-stone-400 mt-1">{prompt.length} caracteres</p>
              </div>
            </>
          )}

          {activeTab === "triggers" && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">
                Selecciona cuándo se activa este agente. Puedes combinar varios triggers.
              </p>
              {TRIGGER_OPTIONS.map((trigger) => (
                <button
                  key={trigger.value}
                  onClick={() => toggleTrigger(trigger.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                    triggers.includes(trigger.value)
                      ? "border-orange-500 bg-orange-50"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Zap className={cn(
                      "h-4 w-4",
                      triggers.includes(trigger.value) ? "text-orange-600" : "text-stone-400"
                    )} />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        triggers.includes(trigger.value) ? "text-stone-900" : "text-stone-600"
                      )}>
                        {trigger.label}
                      </p>
                      <p className="text-xs text-stone-400">{trigger.description}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center",
                    triggers.includes(trigger.value)
                      ? "border-orange-500 bg-orange-500"
                      : "border-stone-300"
                  )}>
                    {triggers.includes(trigger.value) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">
                Cada cambio crea una versión. Puedes restaurar cualquier configuración anterior.
              </p>
              {configHistory && configHistory.length > 0 ? (
                configHistory.map((version) => (
                  <div
                    key={version._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex-shrink-0">
                        v{version.version}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-stone-700 truncate">
                          {version.changeDescription || "Configuración actualizada"}
                        </p>
                        <p className="text-xs text-stone-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(version.createdAt).toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(version.version)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 transition-colors"
                    >
                      Restaurar
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-400 text-sm">
                  No hay versiones anteriores. Los cambios se registrarán automáticamente.
                </div>
              )}
            </div>
          )}

          {/* Advanced: Reset to Defaults */}
          {activeTab === "config" && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600"
              >
                {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Opciones avanzadas
              </button>
              {showAdvanced && (
                <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-xs text-red-600 mb-2">
                    Restaurar la configuración original del agente (seed). Se perderán todos los cambios.
                  </p>
                  <button
                    onClick={handleResetDefaults}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-600 border border-red-300 hover:bg-red-100 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar Defaults
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-white rounded-b-xl">
          <button
            onClick={handleUndoChanges}
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
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
