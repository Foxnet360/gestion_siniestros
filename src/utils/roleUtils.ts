import { Role } from '../types';

/**
 * Verifica si un rol tiene permiso para realizar una acción
 */
export const hasPermission = (userRole: Role, action: string): boolean => {
  const permissions: Record<Role, string[]> = {
    ADMIN: ['*'], // Admin tiene todos los permisos
    GERENTE: ['view:all-claims', 'view:reports', 'view:audit-log', 'view:manager-dashboard'],
    TECNICO: ['view:assigned-claims', 'edit:assigned-claims', 'view:dashboard'],
    ALIADO: ['view:ally-claims', 'view:ally-portal'],
    VENDEDOR: ['view:assigned-claims', 'view:dashboard'],
  };

  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};

/**
 * Verifica si el usuario puede ver el panel de administración de usuarios
 */
export const canManageUsers = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Verifica si el usuario puede ver logs de auditoría
 */
export const canViewAuditLog = (userRole: Role): boolean => {
  return userRole === 'ADMIN' || userRole === 'GERENTE';
};

/**
 * Verifica si el usuario puede ver el dashboard gerencial
 */
export const canViewManagerDashboard = (userRole: Role): boolean => {
  return userRole === 'ADMIN' || userRole === 'GERENTE';
};

/**
 * Verifica si el usuario puede realizar ingestas
 */
export const canIngest = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Verifica si el usuario puede ver reportes
 */
export const canViewReports = (userRole: Role): boolean => {
  return userRole === 'ADMIN' || userRole === 'GERENTE';
};

/**
 * Verifica si el usuario puede editar un siniestro
 */
export const canEditClaim = (
  userRole: Role,
  claimTecnicoId: string | undefined,
  userId: string
): boolean => {
  if (userRole === 'ADMIN') return true;
  if (userRole === 'TECNICO') {
    return claimTecnicoId === userId;
  }
  return false;
};

/**
 * Verifica si el usuario puede acceder al portal de aliados
 */
export const canAccessAllyPortal = (userRole: Role): boolean => {
  return userRole === 'ALIADO';
};

/**
 * Obtiene la descripción de un rol
 */
export const getRoleDescription = (role: Role): string => {
  const descriptions: Record<Role, string> = {
    ADMIN: 'Administrador del Sistema',
    GERENTE: 'Gerente / Director',
    TECNICO: 'Técnico de Siniestros',
    ALIADO: 'Aliado / Aseguradora',
    VENDEDOR: 'Vendedor / Comercial',
  };
  return descriptions[role] || role;
};

/**
 * Obtiene el color asociado a un rol
 */
export const getRoleColor = (role: Role): string => {
  const colors: Record<Role, string> = {
    ADMIN: 'amber',
    GERENTE: 'violet',
    TECNICO: 'blue',
    ALIADO: 'emerald',
    VENDEDOR: 'indigo',
  };
  return colors[role] || 'slate';
};
