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
  BAJA = 'Baja',
}

export type Role = 'ADMIN' | 'GERENTE' | 'TECNICO' | 'ALIADO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  aliadoId?: string; // Link to specific Ally organization
  isActive?: boolean; // Soft delete flag
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

export interface Amparo {
  id: string;
  claim_id: string;
  numero_siniestro: string;
  nombre_reclamante: string;
  amparo: string;
  valor: number;
  created_at: string;
}

export interface Claim {
  // Core Data (Softseguros Mirror)
  /** @ownership SoftSeguros */
  id_softseguros: string;
  /** @ownership SoftSeguros */
  numero_siniestro: string;
  /** @ownership SoftSeguros */
  poliza: string;
  /** @ownership SoftSeguros */
  asegurado: string;
  /** @ownership SoftSeguros */
  estado_softseguros: string;
  /** @ownership SoftSeguros */
  usuario_registro: string;
  /** @ownership SoftSeguros */
  ultimo_seguimiento_raw: string;
  /** @ownership SoftSeguros */
  placa_bien: string;

  // New Grouping Fields
  /** @ownership SoftSeguros */
  ramo: string; // e.g., Autos, Vida, Hogar
  /** @ownership SoftSeguros */
  aseguradora: string; // e.g., Allianz, Mapfre
  /** @ownership SoftSeguros */
  vendedor: string; // Salesperson
  /** @ownership Internal */
  tecnico_asignado: string; // Technician handling the claim
  tecnico_id?: string; // UUID reference to users table
  /** @ownership Internal */
  aliado_origen?: string; // Organization that owns/referred the policy

  // Extension Data (Management)
  /** @ownership Internal */
  id_interno: string;
  /** @ownership Internal */
  estado_interno: InternalState;
  /** @ownership Internal */
  lastStateChangeDate: string; // Key for tracking time in current state
  /** @ownership Internal */
  stateHistory: StateHistoryEntry[]; // Log of previous states

  /** @ownership Internal */
  prioridad: Priority;
  /** @ownership SoftSeguros */
  monto_reclamo: number;
  /** @ownership SoftSeguros */
  valor_deducible: number;
  /** @ownership SoftSeguros */
  valor_indemnizacion: number;
  /** @ownership SoftSeguros */
  fecha_ocurrencia?: string;
  /** @ownership Internal */
  timeline: TimelineEvent[];
  /** @ownership Internal */
  updatedAt: string;

  // Additional SoftSeguros Fields (14 new fields)
  /** @ownership SoftSeguros - Company claim number */
  numero_siniestro_compania?: string;
  /** @ownership SoftSeguros - Type of claim */
  tipo_siniestro?: string;
  /** @ownership SoftSeguros - Notice date */
  fecha_aviso?: string;
  /** @ownership SoftSeguros - Insurer notification date */
  fecha_notificacion_aseguradora?: string;
  /** @ownership SoftSeguros - Assigned provider */
  proveedor_asignado?: string;
  /** @ownership SoftSeguros - Claim description */
  descripcion?: string;
  /** @ownership SoftSeguros - Insured document ID */
  documento_asegurado?: string;
  /** @ownership SoftSeguros - Primary email */
  email_principal?: string;
  /** @ownership SoftSeguros - Primary phone */
  celular_principal?: string;
  /** @ownership SoftSeguros - Loss ratio percentage */
  porcentaje_siniestralidad?: number;
  /** @ownership SoftSeguros - Finalized flag */
  finalizado?: boolean;
  /** @ownership SoftSeguros - Finalization date */
  fecha_finalizacion?: string;
  /** @ownership SoftSeguros - Coinsurance amount */
  coaseguros?: number;

  // Hybrid Fields (2 fields from Gestión sheet)
  /** @ownership Hybrid - Management notes from Gestión sheet */
  gestion_softseguros?: string;
  /** @ownership Hybrid - Management state from Gestión sheet */
  estado_gestion_softseguros?: string;

  // Calculated Fields (2 fields)
  /** @ownership Calculated - fecha_siniestro + 2 years */
  prescripcion_ordinaria?: string;
  /** @ownership Calculated - fecha_siniestro + 5 years */
  prescripcion_extraordinaria?: string;

  // Internal Management Fields (1 new field)
  /** @ownership Internal - Next follow-up date */
  proximo_seguimiento?: string;
}

export interface KpiData {
  totalReclamado: number;
  tasaExito: number; // Percentage
  casosQuietos: number; // Count > 30 days
}

export interface FilterState {
  searchTerm: string;
  ramo: string[];
  aseguradora: string[];
  estado: string[];
  asegurado: string[];
  aliado: string[];
  prescripcionRisk?: boolean; // Show only risk > 0
}
