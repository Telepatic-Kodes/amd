"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
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
  blog: "bg-orange-50 text-orange-700 border-orange-200",
  email: "bg-green-50 text-green-700 border-green-200",
  ads: "bg-purple-50 text-purple-700 border-purple-200",
  misc: "bg-stone-100 text-stone-600 border-stone-200",
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
    else if (phase === "fill") setPhase("preview");
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
        className="relative w-full max-w-2xl mx-4 bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            {phase !== "browse" && (
              <button
                onClick={handleBack}
                disabled={isGenerating}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition mr-1 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <LayoutTemplate className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-stone-900">
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
            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── PHASE: BROWSE ── */}
            {phase === "browse" && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar templates por nombre, descripción o tags..."
                    className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                            : "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      )}
                    >
                      {tab.id === "_my" && <User className="w-3 h-3" />}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Template Grid */}
                {!templates ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-32 rounded-xl bg-stone-100 animate-pulse" />
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center text-stone-500 text-sm">
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
                          className="text-left p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm bg-white transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg border shrink-0", color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-stone-900 text-sm truncate group-hover:text-orange-700 transition-colors">
                                {template.name}
                              </p>
                              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {template.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-500"
                                    >
                                      <Tag className="w-2.5 h-2.5" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {(template.usageCount ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 font-medium shrink-0">
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    {template.usageCount} usos
                                  </span>
                                )}
                              </div>
                              {template.userId && (
                                <span className="inline-flex items-center gap-0.5 mt-1.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600">
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
                      className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-purple-400 hover:bg-purple-50/50 transition-all group min-h-[120px]"
                    >
                      <div className="p-2 rounded-lg bg-stone-100 group-hover:bg-purple-100 transition-colors">
                        <Plus className="w-5 h-5 text-stone-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <p className="text-sm font-medium text-stone-500 group-hover:text-purple-700 mt-2 transition-colors">
                        Crear Template
                      </p>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PHASE: PREVIEW ── */}
            {phase === "preview" && selectedTemplate && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", CATEGORY_COLORS[selectedTemplate.category])}>
                    {selectedTemplate.category}
                  </span>
                  <span>{selectedTemplate.contentType.replace(/_/g, " ")}</span>
                  {(selectedTemplate.usageCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      {selectedTemplate.usageCount} usos
                    </span>
                  )}
                </div>

                <p className="text-sm text-stone-600">{selectedTemplate.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-stone-100 text-stone-600"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {selectedTemplate.industry.map((ind) => (
                    <span
                      key={ind}
                      className="px-2 py-1 rounded-md text-xs bg-orange-50 text-orange-600"
                    >
                      {ind}
                    </span>
                  ))}
                </div>

                {/* Example Output */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-stone-700">
                    <Eye className="w-4 h-4" />
                    Ejemplo de resultado
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-stone-200 text-sm text-stone-600 whitespace-pre-line max-h-60 overflow-y-auto">
                    {selectedTemplate.exampleOutput}
                  </div>
                </div>

                {/* Variables preview */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Variables del template</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((v) => (
                      <span
                        key={v.name}
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          v.required ? "bg-orange-50 text-orange-700" : "bg-stone-100 text-stone-500"
                        )}
                      >
                        {`{{${v.name}}}`}{v.required && " *"}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PHASE: FILL ── */}
            {phase === "fill" && selectedTemplate && (
              <motion.div
                key="fill"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Topic (always required) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    Tema <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ej: 5 tendencias de IA para marketing en 2026"
                    className="w-full px-4 py-3 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-sm"
                  />
                </div>

                {/* Audience */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    Audiencia objetivo
                    {brandProfile?.audience?.segments?.[0]?.name && (
                      <span className="text-stone-400 font-normal ml-1">(del perfil de marca)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Ej: profesionales de marketing B2B"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-sm"
                  />
                </div>

                {/* Tone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    Tono
                    {brandProfile?.voice?.tone?.length ? (
                      <span className="text-stone-400 font-normal ml-1">(del perfil de marca)</span>
                    ) : null}
                  </label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="Ej: profesional pero cercano"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-sm"
                  />
                </div>

                {/* CTA (if template has it) */}
                {selectedTemplate.variables.some((v) => v.name === "cta") && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">
                      Call to Action <span className="text-stone-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      placeholder="Ej: Registrate gratis"
                      className="w-full px-4 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition text-sm"
                    />
                  </div>
                )}

                {/* Custom Instructions */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    Instrucciones adicionales <span className="text-stone-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Ej: Enfócate en el mercado latinoamericano, incluye estadísticas recientes..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition resize-none text-sm"
                  />
                </div>
              </motion.div>
            )}

            {/* ── PHASE: GENERATING ── */}
            {phase === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 flex flex-col items-center justify-center text-center"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="mt-4 text-stone-700 font-medium">Generando contenido con template...</p>
                <p className="text-sm text-stone-500 mt-1">
                  Usando &ldquo;{selectedTemplate?.name}&rdquo; + tu perfil de marca
                </p>
              </motion.div>
            )}

            {/* ── PHASE: RESULT ── */}
            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">Contenido creado como borrador</p>
                </div>

                {/* Generated content preview */}
                <div className="p-4 rounded-lg bg-white border border-stone-200 text-sm text-stone-700 whitespace-pre-line max-h-72 overflow-y-auto">
                  {generatedBody}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedBody);
                      showSuccess("Copiado", "Contenido copiado al portapapeles");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm font-medium transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                  <button
                    onClick={handleGenerateAnother}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Generar Otro
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PHASE: CREATE ── */}
            {phase === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Mi LinkedIn Post"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-stone-700">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as typeof newCategory)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
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
                  <label className="text-sm font-medium text-stone-700">Descripción</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descripción breve del template"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Tipo de contenido</label>
                  <select
                    value={newContentType}
                    onChange={(e) => setNewContentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  >
                    {CONTENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">
                    Prompt Template <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-stone-400">
                    Usa {"{{topic}}"}, {"{{audience}}"}, {"{{tone}}"}, {"{{cta}}"} como variables
                  </p>
                  <textarea
                    value={newPromptTemplate}
                    onChange={(e) => setNewPromptTemplate(e.target.value)}
                    placeholder={'Write a post about "{{topic}}" for {{audience}}.\nTone: {{tone}}'}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition resize-none text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Ejemplo de resultado</label>
                  <textarea
                    value={newExampleOutput}
                    onChange={(e) => setNewExampleOutput(e.target.value)}
                    placeholder="Un ejemplo del contenido que este template debería generar..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-700">Tags</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="engagement, conversion, education (separados por coma)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
          {phase === "browse" && (
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-stone-500 hover:text-stone-900 text-sm font-medium transition"
            >
              Cerrar
            </button>
          )}

          {phase === "preview" && (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-lg text-stone-500 hover:text-stone-900 text-sm font-medium transition"
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
                className="px-4 py-2.5 rounded-lg text-stone-500 hover:text-stone-900 text-sm font-medium transition"
              >
                Volver
              </button>
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !topic.trim()
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-500 text-white"
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
              className="px-6 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition"
            >
              Listo
            </button>
          )}

          {phase === "create" && (
            <>
              <button
                onClick={handleBack}
                disabled={isCreating}
                className="px-4 py-2.5 rounded-lg text-stone-500 hover:text-stone-900 text-sm font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newName.trim() || !newPromptTemplate.trim() || isCreating}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                  !newName.trim() || !newPromptTemplate.trim() || isCreating
                    ? "bg-stone-200 text-stone-500 cursor-not-allowed"
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
