"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface BrandProfile {
  _id: Id<"brandProfiles">;
  companyName: string;
  industry: string;
  description: string;
  maturityScore?: number;
  maturityLevel?: string;
  status: string;
  visual?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    logoDescription?: string;
    logoStorageId?: string;
    fontPrimary?: string;
    fontSecondary?: string;
  };
}

interface BrandTheme {
  primaryColor: string;
  accentColor: string;
  hasBrandColors: boolean;
}

const DEFAULT_THEME: BrandTheme = {
  primaryColor: "#ea580c",
  accentColor: "#ea580c",
  hasBrandColors: false,
};

interface BrandContextValue {
  activeBrandId: Id<"brandProfiles"> | null;
  activeBrand: BrandProfile | null;
  brands: BrandProfile[];
  isLoading: boolean;
  switchBrand: (id: Id<"brandProfiles">) => void;
  brandTheme: BrandTheme;
}

const BrandContext = createContext<BrandContextValue>({
  activeBrandId: null,
  activeBrand: null,
  brands: [],
  isLoading: true,
  switchBrand: () => {},
  brandTheme: DEFAULT_THEME,
});

const STORAGE_KEY = "amd_active_brand_id";

/**
 * Convert a hex color to its muted variant (with alpha).
 */
function hexToMuted(hex: string, alpha = 0.1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Darken a hex color by a percentage for hover states.
 */
function darkenHex(hex: string, percent = 15): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(2.55 * percent));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(2.55 * percent));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(2.55 * percent));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const allBrands = useQuery(api.brandProfile.getAllBrandProfiles);
  const [activeBrandId, setActiveBrandId] = useState<Id<"brandProfiles"> | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load saved brand from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      queueMicrotask(() => setActiveBrandId(saved as Id<"brandProfiles">));
    }
    queueMicrotask(() => setInitialized(true));
  }, []);

  // Once brands load, validate the active brand exists or default to first
  useEffect(() => {
    if (!initialized || !allBrands) return;

    if (allBrands.length === 0) {
      queueMicrotask(() => setActiveBrandId(null));
      return;
    }

    // If no brand selected or saved brand doesn't exist anymore, default to first
    const exists = activeBrandId && allBrands.some((b) => b._id === activeBrandId);
    if (!exists) {
      const firstBrand = allBrands[0]._id;
      queueMicrotask(() => setActiveBrandId(firstBrand));
      localStorage.setItem(STORAGE_KEY, firstBrand);
    }
  }, [allBrands, activeBrandId, initialized]);

  const switchBrand = useCallback((id: Id<"brandProfiles">) => {
    setActiveBrandId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeBrand = useMemo(() => {
    if (!allBrands || !activeBrandId) return null;
    return (allBrands.find((b) => b._id === activeBrandId) as BrandProfile | undefined) ?? null;
  }, [allBrands, activeBrandId]);

  // Compute brand theme from visual identity
  const brandTheme = useMemo<BrandTheme>(() => {
    const visual = activeBrand?.visual;
    if (!visual?.primaryColor) return DEFAULT_THEME;
    return {
      primaryColor: visual.primaryColor,
      accentColor: visual.accentColor || visual.primaryColor,
      hasBrandColors: true,
    };
  }, [activeBrand]);

  // Apply brand accent as CSS custom property on :root when brand changes
  useEffect(() => {
    const root = document.documentElement;
    const color = brandTheme.hasBrandColors ? brandTheme.primaryColor : "";
    if (color) {
      root.style.setProperty("--brand-accent", color);
      root.style.setProperty("--brand-accent-hover", darkenHex(color));
      root.style.setProperty("--brand-accent-muted", hexToMuted(color));
    } else {
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-accent-hover");
      root.style.removeProperty("--brand-accent-muted");
    }
    return () => {
      root.style.removeProperty("--brand-accent");
      root.style.removeProperty("--brand-accent-hover");
      root.style.removeProperty("--brand-accent-muted");
    };
  }, [brandTheme]);

  const value = useMemo(
    () => ({
      activeBrandId,
      activeBrand,
      brands: (allBrands ?? []) as BrandProfile[],
      isLoading: !allBrands,
      switchBrand,
      brandTheme,
    }),
    [activeBrandId, activeBrand, allBrands, switchBrand, brandTheme]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrandContext() {
  return useContext(BrandContext);
}
