import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario actual al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);

        // Verificar sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('[AUTH] Fetching profile for userId:', userId);
    try {
      // Intentar obtener el perfil vía REST API directo para evitar problemas de RLS
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('[AUTH] Querying users table via REST...');
      const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AUTH] Users query response status:', response.status);

      if (!response.ok) {
        console.error('[AUTH] Error querying users table:', response.status);
        setUser(null);
        return;
      }

      const users = await response.json();
      console.log('[AUTH] Users data received:', { count: users?.length });

      const data = users && users.length > 0 ? users[0] : null;

      if (data && data.is_active) {
        console.log('[AUTH] Setting user:', data.email);
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as Role,
          initials: data.initials,
          aliadoId: data.aliado_id || undefined,
        });
        console.log('[AUTH] User set successfully');
      } else {
        console.log('[AUTH] User not found or inactive');
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH] Error in fetchUserProfile:', error);
      setUser(null);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    console.log('[AUTH] Starting login for:', email);
    try {
      // Intentar login directo vía fetch para diagnosticar
      console.log('[AUTH] Trying direct fetch...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AUTH] Fetch response status:', response.status);
      const data = await response.json();
      console.log('[AUTH] Fetch response:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
      });

      if (!response.ok) {
        // Traducir mensajes comunes de error
        let errorMsg = data.msg || data.error_description || 'Error de autenticación';
        if (errorMsg.includes('Invalid login credentials')) {
          errorMsg = 'Correo o contraseña incorrectos';
        } else if (errorMsg.includes('Email not confirmed')) {
          errorMsg = 'El correo no ha sido confirmado';
        } else if (errorMsg.includes('User not found')) {
          errorMsg = 'Usuario no encontrado';
        }
        return {
          success: false,
          error: errorMsg,
        };
      }

      if (data.user && data.access_token) {
        console.log('[AUTH] User authenticated via fetch, setting session...');
        // Establecer la sesión manualmente en Supabase
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        await fetchUserProfile(data.user.id);
        console.log('[AUTH] Profile fetched successfully');
        return { success: true };
      }

      return { success: false, error: 'No se pudo iniciar sesión' };
    } catch (error) {
      console.error('[AUTH] Login exception:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const logout = async () => {
    try {
      // TODO: Restaurar auditoría cuando funcione
      // Registrar logout en auditoría antes de cerrar sesión
      // if (user) {
      //   await supabase.rpc('log_audit_action', {
      //     p_action: 'LOGOUT',
      //     p_entity_type: 'user',
      //     p_entity_id: user.id,
      //     p_details: { email: user.email },
      //   });
      // }

      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Error al enviar email de recuperación' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshSession,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export default AuthContext;
