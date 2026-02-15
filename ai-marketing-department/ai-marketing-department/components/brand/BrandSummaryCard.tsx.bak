"use client";

import { CheckCircle2, Database, Sparkles, RefreshCw } from "lucide-react";

interface Props {
  companyName: string;
  kbId: string | null;
  kbSyncing: boolean;
  onResync: () => void;
  onGenerate: () => void;
}

export function BrandSummaryCard({ companyName, kbId, kbSyncing, onResync, onGenerate }: Props) {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-2">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          {companyName}
        </h2>
        <p className="text-stone-500">
          Tu perfil de marca está configurado y activo.
        </p>
      </div>

      {/* KB Status */}
      <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${kbId ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
            <Database className={`w-5 h-5 ${kbId ? "text-green-400" : "text-yellow-400"}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-900">
              Knowledge Base
            </p>
            <p className="text-xs text-stone-400">
              {kbId
                ? "Activa — Todos los agentes tienen acceso"
                : "No sincronizada — Sincroniza para activar"}
            </p>
          </div>
          <button
            onClick={onResync}
            disabled={kbSyncing}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${kbSyncing ? "animate-spin" : ""}`} />
            {kbSyncing ? "Sincronizando..." : "Re-sincronizar"}
          </button>
        </div>
      </div>

      {/* Generate Content CTA */}
      <button
        onClick={onGenerate}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white font-semibold transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-orange-500/20"
      >
        <Sparkles className="w-5 h-5" />
        Generar Contenido
      </button>
    </div>
  );
}
