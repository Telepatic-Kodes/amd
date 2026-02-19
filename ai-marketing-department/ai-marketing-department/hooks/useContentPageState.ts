"use client";

import { useState, useCallback } from "react";
import type { Doc } from "@convex/_generated/dataModel";

// --- Types ---

export type ContentTab = "list" | "pipeline";
export type ViewMode = "grid" | "list";
export type FullscreenTab = "editor" | "versions" | "seo" | "publish" | "repurpose";

export interface ContentFilters {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
}

export interface ContentPageState {
  activeTab: ContentTab;
  viewMode: ViewMode;
  filters: ContentFilters;
  showAdvancedFilters: boolean;
  selectedContentId: string | null;
  fullscreenContent: Doc<"content"> | null;
  fullscreenTab: FullscreenTab;
  showGenerateModal: boolean;
  templatePreselect: string | undefined;
}

// --- Initial state ---

const initialFilters: ContentFilters = {
  searchQuery: "",
  typeFilter: "",
  statusFilter: "",
};

const initialState: ContentPageState = {
  activeTab: "pipeline",
  viewMode: "grid",
  filters: initialFilters,
  showAdvancedFilters: false,
  selectedContentId: null,
  fullscreenContent: null,
  fullscreenTab: "editor",
  showGenerateModal: false,
  templatePreselect: undefined,
};

// --- Hook ---

/**
 * Consolidated state management for the Content page.
 * Replaces ~21 individual useState calls with a single managed state object
 * and memoized action functions.
 */
export function useContentPageState() {
  const [state, setState] = useState<ContentPageState>(initialState);

  // --- Actions ---

  const setActiveTab = useCallback((tab: ContentTab) => {
    setState((prev) => ({ ...prev, activeTab: tab, selectedContentId: null }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setFilter = useCallback(
    <K extends keyof ContentFilters>(key: K, value: ContentFilters[K]) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, [key]: value },
      }));
    },
    []
  );

  const toggleAdvancedFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters,
    }));
  }, []);

  const selectContent = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedContentId: id }));
  }, []);

  const openFullscreen = useCallback(
    (content: Doc<"content">, tab?: FullscreenTab) => {
      setState((prev) => ({
        ...prev,
        fullscreenContent: content,
        fullscreenTab: tab ?? prev.fullscreenTab,
      }));
    },
    []
  );

  const closeFullscreen = useCallback(() => {
    setState((prev) => ({ ...prev, fullscreenContent: null }));
  }, []);

  const setFullscreenTab = useCallback((tab: FullscreenTab) => {
    setState((prev) => ({ ...prev, fullscreenTab: tab }));
  }, []);

  const openGenerateModal = useCallback((templatePreselect?: string) => {
    setState((prev) => ({
      ...prev,
      showGenerateModal: true,
      templatePreselect,
    }));
  }, []);

  const closeGenerateModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showGenerateModal: false,
      templatePreselect: undefined,
    }));
  }, []);

  return {
    // Spread state so consumers can destructure individual fields
    ...state,
    // Actions
    setActiveTab,
    setViewMode,
    setFilter,
    toggleAdvancedFilters,
    selectContent,
    openFullscreen,
    closeFullscreen,
    setFullscreenTab,
    openGenerateModal,
    closeGenerateModal,
  };
}
