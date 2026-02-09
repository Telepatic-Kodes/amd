"use client";

import { useState } from "react";
import { MessageSquare, Plus, X, ThumbsUp, ThumbsDown } from "lucide-react";

const TONE_OPTIONS = [
  "Profesional", "Cercano", "Autoridad", "Divertido", "Inspirador",
  "Educativo", "Provocador", "Empático", "Directo", "Sofisticado",
];

const PERSONALITY_OPTIONS = [
  "Innovador", "Confiable", "Audaz", "Accesible", "Experto",
  "Líder", "Colaborativo", "Disruptivo", "Emprendedor", "Humano",
];

interface BrandVoice {
  tone: string[];
  personality: string[];
  dos: string[];
  donts: string[];
}

interface Props {
  data: BrandVoice;
  onChange: (data: Partial<BrandVoice>) => void;
}

function PillSelector({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function DynamicList({
  items,
  onAdd,
  onRemove,
  placeholder,
  icon: Icon,
}: {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  icon: React.ElementType;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50/50 border border-gray-200/50 text-sm"
            >
              <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="flex-1 text-gray-700">{item}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-gray-400 hover:text-red-400 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BrandStepVoice({ data, onChange }: Props) {
  const toggleTone = (tone: string) => {
    const updated = data.tone.includes(tone)
      ? data.tone.filter((t) => t !== tone)
      : [...data.tone, tone];
    onChange({ tone: updated });
  };

  const togglePersonality = (trait: string) => {
    const updated = data.personality.includes(trait)
      ? data.personality.filter((p) => p !== trait)
      : [...data.personality, trait];
    onChange({ personality: updated });
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Voz de Marca
        </h2>
        <p className="text-gray-500">
          Define cómo habla tu marca al mundo.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Tono
          </label>
          <PillSelector
            options={TONE_OPTIONS}
            selected={data.tone}
            onToggle={toggleTone}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" /> Personalidad
          </label>
          <PillSelector
            options={PERSONALITY_OPTIONS}
            selected={data.personality}
            onToggle={togglePersonality}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-green-400" /> Siempre hacer
          </label>
          <DynamicList
            items={data.dos}
            onAdd={(item) => onChange({ dos: [...data.dos, item] })}
            onRemove={(i) => onChange({ dos: data.dos.filter((_, idx) => idx !== i) })}
            placeholder="Ej: Usar datos para respaldar afirmaciones"
            icon={ThumbsUp}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ThumbsDown className="w-4 h-4 text-red-400" /> Nunca hacer
          </label>
          <DynamicList
            items={data.donts}
            onAdd={(item) => onChange({ donts: [...data.donts, item] })}
            onRemove={(i) => onChange({ donts: data.donts.filter((_, idx) => idx !== i) })}
            placeholder="Ej: No usar jerga técnica innecesaria"
            icon={ThumbsDown}
          />
        </div>
      </div>
    </div>
  );
}
