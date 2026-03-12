import type { PaginationParams, PaginatedResponse } from '../types/sla-kpi';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Simple in-memory cache for KPI responses
 */
export class KpiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from endpoint and parameters
   */
  generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramsString}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: string[];
  } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const kpiCache = new KpiCache();

/**
 * Generate pagination metadata
 */
export function generatePaginationMetadata(
  total: number,
  params: PaginationParams
): PaginatedResponse<unknown>['pagination'] {
  const totalPages = Math.ceil(total / params.limit);

  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
  };
}

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(query: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(query.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.get('limit') || '50', 10)));

  return { page, limit };
}

/**
 * Apply pagination to data array
 */
export function paginateData<T>(data: T[], params: PaginationParams): T[] {
  const startIndex = (params.page - 1) * params.limit;
  const endIndex = startIndex + params.limit;

  return data.slice(startIndex, endIndex);
}

export default kpiCache;
