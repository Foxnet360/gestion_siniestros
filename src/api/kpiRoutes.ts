import { kpiService } from '../services/KpiService';
import type { KPIFilters, PaginationParams } from '../types/sla-kpi';

/**
 * Parse query parameters into filters
 */
function parseFilters(query: URLSearchParams): KPIFilters {
  const filters: KPIFilters = {};

  if (query.has('aseguradora')) filters.aseguradora = query.get('aseguradora')!;
  if (query.has('asegurado')) filters.asegurado = query.get('asegurado')!;
  if (query.has('ramo')) filters.ramo = query.get('ramo')!;
  if (query.has('vendedor')) filters.vendedor = query.get('vendedor')!;
  if (query.has('valorMin')) filters.valorMin = parseFloat(query.get('valorMin')!);
  if (query.has('valorMax')) filters.valorMax = parseFloat(query.get('valorMax')!);
  if (query.has('fechaDesde')) filters.fechaDesde = query.get('fechaDesde')!;
  if (query.has('fechaHasta')) filters.fechaHasta = query.get('fechaHasta')!;
  if (query.has('siniestroSS')) filters.siniestroSS = query.get('siniestroSS')!;
  if (query.has('siniestroCompania')) filters.siniestroCompania = query.get('siniestroCompania')!;

  return filters;
}

/**
 * Parse pagination parameters
 */
function parsePagination(query: URLSearchParams): PaginationParams {
  return {
    page: parseInt(query.get('page') || '1'),
    limit: parseInt(query.get('limit') || '50'),
  };
}

/**
 * Standard success response
 */
function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Standard error response
 */
function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/kpis/overview
 * Returns KPI overview with all main metrics
 */
export async function getKpiOverview(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const overview = await kpiService.getOverview(filters);
    return successResponse(overview);
  } catch (error) {
    console.error('Error in getKpiOverview:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/lead-time
 * Returns lead time metrics with optional percentiles and grouping
 */
export async function getLeadTime(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const includePercentiles = url.searchParams.get('includePercentiles') === 'true';
    const groupBy = url.searchParams.get('groupBy') || undefined;

    const metrics = await kpiService.getLeadTime(filters, includePercentiles, groupBy);
    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getLeadTime:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/tasas
 * Returns rates (desistimiento, objetados, prescritos)
 */
export async function getTasas(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const includeCounts = url.searchParams.get('includeCounts') === 'true';
    const historico = url.searchParams.get('historico') === 'true';

    const metrics = await kpiService.getTasas(filters, includeCounts, historico);
    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getTasas:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/backlog
 * Returns backlog metrics with optional grouping
 */
export async function getBacklog(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const groupByAge = url.searchParams.get('groupByAge') === 'true';
    const groupByStage = url.searchParams.get('groupByStage') === 'true';

    const metrics = await kpiService.getBacklog(filters, groupByAge, groupByStage);
    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getBacklog:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/frecuencia-siniestralidad
 * Returns loss frequency by ramo
 */
export async function getFrecuenciaSiniestralidad(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const metrics = await kpiService.getFrecuenciaSiniestralidad(filters);

    if (!metrics || !metrics.monthly || metrics.monthly.length === 0) {
      return errorResponse('Insufficient policy data for calculation', 400);
    }

    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getFrecuenciaSiniestralidad:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/retencion-post-siniestro
 * Returns post-claim retention rate
 */
export async function getRetencionPostSiniestro(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const metrics = await kpiService.getRetencionPostSiniestro(filters);

    if (!metrics) {
      return errorResponse('Insufficient renewal data for calculation', 400);
    }

    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getRetencionPostSiniestro:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * GET /api/kpis/severidad
 * Returns severity metrics by ramo and amparo
 */
export async function getSeveridad(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const metrics = await kpiService.getSeveridad(filters);
    return successResponse(metrics);
  } catch (error) {
    console.error('Error in getSeveridad:', error);
    return errorResponse((error as Error).message, 500);
  }
}

/**
 * Router for KPI endpoints
 */
export async function kpiRouter(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  switch (path) {
    case '/api/kpis/overview':
      return await getKpiOverview(request);
    case '/api/kpis/lead-time':
      return await getLeadTime(request);
    case '/api/kpis/tasas':
      return await getTasas(request);
    case '/api/kpis/backlog':
      return await getBacklog(request);
    case '/api/kpis/frecuencia-siniestralidad':
      return await getFrecuenciaSiniestralidad(request);
    case '/api/kpis/retencion-post-siniestro':
      return await getRetencionPostSiniestro(request);
    case '/api/kpis/severidad':
      return await getSeveridad(request);
    default:
      return errorResponse('Endpoint not found', 404);
  }
}
