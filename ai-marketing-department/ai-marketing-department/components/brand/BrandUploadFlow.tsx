"use client";

import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  SkipForward,
  Sparkles,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileDropZone } from "@/components/content/FileDropZone";
import { type ParsedContent } from "@/lib/file-parsers";

interface BrandUploadFlowProps {
  onExtracted: (data: Record<string, unknown>) => void;
  onBack: () => void;
  onSkip: () => void;
}

type UrlStatus = "idle" | "analyzing" | "done" | "error";

interface UploadedDoc {
  fileName: string;
  text: string;
  wordCount: number;
  status: "parsed" | "error";
}

const STEP_MESSAGES = [
  "Analizando sitio web...",
  "Procesando documentos...",
  "Extrayendo información de marca...",
  "Combinando resultados...",
];

export function BrandUploadFlow({ onExtracted, onBack, onSkip }: BrandUploadFlowProps) {
  // URL section
  const [url, setUrl] = useState("");
  const [urlStatus, setUrlStatus] = useState<UrlStatus>("idle");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlData, setUrlData] = useState<Record<string, unknown> | null>(null);

  // Documents section
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractStep, setExtractStep] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Convex actions
  const extractFromUrl = useAction(api.brandExtractor.extractBrandFromUrl);
  const extractFromText = useAction(api.brandExtractor.extractBrandFromText);

  const _hasSources = urlStatus === "done" || docs.length > 0;
  const hasAnySources = url.trim() !== "" || docs.length > 0;

  // Handle URL analysis
  const handleAnalyzeUrl = useCallback(async () => {
    if (!url.trim()) return;

    let normalized = url.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = `https://${normalized}`;
    }

    setUrlStatus("analyzing");
    setUrlError(null);

    try {
      const result = await extractFromUrl({ url: normalized });
      setUrlData(result);
      setUrlStatus("done");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Error al analizar URL");
      setUrlStatus("error");
    }
  }, [url, extractFromUrl]);

  // Handle file processed from FileDropZone
  const handleFileProcessed = useCallback((content: ParsedContent) => {
    setDocs((prev) => [
      ...prev,
      {
        fileName: content.metadata.fileName,
        text: content.text,
        wordCount: content.metadata.wordCount,
        status: "parsed",
      },
    ]);
  }, []);

  // Remove a document
  const handleRemoveDoc = useCallback((index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Main extraction handler
  const handleExtract = useCallback(async () => {
    setExtracting(true);
    setExtractError(null);
    setExtractStep(0);

    try {
      let urlResult = urlData;
      let docResult: Record<string, unknown> | null = null;

      // Step 1: URL (if not already analyzed, or re-analyze)
      if (url.trim() && !urlData) {
        setExtractStep(0);
        let normalized = url.trim();
        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
          normalized = `https://${normalized}`;
        }
        urlResult = await extractFromUrl({ url: normalized });
        setUrlData(urlResult);
        setUrlStatus("done");
      }

      // Step 2: Documents
      if (docs.length > 0) {
        setExtractStep(1);
        const combinedText = docs.map((d) => d.text).join("\n\n---\n\n");
        docResult = await extractFromText({
          text: combinedText.substring(0, 15000),
          fileName: docs.length === 1 ? docs[0].fileName : `${docs.length} documentos`,
        });
      }

      // Step 3: Merge results
      setExtractStep(2);

      // Merge: URL data takes priority, then doc data fills gaps
      const merged: Record<string, unknown> = {};
      const sources = [docResult, urlResult].filter(Boolean) as Record<string, unknown>[];

      for (const source of sources) {
        for (const [key, value] of Object.entries(source)) {
          if (value === undefined || value === null || value === "") continue;
          if (Array.isArray(value) && value.length === 0) continue;

          // Deep merge for objects
          if (typeof value === "object" && !Array.isArray(value) && merged[key] && typeof merged[key] === "object") {
            merged[key] = { ...(merged[key] as Record<string, unknown>), ...value };
          } else {
            merged[key] = value;
          }
        }
      }

      setExtractStep(3);

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 500));

      onExtracted(merged);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Error during extraction");
    } finally {
      setExtracting(false);
    }
  }, [url, urlData, docs, extractFromUrl, extractFromText, onExtracted]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[var(--accent-muted)]">
            <Sparkles className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Importar información de marca
            </h1>
            <p className="text-[var(--text-tertiary)] text-sm">
              Proporciona al menos una fuente para extraer la información de tu marca
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto space-y-8 py-4">
        {/* Section 1: URL */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
              URL del sitio web
            </h2>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto">Opcional</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              inputMode="url"
              placeholder="https://tu-sitio-web.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlStatus !== "idle") {
                  setUrlStatus("idle");
                  setUrlData(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim()) handleAnalyzeUrl();
              }}
              disabled={extracting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg border text-sm transition",
                "bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
                urlStatus === "error" ? "border-red-300" : "border-[var(--border)]",
                extracting && "opacity-50"
              )}
            />
            <button
              onClick={handleAnalyzeUrl}
              disabled={!url.trim() || urlStatus === "analyzing" || extracting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition",
                url.trim() && urlStatus !== "analyzing"
                  ? "bg-[var(--surface-3)] text-white hover:bg-[var(--surface-2)]"
                  : "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
              )}
            >
              {urlStatus === "analyzing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Analizar
            </button>
          </div>

          {/* URL Status */}
          {urlStatus === "analyzing" && (
            <p className="text-xs text-[var(--accent)] mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analizando sitio web...
            </p>
          )}
          {urlStatus === "done" && (
            <p className="text-xs text-[var(--badge-green-text)] mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Sitio web analizado con éxito
            </p>
          )}
          {urlStatus === "error" && urlError && (
            <p className="text-xs text-[var(--badge-red-text)] mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {urlError}
            </p>
          )}
        </motion.section>

        {/* Section 2: Documents */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
              Documentos de marca
            </h2>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto">Opcional</span>
          </div>

          {/* Uploaded docs list */}
          {docs.length > 0 && (
            <div className="space-y-2 mb-3">
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]"
                >
                  <FileText className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-secondary)] truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {doc.wordCount.toLocaleString()} palabras
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <button
                    onClick={() => handleRemoveDoc(i)}
                    disabled={extracting}
                    className="p-1 rounded hover:bg-[var(--surface-2)] transition shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <FileDropZone
            onFileProcessed={handleFileProcessed}
            maxSizeMB={10}
            className={cn(
              "!min-h-[140px] !border-[var(--border)] !bg-[var(--card-bg)]",
              "[&_p]:!text-[var(--text-secondary)] [&_span]:!text-[var(--text-tertiary)]",
              "[&_svg]:!text-[var(--text-tertiary)]"
            )}
          />
        </motion.section>

        {/* Section 3: Extract CTA */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {extractError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--badge-red-bg)] border border-[var(--badge-red-bg)] mb-4">
              <AlertCircle className="w-4 h-4 text-[var(--error)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--badge-red-text)]">Error en la extracción</p>
                <p className="text-xs text-[var(--badge-red-text)] mt-0.5">{extractError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!hasAnySources || extracting}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition",
              hasAnySources && !extracting
                ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                : "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
            )}
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {STEP_MESSAGES[extractStep] || "Procesando..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extraer información de marca
              </>
            )}
          </button>

          {!hasAnySources && (
            <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
              Agrega al menos una URL o documento para continuar
            </p>
          )}
        </motion.section>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] py-4 mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={extracting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-0)] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <button
            onClick={onSkip}
            disabled={extracting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-0)] transition"
          >
            Saltar y llenar manualmente <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
