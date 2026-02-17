"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { isSameDay } from "date-fns";

/** Strip markdown syntax for plain-text previews */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")        // headings
    .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
    .replace(/\*(.*?)\*/g, "$1")         // italic
    .replace(/~~(.*?)~~/g, "$1")         // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // inline code / code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[>\-*+]\s+/gm, "")       // blockquotes, list markers
    .replace(/^(Contenido Mejorado\s*)/gm, "") // AI metadata prefix
    .replace(/^(Tipo|Titulo|Asunto|Canal|Formato):\s*[^\n]*/gm, "") // AI metadata lines
    .replace(/\n{2,}/g, " ")            // collapse multiple newlines
    .replace(/\s{2,}/g, " ")            // collapse multiple spaces
    .trim();
}
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  BookOpen,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Video,
  FileCode,
  Eye,
  Calendar,
  CalendarDays,
  Hash,
  Copy,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Edit2,
  Loader2,
  Columns3,
  History,
  LayoutTemplate,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyContent } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { UploadContentForm } from "@/components/content/UploadContentForm";
import { KanbanBoard } from "@/components/content-pipeline/KanbanBoard";
import { PipelineStats } from "@/components/content-pipeline/PipelineStats";
import { ScheduledContentList } from "@/components/content-pipeline/ScheduledContentList";
import { CalendarGrid } from "@/components/content-pipeline/CalendarGrid";
import { CalendarDayDetail } from "@/components/content-pipeline/CalendarDayDetail";
import { translate } from "@/lib/language";
import dynamic from "next/dynamic";
import { CrossPlatformPublishPanel } from "@/components/content/CrossPlatformPublishPanel";
import { UnifiedPublishHistory } from "@/components/content/UnifiedPublishHistory";
import { AnalyzeButton } from "@/components/content/AnalyzeButton";
import { ContentAnalysisPanel } from "@/components/content/ContentAnalysisPanel";
import { AIGeneratedBadge } from "@/components/content/AIGeneratedBadge";
import { RepurposePanel } from "@/components/content/RepurposePanel";
import { ContentAutopilotPanel } from "@/components/content/ContentAutopilotPanel";
import { DerivedVersionsList } from "@/components/content/DerivedVersionsList";

const RepurposeContentModal = dynamic(
  () => import("@/components/content/RepurposeContentModal").then((m) => m.RepurposeContentModal),
  { ssr: false }
);
const EditContentModal = dynamic(
  () => import("@/components/content/EditContentModal").then((m) => m.EditContentModal),
  { ssr: false }
);
const GenerateContentModal = dynamic(
  () => import("@/components/content/GenerateContentModal").then((m) => m.GenerateContentModal),
  { ssr: false }
);
const VersionHistory = dynamic(
  () => import("@/components/content/VersionHistory").then((m) => m.VersionHistory),
  { ssr: false }
);
const VersionDiff = dynamic(
  () => import("@/components/content/VersionDiff").then((m) => m.VersionDiff),
  { ssr: false }
);
const RollbackDialog = dynamic(
  () => import("@/components/content/RollbackDialog").then((m) => m.RollbackDialog),
  { ssr: false }
);
const SocialPostPreview = dynamic(
  () => import("@/components/content/SocialPostPreview").then((m) => m.SocialPostPreview),
  { ssr: false }
);
const TemplatePickerModal = dynamic(
  () => import("@/components/content/TemplatePickerModal").then((m) => m.TemplatePickerModal),
  { ssr: false }
);

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
  { value: "case_study", label: "Caso de Éxito" },
  { value: "video_script", label: "Guión de Video" },
];

const CONTENT_STATUSES = [
  { value: "", label: "Todos los estados" },
  { value: "draft", label: "Borrador" },
  { value: "review", label: "En Revisión" },
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

type ContentTab = "list" | "pipeline" | "calendar";

const contentTabs: { key: ContentTab; label: string; icon: React.ElementType }[] = [
  { key: "pipeline", label: "Pipeline", icon: Columns3 },
  { key: "list", label: "Lista", icon: List },
  { key: "calendar", label: "Calendario", icon: CalendarDays },
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

// Status workflow actions component
function StatusActions({ content, onStatusChange }: { content: Doc<"content">; onStatusChange: (status: string) => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  // Draft → Submit for Review
  if (content.status === "draft") {
    return (
      <button
        onClick={() => handleStatusChange("review")}
        disabled={isLoading}
        className="w-full px-3 py-1.5 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Enviar a Revisión
      </button>
    );
  }

  // In Review → Approve or Request Revision
  if (content.status === "review") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleStatusChange("revision_needed")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded border border-[var(--border-hover)] hover:bg-[var(--surface-0)] disabled:opacity-50 text-[var(--text-secondary)] text-sm font-medium transition-colors"
        >
          Solicitar Cambios
        </button>
        <button
          onClick={() => handleStatusChange("approved")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded bg-[var(--success)] hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Aprobar
        </button>
      </div>
    );
  }

  // Approved → Schedule or Publish
  if (content.status === "approved") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleStatusChange("scheduled")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded border border-[var(--border-hover)] hover:bg-[var(--surface-0)] disabled:opacity-50 text-[var(--text-secondary)] text-sm font-medium transition-colors"
        >
          Programar
        </button>
        <button
          onClick={() => handleStatusChange("published")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Publicar Ahora
        </button>
      </div>
    );
  }

  // Published → Archive
  if (content.status === "published") {
    return (
      <button
        onClick={() => handleStatusChange("archived")}
        disabled={isLoading}
        className="w-full px-3 py-1.5 rounded border border-[var(--border-hover)] hover:bg-[var(--surface-0)] disabled:opacity-50 text-[var(--text-tertiary)] text-sm font-medium transition-colors"
      >
        Archivar
      </button>
    );
  }

  return null;
}

function TemplateOriginBadge({ templateId, onRegenerate }: { templateId: string; onRegenerate: (tplId: string) => void }) {
  const template = useQuery(api.contentTemplates.getTemplate, { templateId });

  if (!template) return null;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--badge-purple-bg)] border border-purple-200">
      <div className="flex items-center gap-2 min-w-0">
        <LayoutTemplate className="h-4 w-4 text-purple-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-[var(--badge-purple-text)] font-medium">Generado desde template</p>
          <p className="text-xs text-purple-500 truncate">{template.name}</p>
        </div>
      </div>
      <button
        onClick={() => onRegenerate(templateId)}
        className="text-xs text-[var(--badge-purple-text)] hover:text-purple-800 font-medium shrink-0 ml-2"
      >
        Regenerar
      </button>
    </div>
  );
}

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [editingContent, setEditingContent] = useState<Doc<"content"> | null>(null);
  const [analysisContentId, setAnalysisContentId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalPreselect, setTemplateModalPreselect] = useState<string | undefined>(undefined);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{ versionAId: Id<"contentVersions">; versionBId: Id<"contentVersions"> } | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ versionId: Id<"contentVersions">; versionNumber: number } | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [repurposeContent, setRepurposeContent] = useState<Doc<"content"> | null>(null);

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

  const selectedContentData = useMemo(() => {
    if (!selectedContent || !content) return null;
    return content.find((c: { contentId: string }) => c.contentId === selectedContent);
  }, [selectedContent, content]);


  // Calendar data derivations
  const calendarItems = useMemo(() => {
    if (!content) return [];
    return content.filter(
      (c: Record<string, string | number | undefined>) =>
        c.status === "scheduled" || c.status === "approved" || c.status === "published"
    );
  }, [content]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDay || !content) return [];
    return content.filter((c: Record<string, unknown>) => {
      const sf = c.scheduledFor as number | undefined;
      if (!sf) return false;
      return isSameDay(new Date(sf), selectedDay);
    });
  }, [selectedDay, content]);

  const unscheduledApproved = useMemo(() => {
    if (!content) return [];
    return content.filter(
      (c: Record<string, unknown>) => c.status === "approved" && !c.scheduledFor
    );
  }, [content]);

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

  // Animation variants
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
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] hover:bg-purple-100 transition-colors text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Generar Contenido
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-orange-100 transition-colors text-sm font-medium"
          >
            <LayoutTemplate className="h-4 w-4" />
            Usar Template
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

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <>
          <PipelineStats counts={statusCounts} />
          <div className="flex gap-5">
            <div className="flex-1">
              <CalendarGrid
                items={calendarItems}
                onDayClick={(date) => setSelectedDay(date)}
                onReschedule={handleReschedule}
              />
            </div>
            <div className="w-64 shrink-0 hidden lg:block">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sticky top-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  {translate("approvedSidebar")}
                </h4>
                <p className="text-[10px] text-[var(--text-tertiary)] mb-3">
                  {translate("dragToSchedule")}
                </p>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {unscheduledApproved.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                      {translate("noContent")}
                    </p>
                  ) : (
                    unscheduledApproved.map((item: { _id: Id<"content">; title: string; type: string }) => (
                      <div
                        key={item._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", item._id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] cursor-grab active:cursor-grabbing hover:border-orange-300 transition-colors"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs text-[var(--text-secondary)] truncate">{item.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {selectedDay && (
              <CalendarDayDetail
                date={selectedDay}
                items={selectedDayItems}
                onClose={() => setSelectedDay(null)}
                onPublishNow={handlePublishNow}
                onUnschedule={handleUnschedule}
              />
            )}
          </div>
        </>
      )}

      {/* List Tab - original content view */}
      {activeTab === "list" && (<>
      {/* Filters */}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        {/* Advanced Filters Toggle Button */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="px-6 py-3 rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-0)] transition-colors flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros avanzados
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvancedFilters && "rotate-180")} />
        </button>

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
            title="Vista cuadrícula"
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

      {/* Advanced Filters - Progressive Disclosure */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center p-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)]">
              {/* Type Filter */}
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-10 pr-8 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--border-hover)] bg-[var(--card-bg)] py-2 pl-4 pr-8 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {CONTENT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">
          {content.filter((c: { status: string }) => c.status === "draft").length} Borradores
        </Badge>
        <Badge variant="warning">
          {content.filter((c: { status: string }) => c.status === "review").length} En Revisión
        </Badge>
        <Badge variant="success">
          {content.filter((c: { status: string }) => c.status === "published").length} Publicados
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Content Grid/List — hidden when detail is open */}
        <div className={cn(
          "flex-1 transition-all",
          selectedContent ? "hidden" : "w-full"
        )}>
          <AnimatePresence mode="wait">
            {filteredContent.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyContent onAction={() => setShowGenerateModal(true)} onTemplateAction={() => setShowTemplateModal(true)} />
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
                  const isSelected = selectedContent === item.contentId;

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
                        className={cn(
                          "cursor-pointer transition-all h-full relative overflow-hidden",
                          isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                        )}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContent(item.contentId);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--card-bg)]/90 backdrop-blur-sm hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shadow-sm transition-colors"
                            title="Vista previa"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingContent(item);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--card-bg)]/90 backdrop-blur-sm hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] shadow-sm transition-colors"
                            title="Editar contenido"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <AnalyzeButton contentId={item._id} />
                        </div>

                        <div
                          className="p-4"
                          onClick={() =>
                            setSelectedContent(isSelected ? null : item.contentId)
                          }
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
                  const isSelected = selectedContent === item.contentId;

                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      layout
                      className="group"
                    >
                      <Card
                        hover
                        className={cn(
                          "cursor-pointer transition-all",
                          isSelected && "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                        )}
                      >
                        <div
                          className="p-3"
                          onClick={() =>
                            setSelectedContent(isSelected ? null : item.contentId)
                          }
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent(item.contentId);
                                }}
                                className="p-1.5 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                                title="Vista previa"
                              >
                                <Eye className="h-3.5 w-3.5" />
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
        </div>

        {/* Full-width Content Detail View — replaces grid when selected */}
        {selectedContentData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full"
          >
            {/* Top bar: back + title + badges + actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedContent(null)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {selectedContentData.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className={typeColors[selectedContentData.type]}>
                      {formatTypeName(selectedContentData.type)}
                    </Badge>
                    <StatusBadge status={selectedContentData.status} />
                    {selectedContentData.sourceTaskId && <AIGeneratedBadge />}
                    {selectedContentData.metadata?.wordCount && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {selectedContentData.metadata.wordCount} palabras
                      </span>
                    )}
                    {selectedContentData.metadata?.readingTime && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {selectedContentData.metadata.readingTime} min lectura
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatDate(selectedContentData.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedContentData.body)}
                  className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingContent(selectedContentData)}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnalysisContentId(selectedContentData._id)}
                  className="px-4 py-2 rounded-lg bg-[var(--badge-purple-bg)] hover:bg-purple-100 text-[var(--badge-purple-text)] font-medium transition-colors flex items-center gap-2 border border-purple-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Analizar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRepurposeContent(selectedContentData)}
                  className="px-4 py-2 rounded-lg bg-[var(--badge-blue-bg)] hover:bg-blue-100 text-[var(--badge-blue-text)] font-medium transition-colors flex items-center gap-2 border border-blue-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  Repurposar
                </motion.button>
              </div>
            </div>

            {/* Two-column layout: rendered content (main) + sidebar (meta) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main: Social post preview */}
              <div className="lg:col-span-2">
                <SocialPostPreview
                  body={selectedContentData.body}
                  type={selectedContentData.type}
                  title={selectedContentData.title}
                  imageUrl={(selectedContentData.assets as { type: string; url: string }[] | undefined)?.find((a) => a.type === "image")?.url}
                  assets={selectedContentData.assets as { type: "image" | "video" | "document"; url: string; alt?: string }[] | undefined}
                />
              </div>

              {/* Sidebar: metadata & actions */}
              <div className="space-y-4">
                {/* Template Origin Badge */}
                {selectedContentData.sourceTemplateId && (
                  <TemplateOriginBadge
                    templateId={selectedContentData.sourceTemplateId}
                    onRegenerate={(tplId) => {
                      setTemplateModalPreselect(tplId);
                      setShowTemplateModal(true);
                    }}
                  />
                )}

                {/* Status Actions */}
                <Card>
                  <CardContent className="p-4">
                    <StatusActions
                      content={selectedContentData}
                      onStatusChange={async (status) => {
                        await updateContentStatus({
                          id: selectedContentData._id,
                          status: status as "draft" | "review" | "revision_needed" | "approved" | "scheduled" | "published" | "archived"
                        });
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Derived Versions */}
                <DerivedVersionsList
                  contentId={selectedContentData._id}
                  onSelectContent={(id) => setSelectedContent(id)}
                />

                {/* Multi-Platform Publish */}
                <CrossPlatformPublishPanel
                  contentId={selectedContentData._id}
                  contentBody={selectedContentData.body}
                  contentStatus={selectedContentData.status}
                  contentHashtags={selectedContentData.metadata?.targetKeywords}
                />

                {/* Version History */}
                <Card>
                  <CardContent className="p-4">
                    <button
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">Historial de versiones</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[var(--text-tertiary)] transition-transform",
                          showVersionHistory && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {showVersionHistory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3">
                            <VersionHistory
                              contentId={selectedContentData._id}
                              onCompare={(vA, vB) => setDiffVersions({ versionAId: vA, versionBId: vB })}
                              onRollback={(vId, vNum) => setRollbackTarget({ versionId: vId, versionNumber: vNum })}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Keywords */}
                {selectedContentData.metadata?.targetKeywords && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">Palabras Clave</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedContentData.metadata.targetKeywords.map(
                          (keyword: string) => (
                            <Badge key={keyword} variant="default">
                              <Hash className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SEO */}
                {selectedContentData.seo && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">SEO</p>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">Meta Title</p>
                        <p className="text-[var(--text-secondary)] text-sm">{selectedContentData.seo.metaTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">Meta Description</p>
                        <p className="text-[var(--text-secondary)] text-sm">{selectedContentData.seo.metaDescription}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-tertiary)]">Slug</p>
                        <p className="text-[var(--text-secondary)] font-mono text-sm">/{selectedContentData.seo.slug}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Published URL */}
                {selectedContentData.publishedUrl && (
                  <a
                    href={selectedContentData.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent)] text-sm px-4 py-2 rounded-lg bg-[var(--accent-subtle)] border border-orange-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Ver publicado
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content Recycling — P7 */}
      {!selectedContent && (
        <div className="mt-8">
          <RepurposePanel />
        </div>
      )}

      {/* Unified Publishing History */}
      {!selectedContent && (
        <div className="mt-12">
          <UnifiedPublishHistory limit={20} />
        </div>
      )}
      </>)}

      {/* Edit Content Modal */}
      {editingContent && (
        <EditContentModal
          content={editingContent}
          isOpen={!!editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={() => setEditingContent(null)}
        />
      )}

      {/* Generate Content Modal */}
      {showGenerateModal && (
        <GenerateContentModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
        />
      )}

      {/* Template Picker Modal */}
      {showTemplateModal && (
        <TemplatePickerModal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setTemplateModalPreselect(undefined);
          }}
          preselectedTemplateId={templateModalPreselect}
        />
      )}

      {/* Repurpose Content Modal */}
      {repurposeContent && (
        <RepurposeContentModal
          isOpen={!!repurposeContent}
          onClose={() => setRepurposeContent(null)}
          content={repurposeContent}
        />
      )}

      {/* Content Analysis Panel */}
      <AnimatePresence>
        {analysisContentId && (
          <ContentAnalysisPanel
            contentId={analysisContentId as Id<"content">}
            isOpen={!!analysisContentId}
            onClose={() => setAnalysisContentId(null)}
          />
        )}
      </AnimatePresence>

      {/* Version Diff Modal */}
      {diffVersions && (
        <VersionDiff
          versionAId={diffVersions.versionAId}
          versionBId={diffVersions.versionBId}
          onClose={() => setDiffVersions(null)}
        />
      )}

      {/* Rollback Dialog */}
      {rollbackTarget && selectedContentData && (
        <RollbackDialog
          contentId={selectedContentData._id}
          versionId={rollbackTarget.versionId}
          versionNumber={rollbackTarget.versionNumber}
          onClose={() => setRollbackTarget(null)}
          onSuccess={() => {
            setRollbackTarget(null);
            setShowVersionHistory(false);
          }}
        />
      )}
    </div>
  );
}
