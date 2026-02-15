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
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoDescription?: string;
    fontPrimary?: string;
    fontSecondary?: string;
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
  if (items.length === 0) return <span className="text-[var(--text-tertiary)] text-sm italic">{emptyText}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--surface-1)] text-[var(--text-secondary)] text-xs">
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
          <div><span className="text-[var(--text-tertiary)]">Empresa:</span> <span className="text-[var(--text-primary)]">{data.companyName}</span></div>
          <div><span className="text-[var(--text-tertiary)]">Industria:</span> <span className="text-[var(--text-primary)]">{data.industry}</span></div>
          {data.website && <div><span className="text-[var(--text-tertiary)]">Web:</span> <span className="text-[var(--text-primary)]">{data.website}</span></div>}
          <div><span className="text-[var(--text-tertiary)]">Descripción:</span> <span className="text-[var(--text-tertiary)]">{data.description}</span></div>
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
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Tono</span><div className="mt-1"><TagList items={data.voice.tone} emptyText="Sin definir" /></div></div>
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Personalidad</span><div className="mt-1"><TagList items={data.voice.personality} emptyText="Sin definir" /></div></div>
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Hacer</span><div className="mt-1"><TagList items={data.voice.dos} emptyText="Sin definir" /></div></div>
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">No hacer</span><div className="mt-1"><TagList items={data.voice.donts} emptyText="Sin definir" /></div></div>
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
            <span className="text-[var(--text-tertiary)] italic">Sin segmentos definidos</span>
          ) : (
            data.audience.segments.map((seg, i) => (
              <div key={i} className="p-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]/50">
                <div className="font-medium text-[var(--text-primary)]">{seg.name}</div>
                {seg.demographics && <div className="text-[var(--text-tertiary)] text-xs mt-0.5">{seg.demographics}</div>}
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
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Temas</span><div className="mt-1"><TagList items={data.strategy.topics} emptyText="Sin temas" /></div></div>
          <div><span className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider">Canales</span><div className="mt-1"><TagList items={data.strategy.channels} emptyText="Sin canales" /></div></div>
          {data.strategy.postingFrequency && (
            <div><span className="text-[var(--text-tertiary)]">Frecuencia:</span> <span className="text-[var(--text-secondary)]">{data.strategy.postingFrequency}</span></div>
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
            <span className="text-[var(--text-tertiary)] italic">Sin competidores</span>
          ) : (
            data.competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[var(--text-primary)]">{c.name}</span>
                {c.url && <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[150px]">{c.url}</span>}
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
          {/* Color palette strip */}
          {(data.visual?.primaryColor || data.visual?.secondaryColor) && (
            <div className="flex gap-0.5 rounded overflow-hidden border border-[var(--border)]">
              {[
                { color: data.visual?.primaryColor, label: "Primario" },
                { color: data.visual?.secondaryColor, label: "Secundario" },
                { color: data.visual?.accentColor, label: "Acento" },
                { color: data.visual?.backgroundColor, label: "Fondo" },
                { color: data.visual?.textColor, label: "Texto" },
              ].filter(c => c.color).map((c, i) => (
                <div
                  key={i}
                  className="flex-1 h-5"
                  style={{ backgroundColor: c.color }}
                  title={`${c.label}: ${c.color}`}
                />
              ))}
            </div>
          )}
          {data.visual?.primaryColor && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-[var(--border-hover)]" style={{ backgroundColor: data.visual.primaryColor }} />
              <span className="text-[var(--text-tertiary)]">Primario: {data.visual.primaryColor}</span>
            </div>
          )}
          {data.visual?.secondaryColor && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-[var(--border-hover)]" style={{ backgroundColor: data.visual.secondaryColor }} />
              <span className="text-[var(--text-tertiary)]">Secundario: {data.visual.secondaryColor}</span>
            </div>
          )}
          {data.visual?.accentColor && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border border-[var(--border-hover)]" style={{ backgroundColor: data.visual.accentColor }} />
              <span className="text-[var(--text-tertiary)]">Acento: {data.visual.accentColor}</span>
            </div>
          )}
          {data.visual?.fontPrimary && (
            <div><span className="text-[var(--text-tertiary)]">Fuente principal:</span> <span className="text-[var(--text-tertiary)]">{data.visual.fontPrimary}</span></div>
          )}
          {data.visual?.fontSecondary && data.visual.fontSecondary !== data.visual.fontPrimary && (
            <div><span className="text-[var(--text-tertiary)]">Fuente secundaria:</span> <span className="text-[var(--text-tertiary)]">{data.visual.fontSecondary}</span></div>
          )}
          {data.visual?.logoDescription && (
            <div><span className="text-[var(--text-tertiary)]">Logo:</span> <span className="text-[var(--text-tertiary)]">{data.visual.logoDescription}</span></div>
          )}
          {data.visual?.styleNotes && (
            <div><span className="text-[var(--text-tertiary)]">Estilo:</span> <span className="text-[var(--text-tertiary)]">{data.visual.styleNotes}</span></div>
          )}
          {!data.visual?.primaryColor && !data.visual?.secondaryColor && !data.visual?.logoDescription && (
            <span className="text-[var(--text-tertiary)] italic">Sin identidad visual definida</span>
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
            className="border border-[var(--border)] rounded-lg bg-[var(--card-bg)] overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--surface-0)] transition-colors"
            >
              <span className="text-[var(--text-tertiary)]">{section.icon}</span>
              {section.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{section.title}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-[var(--text-tertiary)] transition-transform",
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
                    className="mt-3 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-orange-300 transition-colors"
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
