import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import TablaPrescripcion from './TablaPrescripcion';
import { useClaims } from '../../../context/ClaimsContext';
import { usePrescripcionRiesgo } from '../../../hooks/reports/usePrescripcionRiesgo';
import type { ReportFilters as ReportFiltersType, RiesgoPrescripcion } from '../../../types/reports';
import type { ExportOptions } from '../../../types/reports';

interface ReportePrescripcionProps {
  onBack: () => void;
}

const ReportePrescripcion: React.FC<ReportePrescripcionProps> = ({ onBack }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  const [riesgoFilter, setRiesgoFilter] = useState<RiesgoPrescripcion | 'todos'>('todos');

  // Get filter options
  const filterOptions = useMemo(() => ({
    ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
    aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
    tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
  }), [claims]);

  // Calculate prescription risks
  const riesgosData = usePrescripcionRiesgo(claims);

  // Filter by risk level and other filters
  const filteredData = useMemo(() => {
    return riesgosData.filter((item) => {
      // Risk filter
      if (riesgoFilter !== 'todos' && item.nivelRiesgo !== riesgoFilter) return false;

      // Other filters
      if (filters.ramo.length > 0 && !filters.ramo.includes(item.claim.ramo)) return false;
      if (filters.aseguradora.length > 0 && !filters.aseguradora.includes(item.claim.aseguradora)) return false;
      if (filters.tecnico.length > 0 && !filters.tecnico.includes(item.claim.tecnico_asignado)) return false;

      return true;
    });
  }, [riesgosData, riesgoFilter, filters]);

  // Statistics
  const stats = useMemo(() => {
    return {
      alto: riesgosData.filter((r) => r.nivelRiesgo === 'alto').length,
      medio: riesgosData.filter((r) => r.nivelRiesgo === 'medio').length,
      bajo: riesgosData.filter((r) => r.nivelRiesgo === 'bajo').length,
    };
  }, [riesgosData]);

  const handleExportExcel = (options: ExportOptions) => {
    console.log('Export Excel:', options);
  };

  const handleExportPDF = (options: ExportOptions) => {
    console.log('Export PDF:', options);
  };

  return (
    <ReportLayout
      title="Reporte Crítico de Prescripción"
      description="Casos próximos a prescribir con alertas de riesgo"
      onBack={onBack}
      actions={
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      }
    >
      <div className="space-y-6">
        {/* Risk Level Stats */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'alto' ? 'todos' : 'alto')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${riesgoFilter === 'alto'
                ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-slate-700/50'
              }`}
          >
            <div className="text-3xl mb-1">🔴</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.alto}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Alto Riesgo</div>
          </button>

          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'medio' ? 'todos' : 'medio')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${riesgoFilter === 'medio'
                ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-slate-700/50'
              }`}
          >
            <div className="text-3xl mb-1">🟡</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.medio}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Riesgo Medio</div>
          </button>

          <button
            onClick={() => setRiesgoFilter(riesgoFilter === 'bajo' ? 'todos' : 'bajo')}
            className={`p-4 rounded-xl border-2 transition-all shadow-sm ${riesgoFilter === 'bajo'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-slate-700/50'
              }`}
          >
            <div className="text-3xl mb-1">🟢</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.bajo}</div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Bajo Riesgo</div>
          </button>
        </div>

        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          showDateRange={false}
        />

        <TablaPrescripcion data={filteredData} />
      </div>
    </ReportLayout>
  );
};

export default ReportePrescripcion;
