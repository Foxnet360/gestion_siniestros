import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger vistas basado en roles
 * Uso: <RoleBasedRoute allowedRoles={['ADMIN', 'GERENTE']}><Componente /></RoleBasedRoute>
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles, fallback }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sesión Expirada</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center">
          Por favor inicia sesión nuevamente.
        </p>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-4">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            Tu rol actual: <strong>{user.role}</strong>
          </p>
          <p className="text-sm text-slate-500">Roles permitidos: {allowedRoles.join(', ')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
