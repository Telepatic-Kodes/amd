"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Building2, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandContext } from "@/hooks/useBrandContext";
import { translate } from "@/lib/language";

export function BrandSwitcher() {
  const { activeBrand, brands, switchBrand, isLoading } = useBrandContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 px-5 h-14">
        <div className="h-7 w-7 rounded-lg bg-stone-700 animate-pulse" />
        <div className="h-4 w-20 rounded bg-stone-700 animate-pulse" />
      </div>
    );
  }

  // No brands — show AMD logo fallback
  if (brands.length === 0) {
    return (
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-stone-200">
          <Sparkles className="h-4 w-4 text-orange-500" />
          <span className="text-sm tracking-tight">AMD</span>
        </Link>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 w-full px-5 h-14 hover:bg-[#292524] transition-colors text-left"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 shrink-0">
          <Building2 className="h-3.5 w-3.5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-200 truncate">
            {activeBrand?.companyName ?? "AMD"}
          </p>
          {activeBrand?.industry && (
            <p className="text-[10px] text-stone-500 truncate">{activeBrand.industry}</p>
          )}
        </div>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-stone-500 transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Maturity progress bar */}
      {activeBrand?.maturityScore != null && (
        <div className="px-5 pb-2">
          <div className="h-1 rounded-full bg-stone-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${Math.min(100, activeBrand.maturityScore)}%` }}
            />
          </div>
          <p className="text-[9px] text-stone-600 mt-0.5">
            Madurez: {activeBrand.maturityScore}%
          </p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 mx-2 rounded-lg border border-[#44403c] bg-[#1c1917] shadow-xl overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <button
                key={brand._id}
                onClick={() => {
                  switchBrand(brand._id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#292524] transition-colors",
                  brand._id === activeBrand?._id && "bg-[#292524]"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                  brand._id === activeBrand?._id
                    ? "bg-orange-500/20"
                    : "bg-stone-700"
                )}>
                  <Building2 className={cn(
                    "h-3 w-3",
                    brand._id === activeBrand?._id ? "text-orange-400" : "text-stone-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    brand._id === activeBrand?._id ? "text-orange-400" : "text-stone-300"
                  )}>
                    {brand.companyName}
                  </p>
                  <p className="text-[10px] text-stone-500 truncate">{brand.industry}</p>
                </div>
                {brand._id === activeBrand?._id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Add new client button */}
          <div className="border-t border-[#44403c] p-2">
            <Link
              href="/brand?new=true"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-[#292524] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {translate("newClient")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
