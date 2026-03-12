export * from './sla-kpi';

// Stubbing missing types that block Vite HMR
export type AlertLevel = 'info' | 'warning' | 'critical' | 'success';

export interface ReportFilters {
  [key: string]: any;
}

export interface ExecutiveReportData {
  [key: string]: any;
}

export interface ExportOptions {
  [key: string]: any;
}

export type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'all';

export interface KpisData {
  [key: string]: any;
}

export interface PrescripcionRiskData {
  [key: string]: any;
}

export interface RiesgoPrescripcion {
  [key: string]: any;
}

export interface ProductividadTecnico {
  [key: string]: any;
}

export interface CasoEstancado {
  [key: string]: any;
}

export interface ComparativoPeriodo {
  [key: string]: any;
}

export interface ComparativoAseguradora {
  [key: string]: any;
}

export interface ComparativoRamo {
  [key: string]: any;
}

export interface ComparativoHistorico {
  [key: string]: any;
}

export interface TiempoPorFase {
  [key: string]: any;
}

export interface ExcelExportData {
  sheetName: string;
  headers: string[];
  data: any[];
  summary?: any;
}
