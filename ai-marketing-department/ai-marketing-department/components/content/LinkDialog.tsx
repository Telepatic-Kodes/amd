"use client";

import { useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { X, Link2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LinkDialogProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkDialog({ editor, isOpen, onClose }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: sync editor link state when dialog opens */
  useEffect(() => {
    if (isOpen && editor) {
      const { href } = editor.getAttributes("link");
      setUrl(href || "");
      setError("");
    }
  }, [isOpen, editor]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setError("La URL no puede estar vacía");
      return false;
    }

    // Basic URL validation (supports http, https, mailto, tel)
    const urlPattern = /^(https?:\/\/|mailto:|tel:)/i;
    const hasProtocol = urlPattern.test(value);

    if (!hasProtocol) {
      // Auto-add https:// if no protocol
      setUrl(`https://${value}`);
      return true;
    }

    setError("");
    return true;
  };

  const handleSave = () => {
    if (!editor) return;

    if (!validateUrl(url)) {
      return;
    }

    // Set link with validated URL
    const finalUrl = url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:")
      ? url
      : `https://${url}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: finalUrl })
      .run();

    onClose();
  };

  const handleRemove = () => {
    if (!editor) return;

    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!editor) {
    return null;
  }

  const hasExistingLink = editor.isActive("link");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-stone-100 border border-stone-200 rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-stone-900">
                  {hasExistingLink ? "Editar Enlace" : "Insertar Enlace"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-stone-200 text-stone-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com"
                  autoFocus
                  className={cn(
                    "w-full rounded-lg border bg-white py-2 px-3",
                    "text-sm text-stone-900 placeholder-stone-500",
                    "focus:outline-none focus:ring-2",
                    error
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-stone-200 focus:ring-orange-500/50"
                  )}
                />
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
                <p className="text-xs text-stone-500 mt-1">
                  Soporta enlaces http://, https://, mailto: y tel:
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-stone-200 bg-white">
              {hasExistingLink && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Quitar
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                {hasExistingLink ? "Actualizar" : "Insertar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
