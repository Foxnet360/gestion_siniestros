/**
 * @fileoverview Configuration Management Service
 *
 * This service provides centralized configuration management for the application,
 * storing business rules and settings in the database with validation and audit logging.
 *
 * **Supported Configuration Types:**
 * - **follow_up_rules**: Follow-up date calculation rules
 * - **prescription_rules**: Prescription period configuration
 * - **alert_thresholds**: Alert level thresholds
 * - **notification_settings**: Email notification preferences
 * - **auto_close_rules**: Auto-closure parameters
 *
 * **Features:**
 * - CRUD operations for all configuration types
 * - Schema validation with detailed error messages
 * - Audit logging for all changes
 * - Hot-reload capability (no caching)
 * - Fallback to defaults on database errors
 * - Configuration comparison utilities
 *
 * **Validation:**
 * All configurations are validated against predefined schemas before saving.
 * Invalid configurations are rejected with detailed error messages.
 *
 * @module services/configService
 * @requires ../lib/supabase
 * @requires ./auditService
 *
 * @example
 * ```typescript
 * import {
 *   getConfig,
 *   updateConfig,
 *   getAllConfigs,
 *   validateConfig
 * } from './configService';
 *
 * // Get a specific configuration
 * const rules = await getConfig('follow_up_rules');
 *
 * // Update configuration (with validation and audit logging)
 * await updateConfig('follow_up_rules', newRules, 'admin-user-id');
 *
 * // Get all configurations
 * const allConfigs = await getAllConfigs();
 * ```
 */

import { supabase } from '../lib/supabase';
import { logAction } from './auditService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AppConfig {
  id: number;
  config_key: string;
  config_value: ConfigValue;
  description: string;
  updated_at: string;
  updated_by: string;
}

export type ConfigValue =
  | FollowUpRules
  | PrescriptionRules
  | AlertThresholds
  | NotificationSettings
  | AutoCloseRules
  | Record<string, any>;

export interface FollowUpRules {
  standard: {
    phases: number[];
    days: number;
    description: string;
  };
  legal: {
    state: string;
    minDays: number;
    maxDays: number;
    defaultDays: number;
    description: string;
  };
  prescription: {
    state: string;
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

export interface NotificationSettings {
  ui: boolean;
  email: boolean;
  dailyDigest: boolean;
  digestTime: string;
  criticalOverride: boolean;
  description: string;
}

export interface AutoCloseRules {
  highValueThreshold: number;
  highPriorityExclusion: string[];
  autoCloseStates: string[];
  pendingApprovalState: string;
  description: string;
}

export type ConfigKey =
  | 'follow_up_rules'
  | 'prescription_rules'
  | 'alert_thresholds'
  | 'notification_settings'
  | 'auto_close_rules';

export interface ConfigValidationError {
  field: string;
  message: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_FOLLOW_UP_RULES: FollowUpRules = {
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

export const DEFAULT_PRESCRIPTION_RULES: PrescriptionRules = {
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

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
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

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  ui: true,
  email: true,
  dailyDigest: true,
  digestTime: '08:00',
  criticalOverride: true,
  description: 'Configuración de canales de notificación',
};

export const DEFAULT_AUTO_CLOSE_RULES: AutoCloseRules = {
  highValueThreshold: 50000000,
  highPriorityExclusion: ['ALTA'],
  autoCloseStates: ['PRESCRIPCIÓN'],
  pendingApprovalState: 'CIERRE PENDIENTE APROBACIÓN',
  description: 'Reglas para cierre automático',
};

const DEFAULTS: Record<ConfigKey, ConfigValue> = {
  follow_up_rules: DEFAULT_FOLLOW_UP_RULES,
  prescription_rules: DEFAULT_PRESCRIPTION_RULES,
  alert_thresholds: DEFAULT_ALERT_THRESHOLDS,
  notification_settings: DEFAULT_NOTIFICATION_SETTINGS,
  auto_close_rules: DEFAULT_AUTO_CLOSE_RULES,
};

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Retrieves a configuration value by key from the database.
 *
 * This function implements hot-reload behavior by always reading from the database
 * (no caching). If the configuration is not found, invalid, or the database is
 * unavailable, it returns the default value for that key.
 *
 * **Configuration Keys:**
 * - `follow_up_rules`: Follow-up date calculation rules
 * - `prescription_rules`: Prescription period configuration
 * - `alert_thresholds`: Alert level thresholds
 * - `notification_settings`: Email notification preferences
 * - `auto_close_rules`: Auto-closure parameters
 *
 * @async
 * @function getConfig
 * @template T - The expected configuration type
 * @param {ConfigKey} key - The configuration key to retrieve
 * @returns {Promise<T>} The configuration value, or default if not found/invalid
 * @throws {never} Always returns a valid configuration (defaults on error)
 *
 * @example
 * ```typescript
 * // Get follow-up rules
 * const rules = await getConfig<FollowUpRules>('follow_up_rules');
 * console.log(rules.standard.days); // 10
 *
 * // Get prescription rules
 * const prescription = await getConfig<PrescriptionRules>('prescription_rules');
 * console.log(prescription.ordinary.years); // 2
 * ```
 *
 * @see {@link ConfigKey}
 * @see {@link DEFAULTS}
 * @see {@link validateConfig}
 */
export async function getConfig<T extends ConfigValue>(key: ConfigKey): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', key)
      .single();

    if (error || !data) {
      console.warn(`Config ${key} not found, using default`);
      return DEFAULTS[key] as T;
    }

    // Validate the config value
    const validation = validateConfig(key, data.config_value);
    if (!validation.valid) {
      console.warn(`Config ${key} is invalid, using default. Errors:`, validation.errors);
      return DEFAULTS[key] as T;
    }

    return data.config_value as T;
  } catch (err) {
    console.error(`Error fetching config ${key}:`, err);
    return DEFAULTS[key] as T;
  }
}

/**
 * Retrieves all configurations
 * @returns Object with all configurations
 */
export async function getAllConfigs(): Promise<Record<ConfigKey, ConfigValue>> {
  try {
    const { data, error } = await supabase.from('app_config').select('*');

    if (error || !data) {
      console.error('Error fetching all configs:', error);
      return DEFAULTS;
    }

    const configs: Record<ConfigKey, ConfigValue> = { ...DEFAULTS };

    for (const row of data as AppConfig[]) {
      if (isValidConfigKey(row.config_key)) {
        const validation = validateConfig(row.config_key, row.config_value);
        if (validation.valid) {
          configs[row.config_key as ConfigKey] = row.config_value;
        }
      }
    }

    return configs;
  } catch (err) {
    console.error('Error fetching all configs:', err);
    return DEFAULTS;
  }
}

/**
 * Updates a configuration value
 * Validates the value before updating
 * Creates audit log entry
 *
 * @param key - The configuration key
 * @param value - The new value
 * @param userId - ID of user making the change
 * @returns Success status
 */
export async function updateConfig(
  key: ConfigKey,
  value: ConfigValue,
  userId: string
): Promise<{ success: boolean; errors?: ConfigValidationError[] }> {
  // Validate the new value
  const validation = validateConfig(key, value);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  try {
    // Get old value for audit log
    const { data: oldData } = await supabase
      .from('app_config')
      .select('config_value')
      .eq('config_key', key)
      .single();

    const oldValue = oldData?.config_value;

    // Update the config
    const { error } = await supabase.from('app_config').upsert(
      {
        config_key: key,
        config_value: value,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'config_key',
      }
    );

    if (error) {
      console.error(`Error updating config ${key}:`, error);
      return {
        success: false,
        errors: [{ field: 'database', message: error.message }],
      };
    }

    // Create audit log entry
    await logAction('UPDATE_CONFIG', 'app_config', key, {
      old_value: oldValue,
      new_value: value,
      changed_by: userId,
    });

    console.log(`✅ Config ${key} updated by ${userId}`);
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`Error updating config ${key}:`, err);
    return {
      success: false,
      errors: [{ field: 'system', message: errorMsg }],
    };
  }
}

/**
 * Resets a configuration to its default value
 *
 * @param key - The configuration key
 * @param userId - ID of user making the change
 * @returns Success status
 */
export async function resetConfigToDefault(
  key: ConfigKey,
  userId: string
): Promise<{ success: boolean }> {
  return updateConfig(key, DEFAULTS[key], userId);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates a configuration value against its schema
 *
 * @param key - The configuration key
 * @param value - The value to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(key: ConfigKey, value: any): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'El valor debe ser un objeto' }],
    };
  }

  switch (key) {
    case 'follow_up_rules':
      validateFollowUpRules(value, errors);
      break;
    case 'prescription_rules':
      validatePrescriptionRules(value, errors);
      break;
    case 'alert_thresholds':
      validateAlertThresholds(value, errors);
      break;
    case 'notification_settings':
      validateNotificationSettings(value, errors);
      break;
    case 'auto_close_rules':
      validateAutoCloseRules(value, errors);
      break;
    default:
      errors.push({ field: 'key', message: `Clave de configuración desconocida: ${key}` });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateFollowUpRules(value: any, errors: ConfigValidationError[]): void {
  if (!value.standard || typeof value.standard.days !== 'number') {
    errors.push({ field: 'standard.days', message: 'Debe ser un número' });
  } else if (value.standard.days < 1 || value.standard.days > 365) {
    errors.push({ field: 'standard.days', message: 'Debe estar entre 1 y 365 días' });
  }

  if (!value.legal || typeof value.legal.minDays !== 'number') {
    errors.push({ field: 'legal.minDays', message: 'Debe ser un número' });
  }

  if (!value.legal || typeof value.legal.maxDays !== 'number') {
    errors.push({ field: 'legal.maxDays', message: 'Debe ser un número' });
  }

  if (value.legal && value.legal.minDays >= value.legal.maxDays) {
    errors.push({ field: 'legal', message: 'minDays debe ser menor que maxDays' });
  }
}

function validatePrescriptionRules(value: any, errors: ConfigValidationError[]): void {
  if (!value.ordinary || typeof value.ordinary.years !== 'number') {
    errors.push({ field: 'ordinary.years', message: 'Debe ser un número' });
  } else if (value.ordinary.years < 1 || value.ordinary.years > 10) {
    errors.push({ field: 'ordinary.years', message: 'Debe estar entre 1 y 10 años' });
  }

  if (!value.extraordinary || typeof value.extraordinary.years !== 'number') {
    errors.push({ field: 'extraordinary.years', message: 'Debe ser un número' });
  } else if (value.extraordinary.years < value.ordinary?.years) {
    errors.push({ field: 'extraordinary.years', message: 'Debe ser mayor que ordinary.years' });
  }

  if (!Array.isArray(value.extraordinary?.includes)) {
    errors.push({ field: 'extraordinary.includes', message: 'Debe ser un array de strings' });
  }
}

function validateAlertThresholds(value: any, errors: ConfigValidationError[]): void {
  if (!value.prescription || typeof value.prescription.warning !== 'number') {
    errors.push({ field: 'prescription.warning', message: 'Debe ser un número' });
  }

  if (!value.prescription || typeof value.prescription.critical !== 'number') {
    errors.push({ field: 'prescription.critical', message: 'Debe ser un número' });
  }

  if (value.prescription && value.prescription.warning <= value.prescription.critical) {
    errors.push({ field: 'prescription', message: 'warning debe ser mayor que critical' });
  }

  if (!value.legalStagnant || typeof value.legalStagnant.warningMonths !== 'number') {
    errors.push({ field: 'legalStagnant.warningMonths', message: 'Debe ser un número' });
  }

  if (!value.legalStagnant || typeof value.legalStagnant.closeYears !== 'number') {
    errors.push({ field: 'legalStagnant.closeYears', message: 'Debe ser un número' });
  }
}

function validateNotificationSettings(value: any, errors: ConfigValidationError[]): void {
  if (typeof value.ui !== 'boolean') {
    errors.push({ field: 'ui', message: 'Debe ser un booleano' });
  }

  if (typeof value.email !== 'boolean') {
    errors.push({ field: 'email', message: 'Debe ser un booleano' });
  }

  if (typeof value.dailyDigest !== 'boolean') {
    errors.push({ field: 'dailyDigest', message: 'Debe ser un booleano' });
  }

  if (value.digestTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value.digestTime)) {
    errors.push({ field: 'digestTime', message: 'Debe estar en formato HH:MM (24h)' });
  }
}

function validateAutoCloseRules(value: any, errors: ConfigValidationError[]): void {
  if (typeof value.highValueThreshold !== 'number') {
    errors.push({ field: 'highValueThreshold', message: 'Debe ser un número' });
  } else if (value.highValueThreshold < 0) {
    errors.push({ field: 'highValueThreshold', message: 'No puede ser negativo' });
  }

  if (!Array.isArray(value.highPriorityExclusion)) {
    errors.push({ field: 'highPriorityExclusion', message: 'Debe ser un array' });
  }

  if (!Array.isArray(value.autoCloseStates)) {
    errors.push({ field: 'autoCloseStates', message: 'Debe ser un array' });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isValidConfigKey(key: string): key is ConfigKey {
  return [
    'follow_up_rules',
    'prescription_rules',
    'alert_thresholds',
    'notification_settings',
    'auto_close_rules',
  ].includes(key);
}

/**
 * Gets the default value for a configuration key
 *
 * @param key - The configuration key
 * @returns The default value
 */
export function getConfigDefault(key: ConfigKey): ConfigValue {
  return DEFAULTS[key];
}

/**
 * Gets metadata about all available configurations
 *
 * @returns Array of config metadata
 */
export function getConfigMetadata(): Array<{
  key: ConfigKey;
  description: string;
  type: string;
}> {
  return [
    {
      key: 'follow_up_rules',
      description: 'Reglas de cálculo de próximo seguimiento',
      type: 'object',
    },
    {
      key: 'prescription_rules',
      description: 'Reglas de prescripción ordinaria y extraordinaria',
      type: 'object',
    },
    {
      key: 'alert_thresholds',
      description: 'Umbrales para alertas y cierres automáticos',
      type: 'object',
    },
    {
      key: 'notification_settings',
      description: 'Configuración de canales de notificación',
      type: 'object',
    },
    {
      key: 'auto_close_rules',
      description: 'Reglas para cierre automático de siniestros',
      type: 'object',
    },
  ];
}

/**
 * Compares two configuration values and returns differences
 * Useful for showing what changed in the UI
 *
 * @param oldValue - Old configuration value
 * @param newValue - New configuration value
 * @returns Array of differences
 */
export function compareConfigs(
  oldValue: ConfigValue,
  newValue: ConfigValue
): Array<{ path: string; old: any; new: any }> {
  const differences: Array<{ path: string; old: any; new: any }> = [];

  function compare(obj1: any, obj2: any, path: string = '') {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      if (obj1 !== obj2) {
        differences.push({ path, old: obj1, new: obj2 });
      }
      return;
    }

    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      compare(obj1?.[key], obj2?.[key], newPath);
    }
  }

  compare(oldValue, newValue);
  return differences;
}
