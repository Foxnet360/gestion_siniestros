import { useMemo } from 'react';
import type { Claim } from '../types';
import { getPrescriptionRisk } from '../utils/claimUtils';

/**
 * Hook para obtener claims con riesgo de prescripción
 * @param claims - Lista de reclamos
 * @returns Array de claims filtrados con riesgo
 */
export const usePrescriptionRisks = (claims: Claim[]) => {
  return useMemo(() => {
    return claims.filter(c => {
      const risk = getPrescriptionRisk(c);
      return risk.level !== 'none' && risk.daysToOrdinary !== null && risk.daysToOrdinary > 0;
    });
  }, [claims]);
};

/**
 * Hook para calcular estadísticas de prescripción
 * @param claims - Lista de reclamos
 * @returns Estadísticas agregadas
 */
export const usePrescriptionStats = (claims: Claim[]) => {
  return useMemo(() => {
    const risks = claims.map(getPrescriptionRisk);

    return {
      totalAtRisk: risks.filter(r => r.level !== 'none').length,
      highRisk: risks.filter(r => r.level === 'high').length,
      mediumRisk: risks.filter(r => r.level === 'medium').length,
      lowRisk: risks.filter(r => r.level === 'low').length,
      averageDaysToOrdinary: risks
        .filter(r => r.daysToOrdinary !== null)
        .reduce((acc, r) => acc + (r.daysToOrdinary || 0), 0) / risks.length || 0,
    };
  }, [claims]);
};
