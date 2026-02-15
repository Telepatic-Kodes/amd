"use client";

import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  Globe,
  Instagram,
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
import { mergeMultipleSources } from "@/lib/brand-utils";

interface OnboardingSmartImportProps {
  onExtracted: (data: Record<string, unknown>) => void;
  onBack: () => void;
  onSkip: () => void;
}

type SourceStatus = "idle" | "analyzing" | "done" | "error";

interface UploadedDoc {
  fileName: string;
  text: string;
  wordCount: number;
}

const EXTRACTION_STEPS = [
  "Analizando sitio web...",
  "Analizando Instagram...",
  "Procesando documentos...",
  "Extrayendo información de marca...",
  "Combinando resultados...",
];

export function OnboardingSmartImport({
  onExtracted,
  onBack,
  onSkip,
}: OnboardingSmartImportProps) {
  // URL section
  const [url, setUrl] = useState("");
  const [urlStatus, setUrlStatus] = useState<SourceStatus>("idle");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlData, setUrlData] = useState<Record<string, unknown> | null>(null);

  // Instagram section
  const [igHandle, setIgHandle] = useState("");
  const [igStatus, setIgStatus] = useState<SourceStatus>("idle");
  const [igError, setIgError] = useState<string | null>(null);
  const [igData, setIgData] = useState<Record<string, unknown> | null>(null);

  // Documents section
  const [docs, setDocs] = useState<UploadedDoc[]>([]);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractStep, setExtractStep] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Convex actions
  const extractFromUrl = useAction(api.brandExtractor.extractBrandFromUrl);
  const extractFromText = useAction(api.brandExtractor.extractBrandFromText);

  const hasAnySources = url.trim() !== "" || igHandle.trim() !== "" || docs.length > 0;

  // Handle URL pre-analysis
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

  // Handle Instagram pre-analysis via Playwright API route + Claude
  const handleAnalyzeIg = useCallback(async () => {
    if (!igHandle.trim()) return;
    setIgStatus("analyzing");
    setIgError(null);
    try {
      // Step 1: Scrape Instagram via Playwright API route
      const scrapeRes = await fetch(`/api/scrape-instagram?handle=${encodeURIComponent(igHandle.trim())}`);
      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok) {
        throw new Error(scrapeData.error || "Error al scraping Instagram");
      }

      // Step 2: Send scraped content to Claude via Convex action
      const textForAnalysis = scrapeData.hasRealData
        ? scrapeData.content
        : `${scrapeData.content}\n\nPage body text:\n${scrapeData.bodyText || ""}`;

      const result = await extractFromText({
        text: textForAnalysis,
        fileName: `Instagram @${scrapeData.username}`,
      });

      // Ensure instagram is in channels
      if (result.strategy && typeof result.strategy === "object") {
        const strategy = result.strategy as Record<string, unknown>;
        if (Array.isArray(strategy.channels)) {
          if (!strategy.channels.includes("instagram")) {
            strategy.channels.push("instagram");
          }
        } else {
          strategy.channels = ["instagram"];
        }
      }

      setIgData(result);
      setIgStatus("done");
    } catch (err) {
      setIgError(err instanceof Error ? err.message : "Error al analizar Instagram");
      setIgStatus("error");
    }
  }, [igHandle, extractFromText]);

  // Handle file processed
  const handleFileProcessed = useCallback((content: ParsedContent) => {
    setDocs((prev) => [
      ...prev,
      {
        fileName: content.metadata.fileName,
        text: content.text,
        wordCount: content.metadata.wordCount,
      },
    ]);
  }, []);

  const handleRemoveDoc = useCallback((index: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Main extraction handler — processes all sources and merges results
  const handleExtract = useCallback(async () => {
    setExtracting(true);
    setExtractError(null);
    setExtractStep(0);

    try {
      let currentUrlData = urlData;
      let currentIgData = igData;
      let docData: Record<string, unknown> | null = null;

      // Step 1: URL
      if (url.trim() && !urlData) {
        setExtractStep(0);
        let normalized = url.trim();
        if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
          normalized = `https://${normalized}`;
        }
        currentUrlData = await extractFromUrl({ url: normalized });
        setUrlData(currentUrlData);
        setUrlStatus("done");
      }

      // Step 2: Instagram (via Playwright API route + Claude)
      if (igHandle.trim() && !igData) {
        setExtractStep(1);
        const scrapeRes = await fetch(`/api/scrape-instagram?handle=${encodeURIComponent(igHandle.trim())}`);
        const scrapeData = await scrapeRes.json();
        if (scrapeRes.ok) {
          const textForAnalysis = scrapeData.hasRealData
            ? scrapeData.content
            : `${scrapeData.content}\n\nPage body text:\n${scrapeData.bodyText || ""}`;
          currentIgData = await extractFromText({
            text: textForAnalysis,
            fileName: `Instagram @${scrapeData.username}`,
          });
          setIgData(currentIgData);
          setIgStatus("done");
        }
      }

      // Step 3: Documents
      if (docs.length > 0) {
        setExtractStep(2);
        const combinedText = docs.map((d) => d.text).join("\n\n---\n\n");
        docData = await extractFromText({
          text: combinedText.substring(0, 15000),
          fileName: docs.length === 1 ? docs[0].fileName : `${docs.length} documentos`,
        });
      }

      // Step 4: Merge all results (URL takes highest priority)
      setExtractStep(3);
      const merged = mergeMultipleSources(docData, currentIgData, currentUrlData);

      setExtractStep(4);
      await new Promise((r) => setTimeout(r, 400));

      onExtracted(merged);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Error durante la extracción");
    } finally {
      setExtracting(false);
    }
  }, [url, urlData, igHandle, igData, docs, extractFromUrl, extractFromText, onExtracted]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-0)] dark:bg-gradient-to-b dark:from-[var(--surface-3)] dark:to-[var(--surface-2)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 pb-6 px-4"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[var(--accent-muted)]">
              <Sparkles className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Importar información de marca
              </h1>
              <p className="text-[var(--text-secondary)] text-sm">
                Proporciona al menos una fuente. Combinaremos toda la información.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto space-y-8 px-4 py-4">
        {/* Section 1: Website URL */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Sitio web</h2>
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
                "bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
                urlStatus === "error" ? "border-[var(--error)]/50" : "border-[var(--input-border)]",
                extracting && "opacity-50"
              )}
            />
            <button
              onClick={handleAnalyzeUrl}
              disabled={!url.trim() || urlStatus === "analyzing" || extracting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition",
                url.trim() && urlStatus !== "analyzing"
                  ? "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-hover)]"
                  : "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
              )}
            >
              {urlStatus === "analyzing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : urlStatus === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {urlStatus === "done" ? "Listo" : "Analizar"}
            </button>
          </div>
          {urlStatus === "error" && urlError && (
            <p className="text-xs text-[var(--error)] mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {urlError}
            </p>
          )}
        </motion.section>

        {/* Section 2: Instagram */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Instagram className="w-5 h-5 text-[var(--text-secondary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Instagram</h2>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto">Opcional</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="@tu_marca o https://instagram.com/tu_marca"
              value={igHandle}
              onChange={(e) => {
                setIgHandle(e.target.value);
                if (igStatus !== "idle") {
                  setIgStatus("idle");
                  setIgData(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && igHandle.trim()) handleAnalyzeIg();
              }}
              disabled={extracting}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg border text-sm transition",
                "bg-[var(--surface-1)] text-white placeholder:text-[var(--text-tertiary)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]",
                igStatus === "error" ? "border-red-500/50" : "border-[var(--border)]",
                extracting && "opacity-50"
              )}
            />
            <button
              onClick={handleAnalyzeIg}
              disabled={!igHandle.trim() || igStatus === "analyzing" || extracting}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition",
                igHandle.trim() && igStatus !== "analyzing"
                  ? "bg-[var(--button-primary-bg)] text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                  : "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
              )}
            >
              {igStatus === "analyzing" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : igStatus === "done" ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {igStatus === "done" ? "Listo" : "Analizar"}
            </button>
          </div>
          {igStatus === "error" && igError && (
            <p className="text-xs text-[var(--error)] mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {igError}
            </p>
          )}
        </motion.section>

        {/* Section 3: Documents */}
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

          {docs.length > 0 && (
            <div className="space-y-2 mb-3">
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border)]"
                >
                  <FileText className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {doc.wordCount.toLocaleString()} palabras
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                  <button
                    onClick={() => handleRemoveDoc(i)}
                    disabled={extracting}
                    className="p-1 rounded hover:bg-[var(--surface-2)] transition shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <FileDropZone
            onFileProcessed={handleFileProcessed}
            maxSizeMB={10}
            className="!min-h-[120px] !border-[var(--border)] !bg-[var(--surface-1)]/50 [&_p]:!text-[var(--text-secondary)] [&_span]:!text-[var(--text-tertiary)] [&_svg]:!text-[var(--text-tertiary)]"
          />
        </motion.section>

        {/* Extract CTA */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {extractError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 mb-4">
              <AlertCircle className="w-4 h-4 text-[var(--error)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--error)]">Error en la extraccion</p>
                <p className="text-xs text-[var(--error)] mt-0.5">{extractError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!hasAnySources || extracting}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition",
              hasAnySources && !extracting
                ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                : "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
            )}
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {EXTRACTION_STEPS[extractStep] || "Procesando..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extraer información
              </>
            )}
          </button>

          {!hasAnySources && (
            <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
              Agrega al menos una URL, Instagram o documento para continuar
            </p>
          )}
        </motion.section>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-4 mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={extracting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-1)] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <button
            onClick={onSkip}
            disabled={extracting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition"
          >
            Saltar y llenar manualmente <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
