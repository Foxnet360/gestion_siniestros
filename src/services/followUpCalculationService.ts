import { addDays, addMonths } from 'date-fns';
import { Claim, InternalState } from '../types';
import { WORKFLOW_PHASES } from '../constants';
import { supabase } from '../lib/supabase';

/**
 * @fileoverview Follow-Up Calculation Service
 *
 * This service provides automatic calculation of follow-up dates for insurance claims
 * based on business rules and workflow phases. It supports:
 * - Standard phases (Fase 1-5): 10-day follow-up cycles
 * - Legal process (PROCESO JURÍDICO): 30-60 day follow-ups
 * - Prescription phase: 10-day review cycles
 * - Prescription deadline awareness
 *
 * @module services/followUpCalculationService
 * @requires date-fns
 * @requires ../types
 * @requires ../constants
 * @requires ../lib/supabase
 *
 * @example
 * ```typescript
 * import { calculateNextFollowUp, getFollowUpRules } from './followUpCalculationService';
 *
 * // Calculate next follow-up for a claim
 * const nextDate = await calculateNextFollowUp(claim, new Date());
 *
 * // Get current business rules
 * const rules = await getFollowUpRules();
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Business rules configuration for follow-up calculations
 * @interface FollowUpRules
 */
export interface FollowUpRules {
  standard: {
    phases: number[];
    days: number;
    description: string;
  };
  legal: {
    state: InternalState;
    minDays: number;
    maxDays: number;
    defaultDays: number;
    description: string;
  };
  prescription: {
    state: InternalState;
    days: number;
    description: string;
  };
}

export interface PrescriptionRules {
  ordinary: {
    years: number;
    description: string;
    excludes: string[];
  };
  extraordinary: {
    years: number;
    description: string;
    includes: string[];
  };
}

export interface AlertThresholds {
  prescription: {
    warning: number;
    critical: number;
    autoClose: number;
    description: string;
  };
  followUp: {
    overdue: number;
    stagnant: number;
    description: string;
  };
  legalStagnant: {
    warningMonths: number;
    closeYears: number;
    description: string;
  };
}

export type AlertLevel =
  | 'normal'
  | 'warning'
  | 'critical'
  | 'legal_stagnation_warning'
  | 'legal_stagnation_critical'
  | 'resolved';

// Default rules (fallback if DB config is unavailable)
const DEFAULT_FOLLOW_UP_RULES: FollowUpRules = {
  standard: {
    phases: [1, 2, 3, 4, 5],
    days: 10,
    description: 'Seguimiento cada 10 días para fases 1-5',
  },
  legal: {
    state: 'PROCESO JURÍDICO',
    minDays: 30,
    maxDays: 60,
    defaultDays: 30,
    description: '1-2 meses según situación del cliente',
  },
  prescription: {
    state: 'PRESCRIPCIÓN',
    days: 10,
    description: 'Revisión cada 10 días hasta cierre',
  },
};

const DEFAULT_PRESCRIPTION_RULES: PrescriptionRules = {
  ordinary: {
    years: 2,
    description: 'Prescripción ordinaria - 2 años desde fecha de ocurrencia',
    excludes: ['Responsabilidad Civil'],
  },
  extraordinary: {
    years: 5,
    description: 'Prescripción extraordinaria - 5 años para RC y eventos sin conocer',
    includes: ['Responsabilidad Civil'],
  },
};

const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  prescription: {
    warning: 90,
    critical: 30,
    autoClose: 0,
    description: 'Días antes de vencimiento para alertas',
  },
  followUp: {
    overdue: 1,
    stagnant: 30,
    description: 'Días de atraso para seguimientos',
  },
  legalStagnant: {
    warningMonths: 24,
    closeYears: 5,
    description: 'Meses/años para alertas y cierre por estancamiento',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the workflow phase ID for a given state
 */
function getPhaseIdForState(state: InternalState): number | null {
  const phase = WORKFLOW_PHASES.find(p => p.states.includes(state));
  return phase ? phase.id : null;
}

/**
 * Checks if a state is in the standard phases (1-5)
 */
function isStandardPhase(state: InternalState): boolean {
  const phaseId = getPhaseIdForState(state);
  return phaseId !== null && phaseId >= 1 && phaseId <= 5;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Retrieves follow-up business rules from the database.
 *
 * Fetches the current configuration from the `app_config` table. If the database
 * is unavailable or the configuration is missing, returns default rules.
 *
 * @async
 * @function getFollowUpRules
 * @returns {Promise<FollowUpRules>} The current follow-up rules configuration
 * @throws {never} Always returns a valid configuration (defaults on error)
 *
 * @example
 * ```typescript
 * const rules = await getFollowUpRules();
 * console.log(rules.standard.days); // 10
 * console.log(rules.legal.minDays); // 30
 * ```
 *
 * @see {@link FollowUpRules}
 * @see {@link DEFAULT_FOLLOW_UP_RULES}
 */
export async function getFollowUpRules(): Promise<FollowUpRules> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'follow_up_rules')
      .single();

    if (error || !data) {
      console.warn('Using default follow-up rules:', error?.message || 'No config found');
      return DEFAULT_FOLLOW_UP_RULES;
    }

    return data.config_value as FollowUpRules;
  } catch (err) {
    console.warn('Error fetching follow-up rules, using defaults:', err);
    return DEFAULT_FOLLOW_UP_RULES;
  }
}

/**
 * Retrieves prescription rules from database or returns defaults
 */
export async function getPrescriptionRules(): Promise<PrescriptionRules> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'prescription_rules')
      .single();

    if (error || !data) {
      console.warn('Using default prescription rules:', error?.message || 'No config found');
      return DEFAULT_PRESCRIPTION_RULES;
    }

    return data.config_value as PrescriptionRules;
  } catch (err) {
    console.warn('Error fetching prescription rules, using defaults:', err);
    return DEFAULT_PRESCRIPTION_RULES;
  }
}

/**
 * Retrieves alert thresholds from database or returns defaults
 */
export async function getAlertThresholds(): Promise<AlertThresholds> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'alert_thresholds')
      .single();

    if (error || !data) {
      console.warn('Using default alert thresholds:', error?.message || 'No config found');
      return DEFAULT_ALERT_THRESHOLDS;
    }

    return data.config_value as AlertThresholds;
  } catch (err) {
    console.warn('Error fetching alert thresholds, using defaults:', err);
    return DEFAULT_ALERT_THRESHOLDS;
  }
}

/**
 * Calculates the next follow-up date for a claim based on its current state.
 *
 * This is the main function for automatic follow-up date calculation. It considers:
 * - Current workflow state (standard phases, legal process, prescription)
 * - Business rules configured in the database
 * - Prescription deadlines (prioritizes prescription dates when critical)
 * - Follow-up overdue status
 *
 * **Calculation Logic:**
 * - **Standard Phases (Fase 1-5)**: Adds 10 days to the fromDate
 * - **PROCESO JURÍDICO**: Adds 30 days (configurable: 30-60 days)
 * - **PRESCRIPCIÓN**: Adds 10 days
 * - **Critical Alerts**: Returns prescription date if it's sooner
 *
 * @async
 * @function calculateNextFollowUp
 * @param {Claim} claim - The claim to calculate follow-up for
 * @param {Date} [fromDate=new Date()] - Optional base date for calculation (defaults to today)
 * @returns {Promise<Date>} The calculated next follow-up date
 * @throws {never} Returns a valid date even if calculation fails (falls back to today + 10 days)
 *
 * @example
 * ```typescript
 * // Calculate from today
 * const nextDate = await calculateNextFollowUp(claim);
 *
 * // Calculate from a specific date
 * const fromDate = new Date('2026-03-01');
 * const nextDate = await calculateNextFollowUp(claim, fromDate);
 * ```
 *
 * @see {@link getFollowUpRules}
 * @see {@link getPrescriptionAlertLevel}
 */
export async function calculateNextFollowUp(
  claim: Claim,
  fromDate: Date = new Date()
): Promise<Date> {
  const rules = await getFollowUpRules();
  const thresholds = await getAlertThresholds();

  const state = claim.estado_interno;

  // Check if claim is in prescription monitoring state
  if (state === rules.prescription.state) {
    return addDays(fromDate, rules.prescription.days);
  }

  // Check if claim is in legal process
  if (state === rules.legal.state) {
    // For legal process, return default (30 days) - can be adjusted by user up to max
    return addDays(fromDate, rules.legal.defaultDays);
  }

  // Check if in standard phases (1-5)
  if (isStandardPhase(state)) {
    // Check if claim has prescription alert - prioritize that
    if (claim.alert_level === 'critical' || claim.alert_level === 'warning') {
      const prescriptionDate = getPrescriptionDate(claim);
      if (prescriptionDate) {
        const daysToPrescription = Math.ceil(
          (prescriptionDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If prescription is within the standard follow-up period, suggest earlier date
        if (daysToPrescription <= rules.standard.days) {
          // Suggest 7 days before prescription, but at least 1 day from now
          const suggestedDays = Math.max(1, daysToPrescription - 7);
          return addDays(fromDate, suggestedDays);
        }
      }
    }

    return addDays(fromDate, rules.standard.days);
  }

  // Default fallback for other states
  return addDays(fromDate, rules.standard.days);
}

/**
 * Gets the applicable prescription date for a claim
 * (extraordinaria if RC, otherwise ordinaria)
 */
function getPrescriptionDate(claim: Claim): Date | null {
  if (claim.fecha_prescripcion_extraordinaria) {
    return new Date(claim.fecha_prescripcion_extraordinaria);
  }
  if (claim.fecha_prescripcion_ordinaria) {
    return new Date(claim.fecha_prescripcion_ordinaria);
  }
  return null;
}

/**
 * Recalculates the next follow-up date when state changes
 *
 * @param claimId - The claim ID
 * @param newState - The new state
 * @returns The recalculated follow-up date
 */
export async function recalculateOnStateChange(
  claimId: string,
  newState: InternalState
): Promise<Date> {
  // Fetch the claim to get current data
  const { data: claim, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id', claimId)
    .single();

  if (error || !claim) {
    throw new Error(`Failed to fetch claim ${claimId}: ${error?.message || 'Claim not found'}`);
  }

  // Calculate new follow-up date
  const nextFollowUp = await calculateNextFollowUp(claim as Claim);

  // Update the claim
  const { error: updateError } = await supabase
    .from('claims')
    .update({
      proximo_seguimiento: nextFollowUp.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', claimId);

  if (updateError) {
    throw new Error(`Failed to update claim ${claimId}: ${updateError.message}`);
  }

  return nextFollowUp;
}

/**
 * Gets the maximum allowed days for a state
 * Used for validation when user manually overrides
 *
 * @param state - The internal state
 * @returns Maximum days allowed, or null if no limit
 */
export async function getMaxDaysForState(state: InternalState): Promise<number | null> {
  const rules = await getFollowUpRules();

  if (state === rules.legal.state) {
    return rules.legal.maxDays;
  }

  return null; // No limit for other states
}

/**
 * Gets the minimum allowed days for a state
 *
 * @param state - The internal state
 * @returns Minimum days required
 */
export async function getMinDaysForState(state: InternalState): Promise<number> {
  const rules = await getFollowUpRules();

  if (state === rules.legal.state) {
    return rules.legal.minDays;
  }

  return 1; // Minimum 1 day for other states
}

/**
 * Validates if a manually selected date is within allowed range
 *
 * @param state - The claim state
 * @param selectedDate - The date selected by user
 * @param fromDate - The reference date (usually today)
 * @returns Validation result
 */
export async function validateFollowUpDate(
  state: InternalState,
  selectedDate: Date,
  fromDate: Date = new Date()
): Promise<{ valid: boolean; error?: string }> {
  const minDays = await getMinDaysForState(state);
  const maxDays = await getMaxDaysForState(state);

  // Calculate days from reference date
  const daysDiff = Math.ceil((selectedDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < minDays) {
    return {
      valid: false,
      error: `La fecha debe ser al menos ${minDays} días desde hoy`,
    };
  }

  if (maxDays !== null && daysDiff > maxDays) {
    return {
      valid: false,
      error: `La fecha no puede exceder ${maxDays} días para el estado ${state}`,
    };
  }

  return { valid: true };
}
