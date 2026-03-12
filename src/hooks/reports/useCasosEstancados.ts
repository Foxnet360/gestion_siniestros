import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { CasoEstancado, ReportFilters } from '../../types/reports';
import { DIAS_ESTANCADO_DEFAULT } from '../../constants/reports';

export function useCasosEstancados(
  claims: Claim[],
  filters: ReportFilters,
  diasUmbral: number = DIAS_ESTANCADO_DEFAULT
): CasoEstancado[] {
  return useMemo(() => {
    const now = new Date();

    return claims
      .filter((claim) => {
        // Only active claims
        if (claim.finalizado) return false;

        // Must have last state change date
        if (!claim.lastStateChangeDate) return false;

        // Check days without movement
        const lastChange = new Date(claim.lastStateChangeDate);
        const diasSinMovimiento = Math.floor(
          (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasSinMovimiento < diasUmbral) return false;

        // Apply additional filters
        if (filters.ramo.length > 0 && !filters.ramo.includes(claim.ramo)) return false;
        if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(claim.aseguradora)) return false;
        if (filters.tecnico.length > 0 && !filters.tecnico.includes(claim.tecnico_asignado)) return false;

        return true;
      })
      .map((claim) => {
        const diasSinMovimiento = Math.floor(
          (now.getTime() - new Date(claim.lastStateChangeDate!).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          claim,
          diasSinMovimiento,
        };
      })
      .sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento); // Most stagnant first
  }, [claims, filters, diasUmbral]);
}
