"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  Search,
  Filter,
  ChevronDown,
  Activity,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { FeedCard } from "@/components/feeds/FeedCard";
import { AddFeedForm } from "@/components/feeds/AddFeedForm";
import { FeedItemsList } from "@/components/feeds/FeedItemsList";

const STATUSES = [
  { value: "", label: "Todos los Estados" },
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
  { value: "error", label: "Con Error" },
];

const CATEGORIES = [
  { value: "", label: "Todas las Categorias" },
  { value: "industry", label: "Industria" },
  { value: "competitor", label: "Competencia" },
  { value: "technical", label: "Tecnico" },
  { value: "news", label: "Noticias" },
  { value: "blog", label: "Blog" },
];

export default function FeedsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<Id<"feeds"> | null>(null);

  const feeds = useQuery(api.feeds.publicQueries.listAllFeeds, {
    status: statusFilter ? statusFilter as "active" | "paused" | "error" : undefined,
  });

  const filteredFeeds = useMemo(() => {
    if (!feeds) return [];

    let filtered = [...feeds];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (feed) =>
          feed.name.toLowerCase().includes(query) ||
          feed.url.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((feed) => feed.category === categoryFilter);
    }

    return filtered;
  }, [feeds, searchQuery, categoryFilter]);

  const selectedFeed = useMemo(() => {
    if (!selectedFeedId || !feeds) return null;
    return feeds.find((f) => f._id === selectedFeedId);
  }, [selectedFeedId, feeds]);

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

  if (!feeds) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Rss className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              Fuentes RSS
            </h1>
            <p className="text-stone-400 mt-1">
              Gestiona tus fuentes de contenido.
            </p>
          </div>
        </div>
        <SkeletonGrid items={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10">
            <Rss className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">
              Fuentes RSS
            </h1>
            <p className="text-stone-400 mt-1">
              {feeds.length} feeds configurados
            </p>
          </div>
        </div>
        <AddFeedForm />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar feeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-4 pr-8 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {feeds.filter((f) => f.status === "active").length} Activos
        </Badge>
        <Badge variant="warning">
          {feeds.filter((f) => f.status === "paused").length} Pausados
        </Badge>
        <Badge variant="error">
          {feeds.filter((f) => f.status === "error").length} Errores
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Feeds Grid */}
        <div className={cn(
          "flex-1 transition-all",
          selectedFeedId ? "lg:w-2/3" : "w-full"
        )}>
          {filteredFeeds.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              {feeds.length === 0 ? (
                <p>No hay feeds configurados. Agrega tu primer feed para comenzar.</p>
              ) : (
                <p>No hay feeds que coincidan con tus filtros.</p>
              )}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredFeeds.map((feed) => (
                <motion.div key={feed._id} variants={itemVariants}>
                  <FeedCard
                    feed={feed}
                    onSelect={() => setSelectedFeedId(
                      selectedFeedId === feed._id ? null : feed._id
                    )}
                    isSelected={selectedFeedId === feed._id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Feed Details Panel */}
        <AnimatePresence>
          {selectedFeed && (
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
                    <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      Elementos del Feed
                    </h3>
                    <button
                      onClick={() => setSelectedFeedId(null)}
                      className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-stone-900 font-medium">{selectedFeed.name}</h4>
                    <p className="text-xs text-stone-500 truncate">{selectedFeed.url}</p>
                  </div>

                  <FeedItemsList feedId={selectedFeedId!} limit={5} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Items Section (when no feed selected) */}
      {!selectedFeedId && feeds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Elementos Recientes</h2>
          <FeedItemsList limit={10} />
        </div>
      )}
    </div>
  );
}
