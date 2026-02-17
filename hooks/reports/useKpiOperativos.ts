import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ReportFilters } from '../../types/reports';
import { TIEMPO_OBJETIVO_CIERRE } from '../../constants/reports';

interface KpiOperativos {
  totalSiniestrosActivos: number;
  totalSiniestrosCerrados: number;
  porcentajeCerradosEnPlazo: number;
  tiempoPromedioTotal: number; // days
  porcentajeConObjecion: number;
}

export function useKpiOperativos(
  claims: Claim[],
  filters: ReportFilters
): KpiOperativos {
  return useMemo(() => {
    // Apply filters
    const filteredClaims = claims.filter((claim) => {
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado)) return false;
      
      if (filters.dateRange) {
        const claimDate = claim.fecha_aviso ? new Date(claim.fecha_aviso) : null;
        if (claimDate) {
          if (claimDate < filters.dateRange.start || claimDate > filters.dateRange.end) {
            return false;
          }
        }
      }
      
      return true;
    });

    const totalSiniestrosActivos = filteredClaims.filter((c) => !c.finalizado).length;
    const siniestrosCerrados = filteredClaims.filter((c) => c.finalizado);
    const totalSiniestrosCerrados = siniestrosCerrados.length;

    // Calculate % closed within target time
    const cerradosEnPlazo = siniestrosCerrados.filter((c) => {
      if (!c.fecha_aviso || !c.fecha_finalizacion) return false;
      const aviso = new Date(c.fecha_aviso);
      const cierre = new Date(c.fecha_finalizacion);
      const dias = Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
      return dias <= TIEMPO_OBJETIVO_CIERRE;
    });
    
    const porcentajeCerradosEnPlazo = totalSiniestrosCerrados > 0
      ? (cerradosEnPlazo.length / totalSiniestrosCerrados) * 100
      : 0;

    // Calculate average time Aviso → Pago
    const tiemposCierre = siniestrosCerrados
      .filter((c) => c.fecha_aviso && c.fecha_finalizacion)
      .map((c) => {
        const aviso = new Date(c.fecha_aviso!);
        const cierre = new Date(c.fecha_finalizacion!);
        return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const tiempoPromedioTotal = tiemposCierre.length > 0
      ? tiemposCierre.reduce((sum, t) => sum + t, 0) / tiemposCierre.length
      : 0;

    // Calculate % with objection
    const conObjecion = filteredClaims.filter((c) => c.estado_interno === 'OBJECIÓN').length;
    const porcentajeConObjecion = filteredClaims.length > 0
      ? (conObjecion / filteredClaims.length) * 100
      : 0;

    return {
      totalSiniestrosActivos,
      totalSiniestrosCerrados,
      porcentajeCerradosEnPlazo,
      tiempoPromedioTotal,
      porcentajeConObjecion,
    };
  }, [claims, filters]);
}
