"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ChevronDown, ChevronRight, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

const MODELS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
];

interface AgentConfigEditorProps {
  agent: {
    _id: string;
    config: {
      model: string;
      temperature: number;
      maxTokens: number;
    };
  };
}

export function AgentConfigEditor({ agent }: AgentConfigEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [model, setModel] = useState(agent.config.model);
  const [temperature, setTemperature] = useState(agent.config.temperature);
  const [maxTokens, setMaxTokens] = useState(agent.config.maxTokens);
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = useMutation(api.functions.updateAgentConfig);
  const { success, error: showError } = useToast();

  const hasChanges =
    model !== agent.config.model ||
    temperature !== agent.config.temperature ||
    maxTokens !== agent.config.maxTokens;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        id: agent._id as Id<"agents">,
        config: { model, temperature, maxTokens },
      });
      success("Configuración guardada");
    } catch {
      showError("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Editar Configuración
      </button>

      {isOpen && (
        <div className="space-y-3 p-3 rounded-lg bg-[var(--surface-1)]">
          {/* Model */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[var(--text-secondary)]">Modelo</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-[var(--text-secondary)]">Temperatura</label>
              <span className="text-[10px] font-mono text-[var(--text-primary)]">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[var(--surface-2)] accent-orange-600"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[var(--text-secondary)]">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
              min={256}
              max={200000}
              className="w-full px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              hasChanges
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                : "bg-[var(--surface-1)] text-[var(--text-tertiary)] cursor-not-allowed"
            )}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
