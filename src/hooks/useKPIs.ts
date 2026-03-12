import { useState, useEffect, useCallback } from 'react';
import { kpiService } from '../services/KpiService';
import type {
  KPIOverview,
  LeadTimeMetrics,
  TasasMetrics,
  BacklogMetrics,
  FrecuenciaSiniestralidad,
  SeveridadRamo,
  KPIFilters,
} from '../types/sla-kpi';

interface FollowUpMetrics {
  totalConSeguimiento: number;
  promedioDiasSinSeguimiento: number;
  vencidos: number;
  proximosAVencer: number;
  porVencerEn: number;
}

interface UseKPIsReturn {
  overview: KPIOverview | null;
  leadTime: LeadTimeMetrics | null;
  tasas: TasasMetrics | null;
  backlog: BacklogMetrics | null;
  followUpMetrics: FollowUpMetrics | null;
  frecuencia: FrecuenciaSiniestralidad | null;
  severidad: SeveridadRamo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch all KPI overview data
 * Calls KpiService directly (no API server needed)
 */
export function useKPIs(filters?: KPIFilters): UseKPIsReturn {
  const [overview, setOverview] = useState<KPIOverview | null>(null);
  const [leadTime, setLeadTime] = useState<LeadTimeMetrics | null>(null);
  const [tasas, setTasas] = useState<TasasMetrics | null>(null);
  const [backlog, setBacklog] = useState<BacklogMetrics | null>(null);
  const [followUpMetrics, setFollowUpMetrics] = useState<FollowUpMetrics | null>(null);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaSiniestralidad | null>(null);
  const [severidad, setSeveridad] = useState<SeveridadRamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useKPIs] Fetching KPI data...');

      // Fetch all KPI data in parallel directly from KpiService
      const [
        overviewData,
        leadTimeData,
        tasasData,
        backlogData,
        followUpData,
        frecuenciaData,
        severidadData,
      ] = await Promise.all([
        kpiService.getOverview(filters),
        kpiService.getLeadTime(filters, true), // include percentiles
        kpiService.getTasas(filters, true), // include counts
        kpiService.getBacklog(filters, true, true), // include age + stage grouping
        kpiService.getFollowUpMetrics(filters),
        kpiService.getFrecuenciaSiniestralidad(filters),
        kpiService.getSeveridad(filters),
      ]);

      console.log('[useKPIs] Data fetched:', {
        overview: overviewData,
        leadTime: leadTimeData,
        tasas: tasasData,
        backlog: backlogData,
        followUpMetrics: followUpData,
        frecuencia: frecuenciaData,
        severidad: severidadData,
      });

      setOverview(overviewData);
      setLeadTime(leadTimeData);
      setTasas(tasasData);
      setBacklog(backlogData);
      setFollowUpMetrics(followUpData);
      setFrecuencia(frecuenciaData);
      setSeveridad(severidadData);
    } catch (err) {
      console.error('[useKPIs] Error fetching data:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    overview,
    leadTime,
    tasas,
    backlog,
    followUpMetrics,
    frecuencia,
    severidad,
    loading,
    error,
    refetch: fetchData,
  };
}
