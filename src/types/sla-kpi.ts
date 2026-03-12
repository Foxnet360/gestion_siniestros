/**
 * Types for SLA Tracking and KPI system
 */

export interface SiniestroEtapas {
  id: string;
  claim_id: string;
  etapa_1_fecha: string | null; // Aviso Siniestro
  etapa_2_fecha: string | null; // Radicación Compañía
  etapa_3_fecha: string | null; // Ajustador
  etapa_4_fecha: string | null; // Documentos Adicionales
  etapa_5_fecha: string | null; // Asistencia
  etapa_6_fecha: string | null; // Liquidación
  etapa_7_fecha: string | null; // Objeción
  etapa_8_fecha: string | null; // Reconsideración Liquidación
  etapa_9_fecha: string | null; // Reconsideración Objeción
  etapa_10_fecha: string | null; // Desistimiento
  etapa_11_fecha: string | null; // Ratificación Liquidación
  etapa_12_fecha: string | null; // Ratificación Objeción
  etapa_13_fecha: string | null; // Prescripción
  etapa_14_fecha: string | null; // Proceso Jurídico
  etapa_15_fecha: string | null; // Finalizado
  etapa_16_fecha: string | null; // Pagado
  is_active: boolean;
  extraction_errors: string[];
  created_at: string;
  updated_at: string;
}

export interface ExtractedDates {
  etapa_1_fecha: string | null;
  etapa_2_fecha: string | null;
  etapa_3_fecha: string | null;
  etapa_4_fecha: string | null;
  etapa_5_fecha: string | null;
  etapa_6_fecha: string | null;
  etapa_7_fecha: string | null;
  etapa_8_fecha: string | null;
  etapa_9_fecha: string | null;
  etapa_10_fecha: string | null;
  etapa_11_fecha: string | null;
  etapa_12_fecha: string | null;
  etapa_13_fecha: string | null;
  etapa_14_fecha: string | null;
  etapa_15_fecha: string | null;
  etapa_16_fecha: string | null;
}

export interface StageKeywords {
  [key: number]: string[];
}

export interface KPIOverview {
  leadTimeAvg: number; // in business days
  tasaDesistimiento: number; // percentage
  tasaObjetados: number; // percentage
  tasaPrescritos: number; // percentage
  porcentajeCerradosPlazo: number; // percentage
  backlogActivos: number; // count
  totalSiniestros: number; // total count for consistency
  finalizadosCount: number; // finished count for consistency
}

export interface LeadTimeMetrics {
  average: number;
  percentiles?: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  byCategory?: {
    category: string;
    average: number;
  }[];
}

export interface TasasMetrics {
  tasaDesistimiento: number;
  tasaObjetados: number;
  tasaPrescritos: number;
  counts?: {
    desistimiento: number;
    objetados: number;
    prescritos: number;
    total: number;
  };
  historico?: {
    month: string;
    tasaDesistimiento: number;
    tasaObjetados: number;
    tasaPrescritos: number;
  }[];
}

export interface BacklogMetrics {
  total: number;
  byAge?: {
    range: string;
    count: number;
  }[];
  byStage?: {
    stage: number;
    count: number;
  }[];
}

export interface FrecuenciaSiniestralidad {
  ramo?: string;
  frecuencia?: number;
  siniestrosCount?: number;
  polizasVigentes?: number;
  current?: number;
  monthly?: Array<{ month: string; value: number }>;
  hasHistoricalData?: boolean;
}

export interface RetencionPostSiniestro {
  tasaRetencion: number;
  clientesConSiniestro: number;
  clientesRenovaron: number;
}

export interface SeveridadRamo {
  ramo: string;
  amparo: string;
  severidad: number;
  costoTotal: number;
  siniestrosCount: number;
}

export interface KPIFilters {
  aseguradora?: string;
  asegurado?: string;
  ramo?: string;
  vendedor?: string;
  tecnico?: string;
  valorMin?: number;
  valorMax?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  siniestroSS?: string;
  siniestroCompania?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExtractionResult {
  claimId: string;
  extractedDates: ExtractedDates;
  errors: string[];
  success: boolean;
}

export interface BatchExtractionSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  extractedByStage: {
    [key: number]: number;
  };
  errors: {
    claimId: string;
    error: string;
  }[];
}
