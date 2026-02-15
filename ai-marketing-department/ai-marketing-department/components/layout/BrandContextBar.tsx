"use client";

import { useBrandContext } from "@/hooks/useBrandContext";
import { Building2, ChevronDown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export function BrandContextBar() {
  const { activeBrand, brands, switchBrand, brandTheme } = useBrandContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeBrand) return null;

  const maturityLabel =
    (activeBrand.maturityScore ?? 0) >= 80
      ? "Avanzado"
      : (activeBrand.maturityScore ?? 0) >= 50
        ? "Intermedio"
        : "Inicial";

  return (
    <div ref={dropdownRef} className="relative mx-3 mb-2">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#292524]/50 hover:bg-[#292524] transition-colors text-left group"
        style={{ borderLeft: `3px solid ${brandTheme.primaryColor}` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-tertiary)] truncate">
            {activeBrand.companyName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-[var(--text-tertiary)] truncate">
              {activeBrand.industry}
            </span>
            {activeBrand.maturityScore != null && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                <Award className="h-2.5 w-2.5" />
                {maturityLabel}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          "h-3 w-3 text-[var(--text-secondary)] transition-transform",
          showDropdown && "rotate-180"
        )} />
      </button>

      {showDropdown && brands.length > 1 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-[#44403c] bg-[#1c1917] shadow-xl overflow-hidden">
          <div className="py-1 max-h-48 overflow-y-auto">
            {brands
              .filter((b) => b._id !== activeBrand._id)
              .map((brand) => (
                <button
                  key={brand._id}
                  onClick={() => {
                    switchBrand(brand._id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#292524] transition-colors"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: (brand as typeof activeBrand).visual?.primaryColor || "#78716c",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{brand.companyName}</p>
                    <p className="text-[9px] text-[var(--text-tertiary)] truncate">{brand.industry}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
