import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useClaims } from '../context/ClaimsContext';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPreferences {
  emailEnabled: boolean;
  dailyDigest: boolean;
  digestFrequency: 'daily' | 'weekly' | 'off';
  criticalOverride: boolean;
  updatedAt?: string;
}

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<NotificationPreferences>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  dailyDigest: true,
  digestFrequency: 'daily',
  criticalOverride: true,
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para gestionar las preferencias de notificación del usuario
 *
 * @example
 * const { preferences, loading, updatePreferences } = useNotificationPreferences();
 *
 * // Toggle email notifications
 * await updatePreferences({ emailEnabled: false });
 *
 * // Change digest frequency
 * await updatePreferences({ digestFrequency: 'weekly' });
 */
export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const { currentUser } = useClaims();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar preferencias del usuario
   */
  const loadPreferences = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_settings, updated_at')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        // Si no existe, usar defaults
        if (error.code === 'PGRST116') {
          setPreferences(DEFAULT_PREFERENCES);
        } else {
          throw error;
        }
      } else if (data?.notification_settings) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data.notification_settings,
          updatedAt: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      setError('Error al cargar preferencias');
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Cargar al montar
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  /**
   * Actualizar preferencias
   */
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>): Promise<boolean> => {
      if (!currentUser?.id) {
        setError('Usuario no autenticado');
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const updatedPreferences = {
          ...preferences,
          ...newPreferences,
        };

        const { error } = await supabase.from('user_preferences').upsert(
          {
            user_id: currentUser.id,
            notification_settings: updatedPreferences,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

        if (error) throw error;

        setPreferences(updatedPreferences);
        return true;
      } catch (err) {
        console.error('Error updating preferences:', err);
        setError('Error al guardar preferencias');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser?.id, preferences]
  );

  /**
   * Restaurar a valores por defecto
   */
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return updatePreferences(DEFAULT_PREFERENCES);
  }, [updatePreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetToDefaults,
  };
};

export default useNotificationPreferences;
