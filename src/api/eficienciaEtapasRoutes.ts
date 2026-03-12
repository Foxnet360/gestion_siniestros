import { supabase } from '../lib/supabase';
import { kpiCache } from '../services/KpiCache';

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

export interface SegmentacionResponse {
  byAseguradora: SegmentoData[];
  byRamo: SegmentoData[];
  byTecnico: SegmentoData[];
  byTipoProceso: SegmentoData[];
}

export interface SegmentoData {
  id: string;
  nombre: string;
  cantidad: number;
  leadTimeAvg: number;
  leadTimeP90: number;
}

export interface FunnelResponse {
  etapas: FunnelEtapaData[];
  conversionGeneral: number;
}

export interface FunnelEtapaData {
  etapaNum: number;
  etapaNombre: string;
  entrada: number;
  salida: number;
  tasaConversion: number;
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
 * UTILIDADES
 * ============================================================================
 */

function parseFiltros(query: URLSearchParams): FiltrosEficienciaEtapas {
  const filtros: FiltrosEficienciaEtapas = {};

  if (query.has('aseguradora')) filtros.aseguradoraId = query.get('aseguradora')!;
  if (query.has('ramo')) filtros.ramoId = query.get('ramo')!;
  if (query.has('tecnico')) filtros.tecnicoId = query.get('tecnico')!;
  if (query.has('tipoProceso')) filtros.tipoProceso = query.get('tipoProceso')!;
  if (query.has('fechaDesde')) filtros.fechaDesde = query.get('fechaDesde')!;
  if (query.has('fechaHasta')) filtros.fechaHasta = query.get('fechaHasta')!;
  if (query.has('valorMin')) filtros.valorMin = parseFloat(query.get('valorMin')!);
  if (query.has('valorMax')) filtros.valorMax = parseFloat(query.get('valorMax')!);

  return filtros;
}

function createSuccessResponse<T>(data: T, fromCache: boolean = false): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (fromCache) {
    headers['X-Cache'] = 'HIT';
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateCacheKey(prefix: string, filtros: FiltrosEficienciaEtapas): string {
  const params = Object.entries(filtros)
    .filter(([_, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return `${prefix}:${params}`;
}

/**
 * ============================================================================
 * CALCULOS AUXILIARES
 * ============================================================================
 */

function calcularPercentil(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

function identificarCuellosDeBotella(
  metricasPorEtapa: MetricaEtapaResponse[]
): CuelloDeBotellaResponse[] {
  const cuellos: CuelloDeBotellaResponse[] = [];

  for (const etapa of metricasPorEtapa) {
    if (!etapa.diasSLA || etapa.cantidadSiniestros === 0) continue;

    const desviacion = etapa.tiempoPromedio - etapa.diasSLA;
    const porcentajeDesviacion = etapa.diasSLA > 0 ? (desviacion / etapa.diasSLA) * 100 : 0;

    let severidad: 'baja' | 'media' | 'alta' = 'baja';
    if (porcentajeDesviacion > 100) severidad = 'alta';
    else if (porcentajeDesviacion > 50) severidad = 'media';

    if (porcentajeDesviacion > 30) {
      cuellos.push({
        etapaNum: etapa.etapaNum,
        etapaNombre: etapa.etapaNombre,
        tiempoPromedio: etapa.tiempoPromedio,
        diasSLA: etapa.diasSLA,
        desviacionSLA: desviacion,
        severidad,
        cantidadSiniestrosAfectados: etapa.cantidadSiniestros,
      });
    }
  }

  return cuellos.sort((a, b) => b.desviacionSLA - a.desviacionSLA);
}

/**
 * ============================================================================
 * ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/kpis/eficiencia-etapas
 * Retorna metricas de eficiencia por etapas con filtros
 */
export async function getEficienciaEtapas(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);
    const incluirSegmentacion = url.searchParams.get('segmentacion') === 'true';

    // Generar cache key
    const cacheKey = generateCacheKey('eficiencia-etapas', filtros);

    // Verificar cache
    const cached = kpiCache.get<MetricasEficienciaResponse>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    // Construir query base
    let query = supabase.from('metricas_etapas').select('*').eq('datos_completos', true);

    // Aplicar filtros
    if (filtros.aseguradoraId) {
      query = query.eq('aseguradora_id', filtros.aseguradoraId);
    }
    if (filtros.ramoId) {
      query = query.eq('ramo_id', filtros.ramoId);
    }
    if (filtros.tecnicoId) {
      query = query.eq('tecnico_id', filtros.tecnicoId);
    }
    if (filtros.tipoProceso) {
      query = query.eq('tipo_proceso', filtros.tipoProceso);
    }
    if (filtros.fechaDesde) {
      query = query.gte('fecha_entrada', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      query = query.lte('fecha_entrada', filtros.fechaHasta);
    }

    const { data: metricas, error } = await query;

    if (error) {
      throw new Error(`Error consultando metricas: ${error.message}`);
    }

    if (!metricas || metricas.length === 0) {
      return createSuccessResponse({
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
      });
    }

    // Obtener definiciones de SLAs
    const { data: slas } = await supabase.from('sla_por_etapa').select('*');

    const slaMap = new Map(slas?.map(s => [s.etapa_num, s]) || []);

    // Calcular metricas por etapa
    const metricasPorEtapa: MetricaEtapaResponse[] = [];
    const leadTimes: number[] = [];

    for (let etapaNum = 1; etapaNum <= 16; etapaNum++) {
      const metricasEtapa = metricas.filter(m => m.etapa_num === etapaNum);

      if (metricasEtapa.length === 0) continue;

      const tiempos = metricasEtapa.map(m => m.dias_habiles).sort((a, b) => a - b);
      const frecuencias = metricasEtapa
        .filter(m => m.frecuencia_dias !== null)
        .map(m => m.frecuencia_dias);

      const sla = slaMap.get(etapaNum);
      const cumplenSLA = metricasEtapa.filter(m => m.cumple_sla === true).length;

      // Calcular Lead Time total por siniestro
      const claimIds = [...new Set(metricasEtapa.map(m => m.claim_id))];
      claimIds.forEach(claimId => {
        const metricasClaim = metricas.filter(m => m.claim_id === claimId);
        const leadTime = metricasClaim.reduce((sum, m) => sum + (m.dias_habiles || 0), 0);
        leadTimes.push(leadTime);
      });

      metricasPorEtapa.push({
        etapaNum,
        etapaNombre: sla?.etapa_nombre || `Etapa ${etapaNum}`,
        cantidadSiniestros: metricasEtapa.length,
        tiempoPromedio:
          Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 100) / 100,
        tiempoP50: calcularPercentil(tiempos, 50),
        tiempoP90: calcularPercentil(tiempos, 90),
        frecuenciaSeguimientoPromedio:
          frecuencias.length > 0
            ? Math.round(
                (frecuencias.reduce((a, b) => (a || 0) + (b || 0), 0) / frecuencias.length) * 100
              ) / 100
            : undefined,
        cumpleSLAPorcentaje: Math.round((cumplenSLA / metricasEtapa.length) * 10000) / 100,
        tasaConversion: 100, // Se calcula en funnel
        diasSLA: sla?.dias_sla || undefined,
      });
    }

    // Calcular cuellos de botella
    const cuellosDeBotella = identificarCuellosDeBotella(metricasPorEtapa);

    // Calcular resumen
    const leadTimesSorted = leadTimes.sort((a, b) => a - b);

    const response: MetricasEficienciaResponse = {
      resumen: {
        totalSiniestros: new Set(metricas.map(m => m.claim_id)).size,
        excluidosIncompletos: 0,
        porcentajeCompletos: 100,
        leadTimeAvg:
          leadTimes.length > 0
            ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 100) / 100
            : 0,
        leadTimeP50: calcularPercentil(leadTimesSorted, 50),
        leadTimeP90: calcularPercentil(leadTimesSorted, 90),
        leadTimeMin: leadTimes.length > 0 ? leadTimes[0] : 0,
        leadTimeMax: leadTimes.length > 0 ? leadTimes[leadTimes.length - 1] : 0,
      },
      metricasPorEtapa,
      cuellosDeBotella,
    };

    // Calcular segmentacion si se solicita
    if (incluirSegmentacion) {
      response.segmentacion = await calcularSegmentacion(metricas);
    }

    // Cachear respuesta (5 minutos)
    kpiCache.set(cacheKey, response, 5 * 60 * 1000);

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error en getEficienciaEtapas:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      500
    );
  }
}

/**
 * GET /api/kpis/eficiencia-etapas/funnel
 * Retorna datos del funnel de conversion entre etapas
 */
export async function getFunnelEtapas(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);

    const cacheKey = generateCacheKey('funnel-etapas', filtros);
    const cached = kpiCache.get<FunnelResponse>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    // Obtener metricas
    let query = supabase.from('metricas_etapas').select('*').eq('datos_completos', true);

    if (filtros.tipoProceso) {
      query = query.eq('tipo_proceso', filtros.tipoProceso);
    }

    const { data: metricas, error } = await query;

    if (error) {
      throw new Error(`Error consultando metricas: ${error.message}`);
    }

    // Obtener SLAs
    const { data: slas } = await supabase.from('sla_por_etapa').select('*');

    const slaMap = new Map(slas?.map(s => [s.etapa_num, s]) || []);

    // Calcular funnel
    const etapasFunnel: FunnelEtapaData[] = [];
    let entradaAnterior = 0;

    for (let etapaNum = 1; etapaNum <= 16; etapaNum++) {
      const metricasEtapa = metricas?.filter(m => m.etapa_num === etapaNum) || [];
      const uniqueClaims = new Set(metricasEtapa.map(m => m.claim_id));
      const entrada = uniqueClaims.size;

      // Calcular salida (siniestros que pasaron a siguiente etapa)
      const metricasSiguiente = metricas?.filter(m => m.etapa_num === etapaNum + 1) || [];
      const salida = new Set(metricasSiguiente.map(m => m.claim_id)).size;

      const tasaConversion = entrada > 0 ? Math.round((salida / entrada) * 10000) / 100 : 0;

      etapasFunnel.push({
        etapaNum,
        etapaNombre: slaMap.get(etapaNum)?.etapa_nombre || `Etapa ${etapaNum}`,
        entrada,
        salida,
        tasaConversion,
      });

      entradaAnterior = entrada;
    }

    // Calcular conversion general (etapa 1 a etapa 16)
    const entradaInicial = etapasFunnel[0]?.entrada || 0;
    const salidaFinal = etapasFunnel[etapasFunnel.length - 1]?.salida || 0;
    const conversionGeneral =
      entradaInicial > 0 ? Math.round((salidaFinal / entradaInicial) * 10000) / 100 : 0;

    const response: FunnelResponse = {
      etapas: etapasFunnel,
      conversionGeneral,
    };

    kpiCache.set(cacheKey, response, 5 * 60 * 1000);

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error en getFunnelEtapas:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      500
    );
  }
}

/**
 * GET /api/kpis/eficiencia-etapas/segmentacion
 * Retorna metricas segmentadas por diferentes dimensiones
 */
export async function getSegmentacion(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);

    const cacheKey = generateCacheKey('segmentacion', filtros);
    const cached = kpiCache.get<SegmentacionResponse>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    // Obtener metricas
    let query = supabase.from('metricas_etapas').select('*').eq('datos_completos', true);

    if (filtros.fechaDesde) {
      query = query.gte('fecha_entrada', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      query = query.lte('fecha_entrada', filtros.fechaHasta);
    }

    const { data: metricas, error } = await query;

    if (error) {
      throw new Error(`Error consultando metricas: ${error.message}`);
    }

    const segmentacion = await calcularSegmentacion(metricas || []);

    kpiCache.set(cacheKey, segmentacion, 5 * 60 * 1000);

    return createSuccessResponse(segmentacion);
  } catch (error) {
    console.error('Error en getSegmentacion:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      500
    );
  }
}

/**
 * GET /api/kpis/eficiencia-etapas/calidad-datos
 * Retorna informacion sobre calidad de datos y exclusiones
 */
export async function getCalidadDatos(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filtros = parseFiltros(url.searchParams);

    const cacheKey = generateCacheKey('calidad-datos', filtros);
    const cached = kpiCache.get<CalidadDatosResponse>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    // Contar siniestros totales
    let queryTotal = supabase
      .from('siniestro_etapas')
      .select('claim_id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalAnalizados, error: errorTotal } = await queryTotal;

    if (errorTotal) {
      throw new Error(`Error contando siniestros: ${errorTotal.message}`);
    }

    // Contar siniestros con metricas (incluidos)
    let queryIncluidos = supabase
      .from('metricas_etapas')
      .select('claim_id', { count: 'exact', head: true })
      .eq('datos_completos', true);

    if (filtros.tipoProceso) {
      queryIncluidos = queryIncluidos.eq('tipo_proceso', filtros.tipoProceso);
    }

    const { count: incluidos, error: errorIncluidos } = await queryIncluidos;

    if (errorIncluidos) {
      throw new Error(`Error contando incluidos: ${errorIncluidos.message}`);
    }

    // Contar exclusiones por razon
    const { data: exclusiones, error: errorExcl } = await supabase
      .from('metricas_etapas')
      .select('razon_incompleto')
      .eq('datos_completos', false);

    if (errorExcl) {
      throw new Error(`Error consultando exclusiones: ${errorExcl.message}`);
    }

    const sinEtapa1 =
      exclusiones?.filter(e => e.razon_incompleto?.includes('sin_etapa_1')).length || 0;
    const sinEtapa16 =
      exclusiones?.filter(e => e.razon_incompleto?.includes('sin_etapa_16')).length || 0;
    const datosInsuficientes = (exclusiones?.length || 0) - sinEtapa1 - sinEtapa16;

    const totalExcluidos = exclusiones?.length || 0;
    const porcentajeExcluidos =
      totalAnalizados && totalAnalizados > 0
        ? Math.round((totalExcluidos / totalAnalizados) * 10000) / 100
        : 0;

    // Determinar alerta
    let alerta: string | undefined;
    if (porcentajeExcluidos > 50) {
      alerta = 'Mas del 50% de siniestros excluidos - Los KPIs pueden no ser representativos';
    } else if (porcentajeExcluidos > 30) {
      alerta = 'Mas del 30% de siniestros excluidos - Revisar calidad de datos fuente';
    }

    const response: CalidadDatosResponse = {
      totalAnalizados: totalAnalizados || 0,
      incluidosEnKPI: incluidos || 0,
      excluidos: {
        total: totalExcluidos,
        porcentaje: porcentajeExcluidos,
        porRazon: {
          sinEtapa1,
          sinEtapa16,
          datosInsuficientes,
        },
      },
      alerta,
    };

    kpiCache.set(cacheKey, response, 5 * 60 * 1000);

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error en getCalidadDatos:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      500
    );
  }
}

/**
 * Funcion auxiliar para calcular segmentacion
 */
async function calcularSegmentacion(metricas: any[]): Promise<SegmentacionResponse> {
  const byAseguradora = new Map<
    string,
    { id: string; nombre: string; cantidad: number; leadTimes: number[] }
  >();
  const byRamo = new Map<
    string,
    { id: string; nombre: string; cantidad: number; leadTimes: number[] }
  >();
  const byTecnico = new Map<
    string,
    { id: string; nombre: string; cantidad: number; leadTimes: number[] }
  >();
  const byTipoProceso = new Map<
    string,
    { id: string; nombre: string; cantidad: number; leadTimes: number[] }
  >();

  // Agrupar por claim_id para calcular Lead Time por siniestro
  const claimsMap = new Map<
    string,
    {
      aseguradoraId?: string;
      ramoId?: string;
      tecnicoId?: string;
      tipoProceso?: string;
      diasHabiles: number[];
    }
  >();

  metricas.forEach(m => {
    if (!claimsMap.has(m.claim_id)) {
      claimsMap.set(m.claim_id, {
        aseguradoraId: m.aseguradora_id,
        ramoId: m.ramo_id,
        tecnicoId: m.tecnico_id,
        tipoProceso: m.tipo_proceso,
        diasHabiles: [],
      });
    }
    claimsMap.get(m.claim_id)!.diasHabiles.push(m.dias_habiles || 0);
  });

  // Calcular segmentos
  claimsMap.forEach((claim, claimId) => {
    const leadTime = claim.diasHabiles.reduce((a, b) => a + b, 0);

    // Aseguradora
    if (claim.aseguradoraId) {
      if (!byAseguradora.has(claim.aseguradoraId)) {
        byAseguradora.set(claim.aseguradoraId, {
          id: claim.aseguradoraId,
          nombre: claim.aseguradoraId,
          cantidad: 0,
          leadTimes: [],
        });
      }
      const seg = byAseguradora.get(claim.aseguradoraId)!;
      seg.cantidad++;
      seg.leadTimes.push(leadTime);
    }

    // Ramo
    if (claim.ramoId) {
      if (!byRamo.has(claim.ramoId)) {
        byRamo.set(claim.ramoId, {
          id: claim.ramoId,
          nombre: claim.ramoId,
          cantidad: 0,
          leadTimes: [],
        });
      }
      const seg = byRamo.get(claim.ramoId)!;
      seg.cantidad++;
      seg.leadTimes.push(leadTime);
    }

    // Tecnico
    if (claim.tecnicoId) {
      if (!byTecnico.has(claim.tecnicoId)) {
        byTecnico.set(claim.tecnicoId, {
          id: claim.tecnicoId,
          nombre: claim.tecnicoId,
          cantidad: 0,
          leadTimes: [],
        });
      }
      const seg = byTecnico.get(claim.tecnicoId)!;
      seg.cantidad++;
      seg.leadTimes.push(leadTime);
    }

    // Tipo Proceso
    if (claim.tipoProceso) {
      if (!byTipoProceso.has(claim.tipoProceso)) {
        byTipoProceso.set(claim.tipoProceso, {
          id: claim.tipoProceso,
          nombre: claim.tipoProceso,
          cantidad: 0,
          leadTimes: [],
        });
      }
      const seg = byTipoProceso.get(claim.tipoProceso)!;
      seg.cantidad++;
      seg.leadTimes.push(leadTime);
    }
  });

  // Convertir a respuesta
  const mapToResponse = (map: Map<string, any>): SegmentoData[] => {
    return Array.from(map.values())
      .map(seg => {
        const sorted = seg.leadTimes.sort((a: number, b: number) => a - b);
        const avg =
          sorted.length > 0 ? sorted.reduce((a: number, b: number) => a + b, 0) / sorted.length : 0;
        const p90Index = Math.ceil(0.9 * sorted.length) - 1;

        return {
          id: seg.id,
          nombre: seg.nombre,
          cantidad: seg.cantidad,
          leadTimeAvg: Math.round(avg * 100) / 100,
          leadTimeP90: sorted[Math.max(0, p90Index)] || 0,
        };
      })
      .sort((a, b) => a.leadTimeAvg - b.leadTimeAvg);
  };

  return {
    byAseguradora: mapToResponse(byAseguradora),
    byRamo: mapToResponse(byRamo),
    byTecnico: mapToResponse(byTecnico),
    byTipoProceso: mapToResponse(byTipoProceso),
  };
}

/**
 * ============================================================================
 * ROUTER
 * ============================================================================
 */

export async function eficienciaEtapasRouter(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Routing
  if (pathname === '/api/kpis/eficiencia-etapas' || pathname.endsWith('/eficiencia-etapas')) {
    return getEficienciaEtapas(request);
  }

  if (pathname.includes('/eficiencia-etapas/funnel')) {
    return getFunnelEtapas(request);
  }

  if (pathname.includes('/eficiencia-etapas/segmentacion')) {
    return getSegmentacion(request);
  }

  if (pathname.includes('/eficiencia-etapas/calidad-datos')) {
    return getCalidadDatos(request);
  }

  return createErrorResponse('Endpoint no encontrado', 404);
}
