// Chart theme — refined dark mode with blue-violet accent
// Matches the new 4-tier surface + accent token system

export const chartColors = {
  // Primary palette
  primary: '#5B6AE8',    // accent blue-violet
  secondary: '#8b5cf6',  // violet-500
  tertiary: '#06b6d4',   // cyan-500
  quaternary: '#2FCC71',  // success green
  quinary: '#F5A623',    // warning amber

  // Semantic
  success: '#2FCC71',
  warning: '#F5A623',
  error: '#E5484D',
  info: '#5B6AE8',

  // Neutral
  grid: '#1a1a1e',       // surface-2
  axis: '#5c5c5e',       // text-tertiary
  text: '#8b8b8d',       // text-secondary
  textMuted: '#5c5c5e',  // text-tertiary
  background: '#0a0a0b', // surface-0

  // Department colors (kept vivid for differentiation)
  departments: {
    leadership: '#6366f1',   // indigo
    content: '#3b82f6',      // blue
    social: '#06b6d4',       // cyan
    demandgen: '#F5A623',    // amber
    seo: '#2FCC71',          // green
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
    start: 'rgba(91, 106, 232, 0.3)',
    end: 'rgba(91, 106, 232, 0)',
  },
  success: {
    id: 'successGradient',
    start: 'rgba(47, 204, 113, 0.3)',
    end: 'rgba(47, 204, 113, 0)',
  },
  info: {
    id: 'infoGradient',
    start: 'rgba(91, 106, 232, 0.3)',
    end: 'rgba(91, 106, 232, 0)',
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

// Tooltip styling — updated to match new surfaces
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1a1a1e', // surface-2
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
  labelStyle: {
    color: '#ededef', // text-primary
    fontWeight: 600,
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#8b8b8d', // text-secondary
    padding: '2px 0',
  },
  cursor: {
    stroke: '#232328', // surface-3
    strokeWidth: 1,
    strokeDasharray: '4 4',
  },
} as const;
