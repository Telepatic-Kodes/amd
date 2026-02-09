"use client";

import { useState } from "react";
import { Target, Hash, Plus, X, Calendar } from "lucide-react";

const CHANNEL_OPTIONS = [
  { id: "linkedin", label: "LinkedIn", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  { id: "twitter", label: "Twitter/X", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  { id: "instagram", label: "Instagram", color: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  { id: "tiktok", label: "TikTok", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  { id: "blog", label: "Blog", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  { id: "email", label: "Email", color: "bg-green-500/10 text-green-400 border-green-500/30" },
  { id: "youtube", label: "YouTube", color: "bg-red-500/10 text-red-400 border-red-500/30" },
  { id: "podcast", label: "Podcast", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
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
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Estrategia
        </h2>
        <p className="text-gray-500">
          Temas, canales y frecuencia de publicación.
        </p>
      </div>

      <div className="space-y-6">
        {/* Topics */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-400" /> Temas principales
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
              placeholder="Ej: Marketing digital, IA, Productividad"
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition"
            />
            <button
              type="button"
              onClick={addTopic}
              className="px-3 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {data.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.topics.map((topic, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-sm border border-indigo-500/20"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => onChange({ topics: data.topics.filter((_, idx) => idx !== i) })}
                    className="hover:text-gray-900"
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
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" /> Canales activos
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
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
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
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Frecuencia de publicación
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
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600"
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
