export type InternalState = 
  // FASE 1
  | 'AVISO SINIESTRO'
  | 'OBTENCIÓN SOPORTES'
  | 'ESTUDIO TÉCNICO CORREDORES'
  // FASE 2
  | 'RADICACIÓN COMPAÑÍA'
  | 'AJUSTADOR'
  | 'DOCUMENTOS ADICIONALES'
  // FASE 3
  | 'DOCUMENTOS COMPLETOS'
  | 'DEVOLUCIÓN DE DOCUMENTOS'
  | 'LIQUIDACIÓN'
  | 'OBJECIÓN'
  // FASE 4
  | 'RECONSIDERACIÓN LIQUIDACIÓN'
  | 'RECONSIDERACION OBJECIÓN'
  | 'DESISTIMIENTO'
  // FASE 5
  | 'RATIFICACIÓN LIQUIDACIÓN'
  | 'RATIFICACIÓN OBJECIÓN'
  // FASE 6
  | 'PRESCRIPCIÓN'
  | 'PROCESO JURÍDICO'
  // FASE 7
  | 'FIRMA INDEMNIZACIÓN'
  | 'EN PROCESO PAGO INDEMNIZACIÓN'
  | 'FINALIZADO'
  | 'PAGADO';

export interface WorkflowPhase {
  id: number;
  label: string;
  states: InternalState[];
  color: string; // Tailwind color class base (e.g., 'blue')
}

export enum Priority {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja'
}

export type Role = 'ADMIN' | 'TECNICO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO String
  author: string;
  text: string;
  isSystem?: boolean;
}

export interface StateHistoryEntry {
  state: InternalState;
  startDate: string;
  endDate: string;
  daysDuration: number;
  author: string;
}

export interface Claim {
  // Core Data (Softseguros Mirror)
  id_softseguros: string;
  numero_siniestro: string;
  poliza: string;
  asegurado: string;
  estado_softseguros: string;
  usuario_registro: string;
  ultimo_seguimiento_raw: string;
  placa_bien: string; 

  // New Grouping Fields
  ramo: string;            // e.g., Autos, Vida, Hogar
  aseguradora: string;     // e.g., Allianz, Mapfre
  vendedor: string;        // Salesperson
  tecnico_asignado: string;// Technician handling the claim

  // Extension Data (Management)
  id_interno: string;
  estado_interno: InternalState;
  lastStateChangeDate: string; // Key for tracking time in current state
  stateHistory: StateHistoryEntry[]; // Log of previous states
  
  prioridad: Priority;
  monto_reclamo: number;
  valor_deducible: number;
  valor_indemnizacion: number;
  fecha_ocurrencia?: string;
  timeline: TimelineEvent[];
  updatedAt: string;
}

export interface KpiData {
  totalReclamado: number;
  tasaExito: number; // Percentage
  casosQuietos: number; // Count > 30 days
}