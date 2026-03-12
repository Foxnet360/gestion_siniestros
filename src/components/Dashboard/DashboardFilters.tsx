import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Filter, X, FileText } from 'lucide-react';
import { useDashboardFilters } from '../../context/DashboardFilters/DashboardFiltersContext';
import type { FilterState } from '../../types/dashboard';

interface DashboardFiltersProps {
  aseguradoras?: string[];
  ramos?: string[];
  vendedores?: string[];
}

const DateRangePicker: React.FC<{
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}> = ({ startDate, endDate, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const presets = [
    { label: 'Último mes', days: 30 },
    { label: 'Últimos 3 meses', days: 90 },
    { label: 'Último año', days: 365 },
    { label: 'Todo', days: null },
  ];

  const applyPreset = (days: number | null) => {
    if (days === null) {
      onChange(null, null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      onChange(start, end);
    }
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        <Calendar size={16} />
        <span className="text-sm">FECHA</span>
        <ChevronDown
          size={16}
          className={`transform transition-transform ${showPicker ? 'rotate-180' : ''}`}
        />
      </button>

      {showPicker && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 min-w-[250px] z-50">
          <div className="space-y-2 mb-4">
            {presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <label className="block text-xs text-slate-400 dark:text-slate-500 mb-2">Rango personalizado</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate?.toISOString().split('T')[0] || ''}
                onChange={e => onChange(e.target.valueAsDate, endDate)}
                className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200"
              />
              <input
                type="date"
                value={endDate?.toISOString().split('T')[0] || ''}
                onChange={e => onChange(startDate, e.target.valueAsDate)}
                className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MultiSelectDropdown: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        <span className="text-sm">{label}</span>
        {selected.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 min-w-[200px] max-h-[300px] overflow-y-auto z-50">
            {options.map(option => (
              <label
                key={option}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700"
                />
                {option}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SingleSelectDropdown: React.FC<{
  label: string;
  options: string[];
  selected: string | null;
  onChange: (selected: string | null) => void;
}> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        <span className="text-sm truncate max-w-[150px]">{selected || label}</span>
        <ChevronDown
          size={16}
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 min-w-[200px] max-h-[300px] overflow-y-auto z-50">
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selected === null
                  ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Todas
            </button>
            {options.map(option => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  selected === option
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface DashboardFiltersProps {
  aseguradoras?: string[];
  ramos?: string[];
  vendedores?: string[];
  tecnicos?: string[];
  asegurados?: string[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  aseguradoras = ['Allianz', 'AXA', 'Sura', 'Liberty', 'Mapfre', 'Bolivar'],
  ramos = ['Automóvil', 'Empresas', 'Automas', 'Espacias', 'Hogar', 'Vida'],
  vendedores = ['Juan Pérez', 'María López', 'Carlos Ruiz', 'Ana Martínez', 'Pedro Gómez'],
  tecnicos = [],
  asegurados = [],
}) => {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    const count = [
      filters.aseguradora,
      filters.ramo.length > 0,
      filters.vendedor,
      filters.tecnico,
      filters.asegurado,
      filters.dateRange.start || filters.dateRange.end,
    ].filter(Boolean).length;
    setActiveFiltersCount(count);

    // Persist to localStorage
    localStorage.setItem('dashboardFilters', JSON.stringify(filters));
  }, [filters]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboardFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dateRange.start) parsed.dateRange.start = new Date(parsed.dateRange.start);
        if (parsed.dateRange.end) parsed.dateRange.end = new Date(parsed.dateRange.end);
        // We don't have setFilters, so we'll skip restoring for now
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
  }, []);

  const handleGenerateReport = () => {
    console.log('Generating report with filters:', filters);
    // TODO: Implement report generation
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 transition-colors duration-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Filter size={18} />
          <span className="text-sm font-medium">FILTROS</span>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        <SingleSelectDropdown
          label="ASEGURADORA"
          options={aseguradoras}
          selected={filters.aseguradora}
          onChange={value => updateFilter('aseguradora', value)}
        />

        <MultiSelectDropdown
          label="RAMO"
          options={ramos}
          selected={filters.ramo}
          onChange={value => updateFilter('ramo', value)}
        />

        <SingleSelectDropdown
          label="VENDEDOR"
          options={vendedores}
          selected={filters.vendedor}
          onChange={value => updateFilter('vendedor', value)}
        />

        <SingleSelectDropdown
          label="TÉCNICO"
          options={tecnicos}
          selected={filters.tecnico}
          onChange={value => updateFilter('tecnico', value)}
        />

        <SingleSelectDropdown
          label="ASEGURADO"
          options={asegurados}
          selected={filters.asegurado}
          onChange={value => updateFilter('asegurado', value)}
        />

        <DateRangePicker
          startDate={filters.dateRange.start}
          endDate={filters.dateRange.end}
          onChange={(start, end) => updateFilter('dateRange', { start, end })}
        />

        <div className="flex-1" />

        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X size={14} />
            Limpiar filtros ({activeFiltersCount})
          </button>
        )}

        <button
          onClick={handleGenerateReport}
          className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg transition-colors"
        >
          <FileText size={18} />
          GENERAR REPORTE
        </button>
      </div>
    </div>
  );
};
