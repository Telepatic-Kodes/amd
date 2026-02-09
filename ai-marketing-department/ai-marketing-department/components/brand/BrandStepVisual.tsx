"use client";

import { Palette, Type, Image } from "lucide-react";

interface BrandVisual {
  primaryColor: string;
  secondaryColor: string;
  logoDescription: string;
  styleNotes: string;
}

interface Props {
  data: BrandVisual;
  onChange: (data: Partial<BrandVisual>) => void;
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition font-mono"
        />
      </div>
    </div>
  );
}

export function BrandStepVisual({ data, onChange }: Props) {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Identidad Visual
        </h2>
        <p className="text-gray-500">
          Colores, logo y estilo visual de tu marca.
        </p>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" /> Colores de marca
          </label>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              label="Color primario"
              value={data.primaryColor}
              onChange={(v) => onChange({ primaryColor: v })}
            />
            <ColorInput
              label="Color secundario"
              value={data.secondaryColor}
              onChange={(v) => onChange({ secondaryColor: v })}
            />
          </div>
          {(data.primaryColor || data.secondaryColor) && (
            <div className="flex gap-2 mt-2">
              {data.primaryColor && (
                <div
                  className="w-full h-8 rounded-lg border border-gray-200"
                  style={{ backgroundColor: data.primaryColor }}
                />
              )}
              {data.secondaryColor && (
                <div
                  className="w-full h-8 rounded-lg border border-gray-200"
                  style={{ backgroundColor: data.secondaryColor }}
                />
              )}
            </div>
          )}
        </div>

        {/* Logo description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Image className="w-4 h-4 text-indigo-400" /> Descripción del logo
          </label>
          <textarea
            value={data.logoDescription}
            onChange={(e) => onChange({ logoDescription: e.target.value })}
            placeholder="Describe tu logo: forma, colores, tipografía..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none text-sm"
          />
        </div>

        {/* Style notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" /> Notas de estilo
          </label>
          <textarea
            value={data.styleNotes}
            onChange={(e) => onChange({ styleNotes: e.target.value })}
            placeholder="Tipografías preferidas, estilo de fotografía, elementos visuales recurrentes..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none text-sm"
          />
        </div>
      </div>
    </div>
  );
}
