"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaCard } from "./MediaCard";
import { MediaUploadModal } from "./MediaUploadModal";
import type { MediaType } from "@/lib/media-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    assets: Array<{
      _id: Id<"mediaAssets">;
      url: string;
      type: string;
      alt?: string;
    }>
  ) => void;
  multiple?: boolean;
  acceptTypes?: Array<"image" | "video" | "audio" | "document" | "presentation">;
  maxSelection?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_TYPE_TABS: Array<{ value: MediaType | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "image", label: "Imagenes" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Docs" },
  { value: "presentation", label: "Presentaciones" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  acceptTypes,
  maxSelection,
}: MediaPickerProps) {
  // -- State ----------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<MediaType | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"mediaAssets">>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  // -- Derived: filter tabs based on acceptTypes prop -----------------------
  const typeTabs = useMemo(() => {
    if (!acceptTypes || acceptTypes.length === 0) return ALL_TYPE_TABS;
    return ALL_TYPE_TABS.filter(
      (tab) => tab.value === "all" || acceptTypes.includes(tab.value as MediaType)
    );
  }, [acceptTypes]);

  // -- Query: fetch assets from Convex -------------------------------------
  const queryType = activeType === "all" ? undefined : activeType;
  const querySearch = search.trim() || undefined;
  const assets = useQuery(api.mediaLibrary.list, { type: queryType, search: querySearch });

  // -- Filtered assets (client-side filter by acceptTypes if "all" tab) -----
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    if (!acceptTypes || acceptTypes.length === 0 || activeType !== "all") return assets;
    return assets.filter((a) => acceptTypes.includes(a.type as MediaType));
  }, [assets, acceptTypes, activeType]);

  // -- Handlers -------------------------------------------------------------
  const handleToggleSelect = (id: Id<"mediaAssets">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Single-select mode: replace previous selection
        if (!multiple) {
          next.clear();
          next.add(id);
          return next;
        }
        // Multi-select: enforce maxSelection
        if (maxSelection && next.size >= maxSelection) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!assets || selectedIds.size === 0) return;
    const selected = assets
      .filter((a) => selectedIds.has(a._id))
      .map((a) => ({
        _id: a._id,
        url: a.url,
        type: a.type,
        alt: a.name,
      }));
    onSelect(selected);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setActiveType("all");
    setSelectedIds(new Set());
    setShowUploadModal(false);
    onClose();
  };

  // -- Render ---------------------------------------------------------------
  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ---- Header ---- */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    Seleccionar Media
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Elige archivos de tu biblioteca o sube nuevos
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[var(--surface-1)] rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              {/* ---- Toolbar ---- */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
                {/* Search input */}
                <div className="relative flex-1 w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar archivos..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  />
                </div>

                {/* Type filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {typeTabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveType(tab.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                        activeType === tab.value
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Upload button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors whitespace-nowrap min-h-[36px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir nuevo
                </button>
              </div>

              {/* ---- Asset grid (scrollable) ---- */}
              <div className="flex-1 overflow-y-auto p-6">
                {!assets ? (
                  // Loading state
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-[var(--surface-1)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredAssets.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
                      <Search className="w-7 h-7 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      No se encontraron archivos
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Intenta con otros filtros o sube un archivo nuevo
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Subir archivo
                    </button>
                  </div>
                ) : (
                  // Asset grid
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredAssets.map((asset) => (
                      <MediaCard
                        key={asset._id}
                        asset={asset as Doc<"mediaAssets">}
                        isSelected={selectedIds.has(asset._id)}
                        onSelect={handleToggleSelect}
                        onClick={() => handleToggleSelect(asset._id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ---- Footer ---- */}
              <div className="flex items-center justify-between p-6 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} archivo${selectedIds.size > 1 ? "s" : ""} seleccionado${selectedIds.size > 1 ? "s" : ""}`
                    : "Ningún archivo seleccionado"}
                  {maxSelection ? ` (max ${maxSelection})` : ""}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Seleccionar{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Nested Upload Modal ---- */}
      <MediaUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </>
  );
}
