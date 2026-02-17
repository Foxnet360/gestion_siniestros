import { useMemo } from 'react';
import type { Claim, StateHistoryEntry } from '../../types';
import type { TiempoPorFase } from '../../types/reports';
import { WORKFLOW_PHASES } from '../../constants';

export function useTiemposPorFase(
  claims: Claim[],
  stateHistory: Map<string, StateHistoryEntry[]>
): TiempoPorFase[] {
  return useMemo(() => {
    // Calculate total days per phase across all claims
    const faseStats = new Map<number, { totalDays: number; count: number }>();

    claims.forEach((claim) => {
      const history = stateHistory.get(claim.id_softseguros) || claim.stateHistory || [];
      
      // Group history entries by phase
      const phaseDays = new Map<number, number>();
      
      history.forEach((entry) => {
        // Find which phase this state belongs to
        const phase = WORKFLOW_PHASES.find(p => p.states.includes(entry.state));
        if (phase) {
          const current = phaseDays.get(phase.id) || 0;
          phaseDays.set(phase.id, current + entry.daysDuration);
        }
      });

      // Also add current state time
      const currentPhase = WORKFLOW_PHASES.find(p => p.states.includes(claim.estado_interno));
      if (currentPhase && claim.lastStateChangeDate) {
        const startDate = new Date(claim.lastStateChangeDate);
        const now = new Date();
        const daysInCurrentState = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const current = phaseDays.get(currentPhase.id) || 0;
        phaseDays.set(currentPhase.id, current + daysInCurrentState);
      }

      // Add to global stats
      phaseDays.forEach((days, phaseId) => {
        const stats = faseStats.get(phaseId) || { totalDays: 0, count: 0 };
        stats.totalDays += days;
        stats.count += 1;
        faseStats.set(phaseId, stats);
      });
    });

    // Build result array
    return WORKFLOW_PHASES.map((phase) => {
      const stats = faseStats.get(phase.id) || { totalDays: 0, count: 0 };
      const tiempoPromedio = stats.count > 0 ? stats.totalDays / stats.count : 0;

      return {
        fase: phase.label,
        faseId: phase.id,
        tiempoPromedio,
        casosCount: stats.count,
        color: phase.color,
      };
    });
  }, [claims, stateHistory]);
}
