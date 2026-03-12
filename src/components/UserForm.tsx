import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Building2, AlertCircle } from 'lucide-react';
import { User as UserType, Role } from '../types';

interface UserFormProps {
  user?: UserType | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  error?: string | null;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, error }) => {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'TECNICO' as Role,
    initials: '',
    aliadoId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // No mostrar contraseña actual
        name: user.name,
        role: user.role,
        initials: user.initials,
        aliadoId: user.aliadoId || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!isEditing && !formData.email) {
      errors.email = 'El email es requerido';
    } else if (!isEditing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!isEditing && !formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (!isEditing && formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.name) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.initials) {
      errors.initials = 'Las iniciales son requeridas';
    } else if (formData.initials.length > 5) {
      errors.initials = 'Máximo 5 caracteres';
    }

    if (formData.role === 'ALIADO' && !formData.aliadoId) {
      errors.aliadoId = 'El ID de aliado es requerido para usuarios ALIADO';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const submitData = isEditing
        ? {
            name: formData.name,
            initials: formData.initials,
            role: formData.role,
            aliadoId: formData.aliadoId || null,
          }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            initials: formData.initials,
            aliadoId: formData.aliadoId || undefined,
          };

      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-generar iniciales desde el nombre
  useEffect(() => {
    if (!isEditing && formData.name && !formData.initials) {
      const words = formData.name.split(' ').filter(w => w.length > 0);
      const initials = words
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      setFormData(prev => ({ ...prev, initials }));
    }
  }, [formData.name, isEditing]);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error general */}
      {(error || Object.keys(formErrors).length > 0) && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">{error || 'Por favor corrija los errores en el formulario'}</div>
        </div>
      )}

      {/* Email */}
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 ${
                formErrors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="usuario@softseguros.com"
            />
          </div>
          {formErrors.email && <p className="mt-1 text-xs text-rose-600">{formErrors.email}</p>}
        </div>
      )}

      {/* Contraseña */}
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 ${
                formErrors.password
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          {formErrors.password && (
            <p className="mt-1 text-xs text-rose-600">{formErrors.password}</p>
          )}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nombre Completo
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 ${
              formErrors.name
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="Nombre Apellido"
          />
        </div>
        {formErrors.name && <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>}
      </div>

      {/* Iniciales */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Iniciales
        </label>
        <input
          type="text"
          value={formData.initials}
          onChange={e => handleChange('initials', e.target.value.toUpperCase())}
          className={`w-full px-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 uppercase ${
            formErrors.initials
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="NA"
          maxLength={5}
        />
        {formErrors.initials && <p className="mt-1 text-xs text-rose-600">{formErrors.initials}</p>}
      </div>

      {/* Rol */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Rol
        </label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={formData.role}
            onChange={e => handleChange('role', e.target.value as Role)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200"
          >
            <option value="ADMIN">Administrador</option>
            <option value="GERENTE">Gerente</option>
            <option value="TECNICO">Técnico</option>
            <option value="ALIADO">Aliado</option>
          </select>
        </div>
      </div>

      {/* Aliado ID (solo para rol ALIADO) */}
      {formData.role === 'ALIADO' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ID de Aliado
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.aliadoId}
              onChange={e => handleChange('aliadoId', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 ${
                formErrors.aliadoId
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Nombre de la aseguradora"
            />
          </div>
          {formErrors.aliadoId && (
            <p className="mt-1 text-xs text-rose-600">{formErrors.aliadoId}</p>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
