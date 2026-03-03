import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface WithRoleOptions {
  allowedRoles: Role[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Higher-Order Component (HOC) para proteger componentes según rol
 *
 * Uso:
 * const ProtectedComponent = withRole(MyComponent, { allowedRoles: ['ADMIN', 'GERENTE'] });
 *
 * O con fallback personalizado:
 * const ProtectedComponent = withRole(MyComponent, {
 *   allowedRoles: ['ADMIN'],
 *   fallback: <div>No tienes permisos</div>
 * });
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithRoleOptions
): React.FC<P> {
  const { allowedRoles, fallback } = options;

  const WithRoleWrapper: React.FC<P> = props => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center h-32 p-4">
          <p className="text-slate-500">Debe iniciar sesión para acceder a esta sección</p>
        </div>
      );
    }

    if (!allowedRoles.includes(user.role)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div className="flex flex-col items-center justify-center h-32 p-4">
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-6 max-w-md text-center">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              No tienes permisos para acceder a esta funcionalidad.
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Tu rol: <strong>{user.role}</strong> | Requerido: {allowedRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  // Display name for debugging
  const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithRoleWrapper.displayName = `withRole(${wrappedComponentName})`;

  return WithRoleWrapper;
}

/**
 * HOC simplificado para rol ADMIN únicamente
 */
export function withAdmin<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return withRole(WrappedComponent, { allowedRoles: ['ADMIN'], fallback });
}

/**
 * HOC simplificado para roles ADMIN y GERENTE
 */
export function withManager<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return withRole(WrappedComponent, { allowedRoles: ['ADMIN', 'GERENTE'], fallback });
}

/**
 * HOC simplificado para rol TECNICO
 */
export function withTechnician<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return withRole(WrappedComponent, { allowedRoles: ['ADMIN', 'TECNICO'], fallback });
}

export default withRole;
