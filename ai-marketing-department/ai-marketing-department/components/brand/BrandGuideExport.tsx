"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Download, X } from "lucide-react";

export function BrandGuideExport() {
  const profile = useQuery(api.brandProfile.getBrandProfile);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!profile) return null;

  const visual = profile.visual || {};
  const voice = profile.voice || { tone: [], personality: [], dos: [], donts: [] };
  const audience = profile.audience || { segments: [] };
  const messaging = (profile as Record<string, unknown>).messaging as {
    guide?: string;
    problem?: string;
    solution?: string;
    successVision?: string;
    failureVision?: string;
    callToAction?: string;
  } | undefined;
  const positioning = (profile as Record<string, unknown>).positioning as {
    uniqueValue?: string;
    category?: string;
    differentiators?: string[];
    proofPoints?: string[];
  } | undefined;

  const primaryColor = visual.primaryColor || "#FF6B35";

  const handleExport = () => {
    setShowPreview(true);
    // Wait for render then trigger print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar Guía
      </button>

      {/* Print-optimized view - full overlay on screen, clean for printing */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-[var(--card-bg)] overflow-auto print:static">
          {/* Close button (hidden in print) */}
          <button
            onClick={() => setShowPreview(false)}
            className="fixed top-4 right-4 z-[101] p-2 bg-[var(--surface-1)] rounded-full hover:bg-[var(--surface-2)] print:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Print action bar (hidden in print) */}
          <div className="sticky top-0 z-[100] bg-[var(--card-bg)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between print:hidden">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Vista previa — Guía de Marca
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Imprimir / Guardar PDF
            </button>
          </div>

          <div ref={printRef} className="max-w-3xl mx-auto px-12 py-16 print:p-0 print:max-w-none">
            {/* Cover */}
            <div className="text-center mb-16 print:mb-12">
              <div
                className="h-2 w-32 mx-auto rounded-full mb-8"
                style={{ backgroundColor: primaryColor }}
              />
              <h1 className="text-4xl font-bold text-[var(--text-primary)]">{profile.companyName}</h1>
              <p className="text-lg text-[var(--text-tertiary)] mt-2">Guía de Marca</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {new Date().toLocaleDateString("es-CL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* 1. Identity */}
            <section className="mb-12 print:break-inside-avoid">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                style={{ borderColor: primaryColor }}
              >
                1. Identidad
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Empresa</p>
                  <p className="text-[var(--text-primary)]">{profile.companyName}</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Industria</p>
                  <p className="text-[var(--text-primary)]">{profile.industry}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-[var(--text-tertiary)]">Descripción</p>
                  <p className="text-[var(--text-primary)]">{profile.description}</p>
                </div>
                {profile.website && (
                  <div className="col-span-2">
                    <p className="font-medium text-[var(--text-tertiary)]">Website</p>
                    <p className="text-[var(--text-primary)]">{profile.website}</p>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Voice */}
            <section className="mb-12 print:break-inside-avoid">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                style={{ borderColor: primaryColor }}
              >
                2. Voz de Marca
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Tono</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {voice.tone.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-[var(--surface-1)] rounded text-[var(--text-secondary)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Personalidad</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {voice.personality.map((p: string) => (
                      <span
                        key={p}
                        className="px-2 py-1 bg-[var(--surface-1)] rounded text-[var(--text-secondary)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-[var(--badge-green-text)]">Hacer</p>
                    <ul className="list-disc list-inside mt-1 text-[var(--text-secondary)]">
                      {voice.dos.map((d: string) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--badge-red-text)]">No hacer</p>
                    <ul className="list-disc list-inside mt-1 text-[var(--text-secondary)]">
                      {voice.donts.map((d: string) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Audience */}
            <section className="mb-12 print:break-inside-avoid">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                style={{ borderColor: primaryColor }}
              >
                3. Audiencia
              </h2>
              {audience.segments.map(
                (
                  seg: {
                    name: string;
                    demographics?: string;
                    painPoints: string[];
                  },
                  i: number
                ) => (
                  <div key={i} className="mb-3 text-sm">
                    <p className="font-medium text-[var(--text-primary)]">{seg.name}</p>
                    {seg.demographics && (
                      <p className="text-[var(--text-tertiary)]">{seg.demographics}</p>
                    )}
                    <p className="text-[var(--text-tertiary)] mt-1">
                      Pain points: {seg.painPoints.join(", ")}
                    </p>
                  </div>
                )
              )}
            </section>

            {/* 4. Messaging (if defined) */}
            {messaging?.guide && (
              <section className="mb-12 print:break-inside-avoid">
                <h2
                  className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                  style={{ borderColor: primaryColor }}
                >
                  4. Messaging (StoryBrand)
                </h2>
                <div className="space-y-3 text-sm">
                  {messaging.guide && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">Guía</p>
                      <p className="text-[var(--text-primary)]">{messaging.guide}</p>
                    </div>
                  )}
                  {messaging.problem && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">Problema</p>
                      <p className="text-[var(--text-primary)]">{messaging.problem}</p>
                    </div>
                  )}
                  {messaging.solution && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">Solución</p>
                      <p className="text-[var(--text-primary)]">{messaging.solution}</p>
                    </div>
                  )}
                  {messaging.successVision && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">
                        Visión de éxito
                      </p>
                      <p className="text-[var(--text-primary)]">{messaging.successVision}</p>
                    </div>
                  )}
                  {messaging.failureVision && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">
                        Visión de fracaso
                      </p>
                      <p className="text-[var(--text-primary)]">{messaging.failureVision}</p>
                    </div>
                  )}
                  {messaging.callToAction && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">
                        Call to Action
                      </p>
                      <p className="font-bold text-[var(--text-primary)]">
                        {messaging.callToAction}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 5. Visual */}
            <section className="mb-12 print:break-inside-avoid">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                style={{ borderColor: primaryColor }}
              >
                5. Identidad Visual
              </h2>
              <div className="flex gap-3 mb-4">
                {[
                  { label: "Primario", color: visual.primaryColor },
                  { label: "Secundario", color: visual.secondaryColor },
                  { label: "Acento", color: visual.accentColor },
                  { label: "Fondo", color: visual.backgroundColor },
                  { label: "Texto", color: visual.textColor },
                ]
                  .filter((c) => c.color)
                  .map((c) => (
                    <div key={c.label} className="text-center">
                      <div
                        className="w-12 h-12 rounded-lg border border-[var(--border)] print:border-[var(--border-hover)]"
                        style={{ backgroundColor: c.color }}
                      />
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                        {c.label}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{c.color}</p>
                    </div>
                  ))}
              </div>
              {visual.fontPrimary && (
                <p className="text-sm">
                  <span className="text-[var(--text-tertiary)]">Fuente primaria:</span>{" "}
                  {visual.fontPrimary}
                </p>
              )}
              {visual.fontSecondary && (
                <p className="text-sm">
                  <span className="text-[var(--text-tertiary)]">Fuente secundaria:</span>{" "}
                  {visual.fontSecondary}
                </p>
              )}
              {visual.logoDescription && (
                <p className="text-sm mt-2">
                  <span className="text-[var(--text-tertiary)]">Logo:</span>{" "}
                  {visual.logoDescription}
                </p>
              )}
              {visual.styleNotes && (
                <p className="text-sm mt-1">
                  <span className="text-[var(--text-tertiary)]">Notas de estilo:</span>{" "}
                  {visual.styleNotes}
                </p>
              )}
            </section>

            {/* 6. Positioning */}
            {positioning?.uniqueValue && (
              <section className="mb-12 print:break-inside-avoid">
                <h2
                  className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                  style={{ borderColor: primaryColor }}
                >
                  6. Posicionamiento
                </h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-[var(--text-tertiary)]">
                      Propuesta de valor única
                    </p>
                    <p className="text-[var(--text-primary)]">{positioning.uniqueValue}</p>
                  </div>
                  {positioning.category && (
                    <div>
                      <p className="font-medium text-[var(--text-tertiary)]">Categoría</p>
                      <p className="text-[var(--text-primary)]">{positioning.category}</p>
                    </div>
                  )}
                  {positioning.differentiators &&
                    positioning.differentiators.length > 0 && (
                      <div>
                        <p className="font-medium text-[var(--text-tertiary)]">
                          Diferenciadores
                        </p>
                        <ul className="list-disc list-inside text-[var(--text-primary)]">
                          {positioning.differentiators.map((d: string) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {positioning.proofPoints &&
                    positioning.proofPoints.length > 0 && (
                      <div>
                        <p className="font-medium text-[var(--text-tertiary)]">
                          Proof Points
                        </p>
                        <ul className="list-disc list-inside text-[var(--text-primary)]">
                          {positioning.proofPoints.map((p: string) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* 7. Strategy Overview */}
            <section className="mb-12 print:break-inside-avoid">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                style={{ borderColor: primaryColor }}
              >
                7. Estrategia de Contenido
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Temas clave</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.strategy.topics.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-1 bg-[var(--surface-1)] rounded text-[var(--text-secondary)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-tertiary)]">Canales activos</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.strategy.channels.map((c: string) => (
                      <span
                        key={c}
                        className="px-2 py-1 bg-[var(--surface-1)] rounded text-[var(--text-secondary)] capitalize"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                {profile.strategy.postingFrequency && (
                  <div>
                    <p className="font-medium text-[var(--text-tertiary)]">Frecuencia</p>
                    <p className="text-[var(--text-primary)]">
                      {profile.strategy.postingFrequency}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 8. Competitors (if any) */}
            {profile.competitors.length > 0 && (
              <section className="mb-12 print:break-inside-avoid">
                <h2
                  className="text-2xl font-bold text-[var(--text-primary)] border-b-2 pb-2 mb-4"
                  style={{ borderColor: primaryColor }}
                >
                  8. Competencia
                </h2>
                <div className="space-y-2 text-sm">
                  {profile.competitors.map(
                    (
                      c: { name: string; url?: string; notes?: string },
                      i: number
                    ) => (
                      <div
                        key={i}
                        className="p-2 rounded border border-[var(--border)]"
                      >
                        <p className="font-medium text-[var(--text-primary)]">{c.name}</p>
                        {c.url && (
                          <p className="text-[var(--text-tertiary)] text-xs">{c.url}</p>
                        )}
                        {c.notes && (
                          <p className="text-[var(--text-tertiary)] mt-0.5">{c.notes}</p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-[var(--text-tertiary)] mt-16 pt-4 border-t">
              <p>Generado automáticamente por AI Marketing Department</p>
              <p>
                {profile.companyName} · {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
