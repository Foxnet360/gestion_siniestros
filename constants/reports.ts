// ============================================================================
// REPORTS MODULE CONFIGURATION
// ============================================================================

// Time thresholds
export const DIAS_ESTANCADO_DEFAULT = 30;
export const TIEMPO_OBJETIVO_CIERRE = 45; // days
export const DIAS_ALERTA_ESTANCADO = 45;

// Prescription risk thresholds
export const RIESGO_ALTO_DIAS = 30;   // < 30 days
export const RIESGO_MEDIO_DIAS = 60;  // 30-60 days
export const RIESGO_BAJO_DIAS = 60;   // > 60 days

// Performance thresholds
export const META_PORCENTAJE_CIERRE_PLAZO = 80; // %

// Color mapping for risk levels
export const RIESGO_COLORS = {
  alto: {
    bg: 'bg-rose-500',
    text: 'text-rose-500',
    border: 'border-rose-500',
    label: 'Alto Riesgo',
    emoji: '🔴',
  },
  medio: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    border: 'border-amber-500',
    label: 'Riesgo Medio',
    emoji: '🟡',
  },
  bajo: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    border: 'border-emerald-500',
    label: 'Bajo Riesgo',
    emoji: '🟢',
  },
} as const;

// Report types configuration
export const REPORT_TYPES = [
  {
    id: 'dashboard-gerencial' as const,
    label: 'Dashboard Gerencial',
    description: 'KPIs financieros y operativos para alta gerencia',
    icon: 'LayoutDashboard',
  },
  {
    id: 'reporte-prescripcion' as const,
    label: 'Reporte Crítico de Prescripción',
    description: 'Casos próximos a prescribir con alertas',
    icon: 'AlertTriangle',
  },
  {
    id: 'dashboard-operativo' as const,
    label: 'Dashboard Operativo',
    description: 'Productividad por técnico y cuellos de botella',
    icon: 'Users',
  },
  {
    id: 'metricas-tiempo' as const,
    label: 'Métricas de Tiempo',
    description: 'Tiempos de gestión por fase y dimensión',
    icon: 'Clock',
  },
  {
    id: 'analisis-comparativo' as const,
    label: 'Análisis Comparativo',
    description: 'Comparativos mes vs mes, año vs año',
    icon: 'BarChart3',
  },
];

// Date range presets
export const DATE_RANGE_PRESETS = [
  { value: 'this-month', label: 'Este mes' },
  { value: 'last-month', label: 'Mes pasado' },
  { value: 'this-quarter', label: 'Este trimestre' },
  { value: 'last-quarter', label: 'Trimestre pasado' },
  { value: 'this-year', label: 'Este año' },
  { value: 'last-year', label: 'Año pasado' },
  { value: 'custom', label: 'Personalizado' },
] as const;

// KPI Labels
export const KPI_LABELS = {
  // Financial
  totalReclamado: 'Total Reclamado',
  totalIndemnizado: 'Total Indemnizado',
  porcentajeRecuperacion: '% Recuperación',
  valorPromedioSiniestro: 'Valor Promedio',
  montoRiesgoPrescripcion: 'Monto en Riesgo',
  
  // Operational
  totalActivos: 'Siniestros Activos',
  totalCerrados: 'Siniestros Cerrados',
  porcentajeCerradosPlazo: '% Cerrados en Plazo',
  tiempoPromedio: 'Tiempo Promedio',
  porcentajeObjeciones: '% con Objeción',
} as const;

// Workflow phases with colors
export const WORKFLOW_PHASES_CONFIG = [
  { id: 1, label: 'AVISO - SOPORTES - ESTUDIO', color: 'slate' },
  { id: 2, label: 'RADICACIÓN - AJUSTE', color: 'blue' },
  { id: 3, label: 'LIQUIDACIÓN - OBJECIÓN', color: 'indigo' },
  { id: 4, label: 'RECONSIDERACIÓN', color: 'violet' },
  { id: 5, label: 'RATIFICACIÓN', color: 'amber' },
  { id: 6, label: 'JURÍDICO - PRESCRIPCIÓN', color: 'rose' },
  { id: 7, label: 'PAGO - FINALIZADO', color: 'emerald' },
];
