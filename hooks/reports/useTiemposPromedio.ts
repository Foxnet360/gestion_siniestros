import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ReportFilters } from '../../types/reports';

interface TiemposPorDimension {
  general: number;
  porAseguradora: { aseguradora: string; tiempo: number; count: number }[];
  porRamo: { ramo: string; tiempo: number; count: number }[];
  porTecnico: { tecnico: string; tiempo: number; count: number }[];
}

export function useTiemposPromedio(
  claims: Claim[],
  filters: ReportFilters
): TiemposPorDimension {
  return useMemo(() => {
    // Filter finalized claims with dates
    const finalizedClaims = claims.filter((claim) => {
      if (!claim.finalizado || !claim.fecha_aviso || !claim.fecha_finalizacion) return false;
      
      // Apply additional filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado)) return false;
      
      return true;
    });

    // Calculate time for each claim
    const calcularTiempo = (c: Claim): number => {
      const aviso = new Date(c.fecha_aviso!);
      const cierre = new Date(c.fecha_finalizacion!);
      return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
    };

    // General average
    const tiemposGenerales = finalizedClaims.map(calcularTiempo);
    const general = tiemposGenerales.length > 0
      ? tiemposGenerales.reduce((a, b) => a + b, 0) / tiemposGenerales.length
      : 0;

    // Group by aseguradora
    const aseguradoraMap = new Map<string, number[]>();
    finalizedClaims.forEach((c) => {
      const tiempo = calcularTiempo(c);
      const existing = aseguradoraMap.get(c.aseguradora) || [];
      existing.push(tiempo);
      aseguradoraMap.set(c.aseguradora, existing);
    });
    const porAseguradora = Array.from(aseguradoraMap.entries())
      .map(([aseguradora, tiempos]) => ({
        aseguradora,
        tiempo: tiempos.reduce((a, b) => a + b, 0) / tiempos.length,
        count: tiempos.length,
      }))
      .sort((a, b) => b.tiempo - a.tiempo);

    // Group by ramo
    const ramoMap = new Map<string, number[]>();
    finalizedClaims.forEach((c) => {
      const tiempo = calcularTiempo(c);
      const existing = ramoMap.get(c.ramo) || [];
      existing.push(tiempo);
      ramoMap.set(c.ramo, existing);
    });
    const porRamo = Array.from(ramoMap.entries())
      .map(([ramo, tiempos]) => ({
        ramo,
        tiempo: tiempos.reduce((a, b) => a + b, 0) / tiempos.length,
        count: tiempos.length,
      }))
      .sort((a, b) => b.tiempo - a.tiempo);

    // Group by tecnico
    const tecnicoMap = new Map<string, number[]>();
    finalizedClaims.forEach((c) => {
      const tiempo = calcularTiempo(c);
      const existing = tecnicoMap.get(c.tecnico_asignado) || [];
      existing.push(tiempo);
      tecnicoMap.set(c.tecnico_asignado, existing);
    });
    const porTecnico = Array.from(tecnicoMap.entries())
      .map(([tecnico, tiempos]) => ({
        tecnico,
        tiempo: tiempos.reduce((a, b) => a + b, 0) / tiempos.length,
        count: tiempos.length,
      }))
      .sort((a, b) => b.tiempo - a.tiempo);

    return {
      general,
      porAseguradora,
      porRamo,
      porTecnico,
    };
  }, [claims, filters]);
}
