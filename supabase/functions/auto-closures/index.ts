import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProcessingResult {
  timestamp: string;
  alerts: {
    evaluated: number;
    updated: number;
    errors: number;
  };
  prescriptionClosures: {
    processed: number;
    autoClosed: number;
    pendingApproval: number;
    errors: number;
  };
  legalStagnation: {
    processed: number;
    warnings: number;
    autoClosed: number;
    errors: number;
  };
  emails: {
    criticalAlertsSent: number;
    digestsSent: number;
    errors: number;
  };
  duration: number;
}

interface AlertLevelCounts {
  normal: number;
  warning: number;
  critical: number;
  legal_stagnation_warning: number;
  legal_stagnation_critical: number;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async req => {
  const startTime = Date.now();

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    console.log('🚀 Iniciando procesamiento diario de siniestros...');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize result object
    const result: ProcessingResult = {
      timestamp: new Date().toISOString(),
      alerts: { evaluated: 0, updated: 0, errors: 0 },
      prescriptionClosures: { processed: 0, autoClosed: 0, pendingApproval: 0, errors: 0 },
      legalStagnation: { processed: 0, warnings: 0, autoClosed: 0, errors: 0 },
      emails: { criticalAlertsSent: 0, digestsSent: 0, errors: 0 },
      duration: 0,
    };

    // Step 1: Evaluate and update alert levels
    console.log('\n📊 Paso 1: Evaluando niveles de alerta...');
    const alertResult = await evaluateAlerts(supabase);
    result.alerts = alertResult;
    console.log(`   ✅ ${alertResult.updated} alertas actualizadas`);

    // Step 2: Process prescription closures
    console.log('\n🔒 Paso 2: Procesando cierres por prescripción...');
    const closureResult = await processPrescriptionClosures(supabase);
    result.prescriptionClosures = closureResult;
    console.log(`   ✅ ${closureResult.autoClosed} cerrados automáticamente`);
    console.log(`   ⏸️  ${closureResult.pendingApproval} pendientes de aprobación`);

    // Step 3: Process legal stagnation
    console.log('\n⚖️  Paso 3: Procesando estancamiento jurídico...');
    const stagnationResult = await processLegalStagnation(supabase);
    result.legalStagnation = stagnationResult;
    console.log(`   ✅ ${stagnationResult.warnings} alertas generadas`);
    console.log(`   ✅ ${stagnationResult.autoClosed} cerrados por estancamiento`);

    // Step 4: Send email notifications
    console.log('\n📧 Paso 4: Enviando notificaciones por email...');
    const emailResult = await sendNotifications(supabase);
    result.emails = emailResult;
    console.log(`   ✅ ${emailResult.criticalAlertsSent} alertas críticas enviadas`);
    console.log(`   ✅ ${emailResult.digestsSent} resúmenes diarios enviados`);

    // Calculate duration
    result.duration = Date.now() - startTime;

    // Log completion
    console.log('\n✅ Procesamiento completado');
    console.log(`⏱️  Duración: ${result.duration}ms`);

    // Save processing report to database
    await saveProcessingReport(supabase, result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Procesamiento diario completado',
        result,
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error en procesamiento:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      }),
      { headers, status: 500 }
    );
  }
});

// ============================================================================
// STEP 1: EVALUATE ALERTS
// ============================================================================

async function evaluateAlerts(
  supabase: any
): Promise<{ evaluated: number; updated: number; errors: number }> {
  try {
    // Get alert thresholds
    const { data: thresholds } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'alert_thresholds')
      .single();

    const alertThresholds = thresholds?.config_value || {
      prescription: { warning: 90, critical: 30 },
    };

    // Get all active claims
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

    if (error || !claims) {
      console.error('Error fetching claims:', error);
      return { evaluated: 0, updated: 0, errors: 1 };
    }

    let updated = 0;
    let errors = 0;

    for (const claim of claims) {
      try {
        const newAlertLevel = calculateAlertLevel(claim, alertThresholds);

        if (newAlertLevel !== claim.alert_level) {
          const { error: updateError } = await supabase
            .from('claims')
            .update({ alert_level: newAlertLevel })
            .eq('id_softseguros', claim.id_softseguros);

          if (updateError) {
            errors++;
          } else {
            updated++;
          }
        }
      } catch (err) {
        console.error(`Error processing claim ${claim.numero_siniestro}:`, err);
        errors++;
      }
    }

    return { evaluated: claims.length, updated, errors };
  } catch (err) {
    console.error('Error in evaluateAlerts:', err);
    return { evaluated: 0, updated: 0, errors: 1 };
  }
}

function calculateAlertLevel(claim: any, thresholds: any): string {
  // Check if claim is finalized
  if (claim.estado_interno === 'FINALIZADO' || claim.estado_interno === 'PAGADO') {
    return 'resolved';
  }

  // Get applicable prescription date
  const prescriptionDate = claim.fecha_prescripcion_extraordinaria
    ? new Date(claim.fecha_prescripcion_extraordinaria)
    : claim.fecha_prescripcion_ordinaria
      ? new Date(claim.fecha_prescripcion_ordinaria)
      : null;

  if (!prescriptionDate) {
    return claim.alert_level || 'normal';
  }

  const today = new Date();
  const daysRemaining = Math.ceil(
    (prescriptionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining <= 0) {
    return 'critical';
  } else if (daysRemaining <= thresholds.prescription.critical) {
    return 'critical';
  } else if (daysRemaining <= thresholds.prescription.warning) {
    return 'warning';
  }

  // Check for overdue follow-up
  if (claim.proximo_seguimiento) {
    const followUpDate = new Date(claim.proximo_seguimiento);
    if (followUpDate < today) {
      return 'warning';
    }
  }

  return 'normal';
}

// ============================================================================
// STEP 2: PRESCRIPTION CLOSURES
// ============================================================================

async function processPrescriptionClosures(
  supabase: any
): Promise<{ processed: number; autoClosed: number; pendingApproval: number; errors: number }> {
  try {
    // Get auto-close rules
    const { data: rules } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'auto_close_rules')
      .single();

    const autoCloseRules = rules?.config_value || {
      highValueThreshold: 50000000,
      highPriorityExclusion: ['ALTA'],
      pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
    };

    // Get claims with expired prescription
    const today = new Date().toISOString();
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO', 'PRESCRIPCIÓN'])
      .or(
        `fecha_prescripcion_ordinaria.lte.${today},fecha_prescripcion_extraordinaria.lte.${today}`
      );

    if (error || !claims) {
      console.error('Error fetching claims for closure:', error);
      return { processed: 0, autoClosed: 0, pendingApproval: 0, errors: 1 };
    }

    let autoClosed = 0;
    let pendingApproval = 0;
    let errors = 0;

    for (const claim of claims) {
      try {
        const isHighValue = claim.monto_reclamo >= autoCloseRules.highValueThreshold;
        const isHighPriority = autoCloseRules.highPriorityExclusion.includes(claim.prioridad);

        if (isHighValue || isHighPriority) {
          // Send for manual approval
          await supabase
            .from('claims')
            .update({
              estado_interno: autoCloseRules.pendingApprovalState,
              alert_level: 'critical',
            })
            .eq('id_softseguros', claim.id_softseguros);

          await createTimelineEntry(
            supabase,
            claim.id_softseguros,
            'Sistema',
            `Marcado para aprobación manual de cierre. Monto: $${claim.monto_reclamo.toLocaleString()}`
          );

          pendingApproval++;
        } else {
          // Auto-close
          const prescriptionType = claim.fecha_prescripcion_extraordinaria
            ? 'extraordinaria'
            : 'ordinaria';

          await supabase
            .from('claims')
            .update({
              estado_interno: 'PRESCRIPCIÓN',
              finalizado: true,
              fecha_finalizacion: new Date().toISOString(),
              alert_level: 'resolved',
            })
            .eq('id_softseguros', claim.id_softseguros);

          await createTimelineEntry(
            supabase,
            claim.id_softseguros,
            'Sistema',
            `Cierre automático por prescripción ${prescriptionType} alcanzada`
          );

          await createAuditLog(supabase, claim.id_softseguros, 'AUTO_CLOSE_PRESCRIPTION', {
            prescription_type: prescriptionType,
          });

          autoClosed++;
        }
      } catch (err) {
        console.error(`Error closing claim ${claim.numero_siniestro}:`, err);
        errors++;
      }
    }

    return { processed: claims.length, autoClosed, pendingApproval, errors };
  } catch (err) {
    console.error('Error in processPrescriptionClosures:', err);
    return { processed: 0, autoClosed: 0, pendingApproval: 0, errors: 1 };
  }
}

// ============================================================================
// STEP 3: LEGAL STAGNATION
// ============================================================================

async function processLegalStagnation(
  supabase: any
): Promise<{ processed: number; warnings: number; autoClosed: number; errors: number }> {
  try {
    // Get alert thresholds
    const { data: thresholds } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'alert_thresholds')
      .single();

    const alertThresholds = thresholds?.config_value || {
      legalStagnant: { warningMonths: 24, closeYears: 5 },
    };

    // Get claims in legal process
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('estado_interno', 'PROCESO JURÍDICO')
      .not('finalizado', 'eq', true);

    if (error || !claims) {
      console.error('Error fetching legal claims:', error);
      return { processed: 0, warnings: 0, autoClosed: 0, errors: 1 };
    }

    let warnings = 0;
    let autoClosed = 0;
    let errors = 0;

    for (const claim of claims) {
      try {
        const lastChange = new Date(claim.lastStateChangeDate);
        const today = new Date();

        const monthsInState =
          (today.getFullYear() - lastChange.getFullYear()) * 12 +
          (today.getMonth() - lastChange.getMonth());
        const yearsInState = today.getFullYear() - lastChange.getFullYear();

        // Check for recent activity
        const hasRecentActivity = await checkRecentActivity(supabase, claim.id_softseguros, 6);

        if (hasRecentActivity) {
          // Reset alert if there was recent activity
          if (claim.alert_level?.includes('legal_stagnation')) {
            await supabase
              .from('claims')
              .update({ alert_level: 'normal' })
              .eq('id_softseguros', claim.id_softseguros);
          }
          continue;
        }

        // Auto-close at 5 years
        if (yearsInState >= alertThresholds.legalStagnant.closeYears) {
          await supabase
            .from('claims')
            .update({
              estado_interno: 'PRESCRIPCIÓN',
              finalizado: true,
              fecha_finalizacion: new Date().toISOString(),
              alert_level: 'resolved',
            })
            .eq('id_softseguros', claim.id_softseguros);

          await createTimelineEntry(
            supabase,
            claim.id_softseguros,
            'Sistema',
            `Cierre automático por estancamiento jurídico (${yearsInState} años)`
          );

          await createAuditLog(supabase, claim.id_softseguros, 'AUTO_CLOSE_LEGAL_STAGNATION', {
            years_in_process: yearsInState,
          });

          autoClosed++;
        }
        // Warning at 24 months
        else if (monthsInState >= alertThresholds.legalStagnant.warningMonths) {
          const isCritical = monthsInState >= 54; // 4.5 years
          const alertLevel = isCritical ? 'legal_stagnation_critical' : 'legal_stagnation_warning';

          if (claim.alert_level !== alertLevel) {
            await supabase
              .from('claims')
              .update({ alert_level: alertLevel })
              .eq('id_softseguros', claim.id_softseguros);

            warnings++;
          }
        }
      } catch (err) {
        console.error(`Error processing legal stagnation for ${claim.numero_siniestro}:`, err);
        errors++;
      }
    }

    return { processed: claims.length, warnings, autoClosed, errors };
  } catch (err) {
    console.error('Error in processLegalStagnation:', err);
    return { processed: 0, warnings: 0, autoClosed: 0, errors: 1 };
  }
}

async function checkRecentActivity(
  supabase: any,
  claimId: string,
  months: number
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const { data, error } = await supabase
    .from('timeline')
    .select('id')
    .eq('claim_id', claimId)
    .gte('date', cutoffDate.toISOString())
    .limit(1);

  if (error) {
    console.error(`Error checking recent activity for ${claimId}:`, error);
    return false;
  }

  return data && data.length > 0;
}

// ============================================================================
// STEP 4: SEND NOTIFICATIONS
// ============================================================================

async function sendNotifications(
  supabase: any
): Promise<{ criticalAlertsSent: number; digestsSent: number; errors: number }> {
  let criticalAlertsSent = 0;
  let digestsSent = 0;
  let errors = 0;

  try {
    // Get notification settings
    const { data: settings } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', 'notification_settings')
      .single();

    const notificationSettings = settings?.config_value || { email: true, dailyDigest: true };

    if (!notificationSettings.email) {
      console.log('   ℹ️ Email notifications disabled');
      return { criticalAlertsSent: 0, digestsSent: 0, errors: 0 };
    }

    // Send critical alerts
    const { data: criticalClaims } = await supabase
      .from('claims')
      .select('*, users:tecnico_id(*)')
      .eq('alert_level', 'critical')
      .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

    if (criticalClaims) {
      for (const claim of criticalClaims) {
        if (claim.users?.email) {
          // Here you would integrate with your email service
          // await sendCriticalAlertEmail(claim.users.email, claim);
          console.log(
            `   📧 Would send critical alert to ${claim.users.email} for ${claim.numero_siniestro}`
          );
          criticalAlertsSent++;
        }
      }
    }

    // Send daily digests
    if (notificationSettings.dailyDigest) {
      const { data: users } = await supabase.from('users').select('*').eq('is_active', true);

      if (users) {
        for (const user of users) {
          const { data: userClaims } = await supabase
            .from('claims')
            .select('*')
            .eq('tecnico_id', user.id)
            .in('alert_level', ['warning', 'critical'])
            .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

          if (userClaims && userClaims.length > 0 && user.email) {
            // Here you would integrate with your email service
            // await sendDigestEmail(user.email, userClaims);
            console.log(`   📧 Would send digest to ${user.email} (${userClaims.length} claims)`);
            digestsSent++;
          }
        }
      }
    }

    return { criticalAlertsSent, digestsSent, errors };
  } catch (err) {
    console.error('Error in sendNotifications:', err);
    return { criticalAlertsSent, digestsSent, errors: errors + 1 };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createTimelineEntry(
  supabase: any,
  claimId: string,
  author: string,
  text: string
): Promise<void> {
  await supabase.from('timeline').insert({
    claim_id: claimId,
    date: new Date().toISOString(),
    author,
    text,
    isSystem: true,
  });
}

async function createAuditLog(
  supabase: any,
  claimId: string,
  action: string,
  details: any
): Promise<void> {
  await supabase.from('audit_logs').insert({
    action,
    entity_type: 'claim',
    entity_id: claimId,
    details,
    created_at: new Date().toISOString(),
  });
}

async function saveProcessingReport(supabase: any, result: ProcessingResult): Promise<void> {
  await supabase.from('processing_reports').insert({
    timestamp: result.timestamp,
    duration: result.duration,
    alerts_evaluated: result.alerts.evaluated,
    alerts_updated: result.alerts.updated,
    closures_auto: result.prescriptionClosures.autoClosed,
    closures_pending: result.prescriptionClosures.pendingApproval,
    stagnation_warnings: result.legalStagnation.warnings,
    stagnation_closed: result.legalStagnation.autoClosed,
    emails_critical: result.emails.criticalAlertsSent,
    emails_digests: result.emails.digestsSent,
    total_errors:
      result.alerts.errors +
      result.prescriptionClosures.errors +
      result.legalStagnation.errors +
      result.emails.errors,
  });
}
