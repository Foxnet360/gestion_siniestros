import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Registra una acción en el log de auditoría
 */
export const logAction = async (
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('log_audit_action', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details || {},
    });

    if (error) {
      console.error('Error logging action:', error);
      // No lanzamos error para no interrumpir el flujo principal
    }
  } catch (error) {
    console.error('Exception logging action:', error);
  }
};

/**
 * Obtiene los logs de auditoría con filtros opcionales
 */
export const getAuditLogs = async (
  filters?: AuditFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<{ logs: AuditLogEntry[]; total: number }> => {
  let query = supabase
    .from('audit_logs')
    .select('*, users!inner(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }

  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  // Paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('No se pudieron cargar los logs de auditoría');
  }

  const logs: AuditLogEntry[] =
    data?.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.users?.name,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      createdAt: log.created_at,
    })) || [];

  return { logs, total: count || 0 };
};

/**
 * Obtiene la actividad reciente de un usuario específico
 */
export const getUserActivity = async (
  userId: string,
  limit: number = 20
): Promise<AuditLogEntry[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, users!inner(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user activity:', error);
    throw new Error('No se pudo cargar la actividad del usuario');
  }

  return (
    data?.map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.users?.name,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      createdAt: log.created_at,
    })) || []
  );
};

/**
 * Exporta logs a formato CSV
 */
export const exportAuditLogsToCSV = async (filters?: AuditFilters): Promise<string> => {
  // Obtener todos los logs sin paginación para exportación
  let query = supabase
    .from('audit_logs')
    .select('*, users!inner(name,email)')
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.action) {
    query = query.eq('action', filters.action);
  }

  if (filters?.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error exporting audit logs:', error);
    throw new Error('No se pudieron exportar los logs');
  }

  // Crear CSV
  const headers = ['Fecha', 'Usuario', 'Email', 'Acción', 'Entidad', 'ID Entidad', 'Detalles'];
  const rows =
    data?.map(log => [
      new Date(log.created_at).toISOString(),
      log.users?.name || 'Desconocido',
      log.users?.email || '',
      log.action,
      log.entity_type,
      log.entity_id,
      JSON.stringify(log.details),
    ]) || [];

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csv;
};

/**
 * Acciones de auditoría predefinidas
 */
export const AuditActions = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Usuarios
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  REACTIVATE_USER: 'REACTIVATE_USER',

  // Siniestros
  CREATE_CLAIM: 'CREATE_CLAIM',
  UPDATE_CLAIM: 'UPDATE_CLAIM',
  DELETE_CLAIM: 'DELETE_CLAIM',
  CHANGE_CLAIM_STATE: 'CHANGE_CLAIM_STATE',
  ASSIGN_TECNICO: 'ASSIGN_TECNICO',

  // Ingesta
  INGEST_EXCEL: 'INGEST_EXCEL',

  // Reportes
  EXPORT_REPORT: 'EXPORT_REPORT',

  // Sistema
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;
