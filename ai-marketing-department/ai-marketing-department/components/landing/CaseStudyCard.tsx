"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Quote, TrendingUp } from "lucide-react";
import { CaseStudy } from "@/lib/landing-data";

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  return (
    <Card hover className="h-full">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {caseStudy.name}
            </h3>
            <p className="text-[var(--text-tertiary)] text-sm">{caseStudy.industry}</p>
            <p className="text-[var(--text-tertiary)] text-xs mt-1">{caseStudy.size}</p>
          </div>
          <Badge variant="success">{caseStudy.timeline}</Badge>
        </div>

        {/* Challenge & Solution */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase font-semibold mb-1">
              Desafío:
            </p>
            <p className="text-[var(--text-tertiary)] text-sm">{caseStudy.challenge}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase font-semibold mb-1">
              Solución:
            </p>
            <p className="text-[var(--accent)] text-sm font-medium">
              {caseStudy.solution}
            </p>
          </div>
        </div>

        {/* Results Grid */}
        <div className="bg-[var(--surface-1)]/50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-xs text-[var(--text-tertiary)] uppercase font-semibold">
              Resultados:
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(caseStudy.results).map(([key, value]) => {
              // Skip "before" keys as they're used for context
              if (key.includes("Before") || key.includes("Increase")) {
                return null;
              }

              return (
                <div key={key}>
                  <div className="text-2xl font-bold text-[var(--success)]">
                    {value}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .trim()
                      .toLowerCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quote */}
        <div className="border-l-4 border-[var(--accent)] pl-4 py-2">
          <Quote className="h-5 w-5 text-orange-500 mb-2" />
          <p className="text-[var(--text-tertiary)] italic mb-3">{caseStudy.quote}</p>
          <p className="text-[var(--text-tertiary)] text-sm">— {caseStudy.author}</p>
        </div>
      </CardContent>
    </Card>
  );
}
