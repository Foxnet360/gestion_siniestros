import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { ProductividadTecnico, ReportFilters } from '../../types/reports';
import { DIAS_ESTANCADO_DEFAULT } from '../../constants/reports';

export function useProductividadTecnico(
  claims: Claim[],
  filters: ReportFilters
): ProductividadTecnico[] {
  return useMemo(() => {
    // Group claims by tecnico
    const tecnicoMap = new Map<string, Claim[]>();

    claims.forEach((claim) => {
      // Apply filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return;
      if (filters.dateRange && claim.fecha_aviso) {
        const claimDate = new Date(claim.fecha_aviso);
        if (claimDate < filters.dateRange.start || claimDate > filters.dateRange.end) {
          return;
        }
      }

      const existing = tecnicoMap.get(claim.tecnico_asignado) || [];
      existing.push(claim);
      tecnicoMap.set(claim.tecnico_asignado, existing);
    });

    // Calculate metrics for each tecnico
    return Array.from(tecnicoMap.entries()).map(([tecnico, tecnicoClaims]) => {
      const casosActivos = tecnicoClaims.filter((c) => !c.finalizado).length;
      const casosCerrados = tecnicoClaims.filter((c) => c.finalizado);

      // Calculate average close time
      const tiemposCierre = casosCerrados
        .filter((c) => c.fecha_aviso && c.fecha_finalizacion)
        .map((c) => {
          const aviso = new Date(c.fecha_aviso!);
          const cierre = new Date(c.fecha_finalizacion!);
          return Math.floor((cierre.getTime() - aviso.getTime()) / (1000 * 60 * 60 * 24));
        });

      const tiempoPromedioCierre = tiemposCierre.length > 0
        ? tiemposCierre.reduce((a, b) => a + b, 0) / tiemposCierre.length
        : 0;

      // Calculate recovery percentage
      const totalReclamado = tecnicoClaims.reduce((sum, c) => sum + (c.monto_reclamo || 0), 0);
      const totalIndemnizado = casosCerrados.reduce((sum, c) => sum + (c.valor_indemnizacion || 0), 0);
      const porcentajeRecuperacion = totalReclamado > 0
        ? (totalIndemnizado / totalReclamado) * 100
        : 0;

      // Count stagnant cases
      const now = new Date();
      const casosEstancados = tecnicoClaims.filter((c) => {
        if (!c.lastStateChangeDate || c.finalizado) return false;
        const days = Math.floor((now.getTime() - new Date(c.lastStateChangeDate).getTime()) / (1000 * 60 * 60 * 24));
        return days > DIAS_ESTANCADO_DEFAULT;
      }).length;

      return {
        tecnico,
        casosActivos,
        casosCerrados: casosCerrados.length,
        tiempoPromedioCierre,
        porcentajeRecuperacion,
        casosEstancados,
      };
    }).sort((a, b) => b.casosCerrados - a.casosCerrados); // Sort by productivity
  }, [claims, filters]);
}
