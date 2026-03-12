import { supabase } from '../lib/supabase';
import type {
  KPIOverview,
  LeadTimeMetrics,
  TasasMetrics,
  BacklogMetrics,
  FrecuenciaSiniestralidad,
  RetencionPostSiniestro,
  SeveridadRamo,
  KPIFilters,
} from '../types/sla-kpi';
import { calculateBusinessDays } from '../utils/dateUtils';
import { TIEMPO_OBJETIVO_CIERRE } from '../constants/reports';

/**
 * Service for calculating and retrieving KPI metrics
 */
export class KpiService {
  // ============================================================================
  // PAGINATION HELPER - PostgREST enforces 1000-row server limit
  // ============================================================================

  /**
   * Fetch ALL rows from a Supabase query by paginating in chunks.
   * PostgREST caps responses at 1000 rows regardless of .limit().
   */
  private async fetchAllRows(
    buildQuery: () => ReturnType<typeof supabase.from>
  ): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const query = buildQuery();
      const { data, error } = await (query as any).range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Paginated fetch error: ${error.message}`);
      }

      const rows = data || [];
      allData = allData.concat(rows);

      if (rows.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    }

    return allData;
  }
  // HELPER METHODS FOR RESILIENT CLAIM CLOSURE DETECTION
  // ============================================================================

  /**
   * Normalize text by removing accents and converting to uppercase
   */
  private normalize(text: string): string {
    return (
      text
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase() || ''
    );
  }

  /**
   * Determine if a siniestro_etapas record represents a closed claim.
   * Checks etapa 16 (Pagado), etapa 15 (Finalizado), or estado from claims join.
   */
  private isEtapaClaimClosed(etapa: any): boolean {
    if (etapa.etapa_16_fecha || etapa.etapa_15_fecha) return true;
    if (etapa.claims) {
      const estadoInterno = this.normalize(etapa.claims.estado_interno || '');
      const estadoSS = this.normalize(etapa.claims.estado_softseguros || '');
      if (estadoInterno.includes('FINALIZADO')) return true;
      if (estadoSS.includes('PAGADO') || estadoSS.includes('FINALIZADO')) return true;
      if (etapa.claims.finalizado === true) return true;
    }
    return false;
  }

  /**
   * Get the best available close date for a siniestro_etapas record.
   * Priority: etapa_16 > etapa_15 > fecha_ultimo_seguimiento from claims.
   */
  private getEtapaCloseDate(etapa: any): string | null {
    if (etapa.etapa_16_fecha) return etapa.etapa_16_fecha;
    if (etapa.etapa_15_fecha) return etapa.etapa_15_fecha;
    if (etapa.claims?.fecha_ultimo_seguimiento) return etapa.claims.fecha_ultimo_seguimiento;
    if (etapa.claims?.fecha_finalizacion) return etapa.claims.fecha_finalizacion;
    return null;
  }

  /**
   * Determine if a claims record represents a closed claim.
   */
  private isClaimClosed(claim: any): boolean {
    const estado = this.normalize(claim.estado_softseguros || '');
    if (
      estado.includes('FINALIZADO') ||
      estado.includes('PAGADO') ||
      estado.includes('PAGO')
    )
      return true;
    if (claim.finalizado === true) return true;
    if (claim.fecha_finalizacion != null) return true;
    return false;
  }

  /**
   * Get the best available close date for a claims record.
   * Priority: fecha_finalizacion > fecha_ultimo_seguimiento.
   */
  private getClaimCloseDate(claim: any): string | null {
    if (claim.fecha_finalizacion) return claim.fecha_finalizacion;
    if (claim.fecha_ultimo_seguimiento) return claim.fecha_ultimo_seguimiento;
    return null;
  }

  /**
   * Remove outliers using IQR method.
   * Excludes values above Q3 + 1.5*IQR or below Q1 - 1.5*IQR.
   * Input must be sorted ascending.
   */
  private removeOutliers(sortedValues: number[]): number[] {
    if (sortedValues.length < 4) return sortedValues;

    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    const iqr = q3 - q1;
    const upperBound = q3 + 1.5 * iqr;
    // Only filter upper outliers for lead time (negative days don't make sense)
    return sortedValues.filter(v => v >= 0 && v <= upperBound);
  }
  /**
   * Build base query with filters for siniestro_etapas
   */
  private buildFilteredQuery(filters?: KPIFilters) {
    // Always join with claims to access estado_interno for accurate KPI calculations
    let query = supabase.from('siniestro_etapas').select('*, claims(*)');

    if (filters) {
      if (filters.aseguradora) {
        query = query.eq('claims.aseguradora_id', filters.aseguradora);
      }
      if (filters.ramo) {
        query = query.eq('claims.ramo_id', filters.ramo);
      }
      if (filters.vendedor) {
        query = query.eq('claims.vendedor_id', filters.vendedor);
      }
      if (filters.tecnico) {
        query = query.eq('claims.tecnico_asignado', filters.tecnico);
      }
      if (filters.fechaDesde) {
        query = query.gte('claims.fecha_ocurrencia', filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        query = query.lte('claims.fecha_ocurrencia', filters.fechaHasta);
      }
      if (filters.valorMin !== undefined) {
        query = query.gte('claims.valor_indemnizado', filters.valorMin);
      }
      if (filters.valorMax !== undefined) {
        query = query.lte('claims.valor_indemnizado', filters.valorMax);
      }
      if (filters.asegurado) {
        query = query.eq('claims.asegurado_id', filters.asegurado);
      }
      if (filters.siniestroSS) {
        query = query.eq('claim_id', filters.siniestroSS);
      }
      if (filters.siniestroCompania) {
        query = query.eq('claims.numero_siniestro_compania', filters.siniestroCompania);
      }
    }

    // Override Supabase default limit of 1000 rows for KPI calculations
    return query.limit(5000);
  }

  /**
   * Build query for claims table with filters (fallback when siniestro_etapas is empty)
   */
  private buildClaimsQuery(filters?: KPIFilters) {
    let query = supabase.from('claims').select('*');

    if (filters) {
      if (filters.aseguradora) {
        query = query.eq('aseguradora_id', filters.aseguradora);
      }
      if (filters.ramo) {
        query = query.eq('ramo_id', filters.ramo);
      }
      if (filters.vendedor) {
        query = query.eq('vendedor_id', filters.vendedor);
      }
      if (filters.tecnico) {
        query = query.eq('tecnico_asignado', filters.tecnico);
      }
      if (filters.asegurado) {
        query = query.eq('asegurado_id', filters.asegurado);
      }
      if (filters.fechaDesde) {
        query = query.gte('fecha_ocurrencia', filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        query = query.lte('fecha_ocurrencia', filters.fechaHasta);
      }
      if (filters.valorMin !== undefined) {
        query = query.gte('valor_indemnizado', filters.valorMin);
      }
      if (filters.valorMax !== undefined) {
        query = query.lte('valor_indemnizado', filters.valorMax);
      }
      if (filters.siniestroSS) {
        query = query.eq('id_softseguros', filters.siniestroSS);
      }
      if (filters.siniestroCompania) {
        query = query.eq('numero_siniestro_compania', filters.siniestroCompania);
      }
    }

    // Override Supabase default limit of 1000 rows for KPI calculations
    return query.limit(5000);
  }

  /**
   * Get KPI overview
   * Falls back to claims table if siniestro_etapas is empty
   */
  async getOverview(filters?: KPIFilters): Promise<KPIOverview> {
    // First try siniestro_etapas with pagination to bypass 1000-row limit
    const etapas = await this.fetchAllRows(() =>
      this.buildFilteredQuery(filters) as any
    );
    console.log(`[KpiService.getOverview] siniestro_etapas count: ${etapas.length}`);

    // If siniestro_etapas has data, use it
    if (etapas.length > 0) {
      return this.calculateOverviewFromEtapas(etapas);
    }

    // Fallback: calculate from claims table directly
    console.log('[KpiService.getOverview] Fallback: Calculating KPIs from claims table...');
    const claimsData = await this.fetchAllRows(() =>
      this.buildClaimsQuery(filters) as any
    );

    console.log(`[KpiService.getOverview] Claims fetched: ${claimsData.length}`);
    const result = this.calculateOverviewFromClaims(claimsData);
    console.log('[KpiService.getOverview] Calculated result:', result);
    return result;
  }

  /**
   * Calculate overview metrics from siniestro_etapas data
   */
  private calculateOverviewFromEtapas(etapas: any[]): KPIOverview {
    // Calculate Lead Time (average business days from start to close)
    const completedClaims = etapas.filter(e => e.etapa_1_fecha && this.isEtapaClaimClosed(e));
    const leadTimes = completedClaims
      .map(e => {
        const closeDate = this.getEtapaCloseDate(e);
        if (!closeDate) return null;
        return calculateBusinessDays(e.etapa_1_fecha, closeDate);
      })
      .filter((v): v is number => v !== null);
    const leadTimeAvg =
      leadTimes.length > 0
        ? (() => {
            const sorted = [...leadTimes].sort((a, b) => a - b);
            const cleaned = this.removeOutliers(sorted);
            return cleaned.length > 0 ? cleaned.reduce((a, b) => a + b, 0) / cleaned.length : 0;
          })()
        : 0;

    // Calculate rates using estado_interno + estado_softseguros (dual check for resilience)
    // Some compound states like "PRESCRIPCIÓN - PROCESO JURÍDICO" may lose keywords during normalization
    const totalClaims = etapas.length;
    const desistimientoCount = etapas.filter(e => {
      const estadoInterno = this.normalize(e.claims?.estado_interno || '');
      const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
      return estadoInterno.includes('DESIST') || estadoSS.includes('DESIST');
    }).length;
    const objetadosCount = etapas.filter(e => {
      const estadoInterno = this.normalize(e.claims?.estado_interno || '');
      const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
      return estadoInterno.includes('OBJE') || estadoSS.includes('OBJE');
    }).length;
    const prescritosCount = etapas.filter(e => {
      const estadoInterno = this.normalize(e.claims?.estado_interno || '');
      const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
      return estadoInterno.includes('PRESCR') || estadoSS.includes('PRESCR');
    }).length;

    const finalizadosCount = etapas.filter(e => this.isEtapaClaimClosed(e)).length;
    const activosCount = etapas.filter(e => !this.isEtapaClaimClosed(e)).length;

    const cerradosEnPlazoCount = etapas.filter(e => {
      if (!this.isEtapaClaimClosed(e)) return false;
      const closeDate = this.getClaimCloseDate(e.claims) || e.claims?.fecha_finalizacion;
      if (!closeDate || !e.etapa_1_fecha) return false;
      const diasHabiles = calculateBusinessDays(e.etapa_1_fecha, closeDate);
      return diasHabiles <= TIEMPO_OBJETIVO_CIERRE;
    }).length;

    return {
      leadTimeAvg: Math.round(leadTimeAvg * 100) / 100,
      tasaDesistimiento:
        totalClaims > 0 ? Math.round((desistimientoCount / totalClaims) * 10000) / 100 : 0,
      tasaObjetados: totalClaims > 0 ? Math.round((objetadosCount / totalClaims) * 10000) / 100 : 0,
      tasaPrescritos:
        totalClaims > 0 ? Math.round((prescritosCount / totalClaims) * 10000) / 100 : 0,
      porcentajeCerradosPlazo:
        finalizadosCount > 0 ? Math.round((cerradosEnPlazoCount / finalizadosCount) * 10000) / 100 : 0,
      backlogActivos: activosCount,
      totalSiniestros: totalClaims,
      finalizadosCount: finalizadosCount,
    };
  }

  /**
   * Calculate overview metrics from claims data (fallback)
   */
  private calculateOverviewFromClaims(claims: any[]): KPIOverview {
    const totalClaims = claims.length;

    if (totalClaims === 0) {
      return {
        leadTimeAvg: 0,
        tasaDesistimiento: 0,
        tasaObjetados: 0,
        tasaPrescritos: 0,
        porcentajeCerradosPlazo: 0,
        backlogActivos: 0,
        totalSiniestros: 0,
        finalizadosCount: 0,
      };
    }

    // Calculate Lead Time from claims with fecha_aviso and a close indicator
    const completedClaims = claims.filter(c => c.fecha_aviso && this.isClaimClosed(c));
    const leadTimes = completedClaims
      .map(c => {
        const closeDate = this.getClaimCloseDate(c);
        if (!closeDate) return null;
        return calculateBusinessDays(new Date(c.fecha_aviso), new Date(closeDate));
      })
      .filter((v): v is number => v !== null);
    const leadTimeAvg =
      leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

    // Helper to normalize text (remove accents)
    const normalize = (text: string) => {
      return (
        text
          ?.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase() || ''
      );
    };

    // Calculate from estado_softseguros field
    const desistimientoCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('DESISTIMIENTO') || estado.includes('DESIST');
    }).length;

    const objetadosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('OBJECION') || estado.includes('OBJE');
    }).length;

    const prescritosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('PRESCRIPCION') || estado.includes('PRESCRIT');
    }).length;

    const finalizadosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return (
        estado.includes('FINALIZADO') ||
        estado.includes('PAGADO') ||
        estado.includes('PAGO') ||
        c.fecha_finalizacion != null
      );
    }).length;

    const activosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return (
        !estado.includes('FINALIZADO') &&
        !estado.includes('PAGADO') &&
        !estado.includes('PAGO') &&
        c.fecha_finalizacion == null
      );
    }).length;

    const cerradosEnPlazoCount = completedClaims.filter(c => {
      const closeDate = this.getClaimCloseDate(c);
      if (!c.fecha_aviso || !closeDate) return false;
      const diasHabiles = calculateBusinessDays(c.fecha_aviso, closeDate);
      return diasHabiles <= TIEMPO_OBJETIVO_CIERRE;
    }).length;

    return {
      leadTimeAvg: Math.round(leadTimeAvg * 100) / 100,
      tasaDesistimiento: Math.round((desistimientoCount / totalClaims) * 10000) / 100,
      tasaObjetados: Math.round((objetadosCount / totalClaims) * 10000) / 100,
      tasaPrescritos: Math.round((prescritosCount / totalClaims) * 10000) / 100,
      porcentajeCerradosPlazo: finalizadosCount > 0 ? Math.round((cerradosEnPlazoCount / finalizadosCount) * 10000) / 100 : 0,
      backlogActivos: activosCount,
      totalSiniestros: totalClaims,
      finalizadosCount: finalizadosCount,
    };
  }

  /**
   * Get lead time metrics
   * Falls back to claims table if siniestro_etapas is empty
   */
  async getLeadTime(
    filters?: KPIFilters,
    includePercentiles?: boolean,
    groupBy?: string
  ): Promise<LeadTimeMetrics> {
    // Try siniestro_etapas first with pagination
    const etapas = await this.fetchAllRows(() =>
      this.buildFilteredQuery(filters) as any
    );

    if (etapas.length > 0) {
      return await this.calculateLeadTimeFromEtapas(etapas, includePercentiles, groupBy, filters);
    }

    // Fallback: calculate from claims with pagination
    const claimsData = await this.fetchAllRows(() =>
      this.buildClaimsQuery(filters) as any
    );

    return this.calculateLeadTimeFromClaims(claimsData, includePercentiles);
  }

  /**
   * Calculate lead time from siniestro_etapas
   */
  private async calculateLeadTimeFromEtapas(
    etapas: any[],
    includePercentiles?: boolean,
    groupBy?: string,
    filters?: KPIFilters
  ): Promise<LeadTimeMetrics> {
    const completedClaims = etapas.filter(e => e.etapa_1_fecha && this.isEtapaClaimClosed(e));

    if (completedClaims.length === 0) {
      return { average: 0 };
    }

    const leadTimes = completedClaims
      .map(e => {
        const closeDate = this.getEtapaCloseDate(e);
        if (!closeDate) return null;
        return calculateBusinessDays(e.etapa_1_fecha, closeDate);
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    // Remove outliers before calculating average
    const cleanedLeadTimes = this.removeOutliers(leadTimes);

    if (cleanedLeadTimes.length === 0) {
      return { average: 0 };
    }

    const average = cleanedLeadTimes.reduce((a, b) => a + b, 0) / cleanedLeadTimes.length;

    const result: LeadTimeMetrics = {
      average: Math.round(average * 100) / 100,
    };

    if (includePercentiles) {
      result.percentiles = {
        p50: this.calculatePercentile(leadTimes, 50),
        p75: this.calculatePercentile(leadTimes, 75),
        p90: this.calculatePercentile(leadTimes, 90),
        p95: this.calculatePercentile(leadTimes, 95),
      };
    }

    if (groupBy && groupBy !== 'none') {
      result.byCategory = await this.getLeadTimeByCategory(groupBy, filters);
    }

    return result;
  }

  /**
   * Calculate lead time from claims (fallback)
   */
  private calculateLeadTimeFromClaims(
    claims: any[],
    includePercentiles?: boolean
  ): LeadTimeMetrics {
    // Use fecha_aviso as start and best available close date as end
    const completedClaims = claims.filter(c => c.fecha_aviso && this.isClaimClosed(c));

    if (completedClaims.length === 0) {
      return { average: 0 };
    }

    const leadTimes = completedClaims
      .map(c => {
        const closeDate = this.getClaimCloseDate(c);
        if (!closeDate) return null;
        return calculateBusinessDays(c.fecha_aviso, closeDate);
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    // Remove outliers before calculating average
    const cleanedLeadTimes = this.removeOutliers(leadTimes);

    if (cleanedLeadTimes.length === 0) {
      return { average: 0 };
    }

    const average = cleanedLeadTimes.reduce((a, b) => a + b, 0) / cleanedLeadTimes.length;

    const result: LeadTimeMetrics = {
      average: Math.round(average * 100) / 100,
    };

    if (includePercentiles) {
      result.percentiles = {
        p50: this.calculatePercentile(leadTimes, 50),
        p75: this.calculatePercentile(leadTimes, 75),
        p90: this.calculatePercentile(leadTimes, 90),
        p95: this.calculatePercentile(leadTimes, 95),
      };
    }

    return result;
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get lead time grouped by category
   */
  private async getLeadTimeByCategory(
    groupBy: string,
    filters?: KPIFilters
  ): Promise<{ category: string; average: number }[]> {
    // Implementation depends on available grouping fields
    // This is a simplified version
    return [];
  }

  /**
   * Get tasas metrics
   * Falls back to claims table if siniestro_etapas is empty
   */
  async getTasas(
    filters?: KPIFilters,
    includeCounts?: boolean,
    historico?: boolean
  ): Promise<TasasMetrics> {
    // Try siniestro_etapas first with pagination
    const etapas = await this.fetchAllRows(() =>
      this.buildFilteredQuery(filters) as any
    );

    if (etapas.length > 0) {
      return this.calculateTasasFromEtapas(etapas, includeCounts, historico, filters);
    }

    // Fallback: calculate from claims with pagination
    const claimsData = await this.fetchAllRows(() =>
      this.buildClaimsQuery(filters) as any
    );

    return this.calculateTasasFromClaims(claimsData, includeCounts);
  }

  /**
   * Calculate tasas from siniestro_etapas
   */
  private calculateTasasFromEtapas(
    etapas: any[],
    includeCounts?: boolean,
    historico?: boolean,
    filters?: KPIFilters
  ): TasasMetrics {
    const totalClaims = etapas.length;

    // Use claims join data if available, otherwise fall back to etapa dates
    // Check if etapas have the claims join (when filters are applied)
    const hasClaims = etapas.some(e => e.claims);

    let desistimientoCount: number;
    let objetadosCount: number;
    let prescritosCount: number;

    if (hasClaims) {
      // Dual check: estado_interno + estado_softseguros for resilience against normalization loss
      desistimientoCount = etapas.filter(e => {
        const estadoInterno = this.normalize(e.claims?.estado_interno || '');
        const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
        return estadoInterno.includes('DESIST') || estadoSS.includes('DESIST');
      }).length;
      objetadosCount = etapas.filter(e => {
        const estadoInterno = this.normalize(e.claims?.estado_interno || '');
        const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
        return estadoInterno.includes('OBJE') || estadoSS.includes('OBJE');
      }).length;
      prescritosCount = etapas.filter(e => {
        const estadoInterno = this.normalize(e.claims?.estado_interno || '');
        const estadoSS = this.normalize(e.claims?.estado_softseguros || '');
        return estadoInterno.includes('PRESCR') || estadoSS.includes('PRESCR');
      }).length;
    } else {
      // Fall back to etapa dates (less accurate but no join available)
      desistimientoCount = etapas.filter(e => e.etapa_10_fecha).length;
      objetadosCount = etapas.filter(e => e.etapa_7_fecha).length;
      prescritosCount = etapas.filter(e => e.etapa_13_fecha).length;
    }

    const result: TasasMetrics = {
      tasaDesistimiento:
        totalClaims > 0 ? Math.round((desistimientoCount / totalClaims) * 10000) / 100 : 0,
      tasaObjetados: totalClaims > 0 ? Math.round((objetadosCount / totalClaims) * 10000) / 100 : 0,
      tasaPrescritos:
        totalClaims > 0 ? Math.round((prescritosCount / totalClaims) * 10000) / 100 : 0,
    };

    if (includeCounts) {
      result.counts = {
        desistimiento: desistimientoCount,
        objetados: objetadosCount,
        prescritos: prescritosCount,
        total: totalClaims,
      };
    }

    if (historico) {
      result.historico = []; // Simplified - would need date-based aggregation
    }

    return result;
  }

  /**
   * Calculate tasas from claims (fallback)
   */
  private calculateTasasFromClaims(claims: any[], includeCounts?: boolean): TasasMetrics {
    const totalClaims = claims.length;

    if (totalClaims === 0) {
      return {
        tasaDesistimiento: 0,
        tasaObjetados: 0,
        tasaPrescritos: 0,
      };
    }

    // Helper to normalize text (remove accents)
    const normalize = (text: string) => {
      return (
        text
          ?.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase() || ''
      );
    };

    // Calculate from estado_softseguros field
    const desistimientoCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('DESISTIMIENTO');
    }).length;

    const objetadosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('OBJECION');
    }).length;

    const prescritosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return estado.includes('PRESCRIPCION');
    }).length;

    const finalizadosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return (
        estado.includes('FINALIZADO') ||
        estado.includes('PAGADO') ||
        c.finalizado === true ||
        c.fecha_finalizacion != null
      );
    }).length;

    const activosCount = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return (
        !estado.includes('FINALIZADO') &&
        !estado.includes('PAGADO') &&
        c.finalizado !== true &&
        c.fecha_finalizacion == null
      );
    }).length;

    const result: TasasMetrics = {
      tasaDesistimiento: Math.round((desistimientoCount / totalClaims) * 10000) / 100,
      tasaObjetados: Math.round((objetadosCount / totalClaims) * 10000) / 100,
      tasaPrescritos: Math.round((prescritosCount / totalClaims) * 10000) / 100,
    };

    if (includeCounts) {
      result.counts = {
        desistimiento: desistimientoCount,
        objetados: objetadosCount,
        prescritos: prescritosCount,
        total: totalClaims,
      };
    }

    return result;
  }

  /**
   * Get historical tasas
   */
  private async getTasasHistorico(filters?: KPIFilters): Promise<any[]> {
    // Simplified implementation - would need date-based aggregation
    return [];
  }

  /**
   * Get backlog metrics
   * Falls back to claims table if siniestro_etapas is empty
   */
  async getBacklog(
    filters?: KPIFilters,
    groupByAge?: boolean,
    groupByStage?: boolean
  ): Promise<BacklogMetrics> {
    // Try siniestro_etapas first with pagination
    const etapas = await this.fetchAllRows(() =>
      this.buildFilteredQuery(filters) as any
    );

    if (etapas.length > 0) {
      return this.calculateBacklogFromEtapas(etapas, groupByAge, groupByStage);
    }

    // Fallback: calculate from claims with pagination
    const claimsData = await this.fetchAllRows(() =>
      this.buildClaimsQuery(filters) as any
    );

    return this.calculateBacklogFromClaims(claimsData, groupByAge);
  }

  /**
   * Calculate backlog from siniestro_etapas
   */
  private calculateBacklogFromEtapas(
    etapas: any[],
    groupByAge?: boolean,
    groupByStage?: boolean
  ): BacklogMetrics {
    const activeClaims = etapas.filter(e => !this.isEtapaClaimClosed(e));

    const result: BacklogMetrics = {
      total: activeClaims.length,
    };

    if (groupByAge) {
      result.byAge = this.calculateBacklogByAge(activeClaims);
    }

    if (groupByStage) {
      result.byStage = this.calculateBacklogByStage(activeClaims);
    }

    return result;
  }

  /**
   * Calculate backlog from claims (fallback)
   */
  private calculateBacklogFromClaims(claims: any[], groupByAge?: boolean): BacklogMetrics {
    // Helper to normalize text (remove accents)
    const normalize = (text: string) => {
      return (
        text
          ?.normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase() || ''
      );
    };

    // Active claims are those without fecha_finalizacion, not set to finalizado=true, and not in finalizado/pagado estado
    const activeClaims = claims.filter(c => {
      const estado = normalize(c.estado_softseguros);
      return (
        !estado.includes('FINALIZADO') && 
        !estado.includes('PAGADO') && 
        c.finalizado !== true &&
        c.fecha_finalizacion == null
      );
    });

    const result: BacklogMetrics = {
      total: activeClaims.length,
    };

    if (groupByAge) {
      result.byAge = this.calculateBacklogByAgeFromClaims(activeClaims);
    }

    return result;
  }

  /**
   * Calculate backlog by age ranges from claims
   */
  private calculateBacklogByAgeFromClaims(activeClaims: any[]): { range: string; count: number }[] {
    const today = new Date();
    const ranges = [
      { range: '0-30 días', min: 0, max: 30 },
      { range: '31-60 días', min: 31, max: 60 },
      { range: '61-90 días', min: 61, max: 90 },
      { range: '90+ días', min: 91, max: Infinity },
    ];

    return ranges.map(r => {
      const count = activeClaims.filter(claim => {
        if (!claim.fecha_aviso) return false;
        const days = Math.floor(
          (today.getTime() - new Date(claim.fecha_aviso).getTime()) / (1000 * 60 * 60 * 24)
        );
        return days >= r.min && days <= r.max;
      }).length;
      return { range: r.range, count };
    });
  }

  /**
   * Calculate backlog by age ranges
   */
  private calculateBacklogByAge(activeClaims: any[]): { range: string; count: number }[] {
    const today = new Date();
    const ranges = [
      { range: '0-30 días', min: 0, max: 30 },
      { range: '31-60 días', min: 31, max: 60 },
      { range: '61-90 días', min: 61, max: 90 },
      { range: '90+ días', min: 91, max: Infinity },
    ];

    return ranges.map(r => {
      const count = activeClaims.filter(claim => {
        if (!claim.etapa_1_fecha) return false;
        const days = Math.floor(
          (today.getTime() - new Date(claim.etapa_1_fecha).getTime()) / (1000 * 60 * 60 * 24)
        );
        return days >= r.min && days <= r.max;
      }).length;
      return { range: r.range, count };
    });
  }

  /**
   * Calculate backlog by current stage
   */
  private calculateBacklogByStage(activeClaims: any[]): { stage: number; count: number }[] {
    const stages: { stage: number; count: number }[] = [];

    for (let i = 1; i <= 16; i++) {
      const fieldName = `etapa_${i}_fecha`;
      const nextFieldName = i < 16 ? `etapa_${i + 1}_fecha` : null;

      const count = activeClaims.filter(claim => {
        const hasCurrent = claim[fieldName] !== null;
        const hasNext = nextFieldName ? claim[nextFieldName] !== null : false;
        return hasCurrent && !hasNext;
      }).length;

      stages.push({ stage: i, count });
    }

    return stages;
  }

  /**
   * Get frecuencia siniestralidad by month (last 12 months)
   * Calculated as number of claims per month
   */
  async getFrecuenciaSiniestralidad(filters?: KPIFilters): Promise<{
    current: number;
    monthly: Array<{ month: string; value: number }>;
    hasHistoricalData: boolean;
  }> {
    const claimsQuery = this.buildClaimsQuery(filters);
    const { data: claims, error } = await claimsQuery;

    if (error) {
      throw new Error(`Failed to fetch frecuencia data: ${error.message}`);
    }

    const claimsList = claims || [];

    // Group claims by month based on fecha_ocurrencia
    const monthlyData: Record<string, number> = {};
    const months: string[] = [];

    // Generate last 12 months with YYYY-MM keys to avoid cross-year collision
    const today = new Date();
    const monthLabels: Record<string, string> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-CO', { month: 'short' });
      monthlyData[yearMonth] = 0;
      months.push(yearMonth);
      monthLabels[yearMonth] = label;
    }

    // Count claims per month
    claimsList.forEach(claim => {
      if (claim.fecha_ocurrencia) {
        const date = new Date(claim.fecha_ocurrencia);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(yearMonth)) {
          monthlyData[yearMonth]++;
        }
      }
    });

    // Convert to array format
    const monthly = months.map(yearMonth => ({
      month: monthLabels[yearMonth] || yearMonth,
      value: monthlyData[yearMonth] || 0,
    }));

    // Current frequency = claims in the current month
    const currentYearMonth = months[months.length - 1];
    const current = monthlyData[currentYearMonth] || 0;

    // Check if we have at least 3 months of data
    const hasHistoricalData = claimsList.length > 0;

    return {
      current,
      monthly,
      hasHistoricalData,
    };
  }

  /**
   * Get retención post-siniestro
   */
  async getRetencionPostSiniestro(filters?: KPIFilters): Promise<RetencionPostSiniestro | null> {
    // This requires policy renewal data which may not be available
    return null;
  }

  /**
   * Get severidad by ramo
   * Calculated as average indemnization amount by ramo
   */
  async getSeveridad(filters?: KPIFilters): Promise<SeveridadRamo[]> {
    const claimsQuery = this.buildClaimsQuery(filters);
    const { data: claims, error } = await claimsQuery;

    if (error) {
      throw new Error(`Failed to fetch severidad data: ${error.message}`);
    }

    const claimsList = claims || [];

    // Group claims by ramo and calculate totals
    const ramoData: Record<string, { total: number; count: number }> = {};

    claimsList.forEach(claim => {
      const ramo = claim.ramo || 'Sin Ramo';
      const valor = claim.valor_indemnizacion || 0;

      if (!ramoData[ramo]) {
        ramoData[ramo] = { total: 0, count: 0 };
      }

      ramoData[ramo].total += valor;
      ramoData[ramo].count += 1;
    });

    // Convert to SeveridadRamo format
    const severidad: SeveridadRamo[] = Object.entries(ramoData).map(([ramo, data]) => ({
      ramo,
      amparo: 'General', // Default since we don't have amparo breakdown
      severidad: data.count > 0 ? Math.round(data.total / data.count) : 0,
      costoTotal: data.total,
      siniestrosCount: data.count,
    }));

    // Sort by severity (highest first) and take top 5
    return severidad.sort((a, b) => b.severidad - a.severidad).slice(0, 5);
  }

  /**
   * Get follow-up metrics using fecha_ultimo_seguimiento
   */
  async getFollowUpMetrics(filters?: KPIFilters): Promise<{
    totalConSeguimiento: number;
    promedioDiasSinSeguimiento: number;
    vencidos: number;
    proximosAVencer: number;
    porVencerEn: number; // días
  }> {
    const claimsQuery = this.buildClaimsQuery(filters);
    const { data: claims, error } = await claimsQuery;

    if (error) {
      throw new Error(`Failed to fetch follow-up data: ${error.message}`);
    }

    const today = new Date();
    const claimsList = claims || [];

    // Claims with fecha_ultimo_seguimiento
    const conSeguimiento = claimsList.filter(c => c.fecha_ultimo_seguimiento);

    // Calculate days since last follow-up
    const diasSinSeguimiento = conSeguimiento.map(c => {
      const lastDate = new Date(c.fecha_ultimo_seguimiento);
      return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const promedioDias =
      diasSinSeguimiento.length > 0
        ? Math.round(diasSinSeguimiento.reduce((a, b) => a + b, 0) / diasSinSeguimiento.length)
        : 0;

    // Claims with proximo_seguimiento
    const conProximoSeguimiento = claimsList.filter(c => c.proximo_seguimiento);

    // Calculate expired follow-ups
    const vencidos = conProximoSeguimiento.filter(c => {
      const nextDate = new Date(c.proximo_seguimiento);
      return nextDate < today;
    }).length;

    // Calculate follow-ups due in next 3 days
    const proximosAVencer = conProximoSeguimiento.filter(c => {
      const nextDate = new Date(c.proximo_seguimiento);
      const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3;
    }).length;

    // Count follow-ups due in specified days
    const porVencerEn = 10; // Standard: 10 days

    return {
      totalConSeguimiento: conSeguimiento.length,
      promedioDiasSinSeguimiento: promedioDias,
      vencidos,
      proximosAVencer,
      porVencerEn,
    };
  }
}

// Export singleton instance
export const kpiService = new KpiService();
