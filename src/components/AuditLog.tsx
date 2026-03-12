import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';
import { useUsers } from '../hooks/useUsers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AuditLog: React.FC = () => {
  const { logs, total, isLoading, error, page, pageSize, fetchLogs, exportToCSV, setPage } =
    useAudit();

  const { users, fetchUsers } = useUsers();

  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const activeFilters: Parameters<typeof fetchLogs>[0] = {};

    if (filters.userId) activeFilters.userId = filters.userId;
    if (filters.action) activeFilters.action = filters.action;
    if (filters.entityType) activeFilters.entityType = filters.entityType;
    if (filters.startDate) activeFilters.startDate = filters.startDate;
    if (filters.endDate) activeFilters.endDate = filters.endDate;

    fetchLogs(activeFilters);
  };

  const handleExport = async () => {
    try {
      const csv = await exportToCSV(filters);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting logs:', err);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      DELETE: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      LOGIN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
      LOGOUT: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
      ASSIGN_TECNICO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return colors[action] || 'bg-slate-100 text-slate-800';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Logs de Auditoría
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Registro de todas las acciones realizadas en el sistema
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Usuario
              </label>
              <select
                value={filters.userId}
                onChange={e => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              >
                <option value="">Todos los usuarios</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Acción
              </label>
              <select
                value={filters.action}
                onChange={e => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              >
                <option value="">Todas las acciones</option>
                <option value="CREATE">Crear</option>
                <option value="UPDATE">Actualizar</option>
                <option value="DELETE">Eliminar</option>
                <option value="LOGIN">Inicio de sesión</option>
                <option value="LOGOUT">Cierre de sesión</option>
                <option value="ASSIGN_TECNICO">Asignar técnico</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Entidad
              </label>
              <select
                value={filters.entityType}
                onChange={e => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              >
                <option value="">Todas las entidades</option>
                <option value="claim">Siniestro</option>
                <option value="user">Usuario</option>
                <option value="ingest">Ingesta</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Tabla de Logs */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-12 text-slate-500">No se encontraron registros</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Entidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-slate-200">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(log.createdAt), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-900 dark:text-slate-200">
                            {log.userName || 'Desconocido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-900 dark:text-slate-200">
                            {log.entityType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 ml-6">{log.entityId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500">
                  Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de{' '}
                  {total} registros
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
