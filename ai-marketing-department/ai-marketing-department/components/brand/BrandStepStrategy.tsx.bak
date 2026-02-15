"use client";

import { useState } from "react";
import { Target, Hash, Plus, X, Calendar } from "lucide-react";

const CHANNEL_OPTIONS = [
  { id: "linkedin", label: "LinkedIn", color: "bg-sky-100 text-sky-700 border-sky-300" },
  { id: "twitter", label: "Twitter/X", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  { id: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-700 border-pink-300" },
  { id: "tiktok", label: "TikTok", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { id: "blog", label: "Blog", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { id: "email", label: "Email", color: "bg-green-100 text-green-700 border-green-300" },
  { id: "youtube", label: "YouTube", color: "bg-red-100 text-red-700 border-red-300" },
  { id: "podcast", label: "Podcast", color: "bg-amber-100 text-amber-700 border-amber-300" },
];

const FREQUENCY_OPTIONS = [
  "Diario",
  "3-5 veces por semana",
  "Semanal",
  "Quincenal",
  "Mensual",
];

interface BrandStrategy {
  topics: string[];
  channels: string[];
  postingFrequency: string;
}

interface Props {
  data: BrandStrategy;
  onChange: (data: Partial<BrandStrategy>) => void;
}

export function BrandStepStrategy({ data, onChange }: Props) {
  const [topicInput, setTopicInput] = useState("");

  const addTopic = () => {
    if (topicInput.trim()) {
      onChange({ topics: [...data.topics, topicInput.trim()] });
      setTopicInput("");
    }
  };

  const toggleChannel = (channelId: string) => {
    const updated = data.channels.includes(channelId)
      ? data.channels.filter((c) => c !== channelId)
      : [...data.channels, channelId];
    onChange({ channels: updated });
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
          Estrategia
        </h2>
        <p className="text-stone-500">
          Temas, canales y frecuencia de publicación.
        </p>
      </div>

      <div className="space-y-6">
        {/* Topics */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Hash className="w-4 h-4 text-orange-400" /> Temas principales
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
              placeholder="Ej: Marketing digital, IA, Productividad"
              className="flex-1 px-4 py-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm transition"
            />
            <button
              type="button"
              onClick={addTopic}
              className="px-3 py-2.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {data.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.topics.map((topic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm border border-orange-300"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => onChange({ topics: data.topics.filter((_, idx) => idx !== i) })}
                    className="hover:text-stone-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Channels */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" /> Canales activos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CHANNEL_OPTIONS.map((channel) => {
              const isSelected = data.channels.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                    isSelected
                      ? channel.color
                      : "bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {channel.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posting Frequency */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-400" /> Frecuencia de publicación
          </label>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((freq) => {
              const isSelected = data.postingFrequency === freq;
              return (
                <button
                  key={freq}
                  type="button"
                  onClick={() => onChange({ postingFrequency: freq })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-stone-50 text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700"
                  }`}
                >
                  {freq}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
