import React, { useState, useMemo } from 'react';
import ReportLayout from '../common/ReportLayout';
import ReportFilters from '../common/ReportFilters';
import ExportButtons from '../common/ExportButtons';
import TiemposPorFase from './TiemposPorFase';
import { useClaims } from '../../../context/ClaimsContext';
import { useTiemposPromedio } from '../../../hooks/reports/useTiemposPromedio';
import type { ReportFilters as ReportFiltersType } from '../../../types/reports';
import type { ExportOptions } from '../../../types/reports';

interface MetricasTiempoProps {
  onBack: () => void;
}

const MetricasTiempo: React.FC<MetricasTiempoProps> = ({ onBack }) => {
  const { claims } = useClaims();

  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: null,
    datePreset: 'this-month',
    ramo: [],
    aseguradora: [],
    tecnico: [],
    estado: [],
  });

  // Get filter options
  const filterOptions = useMemo(() => ({
    ramo: [...new Set(claims.map(c => c.ramo))].filter(Boolean).sort(),
    aseguradora: [...new Set(claims.map(c => c.aseguradora))].filter(Boolean).sort(),
    tecnico: [...new Set(claims.map(c => c.tecnico_asignado))].filter(Boolean).sort(),
  }), [claims]);

  // Calculate time metrics
  const tiempos = useTiemposPromedio(claims, filters);

  const handleExportExcel = (options: ExportOptions) => {
    console.log('Export Excel:', options);
  };

  const handleExportPDF = (options: ExportOptions) => {
    console.log('Export PDF:', options);
  };

  return (
    <ReportLayout
      title="Métricas de Tiempo"
      description="Análisis de tiempos de gestión por fase y dimensión"
      onBack={onBack}
      actions={
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />
      }
    >
      <div className="space-y-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
        />

        {/* General Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Tiempo Promedio General</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {Math.round(tiempos.general)} días
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Mejor Aseguradora</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {tiempos.porAseguradora.length > 0 ? tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.aseguradora : '-'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tiempos.porAseguradora.length > 0 ? `${Math.round(tiempos.porAseguradora[tiempos.porAseguradora.length - 1]?.tiempo)} días` : ''}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Peor Aseguradora</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {tiempos.porAseguradora.length > 0 ? tiempos.porAseguradora[0]?.aseguradora : '-'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tiempos.porAseguradora.length > 0 ? `${Math.round(tiempos.porAseguradora[0]?.tiempo)} días` : ''}
            </p>
          </div>
        </div>

        <TiemposPorFase claims={claims} />

        {/* Tables by dimension */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Por Aseguradora</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aseguradora</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Prom.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Casos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tiempos.porAseguradora.map((item) => (
                    <tr key={item.aseguradora} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">{item.aseguradora}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tiempo > 45 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                          {Math.round(item.tiempo)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Por Ramo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ramo</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Prom.</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Casos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {tiempos.porRamo.map((item) => (
                    <tr key={item.ramo} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium text-sm">{item.ramo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${item.tiempo > 45 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                          }`}>
                          {Math.round(item.tiempo)} días
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default MetricasTiempo;
