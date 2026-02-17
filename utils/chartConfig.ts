import type { ChartOptions } from 'chart.js';

// ============================================================================
// CHART.JS THEME CONFIGURATION - Dark Theme (Slate/Blue)
// ============================================================================

export const CHART_COLORS = {
  // Primary palette
  primary: '#3b82f6',      // blue-500
  primaryLight: '#60a5fa', // blue-400
  primaryDark: '#2563eb',  // blue-600
  
  // Secondary colors
  secondary: '#64748b',    // slate-500
  secondaryLight: '#94a3b8', // slate-400
  
  // Accent colors for data series
  accent1: '#3b82f6',      // blue
  accent2: '#10b981',      // emerald
  accent3: '#f59e0b',      // amber
  accent4: '#ef4444',      // red
  accent5: '#8b5cf6',      // violet
  accent6: '#06b6d4',      // cyan
  accent7: '#ec4899',      // pink
  accent8: '#84cc16',      // lime
  
  // Backgrounds
  background: '#0f172a',   // slate-900
  surface: '#1e293b',      // slate-800
  border: '#334155',       // slate-700
  
  // Text colors
  text: '#f1f5f9',         // slate-100
  textMuted: '#94a3b8',    // slate-400
  
  // Semantic colors
  success: '#10b981',      // emerald-500
  warning: '#f59e0b',      // amber-500
  danger: '#ef4444',       // red-500
  info: '#3b82f6',         // blue-500
} as const;

// Color palette for data series
export const DATASET_COLORS = [
  CHART_COLORS.accent1,
  CHART_COLORS.accent2,
  CHART_COLORS.accent3,
  CHART_COLORS.accent4,
  CHART_COLORS.accent5,
  CHART_COLORS.accent6,
  CHART_COLORS.accent7,
  CHART_COLORS.accent8,
];

// ============================================================================
// COMMON CHART OPTIONS
// ============================================================================

const commonLegendOptions = {
  position: 'bottom' as const,
  labels: {
    color: CHART_COLORS.textMuted,
    padding: 20,
    font: {
      size: 12,
      family: "'Inter', system-ui, sans-serif",
    },
    usePointStyle: true,
    pointStyle: 'circle' as const,
  },
};

const commonTooltipOptions = {
  backgroundColor: CHART_COLORS.surface,
  titleColor: CHART_COLORS.text,
  bodyColor: CHART_COLORS.textMuted,
  borderColor: CHART_COLORS.border,
  borderWidth: 1,
  padding: 12,
  cornerRadius: 8,
  displayColors: true,
  usePointStyle: true,
};

const commonScaleOptions = {
  x: {
    grid: {
      color: CHART_COLORS.border,
    },
    ticks: {
      color: CHART_COLORS.textMuted,
      font: {
        size: 11,
      },
    },
  },
  y: {
    grid: {
      color: CHART_COLORS.border,
    },
    ticks: {
      color: CHART_COLORS.textMuted,
      font: {
        size: 11,
      },
    },
  },
};

// ============================================================================
// CHART TYPE SPECIFIC OPTIONS
// ============================================================================

export const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: commonLegendOptions,
    tooltip: commonTooltipOptions,
  },
  scales: commonScaleOptions,
};

export const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: commonLegendOptions,
    tooltip: commonTooltipOptions,
  },
  scales: commonScaleOptions,
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
    },
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2,
      backgroundColor: CHART_COLORS.background,
    },
  },
};

export const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      ...commonLegendOptions,
      position: 'right' as const,
    },
    tooltip: commonTooltipOptions,
  },
};

export const doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      ...commonLegendOptions,
      position: 'right' as const,
    },
    tooltip: commonTooltipOptions,
  },
  cutout: '60%',
};

// ============================================================================
// REGISTER CHART.JS COMPONENTS
// ============================================================================

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

export function registerChartJS(): void {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}
