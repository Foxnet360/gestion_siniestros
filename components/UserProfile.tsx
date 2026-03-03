import React, { useState } from 'react';
import { User, Mail, Lock, Edit2, Save, X, Shield, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudit } from '../hooks/useAudit';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { logs: recentActivity, fetchUserActivity } = useAudit();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    initials: user?.initials || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar actividad reciente al montar
  React.useEffect(() => {
    if (user) {
      fetchUserActivity(user.id, 10);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setError(null);
      // Aquí iría la llamada al servicio para actualizar el perfil
      // await updateUserProfile(user!.id, formData);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setError(null);
      // Aquí iría la llamada para cambiar contraseña
      // await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Contraseña cambiada correctamente');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      GERENTE: 'Gerente',
      TECNICO: 'Técnico',
      ALIADO: 'Aliado',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
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
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No hay usuario autenticado</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6" />
          Mi Perfil
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar Perfil
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Información del Usuario */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Información Personal
          </h3>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Iniciales
                </label>
                <input
                  type="text"
                  value={formData.initials}
                  onChange={e =>
                    setFormData({ ...formData, initials: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 uppercase"
                  maxLength={5}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user.name, initials: user.initials });
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${getRoleColor(user.role)}`}
                >
                  {user.initials}
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-white">
                    {user.name}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Email</div>
                    <div className="text-slate-900 dark:text-slate-200">{user.email}</div>
                  </div>
                </div>

                {user.aliadoId && (
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm text-slate-500">Organización</div>
                      <div className="text-slate-900 dark:text-slate-200">{user.aliadoId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Seguridad */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Seguridad
          </h3>

          {showPasswordForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Cambiar Contraseña
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">Contraseña</div>
                  <div className="text-sm text-slate-500">Último cambio: hace 30 días</div>
                </div>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  Cambiar
                </button>
              </div>

              <div className="pt-4">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Actividad Reciente
        </h3>

        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No hay actividad reciente</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString('es-CO')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {log.entityType}: {log.entityId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
