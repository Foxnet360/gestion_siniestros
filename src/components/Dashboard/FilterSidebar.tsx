import React, { useState, useCallback } from 'react';
import { Filter, X, Calendar, DollarSign } from 'lucide-react';
import type { KPIFilters } from '../../types/sla-kpi';

interface FilterSidebarProps {
  filters: KPIFilters;
  onFiltersChange: (filters: KPIFilters) => void;
  loading?: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const FILTER_CONFIG: FilterOption[] = [
  { id: 'aseguradora', label: 'Aseguradora', type: 'text', placeholder: 'Buscar aseguradora...' },
  { id: 'asegurado', label: 'Asegurado', type: 'text', placeholder: 'Buscar asegurado...' },
  { id: 'ramo', label: 'Ramo', type: 'text', placeholder: 'Buscar ramo...' },
  { id: 'vendedor', label: 'Vendedor', type: 'text', placeholder: 'Buscar vendedor...' },
  {
    id: 'siniestroSS',
    label: 'N° Siniestro SS',
    type: 'text',
    placeholder: 'Número de siniestro...',
  },
  {
    id: 'siniestroCompania',
    label: 'N° Siniestro Compañía',
    type: 'text',
    placeholder: 'Número de siniestro...',
  },
];

/**
 * Filter Sidebar component for KPI Dashboard
 */
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localFilters, setLocalFilters] = useState<KPIFilters>(filters);

  const handleFilterChange = useCallback((key: string, value: string | number | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    const emptyFilters: KPIFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [onFiltersChange]);

  const hasActiveFilters = Object.values(localFilters).some(v => v !== undefined && v !== '');

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        <Filter className="w-6 h-6" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {Object.values(localFilters).filter(v => v !== undefined && v !== '').length}
          </span>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-700 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter fields */}
          <div className="space-y-4">
            {FILTER_CONFIG.map(filter => (
              <div key={filter.id}>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {filter.label}
                </label>
                <input
                  type="text"
                  value={localFilters[filter.id as keyof KPIFilters] || ''}
                  onChange={e => handleFilterChange(filter.id, e.target.value || undefined)}
                  placeholder={filter.placeholder}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            ))}

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Siniestro
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={localFilters.fechaDesde || ''}
                  onChange={e => handleFilterChange('fechaDesde', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <input
                  type="date"
                  value={localFilters.fechaHasta || ''}
                  onChange={e => handleFilterChange('fechaHasta', e.target.value || undefined)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Value range */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Indemnizado
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={localFilters.valorMin || ''}
                  onChange={e =>
                    handleFilterChange(
                      'valorMin',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Mín"
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <input
                  type="number"
                  value={localFilters.valorMax || ''}
                  onChange={e =>
                    handleFilterChange(
                      'valorMax',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Máx"
                  disabled={loading}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                {Object.values(localFilters).filter(v => v !== undefined && v !== '').length}{' '}
                filtro(s) activo(s)
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FilterSidebar;
