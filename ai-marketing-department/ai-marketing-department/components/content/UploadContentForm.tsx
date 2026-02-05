"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Plus, X, Loader2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { FileImportModal } from "./FileImportModal";

const CONTENT_TYPES = [
  { value: "blog", label: "Blog" },
  { value: "social_linkedin", label: "LinkedIn" },
  { value: "social_twitter", label: "Twitter" },
  { value: "social_instagram", label: "Instagram" },
  { value: "social_tiktok", label: "TikTok" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "landing_page", label: "Landing Page" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "case_study", label: "Case Study" },
  { value: "video_script", label: "Video Script" },
];

export function UploadContentForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [type, setType] = useState("blog");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");

  const { success, error: showError } = useToast();
  const createContent = useMutation(api.functions.createContent);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }
    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters");
      return false;
    }
    if (!body.trim()) {
      setError("Content body is required");
      return false;
    }
    if (body.trim().length < 50) {
      setError("Content body must be at least 50 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Calculate wordCount
      const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words/min

      await createContent({
        type: type as any,
        title: title.trim(),
        body: body.trim(),
        summary: summary.trim() || undefined,
        metadata: {
          wordCount,
          readingTime,
        },
        createdBy: "system" as any,
      });

      success("Content created!", "Your content has been added as a draft.");
      setTitle("");
      setBody("");
      setSummary("");
      setType("blog");
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create content";
      setError(message);
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file import - populate form fields with imported content
   */
  const handleFileImport = (imported: { title: string; body: string; metadata: any }) => {
    setTitle(imported.title);
    setBody(imported.body);

    // Close import modal
    setIsImportModalOpen(false);

    // Open the form to show imported content
    setIsOpen(true);

    // Show success toast
    success("Contenido importado", "Selecciona el tipo de contenido y guarda cuando estés listo");
  };

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium">Create New Content</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium text-white transition-colors"
                  title="Importar desde archivo"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Importar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                  }}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 rounded p-2">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Content Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                >
                  {CONTENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title"
                  required
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-zinc-500 mt-1">{title.length} characters</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Content *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter your content here... (minimum 50 characters)"
                  required
                  rows={8}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {body.length} characters • {body.split(/\s+/).filter(w => w.length > 0).length} words
                </p>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Summary (Optional)</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of the content..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="flex-1 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Content
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* File Import Modal */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleFileImport}
      />
    </div>
  );
}
