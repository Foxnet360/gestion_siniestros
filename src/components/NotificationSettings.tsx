import React, { useState } from 'react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import {
  Bell,
  Mail,
  Clock,
  AlertTriangle,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

/**
 * Componente de configuración de notificaciones
 * Puede usarse standalone o integrado en UserProfile
 */
export const NotificationSettings: React.FC = () => {
  const { preferences, loading, error, updatePreferences, resetToDefaults } =
    useNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when preferences load
  React.useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof typeof localPreferences) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'off') => {
    setLocalPreferences(prev => ({
      ...prev,
      digestFrequency: frequency,
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updatePreferences({
      emailEnabled: localPreferences.emailEnabled,
      dailyDigest: localPreferences.dailyDigest,
      digestFrequency: localPreferences.digestFrequency,
      criticalOverride: localPreferences.criticalOverride,
    });

    if (success) {
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    const success = await resetToDefaults();
    if (success) {
      setLocalPreferences(preferences);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Configuración de Notificaciones
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalice cómo y cuándo recibe alertas
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-emerald-700 dark:text-emerald-300">
            Preferencias guardadas exitosamente
          </p>
        </div>
      )}

      {/* Email Notifications */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                Notificaciones por Email
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reciba alertas importantes sobre sus siniestros asignados
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Daily Digest */}
      <div
        className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg ${!localPreferences.emailEnabled ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">Resumen Diario</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Reciba un resumen consolidado de todas sus alertas
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localPreferences.dailyDigest}
              onChange={() => handleToggle('dailyDigest')}
              disabled={!localPreferences.emailEnabled}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Digest Frequency */}
        {localPreferences.dailyDigest && localPreferences.emailEnabled && (
          <div className="ml-8 mt-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Frecuencia del resumen:
            </p>
            <div className="flex gap-3">
              {(['daily', 'weekly', 'off'] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => handleFrequencyChange(freq)}
                  disabled={!localPreferences.emailEnabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localPreferences.digestFrequency === freq
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {freq === 'daily' && 'Diario'}
                  {freq === 'weekly' && 'Semanal'}
                  {freq === 'off' && 'Solo críticas'}
                </button>
              ))}
            </div>
            {localPreferences.digestFrequency === 'off' && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <Info className="w-4 h-4" />
                Solo recibirá notificaciones de alertas críticas
              </p>
            )}
          </div>
        )}
      </div>

      {/* Critical Override */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">
                  Siempre notificar alertas críticas
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Incluso si desactiva las notificaciones, siempre recibirá alertas de siniestros
                  próximos a vencer o críticos
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={localPreferences.criticalOverride}
                  onChange={() => handleToggle('criticalOverride')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleReset}
          disabled={saving}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar valores por defecto
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
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
  );
};

export default NotificationSettings;
