"use client";

import { Building2, Target, Radio, Rss, Users, Rocket } from "lucide-react";

interface OnboardingData {
  companyName: string;
  industry: string;
  description: string;
  goals: string[];
  channels: string[];
  feeds: string[];
  departments: string[];
}

interface Props {
  data: OnboardingData;
  onLaunch: () => void;
  loading: boolean;
  simplified?: boolean; // When true, shows shorter summary
}

function SummaryRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-100/50">
      <Icon className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm text-stone-700">{value}</p>
      </div>
    </div>
  );
}

export function StepLaunch({ data, onLaunch, loading, simplified = false }: Props) {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-600 to-purple-600 mb-2">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">¡Listo para comenzar!</h2>
        <p className="text-stone-500 text-sm">Revisa tu configuración y lanza tu departamento.</p>
      </div>

      {!simplified && (
        <div className="space-y-2">
          <SummaryRow icon={Building2} label="Empresa" value={`${data.companyName} · ${data.industry}`} />
          <SummaryRow icon={Target} label="Objetivos" value={data.goals.length > 0 ? data.goals.join(", ") : "Ninguno"} />
          <SummaryRow icon={Radio} label="Canales" value={data.channels.length > 0 ? data.channels.join(", ") : "Ninguno"} />
          <SummaryRow icon={Rss} label="Fuentes" value={`${data.feeds.length} fuente(s) configurada(s)`} />
          <SummaryRow icon={Users} label="Departamentos" value={data.departments.length > 0 ? data.departments.join(", ") : "Ninguno"} />
        </div>
      )}

      <button
        onClick={onLaunch}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Comenzar AMD 🚀
          </>
        )}
      </button>
    </div>
  );
}
