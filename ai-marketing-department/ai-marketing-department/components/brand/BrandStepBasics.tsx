"use client";

import { Building2, Briefcase, Globe, FileText } from "lucide-react";

const INDUSTRIES = [
  "SaaS / Software",
  "E-commerce",
  "Fintech",
  "Salud",
  "Educación",
  "Inmobiliario",
  "Agencia / Consultoría",
  "Medios / Editorial",
  "Viajes / Hospitalidad",
  "Alimentos y Bebidas",
  "Otro",
];

interface BrandBasics {
  companyName: string;
  industry: string;
  website: string;
  description: string;
}

interface Props {
  data: BrandBasics;
  onChange: (data: Partial<BrandBasics>) => void;
}

export function BrandStepBasics({ data, onChange }: Props) {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          Tu Marca
        </h2>
        <p className="text-[var(--text-tertiary)]">
          Información básica que define tu empresa.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--accent)]" /> Nombre de la empresa
          </label>
          <input
            type="text"
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Mi Empresa S.A."
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--accent)]" /> Industria
          </label>
          <select
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition appearance-none"
          >
            <option value="">Selecciona una industria...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent)]" /> Sitio web
          </label>
          <input
            type="url"
            inputMode="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://miempresa.com"
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent)]" /> Descripción
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="¿Qué hace tu empresa? ¿Cuál es tu propuesta de valor?"
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition resize-none"
          />
        </div>
      </div>
    </div>
  );
}
