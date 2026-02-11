// Chart theme — supports light & dark modes
// Matches the CSS variable token system in globals.css

const lightColors = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  tertiary: '#0891b2',
  quaternary: '#16a34a',
  quinary: '#d97706',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  grid: '#f3f4f6',
  axis: '#9ca3af',
  text: '#6b7280',
  textMuted: '#9ca3af',
  background: '#ffffff',
} as const;

const darkColors = {
  primary: '#60a5fa',
  secondary: '#a78bfa',
  tertiary: '#22d3ee',
  quaternary: '#4ade80',
  quinary: '#fbbf24',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  grid: '#292524',
  axis: '#78716c',
  text: '#a8a29e',
  textMuted: '#78716c',
  background: '#1c1917',
} as const;

// Department colors — same for both themes (vivid for differentiation)
const departments = {
  leadership: '#6366f1',
  content: '#3b82f6',
  social: '#06b6d4',
  demandgen: '#d97706',
  seo: '#16a34a',
  brand: '#ec4899',
  ops: '#7c3aed',
} as const;

// Detect dark mode from document class
function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

// Dynamic chart colors — reads current theme
export function getChartColors() {
  const colors = isDarkMode() ? darkColors : lightColors;
  return { ...colors, departments };
}

// Static fallback for contexts where reactivity isn't needed
export const chartColors = { ...lightColors, departments } as const;

// Color palette for multiple series
export const seriesColors = [
  lightColors.primary,
  lightColors.secondary,
  lightColors.tertiary,
  lightColors.quaternary,
  lightColors.quinary,
  lightColors.info,
  lightColors.success,
];

export function getSeriesColors() {
  const c = isDarkMode() ? darkColors : lightColors;
  return [c.primary, c.secondary, c.tertiary, c.quaternary, c.quinary, c.info, c.success];
}

// Gradient definitions for area charts
export const gradients = {
  primary: {
    id: 'primaryGradient',
    start: 'rgba(37, 99, 235, 0.2)',
    end: 'rgba(37, 99, 235, 0)',
  },
  success: {
    id: 'successGradient',
    start: 'rgba(22, 163, 74, 0.2)',
    end: 'rgba(22, 163, 74, 0)',
  },
  info: {
    id: 'infoGradient',
    start: 'rgba(37, 99, 235, 0.2)',
    end: 'rgba(37, 99, 235, 0)',
  },
} as const;

// Common chart config
export const chartConfig = {
  animationDuration: 800,
  animationEasing: 'ease-out',
  margin: { top: 5, right: 5, left: 5, bottom: 5 },
  marginWithAxis: { top: 10, right: 10, left: 0, bottom: 0 },
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
} as const;

// Tooltip styling — adapts to theme
export function getTooltipStyle() {
  const dark = isDarkMode();
  return {
    contentStyle: {
      backgroundColor: dark ? '#1c1917' : '#ffffff',
      border: `1px solid ${dark ? '#44403c' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: dark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    labelStyle: {
      color: dark ? '#fafaf9' : '#111827',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: dark ? '#a8a29e' : '#6b7280',
      padding: '2px 0',
    },
    cursor: {
      stroke: dark ? '#44403c' : '#e5e7eb',
      strokeWidth: 1,
      strokeDasharray: '4 4',
    },
  };
}

// Static tooltip (backward compat)
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  labelStyle: {
    color: '#111827',
    fontWeight: 600,
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#6b7280',
    padding: '2px 0',
  },
  cursor: {
    stroke: '#e5e7eb',
    strokeWidth: 1,
    strokeDasharray: '4 4',
  },
} as const;
