"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  X,
  FileText,
  History,
  Search,
  Globe,
  Repeat2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkflowStepper } from "./WorkflowStepper";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type Tab = "editor" | "versions" | "seo" | "publish" | "repurpose";

const TABS: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "editor", label: "Editor", icon: FileText },
  { key: "versions", label: "Versiones", icon: History },
  { key: "seo", label: "SEO", icon: Search },
  { key: "publish", label: "Publicar", icon: Globe },
  { key: "repurpose", label: "Repurpose", icon: Repeat2 },
];

interface ContentFullscreenProps {
  content: Doc<"content">;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
}

export function ContentFullscreen({
  content,
  onClose,
  onStatusChange,
}: ContentFullscreenProps) {
  const { success, error } = useToast();
  const updateContent = useMutation(api.functions.updateContent);
  const updateContentStatus = useMutation(api.functions.updateContentStatus);

  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body);
  const [seo, setSeo] = useState({
    metaTitle: content.seo?.metaTitle ?? "",
    metaDescription: content.seo?.metaDescription ?? "",
    canonicalUrl: content.seo?.canonicalUrl ?? "",
    slug: content.seo?.slug ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateContent({
        id: content._id,
        title,
        body,
        seo: {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          slug: seo.slug,
          canonicalUrl: seo.canonicalUrl || undefined,
        },
      });
      success("Contenido guardado");
    } catch (err) {
      error("Error al guardar", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async (nextStatus: string) => {
    try {
      await updateContentStatus({
        id: content._id,
        status: nextStatus as "draft" | "review" | "revision_needed" | "approved" | "scheduled" | "published" | "archived",
      });
      success(`Estado actualizado a ${nextStatus}`);
      onStatusChange?.(nextStatus);
    } catch (err) {
      error("Error", (err as Error).message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--surface-0)]"
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        {/* Left: Close + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="truncate text-lg font-semibold text-[var(--text-primary)]">
            {content.title}
          </span>
        </div>

        {/* Center: Workflow stepper */}
        <div className="flex">
          <WorkflowStepper
            currentStatus={content.status}
            onAdvance={handleAdvance}
          />
        </div>

        {/* Right: Save + Status */}
        <div className="flex items-center gap-3">
          <StatusBadge status={content.status} />
          <LoadingButton
            loading={saving}
            loadingText="Guardando..."
            icon={<Save className="h-4 w-4" />}
            onClick={handleSave}
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Guardar
          </LoadingButton>
        </div>
      </div>

      {/* Mobile horizontal tabs */}
      <div className="flex md:hidden overflow-x-auto border-b border-[var(--border)] px-2 gap-1 shrink-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <div className="hidden md:block w-[220px] shrink-0 border-r border-[var(--border)] p-2 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === "editor" && (
            <EditorTab
              title={title}
              body={body}
              onTitleChange={setTitle}
              onBodyChange={setBody}
            />
          )}
          {activeTab === "versions" && <PlaceholderTab heading="Historial de versiones" />}
          {activeTab === "seo" && (
            <SeoTab seo={seo} onSeoChange={setSeo} />
          )}
          {activeTab === "publish" && <PlaceholderTab heading="Publicacion multiplataforma" />}
          {activeTab === "repurpose" && <PlaceholderTab heading="Repurposear contenido" />}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Tab panels ---------- */

function EditorTab({
  title,
  body,
  onTitleChange,
  onBodyChange,
}: {
  title: string;
  body: string;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Titulo del contenido"
        className="w-full bg-transparent text-2xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-none"
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Escribe tu contenido aqui..."
        className="w-full flex-1 min-h-[200px] md:min-h-[400px] bg-transparent text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none border-none resize-none"
      />
    </div>
  );
}

interface SeoState {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  slug: string;
}

function SeoTab({
  seo,
  onSeoChange,
}: {
  seo: SeoState;
  onSeoChange: (v: SeoState) => void;
}) {
  const update = (field: keyof SeoState, value: string) => {
    onSeoChange({ ...seo, [field]: value });
  };

  return (
    <div className="max-w-full md:max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">SEO</h2>

      {/* Meta Title */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Meta Title
        </label>
        <input
          type="text"
          value={seo.metaTitle}
          onChange={(e) => update("metaTitle", e.target.value)}
          maxLength={60}
          placeholder="Titulo para buscadores"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          {seo.metaTitle.length}/60 caracteres
        </p>
      </div>

      {/* Meta Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Meta Description
        </label>
        <textarea
          value={seo.metaDescription}
          onChange={(e) => update("metaDescription", e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Descripcion para resultados de busqueda"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          {seo.metaDescription.length}/160 caracteres
        </p>
      </div>

      {/* Canonical URL */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Canonical URL
        </label>
        <input
          type="url"
          value={seo.canonicalUrl}
          onChange={(e) => update("canonicalUrl", e.target.value)}
          placeholder="https://ejemplo.com/articulo"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Slug */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          Slug
        </label>
        <input
          type="text"
          value={seo.slug}
          onChange={(e) => update("slug", e.target.value)}
          placeholder="mi-articulo-seo"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          URL-friendly: solo letras minusculas, numeros y guiones
        </p>
      </div>
    </div>
  );
}

function PlaceholderTab({ heading }: { heading: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {heading}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-tertiary)]">Proximamente</p>
    </div>
  );
}
