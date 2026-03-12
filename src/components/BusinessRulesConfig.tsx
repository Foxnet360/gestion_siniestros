import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser as useAuth } from '../hooks/useCurrentUser';
import {
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

// Types
interface FollowUpRules {
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

interface PrescriptionRules {
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

interface AlertThresholds {
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

interface NotificationSettings {
  ui: boolean;
  email: boolean;
  dailyDigest: boolean;
  digestTime: string;
  criticalOverride: boolean;
  description: string;
}

interface AutoCloseRules {
  highValueThreshold: number;
  highPriorityExclusion: string[];
  autoCloseStates: string[];
  pendingApprovalState: string;
  description: string;
}

interface ConfigSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: ConfigSection[] = [
  {
    id: 'follow_up_rules',
    title: 'Reglas de Seguimiento',
    icon: <Clock className="w-5 h-5" />,
    description: 'Configuración de tiempos entre seguimientos por fase',
  },
  {
    id: 'prescription_rules',
    title: 'Reglas de Prescripción',
    icon: <FileText className="w-5 h-5" />,
    description: 'Plazos de prescripción ordinaria y extraordinaria',
  },
  {
    id: 'alert_thresholds',
    title: 'Umbrales de Alertas',
    icon: <Bell className="w-5 h-5" />,
    description: 'Días de anticipación para alertas y cierres automáticos',
  },
  {
    id: 'notification_settings',
    title: 'Configuración de Notificaciones',
    icon: <Bell className="w-5 h-5" />,
    description: 'Canales y frecuencia de notificaciones',
  },
  {
    id: 'auto_close_rules',
    title: 'Reglas de Cierre Automático',
    icon: <Shield className="w-5 h-5" />,
    description: 'Condiciones para cierre automático y aprobación manual',
  },
];

const BusinessRulesConfig: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('follow_up_rules');
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSave, setPendingSave] = useState<string | null>(null);

  // Load configurations
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('app_config').select('*');

      if (error) throw error;

      const configsMap: Record<string, any> = {};
      data?.forEach((item: any) => {
        configsMap[item.config_key] = item.config_value;
      });

      setConfigs(configsMap);
      setOriginalConfigs(JSON.parse(JSON.stringify(configsMap)));
    } catch (err) {
      setError('Error al cargar configuraciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(configs) !== JSON.stringify(originalConfigs);
    setHasChanges(changed);
  }, [configs, originalConfigs]);

  const handleConfigChange = (section: string, path: string[], value: any) => {
    setConfigs(prev => {
      const newConfigs = { ...prev };
      if (!newConfigs[section]) newConfigs[section] = {};

      let current = newConfigs[section];
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;

      return newConfigs;
    });
  };

  const handleSave = async (sectionId: string) => {
    if (!user) {
      setError('Debe estar autenticado para guardar cambios');
      return;
    }

    // Check if it's a critical change
    const isCriticalChange = ['prescription_rules', 'auto_close_rules'].includes(sectionId);

    if (isCriticalChange && !showConfirmModal) {
      setPendingSave(sectionId);
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setPendingSave(null);

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase.from('app_config').upsert(
        {
          config_key: sectionId,
          config_value: configs[sectionId],
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'config_key',
        }
      );

      if (error) throw error;

      setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
      setSuccess('Configuración guardada exitosamente');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Error al guardar la configuración');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (sectionId: string) => {
    setConfigs(prev => ({
      ...prev,
      [sectionId]: JSON.parse(JSON.stringify(originalConfigs[sectionId] || {})),
    }));
  };

  const renderFollowUpRules = () => {
    const rules: FollowUpRules = configs.follow_up_rules || {};

    return (
      <div className="space-y-6">
        {/* Standard Phases */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Fases Estándar (1-5)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Días entre seguimientos
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={rules.standard?.days || 10}
                onChange={e =>
                  handleConfigChange(
                    'follow_up_rules',
                    ['standard', 'days'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={rules.standard?.description || ''}
                onChange={e =>
                  handleConfigChange('follow_up_rules', ['standard', 'description'], e.target.value)
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Legal Process */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Proceso Jurídico</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Mínimo (días)
              </label>
              <input
                type="number"
                min="1"
                value={rules.legal?.minDays || 30}
                onChange={e =>
                  handleConfigChange(
                    'follow_up_rules',
                    ['legal', 'minDays'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Máximo (días)
              </label>
              <input
                type="number"
                min="1"
                value={rules.legal?.maxDays || 60}
                onChange={e =>
                  handleConfigChange(
                    'follow_up_rules',
                    ['legal', 'maxDays'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Por defecto (días)
              </label>
              <input
                type="number"
                min="1"
                value={rules.legal?.defaultDays || 30}
                onChange={e =>
                  handleConfigChange(
                    'follow_up_rules',
                    ['legal', 'defaultDays'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrescriptionRules = () => {
    const rules: PrescriptionRules = configs.prescription_rules || {};

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Los cambios en las reglas de prescripción solo aplican a siniestros nuevos. Los
              siniestros existentes mantendrán sus fechas calculadas.
            </p>
          </div>
        </div>

        {/* Ordinary Prescription */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Prescripción Ordinaria
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Años desde fecha de ocurrencia
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rules.ordinary?.years || 2}
                onChange={e =>
                  handleConfigChange(
                    'prescription_rules',
                    ['ordinary', 'years'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Extraordinary Prescription */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Prescripción Extraordinaria (Responsabilidad Civil)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Años desde fecha de ocurrencia
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={rules.extraordinary?.years || 5}
                onChange={e =>
                  handleConfigChange(
                    'prescription_rules',
                    ['extraordinary', 'years'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Ramos aplicables (separados por coma)
              </label>
              <input
                type="text"
                value={(rules.extraordinary?.includes || ['Responsabilidad Civil']).join(', ')}
                onChange={e =>
                  handleConfigChange(
                    'prescription_rules',
                    ['extraordinary', 'includes'],
                    e.target.value.split(',').map(s => s.trim())
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAlertThresholds = () => {
    const thresholds: AlertThresholds = configs.alert_thresholds || {};

    return (
      <div className="space-y-6">
        {/* Prescription Alerts */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Alertas de Prescripción
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Advertencia (días antes)
              </label>
              <input
                type="number"
                min="1"
                value={thresholds.prescription?.warning || 90}
                onChange={e =>
                  handleConfigChange(
                    'alert_thresholds',
                    ['prescription', 'warning'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Crítica (días antes)
              </label>
              <input
                type="number"
                min="1"
                value={thresholds.prescription?.critical || 30}
                onChange={e =>
                  handleConfigChange(
                    'alert_thresholds',
                    ['prescription', 'critical'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Cierre automático (días después)
              </label>
              <input
                type="number"
                min="0"
                value={thresholds.prescription?.autoClose || 0}
                onChange={e =>
                  handleConfigChange(
                    'alert_thresholds',
                    ['prescription', 'autoClose'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Legal Stagnation */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Estancamiento Jurídico
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Alerta de advertencia (meses)
              </label>
              <input
                type="number"
                min="1"
                value={thresholds.legalStagnant?.warningMonths || 24}
                onChange={e =>
                  handleConfigChange(
                    'alert_thresholds',
                    ['legalStagnant', 'warningMonths'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Cierre automático (años)
              </label>
              <input
                type="number"
                min="1"
                value={thresholds.legalStagnant?.closeYears || 5}
                onChange={e =>
                  handleConfigChange(
                    'alert_thresholds',
                    ['legalStagnant', 'closeYears'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => {
    const settings: NotificationSettings = configs.notification_settings || {};

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Canales de Notificación
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.ui !== false}
                onChange={e =>
                  handleConfigChange('notification_settings', ['ui'], e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Mostrar alertas en la interfaz
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.email !== false}
                onChange={e =>
                  handleConfigChange('notification_settings', ['email'], e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Enviar notificaciones por email
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.dailyDigest !== false}
                onChange={e =>
                  handleConfigChange('notification_settings', ['dailyDigest'], e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-slate-700 dark:text-slate-300">Enviar resumen diario</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.criticalOverride !== false}
                onChange={e =>
                  handleConfigChange(
                    'notification_settings',
                    ['criticalOverride'],
                    e.target.checked
                  )
                }
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-slate-700 dark:text-slate-300">
                Siempre notificar alertas críticas (ignorar preferencias de usuario)
              </span>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Horario de Resumen Diario
          </h4>
          <input
            type="time"
            value={settings.digestTime || '08:00'}
            onChange={e =>
              handleConfigChange('notification_settings', ['digestTime'], e.target.value)
            }
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
          />
        </div>
      </div>
    );
  };

  const renderAutoCloseRules = () => {
    const rules: AutoCloseRules = configs.auto_close_rules || {};

    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Advertencia:</strong> Los cambios en estas reglas afectan el cierre automático
              de siniestros. Asegúrese de entender el impacto antes de guardar.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">
            Exclusiones de Cierre Automático
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Monto mínimo para aprobación manual ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000000"
                value={rules.highValueThreshold || 50000000}
                onChange={e =>
                  handleConfigChange(
                    'auto_close_rules',
                    ['highValueThreshold'],
                    parseInt(e.target.value)
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Siniestros con monto mayor o igual requieren aprobación manual
              </p>
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                Prioridades excluidas (separadas por coma)
              </label>
              <input
                type="text"
                value={(rules.highPriorityExclusion || ['ALTA']).join(', ')}
                onChange={e =>
                  handleConfigChange(
                    'auto_close_rules',
                    ['highPriorityExclusion'],
                    e.target.value.split(',').map(s => s.trim())
                  )
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Estados de Cierre</h4>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
              Estado para aprobación pendiente
            </label>
            <input
              type="text"
              value={rules.pendingApprovalState || 'CIERRE PENDIENTE APROBACIÓN'}
              onChange={e =>
                handleConfigChange('auto_close_rules', ['pendingApprovalState'], e.target.value)
              }
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'follow_up_rules':
        return renderFollowUpRules();
      case 'prescription_rules':
        return renderPrescriptionRules();
      case 'alert_thresholds':
        return renderAlertThresholds();
      case 'notification_settings':
        return renderNotificationSettings();
      case 'auto_close_rules':
        return renderAutoCloseRules();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuración de Reglas de Negocio
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Administre las reglas de cálculo automático, alertas y cierres de siniestros
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-emerald-700 dark:text-emerald-300">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Secciones</h2>
            </div>
            <nav className="divide-y divide-slate-200 dark:divide-slate-700">
              {SECTIONS.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Section Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {SECTIONS.find(s => s.id === activeSection)?.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {SECTIONS.find(s => s.id === activeSection)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReset(activeSection)}
                    disabled={!hasChanges || saving}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurar
                  </button>
                  <button
                    onClick={() => handleSave(activeSection)}
                    disabled={!hasChanges || saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div className="p-6">{renderActiveSection()}</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Confirmar Cambio Crítico
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Está a punto de modificar reglas que afectan el cierre automático de siniestros. ¿Está
              seguro de que desea continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSave(null);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => pendingSave && handleSave(pendingSave)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRulesConfig;
