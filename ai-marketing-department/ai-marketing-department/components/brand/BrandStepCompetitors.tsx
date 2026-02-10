"use client";

import { useState } from "react";
import { Swords, Plus, X, Globe, StickyNote } from "lucide-react";

interface Competitor {
  name: string;
  url: string;
  notes: string;
}

interface Props {
  data: {
    competitors: Competitor[];
    references: string[];
  };
  onChange: (data: { competitors?: Competitor[]; references?: string[] }) => void;
}

function CompetitorCard({
  competitor,
  index,
  onUpdate,
  onRemove,
}: {
  competitor: Competitor;
  index: number;
  onUpdate: (competitor: Competitor) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
          Competidor {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-stone-400 hover:text-red-400 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={competitor.name}
        onChange={(e) => onUpdate({ ...competitor, name: e.target.value })}
        placeholder="Nombre del competidor"
        className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
      />

      <div className="flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <input
          type="url"
          value={competitor.url}
          onChange={(e) => onUpdate({ ...competitor, url: e.target.value })}
          placeholder="https://competidor.com"
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
        />
      </div>

      <div className="flex items-start gap-2">
        <StickyNote className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-2.5" />
        <textarea
          value={competitor.notes}
          onChange={(e) => onUpdate({ ...competitor, notes: e.target.value })}
          placeholder="Notas: qué hacen bien, qué hacen mal..."
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition resize-none"
        />
      </div>
    </div>
  );
}

export function BrandStepCompetitors({ data, onChange }: Props) {
  const [refInput, setRefInput] = useState("");

  const addCompetitor = () => {
    onChange({
      competitors: [...data.competitors, { name: "", url: "", notes: "" }],
    });
  };

  const updateCompetitor = (index: number, competitor: Competitor) => {
    const updated = [...data.competitors];
    updated[index] = competitor;
    onChange({ competitors: updated });
  };

  const removeCompetitor = (index: number) => {
    onChange({ competitors: data.competitors.filter((_, i) => i !== index) });
  };

  const addReference = () => {
    if (refInput.trim()) {
      onChange({ references: [...data.references, refInput.trim()] });
      setRefInput("");
    }
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          Competencia
        </h2>
        <p className="text-stone-500">
          ¿Contra quién compites y a quién admiras?
        </p>
      </div>

      <div className="space-y-6">
        {/* Competitors */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Swords className="w-4 h-4 text-orange-400" /> Competidores
          </label>

          {data.competitors.map((comp, i) => (
            <CompetitorCard
              key={i}
              competitor={comp}
              index={i}
              onUpdate={(c) => updateCompetitor(i, c)}
              onRemove={() => removeCompetitor(i)}
            />
          ))}

          <button
            type="button"
            onClick={addCompetitor}
            className="w-full py-3 rounded-lg border-2 border-dashed border-stone-200 text-stone-400 hover:border-orange-500/50 hover:text-orange-400 transition flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar competidor
          </button>
        </div>

        {/* Reference URLs */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-400" /> URLs de referencia
          </label>
          <p className="text-xs text-stone-400">
            Marcas o contenido que admiras y quieres emular.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReference())}
              placeholder="https://ejemplo.com/referencia"
              className="flex-1 px-4 py-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
            />
            <button
              type="button"
              onClick={addReference}
              className="px-3 py-2.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {data.references.length > 0 && (
            <div className="space-y-1">
              {data.references.map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="flex-1 text-stone-700 truncate">{ref}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ references: data.references.filter((_, idx) => idx !== i) })
                    }
                    className="text-stone-400 hover:text-red-400 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
