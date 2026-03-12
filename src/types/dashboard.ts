export interface FilterState {
  aseguradora: string | null;
  ramo: string[];
  vendedor: string | null;
  tecnico: string | null;
  asegurado: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface DashboardData {
  leadTime: {
    average: number;
    trend: number[];
    target: number;
  };
  tasas: {
    desistimiento: number;
    objetados: number;
    prescritos: number;
  };
  frecuencia: {
    current: number;
    monthly: Array<{
      month: string;
      value: number;
    }>;
  };
  severidad: Array<{
    ramo: string;
    value: number;
  }>;
  backlog: {
    abiertos: number;
    finalizados: number;
    porcentajeAbiertos: number;
  };
  tiempoPorEtapa: Array<{
    etapa: string;
    dias: number;
    sla: number;
  }>;
  timelineSLA: Array<{
    etapa: number;
    nombre: string;
    estado: 'completado' | 'en_progreso' | 'alerta' | 'excedido';
  }>;
}

export interface TaskItem {
  id: string;
  description: string;
  status: 'en_proceso' | 'pendiente' | 'validando';
  completed: boolean;
}
