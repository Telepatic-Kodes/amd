"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

/** Strip markdown syntax for plain-text previews */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[>\-*+]\s+/gm, "")
    .replace(/^(Contenido Mejorado\s*)/gm, "")
    .replace(/^(Tipo|Titulo|Asunto|Canal|Formato):\s*[^\n]*/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

import {
  FileText,
  Search,
  ChevronDown,
  BookOpen,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Video,
  FileCode,
  Calendar,
  Copy,
  LayoutGrid,
  List,
  Sparkles,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyContent } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { UploadContentForm } from "@/components/content/UploadContentForm";
import { KanbanBoard } from "@/components/content-pipeline/KanbanBoard";
import { PipelineStats } from "@/components/content-pipeline/PipelineStats";
import { ScheduledContentList } from "@/components/content-pipeline/ScheduledContentList";
import { translate } from "@/lib/language";
import { AIGeneratedBadge } from "@/components/content/AIGeneratedBadge";
import { ContentAutopilotPanel } from "@/components/content/ContentAutopilotPanel";
import { ContentFullscreen } from "@/components/content/ContentFullscreen";
import { useContentPageState } from "@/hooks/useContentPageState";
import type { ContentTab } from "@/hooks/useContentPageState";
import dynamic from "next/dynamic";

const GenerateContentModal = dynamic(
  () => import("@/components/content/GenerateContentModal").then((m) => m.GenerateContentModal),
  { ssr: false }
);

// --- Constants ---

const CONTENT_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "blog", label: "Blog" },
  { value: "social_linkedin", label: "LinkedIn" },
  { value: "social_twitter", label: "Twitter" },
  { value: "social_instagram", label: "Instagram" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "ad_copy", label: "Anuncio" },
  { value: "landing_page", label: "Landing Page" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "case_study", label: "Caso de Exito" },
  { value: "video_script", label: "Guion de Video" },
];

const CONTENT_STATUSES = [
  { value: "", label: "Todos los estados" },
  { value: "draft", label: "Borrador" },
  { value: "review", label: "En Revision" },
  { value: "revision_needed", label: "Necesita Cambios" },
  { value: "approved", label: "Aprobado" },
  { value: "scheduled", label: "Programado" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Archivado" },
];

const typeColors: Record<string, string> = {
  blog: "bg-[var(--accent-subtle)] text-[var(--accent)] border-orange-200",
  social_linkedin: "bg-sky-50 text-sky-700 border-sky-200",
  social_twitter: "bg-cyan-50 text-cyan-700 border-cyan-200",
  social_instagram: "bg-pink-50 text-pink-700 border-pink-200",
  social_tiktok: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] border-purple-200",
  email: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-green-200",
  newsletter: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] border-[var(--badge-green-bg)]",
  ad_copy: "bg-[var(--accent-subtle)] text-[var(--accent)] border-orange-200",
  landing_page: "bg-yellow-50 text-[var(--badge-amber-text)] border-yellow-200",
  whitepaper: "bg-[var(--accent-subtle)] text-[var(--accent)] border-orange-200",
  case_study: "bg-violet-50 text-violet-700 border-violet-200",
  video_script: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border-[var(--badge-red-bg)]",
};

const typeIcons: Record<string, React.ElementType> = {
  blog: BookOpen,
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_instagram: Instagram,
  social_tiktok: Video,
  email: Mail,
  newsletter: Mail,
  ad_copy: FileCode,
  landing_page: FileCode,
  whitepaper: FileText,
  case_study: FileText,
  video_script: Video,
};

const contentTabs: { key: ContentTab; label: string; icon: React.ElementType }[] = [
  { key: "pipeline", label: "Pipeline", icon: Columns3 },
  { key: "list", label: "Lista", icon: List },
];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTypeName(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// --- Animation variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// --- Main Page ---

export default function ContentPage() {
  const {
    activeTab,
    viewMode,
    filters,
    fullscreenContent,
    showGenerateModal,
    setActiveTab,
    setViewMode,
    setFilter,
    openFullscreen,
    closeFullscreen,
    openGenerateModal,
    closeGenerateModal,
  } = useContentPageState();

  const { searchQuery, typeFilter, statusFilter } = filters;

  const brandProfile = useQuery(api.brandProfile.getBrandProfile);

  const content = useQuery(api.functions.listContent, brandProfile === undefined ? "skip" : {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    brandProfileId: brandProfile?._id,
  });

  // Pipeline queries
  const brandArgs = brandProfile === undefined ? "skip" as const : { brandProfileId: brandProfile?._id };
  const contentByStatus = useQuery(api.contentPipeline.getContentByStatus, brandArgs);
  const statusCounts = useQuery(api.contentPipeline.getContentStatusCounts, brandArgs);
  const scheduledContent = useQuery(api.contentPipeline.getScheduledContent, brandArgs);

  // Pipeline mutations
  const publishContent = useMutation(api.contentPipeline.publishContent);
  const moveContent = useMutation(api.contentPipeline.moveContent);
  const rescheduleContent = useMutation(api.contentPipeline.rescheduleContent);

  const updateContentStatus = useMutation(api.functions.updateContentStatus);
  const { success, error: showError } = useToast();

  const filteredContent = useMemo(() => {
    if (!content) return [];

    let filtered = [...content];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.body.toLowerCase().includes(query) ||
          (item.summary && item.summary.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [content, searchQuery]);

  // Pipeline handlers
  const handlePublishNow = async (id: Id<"content">) => {
    try {
      await publishContent({ id });
      success(translate("contentPublished"), "El contenido ha sido publicado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleUnschedule = async (id: Id<"content">) => {
    try {
      await moveContent({ id, toStatus: "approved" });
      success(translate("unschedule"), "El contenido ha vuelto a estado aprobado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleReschedule = async (contentId: Id<"content">, newDate: number) => {
    try {
      await rescheduleContent({ id: contentId, scheduledFor: newDate });
      success(translate("rescheduleSuccess"), "Contenido reprogramado exitosamente");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success("Copiado", "Contenido copiado al portapapeles");
  };

  // Loading state
  if (!content) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--accent-subtle)]">
            <FileText className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">
              Contenido
            </h1>
            <p className="text-[var(--text-tertiary)] mt-1 text-lg">
              Cargando contenido...
            </p>
          </div>
        </div>
        <SkeletonGrid items={6} columns={3} />
      </div>
    );
  }

  return (
    <div data-tour="content-section" className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--accent-subtle)]">
            <FileText className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">
              Contenido
            </h1>
            <p className="text-[var(--text-tertiary)] mt-1 text-lg">
              Gestiona tus {content.length} piezas de contenido.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openGenerateModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] hover:bg-purple-100 transition-colors text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Generar Contenido
          </button>
        </div>
      </div>

      {/* Autopilot Panel */}
      <ContentAutopilotPanel />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-0,#f5f5f4)] w-fit">
        {contentTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              activeTab === key
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary,#78716c)] hover:bg-[var(--surface-1,#e7e5e4)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Pipeline Tab */}
      {activeTab === "pipeline" && (
        <>
          <PipelineStats counts={statusCounts} />
          <KanbanBoard columns={contentByStatus?.columns} statusCounts={statusCounts} />
          <ScheduledContentList
            scheduledContent={scheduledContent}
            onPublishNow={handlePublishNow}
            onUnschedule={handleUnschedule}
          />
        </>
      )}

      {/* List Tab */}
      {activeTab === "list" && (
        <>
          {/* Filters — always visible inline */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Upload Form */}
            <UploadContentForm onSuccess={() => {}} />

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                inputMode="search"
                placeholder="Buscar contenido..."
                value={searchQuery}
                onChange={(e) => setFilter("searchQuery", e.target.value)}
                className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setFilter("typeFilter", e.target.value)}
                className="appearance-none rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-3 pr-8 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setFilter("statusFilter", e.target.value)}
                className="appearance-none rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-3 pr-8 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {CONTENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-[var(--border-hover)] overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                )}
                title="Vista cuadricula"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]"
                )}
                title="Vista lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {content.filter((c: { status: string }) => c.status === "draft").length} Borradores
            </Badge>
            <Badge variant="warning">
              {content.filter((c: { status: string }) => c.status === "review").length} En Revision
            </Badge>
            <Badge variant="success">
              {content.filter((c: { status: string }) => c.status === "published").length} Publicados
            </Badge>
          </div>

          {/* Content Grid/List */}
          <AnimatePresence mode="wait">
            {filteredContent.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyContent onAction={() => openGenerateModal()} />
              </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredContent.map((item) => {
                  const TypeIcon = typeIcons[item.type] || FileText;

                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      layout
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="group"
                    >
                      <Card
                        hover
                        className="cursor-pointer transition-all h-full relative overflow-hidden"
                      >
                        {/* Quick Actions on Hover */}
                        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.body);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--card-bg)]/90 backdrop-blur-sm hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shadow-sm transition-colors"
                            title="Copiar contenido"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div
                          className="p-4"
                          onClick={() => openFullscreen(item)}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                typeColors[item.type] || "bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                              )}
                            >
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-2 flex items-center gap-1.5">
                            {item.title}
                            {item.sourceTaskId && <AIGeneratedBadge />}
                          </h3>

                          {/* Preview */}
                          <p className="text-xs text-[var(--text-tertiary)] line-clamp-3 mb-3">
                            {stripMarkdown(item.summary || item.body).slice(0, 150)}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                            <Badge className={typeColors[item.type]}>
                              {formatTypeName(item.type)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {filteredContent.map((item) => {
                  const TypeIcon = typeIcons[item.type] || FileText;

                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      layout
                      className="group"
                    >
                      <Card
                        hover
                        className="cursor-pointer transition-all"
                      >
                        <div
                          className="p-3"
                          onClick={() => openFullscreen(item)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                                typeColors[item.type] || "bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                              )}
                            >
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-[var(--text-primary)] text-sm truncate">
                                  {item.title}
                                </h3>
                                {item.sourceTaskId && <AIGeneratedBadge />}
                              </div>
                              <p className="text-xs text-[var(--text-tertiary)] truncate">
                                {stripMarkdown(item.summary || item.body).slice(0, 100)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.body);
                                }}
                                className="p-1.5 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                                title="Copiar"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <Badge className={typeColors[item.type]}>
                              {formatTypeName(item.type)}
                            </Badge>
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ContentFullscreen overlay */}
      <AnimatePresence>
        {fullscreenContent && (
          <ContentFullscreen
            content={fullscreenContent}
            onClose={closeFullscreen}
            onStatusChange={async (status) => {
              await updateContentStatus({
                id: fullscreenContent._id,
                status: status as "draft" | "review" | "revision_needed" | "approved" | "scheduled" | "published" | "archived",
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Generate Content Modal */}
      {showGenerateModal && (
        <GenerateContentModal
          isOpen={showGenerateModal}
          onClose={closeGenerateModal}
        />
      )}
    </div>
  );
}
