"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search } from "lucide-react";

interface SearchResult {
  _id: string;
  title: string;
  content: string;
  kbId: string;
}

interface KBSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

export function KBSearchResults({ results, isLoading }: KBSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Sin resultados</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Intenta con otros terminos de busqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-tertiary)]">
        {results.length} resultado{results.length !== 1 ? "s" : ""}
      </p>
      {results.map((result) => (
        <Card key={result._id} hover>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                {result.title}
              </h4>
              <Badge variant="info" className="shrink-0">KB</Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
              {result.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
