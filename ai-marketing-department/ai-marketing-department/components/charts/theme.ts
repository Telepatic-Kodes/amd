// Chart theme configuration for dark mode
// Consistent colors that match the zinc/indigo theme of the app

export const chartColors = {
  // Primary palette for data series
  primary: '#6366f1',    // indigo-500
  secondary: '#8b5cf6',  // violet-500
  tertiary: '#06b6d4',   // cyan-500
  quaternary: '#10b981', // emerald-500
  quinary: '#f59e0b',    // amber-500

  // Semantic colors
  success: '#22c55e',    // green-500
  warning: '#f59e0b',    // amber-500
  error: '#ef4444',      // red-500
  info: '#3b82f6',       // blue-500

  // Neutral colors
  grid: '#27272a',       // zinc-800
  axis: '#52525b',       // zinc-600
  text: '#a1a1aa',       // zinc-400
  textMuted: '#71717a',  // zinc-500
  background: '#09090b', // zinc-950

  // Department colors (matching existing design)
  departments: {
    leadership: '#6366f1',   // indigo
    content: '#3b82f6',      // blue
    social: '#06b6d4',       // cyan
    demandgen: '#f59e0b',    // amber
    seo: '#22c55e',          // green
    brand: '#ec4899',        // pink
    ops: '#8b5cf6',          // violet
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
    start: 'rgba(99, 102, 241, 0.3)',
    end: 'rgba(99, 102, 241, 0)',
  },
  success: {
    id: 'successGradient',
    start: 'rgba(34, 197, 94, 0.3)',
    end: 'rgba(34, 197, 94, 0)',
  },
  info: {
    id: 'infoGradient',
    start: 'rgba(59, 130, 246, 0.3)',
    end: 'rgba(59, 130, 246, 0)',
  },
} as const;

// Common chart config
export const chartConfig = {
  // Animation
  animationDuration: 800,
  animationEasing: 'ease-out',

  // Margins
  margin: { top: 5, right: 5, left: 5, bottom: 5 },
  marginWithAxis: { top: 10, right: 10, left: 0, bottom: 0 },

  // Sizing
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
} as const;

// Tooltip styling
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#18181b', // zinc-900
    border: '1px solid #27272a', // zinc-800
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
  labelStyle: {
    color: '#fafafa', // zinc-50
    fontWeight: 600,
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#a1a1aa', // zinc-400
    padding: '2px 0',
  },
  cursor: {
    stroke: '#3f3f46', // zinc-700
    strokeWidth: 1,
    strokeDasharray: '4 4',
  },
} as const;
