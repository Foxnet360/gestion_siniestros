/**
 * @fileoverview Auto-Close and Legal Stagnation Service
 *
 * This service handles automatic claim closures based on prescription deadlines
 * and legal stagnation rules. It provides safeguards for high-value and high-priority claims.
 *
 * **Key Features:**
 * - Automatic closure when prescription date is reached
 * - Manual approval workflow for high-value claims (≥ $50M)
 * - High-priority claim exclusions (ALTA priority)
 * - Legal stagnation detection (24-month warning, 5-year closure)
 * - Comprehensive audit trail for all closures
 *
 * **Closure Types:**
 * - **Prescription Ordinary**: 2 years from fecha_ocurrencia
 * - **Prescription Extraordinary**: 5 years for RC ramos
 * - **Legal Stagnation**: 5 years in PROCESO JURÍDICO without activity
 * - **Pending Approval**: High-value/priority claims requiring manual review
 *
 * **Safety Mechanisms:**
 * - Configurable high-value threshold (default: $50,000,000)
 * - High-priority exclusions prevent automatic closure
 * - Recent activity check for legal stagnation (6 months)
 * - Audit logging for all closure actions
 *
 * @module services/autoCloseService
 * @requires ../lib/supabase
 * @requires ../types
 * @requires ./prescriptionService
 * @requires ./followUpCalculationService
 * @requires date-fns
 *
 * @example
 * ```typescript
 * import {
 *   processPrescriptionClosures,
 *   processLegalStagnation,
 *   CloseResult
 * } from './autoCloseService';
 *
 * // Process prescription-based closures
 * const prescriptionResults = await processPrescriptionClosures();
 * console.log(`${prescriptionResults.filter(r => r.success).length} claims closed`);
 *
 * // Process legal stagnation
 * const stagnationResults = await processLegalStagnation();
 * console.log(`${stagnationResults.filter(r => r.success).length} stagnant claims closed`);
 * ```
 */

import { supabase } from '../lib/supabase';
import { Claim, InternalState, Priority } from '../types';
import { getApplicablePrescriptionDate } from './prescriptionService';
import { getAlertThresholds } from './followUpCalculationService';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CloseResult {
  claimId: string;
  claimNumber: string;
  success: boolean;
  reason:
    | 'prescription_ordinary'
    | 'prescription_extraordinary'
    | 'legal_stagnation'
    | 'pending_approval';
  message: string;
  error?: string;
}

export interface AutoCloseConfig {
  highValueThreshold: number;
  highPriorityExclusion: Priority[];
  autoCloseStates: InternalState[];
  pendingApprovalState: InternalState;
}

// ============================================================================
// PRESCRIPTION CLOSURE
// ============================================================================

/**
 * Processes automatic closures for claims that have reached their prescription date.
 *
 * **Closure Rules:**
 * - Claims past their applicable prescription date are eligible for closure
 * - High-value claims (≥ $50M) are marked for manual approval instead of auto-closing
 * - High-priority claims (ALTA) are excluded from automatic closure
 * - Creates audit trail entries for all closure actions
 *
 * **Process Flow:**
 * 1. Fetch all active claims with prescription dates
 * 2. Check each claim against prescription deadline
 * 3. Apply high-value and high-priority exclusions
 * 4. Close eligible claims or mark for approval
 * 5. Return detailed results for each claim processed
 *
 * @async
 * @function processPrescriptionClosures
 * @returns {Promise<CloseResult[]>} Array of closure results, one per claim processed
 * @returns {string} CloseResult.claimId - The ID of the processed claim
 * @returns {string} CloseResult.claimNumber - The claim number for reference
 * @returns {boolean} CloseResult.success - Whether the closure was successful
 * @returns {string} CloseResult.reason - The closure reason category
 * @returns {string} CloseResult.message - Human-readable result message
 * @returns {string} [CloseResult.error] - Error message if closure failed
 *
 * @example
 * ```typescript
 * const results = await processPrescriptionClosures();
 *
 * // Check results
 * results.forEach(result => {
 *   if (result.success) {
 *     console.log(`✅ ${result.claimNumber}: ${result.message}`);
 *   } else if (result.reason === 'pending_approval') {
 *     console.log(`⏳ ${result.claimNumber}: Requires manual approval`);
 *   } else {
 *     console.log(`❌ ${result.claimNumber}: ${result.error}`);
 *   }
 * });
 * ```
 *
 * @see {@link processLegalStagnation}
 * @see {@link CloseResult}
 */
export async function processPrescriptionClosures(): Promise<CloseResult[]> {
  console.log('🔒 Procesando cierres por prescripción...');

  const results: CloseResult[] = [];
  const config = await getAutoCloseConfig();

  // Get all active claims
  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO', 'PRESCRIPCIÓN'])
    .not('fecha_prescripcion_ordinaria', 'is', null);

  if (error || !claims) {
    console.error('❌ Error al obtener siniestros:', error);
    return [];
  }

  console.log(`   📋 ${claims.length} siniestros activos encontrados`);

  for (const claim of claims as Claim[]) {
    try {
      const result = await evaluatePrescriptionClosure(claim, config);
      if (result) {
        results.push(result);
      }
    } catch (err) {
      console.error(`   ❌ Error procesando ${claim.numero_siniestro}:`, err);
      results.push({
        claimId: claim.id_softseguros,
        claimNumber: claim.numero_siniestro,
        success: false,
        reason: 'prescription_ordinary',
        message: 'Error en evaluación',
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Cierres completados: ${successCount}/${results.length}`);

  return results;
}

/**
 * Evaluates if a claim should be closed due to prescription
 * Returns null if no action needed
 */
async function evaluatePrescriptionClosure(
  claim: Claim,
  config: AutoCloseConfig
): Promise<CloseResult | null> {
  const prescriptionDate = getApplicablePrescriptionDate(claim);
  if (!prescriptionDate) {
    return null;
  }

  const today = new Date();
  const daysExpired = differenceInDays(today, prescriptionDate);

  // Check if prescription has expired
  if (daysExpired < 0) {
    return null; // Not expired yet
  }

  // Check if high-value (requires manual approval)
  if (isHighValueOrPriority(claim, config)) {
    return await sendForManualApproval(claim, config, prescriptionDate);
  }

  // Auto-close the claim
  return await autoCloseClaim(claim, prescriptionDate, daysExpired);
}

/**
 * Checks if a claim is high-value or high-priority (requires manual approval)
 */
function isHighValueOrPriority(claim: Claim, config: AutoCloseConfig): boolean {
  // Check high value
  if (claim.monto_reclamo >= config.highValueThreshold) {
    return true;
  }

  // Check high priority
  if (config.highPriorityExclusion.includes(claim.prioridad)) {
    return true;
  }

  return false;
}

/**
 * Sends a high-value claim for manual approval instead of auto-closing
 */
async function sendForManualApproval(
  claim: Claim,
  config: AutoCloseConfig,
  prescriptionDate: Date
): Promise<CloseResult> {
  console.log(
    `   ⚠️ ${claim.numero_siniestro}: Requiere aprobación manual (monto: ${claim.monto_reclamo})`
  );

  const { error } = await supabase
    .from('claims')
    .update({
      estado_interno: config.pendingApprovalState,
      alert_level: 'critical',
      updatedAt: new Date().toISOString(),
    })
    .eq('id_softseguros', claim.id_softseguros);

  if (error) {
    return {
      claimId: claim.id_softseguros,
      claimNumber: claim.numero_siniestro,
      success: false,
      reason: 'pending_approval',
      message: 'Error al enviar para aprobación manual',
      error: error.message,
    };
  }

  // Create timeline entry
  await createTimelineEntry(
    claim.id_softseguros,
    `Siniestro marcado para aprobación manual de cierre. Prescripción vencida el ${prescriptionDate.toLocaleDateString('es-CO')}. ` +
      `Monto reclamado: $${claim.monto_reclamo.toLocaleString('es-CO')} (excede umbral de $${config.highValueThreshold.toLocaleString('es-CO')})`
  );

  return {
    claimId: claim.id_softseguros,
    claimNumber: claim.numero_siniestro,
    success: true,
    reason: 'pending_approval',
    message: 'Enviado para aprobación manual debido a alto valor/prioridad',
  };
}

/**
 * Automatically closes a claim due to prescription expiration
 */
async function autoCloseClaim(
  claim: Claim,
  prescriptionDate: Date,
  daysExpired: number
): Promise<CloseResult> {
  console.log(
    `   🔒 ${claim.numero_siniestro}: Cerrando automáticamente (vencido hace ${daysExpired} días)`
  );

  const isExtraordinary =
    !!claim.fecha_prescripcion_extraordinaria &&
    prescriptionDate.getTime() === new Date(claim.fecha_prescripcion_extraordinaria).getTime();

  const { error } = await supabase
    .from('claims')
    .update({
      estado_interno: 'PRESCRIPCIÓN',
      finalizado: true,
      fecha_finalizacion: new Date().toISOString(),
      alert_level: 'resolved',
      updatedAt: new Date().toISOString(),
    })
    .eq('id_softseguros', claim.id_softseguros);

  if (error) {
    return {
      claimId: claim.id_softseguros,
      claimNumber: claim.numero_siniestro,
      success: false,
      reason: isExtraordinary ? 'prescription_extraordinary' : 'prescription_ordinary',
      message: 'Error al cerrar siniestro',
      error: error.message,
    };
  }

  // Create system timeline entry
  const prescriptionType = isExtraordinary ? 'extraordinaria' : 'ordinaria';
  const years = isExtraordinary ? 5 : 2;

  await createSystemTimelineEntry(
    claim.id_softseguros,
    'PRESCRIPCIÓN',
    `Cierre automático por prescripción ${prescriptionType} alcanzada (${years} años desde fecha de ocurrencia). ` +
      `Fecha de ocurrencia: ${claim.fecha_ocurrencia ? new Date(claim.fecha_ocurrencia).toLocaleDateString('es-CO') : 'N/A'}. ` +
      `Prescripción calculada: ${prescriptionDate.toLocaleDateString('es-CO')}. ` +
      `Vencido hace ${daysExpired} días.`
  );

  // Create audit log entry
  await createAuditLogEntry(claim.id_softseguros, 'AUTO_CLOSE_PRESCRIPTION', {
    prescription_type: prescriptionType,
    fecha_ocurrencia: claim.fecha_ocurrencia,
    fecha_prescripcion: prescriptionDate.toISOString(),
    dias_vencido: daysExpired,
    previous_state: claim.estado_interno,
  });

  return {
    claimId: claim.id_softseguros,
    claimNumber: claim.numero_siniestro,
    success: true,
    reason: isExtraordinary ? 'prescription_extraordinary' : 'prescription_ordinary',
    message: `Cerrado automáticamente por prescripción ${prescriptionType}`,
  };
}

// ============================================================================
// LEGAL STAGNATION
// ============================================================================

/**
 * Processes legal stagnation closures for claims in PROCESO JURÍDICO
 * - Warning at 24 months
 * - Auto-close at 5 years
 */
export async function processLegalStagnation(): Promise<CloseResult[]> {
  console.log('⚖️ Procesando estancamiento jurídico...');

  const results: CloseResult[] = [];
  const thresholds = await getAlertThresholds();

  // Get all claims in legal process
  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .eq('estado_interno', 'PROCESO JURÍDICO')
    .not('finalizado', 'eq', true);

  if (error || !claims) {
    console.error('❌ Error al obtener siniestros jurídicos:', error);
    return [];
  }

  console.log(`   📋 ${claims.length} siniestros en proceso jurídico`);

  for (const claim of claims as Claim[]) {
    try {
      const result = await evaluateLegalStagnation(claim, thresholds);
      if (result) {
        results.push(result);
      }
    } catch (err) {
      console.error(`   ❌ Error procesando ${claim.numero_siniestro}:`, err);
      results.push({
        claimId: claim.id_softseguros,
        claimNumber: claim.numero_siniestro,
        success: false,
        reason: 'legal_stagnation',
        message: 'Error en evaluación',
        error: err instanceof Error ? err.message : 'Error desconocido',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Procesamiento completado: ${successCount}/${results.length}`);

  return results;
}

/**
 * Evaluates a legal process claim for stagnation
 */
async function evaluateLegalStagnation(claim: Claim, thresholds: any): Promise<CloseResult | null> {
  const lastChange = new Date(claim.lastStateChangeDate);
  const today = new Date();

  const monthsInState = differenceInMonths(today, lastChange);
  const yearsInState = differenceInYears(today, lastChange);

  // Check for recent activity (avoid false positives)
  const hasRecentActivity = await checkRecentActivity(claim.id_softseguros, 6); // 6 months

  if (hasRecentActivity) {
    // Reset alert if there was recent activity
    if (claim.alert_level?.includes('legal_stagnation')) {
      await supabase
        .from('claims')
        .update({ alert_level: 'normal' })
        .eq('id_softseguros', claim.id_softseguros);

      console.log(
        `   🔄 ${claim.numero_siniestro}: Actividad reciente detectada, alerta reseteada`
      );
    }
    return null;
  }

  // Auto-close at 5 years
  if (yearsInState >= thresholds.legalStagnant.closeYears) {
    return await closeForLegalStagnation(claim, yearsInState);
  }

  // Warning at 24 months
  if (monthsInState >= thresholds.legalStagnant.warningMonths) {
    const isCritical = monthsInState >= 54; // 4.5 years
    const alertLevel = isCritical ? 'legal_stagnation_critical' : 'legal_stagnation_warning';

    if (claim.alert_level !== alertLevel) {
      await supabase
        .from('claims')
        .update({ alert_level: alertLevel })
        .eq('id_softseguros', claim.id_softseguros);

      console.log(
        `   ⚠️ ${claim.numero_siniestro}: Alerta de estancamiento (${monthsInState} meses)`
      );

      return {
        claimId: claim.id_softseguros,
        claimNumber: claim.numero_siniestro,
        success: true,
        reason: 'legal_stagnation',
        message: `Alerta generada: ${monthsInState} meses en proceso jurídico`,
      };
    }
  }

  return null;
}

/**
 * Checks if a claim has had recent activity (timeline entries, updates)
 */
async function checkRecentActivity(claimId: string, months: number): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  // Check for recent timeline entries
  const { data: recentEvents, error } = await supabase
    .from('timeline')
    .select('id')
    .eq('claim_id', claimId)
    .gte('date', cutoffDate.toISOString())
    .limit(1);

  if (error) {
    console.error(`Error verificando actividad reciente para ${claimId}:`, error);
    return false;
  }

  return recentEvents && recentEvents.length > 0;
}

/**
 * Closes a claim due to legal stagnation
 */
async function closeForLegalStagnation(claim: Claim, yearsInState: number): Promise<CloseResult> {
  console.log(
    `   🔒 ${claim.numero_siniestro}: Cerrando por estancamiento jurídico (${yearsInState} años)`
  );

  const { error } = await supabase
    .from('claims')
    .update({
      estado_interno: 'PRESCRIPCIÓN',
      finalizado: true,
      fecha_finalizacion: new Date().toISOString(),
      alert_level: 'resolved',
      updatedAt: new Date().toISOString(),
    })
    .eq('id_softseguros', claim.id_softseguros);

  if (error) {
    return {
      claimId: claim.id_softseguros,
      claimNumber: claim.numero_siniestro,
      success: false,
      reason: 'legal_stagnation',
      message: 'Error al cerrar por estancamiento',
      error: error.message,
    };
  }

  // Create system timeline entry
  await createSystemTimelineEntry(
    claim.id_softseguros,
    'PRESCRIPCIÓN',
    `Cierre automático por estancamiento jurídico. Tiempo en proceso: ${yearsInState} años. ` +
      `Sin actividad registrada en los últimos meses.`
  );

  // Create audit log entry
  await createAuditLogEntry(claim.id_softseguros, 'AUTO_CLOSE_LEGAL_STAGNATION', {
    years_in_process: yearsInState,
    last_state_change: claim.lastStateChangeDate,
    closure_type: 'LEGAL_STAGNATION',
  });

  return {
    claimId: claim.id_softseguros,
    claimNumber: claim.numero_siniestro,
    success: true,
    reason: 'legal_stagnation',
    message: `Cerrado por estancamiento jurídico (${yearsInState} años)`,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets auto-close configuration from database
 */
async function getAutoCloseConfig(): Promise<AutoCloseConfig> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'auto_close_rules')
      .single();

    if (error || !data) {
      console.warn('Using default auto-close config:', error?.message);
      return getDefaultAutoCloseConfig();
    }

    return data.config_value as AutoCloseConfig;
  } catch (err) {
    console.warn('Error fetching auto-close config, using defaults:', err);
    return getDefaultAutoCloseConfig();
  }
}

/**
 * Default auto-close configuration
 */
function getDefaultAutoCloseConfig(): AutoCloseConfig {
  return {
    highValueThreshold: 50000000, // $50M
    highPriorityExclusion: [Priority.ALTA],
    autoCloseStates: ['PRESCRIPCIÓN'],
    pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN' as InternalState,
  };
}

/**
 * Creates a timeline entry for the claim
 */
async function createTimelineEntry(claimId: string, text: string): Promise<void> {
  await supabase.from('timeline').insert({
    claim_id: claimId,
    date: new Date().toISOString(),
    author: 'Sistema',
    text,
    isSystem: true,
  });
}

/**
 * Creates a system timeline entry with proper formatting
 */
async function createSystemTimelineEntry(
  claimId: string,
  state: InternalState,
  description: string
): Promise<void> {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const entryText = `Fecha: ${formattedDate} - Funcionario: Sistema - Seg: "${state}" ${description}`;

  await createTimelineEntry(claimId, entryText);
}

/**
 * Creates an audit log entry
 */
async function createAuditLogEntry(
  claimId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  await supabase.from('audit_logs').insert({
    action,
    entity_type: 'claim',
    entity_id: claimId,
    details,
    created_at: new Date().toISOString(),
  });
}
