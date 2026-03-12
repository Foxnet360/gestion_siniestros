import { useState, useEffect, useCallback } from 'react';
import { eficienciaEtapasService } from '../services/EficienciaEtapasService';
import type { 
  FiltrosEficienciaEtapas, 
  MetricasEficienciaResponse, 
  MetricaEtapaResponse,
  CuelloDeBotellaResponse,
  FunnelResponse, 
  FunnelEtapaData,
  CalidadDatosResponse 
} from '../services/EficienciaEtapasService';

// Re-export types for backward compatibility if needed
export type FiltrosEficiencia = FiltrosEficienciaEtapas;
export type EficienciaData = MetricasEficienciaResponse;
export type MetricaEtapa = MetricaEtapaResponse;
export type CuelloDeBotella = CuelloDeBotellaResponse;
export type FunnelData = FunnelResponse;
export type FunnelEtapa = FunnelEtapaData;
export type CalidadDatos = CalidadDatosResponse;
export type ResumenEficiencia = EficienciaData['resumen'];

interface UseEficienciaEtapasReturn {
  data: EficienciaData | null;
  funnel: FunnelData | null;
  calidad: CalidadDatos | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEficienciaEtapas(
  filtros: FiltrosEficiencia = {},
  incluirSegmentacion: boolean = false
): UseEficienciaEtapasReturn {
  const [data, setData] = useState<EficienciaData | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [calidad, setCalidad] = useState<CalidadDatos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Usar el servicio directamente en lugar de fetch
      const [mainData, funnelData, calidadData] = await Promise.all([
        eficienciaEtapasService.getEficienciaEtapas(filtros, incluirSegmentacion),
        eficienciaEtapasService.getFunnelEtapas(filtros),
        eficienciaEtapasService.getCalidadDatos(filtros)
      ]);

      setData(mainData);
      setFunnel(funnelData);
      setCalidad(calidadData);
    } catch (err) {
      console.error('Error fetching eficiencia etapas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filtros, incluirSegmentacion]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    funnel,
    calidad,
    loading,
    error,
    refetch: fetchData,
  };
}
