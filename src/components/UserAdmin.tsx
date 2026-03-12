import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  UserX,
  UserCheck,
  Edit2,
  Shield,
  Users,
  Loader2,
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { User, Role } from '../types';
import UserForm from './UserForm';

interface UserAdminProps {
  currentUser: User;
}

const UserAdmin: React.FC<UserAdminProps> = ({ currentUser }) => {
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    createNewUser,
    updateExistingUser,
    deactivateExistingUser,
    reactivateExistingUser,
    // Pagination
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar usuarios al montar
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = (targetPage?: number) => {
    const filters: Parameters<typeof fetchUsers>[0] = {};

    if (roleFilter !== 'all') {
      filters.role = roleFilter;
    }

    if (statusFilter !== 'all') {
      filters.isActive = statusFilter === 'active';
    }

    if (searchTerm.trim()) {
      filters.search = searchTerm;
    }

    fetchUsers(filters, targetPage);
  };

  // Recargar cuando cambian filtros
  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateUser = async (userData: {
    email: string;
    password: string;
    name: string;
    role: Role;
    initials: string;
    aliadoId?: string;
  }) => {
    try {
      setFormError(null);
      await createNewUser(userData);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear usuario');
    }
  };

  const handleUpdateUser = async (
    userId: string,
    userData: {
      name?: string;
      initials?: string;
      role?: Role;
      aliadoId?: string | null;
    }
  ) => {
    try {
      setFormError(null);
      await updateExistingUser(userId, userData);
      setEditingUser(null);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;

    try {
      await deactivateExistingUser(userId);
      loadUsers();
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await reactivateExistingUser(userId);
      loadUsers();
    } catch (err) {
      console.error('Error al reactivar usuario:', err);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    setFormError(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormError(null);
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'GERENTE':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
      case 'TECNICO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ALIADO':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Administración de Usuarios
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona usuarios, roles y permisos del sistema
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
            setFormError(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
            />
          </div>

          {/* Filtro de Rol */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as Role | 'all')}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
            >
              <option value="all">Todos los roles</option>
              <option value="ADMIN">Admin</option>
              <option value="GERENTE">Gerente</option>
              <option value="TECNICO">Técnico</option>
              <option value="ALIADO">Aliado</option>
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-12 text-slate-500">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                          {user.aliadoId && (
                            <div className="text-xs text-slate-400">Aliado: {user.aliadoId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {user.isActive !== false ? (
                          <>
                            <UserCheck className="w-3 h-3" /> Activo
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3" /> Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {user.isActive !== false ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Desactivar"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Reactivar"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && users.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {users.length} de {total} usuarios
              </span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  loadUsers(1);
                }}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadUsers(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => loadUsers(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <UserForm
              user={editingUser}
              onSubmit={
                editingUser ? data => handleUpdateUser(editingUser.id, data) : handleCreateUser
              }
              onCancel={handleCloseForm}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdmin;
