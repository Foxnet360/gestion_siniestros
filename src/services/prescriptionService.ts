/**
 * @fileoverview Prescription Management Service
 *
 * This service handles all prescription-related calculations and alerts for insurance claims.
 * It manages both ordinary (2-year) and extraordinary (5-year) prescription periods,
 * calculates remaining days until prescription, and determines alert levels.
 *
 * **Key Concepts:**
 * - **Prescripción Ordinaria**: 2 years from fecha_ocurrencia (applies to most ramos)
 * - **Prescripción Extraordinaria**: 5 years (applies to Responsabilidad Civil and RC Profesional)
 * - **Prescripción Aplicable**: The longer of the two periods that applies to the specific ramo
 *
 * @module services/prescriptionService
 * @requires date-fns
 * @requires ../types
 * @requires ../lib/supabase
 * @requires ./followUpCalculationService
 *
 * @example
 * ```typescript
 * import {
 *   calculatePrescriptionDates,
 *   getPrescriptionAlertLevel,
 *   formatPrescriptionInfo
 * } from './prescriptionService';
 *
 * // Calculate prescription dates
 * const dates = calculatePrescriptionDates(claim);
 * console.log(dates.applicable); // The prescription deadline that applies
 *
 * // Get alert level
 * const level = await getPrescriptionAlertLevel(claim);
 * // 'normal' | 'warning' | 'critical' | 'resolved'
 * ```
 */

import { addYears, differenceInDays, differenceInMonths } from 'date-fns';
import { Claim, InternalState } from '../types';
import { supabase } from '../lib/supabase';
import { AlertLevel, getPrescriptionRules, getAlertThresholds } from './followUpCalculationService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Prescription dates calculation result
 * @interface PrescriptionDates
 */
export interface PrescriptionDates {
  /** Ordinary prescription date (2 years from fecha_ocurrencia) */
  ordinaria: Date | null;
  /** Extraordinary prescription date (5 years, only for RC ramos) */
  extraordinaria: Date | null;
  /** The applicable prescription date (extraordinaria if RC, otherwise ordinaria) */
  applicable: Date | null;
}

export interface PrescriptionAlert {
  claimId: string;
  level: AlertLevel;
  type: 'prescription' | 'legal_stagnation';
  daysRemaining: number;
  message: string;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Calculates prescription dates for a claim based on fecha_ocurrencia and ramo.
 *
 * **Calculation Rules:**
 * - **Ordinary Prescription**: Always calculated as 2 years from fecha_ocurrencia
 * - **Extraordinary Prescription**: Calculated as 5 years only for:
 *   - Responsabilidad Civil
 *   - RC Profesional
 *   - Other ramos configured in prescription_rules.extraordinary.includes
 * - **Applicable Date**: Returns extraordinaria for RC ramos, ordinaria for others
 *
 * @function calculatePrescriptionDates
 * @param {Claim} claim - The claim to calculate prescription dates for. Must have fecha_ocurrencia.
 * @returns {PrescriptionDates} Object containing ordinaria, extraordinaria, and applicable dates
 *
 * @example
 * ```typescript
 * // Standard ramo (Automóviles)
 * const claim = { fecha_ocurrencia: '2024-03-06', ramo: 'Automóviles' };
 * const dates = calculatePrescriptionDates(claim);
 * // dates.ordinaria = 2026-03-06
 * // dates.extraordinaria = null
 * // dates.applicable = 2026-03-06
 *
 * // RC ramo (Responsabilidad Civil)
 * const rcClaim = { fecha_ocurrencia: '2024-03-06', ramo: 'Responsabilidad Civil' };
 * const rcDates = calculatePrescriptionDates(rcClaim);
 * // rcDates.ordinaria = 2026-03-06
 * // rcDates.extraordinaria = 2029-03-06
 * // rcDates.applicable = 2029-03-06
 * ```
 *
 * @see {@link requiresExtraordinaryPrescription}
 * @see {@link getPrescriptionYears}
 */
export function calculatePrescriptionDates(claim: Claim): PrescriptionDates {
  if (!claim.fecha_ocurrencia) {
    return { ordinaria: null, extraordinaria: null, applicable: null };
  }

  const fechaOcurrencia = new Date(claim.fecha_ocurrencia);
  const rules = getPrescriptionRulesSync();

  // Calculate ordinary prescription (2 years for all)
  const ordinaria = addYears(fechaOcurrencia, rules.ordinary.years);

  // Check if ramo requires extraordinary prescription
  const requiresExtraordinary = rules.extraordinary.includes.some(
    r => claim.ramo?.toLowerCase() === r.toLowerCase()
  );

  const extraordinaria = requiresExtraordinary
    ? addYears(fechaOcurrencia, rules.extraordinary.years)
    : null;

  // Applicable date is extraordinaria for RC, ordinaria for others
  const applicable = extraordinaria || ordinaria;

  return {
    ordinaria,
    extraordinaria,
    applicable,
  };
}

/**
 * Synchronous version of getPrescriptionRules (uses defaults)
 * Used when async is not possible
 */
function getPrescriptionRulesSync() {
  return {
    ordinary: {
      years: 2,
      excludes: ['Responsabilidad Civil'],
    },
    extraordinary: {
      years: 5,
      description: 'Prescripción extraordinaria - 5 años para RC y eventos sin conocer',
      includes: ['Responsabilidad Civil', 'RC Profesional'],
    },
  };
}

/**
 * Gets the applicable prescription date for a claim
 * (extraordinaria if RC, otherwise ordinaria)
 *
 * @param claim - The claim
 * @returns The applicable prescription date or null
 */
export function getApplicablePrescriptionDate(claim: Claim): Date | null {
  const dates = calculatePrescriptionDates(claim);
  return dates.applicable;
}

/**
 * Determines the alert level for a claim based on prescription dates
 *
 * @param claim - The claim to check
 * @returns The alert level
 */
export async function getPrescriptionAlertLevel(claim: Claim): Promise<AlertLevel> {
  // If claim is already finalized, return resolved
  if (claim.estado_interno === 'FINALIZADO' || claim.estado_interno === 'PAGADO') {
    return 'resolved';
  }

  const prescriptionDate = getApplicablePrescriptionDate(claim);
  if (!prescriptionDate) {
    return 'normal';
  }

  const today = new Date();
  const daysRemaining = differenceInDays(prescriptionDate, today);

  const thresholds = await getAlertThresholds();

  // If already expired
  if (daysRemaining <= 0) {
    return 'critical';
  }

  // Critical: within 30 days
  if (daysRemaining <= thresholds.prescription.critical) {
    return 'critical';
  }

  // Warning: within 90 days
  if (daysRemaining <= thresholds.prescription.warning) {
    return 'warning';
  }

  return 'normal';
}

/**
 * Checks all active claims and returns those needing prescription alerts
 *
 * @returns Array of prescription alerts
 */
export async function checkPrescriptionAlerts(): Promise<PrescriptionAlert[]> {
  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO'])
    .not('fecha_ocurrencia', 'is', null);

  if (error || !claims) {
    console.error('Error fetching claims for prescription alerts:', error);
    return [];
  }

  const alerts: PrescriptionAlert[] = [];
  const today = new Date();
  const thresholds = await getAlertThresholds();

  for (const claim of claims as Claim[]) {
    const prescriptionDate = getApplicablePrescriptionDate(claim);
    if (!prescriptionDate) continue;

    const daysRemaining = differenceInDays(prescriptionDate, today);

    // Generate alert if within warning threshold or already expired
    if (daysRemaining <= thresholds.prescription.warning) {
      let level: AlertLevel;

      if (daysRemaining <= 0) {
        level = 'critical';
      } else if (daysRemaining <= thresholds.prescription.critical) {
        level = 'critical';
      } else {
        level = 'warning';
      }

      alerts.push({
        claimId: claim.id_softseguros,
        level,
        type: 'prescription',
        daysRemaining,
        message: generatePrescriptionMessage(claim, daysRemaining, prescriptionDate),
      });
    }
  }

  return alerts;
}

/**
 * Updates the alert level for all active claims
 * Should be called periodically (daily)
 */
export async function updateAllAlertLevels(): Promise<{ updated: number; errors: number }> {
  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

  if (error || !claims) {
    console.error('Error fetching claims for alert update:', error);
    return { updated: 0, errors: 1 };
  }

  let updated = 0;
  let errors = 0;

  for (const claim of claims as Claim[]) {
    try {
      const newLevel = await getPrescriptionAlertLevel(claim);

      // Only update if level changed
      if (newLevel !== claim.alert_level) {
        const { error: updateError } = await supabase
          .from('claims')
          .update({ alert_level: newLevel })
          .eq('id_softseguros', claim.id_softseguros);

        if (updateError) {
          console.error(`Error updating alert level for ${claim.id_softseguros}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      }
    } catch (err) {
      console.error(`Error processing alert level for ${claim.id_softseguros}:`, err);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Updates prescription dates for a specific claim
 * Should be called when fecha_ocurrencia or ramo changes
 *
 * @param claimId - The claim ID
 */
export async function updateClaimPrescriptionDates(claimId: string): Promise<void> {
  const { data: claim, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id_softseguros', claimId)
    .single();

  if (error || !claim) {
    throw new Error(`Failed to fetch claim ${claimId}: ${error?.message || 'Claim not found'}`);
  }

  const dates = calculatePrescriptionDates(claim as Claim);

  const { error: updateError } = await supabase
    .from('claims')
    .update({
      fecha_prescripcion_ordinaria: dates.ordinaria?.toISOString(),
      fecha_prescripcion_extraordinaria: dates.extraordinaria?.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id_softseguros', claimId);

  if (updateError) {
    throw new Error(`Failed to update prescription dates for ${claimId}: ${updateError.message}`);
  }
}

/**
 * Generates a human-readable message for prescription alerts
 */
function generatePrescriptionMessage(
  claim: Claim,
  daysRemaining: number,
  prescriptionDate: Date
): string {
  const dateStr = prescriptionDate.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (daysRemaining <= 0) {
    return `Prescripción vencida el ${dateStr}. Requiere acción inmediata.`;
  } else if (daysRemaining === 1) {
    return `Prescripción vence mañana (${dateStr}).`;
  } else if (daysRemaining <= 7) {
    return `Prescripción vence en ${daysRemaining} días (${dateStr}).`;
  } else {
    return `Prescripción el ${dateStr} (${daysRemaining} días restantes).`;
  }
}

/**
 * Checks if a ramo requires extraordinary prescription
 *
 * @param ramo - The insurance line/ramo
 * @returns true if requires 5-year prescription
 */
export function requiresExtraordinaryPrescription(ramo: string): boolean {
  const rules = getPrescriptionRulesSync();
  return rules.extraordinary.includes.some(r => ramo.toLowerCase() === r.toLowerCase());
}

/**
 * Gets the number of years for prescription based on ramo
 *
 * @param ramo - The insurance line/ramo
 * @returns 5 for RC, 2 for others
 */
export function getPrescriptionYears(ramo: string): number {
  return requiresExtraordinaryPrescription(ramo) ? 5 : 2;
}

/**
 * Formats prescription dates for display
 *
 * @param claim - The claim
 * @returns Formatted string with prescription info
 */
export function formatPrescriptionInfo(claim: Claim): string {
  const dates = calculatePrescriptionDates(claim);

  if (!dates.applicable) {
    return 'No calculada - falta fecha de ocurrencia';
  }

  const today = new Date();
  const daysRemaining = differenceInDays(dates.applicable, today);
  const type = dates.extraordinaria ? 'Extraordinaria (5 años)' : 'Ordinaria (2 años)';

  if (daysRemaining < 0) {
    return `${type} - Vencida hace ${Math.abs(daysRemaining)} días`;
  } else {
    return `${type} - Vence en ${daysRemaining} días (${dates.applicable.toLocaleDateString('es-CO')})`;
  }
}
