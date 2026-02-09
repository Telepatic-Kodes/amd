"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { X, Globe, Rss, FileText, StickyNote, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  brandProfileId: Id<"brandProfiles">;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "url" | "feed" | "upload" | "note";

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "url", label: "URL", icon: <Globe className="w-4 h-4" /> },
  { id: "feed", label: "Feed", icon: <Rss className="w-4 h-4" /> },
  { id: "upload", label: "Archivo", icon: <FileText className="w-4 h-4" /> },
  { id: "note", label: "Nota", icon: <StickyNote className="w-4 h-4" /> },
];

export function AddSourceDialog({ brandProfileId, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL state
  const [urlValue, setUrlValue] = useState("");
  const [urlName, setUrlName] = useState("");

  // Feed state
  const [feedUrl, setFeedUrl] = useState("");
  const [feedName, setFeedName] = useState("");
  const [syncFrequency, setSyncFrequency] = useState<"daily" | "weekly">("daily");

  // Upload state
  const [uploadName, setUploadName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Note state
  const [noteName, setNoteName] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Mutations
  const addUrlSource = useMutation(api.brandSources.addUrlSource);
  const addFeedSource = useMutation(api.brandSources.addFeedSource);
  const addNoteSource = useMutation(api.brandSources.addNoteSource);
  const addUploadSource = useMutation(api.brandSources.addUploadSource);
  const generateUploadUrl = useMutation(api.kb.uploadFile.generateUploadUrl);
  const processSource = useAction(api.brandSourceProcessor.processSource);

  const resetForm = () => {
    setUrlValue(""); setUrlName("");
    setFeedUrl(""); setFeedName(""); setSyncFrequency("daily");
    setUploadName(""); setSelectedFile(null);
    setNoteName(""); setNoteContent("");
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let sourceId: Id<"brandSources">;

      switch (activeTab) {
        case "url": {
          if (!urlValue.trim()) throw new Error("URL es requerida");
          sourceId = await addUrlSource({
            brandProfileId,
            url: urlValue.trim(),
            name: urlName.trim() || urlValue.trim(),
          });
          break;
        }
        case "feed": {
          if (!feedUrl.trim()) throw new Error("URL del feed es requerida");
          sourceId = await addFeedSource({
            brandProfileId,
            url: feedUrl.trim(),
            name: feedName.trim() || feedUrl.trim(),
            syncFrequency,
          });
          break;
        }
        case "upload": {
          if (!selectedFile) throw new Error("Selecciona un archivo");
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": selectedFile.type },
            body: selectedFile,
          });
          const { storageId } = await result.json();
          sourceId = await addUploadSource({
            brandProfileId,
            name: uploadName.trim() || selectedFile.name,
            storageId,
            fileType: selectedFile.type,
          });
          break;
        }
        case "note": {
          if (!noteContent.trim()) throw new Error("El contenido es requerido");
          sourceId = await addNoteSource({
            brandProfileId,
            name: noteName.trim() || "Nota sin título",
            content: noteContent.trim(),
          });
          break;
        }
        default:
          throw new Error("Tipo de fuente inválido");
      }

      // Trigger processing
      processSource({ sourceId }).catch(() => {
        // Processing happens async, errors are tracked in the source status
      });

      resetForm();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al agregar fuente");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-white border border-gray-200 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Agregar fuente</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-gray-900 border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {activeTab === "url" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">URL</label>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://example.com/about"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre (opcional)</label>
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  placeholder="Página About Us"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {activeTab === "feed" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">URL del Feed (RSS/Atom)</label>
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://blog.example.com/feed.xml"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  placeholder="Blog de la empresa"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Frecuencia de sync</label>
                <div className="flex gap-2">
                  {(["daily", "weekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setSyncFrequency(freq)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                        syncFrequency === freq
                          ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                          : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {freq === "daily" ? "Diario" : "Semanal"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "upload" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Archivo</label>
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.txt,.md"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!uploadName) setUploadName(file.name);
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="text-center">
                      <FileText className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-700">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400 block">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">PDF, DOCX, TXT, MD</span>
                    </div>
                  )}
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Brand guidelines PDF"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {activeTab === "note" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Título</label>
                <input
                  type="text"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="Notas de brand workshop"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Contenido</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={5}
                  placeholder="Escribe aquí la información que quieres agregar a la KB de marca..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
              loading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
              </>
            ) : (
              "Agregar y Procesar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
