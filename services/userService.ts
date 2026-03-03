import { supabase } from '../lib/supabase';
import { User, Role } from '../types';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: Role;
  initials: string;
  aliadoId?: string;
}

export interface UpdateUserData {
  name?: string;
  initials?: string;
  role?: Role;
  aliadoId?: string | null;
  isActive?: boolean;
}

export interface UserFilters {
  role?: Role;
  isActive?: boolean;
  search?: string;
}

export interface GetUsersResult {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene la lista de usuarios con filtros opcionales y paginación
 */
export const getUsers = async (
  filters?: UserFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<GetUsersResult> => {
  // Calcular rango para paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Construir query base con count
  let query = supabase.from('users').select('*', { count: 'exact' }).order('name').range(from, to);

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error('No se pudieron cargar los usuarios');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const users =
    data?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      initials: user.initials,
      aliadoId: user.aliado_id || undefined,
      isActive: user.is_active,
    })) || [];

  return {
    users,
    total,
    page,
    pageSize,
    totalPages,
  };
};

/**
 * Obtiene un usuario por su ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching user:', error);
    throw new Error('No se pudo cargar el usuario');
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as Role,
    initials: data.initials,
    aliadoId: data.aliado_id || undefined,
  };
};

/**
 * Crea un nuevo usuario (requiere ser ADMIN)
 */
export const createUser = async (userData: CreateUserData): Promise<User> => {
  // Usar la función RPC para crear usuario en ambas tablas
  const { data: userId, error: createError } = await supabase.rpc('create_user_with_auth', {
    p_email: userData.email,
    p_password: userData.password,
    p_name: userData.name,
    p_role: userData.role,
    p_initials: userData.initials,
    p_aliado_id: userData.aliadoId || null,
  });

  if (createError) {
    console.error('Error creating user:', createError);
    throw new Error('No se pudo crear el usuario: ' + createError.message);
  }

  // Registrar en auditoría
  await supabase.rpc('log_audit_action', {
    p_action: 'CREATE_USER',
    p_entity_type: 'user',
    p_entity_id: userId,
    p_details: {
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
  });

  // Retornar el usuario creado
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('Usuario creado pero no se pudo recuperar');
  }

  return user;
};

/**
 * Actualiza los datos de un usuario
 */
export const updateUser = async (userId: string, updateData: UpdateUserData): Promise<User> => {
  const updatePayload: Record<string, unknown> = {};

  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.initials !== undefined) updatePayload.initials = updateData.initials;
  if (updateData.role !== undefined) updatePayload.role = updateData.role;
  if (updateData.aliadoId !== undefined) updatePayload.aliado_id = updateData.aliadoId;
  if (updateData.isActive !== undefined) updatePayload.is_active = updateData.isActive;

  const { error } = await supabase.from('users').update(updatePayload).eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    throw new Error('No se pudo actualizar el usuario');
  }

  // Registrar en auditoría
  await supabase.rpc('log_audit_action', {
    p_action: 'UPDATE_USER',
    p_entity_type: 'user',
    p_entity_id: userId,
    p_details: updatePayload,
  });

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('Usuario actualizado pero no se pudo recuperar');
  }

  return user;
};

/**
 * Desactiva un usuario (soft delete)
 */
export const deactivateUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId);

  if (error) {
    console.error('Error deactivating user:', error);
    throw new Error('No se pudo desactivar el usuario');
  }

  // Registrar en auditoría
  await supabase.rpc('log_audit_action', {
    p_action: 'DEACTIVATE_USER',
    p_entity_type: 'user',
    p_entity_id: userId,
    p_details: {},
  });
};

/**
 * Reactiva un usuario desactivado
 */
export const reactivateUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.from('users').update({ is_active: true }).eq('id', userId);

  if (error) {
    console.error('Error reactivating user:', error);
    throw new Error('No se pudo reactivar el usuario');
  }

  // Registrar en auditoría
  await supabase.rpc('log_audit_action', {
    p_action: 'REACTIVATE_USER',
    p_entity_type: 'user',
    p_entity_id: userId,
    p_details: {},
  });
};

/**
 * Cambia la contraseña de un usuario (solo ADMIN)
 */
export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  // Usar admin API de Supabase (requiere service role key en backend)
  // Por ahora, este endpoint debería ser manejado por un backend seguro
  // o manualmente por el administrador en el dashboard de Supabase

  // Registrar en auditoría
  await supabase.rpc('log_audit_action', {
    p_action: 'RESET_PASSWORD',
    p_entity_type: 'user',
    p_entity_id: userId,
    p_details: {},
  });

  // Nota: El cambio real de contraseña debería hacerse desde el dashboard de Supabase
  // o mediante una función Edge con service role key
};

/**
 * Obtiene los técnicos activos (para asignar a siniestros)
 */
export const getActiveTechnicians = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'TECNICO')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching technicians:', error);
    throw new Error('No se pudieron cargar los técnicos');
  }

  return (
    data?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      initials: user.initials,
      aliadoId: user.aliado_id || undefined,
    })) || []
  );
};

/**
 * Obtiene los aliados (para filtrar siniestros)
 */
export const getAllies = async (): Promise<{ id: string; name: string }[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('aliado_id, name')
    .eq('role', 'ALIADO')
    .eq('is_active', true)
    .not('aliado_id', 'is', null);

  if (error) {
    console.error('Error fetching allies:', error);
    throw new Error('No se pudieron cargar los aliados');
  }

  // Eliminar duplicados por aliado_id
  const uniqueAllies = new Map<string, { id: string; name: string }>();
  data?.forEach(user => {
    if (user.aliado_id && !uniqueAllies.has(user.aliado_id)) {
      uniqueAllies.set(user.aliado_id, {
        id: user.aliado_id,
        name: user.name,
      });
    }
  });

  return Array.from(uniqueAllies.values());
};
