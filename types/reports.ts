// Types for Reports Module

import type { Claim, InternalState } from '../types';

// ============================================================================
// FILTERS & CONFIGURATION
// ============================================================================

export type DateRangePreset = 
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'last-year'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ReportFilters {
  dateRange: DateRange | null;
  datePreset: DateRangePreset;
  ramo: string[];
  aseguradora: string[];
  tecnico: string[];
  estado: InternalState[];
}

// ============================================================================
// KPI TYPES
// ============================================================================

export interface KpiFinanciero {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format: 'currency' | 'percentage' | 'number';
  previousValue?: number;
  variation?: number; // percentage
}

export interface KpiOperativo {
  label: string;
  value: number;
  total?: number;
  format: 'number' | 'percentage' | 'days';
  previousValue?: number;
  variation?: number;
}

export interface KpisData {
  financieros: {
    totalReclamado: number;
    totalIndemnizado: number;
    porcentajeRecuperacion: number;
    valorPromedioSiniestro: number;
    montoRiesgoPrescripcion: number;
  };
  operativos: {
    totalSiniestrosActivos: number;
    totalSiniestrosCerrados: number;
    porcentajeCerradosEnPlazo: number;
    tiempoPromedioTotal: number; // days
    porcentajeConObjecion: number;
  };
}

// ============================================================================
// PRESCRIPTION RISK
// ============================================================================

export type RiesgoPrescripcion = 'alto' | 'medio' | 'bajo';

export interface PrescripcionRiskData {
  claim: Claim;
  diasRestantes: number;
  nivelRiesgo: RiesgoPrescripcion;
  diasSinMovimiento: number;
  ultimaGestion: string | null;
}

// ============================================================================
// TIME METRICS
// ============================================================================

export interface TiempoPorFase {
  fase: string;
  faseId: number;
  tiempoPromedio: number; // days
  casosCount: number;
  color: string;
}

export interface TiempoPorDimension {
  dimension: string; // aseguradora, ramo, tecnico
  tiempoPromedio: number;
  casosCount: number;
}

// ============================================================================
// OPERATIONAL METRICS
// ============================================================================

export interface ProductividadTecnico {
  tecnico: string;
  casosActivos: number;
  casosCerrados: number;
  tiempoPromedioCierre: number;
  porcentajeRecuperacion: number;
  casosEstancados: number;
}

export interface CasoEstancado {
  claim: Claim;
  diasSinMovimiento: number;
}

export interface CuelloBotella {
  fase: string;
  faseId: number;
  casosCount: number;
  porcentajeTotal: number;
  tiempoPromedio: number;
  esCuelloBotella: boolean;
}

// ============================================================================
// COMPARATIVE ANALYSIS
// ============================================================================

export interface ComparativoPeriodo {
  periodo: string;
  totalReclamado: number;
  totalIndemnizado: number;
  casosCerrados: number;
  tiempoPromedio: number;
  porcentajeObjeciones: number;
}

export interface ComparativoAseguradora {
  aseguradora: string;
  tiempoPromedio: number;
  porcentajeObjeciones: number;
  reconsideracionesExitosas: number;
  tasaCierreExitoso: number;
}

export interface RankingItem {
  nombre: string;
  valor: number;
  posicion: number;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportType = 
  | 'dashboard-gerencial'
  | 'reporte-prescripcion'
  | 'dashboard-operativo'
  | 'metricas-tiempo'
  | 'analisis-comparativo';

export interface ReportConfig {
  id: ReportType;
  label: string;
  description: string;
  icon: string;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  includeCharts: boolean;
  includeTables: boolean;
  dateRange: DateRange | null;
  sections: string[];
  numberFormat: {
    thousandsSeparator: string;
    decimalSeparator: string;
    decimalPlaces: number;
  };
}

export interface ExportResult {
  filename: string;
  mimeType: string;
  blob: Blob;
}
