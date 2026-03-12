import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * ============================================================================
 * TYPES & INTERFACES
 * ============================================================================
 */

export interface MetricasEtapa {
  id?: string;
  claimId: string;
  etapaNum: number;
  fechaEntrada: string;
  fechaSalida?: string;
  diasHabiles: number;
  diasCalendario: number;
  cantidadSeguimientos: number;
  frecuenciaDias?: number;
  diasSLA?: number;
  cumpleSLA?: boolean;
  desviacionSLA?: number;
  pasoASiguienteEtapa: boolean;
  etapaSiguiente?: number;
  datosCompletos: boolean;
  razonIncompleto?: string;
  notasCalidad?: string;
  aseguradoraId?: string;
  ramoId?: string;
  tecnicoId?: string;
  tipoProceso: 'normal' | 'prescripcion_ordinaria' | 'prescripcion_extraordinaria' | 'incompleto';
  rangoValor?: string;
}

export interface SeguimientoProcesado {
  claimId: string;
  fecha: string;
  observaciones?: string;
  estadoSoftSeguros?: string;
  estadoInterno?: string;
  etapaDetectada?: number;
  usuarioId?: string;
  diasDesdeUltimo?: number;
  esSeguimientoProgramado?: boolean;
}

export interface ValidacionDatos {
  esCompleto: boolean;
  tieneEtapa1: boolean;
  tieneEtapa16: boolean;
  etapasFaltantes: number[];
  razon?: string;
}

export interface ResultadoProcesamiento {
  claimId: string;
  exito: boolean;
  metricas: MetricasEtapa[];
  leadTimeTotal?: number;
  tipoProceso?: string;
  error?: string;
  datosCompletos: boolean;
  razonExclusion?: string;
}

export interface ResumenProcesamiento {
  total: number;
  exitosos: number;
  fallidos: number;
  excluidos: {
    total: number;
    sinEtapa1: number;
    sinEtapa16: number;
    datosInsuficientes: number;
  };
  porTipoProceso: {
    normal: number;
    prescripcionOrdinaria: number;
    prescripcionExtraordinaria: number;
    incompleto: number;
  };
}

export interface FiltrosEficiencia {
  aseguradoraId?: string;
  ramoId?: string;
  tecnicoId?: string;
  tipoProceso?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  valorMin?: number;
  valorMax?: number;
}

export interface MetricasAgregadas {
  totalSiniestros: number;
  excluidosIncompletos: number;
  porcentajeCompletos: number;
  leadTimeAvg: number;
  leadTimeP50: number;
  leadTimeP90: number;
  leadTimeMin: number;
  leadTimeMax: number;
  metricasPorEtapa: MetricaEtapaAgregada[];
  cuellosDeBotella: CuelloDeBotella[];
}

export interface MetricaEtapaAgregada {
  etapaNum: number;
  etapaNombre: string;
  cantidadSiniestros: number;
  tiempoPromedio: number;
  tiempoP50: number;
  tiempoP90: number;
  frecuenciaSeguimientoPromedio?: number;
  cumpleSLAPorcentaje: number;
  tasaConversion: number;
}

export interface CuelloDeBotella {
  etapaNum: number;
  etapaNombre: string;
  tiempoPromedio: number;
  diasSLA: number;
  desviacionSLA: number;
  severidad: 'baja' | 'media' | 'alta';
  cantidadSiniestrosAfectados: number;
}

/**
 * ============================================================================
 * FERIADOS COLOMBIA (Hardcoded para años comunes)
 * ============================================================================
 */

const FERIADOS_2024 = [
  '2024-01-01',
  '2024-01-08',
  '2024-03-25',
  '2024-03-28',
  '2024-03-29',
  '2024-05-01',
  '2024-05-13',
  '2024-06-03',
  '2024-06-10',
  '2024-07-01',
  '2024-07-20',
  '2024-08-07',
  '2024-08-19',
  '2024-10-14',
  '2024-11-04',
  '2024-11-11',
  '2024-12-08',
  '2024-12-25',
];

const FERIADOS_2025 = [
  '2025-01-01',
  '2025-01-06',
  '2025-03-24',
  '2025-04-17',
  '2025-04-18',
  '2025-05-01',
  '2025-06-02',
  '2025-06-23',
  '2025-06-30',
  '2025-07-20',
  '2025-08-07',
  '2025-08-18',
  '2025-10-13',
  '2025-11-03',
  '2025-11-17',
  '2025-12-08',
  '2025-12-25',
];

/**
 * ============================================================================
 * SERVICE: MetricasEtapasService
 * ============================================================================
 */

export class MetricasEtapasService {
  private feriadosCache: Set<string> = new Set();

  constructor() {
    // Inicializar caché de feriados
    this.cargarFeriadosIniciales();
  }

  /**
   * Carga feriados iniciales en caché
   */
  private cargarFeriadosIniciales(): void {
    FERIADOS_2024.forEach(f => this.feriadosCache.add(f));
    FERIADOS_2025.forEach(f => this.feriadosCache.add(f));
  }

  /**
   * ==========================================================================
   * 2.2 & 2.3: CÁLCULO DE DÍAS HÁBILES (excluye fines de semana y feriados)
   * ==========================================================================
   */
  calcularDiasHabiles(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Si es la misma fecha, retornar 1 día hábil
    if (start.toDateString() === end.toDateString()) {
      return this.esDiaHabil(start) ? 1 : 0;
    }

    let businessDays = 0;
    const current = new Date(start);

    while (current <= end) {
      if (this.esDiaHabil(current)) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  }

  /**
   * Verifica si una fecha es día hábil (no fin de semana ni feriado)
   */
  private esDiaHabil(date: Date): boolean {
    const dayOfWeek = date.getDay();

    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Verificar si es feriado
    const fechaStr = date.toISOString().split('T')[0];
    return !this.feriadosCache.has(fechaStr);
  }

  /**
   * Calcula días calendario entre dos fechas
   */
  calcularDiasCalendario(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Verifica si una fecha específica es feriado en Colombia
   */
  async esFeriadoColombia(fecha: string | Date): Promise<boolean> {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];

    // Verificar en caché primero
    if (this.feriadosCache.has(fechaStr)) {
      return true;
    }

    // Consultar en BD si no está en caché
    try {
      const { data } = await supabase
        .from('feriados_colombia')
        .select('fecha')
        .eq('fecha', fechaStr)
        .single();

      if (data) {
        this.feriadosCache.add(fechaStr);
        return true;
      }
    } catch (error) {
      console.error('Error consultando feriado:', error);
    }

    return false;
  }

  /**
   * ==========================================================================
   * 2.4: VALIDAR COMPLETITUD DE DATOS
   * ==========================================================================
   */
  validarCompletitudDatos(etapas: any[]): ValidacionDatos {
    const etapasConFecha = etapas.filter(e => e.fecha !== null);
    const numerosEtapas = etapasConFecha.map(e => e.etapaNum || e.etapa_num);

    const tieneEtapa1 = numerosEtapas.includes(1);
    const tieneEtapa16 = numerosEtapas.includes(16);

    const etapasFaltantes: number[] = [];
    if (!tieneEtapa1) etapasFaltantes.push(1);
    if (!tieneEtapa16) etapasFaltantes.push(16);

    let razon: string | undefined;
    if (!tieneEtapa1 && !tieneEtapa16) {
      razon = 'sin_etapa_1_y_16';
    } else if (!tieneEtapa1) {
      razon = 'sin_etapa_1';
    } else if (!tieneEtapa16) {
      razon = 'sin_etapa_16';
    }

    return {
      esCompleto: etapasConFecha.length >= 2, // Permitir análisis si hay al menos un intervalo
      tieneEtapa1,
      tieneEtapa16,
      etapasFaltantes,
      razon,
    };
  }

  /**
   * ==========================================================================
   * 2.5: CALCULAR FRECUENCIA DE SEGUIMIENTO
   * ==========================================================================
   */
  async calcularFrecuenciaSeguimiento(
    claimId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<{ cantidad: number; frecuenciaDias?: number }> {
    try {
      // Obtener seguimientos de claim_history
      const { data: seguimientos, error } = await supabase
        .from('claim_history')
        .select('*')
        .eq('claim_id', claimId)
        .eq('field_name', 'observaciones')
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFin)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const cantidad = seguimientos?.length || 0;

      if (cantidad <= 1) {
        return { cantidad, frecuenciaDias: cantidad === 1 ? undefined : undefined };
      }

      // Calcular frecuencia promedio
      const diasTotales = this.calcularDiasHabiles(fechaInicio, fechaFin);
      const intervalos = cantidad - 1;
      const frecuenciaDias = diasTotales / intervalos;

      return { cantidad, frecuenciaDias };
    } catch (error) {
      console.error(`Error calculando frecuencia para ${claimId}:`, error);
      return { cantidad: 0 };
    }
  }

  /**
   * ==========================================================================
   * 2.6: CLASIFICAR TIPO DE PROCESO
   * ==========================================================================
   */
  clasificarTipoProceso(etapas: any[], duracionTotalDias: number): MetricasEtapa['tipoProceso'] {
    const tienePrescripcion = etapas.some(e => (e.etapaNum || e.etapa_num) === 13);

    if (!tienePrescripcion && duracionTotalDias < 365) {
      return 'normal';
    }

    if (duracionTotalDias < 1095) {
      return 'prescripcion_ordinaria';
    }

    return 'prescripcion_extraordinaria';
  }

  /**
   * ==========================================================================
   * 2.7: CALCULAR MÉTRICAS PARA UNA ETAPA INDIVIDUAL
   * ==========================================================================
   */
  async calcularMetricasPorEtapa(
    claimId: string,
    etapa: any,
    siguienteEtapa: any | null,
    claimData: any
  ): Promise<MetricasEtapa | null> {
    const etapaNum = etapa.etapaNum || etapa.etapa_num;
    const fechaEntrada = etapa.fecha;

    if (!fechaEntrada) return null;

    // Si no hay siguiente etapa, no podemos calcular tiempo de permanencia
    if (!siguienteEtapa || !siguienteEtapa.fecha) {
      return {
        claimId,
        etapaNum,
        fechaEntrada,
        diasHabiles: 0,
        diasCalendario: 0,
        cantidadSeguimientos: 0,
        pasoASiguienteEtapa: false,
        datosCompletos: true,
        tipoProceso: 'incompleto',
      };
    }

    const fechaSalida = siguienteEtapa.fecha;

    // Calcular tiempos
    const diasHabiles = this.calcularDiasHabiles(fechaEntrada, fechaSalida);
    const diasCalendario = this.calcularDiasCalendario(fechaEntrada, fechaSalida);

    // Calcular frecuencia de seguimiento
    const { cantidad: cantidadSeguimientos, frecuenciaDias } =
      await this.calcularFrecuenciaSeguimiento(claimId, fechaEntrada, fechaSalida);

    // Obtener SLA de la etapa
    const { data: slaData } = await supabase
      .from('sla_por_etapa')
      .select('dias_sla')
      .eq('etapa_num', etapaNum)
      .single();

    const diasSLA = slaData?.dias_sla;
    const cumpleSLA =
      diasSLA !== null && diasSLA !== undefined ? diasHabiles <= diasSLA : undefined;
    const desviacionSLA =
      diasSLA !== null && diasSLA !== undefined ? diasHabiles - diasSLA : undefined;

    return {
      claimId,
      etapaNum,
      fechaEntrada,
      fechaSalida,
      diasHabiles,
      diasCalendario,
      cantidadSeguimientos,
      frecuenciaDias,
      diasSLA: diasSLA || undefined,
      cumpleSLA,
      desviacionSLA,
      pasoASiguienteEtapa: true,
      etapaSiguiente: siguienteEtapa.etapaNum || siguienteEtapa.etapa_num,
      datosCompletos: true,
      aseguradoraId: claimData.aseguradora_id,
      ramoId: claimData.ramo_id,
      tecnicoId: claimData.tecnico_asignado,
      tipoProceso: 'normal', // Se actualizará después
    };
  }

  /**
   * ==========================================================================
   * 2.8: CALCULAR MÉTRICAS PARA UN SINIESTRO COMPLETO
   * ==========================================================================
   */
  async calcularMetricasSiniestro(claimId: string): Promise<ResultadoProcesamiento> {
    try {
      // Obtener datos del claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select('*')
        .eq('id_softseguros', claimId)
        .single();

      if (claimError || !claim) {
        throw new Error(`No se encontró el siniestro ${claimId}`);
      }

      // Obtener etapas del siniestro
      const { data: etapas, error: etapasError } = await supabase
        .from('siniestro_etapas')
        .select('*')
        .eq('claim_id', claimId)
        .single();

      if (etapasError || !etapas) {
        throw new Error(`No se encontraron etapas para ${claimId}`);
      }

      // Convertir etapas a array procesable
      const etapasArray = this.convertirEtapasAArray(etapas);

      // Validar completitud
      const validacion = this.validarCompletitudDatos(etapasArray);

      if (!validacion.esCompleto) {
        return {
          claimId,
          exito: false,
          metricas: [],
          datosCompletos: false,
          razonExclusion: validacion.razon,
          error: `Datos incompletos: ${validacion.razon}`,
        };
      }

      // Calcular métricas por etapa
      const metricas: MetricasEtapa[] = [];

      for (let i = 0; i < etapasArray.length - 1; i++) {
        const etapaActual = etapasArray[i];
        const etapaSiguiente = etapasArray[i + 1];

        const metrica = await this.calcularMetricasPorEtapa(
          claimId,
          etapaActual,
          etapaSiguiente,
          claim
        );

        if (metrica) {
          metricas.push(metrica);
        }
      }

      // Calcular Lead Time total
      const leadTimeTotal = metricas.reduce((sum, m) => sum + m.diasHabiles, 0);

      // Clasificar tipo de proceso
      const tipoProceso = this.clasificarTipoProceso(etapasArray, leadTimeTotal);

      // Actualizar tipo de proceso en todas las métricas
      metricas.forEach(m => (m.tipoProceso = tipoProceso));

      // Calcular rango de valor si aplica
      const rangoValor = this.calcularRangoValor(claim.valor_indemnizado);
      metricas.forEach(m => (m.rangoValor = rangoValor));

      return {
        claimId,
        exito: true,
        metricas,
        leadTimeTotal,
        tipoProceso,
        datosCompletos: true,
      };
    } catch (error) {
      console.error(`Error procesando ${claimId}:`, error);
      return {
        claimId,
        exito: false,
        metricas: [],
        datosCompletos: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Convierte el registro de siniestro_etapas a un array procesable
   */
  private convertirEtapasAArray(etapas: any): any[] {
    const etapasArray: any[] = [];

    for (let i = 1; i <= 16; i++) {
      const fecha = etapas[`etapa_${i}_fecha`];
      if (fecha) {
        etapasArray.push({
          etapaNum: i,
          etapa_num: i,
          fecha: fecha,
        });
      }
    }

    return etapasArray.sort((a, b) => a.etapaNum - b.etapaNum);
  }

  /**
   * Calcula el rango de valor para segmentación
   */
  private calcularRangoValor(valor: number | null | undefined): string {
    if (!valor) return 'sin_valor';
    if (valor <= 5000000) return '0-5M';
    if (valor <= 20000000) return '5M-20M';
    return '>20M';
  }

  /**
   * ==========================================================================
   * 2.9: EVALUAR CUMPLIMIENTO DE SLA
   * ==========================================================================
   */
  evaluarCumplimientoSLA(
    diasReales: number,
    diasSLA?: number
  ): { cumple: boolean; desviacion: number } | null {
    if (diasSLA === undefined || diasSLA === null) {
      return null;
    }

    const desviacion = diasReales - diasSLA;
    const cumple = diasReales <= diasSLA;

    return { cumple, desviacion };
  }

  /**
   * ==========================================================================
   * 2.10: GUARDAR MÉTRICAS EN BD
   * ==========================================================================
   */
  async guardarMetricas(metricas: MetricasEtapa[]): Promise<boolean> {
    if (!metricas || metricas.length === 0) return false;

    try {
      // Preparar datos para insert/upsert
      const registros = metricas.map(m => ({
        claim_id: m.claimId,
        etapa_num: m.etapaNum,
        fecha_entrada: m.fechaEntrada,
        fecha_salida: m.fechaSalida,
        dias_habiles: m.diasHabiles,
        dias_calendario: m.diasCalendario,
        cantidad_seguimientos: m.cantidadSeguimientos,
        frecuencia_dias: m.frecuenciaDias,
        dias_sla: m.diasSLA,
        cumple_sla: m.cumpleSLA,
        desviacion_sla: m.desviacionSLA,
        paso_a_siguiente_etapa: m.pasoASiguienteEtapa,
        etapa_siguiente: m.etapaSiguiente,
        datos_completos: m.datosCompletos,
        razon_incompleto: m.razonIncompleto,
        notas_calidad: m.notasCalidad,
        aseguradora_id: m.aseguradoraId,
        ramo_id: m.ramoId,
        tecnico_id: m.tecnicoId,
        tipo_proceso: m.tipoProceso,
        rango_valor: m.rangoValor,
      }));

      const { error } = await supabase.from('metricas_etapas').upsert(registros, {
        onConflict: 'claim_id,etapa_num',
        ignoreDuplicates: false,
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error guardando métricas:', error);
      return false;
    }
  }

  /**
   * ==========================================================================
   * MÉTODOS ADICIONALES DE APOYO
   * ==========================================================================
   */

  /**
   * Obtiene todas las métricas calculadas para un siniestro
   */
  async obtenerMetricasPorClaim(claimId: string): Promise<MetricasEtapa[]> {
    const { data, error } = await supabase
      .from('metricas_etapas')
      .select('*')
      .eq('claim_id', claimId)
      .order('etapa_num', { ascending: true });

    if (error) {
      console.error('Error obteniendo métricas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Verifica si un siniestro ya tiene métricas calculadas
   */
  async tieneMetricasCalculadas(claimId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('metricas_etapas')
      .select('*', { count: 'exact', head: true })
      .eq('claim_id', claimId);

    if (error) {
      console.error('Error verificando métricas:', error);
      return false;
    }

    return (count || 0) > 0;
  }
}

// Export singleton instance
export const metricasEtapasService = new MetricasEtapasService();
