import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ReportFilters } from '../../types/reports';

interface KpiFinancieros {
  totalReclamado: number;
  totalIndemnizado: number;
  porcentajeRecuperacion: number;
  valorPromedioSiniestro: number;
  montoRiesgoPrescripcion: number;
}

export function useKpiFinancieros(
  claims: Claim[],
  filters: ReportFilters
): KpiFinancieros {
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

    const totalReclamado = filteredClaims.reduce((sum, c) => sum + (c.monto_reclamo || 0), 0);
    
    const finalizedClaims = filteredClaims.filter((c) => c.finalizado);
    const totalIndemnizado = finalizedClaims.reduce((sum, c) => sum + (c.valor_indemnizacion || 0), 0);
    
    const porcentajeRecuperacion = totalReclamado > 0 
      ? (totalIndemnizado / totalReclamado) * 100 
      : 0;
    
    const valorPromedioSiniestro = filteredClaims.length > 0 
      ? totalReclamado / filteredClaims.length 
      : 0;

    // Calculate prescription risk amount (high risk only: < 30 days)
    const now = new Date();
    const montoRiesgoPrescripcion = filteredClaims
      .filter((claim) => {
        if (!claim.prescripcion_ordinaria) return false;
        const prescripcionDate = new Date(claim.prescripcion_ordinaria);
        const diasRestantes = Math.floor((prescripcionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes < 30 && diasRestantes > 0;
      })
      .reduce((sum, c) => sum + (c.monto_reclamo || 0), 0);

    return {
      totalReclamado,
      totalIndemnizado,
      porcentajeRecuperacion,
      valorPromedioSiniestro,
      montoRiesgoPrescripcion,
    };
  }, [claims, filters]);
}
