"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Search, Upload, LayoutGrid, List, Folder, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/media-utils";
import type { MediaType } from "@/lib/media-utils";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaCard } from "@/components/media/MediaCard";
import { MediaDetailPanel } from "@/components/media/MediaDetailPanel";
import { MediaUploadModal } from "@/components/media/MediaUploadModal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEDIA_TYPE_TABS: { value: MediaType | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "image", label: "Imágenes" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Documentos" },
  { value: "presentation", label: "Presentaciones" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MediaPage() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<MediaType | "">("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Doc<"mediaAssets"> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"mediaAssets">>>(new Set());

  // Queries
  const stats = useQuery(api.mediaLibrary.getStats);
  const folders = useQuery(api.mediaLibrary.getFolders);
  const assets = useQuery(api.mediaLibrary.list, {
    ...(selectedType ? { type: selectedType } : {}),
    ...(selectedFolder ? { folder: selectedFolder } : {}),
    ...(searchTerm ? { search: searchTerm } : {}),
  });

  const isLoading = assets === undefined;

  // Keep selected asset in sync with query results
  const currentSelectedAsset = useMemo(() => {
    if (!selectedAsset || !assets) return selectedAsset;
    const fresh = assets.find((a) => a._id === selectedAsset._id);
    return fresh ?? null;
  }, [selectedAsset, assets]);

  // Handlers
  const handleAssetClick = (asset: Doc<"mediaAssets">) => {
    setSelectedAsset(asset);
  };

  const handleSelectToggle = (id: Id<"mediaAssets">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDetailClose = () => {
    setSelectedAsset(null);
  };

  const handleAssetDeleted = () => {
    setSelectedAsset(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--surface-1)]">
            <ImageIcon className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Media Library
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {stats
                ? `${stats.total} archivos · ${formatFileSize(stats.totalSize)}`
                : "Cargando..."}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir archivos
        </button>
      </div>

      {/* Toolbar: Search + Type Tabs + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MEDIA_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value as MediaType | "")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                selectedType === tab.value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 border border-[var(--border)] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-[var(--surface-1)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-[var(--surface-1)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Grid + Detail Panel */}
      <div className="flex gap-6">
        {/* Left Sidebar — Folders */}
        <aside className="hidden md:block w-48 flex-shrink-0">
          <div className="sticky top-6 space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 px-2">
              Carpetas
            </h3>

            {/* "All" option */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left",
                selectedFolder === null
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              )}
            >
              <Folder className="w-4 h-4 flex-shrink-0" />
              Todas
            </button>

            {/* Folder list */}
            {folders === undefined ? (
              <div className="space-y-1 px-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-7 rounded-md bg-[var(--surface-1)] animate-pulse"
                  />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] px-2 py-2">
                Sin carpetas
              </p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() =>
                    setSelectedFolder(folder === selectedFolder ? null : folder)
                  }
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left truncate",
                    selectedFolder === folder
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  )}
                >
                  <Folder className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{folder}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className={cn(
            "flex-1 min-w-0",
            currentSelectedAsset && "lg:max-w-[65%]"
          )}
        >
          {isLoading ? (
            <SkeletonGrid items={10} columns={3} />
          ) : !assets || assets.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="Sin archivos"
              description={
                searchTerm || selectedType || selectedFolder
                  ? "No se encontraron archivos con los filtros actuales."
                  : "Tu biblioteca de medios está vacía. Sube archivos para comenzar."
              }
              action={{
                label: "Subir archivos",
                onClick: () => setShowUploadModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <MediaCard
                  key={asset._id}
                  asset={asset}
                  isSelected={selectedIds.has(asset._id)}
                  onSelect={handleSelectToggle}
                  onClick={handleAssetClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <AnimatePresence mode="wait">
          {currentSelectedAsset && (
            <motion.div
              key={currentSelectedAsset._id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="hidden lg:block w-80 flex-shrink-0"
            >
              <MediaDetailPanel
                asset={currentSelectedAsset}
                onClose={handleDetailClose}
                onDeleted={handleAssetDeleted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        defaultFolder={selectedFolder ?? undefined}
      />
    </div>
  );
}
