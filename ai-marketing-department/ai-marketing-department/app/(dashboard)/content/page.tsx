"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  Clock,
  Hash,
  Copy,
  ExternalLink,
  X,
  LayoutGrid,
  List,
  Sparkles,
  Edit2,
  Loader2,
  Columns3,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyContent } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { UploadContentForm } from "@/components/content/UploadContentForm";
import { EditContentModal } from "@/components/content/EditContentModal";
import { CrossPlatformPublishPanel } from "@/components/content/CrossPlatformPublishPanel";
import { UnifiedPublishHistory } from "@/components/content/UnifiedPublishHistory";
import { AnalyzeButton } from "@/components/content/AnalyzeButton";
import { ContentAnalysisPanel } from "@/components/content/ContentAnalysisPanel";
import { GenerateContentModal } from "@/components/content/GenerateContentModal";
import { VersionHistory } from "@/components/content/VersionHistory";
import { VersionDiff } from "@/components/content/VersionDiff";
import { RollbackDialog } from "@/components/content/RollbackDialog";

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
  blog: "bg-orange-50 text-orange-700 border-orange-200",
  social_linkedin: "bg-sky-50 text-sky-700 border-sky-200",
  social_twitter: "bg-cyan-50 text-cyan-700 border-cyan-200",
  social_instagram: "bg-pink-50 text-pink-700 border-pink-200",
  social_tiktok: "bg-purple-50 text-purple-700 border-purple-200",
  email: "bg-green-50 text-green-700 border-green-200",
  newsletter: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ad_copy: "bg-orange-50 text-orange-700 border-orange-200",
  landing_page: "bg-yellow-50 text-yellow-700 border-yellow-200",
  whitepaper: "bg-orange-50 text-orange-700 border-orange-200",
  case_study: "bg-violet-50 text-violet-700 border-violet-200",
  video_script: "bg-red-50 text-red-700 border-red-200",
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
        className="w-full px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
          className="flex-1 px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-50 disabled:opacity-50 text-stone-700 text-sm font-medium transition-colors"
        >
          Solicitar Cambios
        </button>
        <button
          onClick={() => handleStatusChange("approved")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
          className="flex-1 px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-50 disabled:opacity-50 text-stone-700 text-sm font-medium transition-colors"
        >
          Programar
        </button>
        <button
          onClick={() => handleStatusChange("published")}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
        className="w-full px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-50 disabled:opacity-50 text-stone-500 text-sm font-medium transition-colors"
      >
        Archivar
      </button>
    );
  }

  return null;
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{ versionAId: Id<"contentVersions">; versionBId: Id<"contentVersions"> } | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ versionId: Id<"contentVersions">; versionNumber: number } | null>(null);

  const content = useQuery(api.functions.listContent, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

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
          <div className="p-2 rounded-xl bg-orange-50">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-stone-900">
              Content
            </h1>
            <p className="text-stone-500 mt-1 text-lg">
              Create, edit and publish content.
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
          <div className="p-2 rounded-xl bg-orange-50">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-stone-900">
              Contenido
            </h1>
            <p className="text-stone-500 mt-1 text-lg">
              Gestiona tus {content.length} piezas de contenido.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Generar Contenido
          </button>
          <Link
            href="/content/pipeline"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium"
          >
            <Columns3 className="h-4 w-4" />
            Vista Pipeline
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Upload Form */}
        <UploadContentForm onSuccess={() => {}} />

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Advanced Filters Toggle Button */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="px-6 py-3 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros avanzados
          <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvancedFilters && "rotate-180")} />
        </button>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg border border-stone-300 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "grid"
                ? "bg-orange-50 text-orange-600"
                : "text-stone-400 hover:bg-stone-100"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "list"
                ? "bg-orange-50 text-orange-600"
                : "text-stone-400 hover:bg-stone-100"
            )}
            title="List view"
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center p-4 rounded-lg border border-stone-200 bg-white">
              {/* Type Filter */}
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-stone-300 bg-white py-2 pl-4 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {CONTENT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
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
        {/* Content Grid/List */}
        <div className={cn(
          "flex-1 transition-all",
          selectedContent ? "lg:w-2/3" : "w-full"
        )}>
          <AnimatePresence mode="wait">
            {filteredContent.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyContent />
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
                          isSelected && "border-orange-500 ring-1 ring-orange-500"
                        )}
                      >
                        {/* Quick Actions on Hover */}
                        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.body);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-stone-100 text-stone-400 hover:text-stone-700 shadow-sm transition-colors"
                            title="Copy content"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContent(item.contentId);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-stone-100 text-stone-400 hover:text-stone-700 shadow-sm transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingContent(item);
                            }}
                            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-stone-100 text-stone-400 hover:text-stone-700 shadow-sm transition-colors"
                            title="Edit content"
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
                                typeColors[item.type] || "bg-stone-100 text-stone-500"
                              )}
                            >
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-stone-900 text-sm line-clamp-2 mb-2">
                            {item.title}
                          </h3>

                          {/* Preview */}
                          <p className="text-xs text-stone-500 line-clamp-3 mb-3">
                            {item.summary || item.body.slice(0, 150)}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                            <Badge className={typeColors[item.type]}>
                              {formatTypeName(item.type)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-stone-400">
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
                          isSelected && "border-orange-500 ring-1 ring-orange-500"
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
                                typeColors[item.type] || "bg-stone-100 text-stone-500"
                              )}
                            >
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-stone-900 text-sm truncate">
                                  {item.title}
                                </h3>
                              </div>
                              <p className="text-xs text-stone-400 truncate">
                                {item.summary || item.body.slice(0, 100)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(item.body);
                                }}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
                                title="Copy"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent(item.contentId);
                                }}
                                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors"
                                title="Preview"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <Badge className={typeColors[item.type]}>
                              {formatTypeName(item.type)}
                            </Badge>
                            <StatusBadge status={item.status} />
                            <span className="text-xs text-stone-400 shrink-0">
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

        {/* Content Details Panel */}
        <AnimatePresence>
          {selectedContentData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block w-1/3"
            >
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      Detalles del Contenido
                    </h3>
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <p className="text-xs text-stone-400 mb-1 uppercase tracking-wider">Título</p>
                      <p className="text-stone-900 font-medium">
                        {selectedContentData.title}
                      </p>
                    </div>

                    {/* Type & Status */}
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-stone-400 mb-1 uppercase tracking-wider">Tipo</p>
                        <Badge className={typeColors[selectedContentData.type]}>
                          {formatTypeName(selectedContentData.type)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 mb-1 uppercase tracking-wider">Estado</p>
                        <StatusBadge status={selectedContentData.status} />
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="pt-3 border-t border-stone-200">
                      <StatusActions
                        content={selectedContentData}
                        onStatusChange={async (status) => {
                          await updateContentStatus({
                            id: selectedContentData._id,
                            status: status as "draft" | "review" | "revision_needed" | "approved" | "scheduled" | "published" | "archived"
                          });
                        }}
                      />
                    </div>

                    {/* Multi-Platform Publish Panel */}
                    <CrossPlatformPublishPanel
                      contentId={selectedContentData._id}
                      contentBody={selectedContentData.body}
                      contentStatus={selectedContentData.status}
                      contentHashtags={selectedContentData.metadata?.targetKeywords}
                    />

                    {/* Version History (Collapsible) */}
                    <div className="pt-3 border-t border-stone-200">
                      <button
                        onClick={() => setShowVersionHistory(!showVersionHistory)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-stone-400" />
                          <p className="text-sm font-medium text-stone-900">Historial de versiones</p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-stone-400 transition-transform",
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingContent(selectedContentData)}
                        className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAnalysisContentId(selectedContentData._id)}
                        className="px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors flex items-center justify-center gap-2 border border-purple-200"
                      >
                        <Sparkles className="h-4 w-4" />
                        Analizar
                      </motion.button>
                    </div>

                    {/* Preview with copy button */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-stone-400 uppercase tracking-wider">Vista Previa</p>
                        <button
                          onClick={() => copyToClipboard(selectedContentData.body)}
                          className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar todo
                        </button>
                      </div>
                      <div className="rounded-lg bg-stone-50 p-3 max-h-48 overflow-y-auto border border-stone-200">
                        <p className="text-stone-700 text-sm whitespace-pre-wrap">
                          {selectedContentData.body.slice(0, 500)}
                          {selectedContentData.body.length > 500 && "..."}
                        </p>
                      </div>
                    </div>

                  {/* Metadata */}
                  {selectedContentData.metadata && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">Metadatos</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedContentData.metadata.wordCount && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-400">Palabras</p>
                            <p className="text-stone-700 font-mono">
                              {selectedContentData.metadata.wordCount}
                            </p>
                          </div>
                        )}
                        {selectedContentData.metadata.readingTime && (
                          <div className="rounded-lg bg-stone-50 p-2">
                            <p className="text-xs text-stone-400">Lectura</p>
                            <p className="text-stone-700 font-mono">
                              {selectedContentData.metadata.readingTime} min
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {selectedContentData.metadata?.targetKeywords && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">Palabras Clave</p>
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
                    </div>
                  )}

                  {/* SEO */}
                  {selectedContentData.seo && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">SEO</p>
                      <div className="rounded-lg bg-stone-50 p-3 space-y-2">
                        <div>
                          <p className="text-xs text-stone-400">Meta Title</p>
                          <p className="text-stone-700 text-sm">
                            {selectedContentData.seo.metaTitle}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400">Meta Description</p>
                          <p className="text-stone-700 text-sm">
                            {selectedContentData.seo.metaDescription}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400">Slug</p>
                          <p className="text-stone-700 font-mono text-sm">
                            /{selectedContentData.seo.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Published URL */}
                  {selectedContentData.publishedUrl && (
                    <div>
                      <p className="text-xs text-stone-400 mb-1">URL Publicada</p>
                      <a
                        href={selectedContentData.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver publicado
                      </a>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-stone-400 mb-1 uppercase tracking-wider">Creado</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-stone-400" />
                      <span className="text-stone-700">
                        {formatDate(selectedContentData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Unified Publishing History */}
      {!selectedContent && (
        <div className="mt-12">
          <UnifiedPublishHistory limit={20} />
        </div>
      )}

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
