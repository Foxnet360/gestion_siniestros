import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { kpiRouter } from '../kpiRoutesEnhanced';
import { kpiCache } from '../../services/KpiCache';

// Mock KpiService
vi.mock('../../services/KpiService', () => ({
  kpiService: {
    getOverview: vi.fn(),
    getLeadTime: vi.fn(),
    getTasas: vi.fn(),
    getBacklog: vi.fn(),
    getFrecuenciaSiniestralidad: vi.fn(),
    getRetencionPostSiniestro: vi.fn(),
    getSeveridad: vi.fn(),
  },
}));

import { kpiService } from '../../services/KpiService';

describe('KPI API Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    kpiCache.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/kpis/overview', () => {
    it('should return overview data with status 200', async () => {
      const mockData = {
        leadTimeAvg: 24.5,
        tasaDesistimiento: 8.3,
        tasaObjetados: 12.1,
        tasaPrescritos: 2.4,
        porcentajeCerradosPlazo: 15.7,
        backlogActivos: 156,
      };

      vi.mocked(kpiService.getOverview).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/overview');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toEqual(mockData);
      expect(json.pagination).toBeDefined();
    });

    it('should return cached data with X-Cache header on second request', async () => {
      const mockData = {
        leadTimeAvg: 24.5,
        tasaDesistimiento: 8.3,
        tasaObjetados: 12.1,
        tasaPrescritos: 2.4,
        porcentajeCerradosPlazo: 15.7,
        backlogActivos: 156,
      };

      vi.mocked(kpiService.getOverview).mockResolvedValue(mockData);

      // First request
      const request1 = new Request('http://localhost/api/kpis/overview');
      await kpiRouter(request1);

      // Second request (should be cached)
      const request2 = new Request('http://localhost/api/kpis/overview');
      const response2 = await kpiRouter(request2);

      expect(response2.headers.get('X-Cache')).toBe('HIT');
    });

    it('should apply filters correctly', async () => {
      const mockData = {
        leadTimeAvg: 20.0,
        tasaDesistimiento: 5.0,
        tasaObjetados: 10.0,
        tasaPrescritos: 1.0,
        porcentajeCerradosPlazo: 12.0,
        backlogActivos: 100,
      };

      vi.mocked(kpiService.getOverview).mockResolvedValue(mockData);

      const request = new Request(
        'http://localhost/api/kpis/overview?aseguradora=abc123&fechaDesde=2024-01-01'
      );
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      expect(kpiService.getOverview).toHaveBeenCalledWith({
        aseguradora: 'abc123',
        fechaDesde: '2024-01-01',
      });
    });
  });

  describe('GET /api/kpis/lead-time', () => {
    it('should return lead time metrics', async () => {
      const mockData = {
        average: 24.5,
        percentiles: {
          p50: 22,
          p75: 28,
          p90: 35,
          p95: 42,
        },
      };

      vi.mocked(kpiService.getLeadTime).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/lead-time?includePercentiles=true');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.average).toBe(24.5);
      expect(json.percentiles).toBeDefined();
    });

    it('should handle includePercentiles parameter', async () => {
      const mockData = { average: 24.5 };

      vi.mocked(kpiService.getLeadTime).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/lead-time?includePercentiles=false');
      await kpiRouter(request);

      expect(kpiService.getLeadTime).toHaveBeenCalledWith({}, false, undefined);
    });
  });

  describe('GET /api/kpis/tasas', () => {
    it('should return tasas metrics', async () => {
      const mockData = {
        tasaDesistimiento: 8.3,
        tasaObjetados: 12.1,
        tasaPrescritos: 2.4,
        counts: {
          desistimiento: 42,
          objetados: 61,
          prescritos: 12,
          total: 505,
        },
      };

      vi.mocked(kpiService.getTasas).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/tasas?includeCounts=true');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.tasaDesistimiento).toBe(8.3);
      expect(json.counts).toBeDefined();
    });
  });

  describe('GET /api/kpis/backlog', () => {
    it('should return backlog with age grouping', async () => {
      const mockData = {
        total: 156,
        byAge: [
          { range: '0-30 días', count: 45 },
          { range: '31-60 días', count: 38 },
          { range: '61-90 días', count: 42 },
          { range: '90+ días', count: 31 },
        ],
      };

      vi.mocked(kpiService.getBacklog).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/backlog?groupByAge=true');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.total).toBe(156);
      expect(json.byAge).toHaveLength(4);
    });

    it('should return backlog with stage grouping', async () => {
      const mockData = {
        total: 156,
        byStage: [
          { stage: 1, count: 12 },
          { stage: 2, count: 18 },
          { stage: 3, count: 25 },
        ],
      };

      vi.mocked(kpiService.getBacklog).mockResolvedValue(mockData);

      const request = new Request('http://localhost/api/kpis/backlog?groupByStage=true');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.byStage).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const request = new Request('http://localhost/api/kpis/unknown');
      const response = await kpiRouter(request);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Endpoint not found');
    });

    it('should return 405 for non-GET methods', async () => {
      const request = new Request('http://localhost/api/kpis/overview', {
        method: 'POST',
      });
      const response = await kpiRouter(request);

      expect(response.status).toBe(405);
      const json = await response.json();
      expect(json.error).toBe('Method not allowed');
    });

    it('should return 400 for frecuencia with insufficient data', async () => {
      vi.mocked(kpiService.getFrecuenciaSiniestralidad).mockResolvedValue({
        current: 0,
        monthly: [],
        hasHistoricalData: false,
      });

      const request = new Request('http://localhost/api/kpis/frecuencia-siniestralidad');
      const response = await kpiRouter(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Insufficient policy data for calculation');
    });

    it('should return 400 for retencion with insufficient data', async () => {
      vi.mocked(kpiService.getRetencionPostSiniestro).mockResolvedValue(null);

      const request = new Request('http://localhost/api/kpis/retencion-post-siniestro');
      const response = await kpiRouter(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Insufficient renewal data for calculation');
    });

    it('should return 500 on service error', async () => {
      vi.mocked(kpiService.getOverview).mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost/api/kpis/overview');
      const response = await kpiRouter(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Database connection failed');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('http://localhost/api/kpis/overview', {
        method: 'OPTIONS',
      });
      const response = await kpiRouter(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', async () => {
      const request = new Request('http://localhost/api/kpis/cache/clear');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.message).toBe('Cache cleared successfully');
    });

    it('should return cache stats', async () => {
      const request = new Request('http://localhost/api/kpis/cache/stats');
      const response = await kpiRouter(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.size).toBeDefined();
      expect(json.entries).toBeDefined();
    });
  });
});
