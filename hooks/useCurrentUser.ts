import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UseCurrentUserReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener el usuario actual autenticado con metadatos completos
 * Incluye información de la tabla public.users (role, initials, aliadoId, etc.)
 */
export const useCurrentUser = (): UseCurrentUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        return;
      }

      // Obtener metadatos del usuario desde la tabla public.users
      const { data, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        throw userError;
      }

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          initials: data.initials,
          aliadoId: data.aliado_id || undefined,
          isActive: data.is_active,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuario');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchCurrentUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCurrentUser]);

  return {
    user,
    isLoading,
    error,
    refetch: fetchCurrentUser,
  };
};

export default useCurrentUser;
