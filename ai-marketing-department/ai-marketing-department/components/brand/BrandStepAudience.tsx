"use client";

import { useState } from "react";
import { Users, Plus, X, AlertCircle } from "lucide-react";

interface AudienceSegment {
  name: string;
  demographics: string;
  painPoints: string[];
}

interface Props {
  data: { segments: AudienceSegment[] };
  onChange: (data: { segments: AudienceSegment[] }) => void;
}

function SegmentCard({
  segment,
  index,
  onUpdate,
  onRemove,
}: {
  segment: AudienceSegment;
  index: number;
  onUpdate: (segment: AudienceSegment) => void;
  onRemove: () => void;
}) {
  const [painInput, setPainInput] = useState("");

  const addPainPoint = () => {
    if (painInput.trim()) {
      onUpdate({ ...segment, painPoints: [...segment.painPoints, painInput.trim()] });
      setPainInput("");
    }
  };

  return (
    <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
          Segmento {index + 1}
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
        value={segment.name}
        onChange={(e) => onUpdate({ ...segment, name: e.target.value })}
        placeholder="Nombre del segmento (ej: CTOs de startups)"
        className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
      />

      <input
        type="text"
        value={segment.demographics}
        onChange={(e) => onUpdate({ ...segment, demographics: e.target.value })}
        placeholder="Demografía (ej: 30-50 años, Chile, tech)"
        className="w-full px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
      />

      <div className="space-y-2">
        <label className="text-xs text-stone-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Pain points
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={painInput}
            onChange={(e) => setPainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPainPoint())}
            placeholder="Agregar pain point..."
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
          />
          <button
            type="button"
            onClick={addPainPoint}
            className="px-2.5 py-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {segment.painPoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {segment.painPoints.map((pp, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs border border-red-500/20"
              >
                {pp}
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      ...segment,
                      painPoints: segment.painPoints.filter((_, idx) => idx !== i),
                    })
                  }
                  className="hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandStepAudience({ data, onChange }: Props) {
  const addSegment = () => {
    onChange({
      segments: [...data.segments, { name: "", demographics: "", painPoints: [] }],
    });
  };

  const updateSegment = (index: number, segment: AudienceSegment) => {
    const updated = [...data.segments];
    updated[index] = segment;
    onChange({ segments: updated });
  };

  const removeSegment = (index: number) => {
    onChange({ segments: data.segments.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          Audiencia
        </h2>
        <p className="text-stone-500">
          Define a quién le habla tu marca.
        </p>
      </div>

      <div className="space-y-4">
        {data.segments.map((segment, index) => (
          <SegmentCard
            key={index}
            segment={segment}
            index={index}
            onUpdate={(s) => updateSegment(index, s)}
            onRemove={() => removeSegment(index)}
          />
        ))}

        <button
          type="button"
          onClick={addSegment}
          className="w-full py-3 rounded-lg border-2 border-dashed border-stone-200 text-stone-400 hover:border-orange-500/50 hover:text-orange-400 transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar segmento de audiencia
        </button>
      </div>
    </div>
  );
}
