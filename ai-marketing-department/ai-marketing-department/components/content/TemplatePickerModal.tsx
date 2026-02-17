"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Linkedin,
  Twitter,
  Instagram,
  BookOpen,
  Mail,
  FileCode,
  FileText,
  Video,
  LayoutTemplate,
  Tag,
  Eye,
  Copy,
  Edit2,
  Search,
  TrendingUp,
  Plus,
  RefreshCw,
  User,
  Lightbulb,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const CATEGORY_TABS = [
  { id: "", label: "Todos" },
  { id: "social", label: "Social" },
  { id: "blog", label: "Blog" },
  { id: "email", label: "Email" },
  { id: "ads", label: "Ads" },
  { id: "misc", label: "Otros" },
  { id: "_my", label: "Mis Templates" },
];

const CONTENT_TYPE_ICONS: Record<string, React.ElementType> = {
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_instagram: Instagram,
  blog: BookOpen,
  email: Mail,
  newsletter: Mail,
  ad_copy: FileCode,
  case_study: FileText,
  video_script: Video,
};

const CATEGORY_COLORS: Record<string, string> = {
  social: "bg-sky-50 text-sky-700 border-sky-200",
  blog: "bg-[var(--accent-subtle)] text-[var(--accent)] border-orange-200",
  email: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-green-200",
  ads: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] border-purple-200",
  misc: "bg-[var(--surface-1)] text-[var(--text-secondary)] border-[var(--border)]",
};

const CONTENT_TYPE_OPTIONS = [
  { value: "social_linkedin", label: "LinkedIn" },
  { value: "social_twitter", label: "Twitter/X" },
  { value: "social_instagram", label: "Instagram" },
  { value: "blog", label: "Blog" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "case_study", label: "Caso de Éxito" },
  { value: "video_script", label: "Video Script" },
];

type Phase = "browse" | "preview" | "fill" | "generating" | "result" | "create";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedTemplateId?: string;
}

export function TemplatePickerModal({ isOpen, onClose, preselectedTemplateId }: Props) {
  const templates = useQuery(api.contentTemplates.listTemplates, {});
  const myTemplates = useQuery(api.contentTemplates.listMyTemplates);
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const generateFromTemplate = useAction(api.contentTemplates.generateFromTemplate);
  const createCustomTemplate = useMutation(api.contentTemplates.createCustomTemplate);
  const { success: showSuccess, error: showError } = useToast();

  const [phase, setPhase] = useState<Phase>(preselectedTemplateId ? "fill" : "browse");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(preselectedTemplateId ?? null);
  const [skippedPreview, setSkippedPreview] = useState(false);

  // Variable form state
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [cta, setCta] = useState("");

  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBody, setGeneratedBody] = useState("");
  const [_generatedContentId, setGeneratedContentId] = useState<string | null>(null);

  // Create template form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<"social" | "blog" | "email" | "ads" | "misc">("social");
  const [newContentType, setNewContentType] = useState("social_linkedin");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [newExampleOutput, setNewExampleOutput] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Determine which templates to show based on tab
  const activeTemplateList = useMemo(() => {
    if (categoryFilter === "_my") return myTemplates ?? [];
    return templates ?? [];
  }, [categoryFilter, templates, myTemplates]);

  const filteredTemplates = useMemo(() => {
    let result = [...activeTemplateList];

    // Category filter (skip for "my templates" tab and "all")
    if (categoryFilter && categoryFilter !== "_my") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sort by usage count (most popular first), then by lastUsedAt
    result.sort((a, b) => {
      const usageDiff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      if (usageDiff !== 0) return usageDiff;
      return (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);
    });

    return result;
  }, [activeTemplateList, categoryFilter, searchQuery]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    const allTemplates = [...(templates ?? []), ...(myTemplates ?? [])];
    return allTemplates.find((t) => t.templateId === selectedTemplateId) ?? null;
  }, [selectedTemplateId, templates, myTemplates]);

  // Build quick suggestions: brand topics paired with best-matching template
  const quickSuggestions = useMemo(() => {
    const bpStrategy = brandProfile?.strategy as { topics?: string[]; channels?: string[] } | undefined;
    const topics = bpStrategy?.topics || [];
    if (topics.length === 0 || !templates || templates.length === 0) return [];

    const SUGGESTION_COLORS = [
      "border-purple-300 bg-purple-500/5 hover:bg-purple-500/10",
      "border-sky-300 bg-sky-500/5 hover:bg-sky-500/10",
      "border-orange-300 bg-[var(--accent-subtle)]/40 hover:bg-[var(--accent-subtle)]/70",
      "border-pink-300 bg-pink-500/5 hover:bg-pink-500/10",
      "border-green-300 bg-green-500/5 hover:bg-green-500/10",
    ];

    return topics.map((topicName, idx) => {
      // Pick a template — cycle through available ones for variety
      const template = templates[idx % templates.length];
      return {
        id: `quick-${idx}`,
        topic: topicName,
        templateId: template.templateId,
        templateName: template.name,
        color: SUGGESTION_COLORS[idx % SUGGESTION_COLORS.length],
      };
    });
  }, [brandProfile, templates]);

  const handleQuickSuggestion = (suggestion: { topic: string; templateId: string }) => {
    setSelectedTemplateId(suggestion.templateId);
    setTopic(suggestion.topic);
    // Pre-fill from brand profile
    if (brandProfile) {
      const audienceVal = brandProfile.audience?.segments?.[0]?.name || "";
      const toneVal = brandProfile.voice?.tone?.slice(0, 3).join(", ") || "";
      if (audienceVal) setAudience(audienceVal);
      if (toneVal) setTone(toneVal);
    }
    setSkippedPreview(true);
    setPhase("fill");
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPhase("preview");
  };

  const handleUseTemplate = () => {
    // Pre-fill from brand profile
    if (brandProfile) {
      if (!audience) {
        setAudience(brandProfile.audience?.segments?.[0]?.name || "");
      }
      if (!tone) {
        setTone(brandProfile.voice?.tone?.join(", ") || "");
      }
    }
    // Pre-fill CTA from template default
    if (selectedTemplate) {
      const ctaVar = selectedTemplate.variables.find((v) => v.name === "cta");
      if (ctaVar?.default && !cta) {
        setCta(ctaVar.default);
      }
    }
    setPhase("fill");
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !selectedTemplateId) return;

    setPhase("generating");
    setIsGenerating(true);

    try {
      const result = await generateFromTemplate({
        templateId: selectedTemplateId,
        variables: {
          topic: topic.trim(),
          audience: audience.trim() || undefined,
          tone: tone.trim() || undefined,
          customInstructions: customInstructions.trim() || undefined,
          cta: cta.trim() || undefined,
        },
      });

      setGeneratedBody(result.body);
      setGeneratedContentId(result.contentId);
      setPhase("result");
      showSuccess(
        "Contenido generado",
        `"${topic}" creado como borrador con template "${result.templateName}"`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error al generar", message);
      setPhase("fill");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnother = () => {
    // Reset fill fields but keep template selected
    setTopic("");
    setCustomInstructions("");
    setGeneratedBody("");
    setGeneratedContentId(null);
    setPhase("fill");
  };

  const handleCreateTemplate = async () => {
    if (!newName.trim() || !newPromptTemplate.trim()) return;
    setIsCreating(true);
    try {
      const _templateId = await createCustomTemplate({
        name: newName.trim(),
        description: newDescription.trim(),
        category: newCategory,
        contentType: newContentType,
        channels: [newContentType.startsWith("social_") ? newContentType.replace("social_", "") : newContentType],
        promptTemplate: newPromptTemplate.trim(),
        variables: [
          { name: "topic", description: "Tema principal", required: true },
          { name: "audience", description: "Audiencia objetivo", required: false, default: "profesionales" },
          { name: "tone", description: "Tono de voz", required: false, default: "profesional" },
        ],
        exampleOutput: newExampleOutput.trim() || "Ejemplo no proporcionado.",
        tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      showSuccess("Template creado", `"${newName}" listo para usar`);
      // Reset and go to browse
      setNewName("");
      setNewDescription("");
      setNewPromptTemplate("");
      setNewExampleOutput("");
      setNewTags("");
      setCategoryFilter("_my");
      setPhase("browse");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error al crear template", message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    // Reset state
    setPhase("browse");
    setCategoryFilter("");
    setSearchQuery("");
    setSelectedTemplateId(null);
    setTopic("");
    setAudience("");
    setTone("");
    setCustomInstructions("");
    setCta("");
    setGeneratedBody("");
    setGeneratedContentId(null);
    onClose();
  };

  const handleBack = () => {
    if (phase === "preview") setPhase("browse");
    else if (phase === "fill") { setPhase(skippedPreview ? "browse" : "preview"); setSkippedPreview(false); }
    else if (phase === "result") setPhase("fill");
    else if (phase === "create") setPhase("browse");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl mx-4 bg-[var(--surface-0)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            {phase !== "browse" && (
              <button
                onClick={handleBack}
                disabled={isGenerating}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition mr-1 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <LayoutTemplate className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {phase === "browse" && "Templates de Contenido"}
              {phase === "preview" && selectedTemplate?.name}
              {phase === "fill" && "Personalizar Template"}
              {phase === "generating" && "Generando Contenido..."}
              {phase === "result" && "Contenido Generado"}
              {phase === "create" && "Crear Template"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <>
            {/* ── PHASE: BROWSE ── */}
            {phase === "browse" && (
              <div className="space-y-4">

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar templates por nombre, descripción o tags..."
                    className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCategoryFilter(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1",
                        categoryFilter === tab.id
                          ? tab.id === "_my"
                            ? "bg-purple-600 text-white"
                            : "bg-[var(--surface-3)] text-white"
                          : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {tab.id === "_my" && <User className="w-3 h-3" />}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Quick Suggestions from Strategy */}
                {quickSuggestions.length > 0 && !searchQuery && !categoryFilter && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Generar rápido</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {quickSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleQuickSuggestion(suggestion)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left shrink-0",
                            suggestion.color
                          )}
                        >
                          <Zap className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--text-primary)] whitespace-nowrap">
                              {suggestion.topic}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">
                              {suggestion.templateName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Grid */}
                {!templates ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 rounded-xl bg-[var(--surface-1)] animate-pulse" />
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-tertiary)] text-sm">
                    {searchQuery
                      ? `No se encontraron templates para "${searchQuery}".`
                      : categoryFilter === "_my"
                        ? "Aún no tienes templates personalizados."
                        : "No hay templates en esta categoría."}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredTemplates.map((template) => {
                      const Icon = CONTENT_TYPE_ICONS[template.contentType] || FileText;
                      const color = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.misc;

                      return (
                        <button
                          key={template.templateId}
                          onClick={() => handleSelectTemplate(template.templateId)}
                          className="text-left p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-sm bg-[var(--card-bg)] transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg border shrink-0", color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--text-primary)] text-sm truncate group-hover:text-[var(--accent)] transition-colors">
                                {template.name}
                              </p>
                              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {template.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                                    >
                                      <Tag className="w-2.5 h-2.5" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {(template.usageCount ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] font-medium shrink-0">
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    {template.usageCount} usos
                                  </span>
                                )}
                              </div>
                              {template.userId && (
                                <span className="inline-flex items-center gap-0.5 mt-1.5 px-1.5 py-0.5 rounded text-[10px] bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]">
                                  <User className="w-2.5 h-2.5" />
                                  Mi template
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* "+ Crear Template" Card */}
                    <button
                      onClick={() => setPhase("create")}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[var(--border-hover)] hover:border-purple-400 hover:bg-[var(--badge-purple-bg)]/50 transition-all group min-h-[120px]"
                    >
                      <div className="p-2 rounded-lg bg-[var(--surface-1)] group-hover:bg-purple-100 transition-colors">
                        <Plus className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--badge-purple-text)] transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-tertiary)] group-hover:text-[var(--badge-purple-text)] mt-2 transition-colors">
                        Crear Template
                      </p>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE: PREVIEW ── */}
            {phase === "preview" && selectedTemplate && (
              <div className="space-y-4">

                <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", CATEGORY_COLORS[selectedTemplate.category])}>
                    {selectedTemplate.category}
                  </span>
                  <span>{selectedTemplate.contentType.replace(/_/g, " ")}</span>
                  {(selectedTemplate.usageCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {selectedTemplate.usageCount} usos
                    </span>
                  )}
                </div>

                <p className="text-sm text-[var(--text-secondary)]">{selectedTemplate.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-[var(--surface-1)] text-[var(--text-secondary)]"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {selectedTemplate.industry.map((ind) => (
                    <span
                      key={ind}
                      className="px-2 py-1 rounded-md text-xs bg-[var(--accent-subtle)] text-[var(--accent)]"
                    >
                      {ind}
                    </span>
                  ))}
                </div>

                {/* Example Output */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
                    <Eye className="w-4 h-4" />
                    Ejemplo de resultado
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-sm text-[var(--text-secondary)] whitespace-pre-line max-h-60 overflow-y-auto">
                    {selectedTemplate.exampleOutput}
                  </div>
                </div>

                {/* Variables preview */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Variables del template</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((v) => (
                      <span
                        key={v.name}
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          v.required ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                        )}
                      >
                        {`{{${v.name}}}`}{v.required && " *"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PHASE: FILL ── */}
            {phase === "fill" && (
              <div className="space-y-4">

                {/* Topic (always required) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Tema <span className="text-[var(--error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ej: 5 tendencias de IA para marketing en 2026"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition text-sm"
                  />
                </div>

                {/* Audience */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Audiencia objetivo
                    {brandProfile?.audience?.segments?.[0]?.name && (
                      <span className="text-[var(--text-tertiary)] font-normal ml-1">(del perfil de marca)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Ej: profesionales de marketing B2B"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition text-sm"
                  />
                </div>

                {/* Tone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Tono
                    {brandProfile?.voice?.tone?.length ? (
                      <span className="text-[var(--text-tertiary)] font-normal ml-1">(del perfil de marca)</span>
                    ) : null}
                  </label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Ej: profesional pero cercano"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition text-sm"
                  />
                </div>

                {/* CTA (if template has it) */}
                {selectedTemplate?.variables?.some((v) => v.name === "cta") && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Call to Action <span className="text-[var(--text-tertiary)] font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      placeholder="Ej: Registrate gratis"
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition text-sm"
                    />
                  </div>
                )}

                {/* Custom Instructions */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Instrucciones adicionales <span className="text-[var(--text-tertiary)] font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Ej: Enfócate en el mercado latinoamericano, incluye estadísticas recientes..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition resize-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── PHASE: GENERATING ── */}
            {phase === "generating" && (
              <div className="py-16 flex flex-col items-center justify-center text-center">

                <div className="relative">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-[var(--accent)] absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="mt-4 text-[var(--text-secondary)] font-medium">Generando contenido con template...</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  Usando &ldquo;{selectedTemplate?.name}&rdquo; + tu perfil de marca
                </p>
              </div>
            )}

            {/* ── PHASE: RESULT ── */}
            {phase === "result" && (
              <div className="space-y-4">

                <div className="flex items-center gap-2 text-[var(--badge-green-text)]">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">Contenido creado como borrador</p>
                </div>

                {/* Generated content preview */}
                <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-sm text-[var(--text-secondary)] whitespace-pre-line max-h-72 overflow-y-auto">
                  {generatedBody}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedBody);
                      showSuccess("Copiado", "Contenido copiado al portapapeles");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm font-medium transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                  <button
                    onClick={handleGenerateAnother}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--badge-purple-bg)] hover:bg-purple-100 text-[var(--badge-purple-text)] text-sm font-medium transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generar Otro
                  </button>
                </div>
              </div>
            )}

            {/* ── PHASE: CREATE ── */}
            {phase === "create" && (
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      Nombre <span className="text-[var(--error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Mi LinkedIn Post"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                    >
                      <option value="social">Social</option>
                      <option value="blog">Blog</option>
                      <option value="email">Email</option>
                      <option value="ads">Ads</option>
                      <option value="misc">Otros</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Descripción</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descripción breve del template"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Tipo de contenido</label>
                  <select
                    value={newContentType}
                    onChange={(e) => setNewContentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  >
                    {CONTENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    Prompt Template <span className="text-[var(--error)]">*</span>
                  </label>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Usa {"{{topic}}"}, {"{{audience}}"}, {"{{tone}}"}, {"{{cta}}"} como variables
                  </p>
                  <textarea
                    value={newPromptTemplate}
                    onChange={(e) => setNewPromptTemplate(e.target.value)}
                    placeholder={'Write a post about "{{topic}}" for {{audience}}.\nTone: {{tone}}'}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition resize-none text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Ejemplo de resultado</label>
                  <textarea
                    value={newExampleOutput}
                    onChange={(e) => setNewExampleOutput(e.target.value)}
                    placeholder="Un ejemplo del contenido que este template debería generar..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Tags</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="engagement, conversion, education (separados por coma)"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-hover)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  />
                </div>
              </div>
            )}
          </>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          {phase === "browse" && (
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition"
            >
              Cerrar
            </button>
          )}

          {phase === "preview" && (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition"
              >
                Volver
              </button>
              <button
                onClick={handleUseTemplate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition"
              >
                <Edit2 className="w-4 h-4" />
                Usar Template
              </button>
            </>
          )}

          {phase === "fill" && (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition"
              >
                Volver
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !topic.trim()
                    ? "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
                    : "bg-[var(--accent)] hover:bg-[var(--accent)] text-white"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Generar Contenido
              </button>
            </>
          )}

          {phase === "result" && (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-lg bg-[var(--surface-3)] hover:bg-[var(--surface-2)] text-white text-sm font-medium transition"
            >
              Listo
            </button>
          )}

          {phase === "create" && (
            <>
              <button
                onClick={handleBack}
                disabled={isCreating}
                className="px-4 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newName.trim() || !newPromptTemplate.trim() || isCreating}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !newName.trim() || !newPromptTemplate.trim() || isCreating
                    ? "bg-[var(--surface-2)] text-[var(--text-tertiary)] cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                )}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Crear Template
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
