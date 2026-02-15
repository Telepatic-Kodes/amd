"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { Palette, MessageSquare, Target, Users, Swords, Lightbulb, Calendar, Globe } from "lucide-react";

interface BrandManualProps {
  brandProfile: Doc<"brandProfiles">;
  strategy?: Doc<"marketingStrategies"> | null;
}

// Section wrapper with number and title
function ManualSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pt-12 pb-8 print-break">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-8">
        <span className="text-[64px] font-bold text-[var(--text-primary)] leading-none select-none">{number}</span>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[var(--text-tertiary)]" />
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({ color, label }: { color?: string; label: string }) {
  if (!color) return null;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-14 h-14 rounded-full border border-[var(--border)] shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</p>
        <p className="text-xs font-mono text-[var(--text-secondary)]">{color}</p>
      </div>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "red" }) {
  const colors = {
    default: "bg-[var(--surface-1)] text-[var(--text-secondary)]",
    green: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
    red: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-5 space-y-2">
      <h4 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</h4>
      <div className="text-[15px] leading-relaxed text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

export function BrandManual({ brandProfile: bp, strategy: strategyDoc }: BrandManualProps) {
  // Strategy data is nested inside the document's `strategy` field
  const strategy = (strategyDoc as Record<string, unknown>)?.strategy ?? null;
  return (
    <div className="brand-manual-doc bg-[var(--card-bg)] text-[var(--text-primary)] max-w-3xl mx-auto px-12 py-16 print:px-0 print:py-8 print:max-w-none">

      {/* ── 01 COVER ── */}
      <section className="text-center py-20 border-b border-[var(--border)] mb-8">
        {bp.visual?.logoDescription && (
          <p className="text-sm text-[var(--text-tertiary)] mb-4 italic">{bp.visual.logoDescription}</p>
        )}
        <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-3">{bp.companyName}</h1>
        <p className="text-lg text-[var(--text-tertiary)] font-medium mb-6">{bp.industry}</p>
        {bp.website && (
          <p className="text-sm text-[var(--text-tertiary)] mb-8">{bp.website}</p>
        )}
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-xl mx-auto">{bp.description}</p>
        <div className="mt-12 text-xs text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Manual de Marca</div>
      </section>

      {/* ── 02 VISUAL IDENTITY ── */}
      {bp.visual && (
        <ManualSection number="02" title="Identidad Visual" icon={Palette}>
          {/* Colors */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Paleta de Colores</h3>
            <div className="flex flex-wrap gap-8">
              <ColorSwatch color={bp.visual.primaryColor} label="Primario" />
              <ColorSwatch color={bp.visual.secondaryColor} label="Secundario" />
              <ColorSwatch color={bp.visual.accentColor} label="Acento" />
              <ColorSwatch color={bp.visual.backgroundColor} label="Fondo" />
              <ColorSwatch color={bp.visual.textColor} label="Texto" />
            </div>
          </div>

          {/* Typography */}
          {(bp.visual.fontPrimary || bp.visual.fontSecondary) && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Tipografía</h3>
              <div className="grid grid-cols-2 gap-6">
                {bp.visual.fontPrimary && (
                  <div className="rounded-lg border border-[var(--border)] p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Font Primaria</p>
                    <p className="text-2xl font-semibold text-[var(--text-primary)]">{bp.visual.fontPrimary}</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-2">Aa Bb Cc Dd Ee Ff Gg</p>
                  </div>
                )}
                {bp.visual.fontSecondary && (
                  <div className="rounded-lg border border-[var(--border)] p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Font Secundaria</p>
                    <p className="text-2xl font-semibold text-[var(--text-primary)]">{bp.visual.fontSecondary}</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-2">Aa Bb Cc Dd Ee Ff Gg</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Style Notes */}
          {bp.visual.styleNotes && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Notas de Estilo</h3>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">{bp.visual.styleNotes}</p>
            </div>
          )}
        </ManualSection>
      )}

      {/* ── 03 VOICE & COMMUNICATION ── */}
      <ManualSection number="03" title="Voz y Comunicación" icon={MessageSquare}>
        <div className="space-y-6">
          {/* Tone */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Tono</h3>
            <div className="flex flex-wrap gap-2">
              {bp.voice.tone.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>

          {/* Personality */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Personalidad</h3>
            <div className="flex flex-wrap gap-2">
              {bp.voice.personality.map((p) => <Badge key={p}>{p}</Badge>)}
            </div>
          </div>

          {/* Dos and Don'ts */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--success)] uppercase tracking-wider mb-3">Hacer</h3>
              <ul className="space-y-2">
                {bp.voice.dos.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-[15px] text-[var(--text-secondary)]">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">No Hacer</h3>
              <ul className="space-y-2">
                {bp.voice.donts.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-[15px] text-[var(--text-secondary)]">
                    <span className="text-[var(--error)] mt-0.5">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ManualSection>

      {/* ── 04 MESSAGING (StoryBrand) ── */}
      {bp.messaging && (
        <ManualSection number="04" title="Messaging — StoryBrand" icon={Target}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bp.messaging.guide && <InfoCard title="La Marca como Guía">{bp.messaging.guide}</InfoCard>}
            {bp.messaging.problem && <InfoCard title="El Problema del Cliente">{bp.messaging.problem}</InfoCard>}
            {bp.messaging.solution && <InfoCard title="Nuestra Solución">{bp.messaging.solution}</InfoCard>}
            {bp.messaging.successVision && <InfoCard title="Visión de Éxito">{bp.messaging.successVision}</InfoCard>}
            {bp.messaging.failureVision && <InfoCard title="Qué Pasa Sin Nosotros">{bp.messaging.failureVision}</InfoCard>}
            {bp.messaging.callToAction && (
              <div className="md:col-span-2 rounded-lg bg-[var(--surface-3)] text-white p-6 text-center">
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Call to Action</p>
                <p className="text-xl font-semibold">{bp.messaging.callToAction}</p>
              </div>
            )}
          </div>
        </ManualSection>
      )}

      {/* ── 05 POSITIONING ── */}
      {bp.positioning && (
        <ManualSection number="05" title="Posicionamiento" icon={Lightbulb}>
          <div className="space-y-6">
            {bp.positioning.uniqueValue && (
              <blockquote className="border-l-4 border-[var(--text-primary)] pl-6 py-2">
                <p className="text-xl font-medium text-[var(--text-primary)] italic">{bp.positioning.uniqueValue}</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-2">Propuesta de Valor Única</p>
              </blockquote>
            )}

            {bp.positioning.category && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Categoría de Mercado</h3>
                <p className="text-[15px] text-[var(--text-secondary)]">{bp.positioning.category}</p>
              </div>
            )}

            {bp.positioning.differentiators && bp.positioning.differentiators.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Diferenciadores</h3>
                <ol className="space-y-2">
                  {bp.positioning.differentiators.map((d, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-[var(--text-secondary)]">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-3)] text-white text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      {d}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {bp.positioning.proofPoints && bp.positioning.proofPoints.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Proof Points</h3>
                <div className="space-y-3">
                  {bp.positioning.proofPoints.map((p, i) => (
                    <div key={i} className="rounded-lg bg-[var(--surface-0)] p-4 border-l-2 border-[var(--border)]">
                      <p className="text-[15px] text-[var(--text-secondary)] italic">&ldquo;{p}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ManualSection>
      )}

      {/* ── 06 AUDIENCE ── */}
      <ManualSection number="06" title="Audiencia" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bp.audience.segments.map((seg) => (
            <div key={seg.name} className="rounded-lg border border-[var(--border)] p-5 space-y-3">
              <h4 className="text-lg font-semibold text-[var(--text-primary)]">{seg.name}</h4>
              {seg.demographics && (
                <p className="text-sm text-[var(--text-tertiary)]">{seg.demographics}</p>
              )}
              {seg.painPoints.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Pain Points</p>
                  <ul className="space-y-1">
                    {seg.painPoints.map((pp) => (
                      <li key={pp} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-orange-500 mt-0.5">•</span>
                        {pp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </ManualSection>

      {/* ── 07 COMPETITORS ── */}
      {bp.competitors.length > 0 && (
        <ManualSection number="07" title="Competidores" icon={Swords}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 pr-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Nombre</th>
                  <th className="py-3 pr-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">URL</th>
                  <th className="py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody>
                {bp.competitors.map((c) => (
                  <tr key={c.name} className="border-b border-[var(--border)]">
                    <td className="py-3 pr-4 text-[15px] font-medium text-[var(--text-primary)]">{c.name}</td>
                    <td className="py-3 pr-4 text-sm text-[var(--text-tertiary)]">{c.url || "—"}</td>
                    <td className="py-3 text-sm text-[var(--text-secondary)]">{c.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ManualSection>
      )}

      {/* ── 08 MARKETING STRATEGY ── */}
      {strategy && (
        <ManualSection number="08" title="Estrategia de Marketing" icon={Calendar}>
          <div className="space-y-8">
            {/* Summary / Goal */}
            {(strategy.summary || (strategyDoc as Record<string, unknown>)?.goal) && (
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] italic border-l-4 border-orange-300 pl-4">
                {strategy.summary || (strategyDoc as Record<string, unknown>)?.goal}
              </p>
            )}

            {/* Content Pillars */}
            {strategy.contentPillars && strategy.contentPillars.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Pilares de Contenido</h3>
                <div className="space-y-4">
                  {strategy.contentPillars.map((pillar: Record<string, unknown>) => (
                    <div key={pillar.name} className="rounded-lg border border-[var(--border)] p-5 space-y-3">
                      <h4 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.name}</h4>
                      <p className="text-sm text-[var(--text-secondary)]">{pillar.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {pillar.channels?.map((ch: string) => (
                          <Badge key={ch}>{ch}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Calendar */}
            {strategy.weeklyCalendar && strategy.weeklyCalendar.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Calendario Semanal</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="py-3 pr-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase w-16">Día</th>
                        <th className="py-3 pr-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase">Contenido</th>
                        <th className="py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase w-24">Canal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategy.weeklyCalendar.map((item: Record<string, unknown>, i: number) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="py-3 pr-4 text-sm font-medium text-[var(--text-primary)] capitalize">{item.dayOfWeek}</td>
                          <td className="py-3 pr-4 text-sm text-[var(--text-secondary)]">{item.description}</td>
                          <td className="py-3">
                            <Badge>{item.channel}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ManualSection>
      )}

      {/* ── 09 DIGITAL STRATEGY ── */}
      {strategy && (strategy.seoStrategy || strategy.adStrategy || strategy.emailStrategy) && (
        <ManualSection number="09" title="Estrategia Digital" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SEO */}
            {strategy.seoStrategy && (
              <div className="rounded-lg border border-[var(--border)] p-5 space-y-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">SEO</h4>
                {strategy.seoStrategy.primaryKeywords && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.seoStrategy.primaryKeywords.map((kw: string) => (
                        <span key={kw} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {strategy.seoStrategy.contentGaps && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Gaps</p>
                    <ul className="space-y-1">
                      {strategy.seoStrategy.contentGaps.map((gap: string) => (
                        <li key={gap} className="text-xs text-[var(--text-secondary)]">• {gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Ads */}
            {strategy.adStrategy && (
              <div className="rounded-lg border border-[var(--border)] p-5 space-y-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Ads</h4>
                {strategy.adStrategy.budgetSplit && (
                  <div className="space-y-2">
                    {strategy.adStrategy.budgetSplit.map((p: Record<string, unknown>) => (
                      <div key={p.platform} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{p.platform}</span>
                        <span className="text-[var(--text-tertiary)] font-medium">{p.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {strategy.adStrategy.objectives && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Objetivos</p>
                    <ul className="space-y-1">
                      {strategy.adStrategy.objectives.map((obj: string) => (
                        <li key={obj} className="text-xs text-[var(--text-secondary)]">• {obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            {strategy.emailStrategy && (
              <div className="rounded-lg border border-[var(--border)] p-5 space-y-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Email</h4>
                {strategy.emailStrategy.sequences && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Secuencias</p>
                    <ul className="space-y-1">
                      {strategy.emailStrategy.sequences.map((seq: string) => (
                        <li key={seq} className="text-xs text-[var(--text-secondary)]">• {seq}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {strategy.emailStrategy.frequency && (
                  <p className="text-xs text-[var(--text-tertiary)]">Frecuencia: {strategy.emailStrategy.frequency}</p>
                )}
                {strategy.emailStrategy.segments && (
                  <div className="flex flex-wrap gap-1">
                    {strategy.emailStrategy.segments.map((seg: string) => (
                      <span key={seg} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{seg}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ManualSection>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--border)] pt-8 mt-12 text-center">
        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-[0.2em]">
          {bp.companyName} · Manual de Marca · {new Date().getFullYear()}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
          Generado con AI Marketing Department
        </p>
      </div>
    </div>
  );
}
