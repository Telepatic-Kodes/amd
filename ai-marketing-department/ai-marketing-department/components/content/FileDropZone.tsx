"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import {
  parseFile,
  validateFile,
  isParsedContent,
  type ParsedContent,
} from "@/lib/file-parsers";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFileProcessed: (content: ParsedContent) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

/**
 * FileDropZone - Componente de zona de subida de archivos con drag & drop
 *
 * Soporta:
 * - Drag and drop de archivos
 * - Click para seleccionar archivo
 * - Validación de tipo y tamaño
 * - Parseo automático de PDF, DOCX, TXT
 * - Estados de carga y error
 * - Mobile-friendly (touch targets >44px)
 */
export function FileDropZone({
  onFileProcessed,
  onError,
  maxSizeMB = 10,
  acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  className,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Procesa el archivo: valida y parsea
   */
  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(false);
      setSelectedFile(file);
      setIsProcessing(true);

      try {
        // Validar archivo primero
        const validation = validateFile(file, maxSizeMB);
        if (!validation.valid) {
          throw new Error(validation.error || "Archivo inválido");
        }

        // Parsear archivo
        const result = await parseFile(file);

        if (isParsedContent(result)) {
          // Éxito - llamar callback
          onFileProcessed(result);
          setSuccess(true);

          // Limpiar después de 2 segundos
          setTimeout(() => {
            setSelectedFile(null);
            setSuccess(false);
          }, 2000);
        } else {
          // Error de parseo
          throw new Error(result.error);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al procesar archivo";
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed, onError, maxSizeMB]
  );

  /**
   * Maneja el evento de drag enter
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  /**
   * Maneja el evento de drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Solo dejar de resaltar si salimos del elemento completamente
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Maneja el evento de drag over (necesario para permitir drop)
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Maneja el evento de drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]); // Solo procesar el primer archivo
      }
    },
    [processFile]
  );

  /**
   * Maneja la selección de archivo por input
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // Limpiar input para permitir seleccionar el mismo archivo nuevamente
      e.target.value = "";
    },
    [processFile]
  );

  /**
   * Maneja el click en la zona de drop para abrir selector de archivos
   */
  const handleClick = useCallback(() => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);

  /**
   * Limpia el error y permite reintentar
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setSelectedFile(null);
    setSuccess(false);
  }, []);

  /**
   * Obtiene el tipo de archivo legible
   */
  const getFileTypeLabel = (type: string): string => {
    if (type.includes("pdf")) return "PDF";
    if (type.includes("word") || type.includes("document")) return "DOCX";
    if (type.includes("text")) return "TXT";
    return type;
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
        "min-h-[200px] flex flex-col items-center justify-center gap-4",
        isDragging
          ? "border-orange-500 bg-orange-500/10"
          : "border-stone-300 hover:border-stone-600 hover:bg-stone-100/50",
        isProcessing && "opacity-50 pointer-events-none",
        success && "border-green-500 bg-green-500/10",
        error && "border-red-500",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
      />

      {/* Estado de procesando */}
      {isProcessing && selectedFile && (
        <>
          <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          <div className="text-center">
            <p className="text-base font-medium text-stone-200">
              Procesando archivo...
            </p>
            <p className="text-sm text-stone-400 mt-1">{selectedFile.name}</p>
            <p className="text-xs text-stone-500 mt-1">
              {getFileTypeLabel(selectedFile.type)} •{" "}
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </>
      )}

      {/* Estado de éxito */}
      {!isProcessing && success && selectedFile && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-400" />
          <div className="text-center">
            <p className="text-base font-medium text-green-400">
              ¡Archivo procesado con éxito!
            </p>
            <p className="text-sm text-stone-400 mt-1">{selectedFile.name}</p>
          </div>
        </>
      )}

      {/* Estado de error */}
      {!isProcessing && error && (
        <>
          <AlertCircle className="w-12 h-12 text-red-400" />
          <div className="text-center max-w-md">
            <p className="text-base font-medium text-red-400">Error</p>
            <p className="text-sm text-stone-300 mt-2">{error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        </>
      )}

      {/* Estado inicial (sin archivo) */}
      {!isProcessing && !success && !error && (
        <>
          <div className="relative">
            <Upload className="w-16 h-16 text-stone-500" />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-orange-500 border-dashed rounded-full animate-pulse" />
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-base font-medium text-stone-200">
              {isDragging
                ? "Suelta el archivo aquí"
                : "Arrastra un archivo o haz clic para seleccionar"}
            </p>
            <p className="text-sm text-stone-400">
              Formatos soportados: PDF, DOCX, TXT
            </p>
            <p className="text-xs text-stone-500">Tamaño máximo: {maxSizeMB}MB</p>
          </div>

          {/* Indicador visual de archivos soportados */}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <FileText className="w-4 h-4" />
              <span>DOCX</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <FileText className="w-4 h-4" />
              <span>TXT</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
