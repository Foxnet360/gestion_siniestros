import type { KPIFilters, PaginationParams, PaginatedResponse } from '../types/sla-kpi';
import { kpiCache, generatePaginationMetadata, parsePaginationParams } from '../services/KpiCache';
import { kpiService } from '../services/KpiService';

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
 * Create success response with optional caching headers
 */
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

/**
 * Create error response
 */
function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/kpis/overview
 * Returns KPI overview with caching and optional pagination
 */
export async function getKpiOverview(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const pagination = parsePaginationParams(url.searchParams);

    // Generate cache key
    const cacheKey = kpiCache.generateKey('overview', { ...filters, ...pagination });

    // Check cache
    const cached = kpiCache.get<PaginatedResponse<unknown>>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    // Fetch data
    const overview = await kpiService.getOverview(filters);

    // Create paginated response
    const response: PaginatedResponse<typeof overview> = {
      data: overview,
      pagination: generatePaginationMetadata(1, pagination),
    };

    // Cache the response
    kpiCache.set(cacheKey, response, 2 * 60 * 1000); // 2 minutes TTL

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error in getKpiOverview:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/lead-time
 * Returns lead time metrics with caching
 */
export async function getLeadTime(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const includePercentiles = url.searchParams.get('includePercentiles') === 'true';
    const groupBy = url.searchParams.get('groupBy') || undefined;

    const cacheKey = kpiCache.generateKey('lead-time', { ...filters, includePercentiles, groupBy });

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getLeadTime(filters, includePercentiles, groupBy);

    kpiCache.set(cacheKey, metrics, 3 * 60 * 1000); // 3 minutes TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getLeadTime:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/tasas
 * Returns rates with caching
 */
export async function getTasas(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const includeCounts = url.searchParams.get('includeCounts') === 'true';
    const historico = url.searchParams.get('historico') === 'true';

    const cacheKey = kpiCache.generateKey('tasas', { ...filters, includeCounts, historico });

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getTasas(filters, includeCounts, historico);

    kpiCache.set(cacheKey, metrics, 2 * 60 * 1000); // 2 minutes TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getTasas:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/backlog
 * Returns backlog metrics with caching
 */
export async function getBacklog(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);
    const groupByAge = url.searchParams.get('groupByAge') === 'true';
    const groupByStage = url.searchParams.get('groupByStage') === 'true';

    const cacheKey = kpiCache.generateKey('backlog', { ...filters, groupByAge, groupByStage });

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getBacklog(filters, groupByAge, groupByStage);

    kpiCache.set(cacheKey, metrics, 1 * 60 * 1000); // 1 minute TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getBacklog:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/frecuencia-siniestralidad
 */
export async function getFrecuenciaSiniestralidad(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const cacheKey = kpiCache.generateKey('frecuencia', filters as Record<string, unknown>);

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getFrecuenciaSiniestralidad(filters);

    if (!metrics || !metrics.monthly || metrics.monthly.length === 0) {
      return createErrorResponse('Insufficient policy data for calculation', 400);
    }

    kpiCache.set(cacheKey, metrics, 10 * 60 * 1000); // 10 minutes TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getFrecuenciaSiniestralidad:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/retencion-post-siniestro
 */
export async function getRetencionPostSiniestro(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const cacheKey = kpiCache.generateKey('retencion', filters as Record<string, unknown>);

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getRetencionPostSiniestro(filters);

    if (!metrics) {
      return createErrorResponse('Insufficient renewal data for calculation', 400);
    }

    kpiCache.set(cacheKey, metrics, 10 * 60 * 1000); // 10 minutes TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getRetencionPostSiniestro:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * GET /api/kpis/severidad
 */
export async function getSeveridad(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url.searchParams);

    const cacheKey = kpiCache.generateKey('severidad', filters as Record<string, unknown>);

    const cached = kpiCache.get(cacheKey);
    if (cached) {
      return createSuccessResponse(cached, true);
    }

    const metrics = await kpiService.getSeveridad(filters);

    kpiCache.set(cacheKey, metrics, 10 * 60 * 1000); // 10 minutes TTL

    return createSuccessResponse(metrics);
  } catch (error) {
    console.error('Error in getSeveridad:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * Clear cache endpoint (admin only)
 */
export async function clearCache(request: Request): Promise<Response> {
  try {
    // TODO: Add authentication check
    kpiCache.clear();

    return createSuccessResponse({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return createErrorResponse('Failed to clear cache', 500);
  }
}

/**
 * Get cache stats (admin only)
 */
export async function getCacheStats(request: Request): Promise<Response> {
  try {
    // TODO: Add authentication check
    const stats = kpiCache.getStats();

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return createErrorResponse('Failed to get cache stats', 500);
  }
}

/**
 * Router for KPI endpoints with improved error handling
 */
export async function kpiRouter(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
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
      case '/api/kpis/cache/clear':
        return await clearCache(request);
      case '/api/kpis/cache/stats':
        return await getCacheStats(request);
      default:
        return createErrorResponse('Endpoint not found', 404);
    }
  } catch (error) {
    console.error('Unhandled error in kpiRouter:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export default kpiRouter;
