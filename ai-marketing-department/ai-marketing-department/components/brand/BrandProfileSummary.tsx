"use client";

import { useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MessageSquare,
  Users,
  Target,
  Swords,
  Palette,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandData {
  companyName: string;
  industry: string;
  website?: string;
  description: string;
  voice: {
    tone: string[];
    personality: string[];
    dos: string[];
    donts: string[];
  };
  audience: {
    segments: Array<{
      name: string;
      demographics?: string;
      painPoints: string[];
    }>;
  };
  strategy: {
    topics: string[];
    channels: string[];
    postingFrequency?: string;
  };
  competitors: Array<{
    name: string;
    url?: string;
    notes?: string;
  }>;
  visual?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoDescription?: string;
    styleNotes?: string;
  };
}

interface Props {
  data: BrandData;
  onEditSection?: (step: number) => void;
}

interface SectionConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  step: number;
  isComplete: boolean;
  content: React.ReactNode;
}

function TagList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) return <span className="text-stone-400 text-sm italic">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs">
          {item}
        </span>
      ))}
    </div>
  );
}

export function BrandProfileSummary({ data, onEditSection }: Props) {
  const [openSections, setOpenSections] = useState<string[]>(["basics"]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: SectionConfig[] = [
    {
      id: "basics",
      title: "Información básica",
      icon: <Building2 className="w-4 h-4" />,
      step: 0,
      isComplete: Boolean(data.companyName && data.industry && data.description?.length > 50),
      content: (
        <div className="space-y-2 text-sm">
          <div><span className="text-stone-400">Empresa:</span> <span className="text-stone-800">{data.companyName}</span></div>
          <div><span className="text-stone-400">Industria:</span> <span className="text-stone-800">{data.industry}</span></div>
          {data.website && <div><span className="text-stone-400">Web:</span> <span className="text-stone-800">{data.website}</span></div>}
          <div><span className="text-stone-400">Descripción:</span> <span className="text-stone-500">{data.description}</span></div>
        </div>
      ),
    },
    {
      id: "voice",
      title: "Voz de marca",
      icon: <MessageSquare className="w-4 h-4" />,
      step: 1,
      isComplete: data.voice.tone.length >= 2 && data.voice.personality.length >= 2,
      content: (
        <div className="space-y-3 text-sm">
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">Tono</span><div className="mt-1"><TagList items={data.voice.tone} emptyText="Sin definir" /></div></div>
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">Personalidad</span><div className="mt-1"><TagList items={data.voice.personality} emptyText="Sin definir" /></div></div>
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">Hacer</span><div className="mt-1"><TagList items={data.voice.dos} emptyText="Sin definir" /></div></div>
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">No hacer</span><div className="mt-1"><TagList items={data.voice.donts} emptyText="Sin definir" /></div></div>
        </div>
      ),
    },
    {
      id: "audience",
      title: "Audiencia",
      icon: <Users className="w-4 h-4" />,
      step: 2,
      isComplete: data.audience.segments.length >= 1,
      content: (
        <div className="space-y-3 text-sm">
          {data.audience.segments.length === 0 ? (
            <span className="text-stone-400 italic">Sin segmentos definidos</span>
          ) : (
            data.audience.segments.map((seg, i) => (
              <div key={i} className="p-2 rounded-lg bg-stone-50 border border-stone-200/50">
                <div className="font-medium text-stone-800">{seg.name}</div>
                {seg.demographics && <div className="text-stone-400 text-xs mt-0.5">{seg.demographics}</div>}
                <div className="mt-1.5"><TagList items={seg.painPoints} emptyText="Sin pain points" /></div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "strategy",
      title: "Estrategia",
      icon: <Target className="w-4 h-4" />,
      step: 3,
      isComplete: data.strategy.topics.length >= 3 && data.strategy.channels.length >= 2,
      content: (
        <div className="space-y-3 text-sm">
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">Temas</span><div className="mt-1"><TagList items={data.strategy.topics} emptyText="Sin temas" /></div></div>
          <div><span className="text-stone-400 text-xs uppercase tracking-wider">Canales</span><div className="mt-1"><TagList items={data.strategy.channels} emptyText="Sin canales" /></div></div>
          {data.strategy.postingFrequency && (
            <div><span className="text-stone-400">Frecuencia:</span> <span className="text-stone-700">{data.strategy.postingFrequency}</span></div>
          )}
        </div>
      ),
    },
    {
      id: "competitors",
      title: "Competencia",
      icon: <Swords className="w-4 h-4" />,
      step: 4,
      isComplete: data.competitors.length >= 1,
      content: (
        <div className="space-y-2 text-sm">
          {data.competitors.length === 0 ? (
            <span className="text-stone-400 italic">Sin competidores</span>
          ) : (
            data.competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-stone-800">{c.name}</span>
                {c.url && <span className="text-stone-400 text-xs truncate max-w-[150px]">{c.url}</span>}
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "visual",
      title: "Identidad visual",
      icon: <Palette className="w-4 h-4" />,
      step: 5,
      isComplete: Boolean(data.visual?.primaryColor),
      content: (
        <div className="space-y-2 text-sm">
          {data.visual?.primaryColor && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: data.visual.primaryColor }} />
              <span className="text-stone-500">Primario: {data.visual.primaryColor}</span>
            </div>
          )}
          {data.visual?.secondaryColor && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: data.visual.secondaryColor }} />
              <span className="text-stone-500">Secundario: {data.visual.secondaryColor}</span>
            </div>
          )}
          {data.visual?.logoDescription && (
            <div><span className="text-stone-400">Logo:</span> <span className="text-stone-500">{data.visual.logoDescription}</span></div>
          )}
          {data.visual?.styleNotes && (
            <div><span className="text-stone-400">Estilo:</span> <span className="text-stone-500">{data.visual.styleNotes}</span></div>
          )}
          {!data.visual?.primaryColor && !data.visual?.secondaryColor && !data.visual?.logoDescription && (
            <span className="text-stone-400 italic">Sin identidad visual definida</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isOpen = openSections.includes(section.id);
        return (
          <div
            key={section.id}
            className="border border-stone-200 rounded-lg bg-white overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 transition-colors"
            >
              <span className="text-stone-400">{section.icon}</span>
              {section.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium text-stone-800">{section.title}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-stone-400 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-[500px]" : "max-h-0")}>
              <div className="px-3 pb-3 pt-0">
                {section.content}
                {onEditSection && (
                  <button
                    onClick={() => onEditSection(section.step)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
