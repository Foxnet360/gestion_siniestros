/**
 * @fileoverview Alert Service
 *
 * This service provides comprehensive alert management for insurance claims,
 * including alert evaluation, email notifications, and daily digest generation.
 *
 * **Key Features:**
 * - Automatic alert level evaluation based on prescription dates and follow-up status
 * - Individual email alerts for critical conditions
 * - Daily/weekly digest emails with alert summaries
 * - User notification preferences management
 * - HTML email templates with branding
 *
 * **Alert Types:**
 * - **Prescription Alerts**: Based on days remaining until prescription deadline
 * - **Overdue Follow-up**: When follow-up date has passed
 * - **Legal Stagnation**: For claims in legal process for extended periods
 *
 * **Alert Levels:**
 * - `normal`: More than 90 days until prescription
 * - `warning`: 30-90 days until prescription
 * - `critical`: Less than 30 days until prescription or expired
 * - `legal_stagnation_warning`: 24 months in legal process
 * - `legal_stagnation_critical`: 5 years in legal process
 *
 * @module services/alertService
 * @requires ../lib/supabase
 * @requires ../types
 * @requires ./followUpCalculationService
 * @requires ./prescriptionService
 * @requires date-fns
 *
 * @example
 * ```typescript
 * import {
 *   evaluateAlerts,
 *   sendAlertEmails,
 *   sendDailyDigest,
 *   getNotificationPreferences
 * } from './alertService';
 *
 * // Evaluate all claims and update alert levels
 * const result = await evaluateAlerts();
 * console.log(`${result.updated} alerts updated`);
 *
 * // Send critical alert emails
 * await sendAlertEmails();
 *
 * // Send daily digest to all users
 * await sendDailyDigest();
 * ```
 */

import { supabase } from '../lib/supabase';
import { Claim, User } from '../types';
import { AlertLevel, getAlertThresholds } from './followUpCalculationService';
import { getApplicablePrescriptionDate, getPrescriptionAlertLevel } from './prescriptionService';
import { differenceInDays, format } from 'date-fns';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AlertNotification {
  claimId: string;
  claimNumber: string;
  insured: string;
  alertLevel: AlertLevel;
  alertType: 'prescription' | 'overdue_followup' | 'legal_stagnation';
  daysRemaining: number;
  message: string;
  recipientEmail: string;
  recipientName: string;
}

export interface DailyDigest {
  date: string;
  userEmail: string;
  userName: string;
  criticalCount: number;
  warningCount: number;
  alerts: AlertNotification[];
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  dailyDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'off';
  criticalOverride: boolean;
}

// ============================================================================
// ALERT EVALUATION
// ============================================================================

/**
 * Evaluates all active claims and updates their alert levels.
 *
 * This function should be called periodically (e.g., daily via cron job) to:
 * 1. Fetch all non-finalized claims
 * 2. Calculate current alert level based on prescription dates
 * 3. Check for overdue follow-ups
 * 4. Update alert_level in database if changed
 * 5. Return summary of updates
 *
 * **Alert Evaluation Logic:**
 * - Claims with prescription within 30 days → `critical`
 * - Claims with prescription within 90 days → `warning`
 * - Claims with overdue follow-up → `warning`
 * - Finalized/Paid claims → `resolved`
 *
 * @async
 * @function evaluateAlerts
 * @returns {Promise<{ updated: number; errors: number }>} Summary of updates
 * @returns {number} updated - Number of claims with updated alert levels
 * @returns {number} errors - Number of errors encountered during evaluation
 *
 * @example
 * ```typescript
 * // Run daily evaluation
 * const result = await evaluateAlerts();
 * console.log(`Updated: ${result.updated}, Errors: ${result.errors}`);
 * // Output: "Updated: 15, Errors: 0"
 * ```
 *
 * @see {@link getPrescriptionAlertLevel}
 * @see {@link updateAlertLevel}
 */
export async function evaluateAlerts(): Promise<{ updated: number; errors: number }> {
  console.log('🔍 Evaluando alertas de siniestros...');

  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

  if (error || !claims) {
    console.error('❌ Error al obtener siniestros:', error);
    return { updated: 0, errors: 1 };
  }

  let updated = 0;
  let errors = 0;

  for (const claim of claims as Claim[]) {
    try {
      // Get current alert level
      const currentLevel = claim.alert_level || 'normal';

      // Calculate new alert level based on prescription
      const newLevel = await getPrescriptionAlertLevel(claim);

      // Check for overdue follow-up
      if (claim.proximo_seguimiento) {
        const followUpDate = new Date(claim.proximo_seguimiento);
        const today = new Date();
        const daysOverdue = differenceInDays(today, followUpDate);

        if (daysOverdue > 0 && newLevel === 'normal') {
          // Upgrade to warning if follow-up is overdue
          await updateAlertLevel(claim.id_softseguros, 'warning');
          updated++;
          continue;
        }
      }

      // Update if changed
      if (newLevel !== currentLevel) {
        const success = await updateAlertLevel(claim.id_softseguros, newLevel);
        if (success) {
          updated++;
          console.log(`   🔔 ${claim.numero_siniestro}: ${currentLevel} → ${newLevel}`);
        } else {
          errors++;
        }
      }
    } catch (err) {
      console.error(`   ❌ Error evaluando ${claim.numero_siniestro}:`, err);
      errors++;
    }
  }

  console.log(`✅ Evaluación completada: ${updated} actualizados, ${errors} errores`);
  return { updated, errors };
}

/**
 * Updates the alert level for a specific claim
 */
async function updateAlertLevel(claimId: string, level: AlertLevel): Promise<boolean> {
  const { error } = await supabase
    .from('claims')
    .update({ alert_level: level })
    .eq('id_softseguros', claimId);

  if (error) {
    console.error(`Error actualizando alert_level para ${claimId}:`, error);
    return false;
  }

  return true;
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Sends individual alert emails for critical alerts
 */
export async function sendAlertEmails(): Promise<{ sent: number; errors: number }> {
  console.log('📧 Enviando emails de alertas individuales...');

  // Get all critical alerts
  const { data: criticalClaims, error } = await supabase
    .from('claims')
    .select('*')
    .eq('alert_level', 'critical')
    .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO']);

  if (error) {
    console.error('❌ Error al obtener siniestros críticos:', error);
    return { sent: 0, errors: 1 };
  }

  if (!criticalClaims || criticalClaims.length === 0) {
    console.log('   ℹ️ No hay alertas críticas para enviar');
    return { sent: 0, errors: 0 };
  }

  let sent = 0;
  let errors = 0;

  for (const claim of criticalClaims as Claim[]) {
    try {
      // Get technician assigned to claim
      const technician = await getTechnicianForClaim(claim);
      if (!technician) {
        console.warn(`   ⚠️ No se encontró técnico para ${claim.numero_siniestro}`);
        continue;
      }

      // Check user preferences
      const prefs = await getNotificationPreferences(technician.id);
      if (!prefs.emailEnabled && !prefs.criticalOverride) {
        console.log(`   ⏭️ Usuario ${technician.email} tiene notificaciones deshabilitadas`);
        continue;
      }

      // Prepare notification
      const prescriptionDate = getApplicablePrescriptionDate(claim);
      const daysRemaining = prescriptionDate ? differenceInDays(prescriptionDate, new Date()) : 0;

      const notification: AlertNotification = {
        claimId: claim.id_softseguros,
        claimNumber: claim.numero_siniestro,
        insured: claim.asegurado,
        alertLevel: 'critical',
        alertType: 'prescription',
        daysRemaining,
        message: generateAlertMessage(claim, daysRemaining),
        recipientEmail: technician.email,
        recipientName: technician.name,
      };

      // Send email (placeholder - integrate with email service)
      await sendCriticalAlertEmail(notification);
      sent++;

      console.log(`   ✅ Email enviado a ${technician.email} para ${claim.numero_siniestro}`);
    } catch (err) {
      console.error(`   ❌ Error enviando email para ${claim.numero_siniestro}:`, err);
      errors++;
    }
  }

  console.log(`✅ Emails enviados: ${sent}, Errores: ${errors}`);
  return { sent, errors };
}

/**
 * Sends daily digest emails to all users with active claims
 */
export async function sendDailyDigest(): Promise<{ sent: number; errors: number }> {
  console.log('📬 Enviando resumen diario...');

  // Get all users with notification preferences
  const { data: users, error } = await supabase.from('users').select('*').eq('is_active', true);

  if (error || !users) {
    console.error('❌ Error al obtener usuarios:', error);
    return { sent: 0, errors: 1 };
  }

  let sent = 0;
  let errors = 0;

  for (const user of users as User[]) {
    try {
      // Check user preferences
      const prefs = await getNotificationPreferences(user.id);
      if (!prefs.dailyDigest || prefs.digestFrequency === 'off') {
        continue;
      }

      // Skip if weekly and not the right day (e.g., Monday)
      if (prefs.digestFrequency === 'weekly' && new Date().getDay() !== 1) {
        continue;
      }

      // Get claims assigned to this user
      const { data: userClaims, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .eq('tecnico_id', user.id)
        .not('estado_interno', 'in', ['FINALIZADO', 'PAGADO'])
        .in('alert_level', ['warning', 'critical']);

      if (claimsError || !userClaims || userClaims.length === 0) {
        continue;
      }

      // Prepare digest
      const alerts: AlertNotification[] = (userClaims as Claim[]).map(claim => {
        const prescriptionDate = getApplicablePrescriptionDate(claim);
        const daysRemaining = prescriptionDate ? differenceInDays(prescriptionDate, new Date()) : 0;

        return {
          claimId: claim.id_softseguros,
          claimNumber: claim.numero_siniestro,
          insured: claim.asegurado,
          alertLevel: claim.alert_level || 'warning',
          alertType: 'prescription',
          daysRemaining,
          message: generateAlertMessage(claim, daysRemaining),
          recipientEmail: user.email,
          recipientName: user.name,
        };
      });

      const digest: DailyDigest = {
        date: format(new Date(), 'yyyy-MM-dd'),
        userEmail: user.email,
        userName: user.name,
        criticalCount: alerts.filter(a => a.alertLevel === 'critical').length,
        warningCount: alerts.filter(a => a.alertLevel === 'warning').length,
        alerts,
      };

      // Send digest email (placeholder)
      await sendDigestEmail(digest);
      sent++;

      console.log(`   ✅ Resumen enviado a ${user.email} (${alerts.length} alertas)`);
    } catch (err) {
      console.error(`   ❌ Error enviando resumen a ${user.email}:`, err);
      errors++;
    }
  }

  console.log(`✅ Resúmenes enviados: ${sent}, Errores: ${errors}`);
  return { sent, errors };
}

// ============================================================================
// USER NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Gets notification preferences for a user
 * Returns defaults if not set
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('notification_settings')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return defaults
    return {
      emailEnabled: true,
      dailyDigest: true,
      digestFrequency: 'daily',
      criticalOverride: true,
    };
  }

  return data.notification_settings as NotificationPreferences;
}

/**
 * Updates notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<boolean> {
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: userId,
    notification_settings: preferences,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`Error actualizando preferencias para ${userId}:`, error);
    return false;
  }

  return true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the technician assigned to a claim
 */
async function getTechnicianForClaim(claim: Claim): Promise<User | null> {
  if (!claim.tecnico_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', claim.tecnico_id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

/**
 * Generates alert message based on claim and days remaining
 */
function generateAlertMessage(claim: Claim, daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return `¡URGENTE! El siniestro ${claim.numero_siniestro} de ${claim.asegurado} ha vencido su prescripción. Requiere acción inmediata.`;
  } else if (daysRemaining <= 7) {
    return `CRÍTICO: El siniestro ${claim.numero_siniestro} vence en ${daysRemaining} días. Prioridad alta.`;
  } else if (daysRemaining <= 30) {
    return `IMPORTANTE: El siniestro ${claim.numero_siniestro} vence en ${daysRemaining} días. Requiere seguimiento.`;
  } else {
    return `El siniestro ${claim.numero_siniestro} vence en ${daysRemaining} días.`;
  }
}

/**
 * Placeholder for sending critical alert emails
 * Integrate with your email service (SendGrid, AWS SES, etc.)
 */
async function sendCriticalAlertEmail(notification: AlertNotification): Promise<void> {
  // TODO: Integrate with email service
  console.log(`   📧 [EMAIL SERVICE] Alerta crítica a ${notification.recipientEmail}`);
  console.log(`      Asunto: Alerta Crítica - Siniestro ${notification.claimNumber}`);
  console.log(`      Mensaje: ${notification.message}`);
}

/**
 * Placeholder for sending digest emails
 * Integrate with your email service
 */
async function sendDigestEmail(digest: DailyDigest): Promise<void> {
  // TODO: Integrate with email service
  console.log(`   📧 [EMAIL SERVICE] Resumen diario a ${digest.userEmail}`);
  console.log(
    `      Asunto: Resumen Diario - ${digest.criticalCount} críticas, ${digest.warningCount} advertencias`
  );
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generates HTML for critical alert email
 */
export function generateCriticalAlertHtml(notification: AlertNotification): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .claim-info { background: #f8fafc; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Alerta Crítica</h1>
    </div>
    <div class="content">
      <p>Hola ${notification.recipientName},</p>
      
      <div class="alert-box">
        <strong>¡Atención Urgente!</strong><br>
        ${notification.message}
      </div>
      
      <div class="claim-info">
        <h3>Detalles del Siniestro</h3>
        <p><strong>Número:</strong> ${notification.claimNumber}</p>
        <p><strong>Asegurado:</strong> ${notification.insured}</p>
        <p><strong>Días restantes:</strong> ${notification.daysRemaining <= 0 ? 'VENCIDO' : notification.daysRemaining}</p>
      </div>
      
      <a href="https://softseguros.com/siniestros/${notification.claimId}" class="button">Ver Siniestro</a>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del Sistema de Gestión de Siniestros</p>
      <p>SoftSeguros © 2026</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates HTML for warning alert email
 */
export function generateWarningAlertHtml(notification: AlertNotification): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .alert-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .claim-info { background: #f8fafc; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Advertencia</h1>
    </div>
    <div class="content">
      <p>Hola ${notification.recipientName},</p>
      
      <div class="alert-box">
        <strong>Atención:</strong><br>
        ${notification.message}
      </div>
      
      <div class="claim-info">
        <h3>Detalles del Siniestro</h3>
        <p><strong>Número:</strong> ${notification.claimNumber}</p>
        <p><strong>Asegurado:</strong> ${notification.insured}</p>
        <p><strong>Días restantes:</strong> ${notification.daysRemaining}</p>
      </div>
      
      <a href="https://softseguros.com/siniestros/${notification.claimId}" class="button">Ver Siniestro</a>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del Sistema de Gestión de Siniestros</p>
      <p>SoftSeguros © 2026</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates HTML for daily digest email
 */
export function generateDigestHtml(digest: DailyDigest): string {
  const alertsList = digest.alerts
    .map(
      alert => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px;">${alert.claimNumber}</td>
      <td style="padding: 12px;">${alert.insured}</td>
      <td style="padding: 12px;">
        <span style="background: ${alert.alertLevel === 'critical' ? '#fecaca' : '#fed7aa'}; 
                     color: ${alert.alertLevel === 'critical' ? '#991b1b' : '#92400e'}; 
                     padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${alert.alertLevel === 'critical' ? 'CRÍTICA' : 'ADVERTENCIA'}
        </span>
      </td>
      <td style="padding: 12px;">${alert.daysRemaining <= 0 ? 'VENCIDO' : alert.daysRemaining + ' días'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .summary { display: flex; justify-content: space-around; padding: 20px; background: #f8fafc; }
    .summary-box { text-align: center; }
    .summary-number { font-size: 32px; font-weight: bold; }
    .summary-label { font-size: 14px; color: #64748b; }
    .content { padding: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Resumen Diario de Alertas</h1>
      <p>${format(new Date(digest.date), 'dd/MM/yyyy')}</p>
    </div>
    
    <div class="summary">
      <div class="summary-box">
        <div class="summary-number" style="color: #dc2626;">${digest.criticalCount}</div>
        <div class="summary-label">Críticas</div>
      </div>
      <div class="summary-box">
        <div class="summary-number" style="color: #f59e0b;">${digest.warningCount}</div>
        <div class="summary-label">Advertencias</div>
      </div>
      <div class="summary-box">
        <div class="summary-number" style="color: #3b82f6;">${digest.alerts.length}</div>
        <div class="summary-label">Total</div>
      </div>
    </div>
    
    <div class="content">
      <h2>Siniestros Requieren Atención</h2>
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Asegurado</th>
            <th>Nivel</th>
            <th>Tiempo</th>
          </tr>
        </thead>
        <tbody>
          ${alertsList}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Este es un resumen automático del Sistema de Gestión de Siniestros</p>
      <p>SoftSeguros © 2026</p>
    </div>
  </div>
</body>
</html>
  `;
}
