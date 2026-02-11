"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Rss, X, ChevronDown } from "lucide-react";
import { FEED_TEMPLATES, getTemplatesByIndustry } from "@convex/feeds/templates";

interface Props {
  feeds: string[];
  industry: string;
  onChange: (feeds: string[]) => void;
}

export function StepFeeds({ feeds, industry, onChange }: Props) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [input, setInput] = useState("");

  // Get relevant templates for this industry
  const relevantTemplates = industry ? getTemplatesByIndustry(industry) : FEED_TEMPLATES;

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId]
    );
  };

  const addFeed = (url: string) => {
    if (url && !feeds.includes(url)) {
      onChange([...feeds, url]);
    }
    setInput("");
  };

  const removeFeed = (url: string) => onChange(feeds.filter((f) => f !== url));

  // Calculate total feeds that will be added
  const totalFeeds = selectedTemplates.reduce((sum, templateId) => {
    const template = FEED_TEMPLATES.find((t) => t.id === templateId);
    return sum + (template?.feeds.length || 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-stone-900">Selecciona tus fuentes</h2>
        <p className="text-stone-500 text-sm">Elige paquetes pre-configurados para tu industria.</p>
      </div>

      {/* Template Selection Cards */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {relevantTemplates.map((template) => {
            const isSelected = selectedTemplates.includes(template.id);
            return (
              <button
                key={template.id}
                onClick={() => toggleTemplate(template.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                  isSelected
                    ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/30"
                    : "border-stone-200 bg-[#faf8f4]/50 hover:border-stone-300"
                )}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                    isSelected ? "bg-orange-600 border-orange-600" : "border-stone-300"
                  )}
                >
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-stone-900">{template.name}</p>
                      <p className="text-xs text-stone-500">{template.feeds.length} fuentes</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-2">{template.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {totalFeeds > 0 && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-700">
              Se agregarán <strong>{totalFeeds} fuentes</strong> a tu departamento
            </p>
          </div>
        )}
      </div>

      {/* Added Feeds List */}
      {feeds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500">Fuentes manuales agregadas ({feeds.length})</p>
          {feeds.map((url) => (
            <div
              key={url}
              className="flex items-center justify-between p-3 rounded-lg bg-stone-100 border border-stone-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Rss className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-sm text-stone-700 truncate">{url}</span>
              </div>
              <button
                onClick={() => removeFeed(url)}
                className="text-stone-500 hover:text-red-400 transition ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Option (Collapsed by default) */}
      <div className="space-y-3">
        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition"
        >
          <ChevronDown className={cn("w-4 h-4 transition", showManual && "rotate-180")} />
          Agregar manualmente
        </button>

        {showManual && (
          <div className="flex gap-2 p-3 rounded-lg bg-stone-100/50 border border-stone-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFeed(input.trim())}
              placeholder="https://ejemplo.com/feed.xml"
              className="flex-1 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-sm"
            />
            <button
              onClick={() => addFeed(input.trim())}
              className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 transition text-white"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-stone-500 text-center">
        Puedes cambiar, agregar o eliminar fuentes después del onboarding
      </p>
    </div>
  );
}
