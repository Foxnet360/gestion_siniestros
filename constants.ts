import { Claim, WorkflowPhase, Priority, InternalState, User } from './types';

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    id: 1,
    label: '1. AVISO - SOPORTES - ESTUDIO',
    states: ['AVISO SINIESTRO', 'OBTENCIÓN SOPORTES', 'ESTUDIO TÉCNICO CORREDORES'],
    color: 'slate'
  },
  {
    id: 2,
    label: '2. RADICACIÓN - AJUSTE',
    states: ['RADICACIÓN COMPAÑÍA', 'AJUSTADOR', 'DOCUMENTOS ADICIONALES'],
    color: 'blue'
  },
  {
    id: 3,
    label: '3. LIQUIDACIÓN - OBJECIÓN',
    states: ['DOCUMENTOS COMPLETOS', 'DEVOLUCIÓN DE DOCUMENTOS', 'LIQUIDACIÓN', 'OBJECIÓN'],
    color: 'indigo'
  },
  {
    id: 4,
    label: '4. RECONSIDERACIÓN',
    states: ['RECONSIDERACIÓN LIQUIDACIÓN', 'RECONSIDERACION OBJECIÓN', 'DESISTIMIENTO'],
    color: 'violet'
  },
  {
    id: 5,
    label: '5. RATIFICACIÓN',
    states: ['RATIFICACIÓN LIQUIDACIÓN', 'RATIFICACIÓN OBJECIÓN'],
    color: 'amber'
  },
  {
    id: 6,
    label: '6. JURÍDICO - PRESCRIPCIÓN',
    states: ['PRESCRIPCIÓN', 'PROCESO JURÍDICO'],
    color: 'rose'
  },
  {
    id: 7,
    label: '7. PAGO - FINALIZADO',
    states: ['FIRMA INDEMNIZACIÓN', 'EN PROCESO PAGO INDEMNIZACIÓN', 'FINALIZADO', 'PAGADO'],
    color: 'emerald'
  }
];

// Helper to get color based on state
export const getPhaseColor = (state: InternalState): string => {
  const phase = WORKFLOW_PHASES.find(p => p.states.includes(state));
  return phase ? phase.color : 'slate';
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Gonzalo Duque',
    email: 'tecnico@softseguros.com',
    role: 'TECNICO',
    initials: 'GD'
  },
  {
    id: 'u2',
    name: 'Maria Gerente',
    email: 'admin@softseguros.com',
    role: 'ADMIN',
    initials: 'MG'
  }
];

export const INITIAL_CLAIMS: Claim[] = [
  {
    id_softseguros: 'SOFT-001',
    numero_siniestro: 'SIN-2023-882',
    poliza: 'AUTO-COL-9921',
    asegurado: 'Transportes Rápidos S.A.S',
    estado_softseguros: 'ABIERTO',
    usuario_registro: 'admin_ss',
    ultimo_seguimiento_raw: 'Documentación recibida el 12/05/2023',
    placa_bien: 'WXY-123',
    
    ramo: 'Automóviles',
    aseguradora: 'Seguros Bolívar',
    vendedor: 'Carlos Pérez',
    tecnico_asignado: 'Gonzalo Duque',

    id_interno: 'EXT-1',
    estado_interno: 'ESTUDIO TÉCNICO CORREDORES',
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    stateHistory: [
      {
        state: 'AVISO SINIESTRO',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        daysDuration: 5,
        author: 'Sistema'
      }
    ],

    prioridad: Priority.ALTA,
    monto_reclamo: 15000000,
    valor_deducible: 1500000,
    valor_indemnizacion: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    timeline: [
      { id: 't1', date: new Date().toISOString(), author: 'Sistema', text: 'Importado desde Softseguros', isSystem: true },
      { id: 't2', date: new Date().toISOString(), author: 'Gonzalo Duque', text: 'Iniciando revisión de cobertura.' }
    ]
  },
  {
    id_softseguros: 'SOFT-002',
    numero_siniestro: 'SIN-2023-901',
    poliza: 'VIDA-GRP-110',
    asegurado: 'María Fernanda González',
    estado_softseguros: 'PENDIENTE',
    usuario_registro: 'agent_02',
    ultimo_seguimiento_raw: 'Esperando dictamen médico',
    placa_bien: 'N/A',

    ramo: 'Vida Grupo',
    aseguradora: 'Sura',
    vendedor: 'Ana López',
    tecnico_asignado: 'Gonzalo Duque',

    id_interno: 'EXT-2',
    estado_interno: 'DOCUMENTOS ADICIONALES',
    // STAGNANT CASE: Last change was 35 days ago
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), 
    stateHistory: [],

    prioridad: Priority.MEDIA,
    monto_reclamo: 5000000,
    valor_deducible: 0,
    valor_indemnizacion: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    timeline: [
      { id: 't3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(), author: 'Sistema', text: 'Importado.' }
    ]
  },
  {
    id_softseguros: 'SOFT-003',
    numero_siniestro: 'SIN-2023-755',
    poliza: 'HOGAR-MX-22',
    asegurado: 'Condominio Los Rosales',
    estado_softseguros: 'EN PROCESO',
    usuario_registro: 'admin_ss',
    ultimo_seguimiento_raw: 'Cotización aprobada',
    placa_bien: 'Apto 402',

    ramo: 'Hogar / Copropiedad',
    aseguradora: 'AXA Colpatria',
    vendedor: 'Carlos Pérez',
    tecnico_asignado: 'Maria Rodriguez',

    id_interno: 'EXT-3',
    estado_interno: 'LIQUIDACIÓN',
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    stateHistory: [],

    prioridad: Priority.BAJA,
    monto_reclamo: 2500000,
    valor_deducible: 500000,
    valor_indemnizacion: 1800000,
    updatedAt: new Date().toISOString(),
    timeline: [
      { id: 't4', date: new Date().toISOString(), author: 'Carlos Tech', text: 'Ajuste finalizado, listo para cierre.' }
    ]
  },
  {
    id_softseguros: 'SOFT-004',
    numero_siniestro: 'SIN-2023-112',
    poliza: 'AUTO-IND-55',
    asegurado: 'Juan Perez',
    estado_softseguros: 'CERRADO',
    usuario_registro: 'admin_ss',
    ultimo_seguimiento_raw: 'Pago realizado',
    placa_bien: 'QWE-999',

    ramo: 'Automóviles',
    aseguradora: 'Allianz',
    vendedor: 'Ana López',
    tecnico_asignado: 'Gonzalo Duque',

    id_interno: 'EXT-4',
    estado_interno: 'PAGADO',
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    stateHistory: [],

    prioridad: Priority.BAJA,
    monto_reclamo: 1200000,
    valor_deducible: 200000,
    valor_indemnizacion: 1000000,
    updatedAt: new Date().toISOString(),
    timeline: []
  },
  {
    id_softseguros: 'SOFT-005',
    numero_siniestro: 'SIN-2023-114',
    poliza: 'RCE-CLINICAS',
    asegurado: 'Clínica del Norte',
    estado_softseguros: 'ABIERTO',
    usuario_registro: 'admin_ss',
    ultimo_seguimiento_raw: 'Demanda recibida',
    placa_bien: 'Sede Principal',

    ramo: 'Responsabilidad Civil',
    aseguradora: 'Chubb',
    vendedor: 'Carlos Pérez',
    tecnico_asignado: 'Maria Rodriguez',

    id_interno: 'EXT-5',
    estado_interno: 'PROCESO JURÍDICO',
    // STAGNANT: 45 days
    lastStateChangeDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    stateHistory: [],

    prioridad: Priority.ALTA,
    monto_reclamo: 500000000,
    valor_deducible: 50000000,
    valor_indemnizacion: 0,
    updatedAt: new Date().toISOString(),
    timeline: []
  }
];