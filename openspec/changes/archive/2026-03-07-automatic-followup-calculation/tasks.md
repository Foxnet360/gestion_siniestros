## 1. Database Schema and Configuration

- [x] 1.1 Create `app_config` table with fields: id, config_key (unique), config_value (JSONB), description, updated_at, updated_by
- [x] 1.2 Add indexes on `app_config(config_key)` and `app_config(updated_at)`
- [x] 1.3 Insert initial configuration records: follow_up_rules, prescription_rules, alert_thresholds, notification_settings
- [x] 1.4 Add columns to `claims` table: `alert_level` (VARCHAR), `fecha_prescripcion_ordinaria` (DATE), `fecha_prescripcion_extraordinaria` (DATE)
- [x] 1.5 Create indexes on `claims(fecha_prescripcion_ordinaria)`, `claims(fecha_prescripcion_extraordinaria)`, `claims(alert_level, estado_interno)`
- [x] 1.6 Create index on `claims(proximo_seguimiento, estado_interno)` for alert queries
- [x] 1.7 Create database function `calculate_prescription_dates(claim_id UUID)` for recalculation
- [x] 1.8 Create migration script for existing claims to calculate prescription dates

## 2. Backend Services - Follow-Up Calculation

- [x] 2.1 Create `services/followUpCalculationService.ts` with function `calculateNextFollowUp(claim: Claim): Date`
- [x] 2.2 Implement rule retrieval from `app_config` with fallback defaults
- [x] 2.3 Implement calculation logic: standard phases (10 days), legal process (30 days default, max 60), prescription (10 days)
- [x] 2.4 Add function `recalculateOnStateChange(claimId: string, newState: InternalState): Promise<Date>`
- [x] 2.5 Create unit tests for follow-up calculation with different states
- [x] 2.6 Create unit tests for edge cases (missing config, invalid states)

## 3. Backend Services - Prescription Management

- [x] 3.1 Create `services/prescriptionService.ts` with function `calculatePrescriptionDates(claim: Claim): PrescriptionDates`
- [x] 3.2 Implement ordinary prescription calculation (2 years from fecha_ocurrencia)
- [x] 3.3 Implement extraordinary prescription calculation (5 years for RC and configured ramos)
- [x] 3.4 Add function `checkPrescriptionAlerts(): Promise<Alert[]>` to identify claims needing alerts
- [x] 3.5 Add function `getPrescriptionAlertLevel(claim: Claim): AlertLevel`
- [x] 3.6 Create unit tests for prescription calculations with different ramos
- [x] 3.7 Create unit tests for alert level determination

## 4. Backend Services - Alert System

- [x] 4.1 Create `services/alertService.ts` with functions for alert evaluation and notification
- [x] 4.2 Implement `evaluateAlerts(): Promise<void>` to check all claims and update alert_level
- [x] 4.3 Implement `sendAlertEmails(): Promise<void>` for individual alert emails
- [x] 4.4 Implement `sendDailyDigest(): Promise<void>` for grouped daily notifications
- [x] 4.5 Add email template for warning alerts (HTML with branding)
- [x] 4.6 Add email template for critical alerts (HTML with high priority)
- [x] 4.7 Add email template for daily digest (HTML with summary table)
- [x] 4.8 Create function to respect user notification preferences
- [x] 4.9 Create unit tests for alert evaluation logic
- [x] 4.10 Create integration tests for email sending

## 5. Backend Services - Auto-Close and Legal Stagnation

- [x] 5.1 Create `services/autoCloseService.ts` with function `processPrescriptionClosures(): Promise<CloseResult[]>`
- [x] 5.2 Implement prescription auto-close logic with exclusion for high-value/high-priority claims
- [x] 5.3 Add function `processLegalStagnation(): Promise<CloseResult[]>` for 5-year legal stagnation
- [x] 5.4 Implement system audit trail creation for auto-closures
- [x] 5.5 Add high-value threshold check (configurable, default $50M)
- [x] 5.6 Create `services/legalStagnationService.ts` with stagnation detection (integrated in autoCloseService.ts)
- [x] 5.7 Implement 24-month warning and 5-year auto-close for PROCESO JURÍDICO
- [x] 5.8 Add recent activity check to avoid false stagnation positives
- [x] 5.9 Create unit tests for auto-close logic with various claim types
- [x] 5.10 Create unit tests for legal stagnation detection

## 6. Backend Services - Configuration Management

- [x] 6.1 Create `services/configService.ts` with CRUD operations for app_config
- [x] 6.2 Implement `getConfig(key: string): ConfigValue` with validation and defaults
- [x] 6.3 Implement `updateConfig(key: string, value: any, userId: string): Promise<void>`
- [x] 6.4 Add configuration validation (schema validation for JSONB values)
- [x] 6.5 Implement audit logging for configuration changes
- [x] 6.6 Add hot-reload capability (no caching, read from DB each time)
- [x] 6.7 Create unit tests for configuration retrieval
- [x] 6.8 Create unit tests for configuration validation

## 7. Edge Function - Daily Processing

- [x] 7.1 Create Supabase Edge Function `process-auto-closures` in `supabase/functions/auto-closures/`
- [x] 7.2 Implement scheduled invocation (daily at 2:00 AM)
- [x] 7.3 Add logic to call alert evaluation, prescription closures, and legal stagnation processing
- [x] 7.4 Implement error handling and retry logic
- [x] 7.5 Add logging for processed claims count and errors
- [x] 7.6 Create report generation (JSON) of daily processing results
- [x] 7.7 Configure cron trigger in Supabase dashboard (documentado en deploy)
- [x] 7.8 Test Edge Function with sample data

## 8. Frontend - EditTrackingTab Modifications

- [x] 8.1 Modify `EditTrackingTab.tsx` to call `calculateNextFollowUp` on component mount
- [x] 8.2 Display calculated date as default value in date picker
- [x] 8.3 Add visual indicator for calculated vs overridden dates (badge/icon)
- [x] 8.4 Implement recalculation when `estado_interno` changes in the dropdown
- [x] 8.5 Add warning display when date is beyond prescription deadline
- [x] 8.6 Add "Restaurar fecha calculada" button when date is overridden
- [x] 8.7 Implement prescription date display in the tab (read-only info)
- [x] 8.8 Update tests for EditTrackingTab with new behavior

## 9. Frontend - Alert Components

- [x] 9.1 Create `components/AlertBadge.tsx` for warning and critical indicators
- [x] 9.2 Implement alert display in `ClaimsTable.tsx` (column or overlay)
- [x] 9.3 Add alert summary in `Dashboard.tsx` (counts by severity)
- [x] 9.4 Create alert detail modal `components/AlertDetailModal.tsx`
- [x] 9.5 Implement tooltip/hover for alert information
- [x] 9.6 Add priority sorting for claims with critical alerts
- [x] 9.7 Create `components/AlertsPanel.tsx` for dedicated alerts view
- [x] 9.8 Add filter option for alert level in claims filters

## 10. Frontend - Configuration UI

- [x] 10.1 Create `components/BusinessRulesConfig.tsx` page (ADMIN only)
- [x] 10.2 Implement editable form for follow_up_rules (days per phase/state)
- [x] 10.3 Implement editable form for prescription_rules (years, ramos)
- [x] 10.4 Implement editable form for alert_thresholds (days)
- [x] 10.5 Add validation for configuration values
- [x] 10.6 Implement save functionality with audit logging
- [x] 10.7 Add preview of calculated dates with new rules
- [x] 10.8 Create confirmation modal for critical configuration changes

## 11. Frontend - User Preferences

- [x] 11.1 Add notification settings section in `UserProfile.tsx` (componente NotificationSettings creado)
- [x] 11.2 Implement toggle for email notifications (on/off)
- [x] 11.3 Add digest frequency selector (daily/weekly/off)
- [x] 11.4 Implement critical alert override (always notify for critical)
- [x] 11.5 Save preferences to user metadata or separate table (tabla user_preferences creada)
- [x] 11.6 Create `hooks/useNotificationPreferences.ts`

## 12. Data Migration

- [x] 12.1 Create script to calculate prescription dates for all existing claims
- [x] 12.2 Create script to initialize alert levels for existing claims
- [x] 12.3 Implement batch processing to avoid timeout (process in chunks)
- [x] 12.4 Add validation queries to verify migration completeness
- [x] 12.5 Create rollback script in case of issues
- [x] 12.6 Generate migration report (counts, errors, sample data)
- [x] 12.7 Test migration script with copy of production data

## 13. Testing

- [x] 13.1 Create unit tests for `FollowUpCalculationService` (all states)
- [x] 13.2 Create unit tests for `PrescriptionService` (ordinary and extraordinary)
- [x] 13.3 Create unit tests for `AlertService` (alert levels, notifications)
- [x] 13.4 Create unit tests for `AutoCloseService` (prescription and stagnation)
- [x] 13.5 Create unit tests for `ConfigService` (CRUD, validation)
- [x] 13.6 Create integration tests for Edge Function
- [x] 13.7 Create E2E tests for EditTrackingTab with auto-calculation
- [x] 13.8 Create E2E tests for alert display and filtering
- [x] 13.9 Create E2E tests for business rules configuration
- [x] 13.10 Create E2E tests for auto-close scenarios
- [x] 13.11 Add performance tests for daily processing job

## 14. Documentation

- [x] 14.1 Document API for all new services (JSDoc comments)
- [x] 14.2 Create user guide for technicians (how follow-up dates work)
- [x] 14.3 Create admin guide for business rules configuration
- [x] 14.4 Document prescription management workflow
- [x] 14.5 Create troubleshooting guide for common alert issues
- [x] 14.6 Document database schema changes
- [x] 14.7 Update README with new environment variables (if any)

## 15. Deployment

- [x] 15.1 Create feature flag `AUTO_FOLLOWUP_ENABLED` (default false)
- [x] 15.2 Deploy database migrations (app_config table, new columns)
- [x] 15.3 Deploy Edge Function to Supabase
- [x] 15.4 Run data migration scripts in production
- [x] 15.5 Deploy backend services
- [x] 15.6 Deploy frontend changes
- [x] 15.7 Enable feature flag for beta users
- [x] 15.8 Monitor error rates and performance for 1 week
- [x] 15.9 Enable feature flag for all users
- [x] 15.10 Create runbook for daily processing monitoring
