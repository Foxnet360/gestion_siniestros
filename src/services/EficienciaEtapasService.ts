import { supabase } from '../lib/supabase';
import { kpiCache } from './KpiCache';

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

export interface FiltrosEficienciaEtapas {
  aseguradoraId?: string;
  ramoId?: string;
  tecnicoId?: string;
  tipoProceso?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  valorMin?: number;
  valorMax?: number;
}

export interface MetricaEtapaResponse {
  etapaNum: number;
  etapaNombre: string;
  cantidadSiniestros: number;
  tiempoPromedio: number;
  tiempoP50: number;
  tiempoP90: number;
  frecuenciaSeguimientoPromedio?: number;
  cumpleSLAPorcentaje: number;
  tasaConversion: number;
  diasSLA?: number;
}

export interface CuelloDeBotellaResponse {
  etapaNum: number;
  etapaNombre: string;
  tiempoPromedio: number;
  diasSLA: number;
  desviacionSLA: number;
  severidad: 'baja' | 'media' | 'alta';
  cantidadSiniestrosAfectados: number;
}

export interface SegmentoData {
  id: string;
  nombre: string;
  cantidad: number;
  leadTimeAvg: number;
  leadTimeP90: number;
}

export interface SegmentacionResponse {
  byAseguradora: SegmentoData[];
  byRamo: SegmentoData[];
  byTecnico: SegmentoData[];
  byTipoProceso: SegmentoData[];
}

export interface MetricasEficienciaResponse {
  resumen: {
    totalSiniestros: number;
    excluidosIncompletos: number;
    porcentajeCompletos: number;
    leadTimeAvg: number;
    leadTimeP50: number;
    leadTimeP90: number;
    leadTimeMin: number;
    leadTimeMax: number;
  };
  metricasPorEtapa: MetricaEtapaResponse[];
  cuellosDeBotella: CuelloDeBotellaResponse[];
  segmentacion?: SegmentacionResponse;
}

export interface FunnelEtapaData {
  etapaNum: number;
  etapaNombre: string;
  entrada: number;
  salida: number;
  tasaConversion: number;
}

export interface FunnelResponse {
  etapas: FunnelEtapaData[];
  conversionGeneral: number;
}

export interface CalidadDatosResponse {
  totalAnalizados: number;
  incluidosEnKPI: number;
  excluidos: {
    total: number;
    porcentaje: number;
    porRazon: {
      sinEtapa1: number;
      sinEtapa16: number;
      datosInsuficientes: number;
    };
  };
  alerta?: string;
}

/**
 * ============================================================================
 * SERVICE: EficienciaEtapasService
 * ============================================================================
 */

export class EficienciaEtapasService {
  /**
   * Obtiene métricas generales de eficiencia por etapas
   */
  async getEficienciaEtapas(filtros: FiltrosEficienciaEtapas, incluirSegmentacion = false): Promise<MetricasEficienciaResponse> {
    const cacheKey = this.generateCacheKey('eficiencia-etapas', filtros, incluirSegmentacion);
    const cached = kpiCache.get<MetricasEficienciaResponse>(cacheKey);
    if (cached) return cached;

    // Construir query base (permitimos datos parciales para análisis en tiempo real)
    let query = supabase.from('metricas_etapas').select('*');

    // Aplicar filtros
    if (filtros.aseguradoraId) query = query.eq('aseguradora_id', filtros.aseguradoraId);
    if (filtros.ramoId) query = query.eq('ramo_id', filtros.ramoId);
    if (filtros.tecnicoId) query = query.eq('tecnico_id', filtros.tecnicoId);
    if (filtros.tipoProceso) query = query.eq('tipo_proceso', filtros.tipoProceso);
    if (filtros.fechaDesde) query = query.gte('fecha_entrada', filtros.fechaDesde);
    if (filtros.fechaHasta) query = query.lte('fecha_entrada', filtros.fechaHasta);

    const { data: metricas, error } = await query;

    if (error) throw new Error(`Error consultando metricas: ${error.message}`);

    if (!metricas || metricas.length === 0) {
      return {
        resumen: {
          totalSiniestros: 0,
          excluidosIncompletos: 0,
          porcentajeCompletos: 0,
          leadTimeAvg: 0,
          leadTimeP50: 0,
          leadTimeP90: 0,
          leadTimeMin: 0,
          leadTimeMax: 0,
        },
        metricasPorEtapa: [],
        cuellosDeBotella: [],
      };
    }

    // Obtener definiciones de SLAs
    const { data: slas } = await supabase.from('sla_por_etapa').select('*');
    const slaMap = new Map(slas?.map(s => [s.etapa_num, s]) || []);

    const metricasPorEtapa: MetricaEtapaResponse[] = [];
    const leadTimes: number[] = [];
    const claimIdsSet = new Set(metricas.map(m => m.claim_id));

    // Calcular métricas por etapa
    for (let etapaNum = 1; etapaNum <= 16; etapaNum++) {
      const metricasEtapa = metricas.filter(m => m.etapa_num === etapaNum);
      if (metricasEtapa.length === 0) continue;

      const tiempos = metricasEtapa.map(m => m.dias_habiles).sort((a, b) => a - b);
      const frecuencias = metricasEtapa.filter(m => m.frecuencia_dias !== null).map(m => m.frecuencia_dias);
      const cumplenSLA = metricasEtapa.filter(m => m.cumple_sla === true).length;
      const sla = slaMap.get(etapaNum);

      metricasPorEtapa.push({
        etapaNum,
        etapaNombre: sla?.etapa_nombre || `Etapa ${etapaNum}`,
        cantidadSiniestros: metricasEtapa.length,
        tiempoPromedio: Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 100) / 100,
        tiempoP50: this.calcularPercentil(tiempos, 50),
        tiempoP90: this.calcularPercentil(tiempos, 90),
        frecuenciaSeguimientoPromedio: frecuencias.length > 0
          ? Math.round((frecuencias.reduce((a, b) => (a || 0) + (b || 0), 0) / frecuencias.length) * 100) / 100
          : undefined,
        cumpleSLAPorcentaje: Math.round((cumplenSLA / metricasEtapa.length) * 10000) / 100,
        tasaConversion: 100,
        diasSLA: sla?.dias_sla || undefined,
      });
    }

    // Calcular Lead Times por siniestro
    claimIdsSet.forEach(claimId => {
      const metricasClaim = metricas.filter(m => m.claim_id === claimId);
      const leadTime = metricasClaim.reduce((sum, m) => sum + (m.dias_habiles || 0), 0);
      leadTimes.push(leadTime);
    });

    const leadTimesSorted = leadTimes.sort((a, b) => a - b);
    const cuellosDeBotella = this.identificarCuellosDeBotella(metricasPorEtapa);

    const response: MetricasEficienciaResponse = {
      resumen: {
        totalSiniestros: claimIdsSet.size,
        excluidosIncompletos: 0,
        porcentajeCompletos: 100,
        leadTimeAvg: leadTimes.length > 0 ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 100) / 100 : 0,
        leadTimeP50: this.calcularPercentil(leadTimesSorted, 50),
        leadTimeP90: this.calcularPercentil(leadTimesSorted, 90),
        leadTimeMin: leadTimes.length > 0 ? leadTimes[0] : 0,
        leadTimeMax: leadTimes.length > 0 ? leadTimes[leadTimes.length - 1] : 0,
      },
      metricasPorEtapa,
      cuellosDeBotella,
    };

    if (incluirSegmentacion) {
      response.segmentacion = await this.calcularSegmentacion(metricas);
    }

    kpiCache.set(cacheKey, response, 5 * 60 * 1000);
    return response;
  }

  /**
   * Obtiene datos del funnel de conversión
   */
  async getFunnelEtapas(filtros: FiltrosEficienciaEtapas): Promise<FunnelResponse> {
    const cacheKey = this.generateCacheKey('funnel-etapas', filtros);
    const cached = kpiCache.get<FunnelResponse>(cacheKey);
    if (cached) return cached;

    let query = supabase.from('metricas_etapas').select('*');
    if (filtros.tipoProceso) query = query.eq('tipo_proceso', filtros.tipoProceso);

    const { data: metricas, error } = await query;
    if (error) throw new Error(`Error consultando funnel: ${error.message}`);

    const { data: slas } = await supabase.from('sla_por_etapa').select('*');
    const slaMap = new Map(slas?.map(s => [s.etapa_num, s]) || []);

    const etapasFunnel: FunnelEtapaData[] = [];
    for (let etapaNum = 1; etapaNum <= 16; etapaNum++) {
      const entrada = new Set(metricas?.filter(m => m.etapa_num === etapaNum).map(m => m.claim_id)).size;
      const salida = new Set(metricas?.filter(m => m.etapa_num === etapaNum + 1).map(m => m.claim_id)).size;
      const tasaConversion = entrada > 0 ? Math.round((salida / entrada) * 10000) / 100 : 0;

      etapasFunnel.push({
        etapaNum,
        etapaNombre: slaMap.get(etapaNum)?.etapa_nombre || `Etapa ${etapaNum}`,
        entrada,
        salida,
        tasaConversion,
      });
    }

    const entradaInicial = etapasFunnel[0]?.entrada || 0;
    const salidaFinal = etapasFunnel[etapasFunnel.length - 1]?.salida || 0;
    const conversionGeneral = entradaInicial > 0 ? Math.round((salidaFinal / entradaInicial) * 10000) / 100 : 0;

    const response: FunnelResponse = { etapas: etapasFunnel, conversionGeneral };
    kpiCache.set(cacheKey, response, 5 * 60 * 1000);
    return response;
  }

  /**
   * Obtiene información sobre la calidad de los datos
   */
  async getCalidadDatos(filtros: FiltrosEficienciaEtapas): Promise<CalidadDatosResponse> {
    const cacheKey = this.generateCacheKey('calidad-datos', filtros);
    const cached = kpiCache.get<CalidadDatosResponse>(cacheKey);
    if (cached) return cached;

    const { count: totalAnalizados } = await supabase.from('siniestro_etapas').select('claim_id', { count: 'exact', head: true }).eq('is_active', true);
    let queryIncluidos = supabase.from('metricas_etapas').select('claim_id', { count: 'exact', head: true });
    if (filtros.tipoProceso) queryIncluidos = queryIncluidos.eq('tipo_proceso', filtros.tipoProceso);
    const { count: incluidos } = await queryIncluidos;

    const { data: exclusiones } = await supabase.from('metricas_etapas').select('razon_incompleto').eq('datos_completos', false);
    
    const sinEtapa1 = exclusiones?.filter(e => e.razon_incompleto?.includes('sin_etapa_1')).length || 0;
    const sinEtapa16 = exclusiones?.filter(e => e.razon_incompleto?.includes('sin_etapa_16')).length || 0;
    const totalExcluidos = exclusiones?.length || 0;
    const datosInsuficientes = totalExcluidos - sinEtapa1 - sinEtapa16;

    const porcentajeExcluidos = totalAnalizados ? Math.round((totalExcluidos / totalAnalizados) * 10000) / 100 : 0;
    let alerta: string | undefined;
    if (porcentajeExcluidos > 50) alerta = 'Mas del 50% de siniestros excluidos - Los KPIs pueden no ser representativos';
    else if (porcentajeExcluidos > 30) alerta = 'Mas del 30% de siniestros excluidos - Revisar calidad de datos fuente';

    const response: CalidadDatosResponse = {
      totalAnalizados: totalAnalizados || 0,
      incluidosEnKPI: incluidos || 0,
      excluidos: {
        total: totalExcluidos,
        porcentaje: porcentajeExcluidos,
        porRazon: { sinEtapa1, sinEtapa16, datosInsuficientes }
      },
      alerta
    };

    kpiCache.set(cacheKey, response, 5 * 60 * 1000);
    return response;
  }

  /**
   * MÉTODOS PRIVADOS
   */

  private calcularPercentil(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private identificarCuellosDeBotella(metricasPorEtapa: MetricaEtapaResponse[]): CuelloDeBotellaResponse[] {
    return metricasPorEtapa
      .filter(e => e.diasSLA && e.cantidadSiniestros > 0)
      .map(e => {
        const desviacion = e.tiempoPromedio - (e.diasSLA || 0);
        const porcentaje = e.diasSLA ? (desviacion / e.diasSLA) * 100 : 0;
        let severidad: 'baja' | 'media' | 'alta' = 'baja';
        if (porcentaje > 100) severidad = 'alta';
        else if (porcentaje > 50) severidad = 'media';
        
        return {
          etapaNum: e.etapaNum,
          etapaNombre: e.etapaNombre,
          tiempoPromedio: e.tiempoPromedio,
          diasSLA: e.diasSLA || 0,
          desviacionSLA: desviacion,
          severidad,
          cantidadSiniestrosAfectados: e.cantidadSiniestros
        };
      })
      .filter(c => c.desviacionSLA > 0.3 * c.diasSLA)
      .sort((a, b) => b.desviacionSLA - a.desviacionSLA);
  }

  private async calcularSegmentacion(metricas: any[]): Promise<SegmentacionResponse> {
    const claimsMap = new Map<string, any>();
    metricas.forEach(m => {
      if (!claimsMap.has(m.claim_id)) {
        claimsMap.set(m.claim_id, {
          aseguradoraId: m.aseguradora_id,
          ramoId: m.ramo_id,
          tecnicoId: m.tecnico_id,
          tipoProceso: m.tipo_proceso,
          tiempos: []
        });
      }
      claimsMap.get(m.claim_id).tiempos.push(m.dias_habiles || 0);
    });

    const segments = { 
        byAseguradora: new Map<string, any>(), 
        byRamo: new Map<string, any>(), 
        byTecnico: new Map<string, any>(), 
        byTipoProceso: new Map<string, any>() 
    };

    claimsMap.forEach((claim) => {
      const leadTime = claim.tiempos.reduce((a: number, b: number) => a + b, 0);
      this.addToSegment(segments.byAseguradora, claim.aseguradoraId, leadTime);
      this.addToSegment(segments.byRamo, claim.ramoId, leadTime);
      this.addToSegment(segments.byTecnico, claim.tecnicoId, leadTime);
      this.addToSegment(segments.byTipoProceso, claim.tipoProceso, leadTime);
    });

    return {
      byAseguradora: this.mapToSegmentData(segments.byAseguradora),
      byRamo: this.mapToSegmentData(segments.byRamo),
      byTecnico: this.mapToSegmentData(segments.byTecnico),
      byTipoProceso: this.mapToSegmentData(segments.byTipoProceso),
    };
  }

  private addToSegment(map: Map<string, any>, id: string, leadTime: number) {
    if (!id) return;
    if (!map.has(id)) map.set(id, { id, nombre: id, cantidad: 0, leadTimes: [] });
    const seg = map.get(id);
    seg.cantidad++;
    seg.leadTimes.push(leadTime);
  }

  private mapToSegmentData(map: Map<string, any>): SegmentoData[] {
    return Array.from(map.values()).map(seg => {
      const sorted = seg.leadTimes.sort((a: number, b: number) => a - b);
      const avg = sorted.reduce((a: number, b: number) => a + b, 0) / sorted.length;
      return {
        id: seg.id,
        nombre: seg.nombre,
        cantidad: seg.cantidad,
        leadTimeAvg: Math.round(avg * 100) / 100,
        leadTimeP90: sorted[Math.ceil(0.9 * sorted.length) - 1] || 0
      };
    }).sort((a, b) => a.leadTimeAvg - b.leadTimeAvg);
  }

  private generateCacheKey(prefix: string, filtros: FiltrosEficienciaEtapas, extra?: any): string {
    const params = Object.entries(filtros)
      .filter(([_, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${prefix}:${params}${extra ? `:${JSON.stringify(extra)}` : ''}`;
  }
}

export const eficienciaEtapasService = new EficienciaEtapasService();
