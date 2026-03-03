import { useState, useEffect, useCallback } from 'react';
import {
  getProfitabilityByAseguradora,
  getMonthlyTrends,
  getResolutionTimes,
  getForecasts,
  getComparativeData,
  getMainKPIs,
  ProfitabilityMetrics,
  TrendData,
  ResolutionTimeMetrics,
  ForecastData,
  ComparativeData,
} from '../services/managerDashboardService';

interface UseManagerDashboardReturn {
  // KPIs
  kpis: {
    reclamadoMes: number;
    indemnizadoMes: number;
    casosActivos: number;
    variacionMes: number;
  } | null;

  // Datos
  profitability: ProfitabilityMetrics[];
  trends: TrendData[];
  resolutionTimes: ResolutionTimeMetrics[];
  forecasts: ForecastData[];
  comparative: ComparativeData[];

  // Estado
  isLoading: boolean;
  error: string | null;

  // Acciones
  refreshData: () => Promise<void>;
}

export const useManagerDashboard = (): UseManagerDashboardReturn => {
  const [kpis, setKpis] = useState<UseManagerDashboardReturn['kpis']>(null);
  const [profitability, setProfitability] = useState<ProfitabilityMetrics[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [resolutionTimes, setResolutionTimes] = useState<ResolutionTimeMetrics[]>([]);
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [comparative, setComparative] = useState<ComparativeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        kpisData,
        profitabilityData,
        trendsData,
        resolutionTimesData,
        forecastsData,
        comparativeData,
      ] = await Promise.all([
        getMainKPIs(),
        getProfitabilityByAseguradora(),
        getMonthlyTrends(),
        getResolutionTimes(),
        getForecasts(),
        getComparativeData(),
      ]);

      setKpis(kpisData);
      setProfitability(profitabilityData);
      setTrends(trendsData);
      setResolutionTimes(resolutionTimesData);
      setForecasts(forecastsData);
      setComparative(comparativeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    kpis,
    profitability,
    trends,
    resolutionTimes,
    forecasts,
    comparative,
    isLoading,
    error,
    refreshData: fetchAllData,
  };
};

export default useManagerDashboard;
