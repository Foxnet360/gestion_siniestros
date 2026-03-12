import { useState, useEffect, useCallback } from 'react';
import {
  metricasSimplesService,
  MetricaBasica,
  ResumenPorEstado,
} from '../services/MetricasSimplesService';

export interface FiltrosEficienciaSimple {
  fechaDesde?: string;
  fechaHasta?: string;
  aseguradoraId?: string;
  ramoId?: string;
}

export interface EficienciaSimpleData {
  total: number;
  finalizados: number;
  activos: number;
  leadTimePromedio: number;
  porEstado: ResumenPorEstado[];
  detalles: MetricaBasica[];
}

interface UseEficienciaSimpleReturn {
  data: EficienciaSimpleData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEficienciaSimple(
  filtros: FiltrosEficienciaSimple = {}
): UseEficienciaSimpleReturn {
  const [data, setData] = useState<EficienciaSimpleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await metricasSimplesService.obtenerMetricasBasicas(filtros);
      setData(result);
    } catch (err) {
      console.error('Error cargando eficiencia simple:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
