import React from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import type { ReportFilters as ReportFiltersType, DateRangePreset } from '../../../types/reports';
import { DATE_RANGE_PRESETS } from '../../../constants/reports';

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
  filterOptions: {
    ramo: string[];
    aseguradora: string[];
    tecnico: string[];
  };
  showDateRange?: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onFiltersChange,
  filterOptions,
  showDateRange = true,
}) => {
  const handleDatePresetChange = (preset: DateRangePreset) => {
    let start: Date;
    let end: Date = new Date();

    switch (preset) {
      case 'this-month':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      case 'last-month':
        end = new Date(end.getFullYear(), end.getMonth(), 0);
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      case 'this-quarter':
        const quarter = Math.floor(end.getMonth() / 3);
        start = new Date(end.getFullYear(), quarter * 3, 1);
        break;
      case 'last-quarter':
        const lastQuarter = Math.floor(end.getMonth() / 3) - 1;
        const year = lastQuarter < 0 ? end.getFullYear() - 1 : end.getFullYear();
        const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter;
        start = new Date(year, adjustedQuarter * 3, 1);
        end = new Date(year, adjustedQuarter * 3 + 3, 0);
        break;
      case 'this-year':
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case 'last-year':
        start = new Date(end.getFullYear() - 1, 0, 1);
        end = new Date(end.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        // Keep existing range or default to last 30 days
        start = filters.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        end = filters.dateRange?.end || new Date();
        break;
      default:
        start = new Date(end.getFullYear(), end.getMonth(), 1);
    }

    onFiltersChange({
      ...filters,
      datePreset: preset,
      dateRange: { start, end },
    });
  };

  const handleMultiSelectChange = (field: keyof ReportFiltersType, value: string) => {
    const currentValues = filters[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [field]: newValues,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: null,
      datePreset: 'this-month',
      ramo: [],
      aseguradora: [],
      tecnico: [],
      estado: [],
    });
  };

  const hasActiveFilters =
    filters.ramo.length > 0 ||
    filters.aseguradora.length > 0 ||
    filters.tecnico.length > 0 ||
    filters.estado.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4" />
          <span className="font-bold text-sm uppercase tracking-wide">Filtros</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium ps-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/10"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        {showDateRange && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Periodo</label>
            <select
              value={filters.datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value as DateRangePreset)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm
                         text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {DATE_RANGE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ramo */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Ramo</label>
          <select
            multiple
            value={filters.ramo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const options = Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
              onFiltersChange({ ...filters, ramo: options });
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm
                       text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       min-h-[38px]"
          >
            {filterOptions.ramo.map((ramo) => (
              <option key={ramo} value={ramo}>{ramo}</option>
            ))}
          </select>
          {filters.ramo.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium ml-1">{filters.ramo.length} seleccionado(s)</span>
          )}
        </div>

        {/* Aseguradora */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Aseguradora</label>
          <select
            multiple
            value={filters.aseguradora}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const options = Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
              onFiltersChange({ ...filters, aseguradora: options });
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm
                       text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       min-h-[38px]"
          >
            {filterOptions.aseguradora.map((aseguradora) => (
              <option key={aseguradora} value={aseguradora}>{aseguradora}</option>
            ))}
          </select>
          {filters.aseguradora.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium ml-1">{filters.aseguradora.length} seleccionada(s)</span>
          )}
        </div>

        {/* Técnico */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Técnico</label>
          <select
            multiple
            value={filters.tecnico}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const options = Array.from(e.target.selectedOptions).map((o: HTMLOptionElement) => o.value);
              onFiltersChange({ ...filters, tecnico: options });
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm
                       text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       min-h-[38px]"
          >
            {filterOptions.tecnico.map((tecnico) => (
              <option key={tecnico} value={tecnico}>{tecnico}</option>
            ))}
          </select>
          {filters.tecnico.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium ml-1">{filters.tecnico.length} seleccionado(s)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
