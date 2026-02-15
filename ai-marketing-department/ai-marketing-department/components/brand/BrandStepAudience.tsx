"use client";

import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";

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
    <div className="p-4 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
          Segmento {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={segment.name}
        onChange={(e) => onUpdate({ ...segment, name: e.target.value })}
        placeholder="Nombre del segmento (ej: CTOs de startups)"
        className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm transition"
      />

      <input
        type="text"
        value={segment.demographics}
        onChange={(e) => onUpdate({ ...segment, demographics: e.target.value })}
        placeholder="Demografía (ej: 30-50 años, Chile, tech)"
        className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm transition"
      />

      <div className="space-y-2">
        <label className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Pain points
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={painInput}
            onChange={(e) => setPainInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPainPoint())}
            placeholder="Agregar pain point..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 text-sm transition"
          />
          <button
            type="button"
            onClick={addPainPoint}
            className="px-2.5 py-2 rounded-lg bg-[var(--accent-muted)]0/10 text-[var(--accent)] hover:bg-[var(--accent-muted)]0/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {segment.painPoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {segment.painPoints.map((pp, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] text-xs border border-[var(--badge-red-bg)]"
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
        <p className="text-[var(--text-tertiary)]">
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
          className="w-full py-3 rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar segmento de audiencia
        </button>
      </div>
    </div>
  );
}
