import { supabase } from '../lib/supabase';

/**
 * ============================================================================
 * SERVICIO ALTERNATIVO: Métricas basadas en estado_interno y fechas de ingesta
 * ============================================================================
 *
 * Como no tenemos datos históricos de etapas desde SoftSeguros,
 * este servicio calcula métricas usando:
 * - estado_interno: para determinar en qué etapa está el siniestro
 * - fecha de ingesta: como referencia temporal
 * - fecha_aviso y fecha_finalizacion: para calcular lead time básico
 */

export interface MetricaBasica {
  claimId: string;
  estadoInterno: string;
  etapaDetectada: number;
  fechaAviso?: string;
  fechaIngesta: string;
  fechaFinalizacion?: string;
  diasDesdeAviso: number;
  diasDesdeIngesta: number;
  estaFinalizado: boolean;
}

export interface ResumenPorEstado {
  estado: string;
  etapa: number;
  cantidad: number;
  promedioDias: number;
}

export class MetricasSimplesService {
  /**
   * Mapeo de estados internos a etapas del proceso
   * Ajustar según los estados reales que tengan en estado_interno
   */
  private static estadoAEtapa(estado: string): number {
    const estadoUpper = estado?.toUpperCase().trim() || '';

    // Mapeo de estados a etapas (ajustar según sus estados reales)
    const mapeo: { [key: string]: number } = {
      AVISO: 1,
      RADICADO: 2,
      'EN AJUSTE': 3,
      'EN DOCUMENTACION': 4,
      'EN ASISTENCIA': 5,
      'EN LIQUIDACION': 6,
      OBJETADO: 7,
      RECONSIDERACION: 8,
      'EN DESISTIMIENTO': 10,
      RATIFICADO: 11,
      'EN PRESCRIPCION': 13,
      'PROCESO JURIDICO': 14,
      FINALIZADO: 15,
      PAGADO: 16,
      CERRADO: 16,
    };

    // Buscar coincidencia parcial
    for (const [key, etapa] of Object.entries(mapeo)) {
      if (estadoUpper.includes(key)) {
        return etapa;
      }
    }

    return 0; // Etapa no identificada
  }

  /**
   * Determina si un estado es finalizado
   */
  private static esEstadoFinal(estado: string): boolean {
    const estadoUpper = estado?.toUpperCase().trim() || '';
    return (
      estadoUpper.includes('FINALIZADO') ||
      estadoUpper.includes('PAGADO') ||
      estadoUpper.includes('CERRADO') ||
      estadoUpper.includes('DESISTIMIENTO')
    );
  }

  /**
   * Calcula días entre dos fechas
   */
  private static calcularDias(fechaInicio: string, fechaFin?: string): number {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene métricas básicas de todos los siniestros activos
   */
  async obtenerMetricasBasicas(filtros?: {
    fechaDesde?: string;
    fechaHasta?: string;
    aseguradoraId?: string;
    ramoId?: string;
  }): Promise<{
    total: number;
    finalizados: number;
    activos: number;
    leadTimePromedio: number;
    porEstado: ResumenPorEstado[];
    detalles: MetricaBasica[];
  }> {
    try {
      // Construir query base
      let query = supabase.from('claims').select('*');

      // Aplicar filtros
      if (filtros?.fechaDesde) {
        query = query.gte('fecha_aviso', filtros.fechaDesde);
      }
      if (filtros?.fechaHasta) {
        query = query.lte('fecha_aviso', filtros.fechaHasta);
      }
      if (filtros?.aseguradoraId) {
        query = query.eq('aseguradora_id', filtros.aseguradoraId);
      }
      if (filtros?.ramoId) {
        query = query.eq('ramo_id', filtros.ramoId);
      }

      const { data: claims, error } = await query;

      if (error) throw error;

      // Procesar métricas
      const detalles: MetricaBasica[] = [];
      const porEstado: Map<
        string,
        { estado: string; etapa: number; cantidad: number; dias: number[] }
      > = new Map();

      claims?.forEach(claim => {
        const estado = claim.estado_interno || 'SIN ESTADO';
        const etapa = MetricasSimplesService.estadoAEtapa(estado);
        const estaFinalizado = MetricasSimplesService.esEstadoFinal(estado);

        const fechaAviso = claim.fecha_aviso;
        const fechaIngesta = claim.created_at || claim.fecha_aviso;
        const fechaFinalizacion = estaFinalizado
          ? claim.fecha_finalizacion || new Date().toISOString()
          : undefined;

        const diasDesdeAviso = fechaAviso ? MetricasSimplesService.calcularDias(fechaAviso) : 0;
        const diasDesdeIngesta = fechaIngesta
          ? MetricasSimplesService.calcularDias(fechaIngesta)
          : 0;

        detalles.push({
          claimId: claim.id_softseguros,
          estadoInterno: estado,
          etapaDetectada: etapa,
          fechaAviso,
          fechaIngesta,
          fechaFinalizacion,
          diasDesdeAviso,
          diasDesdeIngesta,
          estaFinalizado,
        });

        // Agrupar por estado
        if (!porEstado.has(estado)) {
          porEstado.set(estado, { estado, etapa, cantidad: 0, dias: [] });
        }
        const grupo = porEstado.get(estado)!;
        grupo.cantidad++;
        grupo.dias.push(diasDesdeAviso || diasDesdeIngesta);
      });

      // Calcular resumen
      const total = claims?.length || 0;
      const finalizados = detalles.filter(d => d.estaFinalizado).length;
      const activos = total - finalizados;

      // Calcular lead time promedio (solo finalizados)
      const leadTimes = detalles
        .filter(d => d.estaFinalizado && d.fechaAviso && d.fechaFinalizacion)
        .map(d => MetricasSimplesService.calcularDias(d.fechaAviso!, d.fechaFinalizacion));

      const leadTimePromedio =
        leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

      // Convertir mapa a array
      const resumenPorEstado: ResumenPorEstado[] = Array.from(porEstado.values())
        .map(e => ({
          estado: e.estado,
          etapa: e.etapa,
          cantidad: e.cantidad,
          promedioDias: e.dias.reduce((a, b) => a + b, 0) / e.dias.length,
        }))
        .sort((a, b) => a.etapa - b.etapa);

      return {
        total,
        finalizados,
        activos,
        leadTimePromedio: Math.round(leadTimePromedio),
        porEstado: resumenPorEstado,
        detalles,
      };
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }

  /**
   * Genera un funnel simplificado basado en estados actuales
   */
  async generarFunnelSimplificado(): Promise<{
    etapas: { etapa: number; nombre: string; cantidad: number }[];
  }> {
    const { porEstado } = await this.obtenerMetricasBasicas();

    // Agrupar por etapa
    const porEtapa: Map<number, { etapa: number; nombre: string; cantidad: number }> = new Map();

    porEstado.forEach(item => {
      if (!porEtapa.has(item.etapa)) {
        porEtapa.set(item.etapa, {
          etapa: item.etapa,
          nombre: this.getNombreEtapa(item.etapa),
          cantidad: 0,
        });
      }
      porEtapa.get(item.etapa)!.cantidad += item.cantidad;
    });

    return {
      etapas: Array.from(porEtapa.values()).sort((a, b) => a.etapa - b.etapa),
    };
  }

  /**
   * Obtiene nombre de etapa según número
   */
  private getNombreEtapa(etapa: number): string {
    const nombres: { [key: number]: string } = {
      1: 'Aviso',
      2: 'Radicación',
      3: 'Ajuste',
      4: 'Documentación',
      5: 'Asistencia',
      6: 'Liquidación',
      7: 'Objeción',
      8: 'Reconsideración',
      10: 'Desistimiento',
      11: 'Ratificación',
      13: 'Prescripción',
      14: 'Proceso Jurídico',
      15: 'Finalizado',
      16: 'Pagado',
    };
    return nombres[etapa] || `Etapa ${etapa}`;
  }
}

// Exportar instancia
export const metricasSimplesService = new MetricasSimplesService();
