"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, Building2, Plus, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandContext } from "@/hooks/useBrandContext";
import { translate } from "@/lib/language";

export function BrandSwitcher() {
  const { activeBrand, brands, switchBrand, isLoading, brandTheme } = useBrandContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+Shift+B to toggle switcher
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus search when opened and many brands
  useEffect(() => {
    if (isOpen && brands.length > 3) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) setSearchQuery("");
  }, [isOpen, brands.length]);

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const lower = searchQuery.toLowerCase();
    return brands.filter(
      (b) =>
        b.companyName.toLowerCase().includes(lower) ||
        b.industry.toLowerCase().includes(lower)
    );
  }, [brands, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 px-5 h-14">
        <div className="h-7 w-7 rounded-lg bg-[var(--sidebar-border)] animate-pulse" />
        <div className="h-4 w-20 rounded bg-[var(--sidebar-border)] animate-pulse" />
      </div>
    );
  }

  // No brands — show AMD logo fallback
  if (brands.length === 0) {
    return (
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-[var(--sidebar-text-active)]">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-sm tracking-tight">AMD</span>
        </Link>
      </div>
    );
  }

  const brandColor = (activeBrand as { visual?: { primaryColor?: string } })?.visual?.primaryColor;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 w-full px-5 h-14 hover:bg-[#292524] transition-colors text-left"
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{
            backgroundColor: brandColor
              ? `${brandColor}20`
              : "rgba(251, 146, 60, 0.2)",
          }}
        >
          <Building2
            className="h-3.5 w-3.5"
            style={{ color: brandColor || "#fb923c" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[var(--sidebar-text-active)] truncate">
              {activeBrand?.companyName ?? "AMD"}
            </p>
            {brandColor && (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: brandColor }}
              />
            )}
          </div>
          {activeBrand?.industry && (
            <p className="text-[10px] text-[var(--text-tertiary)] truncate">{activeBrand.industry}</p>
          )}
        </div>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Maturity progress bar */}
      {activeBrand?.maturityScore != null && (
        <div className="px-5 pb-2">
          <div className="h-1 rounded-full bg-[var(--sidebar-border)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, activeBrand.maturityScore)}%`,
                backgroundColor: brandColor || "#ea580c",
              }}
            />
          </div>
          <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">
            Madurez: {activeBrand.maturityScore}%
          </p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 mx-2 rounded-lg border border-[#44403c] bg-[#1c1917] shadow-xl overflow-hidden">
          {/* Search when >3 brands */}
          {brands.length > 3 && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#44403c]">
              <Search className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar marca..."
                className="flex-1 bg-transparent text-xs text-[var(--text-tertiary)] placeholder:text-[var(--text-secondary)] outline-none"
              />
            </div>
          )}

          <div className="py-1 max-h-64 overflow-y-auto">
            {filteredBrands.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-[var(--text-tertiary)]">
                Sin resultados
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const bColor = (brand as { visual?: { primaryColor?: string } })?.visual?.primaryColor;
                return (
                  <button
                    key={brand._id}
                    onClick={() => {
                      switchBrand(brand._id);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#292524] transition-colors",
                      brand._id === activeBrand?._id && "bg-[#292524]"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                    )} style={{
                      backgroundColor: brand._id === activeBrand?._id
                        ? bColor ? `${bColor}20` : "rgba(251, 146, 60, 0.2)"
                        : "#44403c",
                    }}>
                      <Building2
                        className="h-3 w-3"
                        style={{
                          color: brand._id === activeBrand?._id
                            ? (bColor || "#fb923c")
                            : "#a8a29e",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          brand._id === activeBrand?._id ? "text-[var(--sidebar-text-active)]" : "text-[var(--text-tertiary)]"
                        )} style={{
                          color: brand._id === activeBrand?._id ? (bColor || "var(--accent)") : undefined,
                        }}>
                          {brand.companyName}
                        </p>
                        {bColor && (
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: bColor }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate">{brand.industry}</p>
                    </div>
                    {brand._id === activeBrand?._id && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: bColor || "#ea580c" }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Add new client button */}
          <div className="border-t border-[#44403c] p-2">
            <Link
              href="/brand?new=true"
              onClick={() => { setIsOpen(false); setSearchQuery(""); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] hover:bg-[var(--sidebar-active-bg)] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear nueva marca
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
