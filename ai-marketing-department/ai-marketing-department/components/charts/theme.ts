// Chart theme — light & minimal with clean blue accent
// Matches the new light surface + accent token system

export const chartColors = {
  // Primary palette
  primary: '#2563eb',    // accent blue
  secondary: '#7c3aed',  // violet-600
  tertiary: '#0891b2',   // cyan-600
  quaternary: '#16a34a',  // green-600
  quinary: '#d97706',    // amber-600

  // Semantic
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',

  // Neutral — light mode
  grid: '#f3f4f6',       // gray-100
  axis: '#9ca3af',       // gray-400
  text: '#6b7280',       // gray-500
  textMuted: '#9ca3af',  // gray-400
  background: '#ffffff',

  // Department colors (kept vivid for differentiation)
  departments: {
    leadership: '#6366f1',   // indigo
    content: '#3b82f6',      // blue
    social: '#06b6d4',       // cyan
    demandgen: '#d97706',    // amber
    seo: '#16a34a',          // green
    brand: '#ec4899',        // pink
    ops: '#7c3aed',          // violet
  },
} as const;

// Color palette for multiple series
export const seriesColors = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.quaternary,
  chartColors.quinary,
  chartColors.info,
  chartColors.success,
];

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

// Tooltip styling — light mode
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
