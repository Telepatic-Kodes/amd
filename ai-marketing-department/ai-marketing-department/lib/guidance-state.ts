/**
 * Guidance State Manager
 * Consolidated localStorage management for all guidance/UX state.
 * Works alongside Convex userGuidance table for persistence.
 */

const STORAGE_PREFIX = "amd-guidance";

// ============ Tooltip Dismissals ============

interface TooltipState {
  dismissed: boolean;
  seenAt: string;
}

export function getTooltipState(tooltipId: string): TooltipState | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-tooltips`);
    if (!data) return null;
    const tooltips = JSON.parse(data) as Record<string, TooltipState>;
    return tooltips[tooltipId] || null;
  } catch {
    return null;
  }
}

export function dismissTooltip(tooltipId: string): void {
  if (typeof window === "undefined") return;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-tooltips`);
    const tooltips = data ? JSON.parse(data) : {};
    tooltips[tooltipId] = { dismissed: true, seenAt: new Date().toISOString() };
    localStorage.setItem(`${STORAGE_PREFIX}-tooltips`, JSON.stringify(tooltips));
  } catch {
    // Silently fail
  }
}

export function isTooltipDismissed(tooltipId: string): boolean {
  const state = getTooltipState(tooltipId);
  return state?.dismissed ?? false;
}

// ============ Next Action Dismissals ============

interface NextActionDismissal {
  actionId: string;
  dismissedAt: number;
}

export function dismissNextAction(actionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const data: NextActionDismissal = {
      actionId,
      dismissedAt: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}-next-action`, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

export function isNextActionDismissed(actionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-next-action`);
    if (!data) return false;
    const dismissal = JSON.parse(data) as NextActionDismissal;
    // Dismissed for 24 hours only
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (dismissal.actionId === actionId && Date.now() - dismissal.dismissedAt < twentyFourHours) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============ Feature Discovery ============

interface FeatureDiscovery {
  firstSeen: number;
  interactionCount: number;
  lastInteraction: number;
}

export function trackFeatureVisit(featureId: string): void {
  if (typeof window === "undefined") return;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-features`);
    const features = data ? JSON.parse(data) : {};
    const existing = features[featureId] as FeatureDiscovery | undefined;

    features[featureId] = {
      firstSeen: existing?.firstSeen ?? Date.now(),
      interactionCount: (existing?.interactionCount ?? 0) + 1,
      lastInteraction: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}-features`, JSON.stringify(features));
  } catch {
    // Silently fail
  }
}

export function getFeatureInteractionCount(featureId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-features`);
    if (!data) return 0;
    const features = JSON.parse(data);
    return features[featureId]?.interactionCount ?? 0;
  } catch {
    return 0;
  }
}

// ============ Quick Mode Preferences ============

export function getQuickModePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-preferences`);
    if (!data) return false;
    return JSON.parse(data).quickMode ?? false;
  } catch {
    return false;
  }
}

export function setQuickModePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}-preferences`);
    const prefs = data ? JSON.parse(data) : {};
    prefs.quickMode = enabled;
    localStorage.setItem(`${STORAGE_PREFIX}-preferences`, JSON.stringify(prefs));
  } catch {
    // Silently fail
  }
}
