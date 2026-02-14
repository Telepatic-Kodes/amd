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
}

interface BrandContextValue {
  activeBrandId: Id<"brandProfiles"> | null;
  activeBrand: BrandProfile | null;
  brands: BrandProfile[];
  isLoading: boolean;
  switchBrand: (id: Id<"brandProfiles">) => void;
}

const BrandContext = createContext<BrandContextValue>({
  activeBrandId: null,
  activeBrand: null,
  brands: [],
  isLoading: true,
  switchBrand: () => {},
});

const STORAGE_KEY = "amd_active_brand_id";

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
    return allBrands.find((b) => b._id === activeBrandId) ?? null;
  }, [allBrands, activeBrandId]);

  const value = useMemo(
    () => ({
      activeBrandId,
      activeBrand,
      brands: allBrands ?? [],
      isLoading: !allBrands,
      switchBrand,
    }),
    [activeBrandId, activeBrand, allBrands, switchBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrandContext() {
  return useContext(BrandContext);
}
