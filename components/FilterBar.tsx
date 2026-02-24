import React, { memo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useClaims } from '../context/ClaimsContext';
import { useFilterOptions } from '../hooks/useFilters';

const FilterBar: React.FC = () => {
  const { filters, setFilters, claims } = useClaims();

  // Opciones de filtros memoizadas
  const options = useFilterOptions(claims);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchTerm: e.target.value });
  };

  const toggleFilter = (key: keyof typeof filters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated });
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      ramo: [],
      aseguradora: [],
      estado: [],
      poliza: [],
      aliado: [],
    });
  };

  const hasActiveFilters =
    filters.ramo.length > 0 ||
    filters.aseguradora.length > 0 ||
    filters.estado.length > 0 ||
    filters.poliza.length > 0 ||
    filters.searchTerm;

  return (
    <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 py-4 mb-6 -mx-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por Siniestro, Póliza, Placa, Asegurado..."
            value={filters.searchTerm}
            onChange={handleSearch}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center text-slate-500 text-xs uppercase tracking-wider font-bold mr-2">
            <Filter className="w-3 h-3 mr-1" /> Filtros:
          </div>

          <FilterDropdown
            title="Número de Póliza"
            options={options.polizas}
            selected={filters.poliza}
            onToggle={value => toggleFilter('poliza', value)}
          />
          <FilterDropdown
            title="Ramo"
            options={options.ramos}
            selected={filters.ramo}
            onToggle={value => toggleFilter('ramo', value)}
          />
          <FilterDropdown
            title="Aseguradora"
            options={options.aseguradoras}
            selected={filters.aseguradora}
            onToggle={value => toggleFilter('aseguradora', value)}
          />
          <FilterDropdown
            title="Estado"
            options={options.estados}
            selected={filters.estado}
            onToggle={value => toggleFilter('estado', value)}
          />

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-xs text-rose-400 hover:text-rose-300 flex items-center hover:underline"
            >
              <X className="w-3 h-3 mr-0.5" /> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface FilterDropdownProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = memo(
  ({ title, options, selected, onToggle }) => {
    return (
      <div className="relative group">
        <button
          className={`flex items-center space-x-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            selected.length > 0
              ? 'bg-blue-600/10 dark:bg-blue-900/30 border-blue-600/30 dark:border-blue-500/50 text-blue-600 dark:text-blue-300'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>{title}</span>
          {selected.length > 0 && (
            <span className="bg-blue-500 text-white text-[9px] px-1 rounded-full">
              {selected.length}
            </span>
          )}
        </button>

        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 hidden group-hover:block z-50">
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {options.map(opt => (
              <label
                key={opt}
                className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onToggle(opt)}
                  className="rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-blue-600 dark:text-blue-500 focus:ring-0"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

FilterDropdown.displayName = 'FilterDropdown';

export default memo(FilterBar);
