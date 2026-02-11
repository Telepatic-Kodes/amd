"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type BrandData,
  DEFAULT_BRAND_DATA,
  mergeBrandData,
} from "@/lib/brand-utils";

import { OnboardingSourceChoice } from "./OnboardingSourceChoice";
import { OnboardingSmartImport } from "./OnboardingSmartImport";
import { OnboardingBrandReview } from "./OnboardingBrandReview";
import { OnboardingGoalsMode } from "./OnboardingGoalsMode";
import { OnboardingActivation } from "./OnboardingActivation";

/**
 * UnifiedOnboarding — State machine orchestrating 5 screens:
 *
 * 1. SourceChoice  → Import vs Manual
 * 2A. SmartImport  → URL + Instagram + Docs  (only if import chosen)
 * 3. BrandReview   → 6 brand steps (pre-filled or empty)
 * 4. GoalsMode     → Goals + activation mode + feeds
 * 5. Activation    → Full-screen activation sequence
 */
type Screen = "choice" | "import" | "review" | "goals" | "activation";

export function UnifiedOnboarding() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("choice");
  const [brandData, setBrandData] = useState<BrandData>(() => {
    try {
      const saved = typeof window !== "undefined"
        ? localStorage.getItem("amd-unified-brand-draft")
        : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_BRAND_DATA;
  });
  const [prefilled, setPrefilled] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [feeds, setFeeds] = useState<string[]>([]);
  const [activationMode, setActivationMode] = useState<"demo" | "real">("demo");

  // --- Screen 1: Choice ---
  if (screen === "choice") {
    return (
      <OnboardingSourceChoice
        onImport={() => setScreen("import")}
        onManual={() => setScreen("review")}
      />
    );
  }

  // --- Screen 2A: Smart Import ---
  if (screen === "import") {
    return (
      <OnboardingSmartImport
        onExtracted={(partial) => {
          setBrandData((prev) => mergeBrandData(prev, partial));
          setPrefilled(true);
          setScreen("review");
        }}
        onBack={() => setScreen("choice")}
        onSkip={() => setScreen("review")}
      />
    );
  }

  // --- Screen 3: Brand Review (6 steps) ---
  if (screen === "review") {
    return (
      <OnboardingBrandReview
        data={brandData}
        onChange={setBrandData}
        prefilled={prefilled}
        onComplete={() => setScreen("goals")}
        onBack={() => {
          if (prefilled) {
            setScreen("import");
          } else {
            setScreen("choice");
          }
        }}
      />
    );
  }

  // --- Screen 4: Goals + Mode ---
  if (screen === "goals") {
    return (
      <OnboardingGoalsMode
        goals={goals}
        feeds={feeds}
        industry={brandData.industry}
        activationMode={activationMode}
        onChangeGoals={setGoals}
        onChangeFeeds={setFeeds}
        onChangeMode={setActivationMode}
        onComplete={() => setScreen("activation")}
        onBack={() => setScreen("review")}
      />
    );
  }

  // --- Screen 5: Activation ---
  return (
    <OnboardingActivation
      brandData={brandData}
      goals={goals}
      feeds={feeds}
      activationMode={activationMode}
      onComplete={() => router.push("/")}
    />
  );
}
