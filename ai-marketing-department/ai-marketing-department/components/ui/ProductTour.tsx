"use client";

/**
 * ProductTour Component - Interactive 7-step onboarding tour
 *
 * Features:
 * - Spotlight highlighting of target elements
 * - Contextual tooltips with step navigation
 * - Skip/Complete functionality with localStorage persistence
 * - Mobile-responsive design (44x44px touch targets)
 * - Framer Motion animations for smooth transitions
 * - Spanish labels throughout
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { TOUR_STEPS, setTourCompleted, setTourSkipped, findTourElement, calculateTooltipPosition } from "@/lib/tour-utils";

interface ProductTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function ProductTour({ onComplete, onSkip }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowDirection: "" });
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Update tooltip position when step changes
  useEffect(() => {
    if (!step) return;

    // Wait for DOM to be ready
    setTimeout(() => {
      if (step.target) {
        const element = findTourElement(step.target);
        if (element) {
          setTargetElement(element);
          const position = calculateTooltipPosition(element, step.placement);
          setTooltipPosition(position);
        } else {
          // Tour target not found — skip highlighting
          setTargetElement(null);
        }
      } else {
        // Centered tooltip for final step
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200,
          arrowDirection: "none",
        });
      }
    }, 100);
  }, [currentStep, step]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    setTourCompleted();
    onComplete?.();
  };

  const handleSkip = () => {
    setTourSkipped();
    onSkip?.();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
          onClick={handleSkip}
        />

        {/* Spotlight effect on target element */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute pointer-events-none"
            style={{
              top: targetElement.getBoundingClientRect().top - 8,
              left: targetElement.getBoundingClientRect().left - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.3)",
              borderRadius: "12px",
              border: "2px solid rgba(99, 102, 241, 0.4)",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
          className="absolute pointer-events-auto"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            maxWidth: step.placement === "center" ? "500px" : "400px",
          }}
        >
          {/* Tooltip card */}
          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-sm font-semibold">
                  {currentStep + 1}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">
                  Paso {currentStep + 1} de {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
                aria-label="Saltar tour"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.content}
              </p>
            </div>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-1)]">
              {/* Skip button (always visible) */}
              <button
                onClick={handleSkip}
                className="min-h-[44px] px-4 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Saltar tour
              </button>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-4 rounded-lg border border-[var(--border)] bg-[var(--button-secondary-bg)] text-[var(--text-primary)] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--button-secondary-hover)] transition-colors"
                  aria-label="Paso anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {/* Next/Finish button */}
                <button
                  onClick={handleNext}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-6 rounded-lg bg-[var(--accent)] text-[var(--text-on-accent)] text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-lg"
                >
                  <span>{isLastStep ? "Finalizar" : "Siguiente"}</span>
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Arrow pointing to target (not shown for centered tooltip) */}
          {tooltipPosition.arrowDirection !== "none" && targetElement && (
            <div
              className="absolute w-0 h-0"
              style={{
                ...(tooltipPosition.arrowDirection === "left" && {
                  left: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderRight: "8px solid rgb(39, 39, 42)", // stone-800
                }),
                ...(tooltipPosition.arrowDirection === "right" && {
                  right: "-8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: "8px solid rgb(39, 39, 42)",
                }),
                ...(tooltipPosition.arrowDirection === "top" && {
                  top: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid rgb(39, 39, 42)",
                }),
                ...(tooltipPosition.arrowDirection === "bottom" && {
                  bottom: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "8px solid rgb(39, 39, 42)",
                }),
              }}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
