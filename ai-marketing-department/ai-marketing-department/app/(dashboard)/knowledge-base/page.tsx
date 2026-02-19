"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { BookOpen, Search, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { KBCard } from "@/components/knowledge-base/KBCard";
import { KBDetailPanel } from "@/components/knowledge-base/KBDetailPanel";
import { KBSearchResults } from "@/components/knowledge-base/KBSearchResults";
import { DriveFilePicker } from "@/components/googledrive/DriveFilePicker";

export default function KnowledgeBasePage() {
  const [selectedKBId, setSelectedKBId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);

  const importFromDrive = useAction(api.googledrive.actions.importFiles);

  const knowledgeBases = useQuery(api.kb.queries.listKnowledgeBases, {});

  const kbIds = useMemo(() => {
    if (!knowledgeBases) return [];
    return knowledgeBases.map((kb: { _id: string }) => kb._id as Id<"knowledgeBases">);
  }, [knowledgeBases]);

  const searchResults = useQuery(
    api.kb.agentQueries.searchKBSections,
    debouncedQuery.length >= 2
      ? { kbIds, keywords: debouncedQuery, limit: 20 }
      : "skip"
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        setDebouncedQuery(value);
      }, 400);
      setDebounceTimer(timer);
    },
    [debounceTimer]
  );

  const handleDriveImport = async (fileIds: string[]) => {
    const activeKbId = selectedKBId ?? knowledgeBases?.[0]?._id;
    if (!activeKbId) return;
    await importFromDrive({
      fileIds,
      destination: "kb",
      kbId: activeKbId as Id<"knowledgeBases">,
    });
  };

  const isLoading = knowledgeBases === undefined;
  const isSearching = debouncedQuery.length >= 2;
  const searchIsLoading = isSearching && searchResults === undefined;

  const selectedKB = useMemo(() => {
    if (!selectedKBId || !knowledgeBases) return null;
    return knowledgeBases.find((kb: { _id: string }) => kb._id === selectedKBId) || null;
  }, [selectedKBId, knowledgeBases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]">
            <BookOpen className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Base de Conocimiento</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {knowledgeBases ? `${knowledgeBases.length} bases disponibles` : "Cargando..."}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDrivePickerOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-0)]"
        >
          <HardDrive className="h-4 w-4 text-blue-500" />
          Importar desde Drive
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Buscar en todas las bases de conocimiento..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Main Content */}
      {isSearching ? (
        <KBSearchResults
          results={(searchResults as unknown as { _id: string; title: string; content: string; kbId: string }[]) ?? []}
          isLoading={searchIsLoading}
        />
      ) : (
        <div className="flex gap-6">
          {/* KB Grid */}
          <div className={cn("flex-1 min-w-0", selectedKB && "lg:max-w-[60%]")}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse" />
                ))}
              </div>
            ) : knowledgeBases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Sin bases de conocimiento</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Las bases se crean automaticamente por los agentes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(knowledgeBases as unknown as { _id: string; name: string; category: string; status: string; description?: string; visibility: string; documentCount?: number }[]).map((kb) => (
                  <KBCard
                    key={kb._id}
                    kb={kb}
                    isSelected={selectedKBId === kb._id}
                    onSelect={setSelectedKBId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedKB && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <KBDetailPanel
                kbId={selectedKBId as Id<"knowledgeBases">}
                onClose={() => setSelectedKBId(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Drive File Picker */}
      <DriveFilePicker
        open={drivePickerOpen}
        onClose={() => setDrivePickerOpen(false)}
        onImport={handleDriveImport}
        acceptTypes={[
          "application/pdf",
          "application/vnd.openxmlformats",
          "text/",
          "application/vnd.google-apps.document",
          "application/vnd.google-apps.spreadsheet",
          "application/vnd.google-apps.presentation",
        ]}
        title="Importar documentos desde Google Drive"
      />
    </div>
  );
}
