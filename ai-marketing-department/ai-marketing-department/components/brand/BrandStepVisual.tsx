"use client";

import { Palette, Type, Image as ImageIcon, Eye } from "lucide-react";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Poppins", "Raleway", "Nunito", "Playfair Display", "Source Sans 3",
];

const COLOR_FIELDS = [
  { key: "primaryColor", label: "Primario", description: "Color principal de marca" },
  { key: "secondaryColor", label: "Secundario", description: "Color complementario" },
  { key: "accentColor", label: "Acento", description: "Botones y highlights" },
  { key: "backgroundColor", label: "Fondo", description: "Color de fondo base" },
  { key: "textColor", label: "Texto", description: "Color del texto principal" },
] as const;

interface BrandVisual {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoDescription: string;
  logoStorageId?: string;
  fontPrimary: string;
  fontSecondary: string;
  styleNotes: string;
}

interface Props {
  data: BrandVisual;
  onChange: (data: Partial<BrandVisual>) => void;
  companyName?: string;
}

function ColorInput({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
        <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{description}</p>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border border-[var(--border)] bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-xs transition font-mono"
        />
      </div>
    </div>
  );
}

export function BrandStepVisual({ data, onChange, companyName }: Props) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          Identidad Visual
        </h2>
        <p className="text-[var(--text-tertiary)]">
          Paleta de colores, tipografias, logo y estilo visual de tu marca.
        </p>
      </div>

      <div className="space-y-8">
        {/* Color Palette */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--accent)]" /> Paleta de colores
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {COLOR_FIELDS.map((field) => (
              <ColorInput
                key={field.key}
                label={field.label}
                description={field.description}
                value={data[field.key]}
                onChange={(v) => onChange({ [field.key]: v })}
              />
            ))}
          </div>
          {/* Color preview strip */}
          <div className="flex gap-1 mt-3 rounded-lg overflow-hidden border border-[var(--border)]">
            {COLOR_FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex-1 h-8"
                style={{ backgroundColor: data[field.key] || "#e5e5e5" }}
                title={`${field.label}: ${data[field.key]}`}
              />
            ))}
          </div>
        </div>

        {/* Font Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Type className="w-4 h-4 text-[var(--accent)]" /> Tipografias
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-tertiary)]">Fuente principal (titulos)</label>
              <select
                value={data.fontPrimary}
                onChange={(e) => onChange({ fontPrimary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-tertiary)]">Fuente secundaria (cuerpo)</label>
              <select
                value={data.fontSecondary}
                onChange={(e) => onChange({ fontSecondary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logo Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[var(--accent)]" /> Logo
          </label>
          <textarea
            value={data.logoDescription}
            onChange={(e) => onChange({ logoDescription: e.target.value })}
            placeholder="Describe tu logo: forma, colores, tipografia, simbolismo..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition resize-none text-sm"
          />
          <div className="px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-dashed border-[var(--border-hover)] text-center">
            <p className="text-xs text-[var(--text-tertiary)]">
              Subida de logo via Convex Storage disponible proximamente.
              El campo <code className="text-[var(--text-tertiary)]">logoStorageId</code> ya esta preparado en el schema.
            </p>
          </div>
        </div>

        {/* Style Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Type className="w-4 h-4 text-[var(--accent)]" /> Notas de estilo
          </label>
          <textarea
            value={data.styleNotes}
            onChange={(e) => onChange({ styleNotes: e.target.value })}
            placeholder="Estilo de fotografia, elementos visuales recurrentes, reglas de diseno..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition resize-none text-sm"
          />
        </div>

        {/* Live Preview Card */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--accent)]" /> Vista previa
          </label>
          <div
            className="rounded-lg overflow-hidden border border-[var(--border)] shadow-sm"
            style={{
              backgroundColor: data.backgroundColor || "#FFFFFF",
              color: data.textColor || "#1C1917",
              fontFamily: data.fontSecondary || "Inter",
            }}
          >
            <div
              className="h-2"
              style={{ backgroundColor: data.primaryColor || "#FF6B35" }}
            />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: data.secondaryColor || "#1C1917" }}
                >
                  {(companyName || data.logoDescription || "Tu")?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{
                      fontFamily: data.fontPrimary || "Inter",
                      color: data.primaryColor || "#FF6B35",
                    }}
                  >
                    {companyName || "Tu Empresa"}
                  </h3>
                  <p
                    className="text-xs opacity-60"
                    style={{ fontFamily: data.fontSecondary || "Inter" }}
                  >
                    Vista previa de tu identidad visual
                  </p>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ fontFamily: data.fontSecondary || "Inter" }}
              >
                Este es un ejemplo de como se ve tu marca con la paleta de colores
                y tipografias seleccionadas. El contenido generado seguira estas guias.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: data.accentColor || "#F59E0B" }}
                >
                  Call to Action
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{
                    borderColor: data.primaryColor || "#FF6B35",
                    color: data.primaryColor || "#FF6B35",
                  }}
                >
                  Secundario
                </button>
              </div>
            </div>
            <div
              className="h-1"
              style={{ backgroundColor: data.secondaryColor || "#1C1917" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
