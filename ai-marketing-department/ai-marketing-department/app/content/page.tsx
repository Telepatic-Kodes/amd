"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";

const CONTENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "blog", label: "Blog" },
  { value: "social_linkedin", label: "LinkedIn" },
  { value: "social_twitter", label: "Twitter" },
  { value: "social_instagram", label: "Instagram" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "ad_copy", label: "Ad Copy" },
  { value: "landing_page", label: "Landing Page" },
  { value: "whitepaper", label: "Whitepaper" },
  { value: "case_study", label: "Case Study" },
  { value: "video_script", label: "Video Script" },
];

const CONTENT_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "revision_needed", label: "Needs Revision" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const typeColors: Record<string, string> = {
  blog: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  social_linkedin: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  social_twitter: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  social_instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  social_tiktok: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  email: "bg-green-500/10 text-green-400 border-green-500/20",
  newsletter: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ad_copy: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  landing_page: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  whitepaper: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  case_study: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  video_script: "bg-red-500/10 text-red-400 border-red-500/20",
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
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTypeName(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const content = useQuery(api.functions.listContent, {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

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
    return content.find((c) => c.contentId === selectedContent);
  }, [selectedContent, content]);

  if (!content) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Content
          </h1>
          <p className="text-zinc-400 mt-2">
            Create, edit and publish content.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Content
        </h1>
        <p className="text-zinc-400 mt-2">
          Manage your {content.length} content pieces.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-10 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CONTENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-4 pr-8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CONTENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>

        {/* View Mode Toggle */}
        <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3 py-2 text-sm",
              viewMode === "grid"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-800"
            )}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-2 text-sm",
              viewMode === "list"
                ? "bg-indigo-500/10 text-indigo-400"
                : "text-zinc-400 hover:bg-zinc-800"
            )}
          >
            List
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">
          {content.filter((c) => c.status === "draft").length} Drafts
        </Badge>
        <Badge variant="warning">
          {content.filter((c) => c.status === "review").length} In Review
        </Badge>
        <Badge variant="success">
          {content.filter((c) => c.status === "published").length} Published
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Content Grid/List */}
        <div className={cn(
          "flex-1 transition-all",
          selectedContent ? "lg:w-2/3" : "w-full"
        )}>
          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 py-16">
              <FileText className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No content found</p>
              <p className="text-sm text-zinc-500 mt-1">
                {content.length === 0
                  ? "Create your first content piece"
                  : "Try adjusting your filters or search query"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => {
                const TypeIcon = typeIcons[item.type] || FileText;
                const isSelected = selectedContent === item.contentId;

                return (
                  <Card
                    key={item._id}
                    hover
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    )}
                  >
                    <CardContent
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
                            typeColors[item.type] || "bg-zinc-500/10 text-zinc-400"
                          )}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">
                        {item.title}
                      </h3>

                      {/* Preview */}
                      <p className="text-xs text-zinc-400 line-clamp-3 mb-3">
                        {item.summary || item.body.slice(0, 150)}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <Badge className={typeColors[item.type]}>
                          {formatTypeName(item.type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContent.map((item) => {
                const TypeIcon = typeIcons[item.type] || FileText;
                const isSelected = selectedContent === item.contentId;

                return (
                  <Card
                    key={item._id}
                    hover
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "border-indigo-500 shadow-lg shadow-indigo-500/20"
                    )}
                  >
                    <CardContent
                      className="p-3"
                      onClick={() =>
                        setSelectedContent(isSelected ? null : item.contentId)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                            typeColors[item.type] || "bg-zinc-500/10 text-zinc-400"
                          )}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white text-sm truncate">
                              {item.title}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-500 truncate">
                            {item.summary || item.body.slice(0, 100)}
                          </p>
                        </div>
                        <Badge className={typeColors[item.type]}>
                          {formatTypeName(item.type)}
                        </Badge>
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-zinc-500 shrink-0">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Details Panel */}
        {selectedContentData && (
          <div className="hidden lg:block w-1/3">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Content Details
                  </h3>
                  <button
                    onClick={() => setSelectedContent(null)}
                    className="text-zinc-500 hover:text-white text-sm"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Title</p>
                    <p className="text-white font-medium">
                      {selectedContentData.title}
                    </p>
                  </div>

                  {/* Type & Status */}
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Type</p>
                      <Badge className={typeColors[selectedContentData.type]}>
                        {formatTypeName(selectedContentData.type)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Status</p>
                      <StatusBadge status={selectedContentData.status} />
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Preview</p>
                    <div className="rounded-lg bg-zinc-900/50 p-3 max-h-48 overflow-y-auto">
                      <p className="text-zinc-300 text-sm whitespace-pre-wrap">
                        {selectedContentData.body.slice(0, 500)}
                        {selectedContentData.body.length > 500 && "..."}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedContentData.metadata && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Metadata</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedContentData.metadata.wordCount && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Words</p>
                            <p className="text-zinc-300 font-mono">
                              {selectedContentData.metadata.wordCount}
                            </p>
                          </div>
                        )}
                        {selectedContentData.metadata.readingTime && (
                          <div className="rounded-lg bg-zinc-900/50 p-2">
                            <p className="text-xs text-zinc-500">Read Time</p>
                            <p className="text-zinc-300 font-mono">
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
                      <p className="text-xs text-zinc-500 mb-1">Target Keywords</p>
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
                      <p className="text-xs text-zinc-500 mb-1">SEO</p>
                      <div className="rounded-lg bg-zinc-900/50 p-3 space-y-2">
                        <div>
                          <p className="text-xs text-zinc-500">Meta Title</p>
                          <p className="text-zinc-300 text-sm">
                            {selectedContentData.seo.metaTitle}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Meta Description</p>
                          <p className="text-zinc-300 text-sm">
                            {selectedContentData.seo.metaDescription}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Slug</p>
                          <p className="text-zinc-300 font-mono text-sm">
                            /{selectedContentData.seo.slug}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Published URL */}
                  {selectedContentData.publishedUrl && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Published URL</p>
                      <a
                        href={selectedContentData.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Published
                      </a>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Created</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-300">
                        {formatDate(selectedContentData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
