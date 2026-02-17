import { useMemo } from 'react';
import type { Claim } from '../../types';
import type { PrescripcionRiskData, RiesgoPrescripcion } from '../../types/reports';
import { RIESGO_ALTO_DIAS, RIESGO_MEDIO_DIAS } from '../../constants/reports';

export function usePrescripcionRiesgo(claims: Claim[]): PrescripcionRiskData[] {
  return useMemo(() => {
    const now = new Date();

    return claims
      .filter((claim) => claim.prescripcion_ordinaria)
      .map((claim) => {
        const prescripcionDate = new Date(claim.prescripcion_ordinaria!);
        const diasRestantes = Math.floor(
          (prescripcionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine risk level
        let nivelRiesgo: RiesgoPrescripcion;
        if (diasRestantes < 0) {
          nivelRiesgo = 'alto'; // Already expired
        } else if (diasRestantes < RIESGO_ALTO_DIAS) {
          nivelRiesgo = 'alto';
        } else if (diasRestantes < RIESGO_MEDIO_DIAS) {
          nivelRiesgo = 'medio';
        } else {
          nivelRiesgo = 'bajo';
        }

        // Calculate days without movement
        const diasSinMovimiento = claim.lastStateChangeDate
          ? Math.floor((now.getTime() - new Date(claim.lastStateChangeDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Get last management
        const ultimaGestion = claim.timeline && claim.timeline.length > 0
          ? claim.timeline[claim.timeline.length - 1].text
          : null;

        return {
          claim,
          diasRestantes,
          nivelRiesgo,
          diasSinMovimiento,
          ultimaGestion,
        };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes); // Sort by risk (lower days first)
  }, [claims]);
}
