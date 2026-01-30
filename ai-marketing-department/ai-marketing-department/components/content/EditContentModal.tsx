"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { X, Loader2, ChevronDown, Eye, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./RichTextEditor";
import { EditorPreview } from "./EditorPreview";
import { stripHtmlTags, countWords, validateContent } from "@/lib/editor-utils";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "technical", label: "Technical" },
];

interface EditContentModalProps {
  content: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditContentModal({
  content,
  isOpen,
  onClose,
  onSuccess,
}: EditContentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    seo: false,
    metadata: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    summary: "",
    seoTitle: "",
    seoDescription: "",
    slug: "",
    keywords: "",
    tone: "",
    targetAudience: "",
  });

  const { success, error: showError } = useToast();
  const updateContent = useMutation(api.functions.updateContent);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && content) {
      setFormData({
        title: content.title || "",
        body: content.body || "",
        summary: content.summary || "",
        seoTitle: content.seo?.metaTitle || "",
        seoDescription: content.seo?.metaDescription || "",
        slug: content.seo?.slug || "",
        keywords: (content.metadata?.targetKeywords || []).join(", "),
        tone: content.metadata?.tone || "",
        targetAudience: content.metadata?.targetAudience || "",
      });
      setError(null);
      setActiveTab("write"); // Reset to write tab when opening
    }
  }, [isOpen, content]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const updates: any = {
        id: content._id,
      };

      if (formData.title !== content.title) {
        updates.title = formData.title;
      }
      if (formData.body !== content.body) {
        updates.body = formData.body;
      }
      if (formData.summary !== content.summary) {
        updates.summary = formData.summary;
      }

      if (
        formData.seoTitle !== content.seo?.metaTitle ||
        formData.seoDescription !== content.seo?.metaDescription ||
        formData.slug !== content.seo?.slug
      ) {
        updates.seo = {
          metaTitle: formData.seoTitle,
          metaDescription: formData.seoDescription,
          slug: formData.slug,
          canonicalUrl: content.seo?.canonicalUrl,
        };
      }

      if (
        formData.keywords !== (content.metadata?.targetKeywords || []).join(", ") ||
        formData.tone !== content.metadata?.tone ||
        formData.targetAudience !== content.metadata?.targetAudience
      ) {
        updates.metadata = {
          targetKeywords: formData.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0),
          tone: formData.tone,
          targetAudience: formData.targetAudience,
        };
      }

      if (Object.keys(updates).length === 1) {
        // Only id, no changes
        success("No changes", "No changes were made.");
        onClose();
        return;
      }

      // Validate content before saving
      const contentValidation = validateContent(formData.body, 50);
      if (!contentValidation.isValid) {
        setError(contentValidation.error || "Invalid content");
        showError("Validation Error", contentValidation.error || "Invalid content");
        return;
      }

      await updateContent(updates);

      success("Content updated!", "Your changes have been saved.");
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update content";
      setError(message);
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  // Use stripHtmlTags to get accurate word count from HTML content
  const wordCount = countWords(formData.body);
  const readingTime = Math.ceil(wordCount / 200);

  // Validate content
  const validation = validateContent(formData.body, 50);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-lg my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-white">Edit Content</h2>
                <p className="text-sm text-zinc-400 mt-1">{content?.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 rounded p-3">
                  {error}
                </div>
              )}

              {/* Basic Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Content</h3>

                  {/* Write/Preview Tabs */}
                  <div className="flex gap-2 bg-zinc-950/50 rounded-lg p-1 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab("write")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        activeTab === "write"
                          ? "bg-indigo-500 text-white"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <Edit3 className="h-3 w-3" />
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        activeTab === "preview"
                          ? "bg-indigo-500 text-white"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {formData.title.length} characters
                  </p>
                </div>

                {/* Body - Tab Content */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Content</label>

                  <AnimatePresence mode="wait">
                    {activeTab === "write" ? (
                      <motion.div
                        key="write"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <RichTextEditor
                          content={formData.body}
                          onChange={(html) => handleInputChange("body", html)}
                          placeholder="Start writing your content..."
                          minHeight="400px"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <EditorPreview content={formData.body} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-zinc-500">
                      {stripHtmlTags(formData.body).length} characters • {wordCount} words •{" "}
                      {readingTime} min read
                    </p>
                    {!validation.isValid && (
                      <p className="text-xs text-red-400">
                        {validation.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Summary</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                    rows={3}
                    placeholder="Brief summary of the content..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SEO Section - Accordion */}
              <div className="border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => toggleSection("seo")}
                  className="flex items-center gap-3 w-full text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.seo && "rotate-180"
                    )}
                  />
                  SEO Settings
                </button>

                {expandedSections.seo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Meta Title */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">Meta Title</label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                        placeholder="Page title for search engines (55-60 chars)"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        {formData.seoTitle.length} / 60 characters
                        {formData.seoTitle.length >= 55 &&
                          formData.seoTitle.length <= 60 &&
                          " ✓"}
                      </p>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.seoDescription}
                        onChange={(e) =>
                          handleInputChange("seoDescription", e.target.value)
                        }
                        placeholder="Meta description for search results (150-160 chars)"
                        rows={3}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="text-xs text-zinc-500 mt-1">
                        {formData.seoDescription.length} / 160 characters
                        {formData.seoDescription.length >= 150 &&
                          formData.seoDescription.length <= 160 &&
                          " ✓"}
                      </p>
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        placeholder="url-friendly-slug"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Metadata Section - Accordion */}
              <div className="border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => toggleSection("metadata")}
                  className="flex items-center gap-3 w-full text-sm font-semibold text-white hover:text-indigo-400 transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.metadata && "rotate-180"
                    )}
                  />
                  Metadata
                </button>

                {expandedSections.metadata && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Keywords */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">
                        Target Keywords (comma-separated)
                      </label>
                      <textarea
                        value={formData.keywords}
                        onChange={(e) => handleInputChange("keywords", e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                        rows={2}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Tone */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">Tone</label>
                      <select
                        value={formData.tone}
                        onChange={(e) => handleInputChange("tone", e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">Select a tone...</option>
                        {TONES.map((tone) => (
                          <option key={tone.value} value={tone.value}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">
                        Target Audience
                      </label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) =>
                          handleInputChange("targetAudience", e.target.value)
                        }
                        placeholder="e.g., C-level executives, developers"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-800 bg-zinc-950/50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
