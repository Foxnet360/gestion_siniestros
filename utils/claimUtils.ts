import type { Claim } from '../types';

/**
 * Umbral de días para considerar un caso como "quieto" (stagnant)
 * Casos que llevan más de este tiempo sin cambio requieren atención
 */
export const STAGNANT_THRESHOLD_DAYS = 30;

/**
 * Estados finales que no deben considerarse para alertas de casos quietos
 */
export const FINAL_STATES = ['PAGADO', 'FINALIZADO'] as const;

/**
 * Calcula los días transcurridos desde el último cambio de estado
 * @param claim - El reclamo a evaluar
 * @returns Número de días desde el último cambio
 */
export const getDaysSinceLastChange = (claim: Claim): number => {
  const lastChange = claim.lastStateChangeDate
    ? new Date(claim.lastStateChangeDate)
    : new Date(claim.updatedAt);
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastChange.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si un reclamo está en estado final (PAGADO o FINALIZADO)
 * @param claim - El reclamo a evaluar
 * @returns true si está en estado final
 */
export const isInFinalState = (claim: Claim): boolean => {
  return FINAL_STATES.includes(claim.estado_interno as typeof FINAL_STATES[number]);
};

/**
 * Verifica si un reclamo está "quieto" (sin cambios por más del umbral)
 * @param claim - El reclamo a evaluar
 * @param threshold - Días de umbral (default: 30)
 * @returns true si está quieto y requiere atención
 */
export const isStagnant = (claim: Claim, threshold: number = STAGNANT_THRESHOLD_DAYS): boolean => {
  if (isInFinalState(claim)) return false;
  return getDaysSinceLastChange(claim) > threshold;
};

/**
 * Calcula el nivel de riesgo de prescripción
 * Basado en fecha de ocurrencia + 2 años (prescripción ordinaria)
 * @param claim - El reclamo a evaluar
 * @returns Objeto con información de riesgo
 */
export interface PrescriptionRisk {
  level: 'none' | 'low' | 'medium' | 'high';
  daysToOrdinary: number | null;
  daysToExtraordinary: number | null;
}

export const getPrescriptionRisk = (claim: Claim): PrescriptionRisk => {
  if (!claim.fecha_ocurrencia) {
    return {
      level: 'none',
      daysToOrdinary: null,
      daysToExtraordinary: null,
    };
  }

  const ocurrencia = new Date(claim.fecha_ocurrencia);
  if (isNaN(ocurrencia.getTime())) {
    return {
      level: 'none',
      daysToOrdinary: null,
      daysToExtraordinary: null,
    };
  }

  // Si ya está en estado final, no hay riesgo
  if (isInFinalState(claim)) {
    return {
      level: 'none',
      daysToOrdinary: null,
      daysToExtraordinary: null,
    };
  }

  const now = new Date();
  
  // Prescripción ordinaria: 2 años
  const ordinaria = new Date(ocurrencia);
  ordinaria.setFullYear(ordinaria.getFullYear() + 2);
  const daysToOrdinary = Math.ceil((ordinaria.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Prescripción extraordinaria: 5 años
  const extraordinaria = new Date(ocurrencia);
  extraordinaria.setFullYear(extraordinaria.getFullYear() + 5);
  const daysToExtraordinary = Math.ceil((extraordinaria.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular nivel de riesgo
  let level: PrescriptionRisk['level'] = 'none';
  
  if (daysToOrdinary < 0) {
    // Ya prescrito
    level = 'high';
  } else if (daysToOrdinary < 90) {
    // Menos de 3 meses
    level = 'high';
  } else if (daysToOrdinary < 180) {
    // Menos de 6 meses
    level = 'medium';
  } else if (daysToOrdinary < 365) {
    // Menos de 1 año
    level = 'low';
  }

  return {
    level,
    daysToOrdinary,
    daysToExtraordinary,
  };
};

/**
 * Verifica si un reclamo tiene riesgo alto de prescripción
 * @param claim - El reclamo a evaluar
 * @returns true si tiene riesgo alto
 */
export const hasHighPrescriptionRisk = (claim: Claim): boolean => {
  return getPrescriptionRisk(claim).level === 'high';
};

/**
 * Calcula el número de casos activos (no en estado final)
 * @param claims - Lista de reclamos
 * @returns Cantidad de casos activos
 */
export const getActiveClaimsCount = (claims: Claim[]): number => {
  return claims.filter(claim => !isInFinalState(claim)).length;
};

/**
 * Calcula el número de casos quietos
 * @param claims - Lista de reclamos
 * @param threshold - Días de umbral (default: 30)
 * @returns Cantidad de casos quietos
 */
export const getStagnantClaimsCount = (claims: Claim[], threshold?: number): number => {
  return claims.filter(claim => isStagnant(claim, threshold)).length;
};
